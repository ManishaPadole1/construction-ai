import { useState, useMemo } from 'react';
import {
  Building2,
  FileText,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

// Authority metadata for colors and labels
const authorityMeta = {
  DM: {
    name: 'Dubai Municipality',
    color: 'from-blue-500 to-indigo-600',
    description: 'Main regulatory authority for building permits and construction approvals in Dubai',
    portal_url: 'https://www.dm.gov.ae/',
    documents_url: 'https://www.dm.gov.ae/services/building-permits/',
    drawings_url: 'https://www.dm.gov.ae/services/building-permits/',
    nocs_url: 'https://www.dm.gov.ae/services/noc-services/'
  },
  DEWA: {
    name: 'Dubai Electricity & Water Authority',
    color: 'from-emerald-500 to-teal-600',
    description: 'Utility authority responsible for electricity and water infrastructure approvals',
    portal_url: 'https://www.dewa.gov.ae/',
    documents_url: 'https://www.dewa.gov.ae/en/customer/services/start-or-move-services',
    drawings_url: 'https://www.dewa.gov.ae/en/customer/services/start-or-move-services',
    nocs_url: 'https://www.dewa.gov.ae/en/customer/services/connection-services'
  },
  DCD: {
    name: 'Dubai Civil Defence',
    color: 'from-red-500 to-orange-600',
    description: 'Fire and life safety regulatory authority for construction projects',
    portal_url: 'https://www.dcd.gov.ae/',
    documents_url: 'https://www.dcd.gov.ae/en/services',
    drawings_url: 'https://www.dcd.gov.ae/en/services',
    nocs_url: 'https://www.dcd.gov.ae/en/services/fire-safety-noc'
  },
  RTA: {
    name: 'Roads & Transport Authority',
    color: 'from-violet-500 to-purple-600',
    description: 'Transport infrastructure and traffic impact authority',
    portal_url: 'https://www.rta.ae/',
    documents_url: 'https://www.rta.ae/wps/portal/rta/ae/public-transport',
    drawings_url: 'https://www.rta.ae/wps/portal/rta/ae/public-transport',
    nocs_url: 'https://www.rta.ae/wps/portal/rta/ae/home'
  },
  EMAAR: {
    name: 'Emaar Properties',
    color: 'from-amber-500 to-yellow-600',
    description: 'Master developer approval for Dubai Marina area',
    portal_url: 'https://www.emaar.com/',
    documents_url: 'https://www.emaar.com/en/what-we-do/communities/',
    drawings_url: 'https://www.emaar.com/en/what-we-do/communities/',
    nocs_url: 'https://www.emaar.com/en/what-we-do/communities/'
  },
  DDA: {
    name: 'Dubai Development Authority',
    color: 'from-amber-500 to-orange-600',
    description: 'Regulatory authority for development in free zones',
    portal_url: 'https://dda.gov.ae/',
    documents_url: 'https://dda.gov.ae/services/',
    drawings_url: 'https://dda.gov.ae/services/',
    nocs_url: 'https://dda.gov.ae/services/'
  },
  DLD: {
    name: 'Dubai Land Department',
    color: 'from-cyan-500 to-blue-600',
    description: 'Real estate regulation and registration authority',
    portal_url: 'https://dubailand.gov.ae/',
    documents_url: 'https://dubailand.gov.ae/en/eservices/',
    drawings_url: 'https://dubailand.gov.ae/en/eservices/',
    nocs_url: 'https://dubailand.gov.ae/en/eservices/'
  },
  DHA: {
    name: 'Dubai Health Authority',
    color: 'from-sky-500 to-indigo-600',
    description: 'Healthcare facility regulation and approvals',
    portal_url: 'https://www.dha.gov.ae/',
    documents_url: 'https://www.dha.gov.ae/en/services',
    drawings_url: 'https://www.dha.gov.ae/en/services',
    nocs_url: 'https://www.dha.gov.ae/en/services'
  },
  TRAKHEES: {
    name: 'Trakhees',
    color: 'from-yellow-500 to-amber-600',
    description: 'Regulatory authority for special development zones',
    portal_url: 'https://www.trakhees.ae/',
    documents_url: 'https://www.trakhees.ae/en/ced/Pages/Services.aspx',
    drawings_url: 'https://www.trakhees.ae/en/ced/Pages/Services.aspx',
    nocs_url: 'https://www.trakhees.ae/en/ced/Pages/Services.aspx'
  },
  DUBAI_ENV: {
    name: 'Dubai Environment Department',
    color: 'from-green-500 to-emerald-600',
    description: 'Environmental protection and sustainability regulations',
    portal_url: 'https://www.dm.gov.ae/',
    documents_url: 'https://www.dm.gov.ae/',
    drawings_url: 'https://www.dm.gov.ae/',
    nocs_url: 'https://www.dm.gov.ae/'
  },
  RERA: {
    name: 'Real Estate Regulatory Agency',
    color: 'from-rose-500 to-pink-600',
    description: 'Regulation of the real estate sector',
    portal_url: 'https://dubailand.gov.ae/en/rera/',
    documents_url: 'https://dubailand.gov.ae/en/rera/',
    drawings_url: 'https://dubailand.gov.ae/en/rera/',
    nocs_url: 'https://dubailand.gov.ae/en/rera/'
  }
};

// Common Guidelines for all authorities
const commonGuidelines = [
  {
    title: 'General Submission Requirements',
    content: 'All documents must be submitted in both hard copy and digital format (PDF). Drawings should be signed and stamped by registered consultants. Ensure all documents are up-to-date and match the latest approved versions.'
  },
  {
    title: 'Timeline & Processing',
    content: 'Standard processing time is 10-15 working days after submission of complete documents. Incomplete applications will be rejected. Track your application status online through the respective authority portal.'
  },
  {
    title: 'Fees & Payments',
    content: 'All fees must be paid before application submission. Payment receipts should be attached to the application. Fees are non-refundable once the application is submitted for review.'
  },
  {
    title: 'Compliance & Standards',
    content: 'All designs must comply with Dubai Building Code, Dubai Green Building Regulations, and relevant international standards (BS, ASHRAE, NFPA). Ensure accessibility requirements as per UAE Disability Code.'
  },
  {
    title: 'Site Requirements',
    content: 'Site must be accessible for inspection. Ensure proper safety measures are in place during construction. Maintain updated site plans and as-built drawings throughout the project.'
  },
  {
    title: 'Documentation Language',
    content: 'All official documents and drawings must include Arabic translations or be bilingual (English/Arabic). Technical specifications can be in English with Arabic summary.'
  }
];



export function AuthorityBreakdownContent({ aiResponseText, projectData }) {
  const [activeTab, setActiveTab] = useState(null);
  const [expandedGuideline, setExpandedGuideline] = useState(null);

  // Parse AI Response (same pattern as AIAnalysis)
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

  // Extract document_checklist from AI response
  const documentChecklist = useMemo(() => {
    if (!aiResponseText && !projectData) {
      return null;
    }

    const parsed = parseAIResponse(aiResponseText);
    const ai = parsed.isJson ? parsed.data : null;

    // Extract from various possible locations
    const engineResult = ai?.engine_result || {};
    const uiView = engineResult?.ui_view || null;
    const uiCompat = uiView || engineResult?.ui_compat || engineResult || ai?.ui_compat || {};

    const checklist = uiCompat?.document_checklist ||
      uiCompat?.ai_document_checklist || ai?.document_checklist ||
      projectData?.ai_document_checklist ||
      {};

    console.log('📋 Document Checklist Extracted:', {
      hasData: Object.keys(checklist).length > 0,
      authorities: Object.keys(checklist),
      checklist
    });

    return Object.keys(checklist).length > 0 ? checklist : null;
  }, [aiResponseText, projectData]);

  // Build authorities data from AI response only
  const authoritiesData = useMemo(() => {
    if (!documentChecklist) {
      return [];
    }

    // Build dynamic data from AI response
    return Object.entries(documentChecklist).map(([authorityId, data]) => {
      const meta = authorityMeta[authorityId] || {
        name: authorityId,
        color: 'from-slate-500 to-slate-700',
        description: `Requirements for ${authorityId}`
      };

      return {
        id: authorityId,
        name: meta.name,
        color: meta.color,
        description: meta.description,
        documents: data.documents || [],
        drawings: data.drawings || [],
        nocs: data.noc_requirements || []
      };
    });
  }, [documentChecklist]);

  // Set first authority as active tab if current tab doesn't exist
  useMemo(() => {
    if (authoritiesData.length > 0 && !authoritiesData.find(a => a.id === activeTab)) {
      setActiveTab(authoritiesData[0].id);
    }
  }, [authoritiesData, activeTab]);

  const activeAuthority = authoritiesData.find(auth => auth.id === activeTab);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-slate-900 mb-2">Authority Breakdown</h1>
        <p className="text-slate-600 text-sm md:text-base">Detailed requirements for each regulatory authority</p>
      </div>

      {/* Empty State */}
      {authoritiesData.length === 0 && (
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 p-8 md:p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Authority Data Available</h3>
              <p className="text-sm text-slate-600 max-w-md">
                Please upload and analyze your project first to see authority-specific requirements.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Authority Tabs */}
      {authoritiesData.length > 0 && (
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-200 overflow-x-auto">
            {authoritiesData.map((authority) => (
              <button
                key={authority.id}
                onClick={() => setActiveTab(authority.id)}
                className={`
                  flex-1 min-w-[120px] px-4 md:px-6 py-3 md:py-4 transition-all duration-200 text-sm
                  ${activeTab === authority.id
                    ? 'bg-gradient-to-br ' + authority.color + ' text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                  }
                `}
              >
                <p className="text-xs md:text-sm">{authority.name}</p>
              </button>
            ))}
          </div>

          {activeAuthority && (
            <div className="p-8 space-y-8">
              {/* Authority Header */}
              <div className={`bg-gradient-to-br ${activeAuthority.color} text-white rounded-2xl p-6`}>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <h2 className="mb-2">{activeAuthority.name}</h2>
                    <p className="text-sm opacity-90">{activeAuthority.description}</p>
                  </div>
                  <button
                    onClick={() => window.open(authorityMeta[activeAuthority.id]?.portal_url || '#', '_blank', 'noopener,noreferrer')}
                    className="cursor-pointer px-4 py-2 bg-white/20 backdrop-blur rounded-xl text-sm hover:bg-white/30 transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit Portal
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Required Documents */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-slate-900">Required Documents</h3>
                    <span className="text-sm text-slate-500">{activeAuthority.documents.length} items</span>
                  </div>
                  <div className="space-y-2">
                    {activeAuthority.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm text-slate-700 flex-1">{doc}</span>
                        <button
                          onClick={() => window.open(authorityMeta[activeAuthority.id]?.documents_url || '#', '_blank', 'noopener,noreferrer')}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-all"
                          title="View on official portal"
                        >
                          <ExternalLink className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Required Drawings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-slate-900">Required Drawings</h3>
                    <span className="text-sm text-slate-500">{activeAuthority.drawings.length} items</span>
                  </div>
                  <div className="space-y-2">
                    {activeAuthority.drawings.map((drawing, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                          <FileText className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="text-sm text-slate-700 flex-1">{drawing}</span>
                        <button
                          onClick={() => window.open(authorityMeta[activeAuthority.id]?.drawings_url || '#', '_blank', 'noopener,noreferrer')}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-all"
                          title="View on official portal"
                        >
                          <ExternalLink className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* NOC Requirements */}
              <div className="space-y-4">
                <h3 className="text-slate-900">NOC Requirements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeAuthority.nocs.map((noc, index) => {
                    const isObj = typeof noc === 'object' && noc !== null;
                    const name = isObj ? noc.noc_name : noc;
                    const responsibility = isObj ? noc.responsibility : null;

                    return (
                      <div
                        key={index}
                        className="p-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center mt-0.5 shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-violet-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-slate-700 font-medium block truncate" title={name}>{name}</span>
                            {responsibility && (
                              <span className="text-xs text-slate-500 mt-1 block capitalize flex items-center gap-1">
                                Responsibility: <span className="font-semibold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">{responsibility}</span>
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => window.open(authorityMeta[activeAuthority.id]?.nocs_url || '#', '_blank', 'noopener,noreferrer')}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-all shrink-0"
                            title="View on official portal"
                          >
                            <ExternalLink className="w-4 h-4 text-slate-500" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Common Guidelines & Requirements */}
              {/* <div className="space-y-4">
                <h3 className="text-slate-900">Guidelines & Requirements</h3>
                <p className="text-xs text-slate-500 mb-3">General guidelines applicable to all authorities</p>
                <div className="space-y-3">
                  {commonGuidelines.map((guideline, index) => (
                    <div
                      key={index}
                      className="border border-slate-200 rounded-2xl overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedGuideline(expandedGuideline === index ? null : index)}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <span className="text-sm text-slate-900 font-medium">{guideline.title}</span>
                        <ChevronDown
                          className={`w-5 h-5 text-slate-400 transition-transform ${expandedGuideline === index ? 'rotate-180' : ''
                            }`}
                        />
                      </button>
                      {expandedGuideline === index && (
                        <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                          {guideline.content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div> */}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AuthorityBreakdown({ aiResponseText, projectData }) {
  return <AuthorityBreakdownContent aiResponseText={aiResponseText} projectData={projectData} />;
}
