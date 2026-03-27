import { useState } from 'react';
import { Model3DViewer } from './Model3DViewer';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

/**
 * Example component showing how to integrate 3D viewer with compliance data
 * This demonstrates the full workflow of selecting rooms and showing their compliance status
 */
export function ComplianceViewer3D({ modelData, complianceData }) {
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [highlightedIssues, setHighlightedIssues] = useState([]);

    // Get compliance status for a room
    const getRoomCompliance = (roomId) => {
        if (!complianceData?.room_compliance) return null;
        return complianceData.room_compliance[roomId];
    };

    // Handle room selection from 3D viewer
    const handleRoomSelect = (room) => {
        setSelectedRoom(room);

        // Get compliance data for this room
        const compliance = getRoomCompliance(room.id);

        // Highlight rooms with similar issues
        if (compliance?.issues) {
            const relatedRooms = Object.entries(complianceData.room_compliance || {})
                .filter(([id, data]) =>
                    data.issues?.some(issue =>
                        compliance.issues.includes(issue)
                    )
                )
                .map(([id]) => id);

            setHighlightedIssues(relatedRooms);
        }
    };

    // Get severity color
    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'text-red-600 bg-red-50 border-red-200';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const roomCompliance = selectedRoom ? getRoomCompliance(selectedRoom.id) : null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 3D Viewer - Takes 2 columns */}
            <div className="lg:col-span-2">
                <Model3DViewer
                    modelData={modelData}
                    onRoomSelect={handleRoomSelect}
                />
            </div>

            {/* Compliance Details Panel - Takes 1 column */}
            <div className="space-y-4">
                {/* Room Info Card */}
                {selectedRoom ? (
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 space-y-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{selectedRoom.label}</h3>
                                <p className="text-sm text-slate-500">Room ID: {selectedRoom.id}</p>
                            </div>
                            {roomCompliance?.status && (
                                <div className="flex items-center gap-2">
                                    {roomCompliance.status === 'compliant' ? (
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    ) : (
                                        <XCircle className="w-6 h-6 text-red-600" />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Room Details */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-xs text-slate-500 mb-1">Area</p>
                                <p className="text-lg font-bold text-slate-900">
                                    {selectedRoom.area?.toFixed(1)} m²
                                </p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3">
                                <p className="text-xs text-slate-500 mb-1">Type</p>
                                <p className="text-lg font-bold text-slate-900 capitalize">
                                    {roomCompliance?.room_type || 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Compliance Status */}
                        {roomCompliance && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-slate-900">Compliance Status</h4>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roomCompliance.status === 'compliant'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                        }`}>
                                        {roomCompliance.status === 'compliant' ? 'Compliant' : 'Non-Compliant'}
                                    </span>
                                </div>

                                {/* Issues List */}
                                {roomCompliance.issues && roomCompliance.issues.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-slate-700">Issues Found:</p>
                                        {roomCompliance.issues.map((issue, idx) => (
                                            <div
                                                key={idx}
                                                className={`p-3 rounded-lg border ${getSeverityColor(issue.severity)}`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="text-xs font-semibold">{issue.rule_id}</p>
                                                        <p className="text-xs mt-1">{issue.description}</p>
                                                        {issue.suggested_fix && (
                                                            <p className="text-xs mt-2 italic opacity-80">
                                                                💡 {issue.suggested_fix}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Requirements */}
                                {roomCompliance.requirements && (
                                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                        <p className="text-xs font-semibold text-blue-900 mb-2">Requirements:</p>
                                        <ul className="space-y-1">
                                            {roomCompliance.requirements.map((req, idx) => (
                                                <li key={idx} className="text-xs text-blue-700 flex items-start gap-2">
                                                    <span className="text-blue-400">•</span>
                                                    <span>{req}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {!roomCompliance && (
                            <div className="text-center py-6 text-slate-400 text-sm">
                                No compliance data available for this room
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center">
                        <div className="w-16 h-16 mx-auto bg-slate-200 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-2">No Room Selected</h3>
                        <p className="text-sm text-slate-500">
                            Click on a room in the 3D viewer to see its compliance details
                        </p>
                    </div>
                )}

                {/* Summary Stats */}
                {complianceData?.summary && (
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 space-y-3">
                        <h4 className="font-semibold text-slate-900">Overall Summary</h4>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                <p className="text-xs text-green-600 mb-1">Compliant</p>
                                <p className="text-2xl font-bold text-green-700">
                                    {complianceData.summary.compliant_rooms || 0}
                                </p>
                            </div>
                            <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                                <p className="text-xs text-red-600 mb-1">Issues</p>
                                <p className="text-2xl font-bold text-red-700">
                                    {complianceData.summary.non_compliant_rooms || 0}
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-slate-500 mb-1">Compliance Score</p>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-full transition-all duration-500"
                                        style={{ width: `${complianceData.summary.compliance_percentage || 0}%` }}
                                    />
                                </div>
                                <span className="text-lg font-bold text-slate-900">
                                    {complianceData.summary.compliance_percentage || 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Example compliance data structure:
 * 
 * {
 *   room_compliance: {
 *     "room_1": {
 *       status: "compliant",
 *       room_type: "office",
 *       issues: [],
 *       requirements: ["Min area: 9m²", "Natural light required"]
 *     },
 *     "room_2": {
 *       status: "non_compliant",
 *       room_type: "bathroom",
 *       issues: [
 *         {
 *           rule_id: "DCD_EXIT_REDUNDANCY_01",
 *           severity: "high",
 *           description: "Room does not have access to 2 independent exits",
 *           suggested_fix: "Add corridor connection to secondary exit"
 *         }
 *       ],
 *       requirements: ["Min area: 3m²", "Ventilation required"]
 *     }
 *   },
 *   summary: {
 *     compliant_rooms: 8,
 *     non_compliant_rooms: 4,
 *     compliance_percentage: 67
 *   }
 * }
 */
