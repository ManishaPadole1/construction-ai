import { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, OrthographicCamera, Grid, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
    Maximize2,
    Minimize2,
    RotateCcw,
    Eye,
    Layers,
    ZoomIn,
    ZoomOut,
    Move
} from 'lucide-react';
import { Button } from './ui/button';

// Room/Object Component
function Room3D({ data, isHighlighted, onClick, showLabel }) {
    const meshRef = useRef();
    const [hovered, setHovered] = useState(false);

    useFrame(() => {
        if (meshRef.current && (isHighlighted || hovered)) {
            meshRef.current.material.opacity = 0.9;
        } else if (meshRef.current) {
            meshRef.current.material.opacity = data.material?.opacity || 0.7;
        }
    });

    // Create geometry from vertices and faces
    const geometry = new THREE.BufferGeometry();

    if (data.geometry?.vertices && data.geometry?.faces) {
        const vertices = new Float32Array(data.geometry.vertices.flat());
        const indices = new Uint16Array(data.geometry.faces.flat());

        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        geometry.computeVertexNormals();

        // Debug: Log first render
        if (Math.random() < 0.1) { // Only log 10% to avoid spam
            console.log('🏠 Room3D Geometry:', {
                id: data.id,
                type: data.type,
                subtype: data.subtype,
                vertexCount: vertices.length / 3,
                faceCount: indices.length / 3,
                firstVertex: data.geometry.vertices[0],
                label: data.label
            });
        }
    }

    const color = data.material?.color || '#FFE5B4';
    const position = data.position || [0, 0, 0];

    return (
        <group position={position}>
            <mesh
                ref={meshRef}
                geometry={geometry}
                onClick={onClick}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <meshStandardMaterial
                    color={color}
                    transparent
                    opacity={data.material?.opacity || 0.7}
                    side={THREE.DoubleSide}
                    emissive={isHighlighted || hovered ? color : '#000000'}
                    emissiveIntensity={isHighlighted || hovered ? 0.3 : 0}
                />
            </mesh>

            {/* Room Label */}
            {(showLabel || hovered) && data.label && (() => {
                // Calculate center of the room from vertices
                const vertices = data.geometry?.vertices || [];
                if (vertices.length === 0) return null;

                let sumX = 0, sumY = 0, sumZ = 0;
                vertices.forEach(v => {
                    sumX += v[0];
                    sumY += v[1];
                    sumZ += v[2];
                });
                const centerX = sumX / vertices.length;
                const centerY = sumY / vertices.length;
                const centerZ = sumZ / vertices.length;

                return (
                    <Html position={[centerX, centerY + 0.5, centerZ]} center>
                        <div className="bg-black/80 text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap pointer-events-none shadow-lg">
                            {data.label}
                            {data.area && (
                                <div className="text-[10px] text-gray-300">
                                    {/* Convert mm² to m² if needed */}
                                    {(data.area > 1000 ? data.area / 1000000 : data.area).toFixed(1)} m²
                                </div>
                            )}
                        </div>
                    </Html>
                );
            })()}

            {/* Highlight outline */}
            {(isHighlighted || hovered) && (
                <lineSegments>
                    <edgesGeometry args={[geometry]} />
                    <lineBasicMaterial color={isHighlighted ? '#3B82F6' : '#10B981'} linewidth={2} />
                </lineSegments>
            )}
        </group>
    );
}

// Door Component
function Door3D({ data }) {
    const position = data.position || [0, 0, 0];
    const rotation = data.rotation || [0, 0, 0];

    return (
        <group position={position} rotation={rotation}>
            <mesh>
                <boxGeometry args={[0.1, 2.1, 1]} />
                <meshStandardMaterial color="#8B4513" transparent opacity={0.8} />
            </mesh>
        </group>
    );
}

// Equipment Component
function Equipment3D({ data }) {
    const position = data.position || [0, 0, 0];
    const [hovered, setHovered] = useState(false);

    return (
        <group position={position}>
            <mesh
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <boxGeometry args={[0.5, 0.5, 0.5]} />
                <meshStandardMaterial
                    color={data.color || '#FF6B6B'}
                    emissive={hovered ? '#FF6B6B' : '#000000'}
                    emissiveIntensity={hovered ? 0.5 : 0}
                />
            </mesh>

            {hovered && data.label && (
                <Html position={[0, 0.5, 0]} center>
                    <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold whitespace-nowrap pointer-events-none">
                        {data.label}
                    </div>
                </Html>
            )}
        </group>
    );
}

// Exit Marker Component
function ExitMarker3D({ data }) {
    const position = data.position || [0, 0, 0];
    const [hovered, setHovered] = useState(false);

    return (
        <group position={position}>
            <mesh
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
                <meshStandardMaterial
                    color="#22C55E"
                    emissive="#22C55E"
                    emissiveIntensity={hovered ? 0.8 : 0.3}
                />
            </mesh>

            <Html position={[0, 0.2, 0]} center>
                <div className={`text-white font-bold text-xs transition-all ${hovered ? 'scale-125' : ''}`}>
                    EXIT
                </div>
            </Html>
        </group>
    );
}

// Scene Component
function Scene3D({ modelData, highlightedRooms, showLabels, layerVisibility, onRoomClick }) {
    if (!modelData?.scenes || modelData.scenes.length === 0) {
        return null;
    }

    const scene = modelData.scenes[0];

    // Debug: Log scene data
    console.log('🎨 Scene3D Rendering:', {
        totalObjects: scene.objects?.length || 0,
        floors: scene.objects?.filter(o => o.subtype === 'floor').length || 0,
        walls: scene.objects?.filter(o => o.type === 'wall').length || 0,
        ceilings: scene.objects?.filter(o => o.subtype === 'ceiling').length || 0,
        cameras: Object.keys(modelData.cameras || {}),
        metadata: modelData.metadata
    });

    return (
        <>
            {/* Lighting - Adjusted for large coordinates */}
            <ambientLight intensity={0.8} />
            <directionalLight position={[100000, 100000, 50000]} intensity={1.0} castShadow />
            <directionalLight position={[-100000, -100000, -50000]} intensity={0.5} />
            <pointLight position={[0, 50000, 0]} intensity={0.8} />
            <hemisphereLight intensity={0.5} />

            {/* Grid */}
            <Grid
                args={[500000, 500000]}
                cellSize={1000}
                cellThickness={0.5}
                cellColor="#6B7280"
                sectionSize={10000}
                sectionThickness={1}
                sectionColor="#374151"
                fadeDistance={250000}
                fadeStrength={1}
                position={[0, -0.01, 0]}
            />

            {/* Rooms, Walls, and Ceilings */}
            {layerVisibility.rooms && scene.objects?.map((obj, idx) => {
                // Render all room-related objects: floors, walls, ceilings
                if (obj.type === 'room' || obj.type === 'wall') {
                    const isFloor = obj.subtype === 'floor' || (!obj.subtype && obj.type === 'room');
                    return (
                        <Room3D
                            key={obj.id || idx}
                            data={obj}
                            isHighlighted={isFloor && highlightedRooms.includes(obj.room_id || obj.id)}
                            onClick={isFloor ? () => onRoomClick(obj) : undefined}
                            showLabel={isFloor && showLabels}
                        />
                    );
                }
                return null;
            })}

            {/* Doors */}
            {layerVisibility.doors && scene.doors?.map((door, idx) => (
                <Door3D key={`door-${idx}`} data={door} />
            ))}

            {/* Equipment */}
            {layerVisibility.equipment && scene.equipment?.map((equip, idx) => (
                <Equipment3D key={`equip-${idx}`} data={equip} />
            ))}

            {/* Exits */}
            {layerVisibility.exits && scene.exits?.map((exit, idx) => (
                <ExitMarker3D key={`exit-${idx}`} data={exit} />
            ))}

            {/* Boundaries */}
            {layerVisibility.boundaries && scene.boundaries?.map((boundary, idx) => {
                if (boundary.points && boundary.points.length > 1) {
                    const points = boundary.points.map(p => new THREE.Vector3(p[0], p[1] || 0, p[2] || 0));
                    const curve = new THREE.CatmullRomCurve3(points);

                    return (
                        <line key={`boundary-${idx}`}>
                            <bufferGeometry>
                                <bufferAttribute
                                    attach="attributes-position"
                                    count={points.length}
                                    array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))}
                                    itemSize={3}
                                />
                            </bufferGeometry>
                            <lineBasicMaterial color="#EF4444" linewidth={2} />
                        </line>
                    );
                }
                return null;
            })}
        </>
    );
}

// Main 3D Viewer Component
export function Model3DViewer({ modelData, onRoomSelect }) {
    const [viewMode, setViewMode] = useState('isometric_45'); // isometric_45, isometric_top, front, side, perspective
    const [highlightedRooms, setHighlightedRooms] = useState([]);
    const [showLabels, setShowLabels] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [layerVisibility, setLayerVisibility] = useState({
        rooms: true,
        doors: true,
        equipment: true,
        exits: true,
        boundaries: true
    });

    const containerRef = useRef();

    // Calculate building bounds for proper camera positioning
    const buildingBounds = useMemo(() => {
        if (!modelData?.scenes?.[0]?.objects) {
            return { center: [0, 0, 0], size: 1000 };
        }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        modelData.scenes[0].objects.forEach(obj => {
            if (obj.geometry?.vertices) {
                obj.geometry.vertices.forEach(v => {
                    minX = Math.min(minX, v[0]);
                    maxX = Math.max(maxX, v[0]);
                    minY = Math.min(minY, v[1]);
                    maxY = Math.max(maxY, v[1]);
                    minZ = Math.min(minZ, v[2]);
                    maxZ = Math.max(maxZ, v[2]);
                });
            }
        });

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const centerZ = (minZ + maxZ) / 2;
        const sizeX = maxX - minX;
        const sizeY = maxY - minY;
        const sizeZ = maxZ - minZ;
        const maxSize = Math.max(sizeX, sizeY, sizeZ);

        console.log('🏗️ Building Bounds:', {
            center: [centerX, centerY, centerZ],
            size: [sizeX, sizeY, sizeZ],
            maxSize,
            min: [minX, minY, minZ],
            max: [maxX, maxY, maxZ]
        });

        return {
            center: [centerX, centerY, centerZ],
            size: maxSize
        };
    }, [modelData]);

    // Camera presets - Use backend cameras with proper targeting
    const cameraPresets = {
        isometric_45: modelData?.cameras?.isometric_45 || {
            position: [
                buildingBounds.center[0] + buildingBounds.size * 0.8,
                buildingBounds.center[1] + buildingBounds.size * 0.8,
                buildingBounds.center[2] + buildingBounds.size * 0.8
            ],
            target: buildingBounds.center,
            type: 'perspective',
            fov: 50
        },
        isometric_top: modelData?.cameras?.isometric_top || modelData?.cameras?.top || {
            position: [
                buildingBounds.center[0],
                buildingBounds.center[1] + buildingBounds.size * 1.5,
                buildingBounds.center[2]
            ],
            target: buildingBounds.center,
            type: 'orthographic',
            // Dynamic zoom: larger number = more zoomed in
            zoom: Math.max(1, Math.min(100, 500 / buildingBounds.size))
        },
        front: modelData?.cameras?.front || {
            position: [
                buildingBounds.center[0],
                buildingBounds.center[1] + buildingBounds.size * 0.5,
                buildingBounds.center[2] + buildingBounds.size * 1.5
            ],
            target: buildingBounds.center,
            type: 'orthographic',
            zoom: Math.max(1, Math.min(100, 500 / buildingBounds.size))
        },
        side: modelData?.cameras?.side || {
            position: [
                buildingBounds.center[0] + buildingBounds.size * 1.5,
                buildingBounds.center[1] + buildingBounds.size * 0.5,
                buildingBounds.center[2]
            ],
            target: buildingBounds.center,
            type: 'orthographic',
            zoom: Math.max(1, Math.min(100, 500 / buildingBounds.size))
        },
        perspective: {
            position: [
                buildingBounds.center[0] + buildingBounds.size * 0.7,
                buildingBounds.center[1] + buildingBounds.size * 0.5,
                buildingBounds.center[2] + buildingBounds.size * 0.7
            ],
            target: buildingBounds.center,
            type: 'perspective',
            fov: 50
        }
    };

    const currentCamera = cameraPresets[viewMode];

    // Debug camera settings
    console.log('📷 Camera Settings:', {
        viewMode,
        buildingSize: buildingBounds.size,
        calculatedZoom: currentCamera.zoom,
        position: currentCamera.position,
        target: currentCamera.target
    });

    // Debug: Log camera info
    console.log('📷 Current Camera:', {
        viewMode,
        position: currentCamera.position,
        target: currentCamera.target,
        type: currentCamera.type
    });

    const handleRoomClick = (room) => {
        setHighlightedRooms(prev =>
            prev.includes(room.id)
                ? prev.filter(id => id !== room.id)
                : [...prev, room.id]
        );

        if (onRoomSelect) {
            onRoomSelect(room);
        }
    };

    const toggleLayer = (layer) => {
        setLayerVisibility(prev => ({
            ...prev,
            [layer]: !prev[layer]
        }));
    };

    const resetView = () => {
        setViewMode('isometric_45');
        setHighlightedRooms([]);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    if (!modelData || !modelData.scenes || modelData.scenes.length === 0) {
        return (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl border-2 border-dashed border-slate-300 p-12 text-center">
                <div className="max-w-md mx-auto space-y-4">
                    <div className="w-20 h-20 mx-auto bg-slate-200 rounded-full flex items-center justify-center">
                        <Layers className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700">3D Model Not Available</h3>
                    <p className="text-sm text-slate-500">
                        The 3D model data is not yet available for this project.
                        Please ensure the DXF files have been processed with 3D geometry extraction enabled.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
                }`}
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Layers className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-lg">3D Building Model</h3>
                        <p className="text-white/80 text-xs">Interactive 3D Visualization</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleFullscreen}
                        className="text-white hover:bg-white/20"
                    >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-slate-50 border-b border-slate-200 p-3 flex flex-wrap items-center gap-2">
                {/* View Presets */}
                <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-slate-200">
                    <Button
                        variant={viewMode === 'isometric_45' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('isometric_45')}
                        className="text-xs h-8"
                    >
                        Isometric 45°
                    </Button>
                    <Button
                        variant={viewMode === 'isometric_top' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('isometric_top')}
                        className="text-xs h-8"
                    >
                        Top View
                    </Button>
                    <Button
                        variant={viewMode === 'front' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('front')}
                        className="text-xs h-8"
                    >
                        Front
                    </Button>
                    <Button
                        variant={viewMode === 'side' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('side')}
                        className="text-xs h-8"
                    >
                        Side
                    </Button>
                </div>

                {/* Layer Controls */}
                <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-slate-200">
                    {Object.entries(layerVisibility).map(([layer, visible]) => (
                        <Button
                            key={layer}
                            variant={visible ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => toggleLayer(layer)}
                            className="text-xs h-8 capitalize"
                        >
                            {layer}
                        </Button>
                    ))}
                </div>

                {/* Additional Controls */}
                <div className="flex items-center gap-1 ml-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowLabels(!showLabels)}
                        className="text-xs h-8"
                    >
                        <Eye className="w-4 h-4 mr-1" />
                        {showLabels ? 'Hide' : 'Show'} Labels
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetView}
                        className="text-xs h-8"
                    >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Reset
                    </Button>
                </div>
            </div>

            {/* 3D Canvas */}
            <div className={`bg-gradient-to-br from-slate-900 to-slate-800 ${isFullscreen ? 'h-[calc(100vh-140px)]' : 'h-[600px]'}`}>
                <Canvas
                    shadows
                    gl={{ antialias: true, alpha: true }}
                    dpr={[1, 2]}
                >
                    <Suspense fallback={null}>
                        {currentCamera.type === 'perspective' ? (
                            <PerspectiveCamera
                                makeDefault
                                position={currentCamera.position}
                                fov={currentCamera.fov || 50}
                                near={currentCamera.near || 0.1}
                                far={currentCamera.far || 10000000}
                            />
                        ) : (
                            <OrthographicCamera
                                makeDefault
                                position={currentCamera.position}
                                zoom={currentCamera.zoom || 0.01}
                                near={currentCamera.near || 0.1}
                                far={currentCamera.far || 10000000}
                            />
                        )}

                        <OrbitControls
                            target={currentCamera.target}
                            enableDamping
                            dampingFactor={0.05}
                            rotateSpeed={0.5}
                            zoomSpeed={1.2}
                            panSpeed={0.5}
                            minDistance={1}
                            maxDistance={5000000}
                        />

                        <Scene3D
                            modelData={modelData}
                            highlightedRooms={highlightedRooms}
                            showLabels={showLabels}
                            layerVisibility={layerVisibility}
                            onRoomClick={handleRoomClick}
                        />
                    </Suspense>
                </Canvas>
            </div>

            {/* Info Bar */}
            <div className="bg-slate-50 border-t border-slate-200 p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                    <span className="text-slate-600">
                        <strong>Floors:</strong> {modelData.metadata?.floor_count || 1}
                    </span>
                    <span className="text-slate-600">
                        <strong>Height:</strong> {modelData.metadata?.building_height || 'N/A'} m
                    </span>
                    <span className="text-slate-600">
                        <strong>Scale:</strong> 1:{modelData.metadata?.scale || 1}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-semibold">
                        {highlightedRooms.length} Selected
                    </span>
                </div>
            </div>
        </div>
    );
}
