/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react';
import {
    Building2,
    FileCheck2,
    AlertTriangle,
    Files,
    Sparkles,
    CheckCircle2,
    XCircle,
    ClipboardCheck,
    LayoutDashboard,
    ArrowRight,
    ChevronDown,
    Zap,
    Activity,
    Layers,
    Clock,
    Table2,
    Maximize2,
    FileText,

    Info,
    FileSpreadsheet,
    User
} from 'lucide-react';
import { Button } from './ui/button';

// 🔥 Authority Icon + Color Metadata
const authorityMeta = {
    DM: {
        label: "Dubai Municipality",
        color: "from-blue-500 to-indigo-600",
        icon: Building2
    },
    DEWA: {
        label: "Dubai Electricity & Water Authority",
        color: "from-emerald-500 to-teal-600",
        icon: Building2
    },
    DCD: {
        label: "Dubai Civil Defense",
        color: "from-red-500 to-orange-600",
        icon: Building2
    },
    RTA: {
        label: "Roads & Transport Authority",
        color: "from-violet-500 to-purple-600",
        icon: Building2
    },
    OTHER_AUTHORITIES: {
        label: "Other Authorities",
        color: "from-slate-500 to-slate-700",
        icon: Building2
    }
};

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "./ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

// Helper to format text with rounded numbers
const formatText = (text) => {
    if (!text) return text;
    return String(text).replace(/(\d+\.\d{3,})/g, (match) => {
        return parseFloat(match).toLocaleString(undefined, { maximumFractionDigits: 2 });
    });
};

const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(/[_\s]+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export function DewaRuleCheck({ aiResponseText, projectData, navigateTo }) {
    // 1. Add CSS for layout
    const layoutStyles = `
        .dewa-row-container {
            display: flex;
            flex-direction: column;
            gap: 2rem;
            width: 100%;
        }
        @media (min-width: 1024px) {
            .dewa-row-container {
                flex-direction: row;
                align-items: flex-start;
            }
            .dewa-col-30 {
                width: 30%;
                position: sticky;
                top: 2rem;
                height: fit-content;
            }
            .dewa-col-70 {
                width: 70%;
                flex-grow: 1;
            }
        }

        @keyframes tab-fade-in-scale {
            0% { opacity: 0; transform: translateY(10px) scale(0.98); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        .tab-content-active {
            animation: tab-fade-in-scale 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    // Parse logic
    const data = useMemo(() => {
        if (typeof aiResponseText === 'object' && aiResponseText !== null) return aiResponseText;
        try {
            return JSON.parse(aiResponseText);
        } catch (e) {
            return null;
        }
    }, [aiResponseText]);

    if (!data) return <div className="p-8 text-center text-slate-500">No analysis data available.</div>;

    const [activeTab, setActiveTab] = useState("lighting");

    // 🔍 Merge engine_result.ui_view with main data for unified targeting
    const memoizedData = useMemo(() => {
        // DEWA structure: engine_result[module].ui_view
        const uiView = data?.engine_result?.lighting?.ui_view ||
            data?.engine_result?.power?.ui_view ||
            data?.engine_result?.sld?.ui_view || {};

        return {
            ...data,
            ...uiView,
            // Ensure nested objects are properly prioritized
            feasibility_status: uiView.feasibility_status || data.feasibility_status,
            scoring: uiView.scoring || data.scoring,
            project_summary: uiView.project_summary || data.project_summary,
            required_parameter_changes: uiView.required_parameter_changes || data.required_parameter_changes,
            executive_dashboard: uiView.executive_dashboard || data.executive_dashboard,
            proposed_room_equipment: data.proposed_room_equipment || uiView.proposed_room_equipment,
            proposed_load_schedule_omitted: data.proposed_load_schedule_omitted,
            proposed_excel_comparison: data.proposed_excel_comparison,
            proposed_lighting_per_room: data.proposed_lighting_per_room,
            proposed_sockets_per_room: data.proposed_sockets_per_room,
            lighting_labels_snapshot: data.lighting_labels_snapshot,
            power_labels_snapshot: data.power_labels_snapshot,
            dewa_compliance_report: data.dewa_compliance_report
        };
    }, [data]);

    const {
        executive_dashboard,
        submission_roadmap,
        comparison_result,
        documents_to_submit,
        data_quality_checks,
        dewa_phase7_narrative,
        required_parameter_changes,
        engine_result,
        change_summary,
        proposed_rooms_summary,
        load_schedule_comparison,
        user_inputs_received,
        feasibility_status,
        proposed_room_equipment,
        proposed_load_schedule_omitted,
        proposed_excel_comparison,
        proposed_lighting_per_room,
        proposed_sockets_per_room,
        lighting_labels_snapshot,
        power_labels_snapshot,
        dewa_compliance_report
    } = memoizedData;

    // 🏷️ Dynamic Room Details Tabs
    const roomDetailTabs = useMemo(() => {
        const seenLabels = new Set();
        return Object.keys(memoizedData || {})
            .filter(key => key.endsWith('_per_room'))
            .map(key => {
                const dataArr = memoizedData[key];
                if (!Array.isArray(dataArr) || dataArr.length === 0) return null;

                const label = key.replace('proposed_', '').replace('_per_room', '').replace(/_/g, ' ').trim();
                const normalizedLabel = label.toLowerCase();

                if (seenLabels.has(normalizedLabel)) return null;
                seenLabels.add(normalizedLabel);

                // Pick icon/accent based on hints in the key, but keep it dynamic
                let icon = Layers;
                let accent = 'slate';
                if (key.toLowerCase().includes('lighting')) { icon = Zap; accent = 'blue'; }
                else if (key.toLowerCase().includes('socket') || key.toLowerCase().includes('power')) { icon = Activity; accent = 'emerald'; }

                return {
                    key: key,
                    label: label,
                    icon: icon,
                    data: dataArr,
                    accent: accent
                };
            })
            .filter(Boolean);
    }, [memoizedData]);

    // Dynamic Discrepancy Tabs
    const discrepancyTabs = useMemo(() => {
        const discrepancies = proposed_room_equipment?.comparison?.discrepancies;
        if (!discrepancies || !Array.isArray(discrepancies) || discrepancies.length === 0) return [];

        const grouped = {};
        discrepancies.forEach(item => {
            const cat = item.category || 'General';
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(item);
        });

        return Object.keys(grouped).map(key => {
            let icon = Layers;
            if (key.toLowerCase().includes('lighting')) icon = Zap;
            else if (key.toLowerCase().includes('power') || key.toLowerCase().includes('socket')) icon = Activity;

            return {
                key,
                label: key.charAt(0).toUpperCase() + key.slice(1),
                icon,
                data: grouped[key]
            };
        });
    }, [proposed_room_equipment]);

    // Detect Modules for Tabs (Fully Dynamic)
    const moduleTabs = useMemo(() => {
        if (!engine_result) return [];
        const seenLabels = new Set();
        return Object.keys(engine_result).map(key => {
            const data = engine_result[key];
            if (!data) return null;

            const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            if (seenLabels.has(label.toLowerCase())) return null;
            seenLabels.add(label.toLowerCase());

            let icon = Layers;
            if (key.toLowerCase().includes('lighting')) icon = Zap;
            else if (key.toLowerCase().includes('power') || key.toLowerCase().includes('load')) icon = Activity;

            return {
                key,
                label,
                icon,
                data
            };
        }).filter(Boolean);
    }, [engine_result]);

    // Parse Parameter Changes
    const paramChangesGrouped = useMemo(() => {
        if (!required_parameter_changes) return {};
        if (Array.isArray(required_parameter_changes)) {
            // If it's an array, we might want to group by permission_required if available
            const grouped = {};
            required_parameter_changes.forEach(change => {
                const auth = change.permission_required || "General";
                if (!grouped[auth]) grouped[auth] = [];
                grouped[auth].push(change);
            });
            return grouped;
        }
        return required_parameter_changes;
    }, [required_parameter_changes]);


    // Helper for Status Banner Style (Unified with AIAnalysis)
    const getFeasibilityStatusStyle = (status) => {
        const statusConfig = {
            'APPROVED': {
                label: 'Approved',
                background: 'linear-gradient(to right, rgb(34, 197, 94), rgb(16, 185, 129))', // Green
            },
            'FEASIBLE': {
                label: 'Feasible',
                background: 'linear-gradient(to right, rgb(34, 197, 94), rgb(16, 185, 129))', // Green
            },
            'REQUIRES_MODIFICATIONS': {
                label: 'Requires Modifications',
                background: 'linear-gradient(to right, rgb(249, 115, 22), rgb(245, 158, 11))', // Orange
            },
            'EXTRACT_ONLY': {
                label: 'Extract Only',
                background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(99, 102, 241))', // Blue/Indigo - informational
            },
            'REJECTED': {
                label: 'Rejected',
                background: 'linear-gradient(to right, rgb(239, 68, 68), rgb(244, 63, 94))', // Red
            }
        };

        return statusConfig[status] || {
            label: status || 'Unknown',
            background: 'linear-gradient(to right, rgb(239, 68, 68), rgb(244, 63, 94))' // Default Red
        };
    };

    const derived_feasibility_status = useMemo(() => {
        if (feasibility_status) return feasibility_status;
        if (!executive_dashboard) return null;

        let status = 'UNKNOWN';
        if (executive_dashboard.submission_ready) {
            status = 'APPROVED';
        } else if (executive_dashboard.blocking_issues > 0) {
            status = 'REQUIRES_MODIFICATIONS';
        } else {
            status = 'FEASIBLE';
        }

        return {
            status,
            message: executive_dashboard.confidence_level || 'System analysed documents based on DEWA rules.',
            detailed_message: dewa_phase7_narrative?.llm_narrative?.executive_summary || '',
            estimated_timeline_days: executive_dashboard.estimated_approval_time_days
        };
    }, [feasibility_status, executive_dashboard, dewa_phase7_narrative]);

    const statusStyle = getFeasibilityStatusStyle(derived_feasibility_status?.status);

    // 🔍 Mapping feasibility_status to AIAnalysis scoring format
    const scoringData = useMemo(() => {
        if (!derived_feasibility_status && !executive_dashboard) return null;
        const fs = derived_feasibility_status || {};
        const ed = executive_dashboard || {};
        return {
            compliance_score: {
                overall_score: fs.compliance_score ?? (ed.submission_ready ? 100 : 50),
                breakdown: {
                    passed: fs.passed_checks ?? 0,
                    failed: fs.modification_count ?? (ed.blocking_issues > 0 ? ed.blocking_issues : 0),
                    blocking_issues: ed.blocking_issues ?? 0
                }
            },
            approval_probability: {
                overall_probability: fs.approval_probability ?? (ed.submission_ready ? 0.9 : 0.4),
                confidence: ed.confidence_level?.split(' - ')[0] || "Medium",
                estimated_timeline_days: fs.estimated_timeline_days || ed.estimated_approval_time_days
            },
            readiness: {
                readiness_level: fs.readiness_level || (ed.submission_ready ? "Ready" : "Not Ready"),
                summary: {
                    blocking_issues_count: ed.blocking_issues ?? 0,
                    missing_documents_count: ed.documents_complete ? 0 : 5 // Fallback
                }
            }
        };
    }, [derived_feasibility_status, executive_dashboard]);

    const renderScoring = () => {
        if (!scoringData) return null;
        const { compliance_score, approval_probability, readiness } = scoringData;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Compliance Score */}
                {compliance_score && (
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all min-h-[160px] h-full flex flex-col justify-between">
                        <div className="relative z-10">
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Compliance Score</h3>
                            <div className="flex items-baseline gap-2 mb-3">
                                <span className={`text-4xl font-black ${compliance_score.overall_score >= 80 ? 'text-green-600' : compliance_score.overall_score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                    {compliance_score.overall_score}
                                </span>
                                <span className="text-slate-400 font-medium">/ 100</span>
                            </div>
                            {compliance_score.breakdown && (
                                <div className="space-y-1.5">
                                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-green-500 h-full" style={{ width: `${compliance_score.overall_score}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[10px] text-slate-500 font-medium pt-1">
                                        <span>Pass: {compliance_score.breakdown.passed}</span>
                                        <span>Fail: {compliance_score.breakdown.failed}</span>
                                        <span>Block: {compliance_score.breakdown.blocking_issues}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ position: 'absolute', bottom: '-15px', right: '-15px', opacity: 0.1, zIndex: 0, pointerEvents: 'none' }}>
                            <Sparkles className="text-blue-600" style={{ width: '100px', height: '100px' }} />
                        </div>
                    </div>
                )}

                {/* Approval Probability */}
                {approval_probability && (
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all min-h-[160px] h-full flex flex-col justify-between">
                        <div className="relative z-10">
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Approval Chance</h3>
                            <div className="flex items-baseline gap-2 mb-3">
                                <span className="text-4xl font-black text-slate-900">{(approval_probability.overall_probability * 100).toFixed(0)}%</span>
                                <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-600 font-bold">{approval_probability.confidence} Confidence</span>
                            </div>
                            {approval_probability.estimated_timeline_days && (
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 p-2 rounded-lg">
                                    <span className="text-lg">⏳</span>
                                    <span className="truncate">Est. <span className="text-slate-900 font-bold">{approval_probability.estimated_timeline_days} Days</span></span>
                                </div>
                            )}
                        </div>
                        <div style={{ position: 'absolute', bottom: '-15px', right: '-15px', opacity: 0.1, zIndex: 0, pointerEvents: 'none' }}>
                            <Building2 className="text-purple-600" style={{ width: '100px', height: '100px' }} />
                        </div>
                    </div>
                )}

                {/* Readiness Level */}
                {readiness && (
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all min-h-[160px] h-full flex flex-col justify-between">
                        <div className="relative z-10">
                            <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Readiness</h3>
                            <div className="mb-3">
                                <span className={`text-2xl font-black px-3 py-1 rounded-lg ${readiness.readiness_level === 'Ready' || readiness.readiness_level === 'High' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {readiness.readiness_level}
                                </span>
                            </div>
                            {readiness.summary && (
                                <div className="text-xs text-slate-600 space-y-1">
                                    <p>• {readiness.summary.blocking_issues_count} Blocking Issues</p>
                                    <p>• {readiness.summary.missing_documents_count} Missing Docs</p>
                                </div>
                            )}
                        </div>
                        <div style={{ position: 'absolute', bottom: '-15px', right: '-15px', opacity: 0.1, zIndex: 0, pointerEvents: 'none' }}>
                            <FileCheck2 className="text-emerald-600" style={{ width: '100px', height: '100px' }} />
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const projectSummaryData = memoizedData?.project_summary || data?.project_summary || {};
    const violationsCount = executive_dashboard?.total_violations || 0;
    const documentsCount = executive_dashboard?.total_documents || 0;
    const totalRooms = executive_dashboard?.total_rooms || 0;
    const thirdBoxValue = executive_dashboard?.confidence_level?.split(' - ')[0] || "N/A";

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-8 space-y-5 md:space-y-8 animate-in fade-in duration-500">

            <style>{layoutStyles}</style>


            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl text-slate-900 mb-1 sm:mb-2">DEWA Compliance Check</h1>
                <p className="text-slate-600 text-xs sm:text-sm md:text-base">
                    Automated Rule Verification & Gap Analysis
                </p>
            </div>

            {/* ---- FEASIBILITY STATUS (Unified UI) ---- */}
            {derived_feasibility_status && (
                <div
                    className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg text-white"
                    style={{
                        background: getFeasibilityStatusStyle(derived_feasibility_status.status).background
                    }}
                >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3 sm:mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                                <span className="text-xl sm:text-2xl">⚠️</span>
                            </div>
                            <div>
                                <h2 className="text-base sm:text-xl font-bold">Feasibility Status</h2>
                                <p className="text-white/80 text-xs">
                                    {derived_feasibility_status.message || `Analysis completed in ${derived_feasibility_status.estimated_timeline_days || '2-3'} seconds`}
                                </p>
                            </div>
                        </div>
                        <div className="px-3 sm:px-4 py-1.5 bg-white/20 rounded-full text-xs sm:text-sm font-semibold self-start sm:self-center">
                            {getFeasibilityStatusStyle(derived_feasibility_status.status).label}
                        </div>
                    </div>
                    {derived_feasibility_status.detailed_message && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 mt-2">
                            <p className="text-white text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                                {derived_feasibility_status.detailed_message}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ---- QUICK STATS (Unified AI Style) ---- */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-red-200">
                    <div className="flex items-center justify-between mb-1">
                        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                        <span className="text-xl sm:text-2xl font-bold text-red-700">{violationsCount}</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-red-600 font-medium">Violations</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-1">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        <span className="text-xl sm:text-2xl font-bold text-blue-700">{documentsCount}</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-blue-600 font-medium">Documents</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-purple-200">
                    <div className="flex items-center justify-between mb-1">
                        <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                        <span className="text-xl sm:text-2xl font-bold text-purple-700">{thirdBoxValue}</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-purple-600 font-medium">Confidence</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-1">
                        <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        <span className="text-xl sm:text-2xl font-bold text-green-700">{totalRooms}</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-green-600 font-medium">Total Rooms</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

                {/* ---------- LEFT PANEL ---------- */}
                <div className="lg:col-span-1 space-y-4 sm:space-y-6">



                    {/* Load Sources Summary */}
                    {((data_quality_checks?.load_sources_kw && Object.keys(data_quality_checks.load_sources_kw).length > 0) ||
                        (dewa_compliance_report?.source_reconciliation?.source_comparison && Object.keys(dewa_compliance_report.source_reconciliation.source_comparison).length > 0)) && (
                            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-3 sm:space-y-4">
                                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-amber-500" />
                                    Load Sources Summary (kW)
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(
                                        (data_quality_checks?.load_sources_kw && Object.keys(data_quality_checks.load_sources_kw).length > 0)
                                            ? data_quality_checks.load_sources_kw
                                            : dewa_compliance_report.source_reconciliation.source_comparison
                                    ).map(([key, val]) => (
                                        <div key={key} className="bg-slate-50 p-3 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors flex flex-col justify-between h-full min-h-[80px] group">
                                            <p className="text-xs text-slate-500 mb-1 capitalize">
                                                {key.replace(/_/g, ' ')}
                                            </p>
                                            <div className="text-lg font-bold text-slate-900 break-words mt-auto">
                                                {typeof val === 'number' ? val.toLocaleString(undefined, { maximumFractionDigits: 2 }) : val}
                                                <span className="text-[12px] text-slate-400 font-medium ml-1">kW</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                </div>

                {/* ---------- RIGHT PANEL ---------- */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">

                    {/* Executive Dashboard / Scoring */}
                    {renderScoring()}
                </div>
            </div>

            {/* Required Parameter Changes Table */}
            {Object.values(paramChangesGrouped).some(arr => Array.isArray(arr) && arr.length > 0) && (
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base sm:text-xl text-slate-900 font-bold">Required Parameter Changes</h2>
                    </div>

                    {Object.entries(paramChangesGrouped).map(([authority, changes]) => {
                        if (!Array.isArray(changes) || changes.length === 0) return null;

                        const meta = authorityMeta[authority] || {
                            label: authority,
                            color: "from-slate-500 to-slate-700",
                            icon: Building2
                        };

                        return (
                            <div key={authority} className="space-y-4">
                                {/* Authority Header */}
                                <div className={`bg-gradient-to-r ${meta.color} text-white px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 shadow-sm flex-wrap`}>
                                    <meta.icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm sm:text-lg">{authority}</span>
                                        <span className="text-xs sm:text-sm opacity-80 hidden sm:inline">- {meta.label}</span>
                                    </div>
                                    <span className="ml-auto px-2 sm:px-3 py-1 bg-white/20 rounded-full text-xs font-bold border border-white/10">
                                        {changes.length} {changes.length === 1 ? 'Change' : 'Changes'}
                                    </span>
                                </div>

                                {/* Table */}
                                <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm bg-white">
                                    <table className="w-full border-collapse min-w-[480px]">
                                        <thead>
                                            <tr className="bg-slate-50/80">
                                                <th className="text-left p-2 sm:p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Parameter</th>
                                                <th className="text-left p-2 sm:p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Current</th>
                                                <th className="text-left p-2 sm:p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Required</th>
                                                <th className="text-left p-2 sm:p-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Severity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {changes.map((change, idx) => {
                                                const severity = (change.severity || 'medium').toLowerCase();
                                                const severityConfig = {
                                                    critical: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
                                                    high: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
                                                    medium: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
                                                    low: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
                                                    info: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' }
                                                };
                                                const config = severityConfig[severity] || severityConfig.medium;

                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="p-4 border-b border-slate-50 last:border-0">
                                                            <div className="space-y-1.5">
                                                                <p className="text-sm text-slate-900 font-bold group-hover:text-indigo-600 transition-colors">{change.parameter || 'N/A'}</p>
                                                                {change.description && (
                                                                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{formatText(change.description)}</p>
                                                                )}
                                                                <p className="text-xs text-slate-400 font-medium tracking-tight">Rule: {change.rule_id}</p>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-sm text-slate-700 border-b border-slate-50 last:border-0 align-top">
                                                            {change.current !== undefined && change.current !== null ? formatText(change.current) : 'Data not available'}
                                                        </td>
                                                        <td className="p-4 text-sm text-slate-900 font-bold border-b border-slate-50 last:border-0 align-top">
                                                            {change.required !== undefined && change.required !== null ? formatText(change.required) : 'N/A'}
                                                        </td>
                                                        <td className="p-4 border-b border-slate-50 last:border-0 align-top">
                                                            <div className="flex flex-col gap-1.5">
                                                                <span
                                                                    className={`px-3 py-1 rounded-full font-bold border ${config.bg} ${config.text} ${config.border} shadow-sm w-fit uppercase tracking-wider`}
                                                                    style={{ fontSize: '10px' }}
                                                                >
                                                                    {severity}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* DEWA Compliance Report */}
            {dewa_compliance_report && (
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-4 text-slate-900 overflow-hidden relative">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-10 -mt-20 pointer-events-none"></div>

                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                            <FileCheck2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-wide">DEWA Validation & Compliance Report</h3>
                            <p className="text-xs text-slate-500 font-medium">{dewa_compliance_report.dewa_calculations?.power_factor ? 'Complete Assessment' : 'Pending Verification'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Submission Readiness */}
                        {dewa_compliance_report.submission_readiness && (
                            <div className={`p-4 rounded-xl border relative z-10 flex gap-4 items-center ${dewa_compliance_report.submission_readiness.ready ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${dewa_compliance_report.submission_readiness.ready ? 'bg-white border-emerald-300 text-emerald-600' : 'bg-white border-red-300 text-red-600'}`}>
                                    {dewa_compliance_report.submission_readiness.ready ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h4 className={`font-bold text-sm mb-1 ${dewa_compliance_report.submission_readiness.ready ? 'text-emerald-900' : 'text-red-900'}`}>
                                        {dewa_compliance_report.submission_readiness.ready ? 'Ready for DEWA Portal Submission' : 'Submission Blocked'}
                                    </h4>
                                    <p className={`text-xs ${dewa_compliance_report.submission_readiness.ready ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {dewa_compliance_report.submission_readiness.confidence}
                                    </p>
                                </div>
                                <div className="ml-auto flex flex-col items-center">
                                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Approval Est.</div>
                                    <div className="text-xl font-black text-indigo-700">{dewa_compliance_report.submission_readiness.estimated_approval_days} <span className="text-[10px] font-bold text-indigo-500 uppercase">Days</span></div>
                                </div>
                            </div>
                        )}

                        {/* Blocking Issues Summary */}
                        {dewa_compliance_report.blocking_issues && (
                            <div className={`p-4 rounded-xl border relative z-10 flex gap-4 items-center ${dewa_compliance_report.blocking_issues.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${dewa_compliance_report.blocking_issues.length > 0 ? 'bg-white border-amber-300 text-amber-600' : 'bg-white border-green-300 text-green-600'}`}>
                                    {dewa_compliance_report.blocking_issues.length > 0 ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h4 className={`font-bold text-sm mb-1 ${dewa_compliance_report.blocking_issues.length > 0 ? 'text-amber-900' : 'text-green-900'}`}>
                                        {dewa_compliance_report.blocking_issues.length > 0 ? `${dewa_compliance_report.blocking_issues.length} Critical Issues Detected` : 'No Critical Issues Detected'}
                                    </h4>
                                    <p className={`text-xs ${dewa_compliance_report.blocking_issues.length > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                                        {dewa_compliance_report.blocking_issues.length > 0 ? 'Resolve these issues before submission' : 'All compliance checks passed'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Blocking Issues Detailed List */}
                    {dewa_compliance_report.blocking_issues?.length > 0 && (
                        <div className="relative z-10 space-y-3 pt-3 border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Detailed Breakdown</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {dewa_compliance_report.blocking_issues.map((issue, idx) => (
                                    <div key={idx} className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-200 hover:border-red-300 transition-colors flex flex-col justify-between">
                                        <div className="flex items-start gap-3 mb-3">
                                            <span className="px-2 py-0.5 mt-0.5 bg-red-100 text-red-700 border border-red-200 rounded text-[10px] font-bold tracking-wider shrink-0">{issue.severity}</span>
                                            <p className="text-sm font-semibold text-slate-800 leading-snug">{issue.issue}</p>
                                        </div>
                                        <div className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 mt-auto">
                                            <strong className="text-emerald-700 uppercase tracking-wider text-[10px]">Required Fix:</strong> {issue.fix}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Room Breakdown */}
            {proposed_rooms_summary && (
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                        <div className="w-9 h-9 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-indigo-600">
                            <Maximize2 className="w-5 h-5" />
                        </div>
                        <h3 className="text-slate-900 font-bold text-base sm:text-lg">Room Breakdown</h3>
                    </div>
                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-6">
                        {proposed_rooms_summary.from_lighting?.length > 0 && (
                            <div className="flex-1 space-y-3">
                                <h4 className="text-[13px] font-medium text-slate-400 capitalize">From Lighting</h4>
                                <RoomGrid items={proposed_rooms_summary.from_lighting} />
                            </div>
                        )}
                        {proposed_rooms_summary.from_power?.length > 0 && (
                            <div className="flex-1 space-y-3">
                                <h4 className="text-[13px] font-medium text-slate-400 capitalize">From Power</h4>
                                <RoomGrid items={proposed_rooms_summary.from_power} />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Source Consistency Matrix */}
            {
                change_summary?.proposed_by_source && (
                    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <Table2 className="w-5 h-5" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900">Source Consistency Matrix</h2>
                        </div>
                        <div className="overflow-x-auto p-0">
                            <table className="w-full text-xs md:text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-3 min-w-[120px]">Metric</th>
                                        <th className="px-4 py-3 text-center bg-slate-100/50 border-x border-slate-100">Approved</th>
                                        {Object.keys(change_summary.proposed_by_source).map(source => (
                                            <th key={source} className="px-4 py-3 text-center border-r border-slate-100 last:border-r-0">
                                                {source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {Object.keys(change_summary.approved_summary || {}).map((metric) => {
                                        const sources = Object.keys(change_summary.proposed_by_source);
                                        const approvedVal = change_summary.approved_summary?.[metric];

                                        // Collect all values for this metric across all sources
                                        const sourceValues = sources.map(s => change_summary.proposed_by_source[s]?.[metric]);

                                        // Check for mismatch among existing values (ignoring nulls)
                                        const validValues = sourceValues.filter(v => v !== null && v !== undefined);
                                        const uniqueValues = new Set(validValues);
                                        const isMismatch = uniqueValues.size > 1;

                                        return (
                                            <tr key={metric} className={`hover:bg-slate-50/50 transition-colors ${isMismatch ? 'bg-red-50/10' : ''}`}>
                                                <td className="px-4 py-3 font-medium text-slate-900 capitalize border-r border-slate-50">
                                                    {metric.replace(/_/g, ' ')}
                                                    {isMismatch && <span className="block text-[10px] text-red-500 font-bold uppercase mt-1">Mismatch</span>}
                                                </td>
                                                <td className="px-4 py-3 text-center bg-slate-50/30 border-r border-slate-100 font-medium text-slate-700">
                                                    {approvedVal ?? '--'}
                                                </td>
                                                {sources.map((source) => {
                                                    const val = change_summary.proposed_by_source[source]?.[metric];
                                                    const isDiffFromApproved = val !== approvedVal && approvedVal != null && val != null;

                                                    return (
                                                        <td key={source} className={`px-4 py-3 text-center border-r border-slate-100 last:border-r-0 ${isDiffFromApproved ? 'text-blue-600 font-bold' : 'text-slate-600'}`}>
                                                            {val ?? '--'}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            }



            {/* Module Tabs (Lighting, Power, SLD) */}
            {
                moduleTabs.length > 0 && (
                    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 shrink-0">
                                    <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" /> Proposed Design Breakdown
                                </h2>
                                <div className="w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 -mb-1 sm:pb-0 sm:mb-0">
                                    <TabsList className="bg-slate-100/80 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl flex gap-1 sm:gap-1.5 h-auto w-max min-w-full sm:min-w-0 border border-slate-200/50 shadow-inner justify-start">
                                        {moduleTabs.map(tab => (
                                            <TabsTrigger
                                                key={tab.key}
                                                value={tab.key}
                                                className="flex-1 sm:flex-none shrink-0 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-lg text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 sm:gap-2.5 whitespace-nowrap border border-transparent data-[state=active]:border-indigo-100/50 cursor-pointer"
                                            >
                                                <tab.icon className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /> {tab.label}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </div>
                            </div>

                            {moduleTabs.map(tab => (
                                <TabsContent key={tab.key} value={tab.key} className="p-0 outline-none tab-content-active">
                                    <div key={tab.key} className="p-4 sm:p-6">
                                        <ModuleContent data={tab.data} moduleName={tab.label} />
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                )
            }

            {/* Room-wise Equipment Discrepancies */}
            {discrepancyTabs.length > 0 && (
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 overflow-hidden shadow-sm mb-6 sm:mb-8">
                    <div className="bg-slate-50 p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3">
                            <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-center shrink-0">
                                <Table2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-slate-900 m-0 leading-tight">Room-wise Discrepancies</h2>
                                <p className="text-[11px] sm:text-xs text-slate-500 font-medium m-0 mt-1">Discrepancies between Drawings and Excel Schedule</p>
                            </div>
                        </div>
                        <div className="flex items-center self-start sm:self-center">
                            <span className="text-[10px] sm:text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 whitespace-nowrap">
                                {proposed_room_equipment.comparison.discrepancies.length} Conflicts
                            </span>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6">
                        <Tabs defaultValue={discrepancyTabs[0].key} className="w-full">
                            <div className="w-full overflow-x-auto no-scrollbar pb-1 mb-4 sm:pb-0 sm:mb-6">
                                <TabsList className="bg-slate-100/80 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl flex gap-1 sm:gap-1.5 h-auto w-max min-w-full sm:min-w-0 border border-slate-200/50 shadow-inner justify-start">
                                    {discrepancyTabs.map(tab => (
                                        <TabsTrigger
                                            key={tab.key}
                                            value={tab.key}
                                            className="flex-1 sm:flex-none shrink-0 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-lg text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 sm:gap-2.5 whitespace-nowrap border border-transparent data-[state=active]:border-indigo-100/50 cursor-pointer"
                                        >
                                            <tab.icon className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /> {tab.label} ({tab.data.length})
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>

                            {discrepancyTabs.map(tab => (
                                <TabsContent key={tab.key} value={tab.key} className="outline-none tab-content-active">
                                    <div className="p-0 overflow-x-auto no-scrollbar bg-white rounded-xl border border-slate-100">
                                        <table className="w-full border-collapse text-left min-w-[600px]">
                                            <thead>
                                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                                    <th className="p-3 sm:p-4 w-12 sm:w-16 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest">#</th>
                                                    <th className="p-3 sm:p-4 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest">Room Label</th>
                                                    <th className="p-3 sm:p-4 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Drawing</th>
                                                    <th className="p-3 sm:p-4 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Excel</th>
                                                    <th className="p-3 sm:p-4 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-widest">Note</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {tab.data.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="p-3 sm:p-4 text-xs font-semibold text-slate-400">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="p-3 sm:p-4 text-xs sm:text-sm font-bold text-slate-700">
                                                            {item.room_label}
                                                        </td>
                                                        <td className="p-3 sm:p-4 text-center">
                                                            <span className={`text-xs sm:text-sm font-bold ${item.drawing_value === 0 ? 'text-red-500' : 'text-slate-500'}`}>
                                                                {item.drawing_value}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 sm:p-4 text-center">
                                                            <span className={`text-xs sm:text-sm font-bold ${item.excel_value === 0 ? 'text-red-500' : 'text-slate-500'}`}>
                                                                {item.excel_value}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 sm:p-4 text-xs text-slate-500 font-medium">
                                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                                                                <span className="truncate max-w-[120px] sm:max-w-xs">{item.message}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                </div>
            )}

            {/* Load Schedule & Excel Status */}
            {(proposed_load_schedule_omitted || load_schedule_comparison || proposed_excel_comparison) && (
                <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {/* Status Card */}
                        <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ backgroundColor: '#f5f3ff', padding: '8px', borderRadius: '10px' }}>
                                    <FileSpreadsheet style={{ width: '20px', height: '20px', color: '#7c3aed' }} />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>Excel Comparison Status</h4>
                                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Schedule Consistency Check</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {proposed_load_schedule_omitted && (
                                    <div style={{ fontSize: '12px', padding: '10px 14px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', borderRadius: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <AlertTriangle style={{ width: '14px', height: '14px' }} />
                                        Load Schedule Omitted from Proposed
                                    </div>
                                )}
                                {proposed_excel_comparison?.summary && (
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#475569', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                        {formatText(proposed_excel_comparison.summary)}
                                    </div>
                                )}
                                {load_schedule_comparison?.structural_match === false && (
                                    <div style={{ fontSize: '12px', padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <XCircle style={{ width: '14px', height: '14px' }} />
                                        Structural Mismatch in Schedule
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick Stats Card */}
                        <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ backgroundColor: '#ecfdf5', padding: '8px', borderRadius: '10px' }}>
                                    <Activity style={{ width: '20px', height: '20px', color: '#059669' }} />
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>Load Items Count</h4>
                                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '500' }}>Schedule Row Analysis</p>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approved</div>
                                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#334155', marginTop: '4px' }}>{load_schedule_comparison?.approved_row_count || 0}</div>
                                </div>
                                <div style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proposed</div>
                                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#334155', marginTop: '4px' }}>{load_schedule_comparison?.proposed_row_count || 0}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed Room Breakdowns (Dynamic) */}
            {roomDetailTabs.length > 0 && (
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 overflow-hidden shadow-sm mb-6 sm:mb-8">
                    <div className="bg-slate-50 p-4 sm:p-6 border-b border-slate-100 flex items-start sm:items-center gap-3">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-center shrink-0">
                            <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 m-0 leading-tight">Proposed Room Details</h2>
                            <p className="text-[11px] sm:text-xs text-slate-500 font-medium m-0 mt-1">Detailed inventory found in proposed drawings</p>
                        </div>
                    </div>
                    <div className="p-4 sm:p-6">
                        <Tabs defaultValue={roomDetailTabs[0].key} className="w-full">
                            <div className="w-full overflow-x-auto no-scrollbar pb-1 mb-4 sm:pb-0 sm:mb-6">
                                <TabsList className="bg-slate-100/80 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl flex gap-1 sm:gap-1.5 h-auto w-max min-w-full sm:min-w-0 border border-slate-200/50 shadow-inner justify-start">
                                    {roomDetailTabs.map(tab => (
                                        <TabsTrigger
                                            key={tab.key}
                                            value={tab.key}
                                            className="flex-1 sm:flex-none shrink-0 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-lg text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 sm:gap-2.5 whitespace-nowrap border border-transparent data-[state=active]:border-indigo-100/50 cursor-pointer"
                                        >
                                            <tab.icon className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" /> {tab.label} ({tab.data.length})
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>

                            {roomDetailTabs.map(tab => (
                                <TabsContent key={tab.key} value={tab.key} className="outline-none tab-content-active">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                        {tab.data.map((room, i) => (
                                            <div key={i} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 sm:p-5 hover:border-slate-200 hover:bg-slate-50 transition-colors">
                                                <div className="text-xs sm:text-sm font-bold text-slate-800 mb-3 flex justify-between items-center gap-2">
                                                    <span className="truncate max-w-[70%]">{room.room_label || room.label || `Room ${i + 1}`}</span>
                                                    <span className={`px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-bold shrink-0 ${tab.accent === 'blue' ? 'bg-blue-50 text-blue-700' :
                                                        tab.accent === 'emerald' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {room.light_count_total !== undefined ? room.light_count_total :
                                                            room.socket_count !== undefined ? room.socket_count :
                                                                room.total_count !== undefined ? room.total_count : 'Itemized'}
                                                    </span>
                                                </div>

                                                {/* Dynamic content rendering based on what's inside */}
                                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                                    {/* If it has a lights array */}
                                                    {room.lights?.map((l, li) => (
                                                        <div key={li} className="text-[9px] sm:text-[10px] bg-white border border-slate-200 px-2 sm:px-2.5 py-1 rounded-lg text-slate-500 font-semibold shadow-sm">
                                                            {l.type}: <span className="text-slate-900 ml-0.5">{l.count}</span>
                                                        </div>
                                                    ))}
                                                    {/* If it has a capacity_distribution object */}
                                                    {room.capacity_distribution && Object.entries(room.capacity_distribution).map(([type, count], li) => (
                                                        <div key={li} className="text-[9px] sm:text-[10px] bg-white border border-slate-200 px-2 sm:px-2.5 py-1 rounded-lg text-slate-500 font-semibold shadow-sm">
                                                            {type.replace(/_/g, ' ')}: <span className="text-slate-900 ml-0.5">{count}</span>
                                                        </div>
                                                    ))}
                                                    {/* Fallback: render any other numeric values */}
                                                    {!room.lights && !room.capacity_distribution && Object.entries(room).map(([k, v], li) => {
                                                        if (typeof v === 'number' && !k.includes('id') && !k.includes('total')) {
                                                            return (
                                                                <div key={li} className="text-[9px] sm:text-[10px] bg-white border border-slate-200 px-2 sm:px-2.5 py-1 rounded-lg text-slate-500 font-semibold shadow-sm">
                                                                    {k.replace(/_/g, ' ')}: <span className="text-slate-900 ml-0.5">{v}</span>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                </div>
            )}

            {/* Drawing Data Snapshots */}
            {(lighting_labels_snapshot?.length > 0 || power_labels_snapshot?.length > 0) && (
                <div style={{ backgroundColor: 'white', borderRadius: '24px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
                    <div
                        style={{ backgroundColor: '#f8fafc', padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                        onClick={() => {
                            const el = document.getElementById('snapshots-content');
                            if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ backgroundColor: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Maximize2 style={{ width: '20px', height: '20px', color: '#3b82f6' }} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0' }}>Drawing Raw Snapshots</h2>
                                <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', margin: '4px 0 0 0' }}>Raw labels extracted from DXF layers (Collapsible)</p>
                            </div>
                        </div>
                        <ChevronDown style={{ width: '20px', height: '20px', color: '#94a3b8' }} />
                    </div>

                    <div id="snapshots-content" style={{ padding: '24px', display: 'none' }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {lighting_labels_snapshot?.length > 0 && (
                                <div>
                                    <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Zap style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
                                        Lighting Dxf Labels ({lighting_labels_snapshot.length})
                                    </h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '300px', overflowY: 'auto', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '16px' }}>
                                        {lighting_labels_snapshot.map((tag, i) => (
                                            <span key={i} style={{ fontSize: '9px', fontWeight: '700', backgroundColor: 'white', border: '1px solid #e2e8f0', color: '#64748b', padding: '3px 8px', borderRadius: '4px' }}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {power_labels_snapshot?.length > 0 && (
                                <div>
                                    <h4 style={{ fontSize: '13px', fontWeight: '800', color: '#475569', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Activity style={{ width: '16px', height: '16px', color: '#10b981' }} />
                                        Power Dxf Labels ({power_labels_snapshot.length})
                                    </h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '300px', overflowY: 'auto', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '16px' }}>
                                        {power_labels_snapshot.map((tag, i) => (
                                            <span key={i} style={{ fontSize: '9px', fontWeight: '700', backgroundColor: 'white', border: '1px solid #e2e8f0', color: '#64748b', padding: '3px 8px', borderRadius: '4px' }}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Comparison Box */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 overflow-hidden shadow-sm mb-6 sm:mb-8">
                <div className="bg-slate-50 p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3">
                        <div className="bg-white p-2.5 rounded-xl border border-indigo-100 flex items-center justify-center shrink-0">
                            <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 m-0 leading-tight">Reference Load Comparison</h2>
                            <p className="text-[11px] sm:text-xs text-slate-500 font-medium m-0 mt-1">Detected Changes from Approved Documents</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-center bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">Live Monitor</span>
                    </div>
                </div>

                {comparison_result && (
                    <div className="p-4 sm:p-6">
                        <div className="flex flex-col gap-6">
                            {/* Summary block */}
                            {comparison_result.summary && (
                                <div className="bg-slate-50 p-4 rounded-xl sm:rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 sm:gap-4 items-start">
                                    <div className="bg-white p-2 rounded-lg border border-slate-200 shrink-0">
                                        <Info className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="m-0 text-sm font-bold text-slate-800 mb-1 sm:mb-1.5">Summary</h4>
                                        <p className="m-0 text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">{formatText(comparison_result.summary)}</p>
                                    </div>
                                </div>
                            )}

                            {/* Changes block */}
                            <div>
                                {comparison_result.changes?.length > 0 && (
                                    <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" /> Detected Changes
                                    </h4>
                                )}
                                <div className="flex flex-col gap-4">
                                    {comparison_result.changes?.map((change, i) => {
                                        const appVal = parseFloat(String(change.approved).replace(/[^\d.-]/g, '')) || 0;
                                        const proVal = parseFloat(String(change.proposed).replace(/[^\d.-]/g, '')) || 0;
                                        const isIncrease = proVal > appVal;
                                        const isDecrease = proVal < appVal;

                                        const accentColor = isIncrease ? '#fbbf24' : isDecrease ? '#10b981' : '#3b82f6';
                                        const accentBg = isIncrease ? 'bg-amber-50 border-amber-200 text-amber-800' : isDecrease ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-blue-50 border-blue-200 text-blue-800';

                                        // Format message - remove long decimals
                                        const formattedMsg = change.message?.replace(/(\d+\.\d{3,})/g, (match) =>
                                            parseFloat(match).toLocaleString(undefined, { maximumFractionDigits: 2 })
                                        );

                                        return (
                                            <div
                                                key={i}
                                                className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl relative p-4 sm:p-5 overflow-hidden flex flex-col shadow-sm"
                                            >
                                                {/* Side Indicator */}
                                                <div
                                                    className="absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 z-10"
                                                    style={{ backgroundColor: accentColor }}
                                                />

                                                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide">
                                                                {change.item?.replace(/_/g, ' ')}
                                                            </span>
                                                            <span className={`px-2 py-1 sm:px-3 sm:py-1 rounded-md border text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${accentBg}`}>
                                                                {isIncrease ? 'Increase' : isDecrease ? 'Decrease' : 'Modified'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs sm:text-[13px] text-slate-600 font-medium leading-relaxed m-0 max-w-full lg:max-w-md">
                                                            {formattedMsg}
                                                        </p>
                                                    </div>

                                                    <div className="bg-slate-50 border border-slate-200 p-3 sm:p-4 rounded-xl flex items-center justify-between gap-4 w-full lg:w-auto mt-2 lg:mt-0">
                                                        <div className="flex flex-col items-center min-w-[60px] sm:min-w-[80px]">
                                                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-1">Approved</span>
                                                            <span className="text-sm sm:text-[15px] font-black text-slate-700">
                                                                {appVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center justify-center shrink-0">
                                                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                                                        </div>

                                                        <div className="flex flex-col items-center min-w-[60px] sm:min-w-[80px]">
                                                            <span className="text-[9px] sm:text-[10px] font-bold text-indigo-500 uppercase mb-1">Proposed</span>
                                                            <span className="text-sm sm:text-[15px] font-black text-indigo-600">
                                                                {proVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {(!comparison_result.changes || comparison_result.changes.length === 0) && (
                                        <div className="text-center py-8 sm:py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                                            <p className="text-sm text-slate-500 font-medium m-0">No significant load changes detected between sources.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Problems block */}
                            {comparison_result.problems_by_source && typeof comparison_result.problems_by_source === 'object' && !Array.isArray(comparison_result.problems_by_source) && Object.keys(comparison_result.problems_by_source).filter(k => comparison_result.problems_by_source[k]?.length > 0).length > 0 && (
                                (() => {
                                    const probs = comparison_result.problems_by_source;
                                    const keys = Object.keys(probs).filter(key => probs[key] && probs[key].length > 0);
                                    return (
                                        <div className="mt-2 sm:mt-4">
                                            <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" /> Problems by Source
                                            </h4>

                                            <Tabs defaultValue={keys[0]} className="w-full">
                                                <div className="w-full overflow-x-auto no-scrollbar pb-1 mb-4">
                                                    <TabsList className="bg-slate-100/80 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl flex gap-1 sm:gap-1.5 h-auto w-max min-w-full sm:min-w-0 border border-slate-200/50 shadow-inner">
                                                        {keys.map(key => (
                                                            <TabsTrigger
                                                                key={key}
                                                                value={key}
                                                                className="flex-1 sm:flex-none shrink-0 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all duration-300 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-lg text-slate-500 hover:text-slate-800 whitespace-nowrap border border-transparent data-[state=active]:border-indigo-100/50 cursor-pointer"
                                                            >
                                                                {key.replace(/_/g, ' ')} ({probs[key]?.length || 0})
                                                            </TabsTrigger>
                                                        ))}
                                                    </TabsList>
                                                </div>

                                                {keys.map(key => (
                                                    <TabsContent key={key} value={key} className="outline-none tab-content-active">
                                                        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                                            <div className="overflow-x-auto no-scrollbar">
                                                                <table className="w-full min-w-[500px] border-collapse text-left">
                                                                    <thead>
                                                                        <tr className="bg-slate-50 border-b border-slate-200">
                                                                            <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest w-12 sm:w-16 text-center">#</th>
                                                                            <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest">Issue</th>
                                                                            <th className="px-3 sm:px-4 py-2.5 sm:py-3 text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest w-24 sm:w-32">Severity</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-100">
                                                                        {probs[key].map((problem, i) => {
                                                                            const severity = (problem.severity || 'medium').toLowerCase();
                                                                            const isHigh = severity === 'high' || severity === 'critical';
                                                                            const badgeClasses = isHigh
                                                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                                                : 'bg-amber-50 text-amber-700 border-amber-200';

                                                                            return (
                                                                                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                                                                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs font-semibold text-slate-400 text-center align-top">{i + 1}</td>
                                                                                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-[13px] font-medium text-slate-700 leading-relaxed align-top">{problem.issue}</td>
                                                                                    <td className="px-3 sm:px-4 py-3 sm:py-4 align-top">
                                                                                        <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border text-[9px] sm:text-[10px] font-bold uppercase tracking-widest whitespace-nowrap inline-block ${badgeClasses}`}>
                                                                                            {severity}
                                                                                        </span>
                                                                                    </td>
                                                                                </tr>
                                                                            )
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </TabsContent>
                                                ))}
                                            </Tabs>
                                        </div>
                                    );
                                })()
                            )}

                            {comparison_result.problems && Array.isArray(comparison_result.problems) && comparison_result.problems.length > 0 && (
                                <div className="mt-2 sm:mt-4">
                                    <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" /> General Problems
                                    </h4>
                                    <div className="flex flex-col gap-3 sm:gap-4">
                                        {comparison_result.problems.map((problem, i) => {
                                            const severity = (problem.severity || 'medium').toLowerCase();
                                            const isHigh = severity === 'high' || severity === 'critical';
                                            const containerClasses = isHigh
                                                ? 'bg-red-50 border-red-100'
                                                : 'bg-amber-50 border-amber-100';
                                            const textClasses = isHigh ? 'text-red-800' : 'text-amber-800';
                                            const iconClasses = isHigh ? 'text-red-500' : 'text-amber-500';

                                            return (
                                                <div key={i} className={`border p-3 sm:p-4 rounded-xl sm:rounded-2xl flex gap-3 items-start ${containerClasses}`}>
                                                    <AlertTriangle className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 ${iconClasses}`} />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                                                            <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest bg-white/60 px-2 py-0.5 rounded shadow-sm ${textClasses}`}>
                                                                {severity} Severity
                                                            </span>
                                                        </div>
                                                        <p className={`m-0 text-xs sm:text-[13px] font-medium leading-relaxed ${textClasses}`}>{problem.issue}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Suggestions block */}
                            {comparison_result.suggestions?.length > 0 && (
                                <div className="mt-2 sm:mt-4">
                                    <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" /> Suggestions
                                    </h4>
                                    <div className="flex flex-col gap-3 sm:gap-4">
                                        {comparison_result.suggestions.map((suggestion, i) => (
                                            <div key={i} className="bg-emerald-50 border border-emerald-100 p-3 sm:p-4 rounded-xl sm:rounded-2xl flex gap-3 items-start shadow-sm hover:shadow transition-shadow">
                                                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0 mt-0.5" />
                                                <div className="flex-1">
                                                    <h5 className="m-0 text-xs sm:text-[13px] font-bold text-emerald-800 mb-1 leading-snug">{suggestion.what_to_change}</h5>
                                                    <p className="m-0 text-[11px] sm:text-xs text-emerald-600 font-medium leading-relaxed">{suggestion.how_to_change}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )}
            </div>

            {/* Required Documents (Moved from Right) */}
            <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/50 rounded-2xl sm:rounded-3xl border border-indigo-100 p-4 sm:p-6 md:p-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6 md:mb-8">
                    <h3 className="text-sm sm:text-base text-indigo-900 font-bold flex items-center gap-2">
                        <Files className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                        Required Documents
                        <span className="ml-1 px-2 sm:px-3 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 shadow-sm">
                            {documents_to_submit?.documents?.length || 0}
                        </span>
                    </h3>
                    <span className="text-xs font-semibold text-indigo-600 bg-white px-3 sm:px-4 py-1.5 rounded-full border border-indigo-100 shadow-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Submission Ready
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 max-h-[600px] overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-indigo-200 scrollbar-track-transparent">
                    {documents_to_submit?.documents?.map((doc, i) => (
                        <div key={i} className="group bg-white p-4 sm:p-6 rounded-2xl border border-indigo-50 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden flex flex-col justify-between">
                            <div className="relative z-10 flex flex-col gap-2">
                                <h4 className="flex items-start gap-3 text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors leading-snug">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-600 shrink-0 mt-0.5">
                                        {i + 1}
                                    </span>
                                    {doc.name}
                                </h4>
                                <p className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-600 line-clamp-3 pl-9">
                                    {doc.why_needed}
                                </p>
                            </div>

                            {/* Decorative Background Icon */}
                            {/* <div className="absolute -bottom-6 -right-6 z-0 pointer-events-none" style={{ opacity: 0.05 }}>
                                        <FileText strokeWidth={1.5} className="w-32 h-32 text-indigo-600 transform -rotate-12" />
                                    </div> */}
                        </div>
                    ))}
                </div>
            </div>
            {/* Data Quality Checks (Moved from Right) */}
            {/* Source Reconciliation (Data Quality Check) */}
            {(dewa_compliance_report?.source_reconciliation || data_quality_checks?.source_reconciliation) && (
                (() => {
                    const sourceRecon = dewa_compliance_report?.source_reconciliation || data_quality_checks?.source_reconciliation;
                    return (
                        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6 overflow-hidden relative">
                            {sourceRecon.discrepancy_flag && (
                                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                            )}
                            <div className="flex items-center gap-3 mb-4 mix-blend-multiply">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${sourceRecon.discrepancy_flag ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-600'}`}>
                                    {sourceRecon.discrepancy_flag ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base text-slate-900 font-bold">Source Reconciliation</h3>
                                    <p className="text-xs text-slate-500 font-medium">Master Source Validation</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-slate-500 font-medium">Master Source</span>
                                            <span className="font-bold text-slate-800 bg-white px-2 py-1 rounded border border-slate-200 uppercase text-xs">{(sourceRecon.master_source || 'Unknown').replace(/_/g, ' ')}</span>
                                        </div>
                                        <p className="text-slate-600 text-xs italic">{sourceRecon.reason}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                                            <span className="text-[10px] uppercase font-bold text-slate-400">Connected Load</span>
                                            <span className="text-lg font-black text-slate-800">{sourceRecon.total_connected_load_kw} <span className="text-xs font-bold text-slate-400">kW</span></span>
                                        </div>
                                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
                                            <span className="text-[10px] uppercase font-bold text-slate-400">Demand Load</span>
                                            <span className="text-lg font-black text-slate-800">{sourceRecon.demand_load_kw} <span className="text-xs font-bold text-slate-400">kW</span></span>
                                        </div>
                                    </div>
                                </div>

                                {sourceRecon.source_comparison && (
                                    <div className="bg-white border text-sm border-slate-200 rounded-xl overflow-hidden flex flex-col">
                                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 text-xs uppercase tracking-wider">
                                            Source Comparison
                                        </div>
                                        <div className="divide-y divide-slate-100 flex-grow max-h-[160px] overflow-y-auto">
                                            {Object.entries(sourceRecon.source_comparison).map(([src, val]) => {
                                                const isMaster = src === sourceRecon.master_source;
                                                return (
                                                    <div key={src} className={`flex justify-between items-center px-4 py-2 hover:bg-slate-50 transition-colors ${isMaster ? 'bg-indigo-50/30' : ''}`}>
                                                        <span className={`text-xs ${isMaster ? 'font-bold text-indigo-700' : 'font-medium text-slate-600 uppercase'}`}>
                                                            {src.replace(/_/g, ' ')}
                                                            {isMaster && ' (Master)'}
                                                        </span>
                                                        <span className="font-bold text-slate-900">{val} kW</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {sourceRecon.discrepancy_note && (
                                <div className={`mt-4 p-3 rounded-xl text-xs font-medium border flex items-start gap-2 ${sourceRecon.discrepancy_flag ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <p>{sourceRecon.discrepancy_note}</p>
                                </div>
                            )}
                        </div>
                    );
                })()
            )}

            {/* Load Deviations Summary */}
            {data_quality_checks?.load_deviations_summary && (
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6 mb-6">
                    <h3 className="text-sm sm:text-base text-slate-900 font-bold mb-3 sm:mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-indigo-500" /> Load Deviations Summary
                    </h3>
                    <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/50 mb-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white border border-indigo-100 shadow-sm flex items-center justify-center shrink-0">
                            <Zap className="w-4 h-4 text-indigo-600" />
                        </div>
                        <p className="text-xs sm:text-sm text-indigo-900 font-medium">{data_quality_checks.load_deviations_summary.summary}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {data_quality_checks.load_deviations_summary.deviations?.map((dev, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-sm hover:border-indigo-300 transition-colors flex flex-col justify-between h-full">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">{dev.source.replace(/_/g, ' ')}</span>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <div className="text-sm font-black text-slate-800">{dev.kw} <span className="text-[10px] text-slate-400 font-medium">kW</span></div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className={`text-xs font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${dev.deviation_percent < 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                            {dev.deviation_percent < 0 ? <ChevronDown className="w-3 h-3" /> : <ChevronDown className="w-3 h-3 rotate-180" />}
                                            {Math.abs(dev.deviation_percent)}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Data Quality Checks */}
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6">
                <h3 className="text-sm sm:text-base text-slate-900 font-bold mb-3 sm:mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" /> Data Quality Checks
                </h3>
                {(() => {
                    const conflicts = data_quality_checks?.conflicts_found || [];

                    if (conflicts.length === 0) {
                        return (
                            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <p className="text-slate-400 text-sm">No data quality issues found.</p>
                            </div>
                        );
                    }

                    // 1. Collect all unique comparison keys dynamically
                    const allSourceKeys = Array.from(new Set(
                        conflicts.flatMap(c => Object.keys(c.values || {}))
                    )).sort();

                    return (
                        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white flex flex-col max-h-[600px] shadow-sm">
                            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                                <table className="w-full text-sm text-left border-collapse min-w-max ">
                                    <thead style={{ backgroundColor: '#f1f5f9' }} className="text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-20">
                                        <tr>
                                            <th style={{ width: '150px', padding: '12px 16px' }} className="whitespace-nowrap text-xs font-bold uppercase tracking-wider text-slate-600 border-r border-slate-200 last:border-r-0">Conflict Type</th>
                                            {allSourceKeys.map(k => (
                                                <th key={k} style={{ width: '110px', padding: '12px 16px' }} className="whitespace-nowrap text-xs font-bold uppercase tracking-wider text-slate-600 border-r border-slate-200">
                                                    {k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                                </th>
                                            ))}
                                            <th style={{ minWidth: '450px', padding: '12px 16px' }} className="text-xs font-bold uppercase tracking-wider text-slate-600">Action Required</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {conflicts.map((conflict, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors align-top">
                                                <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap border-r border-slate-100 text-xs">
                                                    {conflict.type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                                </td>
                                                {allSourceKeys.map(key => {
                                                    const val = conflict.values?.[key];
                                                    const isPresent = val !== undefined && val !== null;
                                                    return (
                                                        <td key={key} className="px-4 py-3 border-r border-slate-100 text-xs">
                                                            {isPresent ? (
                                                                <span className={`inline-block px-2 py-1 rounded border ${typeof val === 'number' && val === 0
                                                                    ? 'bg-red-50 text-red-600 border-red-200 font-bold'
                                                                    : 'bg-white text-slate-700 border-slate-200 font-medium'
                                                                    }`}>
                                                                    {typeof val === 'number' ? val.toLocaleString(undefined, { maximumFractionDigits: 2 }) : val}
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: '#94a3b8', backgroundColor: '#f8fafc', padding: '2px 8px', borderRadius: '6px', border: '1px dashed #e2e8f0', display: 'inline-block' }} className="text-[10px] font-bold">N/A</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-4 py-3 text-slate-600 text-xs leading-relaxed">
                                                    {conflict.action_required}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    );
                })()}

                {/* Checks Performed + Critical Issues — side by side */}
                {(data_quality_checks?.checks_performed?.length > 0 || data_quality_checks?.critical_issues?.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-5">

                        {/* Checks Performed */}
                        {data_quality_checks?.checks_performed?.length > 0 && (
                            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 overflow-hidden shadow-sm flex flex-col">
                                <div className="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-emerald-100 bg-emerald-100/60">
                                    <div className="w-8 h-8 rounded-xl bg-white border border-emerald-200 flex items-center justify-center shadow-sm shrink-0">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-emerald-900 text-sm">Checks Performed</h4>
                                        <p className="text-[11px] text-emerald-600 font-medium">{data_quality_checks.checks_performed.length} validations run</p>
                                    </div>
                                    <span className="ml-auto px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-full shadow-sm">
                                        {data_quality_checks.checks_performed.length}
                                    </span>
                                </div>
                                <div className="p-4 space-y-2 max-h-[260px] overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-200 scrollbar-track-transparent">
                                    {data_quality_checks.checks_performed.map((check, i) => (
                                        <div key={i} className="flex items-start gap-2.5 p-2.5 bg-white/70 rounded-xl border border-emerald-100 hover:bg-white transition-colors">
                                            <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            </div>
                                            <span className="text-xs text-emerald-900 leading-relaxed font-medium">{check}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Critical Issues */}
                        {data_quality_checks?.critical_issues?.length > 0 && (
                            <div className="bg-red-50 rounded-2xl border border-red-100 overflow-hidden shadow-sm flex flex-col">
                                <div className="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-red-100 bg-red-100/60">
                                    <div className="w-8 h-8 rounded-xl bg-white border border-red-200 flex items-center justify-center shadow-sm shrink-0">
                                        <AlertTriangle className="w-4 h-4 text-red-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-red-900 text-sm">Critical Issues</h4>
                                        <p className="text-[11px] text-red-500 font-medium">Needs immediate attention</p>
                                    </div>
                                    <span className="ml-auto px-2.5 py-1 bg-red-600 text-white text-xs font-bold rounded-full shadow-sm">
                                        {data_quality_checks.critical_issues.length}
                                    </span>
                                </div>
                                <div className="p-4 space-y-2 max-h-[260px] overflow-y-auto scrollbar-thin scrollbar-thumb-red-200 scrollbar-track-transparent">
                                    {data_quality_checks.critical_issues.map((issue, i) => (
                                        <div key={i} className="p-3 bg-white/70 rounded-xl border border-red-100 hover:bg-white transition-colors">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-red-200">
                                                    {(issue.severity || 'Medium').toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-red-900 leading-relaxed font-medium">
                                                {issue.issue || issue.message}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* AI Narrative */}
            {
                dewa_phase7_narrative?.llm_narrative && (
                    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
                        <div className="p-4 sm:p-6 border-b border-indigo-100" style={{ background: 'linear-gradient(to right, #f5f3ff, #eff6ff, white)' }}>
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl border border-indigo-100 shadow-sm flex items-center justify-center shrink-0">
                                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-xl font-bold text-slate-900">AI Narrative</h2>
                                    <p className="text-xs sm:text-sm text-slate-500 font-medium">Strategic assessment & recommendations</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            {/* Executive Summary */}
                            <div className="bg-slate-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200">
                                <h3 className="font-bold text-slate-900 mb-2 sm:mb-3 text-xs sm:text-sm uppercase tracking-wide flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-slate-500" /> Executive Summary
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-4 sm:pl-6 border-l-4 border-slate-300">
                                    {formatText(dewa_phase7_narrative.llm_narrative.executive_summary)}
                                </p>
                            </div>

                            {/* Risks & Actions Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <div style={{ backgroundColor: '#fef2f2', padding: '24px', borderRadius: '20px', border: '1px solid #fee2e2', height: '100%' }}>
                                    <h3 style={{ fontWeight: '800', color: '#991b1b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        <AlertTriangle style={{ width: '16px', height: '16px', color: '#dc2626' }} /> Key Risks
                                    </h3>
                                    <ul style={{ listStyle: 'none', padding: '0', margin: '0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {dewa_phase7_narrative.llm_narrative.key_risks?.map((risk, i) => (
                                            <li key={i} style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', padding: '12px', borderRadius: '12px', fontSize: '13px', color: '#991b1b', fontWeight: '600', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                <span style={{ backgroundColor: '#ef4444', marginTop: '6px', width: '6px', height: '6px', borderRadius: '50%', flexShrink: '0' }} />
                                                {formatText(risk)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div style={{ backgroundColor: '#f0fdf4', padding: '24px', borderRadius: '20px', border: '1px solid #dcfce7', height: '100%' }}>
                                    <h3 style={{ fontWeight: '800', color: '#065f46', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        <CheckCircle2 style={{ width: '16px', height: '16px', color: '#16a34a' }} /> Recommended Actions
                                    </h3>
                                    <ul style={{ listStyle: 'none', padding: '0', margin: '0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {dewa_phase7_narrative.llm_narrative.recommended_actions?.map((action, i) => (
                                            <li key={i} style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)', padding: '12px', borderRadius: '12px', fontSize: '13px', color: '#065f46', fontWeight: '600', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                <span style={{ backgroundColor: '#10b981', marginTop: '6px', width: '6px', height: '6px', borderRadius: '50%', flexShrink: '0' }} />
                                                {formatText(action)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }




        </div >
    );
}

// Module Content Component (Reuse logic from AIAnalysis essentially)
function ModuleContent({ data, moduleName }) {
    const info = data?.ui_view?.extracted_drawing_info;
    const loadBreakdown = data?.ui_view?.load_breakdown;
    const projectSummary = data?.ui_view?.project_summary;
    const feasibilityStatus = data?.ui_view?.feasibility_status;
    const pfCalc = data?.ui_view?.power_factor_calculation;
    const electricalChecks = data?.ui_view?.dewa_electrical_checks;

    // Check if empty
    if (!info && !loadBreakdown && !projectSummary && !pfCalc && !electricalChecks) {
        return <div className="text-center text-slate-400 py-8">No detailed data extracted for {moduleName}.</div>;
    }

    const loadTotal = info?.total_electrical_load_kw || 1; // Prevent div/0

    return (
        <div className="space-y-6">

            {/* Top Stats for this Module - Dynamic & Showing All Keys */}
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
                {Object.entries(info || {})
                    .filter(([_, val]) => typeof val !== 'object' || val === null) // Exclude complex objects like extracted_floors, but keep nulls/primitives
                    .sort(([_, a], [__, b]) => {
                        const valA = parseFloat(String(a).replace(/[^\d.-]/g, '')) || 0;
                        const valB = parseFloat(String(b).replace(/[^\d.-]/g, '')) || 0;
                        if (valA === 0 && valB === 0) return 0;
                        return valB - valA;
                    })
                    .map(([key, val]) => {
                        const label = key.replace(/total_electrical_load_kw/g, 'Total Load')
                            .replace(/maximum_demand_kw/g, 'Max Demand')
                            .replace(/total_built_up_area/g, 'Calculated Area')
                            .replace(/total_floors/g, 'Detected Floors')
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, c => c.toUpperCase());

                        let unit = '';
                        if (key.toLowerCase().includes('load') || key.toLowerCase().includes('demand') || key.toLowerCase().includes('kw')) unit = 'kW';
                        if (key.toLowerCase().includes('area')) unit = 'm²';

                        const displayValue = (val === null || val === undefined || val === '') ? '--' : val;

                        return (
                            <div key={key} className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[80px] group">
                                <span className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-tight group-hover:text-indigo-500 transition-colors">
                                    {label}
                                </span>
                                <span className="text-base font-black text-slate-800 leading-none">
                                    {displayValue}
                                </span>
                                {unit && (
                                    <span className="text-[11px] font-medium text-slate-400 mt-2">
                                        {unit === 'm²' ? (<span>m<sup>2</sup></span>) : unit}
                                    </span>
                                )}
                            </div>
                        );
                    })}
            </div>

            {/* Load Breakdown Distribution Bar */}
            {loadBreakdown && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            Distribution (Categorized Load)
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {info?.total_electrical_load_kw || 0} kW TOTAL
                        </span>
                    </div>

                    <div className="h-4 w-full bg-slate-100 rounded-full flex overflow-hidden border border-slate-200">
                        {Object.entries(loadBreakdown).map(([key, val], idx) => {
                            const numericVal = parseFloat(String(val).replace(/[^\d.-]/g, '')) || 0;
                            if (numericVal <= 0) return null;

                            const total = parseFloat(info?.total_electrical_load_kw) || numericVal || 1;
                            const widthPct = (numericVal / total) * 100;

                            const colorArray = ['#4f46e5', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4'];
                            const segmentColor = colorArray[idx % colorArray.length];

                            return (
                                <Tooltip key={key} delayDuration={0}>
                                    <TooltipTrigger asChild>
                                        <div
                                            style={{
                                                width: `${widthPct}%`,
                                                backgroundColor: segmentColor
                                            }}
                                            className="h-full transition-all duration-500 relative cursor-help border-r border-white/20 last:border-0 hover:brightness-110"
                                        />
                                    </TooltipTrigger>
                                    <TooltipContent
                                        style={{ backgroundColor: 'white' }}
                                        className="text-slate-900 border border-slate-200 p-4 shadow-2xl z-[100] min-w-[200px]"
                                        sideOffset={8}
                                    >
                                        <div className="flex flex-col gap-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: segmentColor }} />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{key.replace(/_kw/g, '')}</span>
                                            </div>
                                            <div className="flex items-baseline justify-between border-b border-slate-100 pb-2">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-xl font-black text-slate-900">{numericVal}</span>
                                                    <span className="text-xs font-bold text-slate-400 uppercase">kW</span>
                                                </div>
                                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 font-bold text-[10px] border border-indigo-100">
                                                    {widthPct.toFixed(1)}%
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 font-medium leading-relaxed opacity-80">
                                                Contribution of {key.replace(/_kw/g, '')} to the total electrical load breakdown.
                                            </p>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            )
                        })}
                    </div>

                    <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
                        {Object.entries(loadBreakdown).map(([key, val], idx) => {
                            const numericVal = parseFloat(String(val).replace(/[^\d.-]/g, '')) || 0;
                            const colorArray = ['#4f46e5', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4'];
                            const segmentColor = colorArray[idx % colorArray.length];

                            return (
                                <div key={key} className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[80px] group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: segmentColor }} />
                                    <span className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-tight group-hover:text-indigo-500 transition-colors">
                                        {key.replace(/_kw/g, '').replace(/_/g, ' ')}
                                    </span>
                                    <span className="text-base font-black text-slate-800 leading-none">
                                        {numericVal}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase scale-90">
                                        kW
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}



            {/* Floors Info - Redesigned */}
            {info?.extracted_floors && (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                            <Layers className="w-4 h-4" /> Detected Floors Structure
                        </h4>
                        {info.extracted_floors.floor_structure && (
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200 uppercase">
                                Summary: {info.extracted_floors.floor_structure}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                        {/* Status Chip for Each Floor */}
                        {info.extracted_floors.ground_floor && (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 shadow-sm transition-all hover:bg-indigo-100">
                                Ground Floor
                            </span>
                        )}
                        {info.extracted_floors.mezzanine && (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 shadow-sm transition-all hover:bg-indigo-100">
                                Mezzanine
                            </span>
                        )}
                        {info.extracted_floors.upper_floors?.map(f => (
                            <span key={f} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100 shadow-sm transition-all hover:bg-indigo-100">
                                {f.includes('Floor') || f.includes('F') ? f : `Floor ${f}`}
                            </span>
                        ))}
                        {info.extracted_floors.roof_floor && (
                            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-50 text-slate-600 text-xs font-bold border border-slate-200 shadow-sm transition-all hover:bg-slate-100">
                                Roof Floor
                            </span>
                        )}

                        {/* Total Floors Highlight */}
                        {info.extracted_floors.total_floors > 0 && (
                            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg shadow-md transition-all hover:scale-105 cursor-default">
                                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Total</span>
                                <span className="text-sm font-black">{info.extracted_floors.total_floors}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Power Factor Calculation */}
            {pfCalc && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-600" /> Power Factor Calculation
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${pfCalc.dewa_compliant ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {pfCalc.dewa_compliant ? 'Compliant' : 'Non-Compliant'} (Min: {pfCalc.min_required_pf})
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <StatRow label="P Total" value={pfCalc.P_total_kw} subValue="kW" bgClass="bg-slate-50" colorClass="text-slate-800" />
                        <StatRow label="Q Total" value={pfCalc.Q_total_kvar} subValue="kVAR" bgClass="bg-slate-50" colorClass="text-slate-800" />
                        <StatRow label="S Total" value={pfCalc.S_total_kva} subValue="kVA" bgClass="bg-slate-50" colorClass="text-slate-800" />
                        <StatRow label="Calculated PF" value={pfCalc.power_factor} bgClass={pfCalc.dewa_compliant ? 'bg-emerald-50' : 'bg-red-50'} colorClass={pfCalc.dewa_compliant ? 'text-emerald-700' : 'text-red-700'} />
                    </div>

                    {pfCalc.steps?.length > 0 && (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="text-slate-500 border-b border-slate-200">
                                        <th className="pb-2 font-bold uppercase">Category</th>
                                        <th className="pb-2 font-bold uppercase text-right">P (kW)</th>
                                        <th className="pb-2 font-bold uppercase text-right">PF</th>
                                        <th className="pb-2 font-bold uppercase text-right">Q (kVAR)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pfCalc.steps.map((step, idx) => (
                                        <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-white transition-colors">
                                            <td className="py-2 text-slate-700 font-medium">{step.category.replace(/_/g, ' ')}</td>
                                            <td className="py-2 text-right font-semibold">{step.P_kw}</td>
                                            <td className="py-2 text-right text-slate-500">{step.PF}</td>
                                            <td className="py-2 text-right">{step.Q_kvar}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* DEWA Electrical Checks */}
            {electricalChecks && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                        <CheckCircle2 className="w-5 h-5 text-blue-600" /> Engineering Electrical Checks
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {electricalChecks.cable_sizing && (
                            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                                <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-3">Cable Sizing</h5>
                                <div className="space-y-2 text-sm text-slate-600">
                                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                                        <span>Operating Current</span>
                                        <span className="font-bold text-slate-900">{electricalChecks.cable_sizing.current_a} A</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                                        <span>Current w/ Margin</span>
                                        <span className="font-bold text-slate-900">{electricalChecks.cable_sizing.current_with_margin_a} A</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                                        <span>Suggested Cable</span>
                                        <span className="font-bold text-blue-600">{electricalChecks.cable_sizing.suggested_cable_mm2} mm²</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1">
                                        <span>Rating</span>
                                        <span className="font-bold text-emerald-600">{electricalChecks.cable_sizing.rating_a} A</span>
                                    </div>
                                </div>
                                {electricalChecks.cable_sizing.source && (
                                    <div className="mt-3 text-[10px] text-slate-400 font-medium italic">Ref: {electricalChecks.cable_sizing.source}</div>
                                )}
                            </div>
                        )}

                        {electricalChecks.voltage_drop_check && (
                            <div className={`rounded-2xl border p-5 shadow-sm ${electricalChecks.voltage_drop_check.status === 'requires_cable_length' ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200'}`}>
                                <h5 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-3">Voltage Drop Check</h5>

                                {electricalChecks.voltage_drop_check.status === 'requires_cable_length' ? (
                                    <div className="flex flex-col h-full justify-center pb-6">
                                        <p className="text-sm text-amber-700 font-medium leading-relaxed flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 shrink-0" />
                                            {electricalChecks.voltage_drop_check.message}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 text-sm text-slate-600">
                                        <p>{electricalChecks.voltage_drop_check.message}</p>
                                        <div className="flex justify-between items-center mt-4">
                                            <span className="text-xs uppercase font-bold text-slate-400">Compliant</span>
                                            {electricalChecks.voltage_drop_check.dewa_compliant === true ? (
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded">Yes</span>
                                            ) : electricalChecks.voltage_drop_check.dewa_compliant === false ? (
                                                <span className="px-2 py-0.5 bg-red-100 text-red-700 font-bold rounded">No</span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 font-bold rounded">N/A</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Internal Helper for Room Grid (Matches AIAnalysis Drawing Info style)
function RoomGrid({ items }) {
    const [showAll, setShowAll] = useState(false);
    const firstItems = items.slice(0, 6);
    const restItems = items.slice(6);
    const hasMore = restItems.length > 0;

    const Card = ({ room }) => (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors flex flex-col justify-between h-full min-h-[80px] group">
            <p className="text-xs text-slate-500 mb-1 capitalize">
                {room.label.toLowerCase().includes('room') ? room.label.replace(/room/i, '').trim() : room.label}
            </p>
            <div className="text-lg font-bold text-slate-900 break-words mt-auto">
                {room.area_m2} <span className="text-[12px] text-slate-400 font-medium">m²</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                {firstItems.map((room, i) => <Card key={i} room={room} />)}
            </div>

            {hasMore && (
                <Collapsible open={showAll} onOpenChange={setShowAll}>
                    <CollapsibleContent className="collapsible-content">
                        <div className="grid grid-cols-2 gap-3 pt-3">
                            {restItems.map((room, i) => <Card key={i} room={room} />)}
                        </div>
                    </CollapsibleContent>
                    <div className="flex justify-center pt-2">
                        <CollapsibleTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all font-bold text-xs uppercase tracking-widest"
                            >
                                {showAll ? (
                                    <>View Less <ChevronDown className="w-4 h-4 rotate-180" /></>
                                ) : (
                                    <>View More ({restItems.length}) <ChevronDown className="w-4 h-4" /></>
                                )}
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                </Collapsible>
            )}
        </div>
    );
}

// Simple Helper Component for Stats
function StatRow({ label, value, subValue, colorClass, bgClass, className }) {
    return (
        <div className={`p-4 rounded-2xl border ${bgClass} flex flex-col items-start justify-center gap-1 shadow-sm transition-all hover:shadow-md ${className || ''}`}>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
            <div className="mt-1 w-full">
                <span className={`font-bold text-2xl md:text-3xl block ${colorClass}`}>{value}</span>
                {subValue && <p className="text-xs text-slate-500 font-medium mt-1 leading-tight">{subValue}</p>}
            </div>
        </div>
    );
}

function Badge({ severity }) {
    const styles = {
        high: "bg-red-100 text-red-700 border-red-200",
        medium: "bg-amber-100 text-amber-700 border-amber-200",
        low: "bg-blue-100 text-blue-700 border-blue-200"
    };
    return (
        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${styles[severity?.toLowerCase()] || styles.low}`}>
            {severity || 'Info'}
        </span>
    );
}
