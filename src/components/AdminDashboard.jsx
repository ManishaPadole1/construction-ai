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
  Users,
  Copy,
  Check,
  MapPin,
  Sparkles
} from 'lucide-react';
import { formatDateWithTime, formatRelativeDate } from '../utils/formatDateMoment';
import { useProjectModal } from '../Context/ProjectModalContext';
import { useNavigate } from 'react-router-dom';
import { useSelector } from "react-redux";

import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { GET_ADMIN_DASHBOARD_STATS_API } from '../Services/admin/index';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [dashboardStats, setDashboardStats] = useState({
    totalProjects: 0,
    pendingAnalyses: 0,
    completedAnalyses: 0,
    totalEmployees: 0,
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await GET_ADMIN_DASHBOARD_STATS_API();
        const response = res?.response ? res?.response : res;

        if (response?.data?.success) {
          setDashboardStats(response?.data?.payload);
        }
      } catch (error) {
        console.error("Failed to fetch admin stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const currentStats = [
    {
      label: 'Global Projects',
      value: dashboardStats.totalProjects.toString(),
      change: 'Active',
      icon: FolderKanban,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      label: 'Total Employees',
      value: dashboardStats.totalEmployees.toString(),
      change: 'Platform',
      icon: Users,
      color: 'from-fuchsia-500 to-pink-600'
    },
    {
      label: 'Pending Analysis',
      value: dashboardStats.pendingAnalyses.toString(),
      change: 'In Queue',
      icon: Clock,
      color: 'from-amber-500 to-orange-600'
    },
    {
      label: 'Completed Analysis',
      value: dashboardStats.completedAnalyses.toString(),
      change: 'Success',
      icon: CheckCircle2,
      color: 'from-emerald-500 to-teal-600'
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-slate-900 mb-2 font-bold text-2xl">Admin Dashboard</h1>
          <p className="text-slate-600">Welcome back, {user?.full_name?.split(" ")[0] + "."} Platform overview & analytics.</p>
        </div>
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

          <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-slate-200">
            <div className="w-48 h-6 bg-slate-100 mb-6 rounded animate-pulse"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-slate-50 md:rounded-3xl rounded-2xl border border-slate-100 animate-pulse"></div>)}
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

          {/* Recent Global Projects */}
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200">
            <div className="p-4 md:p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-slate-900 mb-1 font-bold text-lg">Company-wide Activity</h2>
                <p className="text-sm text-slate-600 hidden sm:block">Track recent projects across all employees</p>
              </div>
              <Link to="/analysis" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
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
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-orange-50/80 flex items-center justify-center flex-shrink-0">
                            <Users className="h-3.5 w-3.5 md:h-4 md:w-4 text-orange-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Employee</p>
                            <p className="font-medium text-slate-700 text-[11px] md:text-xs truncate">{row.user?.full_name || 'Unknown'}</p>
                            <p className="font-medium text-slate-500 text-[10px] truncate">{row.employee_id || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-blue-50/80 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Master Developer</p>
                            <p className="font-medium text-slate-700 text-[11px] md:text-xs truncate">{row.client_developer || 'N/A'}</p>
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
                            <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 text-indigo-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Project Type</p>
                            <p className="font-medium text-slate-700 text-[11px] md:text-xs truncate">
                              {row.project_type || 'N/A'}
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
                              navigate(`/admin/${row.employee_id}/project/${row.project_id}?authority=${row?.project_type === 'DM_DCD' ? 'DM' : row?.project_type || 'DM'}&mode=1&step=1&view=history`);
                            }}
                          >
                            <FolderKanban className="w-3.5 h-3.5 mr-1 hidden md:block text-blue-100" />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <Link
              to="/admin/employees"
              className="bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-2xl md:rounded-3xl p-6 text-white hover:shadow-xl hover:shadow-pink-500/30 transition-all duration-200 group cursor-pointer"
            >
              <Users className="w-8 h-8 md:w-10 md:h-10 mb-4 opacity-90 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="mb-2">Manage Employees</h3>
              <p className="text-sm text-pink-100">Review and add new employees to the platform</p>
            </Link>

            <Link
              to="/assistant"
              className="bg-white rounded-2xl md:rounded-3xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 group"
            >
              <AlertCircle className="w-8 h-8 md:w-10 md:h-10 mb-4 text-violet-500 group-hover:scale-110 transition-transform duration-200" />
              <h3 className="text-slate-900 mb-2">AI Logging</h3>
              <p className="text-sm text-slate-600">Monitor assistant behavior and logs</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
