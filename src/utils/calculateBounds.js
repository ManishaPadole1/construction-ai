/**
 * Calculate bounding box and optimal camera position for 3D model
 * Handles large DXF coordinates automatically
 */

export function calculateModelBounds(modelData) {
  if (!modelData?.scenes?.[0]?.objects) {
    return null;
  }

  const objects = modelData.scenes[0].objects;
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;

  // Find bounding box from all vertices
  objects.forEach((obj) => {
    if (obj.geometry?.vertices) {
      obj.geometry.vertices.forEach((vertex) => {
        const [x, y, z] = vertex;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        minZ = Math.min(minZ, z);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        maxZ = Math.max(maxZ, z);
      });
    }
  });

  // Calculate center and size
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;

  const maxSize = Math.max(sizeX, sizeY, sizeZ);

  // Calculate optimal camera distance (1.5x the max dimension)
  const cameraDistance = maxSize * 1.5;

  console.log("📐 Model Bounds:", {
    center: [centerX, centerY, centerZ],
    size: [sizeX, sizeY, sizeZ],
    maxSize,
    cameraDistance,
    bounds: { minX, maxX, minY, maxY, minZ, maxZ },
  });

  return {
    center: [centerX, centerY, centerZ],
    size: [sizeX, sizeY, sizeZ],
    maxSize,
    cameraDistance,
    bounds: { minX, maxX, minY, maxY, minZ, maxZ },
  };
}

export function getOptimalCameraPosition(bounds, viewMode = "isometric_45") {
  if (!bounds) {
    return {
      position: [100, 100, 100],
      target: [0, 0, 0],
      type: "perspective",
    };
  }

  const { center, cameraDistance } = bounds;
  const [cx, cy, cz] = center;

  const cameras = {
    isometric_45: {
      position: [cx + cameraDistance * 0.7, cy + cameraDistance * 0.7, cz + cameraDistance * 0.7],
      target: center,
      type: "perspective",
      fov: 50,
    },
    isometric_top: {
      position: [cx, cy + cameraDistance, cz],
      target: center,
      type: "orthographic",
      zoom: 1 / (cameraDistance * 0.5),
    },
    top: {
      position: [cx, cy + cameraDistance, cz],
      target: center,
      type: "orthographic",
      zoom: 1 / (cameraDistance * 0.5),
    },
    front: {
      position: [cx, cy + cameraDistance * 0.3, cz + cameraDistance],
      target: center,
      type: "orthographic",
      zoom: 1 / (cameraDistance * 0.5),
    },
    side: {
      position: [cx + cameraDistance, cy + cameraDistance * 0.3, cz],
      target: center,
      type: "orthographic",
      zoom: 1 / (cameraDistance * 0.5),
    },
  };

  return cameras[viewMode] || cameras.isometric_45;
}
