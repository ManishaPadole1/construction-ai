import { Link } from 'react-router-dom';
import {
  FolderKanban,
  Clock,
  CheckCircle2,
  TrendingUp,
  Plus,
  ArrowRight,
  FileText,
  Building2,
  AlertCircle,
  Copy,
  Check,
  User2,
  MapPin,
  Ruler,
  Layers,
  Sparkles,
  ScanSearch,
  Calendar,
  Bot,
  ExternalLink
} from 'lucide-react';
import { formatDateWithTime, formatRelativeDate } from '../utils/formatDateMoment';
import { getAuthorityRules } from '../config/authorityRules';
import { useProjectModal } from '../Context/ProjectModalContext';
import { useNavigate } from 'react-router-dom';
import { useSelector } from "react-redux";

import { Button } from './ui/button';

const stats = [
  {
    label: 'Active Projects',
    value: '24',
    change: '+12%',
    icon: FolderKanban,
    color: 'from-blue-500 to-indigo-600'
  },
  {
    label: 'Pending Approvals',
    value: '8',
    change: '-5%',
    icon: Clock,
    color: 'from-amber-500 to-orange-600'
  },
  {
    label: 'Completed Reports',
    value: '156',
    change: '+23%',
    icon: CheckCircle2,
    color: 'from-emerald-500 to-teal-600'
  },
  {
    label: 'Success Rate',
    value: '94%',
    change: '+8%',
    icon: TrendingUp,
    color: 'from-violet-500 to-purple-600'
  },
];

const recentProjects = [
  {
    id: 'PRJ-001',
    name: 'Dubai Marina Tower Extension',
    client: 'Emaar Properties',
    status: 'In Review',
    authorities: ['DM', 'DCD', 'DEWA'],
    progress: 65,
    statusColor: 'text-blue-600 bg-blue-50'
  },
  {
    id: 'PRJ-002',
    name: 'Palm Jumeirah Villa Renovation',
    client: 'Nakheel',
    status: 'Approved',
    authorities: ['DM', 'DEWA'],
    progress: 100,
    statusColor: 'text-emerald-600 bg-emerald-50'
  },
  {
    id: 'PRJ-003',
    name: 'Business Bay Office Complex',
    client: 'DAMAC',
    status: 'Pending',
    authorities: ['DM', 'DCD', 'DEWA', 'RTA'],
    progress: 30,
    statusColor: 'text-amber-600 bg-amber-50'
  },
  {
    id: 'PRJ-004',
    name: 'JBR Retail Space Modification',
    client: 'Private Owner',
    status: 'Requires Changes',
    authorities: ['DM', 'DCD'],
    progress: 45,
    statusColor: 'text-red-600 bg-red-50'
  },
];

import { useState, useEffect } from 'react';
import { GET_DASHBOARD_STATS_API } from '../Services/user/index';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth)
  const { openProjectModal } = useProjectModal();

  const [dashboardStats, setDashboardStats] = useState({
    totalProjects: 0,
    pendingAnalyses: 0,
    completedAnalyses: 0,
    successRate: 0,
    recentProjects: []
  });

  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const [copiedAnalysisIdCard, setCopiedAnalysisIdCard] = useState(null);

  const getModeLabelHelper = (authority, projectType, val) => {
    if (!val || !authority) return 'Unknown Mode';
    try {
      const authorityRules = getAuthorityRules(authority, projectType || "RENOVATION");
      const modeConfig = authorityRules[val];
      return modeConfig ? modeConfig.name : val;
    } catch {
      return val;
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await GET_DASHBOARD_STATS_API();
        const response = res?.response ? res?.response : res;
        console.log("🙋🏻‍♂️ ~ fetchStats ~ response:", response)

        if (response?.data?.success) {
          setDashboardStats(response?.data?.payload);
        }
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleCreateProject = () => {
    openProjectModal(null, (newProject) => {
      navigate(`/project/${newProject.project_id}`);
    });
  };

  const currentStats = [
    {
      label: 'Total Projects',
      value: dashboardStats.totalProjects.toString(),
      change: 'Active',
      icon: FolderKanban,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      label: 'Pending Analyses',
      value: dashboardStats.pendingAnalyses.toString(),
      change: 'In Queue',
      icon: Clock,
      color: 'from-amber-500 to-orange-600'
    },
    {
      label: 'Completed Analyses',
      value: dashboardStats.completedAnalyses.toString(),
      change: 'Success',
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-600'
    },
    {
      label: 'Success Rate',
      value: `${dashboardStats.successRate}%`,
      change: 'Overall',
      icon: TrendingUp,
      color: 'from-violet-500 to-purple-600'
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-slate-900 mb-2 font-bold text-2xl">Dashboard</h1>
          <p className="text-slate-600">Welcome back, {user?.full_name?.split(" ")[0] + "."} Here's your construction approval overview.</p>
        </div>
        <button
          onClick={handleCreateProject}
          className="flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 text-sm md:text-base whitespace-nowrap cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Start New Analysis
        </button>
      </div>

      {loading ? (
        <div className="space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-slate-200">
                <div className="flex items-start justify-between mb-3 md:mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-slate-100 animate-pulse"></div>
                  <div className="w-12 h-6 bg-slate-100 rounded-full animate-pulse"></div>
                </div>
                <div className="w-24 h-4 bg-slate-100 mb-2 rounded animate-pulse"></div>
                <div className="w-16 h-8 bg-slate-100 rounded animate-pulse"></div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-slate-200">
              <div className="w-48 h-6 bg-slate-100 mb-4 rounded animate-pulse"></div>
              {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-50 mb-4 rounded-xl border border-slate-100 animate-pulse"></div>)}
            </div>
            <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-slate-200">
              <div className="w-48 h-6 bg-slate-100 mb-4 rounded animate-pulse"></div>
              {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-50 mb-4 rounded-xl border border-slate-100 animate-pulse"></div>)}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {currentStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-3 md:mb-4">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mb-1">{stat.label}</p>
                  <p className="text-slate-900 text-2xl md:text-3xl">{stat.value}</p>
                </div>
              );
            })}
          </div>

          {/* Recent Analyses */}
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200">
            <div className="p-4 md:p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-slate-900 mb-1 font-bold text-lg">Recent Analyses</h2>
                <p className="text-sm text-slate-600 hidden sm:block">Track your latest evaluation results</p>
              </div>
            </div>

            <div className="p-4 md:p-6">
              {dashboardStats.recentAnalyses?.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {dashboardStats.recentAnalyses.map((rec, index) => {
                    const relatedProject = dashboardStats.recentProjects?.find(p => p.project_id === rec.project_id);
                    return (
                      <div
                        key={rec.analysis_id}
                        className="group relative bg-white border border-slate-200 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-md hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
                      >
                        <div className="mb-5 pb-4 border-b border-gray-100 flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3.5 min-w-0 overflow-hidden">
                            <div className="w-10 h-10 rounded-xl bg-blue-50/80 flex items-center justify-center flex-shrink-0">
                              <ScanSearch className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <h3 className="font-bold text-slate-900 truncate text-[15px] md:text-[17px] leading-snug" title={rec.title}>
                                {rec.title}
                              </h3>
                              <div className="mt-0.5 text-[11px] md:text-xs text-slate-400 font-medium flex items-center gap-1.5 group/id">
                                <span className="truncate tracking-wide">ID: {rec.analysis_id}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (navigator.clipboard) {
                                      navigator.clipboard.writeText(rec.analysis_id)
                                        .then(() => {
                                          setCopiedAnalysisIdCard(rec.analysis_id);
                                          setTimeout(() => setCopiedAnalysisIdCard(null), 2000);
                                        });
                                    }
                                  }}
                                  className="p-1 rounded bg-transparent hover:bg-slate-100 transition-all duration-200 cursor-pointer flex items-center justify-center -my-1 -mr-1"
                                  title="Copy ID"
                                >
                                  {copiedAnalysisIdCard === rec.analysis_id ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in-50 duration-200" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-slate-400 group-hover/id:text-blue-600 transition-colors" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 md:gap-4 mb-5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-blue-50/80 border border-blue-50 flex items-center justify-center flex-shrink-0">
                              <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Created On</p>
                              <p className="font-medium text-slate-700 text-[11px] md:text-xs truncate">{formatDateWithTime(rec.createdAt)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50/80 border border-indigo-50 flex items-center justify-center flex-shrink-0">
                              <Layers className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Upload Mode</p>
                              <p className="font-medium text-slate-700 text-[11px] md:text-xs truncate">
                                {getModeLabelHelper(rec.authority_type, relatedProject?.project_type, rec.upload_mode)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50/80 border border-emerald-50 flex items-center justify-center flex-shrink-0">
                              <Building2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Authority</p>
                              <p className="font-medium text-slate-700 text-[11px] md:text-xs truncate">
                                {rec.authority_type || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto flex flex-col md:flex-row md:items-center justify-between pt-4 border-t border-slate-100 gap-4">
                          <div className="flex items-center gap-1.5 text-[11px] md:text-xs font-medium text-slate-400 whitespace-nowrap">
                            <Clock className="w-3.5 h-3.5" />
                            {formatRelativeDate(rec.createdAt)}
                          </div>
                          <div className="grid grid-cols-1 gap-2 md:flex md:gap-2 md:justify-end w-full md:w-auto">
                            <Button
                              size="sm"
                              disabled={rec.status === 'pending' || rec.status === 'processing'}
                              className="rounded-xl h-9 md:h-8 bg-gradient-to-r from-[#2563eb] to-[#4f46e5] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
                              onClick={() => {
                                navigate(`/project/${rec.project_id}?authority=${rec.authority_type || 'DM'}&analysis_id=${rec.analysis_id}&step=2&view=edit&analysis_page=1`);
                              }}
                            >
                              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                              View Report
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center">
                  <ScanSearch className="w-8 h-8 text-slate-400 mb-2" />
                  No recent analyses found.
                </div>
              )}
            </div>
          </div>

          {/* Recent Projects */}
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200">
            <div className="p-4 md:p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-slate-900 mb-1 font-bold text-lg">Recent Projects</h2>
                <p className="text-sm text-slate-600 hidden sm:block">Track your latest construction approval analyses</p>
              </div>
              <Link to="/projects" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                View All
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="p-4 md:p-6">
              {dashboardStats.recentProjects?.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {dashboardStats.recentProjects.map((row) => (
                    <div
                      key={row.project_id}
                      className="group relative bg-white border border-slate-200 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-md hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
                    >
                      <div className="mb-5 pb-4 border-b border-gray-100 flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0 overflow-hidden">
                          <div className="w-10 h-10 rounded-xl bg-blue-50/80 flex items-center justify-center flex-shrink-0">
                            <FolderKanban className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <h3 className="font-bold text-slate-900 truncate text-[15px] md:text-[17px] leading-snug" title={row.project_name}>
                              {row.project_name}
                            </h3>
                            <div className="mt-0.5 text-[11px] md:text-xs text-slate-400 font-medium flex items-center gap-1.5 group/id">
                              <span className="truncate tracking-wide">ID: {row.project_id}</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCopy(row.project_id); }}
                                className="p-1 rounded bg-transparent hover:bg-slate-100 transition-all duration-200 cursor-pointer flex items-center justify-center -my-1 -mr-1"
                                title="Copy Project ID"
                              >
                                {copiedId === row.project_id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in-50 duration-200" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-slate-400 group-hover/id:text-blue-600 transition-colors" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 md:gap-4 mb-5">
                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-blue-50/80 flex items-center justify-center flex-shrink-0">
                            <User2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Master Developer</p>
                            <p className="font-medium text-slate-700 text-[11px] md:text-xs truncate">{row.client_developer || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-purple-50/80 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-purple-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Usage Type</p>
                            <p className="font-medium text-slate-700 text-[11px] md:text-xs truncate">
                              {row.building_usage_type ? (row.building_usage_type.charAt(0).toUpperCase() + row.building_usage_type.slice(1).replace('_', '-')) : 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-emerald-50/80 flex items-center justify-center flex-shrink-0">
                            <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Location</p>
                            <p className="font-medium text-slate-700 text-[11px] md:text-xs truncate">{row.location || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-indigo-50/80 border border-indigo-50 flex items-center justify-center flex-shrink-0">
                            <Layers className="h-3.5 w-3.5 md:h-4 md:w-4 text-indigo-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Floors</p>
                            <p className="font-medium text-slate-700 text-[11px] md:text-xs truncate">
                              {row.include_basement && row.number_of_basements > 0 ? `${row.number_of_basements}B + ` : ''}
                              {row.include_ground_floor ? 'G + ' : ''}
                              {row.include_mezzanine ? 'M + ' : ''}
                              {row.number_of_floors || '0'} Typical
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto flex flex-col md:flex-row md:items-center justify-between pt-4 border-t border-slate-100 gap-4">
                        <div className="flex items-center gap-1.5 text-[11px] md:text-xs font-medium text-slate-400 whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5" />
                          {formatRelativeDate(row.createdAt)}
                        </div>
                        <div className="grid grid-cols-1 gap-2 md:flex md:gap-2 md:justify-end w-full md:w-auto">
                          <Button
                            size="sm"
                            className="rounded-xl h-9 md:h-8 col-span-2 md:col-auto bg-gradient-to-r from-[#2563eb] to-[#4f46e5] text-white shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 active:translate-y-0 border-none transition-all duration-300 font-bold w-full md:w-auto"
                            onClick={() => {
                              navigate(`/project/${row.project_id}`)
                            }}
                          >
                            <Sparkles className="w-3.5 h-3.5 mr-1 hidden md:block text-blue-100" />
                            Open Project
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center">
                  <FolderKanban className="w-8 h-8 text-slate-400 mb-2" />
                  No recent projects found.
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-8">
            <div
              onClick={handleCreateProject}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl md:rounded-3xl p-6 text-white hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 group cursor-pointer"
            >
              <FileText className="w-8 h-8 md:w-10 md:h-10 mb-4 opacity-90 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="mb-2 font-bold text-lg">Upload New Project</h3>
              <p className="text-sm text-blue-100">Submit as-built drawings for AI analysis</p>
            </div>

            <Link
              to="/assistant"
              className="bg-white rounded-2xl md:rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-violet-200 transition-all duration-200 group"
            >
              <AlertCircle className="w-8 h-8 md:w-10 md:h-10 mb-4 text-violet-500 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="text-slate-900 mb-2 font-bold text-lg">AI Assistant</h3>
              <p className="text-sm text-slate-600">Get instant help with approval questions</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
