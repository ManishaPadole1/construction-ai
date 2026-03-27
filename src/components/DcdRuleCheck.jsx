/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react';
import {
    Flame,
    AlertTriangle,
    Files,
    Sparkles,
    CheckCircle2,
    XCircle,
    ClipboardCheck,
    FileCheck2,
    LayoutDashboard,
    ArrowRight,
    ChevronDown,
    ShieldCheck,
    Bell,
    LogOut,
    Activity,
    Layers,
    Clock,
    Table2,
    FileText,
    Info,
    Building2,
    Anchor,
    Zap,
    Maximize2,
    Shield,
    AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
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

// Authority metadata
const authorityMeta = {
    DCD: {
        label: "Dubai Civil Defence",
        color: "from-red-500 to-orange-600",
        icon: Building2
    },
    GENERAL: {
        label: "General",
        color: "from-slate-500 to-slate-700",
        icon: Building2
    }
};

export function DcdRuleCheck({ aiResponseText, projectData, navigateTo }) {
    // 1. CSS for layout - PORTED FROM DEWA
    const layoutStyles = `
        .dcd-row-container {
            display: flex;
            flex-direction: column;
            gap: 2rem;
            width: 100%;
        }
        @media (min-width: 1024px) {
            .dcd-row-container {
                flex-direction: row;
                align-items: flex-start;
            }
            .dcd-col-30 {
                width: 30%;
                position: sticky;
                top: 2rem;
                height: fit-content;
            }
            .dcd-col-70 {
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

    // 🔍 Merge engine_result.ui_view with main data for unified targeting - PORTED FROM DEWA
    const memoizedData = useMemo(() => {
        // DCD structure: engine_result.ui_view
        const uiView = data?.engine_result?.ui_view || {};

        return {
            ...data,
            ...uiView,
            // Ensure nested objects are properly prioritized
            feasibility_status: uiView.feasibility_status || data.feasibility_status,
            scoring: uiView.scoring || data.scoring,
            project_summary: uiView.project_summary || data.project_summary,
            required_parameter_changes: uiView.required_parameter_changes || data.required_parameter_changes,
            executive_dashboard: uiView.executive_dashboard || data.executive_dashboard,
            extracted_drawing_info: uiView.extracted_drawing_info || data.extracted_drawing_info,
            ai_reasoning: uiView.ai_reasoning || data.ai_reasoning,
            phase7_ai_narrative: uiView.phase7_ai_narrative || data.dcd_phase7_narrative?.llm_narrative || data.phase7_ai_narrative
        };
    }, [data]);

    const {
        executive_dashboard,
        comparison_result,
        documents_to_submit,
        data_quality_checks,
        required_parameter_changes,
        engine_result,
        change_summary,
        user_inputs_received,
        feasibility_status,
        extracted_drawing_info,
        ai_reasoning,
        project_summary,
        scoring,
        phase7_ai_narrative
    } = memoizedData;

    const [activeTab, setActiveTab] = useState(null);

    // Detect Modules for Tabs (Fully Dynamic)
    const moduleTabs = useMemo(() => {
        if (!engine_result) return [];

        // In DCD response, modules might be directly in engine_result
        // But we want to filter for has_data or keys like proposed_fire_alarm
        return Object.keys(engine_result)
            .filter(key => (engine_result[key]?.has_data || key.startsWith('proposed_')) && key !== 'ui_view' && key !== 'status' && key !== 'summary')
            .map(key => {
                const modData = engine_result[key];

                let label = key.replace(/proposed_|approved_/g, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                let icon = Layers;
                if (key.toLowerCase().includes('fire_fighting')) icon = Flame;
                else if (key.toLowerCase().includes('fire_alarm')) icon = Bell;
                else if (key.toLowerCase().includes('escape')) icon = LogOut;

                return {
                    key,
                    label,
                    icon,
                    data: {
                        proposed: modData,
                        approved: key.startsWith('proposed_') ? engine_result[key.replace('proposed_', 'approved_')] : null
                    }
                };
            })
            .filter(tab => tab.key.startsWith('proposed_') || !Object.keys(engine_result).includes('proposed_' + tab.key));
    }, [engine_result]);

    if (moduleTabs.length > 0 && !activeTab) {
        setActiveTab(moduleTabs[0].key);
    }

    // Parse Parameter Changes - group by authority
    const paramChangesGrouped = useMemo(() => {
        if (!required_parameter_changes) return {};
        if (Array.isArray(required_parameter_changes)) {
            const grouped = {};
            required_parameter_changes.forEach(change => {
                const auth = change.permission_required || change.authority || "DCD";
                if (!grouped[auth]) grouped[auth] = [];
                grouped[auth].push(change);
            });
            return grouped;
        }
        return required_parameter_changes;
    }, [required_parameter_changes]);

    // Helper for Status Banner Style
    const getFeasibilityStatusStyle = (status) => {
        const statusConfig = {
            'APPROVED': {
                label: 'Approved',
                background: 'linear-gradient(to right, rgb(34, 197, 94), rgb(16, 185, 129))',
            },
            'FEASIBLE': {
                label: 'Feasible',
                background: 'linear-gradient(to right, rgb(34, 197, 94), rgb(16, 185, 129))',
            },
            'REQUIRES_MODIFICATIONS': {
                label: 'Requires Modifications',
                background: 'linear-gradient(to right, rgb(249, 115, 22), rgb(245, 158, 11))',
            },
            'EXTRACT_ONLY': {
                label: 'Extract Only',
                background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(99, 102, 241))',
            },
            'REJECTED': {
                label: 'Rejected',
                background: 'linear-gradient(to right, rgb(239, 68, 68), rgb(244, 63, 94))',
            }
        };

        return statusConfig[status] || {
            label: status || 'Unknown',
            background: 'linear-gradient(to right, rgb(239, 68, 68), rgb(244, 63, 94))'
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
            message: executive_dashboard.confidence_level || 'System analysed documents based on DCD rules.',
            detailed_message: phase7_ai_narrative?.executive_summary || '',
            estimated_timeline_days: executive_dashboard.estimated_approval_time_days
        };
    }, [feasibility_status, executive_dashboard, phase7_ai_narrative]);

    const statusStyle = getFeasibilityStatusStyle(derived_feasibility_status?.status);

    // 🔍 Mapping feasibility_status to AIAnalysis scoring format
    const scoringData = useMemo(() => {
        if (!scoring && !derived_feasibility_status) return null;

        const sc = scoring?.compliance_score || {};
        const ap = scoring?.approval_probability || {};
        const rd = scoring?.readiness || {};
        const fs = derived_feasibility_status || {};
        const ed = executive_dashboard || {};

        return {
            compliance_score: {
                overall_score: sc.overall_score ?? (fs.compliance_score ?? (ed.submission_ready ? 100 : 50)),
                breakdown: sc.breakdown || {
                    passed: fs.passed_checks ?? 0,
                    failed: fs.modification_count ?? (ed.blocking_issues > 0 ? ed.blocking_issues : 0),
                    blocking_issues: ed.blocking_issues ?? 0
                }
            },
            approval_probability: {
                overall_probability: ap.overall_probability ?? (fs.approval_probability ?? (ed.submission_ready ? 0.9 : 0.4)),
                confidence: ap.confidence || ed.confidence_level?.split(' - ')[0] || "Medium",
                estimated_timeline_days: fs.estimated_timeline_days || ed.estimated_approval_time_days
            },
            readiness: {
                readiness_level: rd.readiness_level || fs.readiness_level || (ed.submission_ready ? "Ready" : "Not Ready"),
                summary: rd.summary || {
                    blocking_issues_count: ed.blocking_issues ?? 0,
                    missing_documents_count: ed.documents_complete ? 0 : 5
                }
            }
        };
    }, [scoring, derived_feasibility_status, executive_dashboard]);


    const violationsCount = executive_dashboard?.total_violations ?? 0;
    const documentsCount = executive_dashboard?.total_documents ?? 0;
    const roomsCount = executive_dashboard?.total_rooms ?? 0;
    const confidenceVal = executive_dashboard?.confidence_level?.split(' - ')[0] || "N/A";

    return (
        <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-8 space-y-5 md:space-y-8 animate-in fade-in duration-500">
            <style>{layoutStyles}</style>

            {/* Header */}
            <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl text-slate-900 mb-1 sm:mb-2">DCD Compliance Check</h1>
                <p className="text-slate-600 text-xs sm:text-sm md:text-base">
                    Dubai Civil Defence — Fire &amp; Life Safety Analysis
                </p>
            </div>

            {/* ---- FEASIBILITY STATUS ---- */}
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
                                    {derived_feasibility_status.message}
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

            {/* ---- QUICK STATS ---- */}
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
                        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                        <span className="text-xl sm:text-2xl font-bold text-purple-700">{confidenceVal}</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-purple-600 font-medium">Confidence</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-1">
                        <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        <span className="text-xl sm:text-2xl font-bold text-green-700">{roomsCount}</span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-green-600 font-medium">Total Rooms</p>
                </div>
            </div>


            <div className="space-y-6">
                {/* Scoring Dashboard (Full Width) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Compliance Score */}
                    {scoringData?.compliance_score && (
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all flex flex-col justify-between">
                            <div className="relative z-10">
                                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Compliance Score</h3>
                                <div className="flex items-baseline gap-2 mb-3">
                                    <span className={`text-4xl font-black ${scoringData.compliance_score.overall_score >= 80 ? 'text-green-600' : scoringData.compliance_score.overall_score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                        {scoringData.compliance_score.overall_score}
                                    </span>
                                    <span className="text-slate-400 font-medium">/ 100</span>
                                </div>
                                {scoringData.compliance_score.breakdown && (
                                    <div className="space-y-1.5 mb-4">
                                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-green-500 h-full" style={{ width: `${scoringData.compliance_score.overall_score}%` }} />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-slate-500 font-medium pt-1">
                                            <span>Pass: {scoringData.compliance_score.breakdown.passed}</span>
                                            <span>Fail: {scoringData.compliance_score.breakdown.failed}</span>
                                        </div>
                                    </div>
                                )}
                                {scoringData.compliance_score.score_details?.deductions && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Deduction Breakdown</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(scoringData.compliance_score.score_details.deductions)
                                                .filter(([k, v]) => k !== 'total' && v > 0)
                                                .map(([k, v]) => (
                                                    <div key={k} className="flex flex-col p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                                        <span className="text-[8px] text-slate-400 font-bold uppercase truncate">{k.replace(/_/g, ' ')}</span>
                                                        <span className="text-xs font-black text-red-500">-{v}</span>
                                                    </div>
                                                ))}
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
                    {scoringData?.approval_probability && (
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all flex flex-col justify-between">
                            <div className="relative z-10">
                                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Approval Chance</h3>
                                <div className="flex items-baseline gap-2 mb-3">
                                    <span className="text-4xl font-black text-slate-900">{(scoringData.approval_probability.overall_probability * 100).toFixed(0)}%</span>
                                    <span className="text-xs px-2 py-0.5 bg-slate-100 rounded-full text-slate-600 font-bold">{scoringData.approval_probability.confidence} Confidence</span>
                                </div>
                                {scoringData.approval_probability.estimated_timeline_days && (
                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 p-2 rounded-lg">
                                        <span className="text-lg">⏳</span>
                                        <span className="truncate">Est. <span className="text-slate-900 font-bold">{scoringData.approval_probability.estimated_timeline_days} Days</span></span>
                                    </div>
                                )}
                            </div>
                            <div style={{ position: 'absolute', bottom: '-15px', right: '-15px', opacity: 0.1, zIndex: 0, pointerEvents: 'none' }}>
                                <Building2 className="text-purple-600" style={{ width: '100px', height: '100px' }} />
                            </div>
                        </div>
                    )}

                    {/* Readiness Level */}
                    {scoringData?.readiness && (
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all flex flex-col justify-between">
                            <div className="relative z-10">
                                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Readiness</h3>
                                <div className="mb-3">
                                    <span className={`text-2xl font-black px-3 py-1 rounded-lg ${scoringData.readiness.readiness_level === 'Ready' || scoringData.readiness.readiness_level === 'High' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {scoringData.readiness.readiness_level}
                                    </span>
                                </div>
                                {scoringData.readiness.summary && (
                                    <div className="text-xs text-slate-600 space-y-1">
                                        <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> {scoringData.readiness.summary.blocking_issues_count} Blocking Issues</p>
                                        <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> {scoringData.readiness.summary.missing_documents_count} Missing Docs</p>
                                    </div>
                                )}
                                {scoringData.readiness.critical_path?.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest mb-2">Critical Path Actions</p>
                                        <div className="space-y-1.5">
                                            {scoringData.readiness.critical_path.slice(0, 3).map((item, i) => (
                                                <div key={i} className="text-[10px] text-slate-600 leading-tight flex gap-2 items-start">
                                                    <AlertCircle className="w-2.5 h-2.5 text-red-500 shrink-0 mt-0.5" />
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div style={{ position: 'absolute', bottom: '-15px', right: '-15px', opacity: 0.1, zIndex: 0, pointerEvents: 'none' }}>
                                <FileCheck2 className="text-emerald-600" style={{ width: '100px', height: '100px' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Extracted Building Info (Full Width - Light UI) */}
                {extracted_drawing_info && (
                    <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 blur-[80px] -mr-32 -mt-32 rounded-full"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                                    <Layers className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-base">Extracted Building Specifications</h4>
                                    <p className="text-slate-500 text-[10px] uppercase tracking-widest font-medium">Automatic Parameter Identification</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {Object.entries(extracted_drawing_info)
                                    .filter(([k, v]) => typeof v !== 'object' && v !== null && v !== 0 && v !== "")
                                    .map(([key, value]) => (
                                        <div key={key} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md hover:border-indigo-200 transition-all group">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block mb-2 group-hover:text-indigo-600 transition-colors">{key.replace(/_/g, ' ')}</span>
                                            <span className="text-lg font-black text-slate-800 leading-tight flex items-baseline gap-1">
                                                {formatText(value)}
                                                {typeof value === 'number' && key.toLowerCase().includes('area') && <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">SQM</span>}
                                            </span>
                                        </div>
                                    ))}
                            </div>

                            {/* Detailed Floor Breakdown */}
                            {extracted_drawing_info.extracted_floors && (
                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <h5 className="text-[10px] font-black text-indigo-900 uppercase tracking-[0.2em] mb-4">Detailed Floor Intelligence</h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                                            <span className="text-[9px] font-bold text-indigo-400 uppercase block mb-1">Basements</span>
                                            <span className="text-sm font-bold text-slate-900">{extracted_drawing_info.extracted_floors.basements?.length || 0} Found</span>
                                            <p className="text-[10px] text-slate-500 mt-1">{extracted_drawing_info.extracted_floors.basements?.join(', ') || 'None'}</p>
                                        </div>
                                        <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                                            <span className="text-[9px] font-bold text-indigo-400 uppercase block mb-1">Mezzanine</span>
                                            <span className="text-sm font-bold text-slate-900">{extracted_drawing_info.extracted_floors.mezzanine ? 'Detected' : 'Not Found'}</span>
                                        </div>
                                        <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                                            <span className="text-[9px] font-bold text-indigo-400 uppercase block mb-1">Upper Floors</span>
                                            <span className="text-sm font-bold text-slate-900">{extracted_drawing_info.extracted_floors.upper_floors?.length || 0} Found</span>
                                            <p className="text-[10px] text-slate-500 mt-1">{extracted_drawing_info.extracted_floors.upper_floors?.join(', ') || 'N/A'}</p>
                                        </div>
                                        <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                                            <span className="text-[9px] font-bold text-indigo-400 uppercase block mb-1">Structure</span>
                                            <span className="text-sm font-bold text-slate-900">{extracted_drawing_info.extracted_floors.floor_structure || 'Unknown'}</span>
                                            <p className="text-[10px] text-slate-500 mt-1">Confidence: {(extracted_drawing_info.extracted_floors.confidence * 100).toFixed(0)}%</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Full Width Sections */}
                <div className="space-y-6">
                    {/* Parameter Changes Table (Full Width) */}
                    {Object.values(paramChangesGrouped).some(arr => Array.isArray(arr) && arr.length > 0) && (
                        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-4">
                            <h2 className="text-base sm:text-lg text-slate-900 font-bold flex items-center gap-2">
                                <Zap className="w-5 h-5 text-indigo-500" />
                                Required Parameter Changes
                            </h2>
                            {Object.entries(paramChangesGrouped).map(([authority, changes]) => {
                                if (!Array.isArray(changes) || changes.length === 0) return null;
                                const meta = authorityMeta[authority] || { label: authority, color: "from-slate-500 to-slate-700", icon: Building2 };
                                return (
                                    <div key={authority} className="space-y-4 mt-4">
                                        <div className={`bg-gradient-to-r ${meta.color} text-white px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm`}>
                                            <meta.icon className="w-5 h-5 shrink-0" />
                                            <span className="font-bold">{authority}</span>
                                            <span className="ml-auto px-2 py-1 bg-white/20 rounded-full text-xs font-bold">{changes.length} Changes</span>
                                        </div>
                                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-slate-50">
                                                    <tr>
                                                        <th className="p-3 font-bold text-slate-500 uppercase text-[10px]">Parameter</th>
                                                        <th className="p-3 font-bold text-slate-500 uppercase text-[10px]">Current</th>
                                                        <th className="p-3 font-bold text-slate-500 uppercase text-[10px]">Required</th>
                                                        <th className="p-3 font-bold text-slate-500 uppercase text-[10px]">Severity</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {changes.map((change, idx) => {
                                                        const severity = (change.severity || 'medium').toLowerCase();
                                                        const severityConfig = {
                                                            critical: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
                                                            high: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
                                                            medium: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
                                                            low: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' }
                                                        };
                                                        const config = severityConfig[severity] || severityConfig.medium;
                                                        return (
                                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                                <td className="p-3">
                                                                    <p className="font-bold text-slate-900">{change.parameter}</p>
                                                                    <p className="text-[11px] text-slate-500 leading-tight mt-1">{formatText(change.description)}</p>
                                                                </td>
                                                                <td className="p-3 text-slate-600">{formatText(change.current)}</td>
                                                                <td className="p-3 font-bold text-slate-900">{formatText(change.required)}</td>
                                                                <td className="p-3">
                                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${config.bg} ${config.text} ${config.border}`}>
                                                                        {severity}
                                                                    </span>
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

                    {/* Comparison Result / Inconsistencies (Full Width) */}
                    {comparison_result && (comparison_result.problems?.length > 0 || comparison_result.suggestions?.length > 0) && (
                        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-4">
                            <h2 className="text-base sm:text-lg text-slate-900 font-bold flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                Design Inconsistencies & AI Suggestions
                            </h2>
                            {comparison_result.summary && (
                                <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    {comparison_result.summary}
                                </p>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {comparison_result.problems?.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-bold text-red-600 uppercase tracking-widest px-2">Identified Issues</h4>
                                        <div className="space-y-2">
                                            {comparison_result.problems.map((prob, i) => {
                                                const isObject = typeof prob === 'object' && prob !== null;
                                                const issue = isObject ? prob.issue : prob;
                                                const severity = isObject ? prob.severity : 'medium';
                                                const severityStyles = {
                                                    high: 'bg-red-50/50 border-red-100 text-red-800',
                                                    critical: 'bg-red-50/50 border-red-100 text-red-800 font-bold',
                                                    medium: 'bg-amber-50/50 border-amber-100 text-amber-800',
                                                    low: 'bg-blue-50/50 border-blue-100 text-blue-800'
                                                };
                                                const style = severityStyles[severity?.toLowerCase()] || severityStyles.medium;
                                                
                                                return (
                                                    <div key={i} className={`flex gap-3 p-3 rounded-xl border text-xs ${style}`}>
                                                        <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                                        <div className="flex flex-col gap-1">
                                                            <span>{issue}</span>
                                                            {isObject && prob.severity && (
                                                                <span className="text-[9px] font-black uppercase opacity-60 tracking-tighter">Severity: {prob.severity}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {comparison_result.suggestions?.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest px-2">Smart Suggestions</h4>
                                        <div className="space-y-2">
                                            {comparison_result.suggestions.map((sug, i) => {
                                                const label = typeof sug === 'object' && sug !== null ? (sug.suggestion || sug.label || JSON.stringify(sug)) : sug;
                                                return (
                                                    <div key={i} className="flex gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-blue-800">
                                                        <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                                                        {label}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* AI Narrative Section (Full Width) */}
                    {phase7_ai_narrative && (
                        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                            <div className="p-4 sm:p-6 border-b border-red-50 bg-gradient-to-r from-red-50/50 to-white flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white border border-red-100 flex items-center justify-center shadow-sm">
                                    <Sparkles className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">AI Strategic Assessment</h2>
                                    <p className="text-xs font-medium text-red-600">Unified Fire & Life Safety Narrative</p>
                                </div>
                            </div>
                            <div className="p-6 space-y-6">
                                {phase7_ai_narrative.executive_summary && (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                        <h3 className="font-bold text-slate-900 mb-2 text-xs uppercase tracking-wide">Executive Summary</h3>
                                        <p className="text-sm text-slate-700 leading-relaxed border-l-4 border-slate-300 pl-4">{formatText(phase7_ai_narrative.executive_summary)}</p>
                                        {phase7_ai_narrative.authority_wise_notes && (
                                            <div className="mt-3 text-[11px] text-red-600 font-bold flex items-center gap-2 italic">
                                                <Shield className="w-3.5 h-3.5" />
                                                <span>Note: {phase7_ai_narrative.authority_wise_notes}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {phase7_ai_narrative.key_risks && (
                                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                            <h3 className="font-bold text-red-900 mb-3 text-xs uppercase tracking-wide flex items-center gap-2">
                                                <AlertTriangle className="w-4 h-4" /> Key Risks
                                            </h3>
                                            <ul className="space-y-2">
                                                {(Array.isArray(phase7_ai_narrative.key_risks) ? phase7_ai_narrative.key_risks : [phase7_ai_narrative.key_risks]).map((risk, i) => (
                                                    <li key={i} className="text-xs text-red-700 font-medium flex gap-2 items-start">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                                                        {formatText(risk)}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {phase7_ai_narrative.recommended_actions && (
                                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                            <h3 className="font-bold text-emerald-900 mb-3 text-xs uppercase tracking-wide flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4" /> Recommendations
                                            </h3>
                                            <ul className="space-y-2">
                                                {(Array.isArray(phase7_ai_narrative.recommended_actions) ? phase7_ai_narrative.recommended_actions : [phase7_ai_narrative.recommended_actions]).map((action, i) => (
                                                    <li key={i} className="text-xs text-emerald-700 font-medium flex gap-2 items-start">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                                                        {formatText(action)}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Subsystem Verification Tabs */}
                {moduleTabs.length > 0 && (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-red-600" /> Subsystem Design Verification
                                </h2>
                                <TabsList className="bg-slate-100 p-1 rounded-2xl flex gap-1 h-auto w-fit">
                                    {moduleTabs.map(tab => (
                                        <TabsTrigger
                                            key={tab.key}
                                            value={tab.key}
                                            className="px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm"
                                        >
                                            <tab.icon className="w-3.5 h-3.5 mr-2" /> {tab.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>
                            {moduleTabs.map(tab => (
                                <TabsContent key={tab.key} value={tab.key} className="p-6 tab-content-active space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className={`p-6 rounded-2xl border transition-all ${tab.data.proposed?.has_data ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Proposed Drawing Analysis</h4>
                                            {tab.data.proposed?.has_data ? (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 text-blue-700 font-black">
                                                        <Maximize2 className="w-5 h-5" /> Verified Components Found
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(tab.data.proposed)
                                                            .filter(([k, v]) => typeof v === 'number' && v > 0)
                                                            .map(([k, v]) => (
                                                                <div key={k} className="bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm flex items-center gap-2">
                                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{k.replace(/_/g, ' ')}</span>
                                                                    <span className="text-sm font-black text-blue-600 font-mono">{v}</span>
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-400 font-medium italic">No specific data extracted for this module.</p>
                                            )}
                                        </div>
                                        <div className={`p-6 rounded-2xl border transition-all ${tab.data.approved?.has_data ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Existing / Approved Reference</h4>
                                            {tab.data.approved?.has_data ? (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 text-emerald-700 font-black">
                                                        <ClipboardCheck className="w-5 h-5" /> Base-Line Comparison Loaded
                                                    </div>
                                                    <p className="text-xs text-emerald-600 font-medium">Comparison with {toTitleCase(tab.label)} infrastructure is active. {tab.data.comparison_detected ? 'Changes were identified.' : 'No significant changes detected.'}</p>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-400 font-medium italic">No approved reference drawing provided.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Rule Explanations specific to this module if available */}
                                    {ai_reasoning?.rule_explanations && (
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rule-by-Rule Reasoning</h4>
                                            <div className="space-y-3">
                                                {Object.entries(ai_reasoning.rule_explanations)
                                                    .filter(([ruleId, ruleInfo]) => ruleId.toLowerCase().includes(tab.label.toLowerCase().replace(/ /g, '_')) || ruleInfo.category?.toLowerCase() === tab.label.toLowerCase().replace(/ /g, '_'))
                                                    .map(([ruleId, ruleInfo], idx) => {
                                                        const isFail = ruleInfo.status === 'FAIL';
                                                        const statusBg = isFail ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                                        return (
                                                            <div key={idx} className={`p-4 rounded-xl border ${isFail ? 'border-red-100 bg-red-50/20' : 'border-slate-100 bg-white'}`}>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded border ${statusBg}`}>{ruleInfo.status}</span>
                                                                    <span className="text-xs font-bold text-slate-800">{ruleId.replace(/_/g, ' ')}</span>
                                                                </div>
                                                                <p className="text-xs text-slate-600 leading-relaxed">{ruleInfo.details}</p>
                                                                {ruleInfo.suggested_fix && (
                                                                    <div className="mt-2 p-2 bg-indigo-50/50 rounded-lg flex gap-2">
                                                                        <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                                                        <p className="text-[11px] font-medium text-indigo-700">{ruleInfo.suggested_fix}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    )}
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>
                )}

                {/* Document Submissions & NOCs */}
                {(documents_to_submit?.drawings?.length > 0 || documents_to_submit?.noc_requirements?.length > 0) && (
                    <div className="bg-gradient-to-br from-indigo-50/50 to-blue-50/50 rounded-3xl border border-indigo-100 p-6 sm:p-8 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <h3 className="text-base text-indigo-900 font-bold flex items-center gap-2">
                                <Files className="w-5 h-5 text-indigo-600" />
                                Submission Package Requirements
                                <span className="ml-1 px-3 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 shadow-sm">
                                    {(documents_to_submit?.drawings?.length || 0) + (documents_to_submit?.noc_requirements?.length || 0)}
                                </span>
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {documents_to_submit?.drawings?.map((doc, i) => (
                                <div key={i} className="bg-white p-5 rounded-2xl border border-indigo-50 hover:border-indigo-200 shadow-sm transition-all flex flex-col gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black border border-indigo-100">{i + 1}</div>
                                        <h4 className="text-sm font-bold text-slate-800">{doc.name}</h4>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed pl-10">{doc.why_needed}</p>
                                </div>
                            ))}
                            {documents_to_submit?.noc_requirements?.map((noc, i) => (
                                <div key={i} className="bg-amber-50/60 p-5 rounded-2xl border border-amber-100 hover:bg-amber-50 transition-all flex flex-col gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg bg-white text-amber-600 flex items-center justify-center border border-amber-100"><Anchor className="w-4 h-4" /></div>
                                        <h4 className="text-sm font-bold text-amber-900">{noc.noc_name}</h4>
                                    </div>
                                    <p className="text-xs text-amber-700 leading-relaxed pl-10">{noc.why_needed}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>


        </div>
    );
}
