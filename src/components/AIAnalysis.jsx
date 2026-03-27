import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  AlertTriangle,
  FileText,
  Sparkles,
  ChevronDown,
  MessageSquare
} from 'lucide-react';
import { Button } from './ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import { ClaudeAnalysis } from './ClaudeAnalysis';
import { Model3DViewer } from './Model3DViewer';
import { generateMock3DModel } from '../utils/mock3DModel';
import { ComplianceReportModal } from './ComplianceReportModal';


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



export function AIAnalysisContent({ showFloatingAssistant = true, navigateTo, aiResponseText, projectData }) {
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [showAllDrawingInfo, setShowAllDrawingInfo] = useState(false);
  const [enableMock3D, setEnableMock3D] = useState(true); // DEMO MODE - Always show 3D viewer
  const extractedInfoRef = useRef(null);
  const [searchParams] = useSearchParams();

  // Parse AI JSON Response
  function parseAIResponse(text) {
    if (typeof text === 'object' && text !== null) {
      return { isJson: true, data: text };
    }
    try {
      const cleaned = String(text).trim();
      const json = JSON.parse(cleaned);
      return { isJson: true, data: json };
    } catch (err) {
      return { isJson: false, data: text };
    }
  }

  const parsed = parseAIResponse(aiResponseText);
  const ai = parsed.isJson ? parsed.data : null;

  // 🔍 DEBUG: Check what data we received
  console.log('🔍 AIAnalysis Debug:', {
    aiResponseText: aiResponseText ? 'Present' : 'Missing',
    parsed: parsed.isJson ? 'Valid JSON' : 'Not JSON',
    ai: ai ? 'Extracted' : 'Null',
    projectData: projectData ? 'Present' : 'Missing'
  });

  // Extract Data (ui_compat can be nested inside engine_result OR at top level)
  let engineResult = ai?.engine_result || {};
  if (typeof engineResult === 'string') {
    try {
      engineResult = JSON.parse(engineResult);
    } catch (e) {
      console.error("Failed to parse engine_result string", e);
    }
  }

  // Extract ui_view data (NEW PRIORITY)
  let uiView = engineResult?.ui_view || null;

  // Inject mock 3D model if enabled and no real 3D data exists
  // Check both 'model_3d' (backend field) and '3d_model' (alternative)
  if (enableMock3D && uiView && !uiView['model_3d'] && !uiView['3d_model']) {
    uiView = {
      ...uiView,
      'model_3d': generateMock3DModel()
    };
  }

  console.log('🎯 UI View Data:', {
    hasUiView: !!uiView,
    uiViewKeys: uiView ? Object.keys(uiView) : [],
    feasibility_status: uiView?.feasibility_status,
    authorities: uiView?.authorities,
    extracted_drawing_info: uiView?.extracted_drawing_info,
    required_parameter_changes: uiView?.required_parameter_changes,
    fullUiView: uiView
  });

  // Prioritize ui_view, then ui_compat, then engine_result
  const uiCompat = uiView || engineResult?.ui_compat || engineResult || ai?.ui_compat || {};

  console.log('📊 Data Source Priority:', {
    source: uiView ? 'ui_view' : (engineResult?.ui_compat ? 'engine_result.ui_compat' : 'fallback'),
    hasData: !!uiCompat,
    uiCompatKeys: Object.keys(uiCompat),
    violations: uiCompat?.violations || uiCompat?.ai_violations,
    documentChecklist: Object.keys(uiCompat?.document_checklist || uiCompat?.ai_document_checklist || {})
  });

  const requirementText = uiCompat?.requirement_text || uiCompat?.ai_requirement_text || projectData?.requirement_text || ai?.requirement_text || "";
  const feasibilityStatus = uiCompat?.status || uiCompat?.ai_status || projectData?.ai_status || "UNKNOWN";
  const feasibilitySummary = uiCompat?.summary || uiCompat?.ai_summary || projectData?.ai_summary || "";
  const projectType = uiCompat?.project_type || uiCompat?.ai_project_type || projectData?.ai_project_type || "N/A";

  // Helper to ensure array
  const ensureArray = (data) => {
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) { return []; }
    }
    return [];
  };

  // Handle both ai_ prefixed and non-prefixed keys
  const requiredAuthorities = uiCompat?.required_authorities || uiCompat?.ai_required_authorities || projectData?.ai_required_authorities || [];
  const matchedRules = uiCompat?.matched_rules || uiCompat?.ai_matched_rules || projectData?.ai_matched_rules || [];
  const retrievedRules = uiCompat?.retrieved_rules || uiCompat?.ai_retrieved_rules || projectData?.ai_retrieved_rules || [];
  const needsClarification = uiCompat?.needs_clarification || uiCompat?.ai_needs_clarification || projectData?.ai_needs_clarification || [];
  const dxfSummary = uiCompat?.dxf_summary || uiCompat?.ai_dxf_summary || projectData?.ai_dxf_summary || null;
  const documentChecklist = uiCompat?.document_checklist || uiCompat?.ai_document_checklist || projectData?.ai_document_checklist || {};
  const authorityKeys = Object.keys(documentChecklist);

  // Extract project summary data from ui_view
  const projectSummaryData = uiView?.project_summary || uiCompat?.project_summary || {};
  // Extract structural calculations (User request: can be in ui_view or engine_result)
  const structuralCalculations = uiView?.structural_calculations || engineResult?.ui_view?.structural_calculations || engineResult?.structural_calculations || null;

  console.log('✅ Final Extracted Data:', {
    feasibilityStatus,
    violationsRaw: uiCompat?.violations || uiCompat?.ai_violations,
    violationsCount: ensureArray(uiCompat?.violations || uiCompat?.ai_violations).length,
    authorityKeys,
    documentChecklistKeys: Object.keys(documentChecklist),
    hasDxfSummary: !!dxfSummary,
    needsClarificationCount: needsClarification?.length || 0,
    dxfSummaryKeys: dxfSummary ? Object.keys(dxfSummary) : [],
    hasProjectSummary: !!projectSummaryData,
    projectSummaryKeys: Object.keys(projectSummaryData)
  });

  // 🔍 DEBUG: Check new sections data
  console.log('🆕 New Sections Data:', {
    needsClarification: needsClarification?.length || 0,
    needsClarificationSample: needsClarification?.[0],
    hasRoomSummary: !!dxfSummary?.room_summary,
    utilityRoomsCount: dxfSummary?.room_summary?.utility_rooms?.length || 0,
    openAreasCount: dxfSummary?.room_summary?.open_areas?.length || 0,
    hasGeometryDiff: !!dxfSummary?.geometry_diff,
    roomsAdded: dxfSummary?.geometry_diff?.rooms_added?.length || 0,
    roomsRemoved: dxfSummary?.geometry_diff?.rooms_removed?.length || 0,
    roomsModified: dxfSummary?.geometry_diff?.rooms_modified?.length || 0
  });

  // Extract claude_like_data for detailed analysis
  const claudeLikeData = uiView?.claude_like_data || uiCompat?.claude_like_data || null;
  const phase7Narrative = engineResult?.phase7_ai_narrative || engineResult?.ui_view?.phase7_ai_narrative || ai?.phase7_ai_narrative || null;
  console.log('🕵️ Phase 7 Narrative Debug:', {
    hasNarrative: !!phase7Narrative,
    hasEngineResult: !!engineResult,
    engineKeys: engineResult ? Object.keys(engineResult) : [],
    narrativeKeys: phase7Narrative ? Object.keys(phase7Narrative) : []
  });

  console.log('🤖 Claude Like Data:', {
    hasClaudeData: !!claudeLikeData,
    claudeDataKeys: claudeLikeData ? Object.keys(claudeLikeData) : []
  });

  console.log('📝 Requirement Text Check:', {
    requirementText: requirementText ? requirementText.substring(0, 100) + '...' : 'EMPTY',
    hasRequirementText: !!requirementText,
    uiCompatRequirement: uiCompat?.requirement_text ? 'Present' : 'Missing',
    projectDataRequirement: projectData?.requirement_text ? 'Present' : 'Missing',
    aiRequirement: ai?.requirement_text ? 'Present' : 'Missing'
  });

  // State - Default to first authority from ui_view or URL param
  const urlAuthority = searchParams.get('authority');
  const defaultAuthority = urlAuthority || uiView?.authorities?.[0]?.authority || authorityKeys[0] || null;
  const [selectedAuthority, setSelectedAuthority] = useState(defaultAuthority);
  const [showExplainability, setShowExplainability] = useState(true);

  // Sync state if URL changes (optional deeper sync)
  useEffect(() => {
    if (urlAuthority && urlAuthority !== selectedAuthority) {
      setSelectedAuthority(urlAuthority);
    }
  }, [urlAuthority]);

  // --- VIOLATIONS PROCESSING (New String Format Support) ---
  const rawViolations = ensureArray(uiCompat?.violations || uiCompat?.ai_violations || projectData?.ai_violations);

  const processedViolations = useMemo(() => {
    return rawViolations.map(v => {
      if (typeof v === 'string') {
        const parts = v.split(':');
        const parameter = parts[0]?.trim() || "Violation";
        const desc = parts[1]?.trim() || v;
        // Guess authority from parameter prefix
        const authKey = ['DCD', 'DEWA', 'DM', 'RTA'].find(a => parameter.includes(a)) || 'General';

        return {
          parameter,
          required: desc,
          severity: 'Critical', // Default for string messages in new dataset
          authority: authKey,
          current: 'Not Detected'
        };
      }
      return { ...v, authority: v.authority || 'General' };
    });
  }, [rawViolations]);

  const filteredViolations = useMemo(() => {
    if (!selectedAuthority) return processedViolations;
    return processedViolations.filter(v =>
      !v.authority || v.authority === 'General' || v.authority.includes(selectedAuthority)
    );
  }, [processedViolations, selectedAuthority]);


  useEffect(() => {
    if (!selectedAuthority && authorityKeys.length > 0) {
      setSelectedAuthority(authorityKeys[0]);
    }
  }, [authorityKeys]);


  const handleNavigate = (path) => {
    if (navigateTo) navigateTo(path);
  };


  // --- HELPERS ---
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

  const renderDxfSummary = (summary) => {
    if (!summary || typeof summary !== 'object') return <p className="text-sm text-slate-600">{String(summary)}</p>;

    // Whitelist relevant high-level keys, ignoring raw geometry arrays
    const relevantKeys = ['room_summary', 'geometry_diff'];

    return (
      <div className="space-y-4 text-sm max-h-96 overflow-y-auto pr-2">

        {Object.entries(summary).filter(([k]) => relevantKeys.includes(k)).map(([category, details], i) => (
          <div key={i} className="border-b border-slate-100 pb-3 last:border-0">
            <p className="font-semibold text-slate-800 mb-2 capitalize bg-slate-50 px-2 py-1 rounded inline-block text-xs">
              {category.replace(/_/g, ' ')}
            </p>

            {/* 1. ROOM SUMMARY */}
            {category === 'room_summary' && (
              <div className="grid grid-cols-2 gap-2 pl-2">
                {Object.entries(details).map(([k, v]) => {
                  if (typeof v === 'object') return null; // Skip arrays/lists
                  return (
                    <div key={k} className="flex justify-between text-xs bg-slate-50/50 p-1.5 rounded">
                      <span className="text-slate-500 capitalize">{k.replace(/_/g, ' ')}</span>
                      <span className="font-medium text-slate-900">{v}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 2. GEOMETRY DIFF */}
            {category === 'geometry_diff' && (
              <div className="pl-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Status</span>
                  <span className={`font-medium ${details.status === 'OK' ? 'text-green-600 font-bold' : 'text-amber-600 font-bold'}`}>
                    {details.status}
                  </span>
                </div>
                {details.requirement_text && (
                  <p className="text-xs text-slate-600 mt-1 italic p-2 bg-slate-50 rounded">
                    "{details.requirement_text}"
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
        {/* If no relevant keys found but object exists */}
        {Object.keys(summary).filter(k => relevantKeys.includes(k)).length === 0 && (
          <p className="text-xs text-slate-400">Detailed geometry data processed.</p>
        )}
      </div>
    );
  };

  const renderRecursiveMaterial = (value, depth = 0) => {
    if (value === null || value === undefined) return <span className="text-slate-400 italic">N/A</span>;

    // 1. Primitive: Render String/Number
    if (typeof value !== 'object') {
      return <span className="text-slate-600 font-medium text-xs leading-relaxed">{String(value)}</span>;
    }

    // 2. Array: Render Tags
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-slate-400 text-xs">-</span>;
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((item, idx) => (
            <span key={idx} className="bg-blue-50 border border-blue-100 px-2 py-1 rounded-md text-blue-700 font-medium" style={{ fontSize: '11px' }}>
              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
            </span>
          ))}
        </div>
      );
    }

    // 3. Object: Semantic Grid Rendering (Unified Box Layout)
    return (
      <div className={`grid gap-3 w-full ${depth === 0 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
        {Object.entries(value).map(([k, v]) => {
          // Determine if this item should span full width (e.g. if it's an object with many keys)
          const isComplexObject = typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v).length > 2;
          const colSpan = isComplexObject ? 'col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4' : 'col-span-1';

          return (
            <div key={k} className={`bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden flex flex-col ${colSpan}`}>
              {/* Heading */}
              <div className="bg-gradient-to-r from-indigo-50 to-white px-3 py-2 border-b border-indigo-50 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                <span className="text-lg font-extrabold text-slate-900 tracking-wide truncate" title={k}>
                  {k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>

              {/* Content */}
              <div className="p-3 flex-1 flex flex-col justify-center">
                {renderRecursiveMaterial(v, depth + 1)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPhase7Narrative = (narrative) => {
    if (!narrative) return null;
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-white p-6 border-b border-indigo-100/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-indigo-100 flex items-center justify-center ring-4 ring-indigo-50">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">AI Strategy Report</h2>
              <p className="text-sm text-slate-500 font-medium">Comprehensive project assessment & strategic roadmap</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Executive Summary & Assessment */}
          <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="flex items-center gap-2 font-bold text-slate-900 mb-2 text-sm uppercase tracking-wide">
                  <FileText className="w-4 h-4 text-slate-500" /> Executive Summary
                </h3>
                <div className="text-sm text-slate-700 leading-relaxed pl-6 border-l-2 border-slate-300">
                  {narrative?.executive_summary}
                </div>
              </div>

              {(narrative?.feasibility_assessment || narrative?.functional_compatibility) && <div className="border-t border-slate-200 pt-3" />}

              {narrative?.feasibility_assessment && (
                <div>
                  <h3 className="font-bold text-slate-900 mb-1 text-xs uppercase tracking-wide opacity-70">Feasibility Assessment</h3>
                  <p className="text-sm text-slate-700 font-medium bg-white p-3 rounded-lg border border-slate-100 shadow-sm inline-block">
                    {narrative.feasibility_assessment}
                  </p>
                </div>
              )}

              {narrative?.functional_compatibility && (
                <div>
                  <h3 className="font-bold text-slate-900 mb-1 text-xs uppercase tracking-wide opacity-70">Functional Compatibility</h3>
                  <p className="text-sm text-slate-600">{narrative.functional_compatibility}</p>
                </div>
              )}
            </div>
          </div>

          {/* Project Roadmap */}
          {Array.isArray(narrative?.step_by_step_process) && narrative.step_by_step_process.length > 0 && (
            <div className="space-y-5">
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                <ChevronDown className="w-4 h-4 text-indigo-600" /> Project Roadmap
              </h3>
              <div className="relative border-l-2 border-indigo-100 pl-8 space-y-8 ml-10 py-2">
                {narrative.step_by_step_process.map((step, idx) => (
                  <div key={idx} className="relative group">
                    <span className="absolute top-6 w-5 h-5 rounded-full bg-indigo-500 border-4 border-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-200 z-10" style={{ left: '-41px' }} />
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200">

                      <div className="mb-4">
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-1">{step?.step_number}</span>
                        <h4 className="font-bold text-slate-800 text-lg leading-tight">{step?.title}</h4>
                      </div>

                      <div className="flex flex-wrap gap-2.5 mb-5">
                        {Array.isArray(step?.sub_tasks) && step.sub_tasks.map((t, i) => (
                          <span key={i} className="px-3.5 py-1.5 bg-slate-50 text-slate-700 text-xs font-medium rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors">
                            {t}
                          </span>
                        ))}
                      </div>

                      {step?.expected_outcome && (
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-start gap-4 mt-auto">
                          <div className="mt-0.5 min-w-[18px]">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <span className="block text-[11px] uppercase font-bold text-indigo-400 mb-1">Outcome</span>
                            <p className="text-sm text-indigo-900 font-medium leading-relaxed">{step.expected_outcome}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Risks & Issues Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.isArray(narrative?.critical_issues) && narrative.critical_issues.length > 0 && (
              <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100 hover:border-red-200 transition-colors h-full">
                <h3 className="font-bold text-red-800 mb-5 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  Critical Issues
                </h3>
                <ul className="space-y-3">
                  {narrative.critical_issues.map((issue, i) => (
                    <li key={i} className="text-xs text-red-700 leading-relaxed flex items-start gap-3 bg-white/50 p-2 rounded-lg">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 shadow-sm" />
                      {typeof issue === 'string' ? issue : JSON.stringify(issue)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {Array.isArray(narrative?.key_risks) && narrative.key_risks.length > 0 && (
              <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 hover:border-amber-200 transition-colors h-full">
                <h3 className="font-bold text-amber-800 mb-5 flex items-center gap-2 text-sm uppercase tracking-wide">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  Key Risks
                </h3>
                <ul className="space-y-3">
                  {narrative.key_risks.map((risk, i) => (
                    <li key={i} className="text-xs text-amber-900 leading-relaxed flex items-start gap-3 bg-white/50 p-2 rounded-lg">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 shadow-sm" />
                      {typeof risk === 'string' ? risk : JSON.stringify(risk)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Structural & Room Analysis (Two Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Structural Considerations */}
            {narrative?.structural_considerations && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" /> Structural Considerations
                </h3>
                <div className="text-xs text-slate-600 leading-relaxed">
                  {typeof narrative.structural_considerations === 'string' ? (
                    <p className="whitespace-pre-line">{narrative.structural_considerations}</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(narrative.structural_considerations).map(([k, v]) => (
                        <div key={k} className="p-2 bg-slate-50 rounded border border-slate-100">
                          <span className="font-bold text-slate-700 capitalize block mb-1">{k.replace(/_/g, ' ')}</span>
                          <span className="text-slate-600">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Detailed Room Analysis */}
            {Array.isArray(narrative?.detailed_room_analysis) && narrative.detailed_room_analysis.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-slate-400" /> Room Analysis
                </h3>
                <div className="flex flex-wrap gap-2">
                  {narrative.detailed_room_analysis.map((room, i) => (
                    <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors">
                      {typeof room === 'string' ? room : JSON.stringify(room)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Documentation & Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100 hover:shadow-sm transition-all">
              {Array.isArray(narrative?.documentation_requirements) && narrative.documentation_requirements.length > 0 && (
                <div>
                  <h3 className="font-bold text-indigo-900 mb-4 text-sm uppercase tracking-wide">Documentation Requirements</h3>
                  <ul className="space-y-2">
                    {narrative.documentation_requirements.map((doc, i) => (
                      <li key={i} className="text-xs text-indigo-800 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        {typeof doc === 'string' ? doc : JSON.stringify(doc)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {narrative?.budget_estimates && (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100 hover:shadow-sm transition-all">
                <h3 className="font-bold text-indigo-900 mb-4 text-sm uppercase tracking-wide">Budget Estimates</h3>
                <div className="text-xs text-indigo-800 font-medium bg-white/50 p-4 rounded-xl border border-indigo-100">
                  {typeof narrative.budget_estimates === 'string' ? narrative.budget_estimates : (
                    <div className="space-y-2">
                      {Object.entries(narrative.budget_estimates).map(([k, v]) => (
                        <div key={k} className="flex justify-between border-b border-indigo-200/30 pb-2 last:border-0 last:pb-0">
                          <span className="capitalize opacity-80">{k.replace(/_/g, ' ')}</span>
                          <span className="font-bold text-indigo-900">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Recommended Actions */}
          {narrative?.recommended_actions && (
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 hover:shadow-sm transition-all">
              <h3 className="font-bold text-emerald-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                </div>
                Recommended Actions
              </h3>
              <p className="text-sm text-emerald-800 leading-relaxed font-medium">{narrative.recommended_actions}</p>
            </div>
          )}

          {/* Material Recommendations */}
          {narrative?.material_recommendations_by_space && Object.keys(narrative.material_recommendations_by_space).length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100/60 shadow-sm">
              <h3 className="font-bold text-blue-900 mb-5 text-sm uppercase tracking-wide flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                </div>
                Material Specifications ({Object.keys(narrative.material_recommendations_by_space).length})
              </h3>

              <div className={`grid gap-4 ${Object.keys(narrative.material_recommendations_by_space).length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                {Object.entries(narrative.material_recommendations_by_space).map(([space, rec], idx) => (
                  <div key={idx} className="bg-white rounded-xl border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-100">
                      <p className="text-lg font-extrabold text-slate-900 tracking-tight truncate" title={space}>
                        {space.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1">
                      {typeof rec === 'string' ? (
                        <p className="text-xs text-slate-600 font-medium">{rec}</p>
                      ) : (
                        <div className="space-y-4">
                          {Object.entries(rec).map(([k, v]) => (
                            <div key={k} className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden group">
                              <div className="bg-gradient-to-r from-indigo-50 to-white px-3 py-2 border-b border-indigo-50 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 group-hover:bg-indigo-600 transition-colors"></div>
                                <span className="text-lg font-extrabold text-slate-900 tracking-wide truncate">
                                  {k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                              </div>
                              <div className="p-3">
                                {renderRecursiveMaterial(v)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>


    );
  };


  const renderScoring = () => {
    if (!uiView?.scoring) return null;
    const { compliance_score, approval_probability, readiness } = uiView.scoring;

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
            {/* Watermark Icon */}
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
            {/* Watermark Icon */}
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
                <span className={`text-2xl font-black px-3 py-1 rounded-lg ${readiness.readiness_level === 'Ready' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
            {/* Watermark Icon */}
            <div style={{ position: 'absolute', bottom: '-15px', right: '-15px', opacity: 0.1, zIndex: 0, pointerEvents: 'none' }}>
              <FileText className="text-emerald-600" style={{ width: '100px', height: '100px' }} />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderComplianceDetails = () => {
    return (
      <div className="space-y-6">

        {/* User Input Warnings */}
        {ai?.user_inputs_received?.floor_detection_warning && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl shadow-sm">
            <div className="flex items-start gap-3">
              <div className="mt-0.5"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
              <div>
                <h3 className="text-amber-900 font-bold text-sm">Input Overridden</h3>
                <p className="text-amber-800 text-xs mt-1">{ai.user_inputs_received.floor_detection_warning}</p>
              </div>
            </div>
          </div>
        )}

        {/* Planning Department */}
        {uiView?.planning_department && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" /> Planning Department
            </h2>
            {uiView.planning_department.detected_changes?.map((change, i) => (
              <div key={i} className="mb-3 last:mb-0 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800 text-sm">{change.type?.replace(/_/g, ' ')}</span>
                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">Violation</span>
                </div>
                <div className="flex gap-4 text-xs text-slate-600 mt-2">
                  <div>Required: <span className="font-bold text-slate-900">{change.required}</span></div>
                  <div>Current: <span className="font-bold text-red-600">{change.current}</span></div>
                </div>
              </div>
            ))}
            {(!uiView.planning_department.detected_changes || uiView.planning_department.detected_changes.length === 0) && (
              <p className="text-sm text-slate-500 italic">No planning issues detected.</p>
            )}
          </div>
        )}

        {/* Authority Awareness (Upsell) */}
        {uiView?.authorities_awareness && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl shadow-sm border border-indigo-100 p-6">
            <h2 className="text-indigo-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" /> Additional Authority Insights
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {/* Violations */}
              {uiView.authorities_awareness.violation_notices && Object.entries(uiView.authorities_awareness.violation_notices).map(([auth, notice]) => (
                notice.has_violations && (
                  <div key={auth} className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{auth} - {notice.violation_count} Violations Detected</h4>
                      <p className="text-xs text-slate-600 mt-1">{notice.casual_message}</p>
                      {notice.critical_issues && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {notice.critical_issues.map((iss, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-0.5 bg-red-50 text-red-700 rounded border border-red-100">{iss}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              ))}

              {/* Permits */}
              {uiView.authorities_awareness.permit_notices && Object.entries(uiView.authorities_awareness.permit_notices).map(([auth, notice]) => (
                notice.permit_required && (
                  <div key={auth} className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{auth} Permit Required</h4>
                      <p className="text-xs text-slate-600 mt-1">{notice.casual_message}</p>
                      {notice.permit_types && (
                        <ul className="mt-2 text-xs text-slate-700 list-disc pl-4">
                          {notice.permit_types.map((p, idx) => <li key={idx}>{p}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* AI Reasoning (Rules Breakdown) */}
        {uiView?.ai_reasoning?.rule_explanations && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-slate-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-slate-700" /> Detailed Rule Validation
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {Object.values(uiView.ai_reasoning.rule_explanations).map((rule, idx) => (
                <div key={idx} className={`p-3 rounded-xl border ${rule.status === 'PASS' ? 'bg-green-50 border-green-200' :
                  rule.status === 'FAIL' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'
                  }`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-xs text-slate-800">{rule.rule_id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${rule.status === 'PASS' ? 'bg-green-100 text-green-700' :
                      rule.status === 'FAIL' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'
                      }`}>{rule.status.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{rule.summary}</p>
                  <p className="text-[10px] text-slate-400 mt-1 italic">{rule.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-8 space-y-5 md:space-y-8">

      {/* Detailed Claude Analysis Section - Now in Custom Modal */}
      {claudeLikeData && (
        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={() => setShowComplianceModal(true)}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02]"
          >
            <FileText className="w-5 h-5" />
            View Detailed Compliance Report
          </Button>

          <ComplianceReportModal
            isOpen={showComplianceModal}
            onClose={() => setShowComplianceModal(false)}
            data={claudeLikeData}
          />
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl text-slate-900 mb-1">AI Analysis Results</h1>
        <p className="text-slate-600 text-xs sm:text-sm md:text-base">
          Intelligent analysis of your construction approval requirements
        </p>
      </div>

      {/* ──────── TOP STATUS STRIP (always visible at top on ALL screens) ──────── */}

      {/* Feasibility Status - Full Width */}
      {uiView?.feasibility_status && (
        <div
          className="rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg text-white"
          style={{
            background: getFeasibilityStatusStyle(uiView.feasibility_status.status).background
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
                  {uiView.feasibility_status.message || `Analysis completed in ${uiView.feasibility_status.estimated_timeline_days || '2-3'} seconds`}
                </p>
              </div>
            </div>
            <div className="px-3 sm:px-4 py-1.5 bg-white/20 rounded-full text-xs sm:text-sm font-semibold self-start sm:self-center">
              {getFeasibilityStatusStyle(uiView.feasibility_status.status).label}
            </div>
          </div>
          {uiView.feasibility_status.detailed_message && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
              <p className="text-white text-xs sm:text-sm leading-relaxed">
                {uiView.feasibility_status.detailed_message}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats Dashboard - Full Width */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {/* Total Violations */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-red-200">
          <div className="flex items-center justify-between mb-1">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
            <span className="text-xl sm:text-2xl font-bold text-red-700">{uiView?.total_violations ?? 0}</span>
          </div>
          <p className="text-[11px] sm:text-xs text-red-600 font-medium">Violations</p>
        </div>

        {/* Documents Required */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-1">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            <span className="text-xl sm:text-2xl font-bold text-blue-700">
              {uiView?.total_documents ?? 0}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-blue-600 font-medium">Documents</p>
        </div>

        {/* Authorities */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-1">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            <span className="text-xl sm:text-2xl font-bold text-purple-700">{uiView?.total_authorities ?? 0}</span>
          </div>
          <p className="text-[11px] sm:text-xs text-purple-600 font-medium">Authorities</p>
        </div>

        {/* Total NOCs */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-amber-200">
          <div className="flex items-center justify-between mb-1">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
            <span className="text-xl sm:text-2xl font-bold text-amber-700">{uiView?.total_nocs ?? 0}</span>
          </div>
          <p className="text-[11px] sm:text-xs text-amber-600 font-medium">Total NOCs</p>
        </div>

        {/* Total Rooms */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-green-200">
          <div className="flex items-center justify-between mb-1">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            <span className="text-xl sm:text-2xl font-bold text-green-700">{uiView?.total_rooms ?? 0}</span>
          </div>
          <p className="text-[11px] sm:text-xs text-green-600 font-medium">Total Rooms</p>
        </div>
      </div>

      {/* ──────── MAIN GRID ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">

        {/* ---------- LEFT PANEL ---------- */}
        <div className="lg:col-span-1 space-y-4 sm:space-y-5 md:space-y-6">

          {/* Project Summary has been moved to the top Project Info Bar */}

          {/* Requirements */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl sm:rounded-3xl border border-blue-200 p-4 sm:p-6">
            <h3 className="text-sm sm:text-base text-slate-900 mb-2 sm:mb-3">Client Requirements</h3>
            {requirementText ? (
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {requirementText}
              </p>
            ) : (
              <div className="text-sm text-slate-500 italic space-y-2">
                <p>No specific requirements text provided.</p>
                {projectData?.requirement_file && (
                  <p className="text-xs">📎 Requirement file uploaded: {projectData.requirement_file.split('/').pop()}</p>
                )}
              </div>
            )}
          </div>

          {/* Extracted Drawing Info */}
          <div ref={extractedInfoRef} className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-3 sm:space-y-4">
            <h3 className="text-sm sm:text-base text-slate-900">Extracted Drawing Info</h3>

            {/* Priority: ui_view.extracted_drawing_info */}
            {uiView?.extracted_drawing_info ? (
              (() => {
                const entries = Object.entries(uiView.extracted_drawing_info).sort(([, valA], [, valB]) => {
                  const isEmpty = (v) => {
                    if (v === null || v === undefined) return true;
                    if (v === 0) return true;
                    if (v === "") return true;
                    if (Array.isArray(v) && v.length === 0) return true;
                    if (typeof v === 'object' && v !== null && Object.keys(v).length === 0) return true;
                    return false;
                  };
                  // Filled first (0), Empty lsat (1)
                  return (isEmpty(valA) ? 1 : 0) - (isEmpty(valB) ? 1 : 0);
                });

                // Calculate optimal split index to prevent grid gaps
                let splitIndex = 6;
                let currentSlots = 0;
                for (let i = 0; i < entries.length; i++) {
                  const isComplex = typeof entries[i][1] === 'object' && entries[i][1] !== null;
                  currentSlots += isComplex ? 2 : 1;
                  // Stop if we have at least 6 items AND the grid row is full (even slots)
                  if (i >= 5 && currentSlots % 2 === 0) {
                    splitIndex = i + 1;
                    break;
                  }
                }
                // If we ran out of items, just show all
                if (splitIndex > entries.length) splitIndex = entries.length;

                const firstSix = entries.slice(0, splitIndex);
                const rest = entries.slice(splitIndex);
                const hasMore = rest.length > 0;

                const renderValue = (val) => {
                  if (val === null || val === undefined) return <span className="text-slate-400 text-sm">N/A</span>;
                  if (typeof val === 'boolean') return <span className="text-sm">{val ? 'Yes' : 'No'}</span>;

                  if (Array.isArray(val)) {
                    if (val.length === 0) return <span className="text-slate-400 text-xs">None</span>;
                    if (typeof val[0] !== 'object') {
                      return <span className="text-sm">{val.join(', ')}</span>;
                    }
                    return (
                      <div className="flex flex-col gap-2 mt-2 w-full">
                        {val.map((item, i) => (
                          <div key={i} className="bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/50">
                            {renderValue(item)}
                          </div>
                        ))}
                      </div>
                    );
                  }

                  if (typeof val === 'object') {
                    return (
                      <div className="flex flex-col gap-1 mt-2 w-full bg-slate-100/50 p-2 rounded-lg border border-slate-100">
                        {Object.entries(val).map(([k, v]) => (
                          <div key={k} className="flex justify-between items-start text-xs border-b border-slate-200/50 pb-1 last:border-0 last:pb-0 gap-3">
                            <span className="text-slate-500 font-medium shrink-0">
                              {k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </span>
                            <span className="text-slate-900 font-semibold text-right break-words flex-1">{renderValue(v)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }

                  return <span className="">{val}{typeof val === 'number' && ' '}</span>;
                };

                return (
                  <Collapsible
                    open={showAllDrawingInfo}
                    onOpenChange={(open) => {
                      setShowAllDrawingInfo(open);
                      if (!open) {
                        extractedInfoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="space-y-4"
                  >
                    {/* First 6 items - Always visible */}
                    <div className="grid grid-cols-2 gap-3 transition-all duration-300">
                      {firstSix.map(([key, value]) => {
                        const label = key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
                        const isComplex = typeof value === 'object' && value !== null;
                        return (
                          <div
                            key={key}
                            className={`p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors flex flex-col justify-between h-full`}
                            style={{ gridColumn: isComplex ? '1 / -1' : 'auto' }}
                          >
                            <p className="text-xs text-slate-500 mb-1">{label}</p>
                            <div className={`${isComplex ? 'w-full' : 'text-lg font-bold text-slate-900'} break-words`}>
                              {renderValue(value)}
                              {!isComplex && typeof value === 'number' && key.includes('area') && ' m²'}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Remaining items - Collapsible */}
                    {hasMore && (
                      <>
                        <CollapsibleContent className="overflow-hidden collapsible-content">
                          <div className="grid grid-cols-2 gap-3 pt-3">
                            {rest.map(([key, value]) => {
                              const label = key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
                              const isComplex = typeof value === 'object' && value !== null;
                              return (
                                <div
                                  key={key}
                                  className={`p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors flex flex-col justify-between h-full`}
                                  style={{ gridColumn: isComplex ? '1 / -1' : 'auto' }}
                                >
                                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                                  <div className={`${isComplex ? 'w-full' : 'text-lg font-bold text-slate-900'} break-words`}>
                                    {renderValue(value)}
                                    {!isComplex && typeof value === 'number' && key.includes('area') && ' m²'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CollapsibleContent>

                        <div className="flex justify-center pt-2">
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-300"
                            >
                              {showAllDrawingInfo ? (
                                <>
                                  View Less <ChevronDown className="w-4 h-4 rotate-180 transition-transform duration-300" />
                                </>
                              ) : (
                                <>
                                  View More <ChevronDown className="w-4 h-4 transition-transform duration-300" />
                                </>
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                      </>
                    )}
                  </Collapsible>
                );
              })()
            ) : dxfSummary ? (
              renderDxfSummary(dxfSummary)
            ) : (
              <p className="text-sm text-slate-500 italic">No drawing info extracted yet.</p>
            )}
          </div>

          {/* ---------- NEEDS CLARIFICATION (User Action Required) ---------- */}
          {needsClarification && needsClarification.length > 0 && (
            <div className="bg-amber-50 rounded-2xl sm:rounded-3xl border-2 border-amber-300 p-4 sm:p-6 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                <h3 className="text-sm sm:text-base text-amber-900 font-bold">Needs Clarification</h3>
              </div>
              <p className="text-xs text-amber-700">Please provide additional information for these items:</p>
              <ul className="space-y-2">
                {needsClarification.map((item, idx) => {
                  const parts = typeof item === 'string' ? item.split(':') : [];
                  const authority = parts[0]?.trim() || '';
                  const issue = parts[1]?.trim() || item;

                  return (
                    <li key={idx} className="flex items-start gap-2 text-xs bg-white p-2 rounded-lg border border-amber-200">
                      <span className="text-amber-600 font-bold mt-0.5">⚠</span>
                      <div className="flex-1">
                        {authority && <span className="font-semibold text-amber-900">{authority}: </span>}
                        <span className="text-slate-700">{issue}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* ---------- ROOM ANALYSIS (Utility & Open Areas) ---------- */}
          {dxfSummary?.room_summary && (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-3 sm:space-y-4">
              <h3 className="text-sm sm:text-base text-slate-900">Room Analysis</h3>

              {/* Utility Rooms */}
              {dxfSummary.room_summary.utility_rooms && dxfSummary.room_summary.utility_rooms.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Utility Rooms ({dxfSummary.room_summary.utility_rooms.length})
                  </h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                    {dxfSummary.room_summary.utility_rooms.map((room, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-blue-50 p-2 rounded border border-blue-100">
                        <span className="font-medium text-blue-900 capitalize">{room.label || room.id}</span>
                        <span className="text-blue-600">{(room.area / 1000000).toFixed(1)} m²</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Open Areas */}
              {dxfSummary.room_summary.open_areas && dxfSummary.room_summary.open_areas.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Open Areas ({dxfSummary.room_summary.open_areas.length})
                  </h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                    {dxfSummary.room_summary.open_areas.map((area, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-green-50 p-2 rounded border border-green-100">
                        <span className="font-medium text-green-900">{area.label || area.id}</span>
                        <span className="text-green-600">{(area.area / 1000).toFixed(1)} m²</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------- GEOMETRY CHANGES (Rooms Added/Removed/Modified) ---------- */}
          {dxfSummary?.geometry_diff && (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-3">
              <h3 className="text-sm sm:text-base text-slate-900">Geometry Changes</h3>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-lg font-bold text-green-600">{dxfSummary.geometry_diff.rooms_added?.length || 0}</p>
                  <p className="text-[10px] text-green-700">Added</p>
                </div>
                <div className="p-2 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-lg font-bold text-red-600">{dxfSummary.geometry_diff.rooms_removed?.length || 0}</p>
                  <p className="text-[10px] text-red-700">Removed</p>
                </div>
                <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-lg font-bold text-amber-600">{dxfSummary.geometry_diff.rooms_modified?.length || 0}</p>
                  <p className="text-[10px] text-amber-700">Modified</p>
                </div>
              </div>

              {dxfSummary.geometry_diff.hints && (
                <div className="space-y-1 mt-3">
                  <p className="text-xs font-semibold text-slate-700">Quick Hints:</p>
                  {dxfSummary.geometry_diff.hints.balcony_added && (
                    <p className="text-xs text-green-600">✓ Balcony added</p>
                  )}
                  {dxfSummary.geometry_diff.hints.bathroom_added && (
                    <p className="text-xs text-green-600">✓ Bathroom added</p>
                  )}
                  {dxfSummary.geometry_diff.hints.openings_added_count > 0 && (
                    <p className="text-xs text-blue-600">+ {dxfSummary.geometry_diff.hints.openings_added_count} openings added</p>
                  )}
                </div>
              )}
            </div>
          )}


          {/* Uploaded Documents (Thumbnails Only) */}
          {/* <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-slate-900 mb-4">Uploaded Documents</h3>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="aspect-square rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-slate-400" />
                </div>
              ))}
            </div>
          </div> */}
        </div>

        {/* ---------- RIGHT PANEL ---------- */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5 md:space-y-6">

          {/* Quick Stats and Feasibility Status are now rendered above the grid (mobile-first top section) */}

          {renderScoring()}

          {/* ---------- AUTHORITIES INVOLVED (from ui_view) ---------- */}
          {uiView?.authorities && Array.isArray(uiView.authorities) && uiView.authorities.length > 0 && (
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg text-slate-900 mb-3 sm:mb-4">Authorities Involved</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {(() => {
                  const urlAuth = searchParams.get('authority');
                  let displayAuthorities = [...uiView.authorities];

                  if (urlAuth) {
                    const idx = displayAuthorities.findIndex(a => a.authority === urlAuth);
                    if (idx > 0) {
                      const [item] = displayAuthorities.splice(idx, 1);
                      displayAuthorities.unshift(item);
                    }
                  }

                  return displayAuthorities.map((auth, idx) => {
                    const meta = authorityMeta[auth.authority] || {
                      label: auth.authority,
                      color: "from-slate-500 to-slate-700",
                      icon: Building2
                    };
                    const Icon = meta.icon;

                    const isSelected = selectedAuthority === auth.authority;

                    // Debug logging
                    console.log(`${auth.authority}:`, {
                      user_selected: auth.user_selected,
                      additional_detected: auth.additional_detected
                    });

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedAuthority(auth.authority)}
                        className={`rounded-2xl border-2 p-4 transition-all cursor-pointer relative ${isSelected
                          ? 'border-indigo-500 bg-indigo-50 shadow-lg scale-105'
                          : auth.required
                            ? 'border-blue-300 bg-blue-50 hover:shadow-md hover:scale-102'
                            : 'border-slate-200 bg-slate-50 hover:shadow-md hover:scale-102'
                          }`}
                      >

                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center shadow-md ${isSelected ? 'ring-4 ring-indigo-300' : ''
                            }`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-slate-900">{auth.authority}</h3>
                              {auth.user_selected && (
                                <span
                                  className="px-2 py-0.5 text-white text-xs rounded-full font-semibold shadow-sm"
                                  style={{ backgroundColor: '#3B82F6' }}
                                >
                                  User
                                </span>
                              )}
                              {auth.additional_detected && (
                                <span
                                  className="px-2 py-0.5 text-white text-xs rounded-full font-semibold shadow-sm"
                                  style={{ backgroundColor: '#9333EA' }}
                                >
                                  AI
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600">{meta.label}</p>
                          </div>
                          {isSelected && (
                            <div className="text-indigo-600 text-2xl font-bold">✓</div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <div className="bg-white rounded-lg p-2 border border-slate-200">
                            <p className="text-xs text-slate-500">Documents</p>
                            <p className="text-lg font-bold text-slate-900">{auth.document_count || 0}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 border border-slate-200">
                            <p className="text-xs text-slate-500">NOCs</p>
                            <p className="text-lg font-bold text-slate-900">{auth.noc_count || 0}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                })()}
              </div>
            </div>
          )}



        </div>
      </div>

      {/* ---------- REQUIRED PARAMETER CHANGES (from ui_view) FULL WIDTH ---------- */}
      {uiView?.required_parameter_changes && Object.keys(uiView.required_parameter_changes).length > 0 && (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg text-slate-900">Required Parameter Changes</h2>
            {selectedAuthority && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                Filtered: {selectedAuthority}
              </span>
            )}
          </div>

          {Object.entries(uiView.required_parameter_changes)
            .filter(([authority]) => !selectedAuthority || authority === selectedAuthority)
            .map(([authority, changes]) => {
              if (!Array.isArray(changes) || changes.length === 0) return null;

              const meta = authorityMeta[authority] || {
                label: authority,
                color: "from-slate-500 to-slate-700",
                icon: Building2
              };

              return (
                <div key={authority} className="space-y-3">
                  {/* Authority Header */}
                  <div className={`bg-gradient-to-r ${meta.color} text-white px-3 sm:px-4 py-2 sm:py-3 rounded-xl flex items-center gap-2 flex-wrap`}>
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    <span className="font-bold text-sm sm:text-lg">{authority}</span>
                    <span className="text-xs sm:text-sm opacity-90 hidden sm:inline">- {meta.label}</span>
                    <span className="ml-auto px-2 sm:px-3 py-1 bg-white/20 rounded-full text-xs sm:text-sm font-semibold">
                      {changes.length} {changes.length === 1 ? 'Change' : 'Changes'}
                    </span>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full border-collapse min-w-[480px]">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-semibold text-slate-700 border-b border-slate-200">Parameter</th>
                          <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-semibold text-slate-700 border-b border-slate-200">Current</th>
                          <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-semibold text-slate-700 border-b border-slate-200">Required</th>
                          <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-semibold text-slate-700 border-b border-slate-200">Severity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {changes.map((change, idx) => {
                          const severity = change.severity?.toLowerCase() || 'medium';
                          const severityConfig = {
                            high: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
                            medium: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
                            low: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' }
                          };
                          const config = severityConfig[severity] || severityConfig.medium;

                          return (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 border-b border-slate-100">
                                <div>
                                  <p className="text-sm text-slate-900 font-medium">{change.parameter || 'N/A'}</p>
                                  {change.description && (
                                    <p className="text-xs text-slate-500 mt-1">{change.description}</p>
                                  )}
                                  {change.rule_id && (
                                    <p className="text-xs text-slate-400 mt-0.5">Rule: {change.rule_id}</p>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-sm text-slate-700 border-b border-slate-100">
                                {change.current !== undefined && change.current !== null ? String(change.current) : 'N/A'}
                              </td>
                              <td className="p-3 text-sm text-slate-700 border-b border-slate-100">
                                {change.required !== undefined && change.required !== null ? String(change.required) : 'N/A'}
                              </td>
                              <td className="p-3 border-b border-slate-100">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}>
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

          {/* No Data Message */}
          {selectedAuthority && !uiView.required_parameter_changes[selectedAuthority] && (
            <div className="text-center py-12 text-slate-500">
              <div className="text-5xl mb-3">✅</div>
              <p className="text-lg font-semibold mb-2">No parameter changes required for {selectedAuthority}</p>
              <p className="text-sm">This authority has no compliance issues.</p>
            </div>
          )}
        </div>
      )}
      {/* ---------- AI NARRATIVE STRATEGY REPORT ---------- */}
      {renderPhase7Narrative(phase7Narrative)}

      {/* ---------- ACTIONS (from ui_view) ---------- */}
      {uiView?.actions && (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
            Actions Required
          </h2>

          <div className="space-y-3 sm:space-y-4">
            {/* Status Indicators */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className={`p-3 rounded-xl border ${uiView.actions.can_proceed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                <p className="text-xs text-slate-600 mb-1">Can Proceed</p>
                <p className={`text-lg font-bold ${uiView.actions.can_proceed ? 'text-green-700' : 'text-red-700'
                  }`}>
                  {uiView.actions.can_proceed ? 'Yes' : 'No'}
                </p>
              </div>
              <div className={`p-3 rounded-xl border ${uiView.actions.requires_review ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
                }`}>
                <p className="text-xs text-slate-600 mb-1">Requires Review</p>
                <p className={`text-lg font-bold ${uiView.actions.requires_review ? 'text-amber-700' : 'text-green-700'
                  }`}>
                  {uiView.actions.requires_review ? 'Yes' : 'No'}
                </p>
              </div>
            </div>

            {/* Blocking Issues */}
            {uiView.actions.blocking_issues && uiView.actions.blocking_issues.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="text-red-900 font-semibold mb-2 flex items-center gap-2">
                  <span className="text-red-600">🚫</span>
                  Blocking Issues ({uiView.actions.blocking_issues.length})
                </h3>
                <ul className="space-y-2">
                  {uiView.actions.blocking_issues.map((issue, idx) => (
                    <li key={idx} className="text-sm text-red-800 flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Needs Clarification */}
            {uiView.actions.needs_clarification && uiView.actions.needs_clarification.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="text-amber-900 font-semibold mb-2 flex items-center gap-2">
                  <span className="text-amber-600">⚠️</span>
                  Needs Clarification ({uiView.actions.needs_clarification.length})
                </h3>
                <ul className="space-y-2">
                  {uiView.actions.needs_clarification.map((item, idx) => (
                    <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {renderComplianceDetails()}

      {/* ---------- SEMANTIC ELEMENTS (Safety Critical) ---------- */}
      {dxfSummary?.semantic_elements && (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-base text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
            Building Elements
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {/* Doors */}
            <div className={`p-3 rounded-xl border ${dxfSummary.semantic_elements.summary?.door_count > 0 ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-600">Doors</span>
                <span className={`text-xl font-bold ${dxfSummary.semantic_elements.summary?.door_count > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                  {dxfSummary.semantic_elements.summary?.door_count || 0}
                </span>
              </div>
              {dxfSummary.semantic_elements.summary?.door_count === 0 && (
                <p className="text-[10px] text-slate-500">No doors detected</p>
              )}
            </div>

            {/* Fire Exits */}
            <div className={`p-3 rounded-xl border ${dxfSummary.semantic_elements.summary?.exit_candidate_count === 0 ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-600">Fire Exits</span>
                <span className={`text-xl font-bold ${dxfSummary.semantic_elements.summary?.exit_candidate_count === 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {dxfSummary.semantic_elements.summary?.exit_candidate_count || 0}
                </span>
              </div>
              {dxfSummary.semantic_elements.summary?.exit_candidate_count === 0 && (
                <p className="text-[10px] text-red-600 font-medium">⚠️ Critical Issue</p>
              )}
            </div>

            {/* Stairs */}
            <div className={`p-3 rounded-xl border ${dxfSummary.semantic_elements.summary?.stair_count > 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-600">Stairs</span>
                <span className={`text-xl font-bold ${dxfSummary.semantic_elements.summary?.stair_count > 0 ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {dxfSummary.semantic_elements.summary?.stair_count || 0}
                </span>
              </div>
            </div>

            {/* Corridors */}
            <div className={`p-3 rounded-xl border ${dxfSummary.semantic_elements.summary?.corridor_count > 0 ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-600">Corridors</span>
                <span className={`text-xl font-bold ${dxfSummary.semantic_elements.summary?.corridor_count > 0 ? 'text-purple-600' : 'text-slate-400'}`}>
                  {dxfSummary.semantic_elements.summary?.corridor_count || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- ENHANCED ROOM BREAKDOWN ---------- */}
      {dxfSummary?.room_summary && (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6">
          <h3 className="text-sm sm:text-base text-slate-900 mb-3 sm:mb-4">Room Type Breakdown</h3>

          <div className="space-y-2">
            {/* Total Rooms */}
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-slate-700 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-slate-700">Total Rooms</span>
              </div>
              <span className="text-lg font-bold text-slate-900">{dxfSummary.room_summary.total_rooms || 0}</span>
            </div>

            {/* Washrooms */}
            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚽</span>
                <span className="text-sm font-medium text-blue-700">Washrooms</span>
              </div>
              <span className="text-lg font-bold text-blue-900">{dxfSummary.room_summary.washrooms || 0}</span>
            </div>

            {/* Offices */}
            <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-xl">💼</span>
                <span className="text-sm font-medium text-purple-700">Offices</span>
              </div>
              <span className="text-lg font-bold text-purple-900">{dxfSummary.room_summary.offices || 0}</span>
            </div>

            {/* Bedrooms */}
            {dxfSummary.room_summary.bedrooms !== undefined && (
              <div className="flex items-center justify-between p-2 bg-pink-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛏️</span>
                  <span className="text-sm font-medium text-pink-700">Bedrooms</span>
                </div>
                <span className="text-lg font-bold text-pink-900">{dxfSummary.room_summary.bedrooms || 0}</span>
              </div>
            )}

            {/* Kitchens */}
            {dxfSummary.room_summary.kitchens !== undefined && (
              <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🍳</span>
                  <span className="text-sm font-medium text-orange-700">Kitchens</span>
                </div>
                <span className="text-lg font-bold text-orange-900">{dxfSummary.room_summary.kitchens || 0}</span>
              </div>
            )}

            {/* Utility Rooms */}
            {dxfSummary.room_summary.utility_rooms && dxfSummary.room_summary.utility_rooms.length > 0 && (
              <div className="flex items-center justify-between p-2 bg-teal-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚙️</span>
                  <span className="text-sm font-medium text-teal-700">Utility Rooms</span>
                </div>
                <span className="text-lg font-bold text-teal-900">{dxfSummary.room_summary.utility_rooms.length}</span>
              </div>
            )}
          </div>
        </div>
      )}



      {/* ---------- STRUCTURAL CALCULATIONS ---------- */}
      {structuralCalculations && (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md shrink-0">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-slate-900 font-bold text-base sm:text-xl">Structural Calculations</h2>
              <p className="text-xs text-slate-500">
                Standards: {structuralCalculations.standards || 'BS 8110 / UAE Building Code'}
              </p>
            </div>
          </div>

          {/* Load Analysis */}
          {structuralCalculations.load_analysis && (
            <div className="mb-6">
              <h3 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
                <span className="text-lg">⚖️</span> Load Analysis
              </h3>

              {/* Load Types Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                {/* Dead Load */}
                {structuralCalculations.load_analysis.dead_load && (
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1">Dead Load</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {structuralCalculations.load_analysis.dead_load.per_floor_kpa}
                      <span className="text-sm font-normal text-slate-600 ml-1">kPa</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {structuralCalculations.load_analysis.dead_load.total_kn} kN total
                    </p>
                  </div>
                )}

                {/* Live Load */}
                {structuralCalculations.load_analysis.live_load && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                    <p className="text-xs text-blue-700 mb-1">Live Load</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {structuralCalculations.load_analysis.live_load.per_floor_kpa}
                      <span className="text-sm font-normal text-blue-700 ml-1">kPa</span>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {structuralCalculations.load_analysis.live_load.total_kn} kN total
                    </p>
                  </div>
                )}

                {/* Wind Load */}
                {structuralCalculations.load_analysis.wind_load && (
                  <div className={`p-4 rounded-xl border ${structuralCalculations.load_analysis.wind_load.calculated
                    ? 'bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200'
                    : 'bg-slate-50 border-slate-200'
                    }`}>
                    <p className={`text-xs mb-1 ${structuralCalculations.load_analysis.wind_load.calculated ? 'text-cyan-700' : 'text-slate-500'}`}>
                      Wind Load
                    </p>
                    <p className={`text-2xl font-bold ${structuralCalculations.load_analysis.wind_load.calculated ? 'text-cyan-900' : 'text-slate-400'}`}>
                      {structuralCalculations.load_analysis.wind_load.wind_pressure_kpa}
                      <span className="text-sm font-normal ml-1">kPa</span>
                    </p>
                    {!structuralCalculations.load_analysis.wind_load.calculated && (
                      <p className="text-xs text-slate-400 mt-1">Not calculated</p>
                    )}
                  </div>
                )}

                {/* Seismic Load */}
                {structuralCalculations.load_analysis.seismic_load && (
                  <div className={`p-4 rounded-xl border ${structuralCalculations.load_analysis.seismic_load.calculated
                    ? 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
                    : 'bg-slate-50 border-slate-200'
                    }`}>
                    <p className={`text-xs mb-1 ${structuralCalculations.load_analysis.seismic_load.calculated ? 'text-orange-700' : 'text-slate-500'}`}>
                      Seismic Load
                    </p>
                    <p className={`text-2xl font-bold ${structuralCalculations.load_analysis.seismic_load.calculated ? 'text-orange-900' : 'text-slate-400'}`}>
                      {structuralCalculations.load_analysis.seismic_load.base_shear_kn}
                      <span className="text-sm font-normal ml-1">kN</span>
                    </p>
                    {!structuralCalculations.load_analysis.seismic_load.calculated && (
                      <p className="text-xs text-slate-400 mt-1">Not calculated</p>
                    )}
                  </div>
                )}
              </div>

              {/* Critical Load Combination */}
              {structuralCalculations.load_analysis.critical_combination && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-purple-700 font-semibold mb-1">Critical Load Combination</p>
                      <p className="text-lg font-bold text-purple-900">
                        {structuralCalculations.load_analysis.critical_combination}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-purple-600 mb-1">Maximum Load</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {structuralCalculations.load_analysis.maximum_load_kpa}
                        <span className="text-sm font-normal text-purple-700 ml-1">kPa</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Load Combinations Table */}
              {structuralCalculations.load_analysis.load_combinations && (
                <div className="mt-4 bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-200">
                    <h4 className="text-sm font-bold text-slate-800">Load Combinations</h4>
                  </div>
                  <div className="p-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(structuralCalculations.load_analysis.load_combinations).map(([combo, data]) => (
                        <div key={combo} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                          <span className="text-xs font-mono text-slate-700">{combo}</span>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">{data.total_load_kpa} kPa</p>
                            <p className="text-xs text-slate-600">{data.total_load_kn} kN</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Calculation Assumptions */}
              {structuralCalculations.load_analysis.assumptions && (
                <div className="mt-4 bg-gradient-to-r from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <span>📋</span> Calculation Assumptions
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {structuralCalculations.load_analysis.assumptions.slab_thickness_m !== undefined && (
                      <div>
                        <p className="text-slate-600">Slab Thickness</p>
                        <p className="font-semibold text-slate-900">{structuralCalculations.load_analysis.assumptions.slab_thickness_m} m</p>
                      </div>
                    )}
                    {structuralCalculations.load_analysis.assumptions.material_density_kn_per_m3 !== undefined && (
                      <div>
                        <p className="text-slate-600">Material Density</p>
                        <p className="font-semibold text-slate-900">{structuralCalculations.load_analysis.assumptions.material_density_kn_per_m3} kN/m³</p>
                      </div>
                    )}
                    {structuralCalculations.load_analysis.assumptions.wind_speed_m_per_s !== undefined && (
                      <div>
                        <p className="text-slate-600">Wind Speed</p>
                        <p className="font-semibold text-slate-900">{structuralCalculations.load_analysis.assumptions.wind_speed_m_per_s} m/s</p>
                      </div>
                    )}
                    {structuralCalculations.load_analysis.assumptions.seismic_zone && (
                      <div>
                        <p className="text-slate-600">Seismic Zone</p>
                        <p className="font-semibold text-slate-900">{structuralCalculations.load_analysis.assumptions.seismic_zone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Calculation Method */}
              {structuralCalculations.load_analysis.calculation_method && (
                <div className="mt-3 text-xs text-slate-500 italic">
                  Method: {structuralCalculations.load_analysis.calculation_method}
                </div>
              )}
            </div>
          )}

          {/* Member Design */}
          {structuralCalculations.member_design && (
            <div className="mb-6">
              <h3 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
                <span className="text-lg">🏗️</span> Member Design
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Slab Design */}
                {structuralCalculations.member_design.slab_design && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-slate-800">Slab Design</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${structuralCalculations.member_design.slab_design.status === 'PASS'
                        ? 'bg-green-100 text-green-700'
                        : structuralCalculations.member_design.slab_design.status === 'FAIL'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                        {structuralCalculations.member_design.slab_design.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Required Thickness:</span>
                        <span className="font-semibold text-slate-900">
                          {structuralCalculations.member_design.slab_design.required_thickness_mm} mm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Moment:</span>
                        <span className="font-semibold text-slate-900">
                          {structuralCalculations.member_design.slab_design.moment_knm_per_m} kNm/m
                        </span>
                      </div>
                      {structuralCalculations.member_design.slab_design.shear_kn_per_m !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Shear:</span>
                          <span className="font-semibold text-slate-900">
                            {structuralCalculations.member_design.slab_design.shear_kn_per_m} kN/m
                          </span>
                        </div>
                      )}
                      {structuralCalculations.member_design.slab_design.required_reinforcement_mm2_per_m !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Required Reinforcement:</span>
                          <span className="font-semibold text-slate-900">
                            {structuralCalculations.member_design.slab_design.required_reinforcement_mm2_per_m} mm²/m
                          </span>
                        </div>
                      )}
                      {structuralCalculations.member_design.slab_design.estimated_span_m !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Estimated Span:</span>
                          <span className="font-semibold text-slate-900">
                            {structuralCalculations.member_design.slab_design.estimated_span_m} m
                          </span>
                        </div>
                      )}

                      {/* Deflection Check */}
                      {structuralCalculations.member_design.slab_design.deflection_check && (
                        <div className={`mt-2 p-2 rounded-lg ${structuralCalculations.member_design.slab_design.deflection_check.status === 'PASS'
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                          }`}>
                          <p className="text-xs font-semibold mb-1">Deflection Check: {structuralCalculations.member_design.slab_design.deflection_check.status}</p>
                          {structuralCalculations.member_design.slab_design.deflection_check.actual_deflection_mm !== undefined && (
                            <p className="text-xs text-slate-600">
                              Actual: {structuralCalculations.member_design.slab_design.deflection_check.actual_deflection_mm.toFixed(2)} mm
                            </p>
                          )}
                          {structuralCalculations.member_design.slab_design.deflection_check.allowable_deflection_mm !== undefined && (
                            <p className="text-xs text-slate-600">
                              Allowable: {structuralCalculations.member_design.slab_design.deflection_check.allowable_deflection_mm.toFixed(2)} mm
                            </p>
                          )}
                          {structuralCalculations.member_design.slab_design.deflection_check.ratio !== undefined && (
                            <p className="text-xs text-slate-600">
                              Ratio: {structuralCalculations.member_design.slab_design.deflection_check.ratio.toFixed(2)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Shear Check */}
                      {structuralCalculations.member_design.slab_design.shear_check && (
                        <div className={`mt-2 p-2 rounded-lg ${structuralCalculations.member_design.slab_design.shear_check.status === 'PASS'
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                          }`}>
                          <p className="text-xs font-semibold mb-1">Shear Check: {structuralCalculations.member_design.slab_design.shear_check.status}</p>
                          {structuralCalculations.member_design.slab_design.shear_check.shear_stress_n_per_mm2 !== undefined && (
                            <p className="text-xs text-slate-600">
                              Shear Stress: {structuralCalculations.member_design.slab_design.shear_check.shear_stress_n_per_mm2.toFixed(2)} N/mm²
                            </p>
                          )}
                          {structuralCalculations.member_design.slab_design.shear_check.max_shear_stress_n_per_mm2 !== undefined && (
                            <p className="text-xs text-slate-600">
                              Max Allowed: {structuralCalculations.member_design.slab_design.shear_check.max_shear_stress_n_per_mm2.toFixed(2)} N/mm²
                            </p>
                          )}
                        </div>
                      )}

                      {/* Calculations Details */}
                      {structuralCalculations.member_design.slab_design.calculations && (
                        <div className="mt-2 p-2 bg-slate-50 rounded text-xs">
                          <p className="font-semibold text-slate-700 mb-1">Calculation Details:</p>
                          {structuralCalculations.member_design.slab_design.calculations.concrete_grade && (
                            <p className="text-slate-600">Concrete: {structuralCalculations.member_design.slab_design.calculations.concrete_grade}</p>
                          )}
                          {structuralCalculations.member_design.slab_design.calculations.steel_grade && (
                            <p className="text-slate-600">Steel: {structuralCalculations.member_design.slab_design.calculations.steel_grade}</p>
                          )}
                          {structuralCalculations.member_design.slab_design.calculations.support_type && (
                            <p className="text-slate-600">Support: {structuralCalculations.member_design.slab_design.calculations.support_type}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Beam Design */}
                {structuralCalculations.member_design.beam_design && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-slate-800">Beam Design</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${structuralCalculations.member_design.beam_design.status === 'PASS'
                        ? 'bg-green-100 text-green-700'
                        : structuralCalculations.member_design.beam_design.status === 'FAIL'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                        {structuralCalculations.member_design.beam_design.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Required Depth:</span>
                        <span className="font-semibold text-slate-900">
                          {structuralCalculations.member_design.beam_design.required_depth_mm} mm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Moment:</span>
                        <span className="font-semibold text-slate-900">
                          {structuralCalculations.member_design.beam_design.moment_knm} kNm
                        </span>
                      </div>
                      {structuralCalculations.member_design.beam_design.shear_kn !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Shear:</span>
                          <span className="font-semibold text-slate-900">
                            {structuralCalculations.member_design.beam_design.shear_kn} kN
                          </span>
                        </div>
                      )}
                      {structuralCalculations.member_design.beam_design.required_reinforcement_mm2 !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Required Reinforcement:</span>
                          <span className="font-semibold text-slate-900">
                            {structuralCalculations.member_design.beam_design.required_reinforcement_mm2} mm²
                          </span>
                        </div>
                      )}
                      {structuralCalculations.member_design.beam_design.estimated_span_m !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Estimated Span:</span>
                          <span className="font-semibold text-slate-900">
                            {structuralCalculations.member_design.beam_design.estimated_span_m} m
                          </span>
                        </div>
                      )}

                      {/* Deflection Check */}
                      {structuralCalculations.member_design.beam_design.deflection_check && (
                        <div className={`mt-2 p-2 rounded-lg ${structuralCalculations.member_design.beam_design.deflection_check.status === 'PASS'
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                          }`}>
                          <p className="text-xs font-semibold mb-1">Deflection Check: {structuralCalculations.member_design.beam_design.deflection_check.status}</p>
                          {structuralCalculations.member_design.beam_design.deflection_check.actual_deflection_mm !== undefined && (
                            <p className="text-xs text-slate-600">
                              Actual: {structuralCalculations.member_design.beam_design.deflection_check.actual_deflection_mm.toFixed(2)} mm
                            </p>
                          )}
                          {structuralCalculations.member_design.beam_design.deflection_check.allowable_deflection_mm !== undefined && (
                            <p className="text-xs text-slate-600">
                              Allowable: {structuralCalculations.member_design.beam_design.deflection_check.allowable_deflection_mm.toFixed(2)} mm
                            </p>
                          )}
                          {structuralCalculations.member_design.beam_design.deflection_check.ratio !== undefined && (
                            <p className="text-xs text-slate-600">
                              Ratio: {structuralCalculations.member_design.beam_design.deflection_check.ratio.toFixed(2)}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Shear Check */}
                      {structuralCalculations.member_design.beam_design.shear_check && (
                        <div className={`mt-2 p-2 rounded-lg ${structuralCalculations.member_design.beam_design.shear_check.status === 'PASS'
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                          }`}>
                          <p className="text-xs font-semibold mb-1">Shear Check: {structuralCalculations.member_design.beam_design.shear_check.status}</p>
                          {structuralCalculations.member_design.beam_design.shear_check.shear_stress_n_per_mm2 !== undefined && (
                            <p className="text-xs text-slate-600">
                              Shear Stress: {structuralCalculations.member_design.beam_design.shear_check.shear_stress_n_per_mm2.toFixed(2)} N/mm²
                            </p>
                          )}
                          {structuralCalculations.member_design.beam_design.shear_check.max_shear_stress_n_per_mm2 !== undefined && (
                            <p className="text-xs text-slate-600">
                              Max Allowed: {structuralCalculations.member_design.beam_design.shear_check.max_shear_stress_n_per_mm2.toFixed(2)} N/mm²
                            </p>
                          )}
                        </div>
                      )}

                      {/* Calculations Details */}
                      {structuralCalculations.member_design.beam_design.calculations && (
                        <div className="mt-2 p-2 bg-slate-50 rounded text-xs">
                          <p className="font-semibold text-slate-700 mb-1">Calculation Details:</p>
                          {structuralCalculations.member_design.beam_design.calculations.concrete_grade && (
                            <p className="text-slate-600">Concrete: {structuralCalculations.member_design.beam_design.calculations.concrete_grade}</p>
                          )}
                          {structuralCalculations.member_design.beam_design.calculations.steel_grade && (
                            <p className="text-slate-600">Steel: {structuralCalculations.member_design.beam_design.calculations.steel_grade}</p>
                          )}
                          {structuralCalculations.member_design.beam_design.calculations.load_kn_per_m !== undefined && (
                            <p className="text-slate-600">Load: {structuralCalculations.member_design.beam_design.calculations.load_kn_per_m} kN/m</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Column Design */}
                {structuralCalculations.member_design.column_design && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-slate-800">Column Design</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${structuralCalculations.member_design.column_design.status === 'PASS'
                        ? 'bg-green-100 text-green-700'
                        : structuralCalculations.member_design.column_design.status === 'FAIL'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                        {structuralCalculations.member_design.column_design.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Required Size:</span>
                        <span className="font-semibold text-slate-900">
                          {structuralCalculations.member_design.column_design.required_size_mm} mm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Axial Load:</span>
                        <span className="font-semibold text-slate-900">
                          {structuralCalculations.member_design.column_design.axial_load_kn} kN
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Load Ratio:</span>
                        <span className="font-semibold text-slate-900">
                          {(structuralCalculations.member_design.column_design.load_ratio * 100).toFixed(1)}%
                        </span>
                      </div>
                      {structuralCalculations.member_design.column_design.design_capacity_kn !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Design Capacity:</span>
                          <span className="font-semibold text-slate-900">
                            {structuralCalculations.member_design.column_design.design_capacity_kn} kN
                          </span>
                        </div>
                      )}
                      {structuralCalculations.member_design.column_design.estimated_columns !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Estimated Columns:</span>
                          <span className="font-semibold text-slate-900">
                            {structuralCalculations.member_design.column_design.estimated_columns}
                          </span>
                        </div>
                      )}

                      {/* Slenderness Check */}
                      {structuralCalculations.member_design.column_design.slenderness_check && (
                        <div className={`mt-2 p-2 rounded-lg ${structuralCalculations.member_design.column_design.slenderness_check.status === 'PASS'
                          ? 'bg-green-50 border border-green-200'
                          : structuralCalculations.member_design.column_design.slenderness_check.status === 'FAIL'
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-amber-50 border border-amber-200'
                          }`}>
                          <p className="text-xs font-semibold mb-1">Slenderness Check: {structuralCalculations.member_design.column_design.slenderness_check.status}</p>
                          {structuralCalculations.member_design.column_design.slenderness_check.slenderness_ratio !== undefined && (
                            <p className="text-xs text-slate-600">
                              Slenderness Ratio: {structuralCalculations.member_design.column_design.slenderness_check.slenderness_ratio.toFixed(2)}
                            </p>
                          )}
                          {structuralCalculations.member_design.column_design.slenderness_check.is_short_column !== undefined && (
                            <p className="text-xs text-slate-600">
                              Type: {structuralCalculations.member_design.column_design.slenderness_check.is_short_column ? 'Short Column' : 'Slender Column'}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Calculations Details */}
                      {structuralCalculations.member_design.column_design.calculations && (
                        <div className="mt-2 p-2 bg-slate-50 rounded text-xs">
                          <p className="font-semibold text-slate-700 mb-1">Calculation Details:</p>
                          {structuralCalculations.member_design.column_design.calculations.concrete_grade && (
                            <p className="text-slate-600">Concrete: {structuralCalculations.member_design.column_design.calculations.concrete_grade}</p>
                          )}
                          {structuralCalculations.member_design.column_design.calculations.steel_grade && (
                            <p className="text-slate-600">Steel: {structuralCalculations.member_design.column_design.calculations.steel_grade}</p>
                          )}
                          {structuralCalculations.member_design.column_design.calculations.column_height_m !== undefined && (
                            <p className="text-slate-600">Height: {structuralCalculations.member_design.column_design.calculations.column_height_m} m</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Foundation Design */}
                {structuralCalculations.member_design.foundation_design && (
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-slate-800">Foundation Design</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${structuralCalculations.member_design.foundation_design.status === 'PASS'
                        ? 'bg-green-100 text-green-700'
                        : structuralCalculations.member_design.foundation_design.status === 'FAIL'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                        {structuralCalculations.member_design.foundation_design.status}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Required Bearing:</span>
                        <span className="font-semibold text-slate-900">
                          {structuralCalculations.member_design.foundation_design.required_bearing_capacity_kpa} kPa
                        </span>
                      </div>
                      {structuralCalculations.member_design.foundation_design.remarks && (
                        <p className="text-xs text-slate-600 italic mt-2 p-2 bg-slate-50 rounded">
                          {structuralCalculations.member_design.foundation_design.remarks}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Member Design Summary */}
              <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-indigo-900">Overall Member Design Status</h4>
                  {structuralCalculations.member_design.overall_status && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${structuralCalculations.member_design.overall_status === 'PASS'
                      ? 'bg-green-100 text-green-700'
                      : structuralCalculations.member_design.overall_status === 'FAIL'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                      }`}>
                      {structuralCalculations.member_design.overall_status}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mt-3">
                  {structuralCalculations.member_design.calculation_method && (
                    <div>
                      <p className="text-indigo-700">Calculation Method</p>
                      <p className="font-semibold text-indigo-900">{structuralCalculations.member_design.calculation_method}</p>
                    </div>
                  )}
                  {structuralCalculations.member_design.standards && (
                    <div>
                      <p className="text-indigo-700">Standards</p>
                      <p className="font-semibold text-indigo-900">{structuralCalculations.member_design.standards}</p>
                    </div>
                  )}
                  {structuralCalculations.member_design.load_combination_used && (
                    <div>
                      <p className="text-indigo-700">Load Combination Used</p>
                      <p className="font-semibold text-indigo-900">{structuralCalculations.member_design.load_combination_used}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Serviceability Checks */}
          {structuralCalculations.serviceability_checks && (
            <div>
              <h3 className="text-slate-800 font-bold mb-4 flex items-center gap-2">
                <span className="text-lg">✅</span> Serviceability Checks
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Deflection */}
                {structuralCalculations.serviceability_checks.deflection && (
                  <div className={`p-4 rounded-xl border ${structuralCalculations.serviceability_checks.deflection.status === 'PASS'
                    ? 'bg-green-50 border-green-200'
                    : structuralCalculations.serviceability_checks.deflection.status === 'FAIL'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-amber-50 border-amber-200'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-800 text-sm">Deflection</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${structuralCalculations.serviceability_checks.deflection.status === 'PASS'
                        ? 'bg-green-100 text-green-700'
                        : structuralCalculations.serviceability_checks.deflection.status === 'FAIL'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                        {structuralCalculations.serviceability_checks.deflection.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      {structuralCalculations.serviceability_checks.deflection.remarks}
                    </p>
                    {structuralCalculations.serviceability_checks.deflection.live_load_deflection_ratio !== undefined && (
                      <p className="text-xs text-slate-600 mt-1">
                        Live Load Ratio: {structuralCalculations.serviceability_checks.deflection.live_load_deflection_ratio.toFixed(2)}
                      </p>
                    )}
                    {structuralCalculations.serviceability_checks.deflection.total_load_deflection_ratio !== undefined && (
                      <p className="text-xs text-slate-600">
                        Total Load Ratio: {structuralCalculations.serviceability_checks.deflection.total_load_deflection_ratio.toFixed(2)}
                      </p>
                    )}
                    {structuralCalculations.serviceability_checks.deflection.estimated_deflection_mm !== undefined && (
                      <p className="text-xs text-slate-600">
                        Estimated Deflection: {structuralCalculations.serviceability_checks.deflection.estimated_deflection_mm.toFixed(2)} mm
                      </p>
                    )}
                    {structuralCalculations.serviceability_checks.deflection.estimated_span_m !== undefined && (
                      <p className="text-xs text-slate-600">
                        Estimated Span: {structuralCalculations.serviceability_checks.deflection.estimated_span_m.toFixed(2)} m
                      </p>
                    )}
                  </div>
                )}

                {/* Vibration */}
                {structuralCalculations.serviceability_checks.vibration && (
                  <div className={`p-4 rounded-xl border ${structuralCalculations.serviceability_checks.vibration.status === 'PASS'
                    ? 'bg-green-50 border-green-200'
                    : structuralCalculations.serviceability_checks.vibration.status === 'FAIL'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-amber-50 border-amber-200'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-800 text-sm">Vibration</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${structuralCalculations.serviceability_checks.vibration.status === 'PASS'
                        ? 'bg-green-100 text-green-700'
                        : structuralCalculations.serviceability_checks.vibration.status === 'FAIL'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                        {structuralCalculations.serviceability_checks.vibration.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Frequency: {structuralCalculations.serviceability_checks.vibration.estimated_frequency_hz} Hz
                    </p>
                    {structuralCalculations.serviceability_checks.vibration.minimum_required_hz !== undefined && (
                      <p className="text-xs text-slate-600">
                        Minimum Required: {structuralCalculations.serviceability_checks.vibration.minimum_required_hz} Hz
                      </p>
                    )}
                    {structuralCalculations.serviceability_checks.vibration.remarks && (
                      <p className="text-xs text-slate-600 mt-1 italic">
                        {structuralCalculations.serviceability_checks.vibration.remarks}
                      </p>
                    )}
                  </div>
                )}

                {/* Crack Width */}
                {structuralCalculations.serviceability_checks.crack_width && (
                  <div className={`p-4 rounded-xl border ${structuralCalculations.serviceability_checks.crack_width.status === 'PASS'
                    ? 'bg-green-50 border-green-200'
                    : structuralCalculations.serviceability_checks.crack_width.status === 'FAIL'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-amber-50 border-amber-200'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-slate-800 text-sm">Crack Width</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${structuralCalculations.serviceability_checks.crack_width.status === 'PASS'
                        ? 'bg-green-100 text-green-700'
                        : structuralCalculations.serviceability_checks.crack_width.status === 'FAIL'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}>
                        {structuralCalculations.serviceability_checks.crack_width.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Max Allowed: {structuralCalculations.serviceability_checks.crack_width.maximum_allowed_mm} mm
                    </p>
                    {structuralCalculations.serviceability_checks.crack_width.applicable !== undefined && (
                      <p className="text-xs text-slate-600">
                        Applicable: {structuralCalculations.serviceability_checks.crack_width.applicable ? 'Yes' : 'No'}
                      </p>
                    )}
                    {structuralCalculations.serviceability_checks.crack_width.exposure_type && (
                      <p className="text-xs text-slate-600">
                        Exposure Type: {structuralCalculations.serviceability_checks.crack_width.exposure_type}
                      </p>
                    )}
                    {structuralCalculations.serviceability_checks.crack_width.remarks && (
                      <p className="text-xs text-slate-600 mt-1 italic">
                        {structuralCalculations.serviceability_checks.crack_width.remarks}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Serviceability Summary */}
              <div className="mt-4 bg-gradient-to-r from-teal-50 to-cyan-50 p-4 rounded-xl border border-teal-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-teal-900">Overall Serviceability Status</h4>
                  {structuralCalculations.serviceability_checks.overall_status && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${structuralCalculations.serviceability_checks.overall_status === 'PASS'
                      ? 'bg-green-100 text-green-700'
                      : structuralCalculations.serviceability_checks.overall_status === 'FAIL'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                      }`}>
                      {structuralCalculations.serviceability_checks.overall_status}
                    </span>
                  )}
                </div>
                {structuralCalculations.serviceability_checks.validation_method && (
                  <p className="text-xs text-teal-700">
                    Validation Method: {structuralCalculations.serviceability_checks.validation_method}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Overall Structural Calculations Summary */}
          {structuralCalculations && (structuralCalculations.calculation_method || structuralCalculations.standards) && (
            <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 p-4 rounded-xl border-2 border-purple-200 mt-4">
              <h4 className="text-sm font-bold text-purple-900 mb-3 flex items-center gap-2">
                <span>📊</span> Overall Structural Analysis Summary
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {structuralCalculations.calculation_method && (
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-purple-700 font-semibold">Calculation Method</p>
                    <p className="text-purple-900 mt-1">{structuralCalculations.calculation_method}</p>
                  </div>
                )}
                {structuralCalculations.standards && (
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-purple-700 font-semibold">Standards Applied</p>
                    <p className="text-purple-900 mt-1">{structuralCalculations.standards}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------- DOCUMENT TABLE (DYNAMIC) ---------- */}
      {/* <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h2 className="text-slate-900">
              {selectedAuthority ? `${authorityMeta[selectedAuthority]?.label || selectedAuthority} Checklist` : "Document Checklist"}
            </h2>


            {!selectedAuthority ? (
              <div className="p-8 text-center text-slate-500">Select an authority to view checklist</div>
            ) : (
              (() => {
                const authorityDocs = documentChecklist[selectedAuthority];

                // Handle new structure: {documents: [], drawings: [], noc_requirements: []}
                const hasNewStructure = authorityDocs && typeof authorityDocs === 'object' && !Array.isArray(authorityDocs);
                const hasOldStructure = Array.isArray(authorityDocs) && authorityDocs.length > 0;

                if (!authorityDocs || (!hasNewStructure && !hasOldStructure)) {
                  return (
                    <div className="p-4 bg-slate-50 text-slate-500 rounded-xl text-sm italic">
                      No specific documents listed for this authority.
                    </div>
                  );
                }

                // New structure with categories
                if (hasNewStructure) {
                  const allDocs = [
                    ...(authorityDocs.documents || []).map(doc => ({ name: doc, category: 'Document' })),
                    ...(authorityDocs.drawings || []).map(doc => ({ name: doc, category: 'Drawing' })),
                    ...(authorityDocs.noc_requirements || []).map(doc => ({ name: doc, category: 'NOC' }))
                  ];

                  if (allDocs.length === 0) {
                    return (
                      <div className="p-4 bg-slate-50 text-slate-500 rounded-xl text-sm italic">
                        No specific documents listed for this authority.
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Document Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {allDocs.map((docItem, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-sm font-medium text-slate-900">
                                {docItem.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${docItem.category === 'Document' ? 'bg-blue-100 text-blue-800' :
                                  docItem.category === 'Drawing' ? 'bg-purple-100 text-purple-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                  {docItem.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                                  Required
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium cursor-pointer hover:text-blue-800">
                                Upload
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                // Old structure (array)
                return (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Document Name</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {authorityDocs.map((docItem, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 capitalize">
                              {typeof docItem === 'string' ? docItem.replace(/_/g, ' ') : (docItem.name || "Unknown Document")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                              <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                                Required
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium cursor-pointer hover:text-blue-800">
                              Upload
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()
            )}
          </div> */}

      {/* ---------- COMPLIANCE COMPARISON (PHASE 4) ---------- */}
      {(engineResult?.phase4_original_compliance || engineResult?.phase4_modified_compliance) && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-slate-900">Compliance Comparison</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original File Compliance */}
            {engineResult?.phase4_original_compliance && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Original Drawing
                </h3>
                {typeof engineResult.phase4_original_compliance === 'object' ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {Object.entries(engineResult.phase4_original_compliance).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-start text-xs border-b border-blue-100 pb-1 last:border-0">
                        <span className="text-blue-700 capitalize font-medium">{key.replace(/_/g, ' ')}</span>
                        <span className="font-semibold text-blue-900 text-right ml-2 max-w-[60%]">
                          {typeof value === 'boolean' ? (
                            value ? <span className="text-green-600">✅ Pass</span> : <span className="text-red-600">❌ Fail</span>
                          ) : typeof value === 'object' && value !== null ? (
                            Array.isArray(value) ? (
                              <span className="text-blue-600">{value.length} items</span>
                            ) : (
                              <span className="text-xs text-slate-500 italic">Complex data</span>
                            )
                          ) : (
                            <span className="truncate">{String(value)}</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-blue-700">{String(engineResult.phase4_original_compliance)}</p>
                )}
              </div>
            )}

            {/* Modified File Compliance */}
            {engineResult?.phase4_modified_compliance && (
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Modified Drawing
                </h3>
                {typeof engineResult.phase4_modified_compliance === 'object' ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {Object.entries(engineResult.phase4_modified_compliance).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-start text-xs border-b border-purple-100 pb-1 last:border-0">
                        <span className="text-purple-700 capitalize font-medium">{key.replace(/_/g, ' ')}</span>
                        <span className="font-semibold text-purple-900 text-right ml-2 max-w-[60%]">
                          {typeof value === 'boolean' ? (
                            value ? <span className="text-green-600">✅ Pass</span> : <span className="text-red-600">❌ Fail</span>
                          ) : typeof value === 'object' && value !== null ? (
                            Array.isArray(value) ? (
                              <span className="text-purple-600">{value.length} items</span>
                            ) : (
                              <span className="text-xs text-slate-500 italic">Complex data</span>
                            )
                          ) : (
                            <span className="truncate">{String(value)}</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-purple-700">{String(engineResult.phase4_modified_compliance)}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- AUTHORITY IMPACT ANALYSIS ---------- */}
      {/* {engineResult?.phase5_authority_impact && Object.keys(engineResult.phase5_authority_impact).length > 0 && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h2 className="text-slate-900">Authority Impact Analysis</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(engineResult.phase5_authority_impact)
                  .filter(([authority]) => authority !== 'OTHER_AUTHORITIES' && authority !== 'other_authorities')
                  .map(([authority, data]) => {
                    const meta = authorityMeta[authority] || {
                      label: authority,
                      color: "from-slate-500 to-slate-700",
                      icon: Building2
                    };

                    // Handle different data formats
                    let impactLevel = 'unknown';
                    let reason = '';

                    if (typeof data === 'object' && data !== null) {
                      impactLevel = data?.impact || data?.level || 'unknown';
                      reason = data?.reason || data?.description || data?.message || '';
                    } else if (typeof data === 'string') {
                      reason = data;
                      impactLevel = 'medium'; // Default for string data
                    }

                    const impactConfig = {
                      high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700 border-red-300', icon: '🔴' },
                      critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700 border-red-300', icon: '🔴' },
                      medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700 border-amber-300', icon: '🟡' },
                      low: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700 border-green-300', icon: '🟢' },
                      unknown: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700 border-slate-300', icon: '⚪' }
                    };

                    const config = impactConfig[impactLevel.toLowerCase()] || impactConfig.unknown;

                    return (
                      <div key={authority} className={`p-4 ${config.bg} rounded-xl border ${config.border}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center text-white text-[10px] font-bold shadow-sm`}>
                              {authority.substring(0, 3).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{authority}</p>
                              <p className="text-[10px] text-slate-500">{meta.label}</p>
                            </div>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 mb-2`}>
                          <span className="text-sm">{config.icon}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${config.badge} uppercase`}>
                            {impactLevel}
                          </span>
                        </div>
                        {reason && (
                          <p className={`text-[11px] ${config.text} leading-tight line-clamp-2`}>{reason}</p>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )} */}

      {/* ---------- SUBMISSION READINESS ---------- */}
      {engineResult?.phase5c_readiness && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-slate-900">Submission Readiness</h2>

          {engineResult.phase5c_readiness.overall_readiness && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Overall Progress</span>
                <span className="text-lg font-bold text-blue-600">{engineResult.phase5c_readiness.overall_readiness}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all"
                  style={{ width: engineResult.phase5c_readiness.overall_readiness }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {engineResult.phase5c_readiness.ready_items && engineResult.phase5c_readiness.ready_items.length > 0 && (
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <h3 className="text-sm font-semibold text-green-900 mb-2">✅ Ready Items ({engineResult.phase5c_readiness.ready_items.length})</h3>
                <ul className="space-y-1">
                  {engineResult.phase5c_readiness.ready_items.slice(0, 5).map((item, i) => (
                    <li key={i} className="text-xs text-green-700">• {item}</li>
                  ))}
                  {engineResult.phase5c_readiness.ready_items.length > 5 && (
                    <li className="text-xs text-green-600 italic">+ {engineResult.phase5c_readiness.ready_items.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}

            {engineResult.phase5c_readiness.missing_items && engineResult.phase5c_readiness.missing_items.length > 0 && (
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <h3 className="text-sm font-semibold text-red-900 mb-2">❌ Missing Items ({engineResult.phase5c_readiness.missing_items.length})</h3>
                <ul className="space-y-1">
                  {engineResult.phase5c_readiness.missing_items.slice(0, 5).map((item, i) => (
                    <li key={i} className="text-xs text-red-700">• {item}</li>
                  ))}
                  {engineResult.phase5c_readiness.missing_items.length > 5 && (
                    <li className="text-xs text-red-600 italic">+ {engineResult.phase5c_readiness.missing_items.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- AI EXPLAINABILITY ---------- */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <button
          onClick={() => setShowExplainability(!showExplainability)}
          className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-slate-900">AI Reasoning & Explainability</h3>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-slate-400 transition ${showExplainability ? 'rotate-180' : ''}`} />
        </button>

        {showExplainability && (
          <div className="px-6 pb-6 space-y-6 border-t border-slate-200 pt-6">
            {matchedRules.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-900 mb-2">Matched Rules</h4>
                <div className="space-y-3">
                  {matchedRules.map((rule, i) => (
                    <div key={i} className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                      <p className="font-semibold text-sm">{rule.title}</p>
                      <p className="text-sm text-slate-700 mt-1">{rule.explanation}</p>
                      <p className="text-xs text-slate-500 mt-2">Source: {rule.source} (Page {rule.page})</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {retrievedRules.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-900 mb-2">Referenced Code Rules</h4>
                <div className="space-y-3">
                  {retrievedRules.map((r, i) => (
                    <div key={i} className="p-3 bg-slate-100 border rounded-xl text-sm">
                      <p className="font-medium">{r.source} — Page {r.page}</p>
                      <p>{r.excerpt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---------- AI NARRATIVE & INSIGHTS (Phase 7) ---------- */}
      {engineResult?.phase7_ai_narrative?.llm_narrative && (
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl shadow-lg border-2 border-indigo-200 p-8 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">AI Analysis Narrative</h2>
              <p className="text-sm text-slate-600">Comprehensive insights and recommendations</p>
            </div>
          </div>

          {/* Executive Summary */}
          {engineResult.phase7_ai_narrative.llm_narrative.executive_summary && (
            <div className="bg-white rounded-2xl p-6 shadow-md border border-indigo-100">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">📋</span>
                <h3 className="text-lg font-bold text-slate-900">Executive Summary</h3>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {engineResult.phase7_ai_narrative.llm_narrative.executive_summary}
              </p>
            </div>
          )}

          {/* Authority-Wise Notes */}
          {engineResult.phase7_ai_narrative.llm_narrative.authority_wise_notes && (
            <div className="bg-white rounded-2xl p-6 shadow-md border border-indigo-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🏛️</span>
                <h3 className="text-lg font-bold text-slate-900">Authority-Wise Analysis</h3>
              </div>

              <div className="space-y-4">
                {Object.entries(engineResult.phase7_ai_narrative.llm_narrative.authority_wise_notes).map(([authority, note]) => {
                  const meta = authorityMeta[authority] || {
                    label: authority,
                    color: "from-slate-500 to-slate-700",
                    icon: Building2
                  };

                  return (
                    <div key={authority} className="border-l-4 border-indigo-400 pl-4 py-2 bg-slate-50 rounded-r-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center text-white text-xs font-bold`}>
                          {authority.substring(0, 2)}
                        </div>
                        <span className="font-bold text-slate-900">{authority}</span>
                        <span className="text-xs text-slate-500">- {meta.label}</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{note}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Key Risks */}
          {engineResult.phase7_ai_narrative.llm_narrative.key_risks && Array.isArray(engineResult.phase7_ai_narrative.llm_narrative.key_risks) && engineResult.phase7_ai_narrative.llm_narrative.key_risks.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-md border border-red-200">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">⚠️</span>
                <h3 className="text-lg font-bold text-red-900">Key Risks Identified</h3>
                <span className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-bold">
                  {engineResult.phase7_ai_narrative.llm_narrative.key_risks.length} Risks
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {engineResult.phase7_ai_narrative.llm_narrative.key_risks.map((risk, idx) => {
                  // Extract authority from risk text (e.g., "Exit redundancy data not available (DCD)")
                  const authorityMatch = risk.match(/\(([A-Z]+)\)$/);
                  const authority = authorityMatch ? authorityMatch[1] : null;
                  const riskText = risk.replace(/\s*\([A-Z]+\)$/, '');

                  return (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <span className="text-red-600 font-bold mt-0.5">⚠️</span>
                      <div className="flex-1">
                        <p className="text-sm text-red-900 font-medium">{riskText}</p>
                        {authority && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-red-200 text-red-800 rounded text-xs font-semibold">
                            {authority}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommended Actions */}
          {/* {engineResult.phase7_ai_narrative.llm_narrative.recommended_actions && (
                <div className="bg-white rounded-2xl p-6 shadow-md border border-green-200">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">✅</span>
                    <h3 className="text-lg font-bold text-green-900">Recommended Actions</h3>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(engineResult.phase7_ai_narrative.llm_narrative.recommended_actions).map(([authority, actions]) => {
                      const meta = authorityMeta[authority] || {
                        label: authority,
                        color: "from-slate-500 to-slate-700",
                        icon: Building2
                      };

                      return (
                        <div key={authority} className="border border-green-200 rounded-xl overflow-hidden">
                          <div className={`bg-gradient-to-r ${meta.color} p-3 text-white`}>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{authority}</span>
                              <span className="text-xs opacity-90">- {meta.label}</span>
                              <span className="ml-auto px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold">
                                {Array.isArray(actions) ? actions.length : 0} Actions
                              </span>
                            </div>
                          </div>
                          <div className="p-4 bg-green-50">
                            <ul className="space-y-2">
                              {Array.isArray(actions) && actions.map((action, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-green-900">
                                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                                  <span className="flex-1">{action}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )} */}

          {/* Status Badge */}
          {engineResult.phase7_ai_narrative.status && (
            <div className="flex justify-center">
              <div className={`px-6 py-2 rounded-full font-bold text-sm ${engineResult.phase7_ai_narrative.status === 'OK' ? 'bg-green-100 text-green-700 border-2 border-green-300' :
                'bg-red-100 text-red-700 border-2 border-red-300'
                }`}>
                AI Analysis Status: {engineResult.phase7_ai_narrative.status}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------- DETAILED RULE EXPLANATIONS ---------- */}


      {/* ---------- AUTHORITY SUMMARY (Phase 6) ---------- */}


      {/* ---------- VALIDATION RESULTS (Phase 5d) ---------- */}


      {/* ---------- PHASE DATA OVERVIEW ---------- */}
      {/* {engineResult && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h2 className="text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Processing Phases Overview
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.keys(engineResult).filter(key => key.startsWith('phase')).map((phaseKey, idx) => {
                  const phaseNumber = phaseKey.match(/\d+/)?.[0] || idx + 1;
                  const phaseData = engineResult[phaseKey];
                  const hasData = phaseData && (typeof phaseData === 'object' ? Object.keys(phaseData).length > 0 : true);

                  return (
                    <div key={phaseKey} className={`p-3 rounded-xl border ${hasData ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                      }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-700">Phase {phaseNumber}</span>
                        <span className="text-lg">{hasData ? '✅' : '⚪'}</span>
                      </div>
                      <p className="text-[10px] text-slate-600 truncate">{phaseKey.replace(/_/g, ' ')}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )} */}

      {/* ---------- DOOR DETAILS (Semantic Elements) ---------- */}
      {dxfSummary?.semantic_elements?.doors && Array.isArray(dxfSummary.semantic_elements.doors) && dxfSummary.semantic_elements.doors.length > 0 && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Door Details ({dxfSummary.semantic_elements.doors.length})
          </h2>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {dxfSummary.semantic_elements.doors.map((door, idx) => (
              <div key={idx} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-blue-900">{door.id || `Door ${idx + 1}`}</span>
                  {door.width && (
                    <span className="px-2 py-0.5 bg-blue-200 text-blue-900 rounded text-xs font-semibold">
                      Width: {door.width}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {door.block_name && (
                    <div>
                      <span className="text-blue-600">Block:</span>
                      <span className="text-blue-900 ml-1 font-medium">{door.block_name}</span>
                    </div>
                  )}
                  {door.layer && (
                    <div>
                      <span className="text-blue-600">Layer:</span>
                      <span className="text-blue-900 ml-1 font-medium">{door.layer}</span>
                    </div>
                  )}
                </div>
                {door.insert && Array.isArray(door.insert) && (
                  <p className="text-xs text-blue-600 mt-2">
                    📍 Position: ({door.insert[0]?.toFixed(0)}, {door.insert[1]?.toFixed(0)})
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- METADATA & TIMESTAMPS ---------- */}
      {(ai?.created_at || ai?.updated_at || engineResult?.timestamp) && (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl border border-slate-200 p-6">
          <h2 className="text-slate-900 mb-4">Analysis Metadata</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ai?.created_at && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">📅</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Created</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {new Date(ai.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {ai?.updated_at && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">🔄</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Last Updated</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {new Date(ai.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {engineResult?.timestamp && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">⏱️</span>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Processed</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {new Date(engineResult.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- FILE INFORMATION ---------- */}
      {(engineResult?.original_files_used || engineResult?.modified_files_used || ai?.dxf_file) && (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg text-slate-900 mb-3 sm:mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            Analyzed Files
          </h2>

          <div className="space-y-3">
            {ai?.dxf_file && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <FileText className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-xs text-blue-600 font-medium">DXF File:</p>
                  <p className="text-sm text-blue-900 font-semibold">{ai.dxf_file}</p>
                </div>
              </div>
            )}

            {engineResult?.original_files_used && Array.isArray(engineResult.original_files_used) && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600 font-medium mb-2">Original Files ({engineResult.original_files_used.length}):</p>
                <ul className="space-y-1">
                  {engineResult.original_files_used.map((file, idx) => (
                    <li key={idx} className="text-sm text-slate-700 flex items-center gap-2">
                      <span className="text-slate-400">•</span>
                      {file}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {engineResult?.modified_files_used && Array.isArray(engineResult.modified_files_used) && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs text-purple-600 font-medium mb-2">Modified Files ({engineResult.modified_files_used.length}):</p>
                <ul className="space-y-1">
                  {engineResult.modified_files_used.map((file, idx) => (
                    <li key={idx} className="text-sm text-purple-700 flex items-center gap-2">
                      <span className="text-purple-400">•</span>
                      {file}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}



      {/* </div>
      </div> */}





      {/* Floating Assistant Button */}
      {showFloatingAssistant && navigateTo && (
        <button
          onClick={() => handleNavigate('/assistant')}
          className="fixed bottom-6 right-4 sm:bottom-8 sm:right-8 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-2xl shadow-xl hover:scale-110 flex items-center justify-center transition"
        >
          <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

    </div>
  );
}
