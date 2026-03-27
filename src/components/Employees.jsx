import { Plus } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Button } from './ui/button';
import { AddEmployeeModal } from './AddEmployeeModal';
import {
  User2,
  Mail,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
  Trash2,
  Edit3,
  Sparkles,
  ShieldCheck,
  Shield,
  FolderKanban,
  Copy,
  Check,
  AlertCircle,
  Loader2
} from "lucide-react";

import { DELETE_EMPLOYEE_API, GET_ALL_EMPLOYEES_API } from "../Services/admin";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { formatDateWithTime } from "../utils/formatDateMoment";

export function Employees() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPage = Number(searchParams.get("page")) || 1;
  const urlSearch = searchParams.get("search") || "";

  const [employees, setEmployees] = useState([]);
  const [filterText, setFilterText] = useState(urlSearch);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);

  const [copiedId, setCopiedId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // Clear impersonation when viewing employee list (Admin View)
  useEffect(() => {
    sessionStorage.removeItem('impersonate_employee_id');
  }, []);

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("Employee ID Copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Update URL Params Helper
  const updateUrlParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "") next.delete(k);
      else next.set(k, String(v));
    });
    setSearchParams(next);
  };

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (filterText !== (searchParams.get("search") || "")) {
        updateUrlParams({ search: filterText, page: 1 });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [filterText]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo(0, 0);
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [urlPage]);

  // -------------------------------
  // FETCH EMPLOYEES API
  // -------------------------------
  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const params = {
        page: urlPage,
        limit: 10,
        search: urlSearch,
      };

      const res = await GET_ALL_EMPLOYEES_API(params);
      const response = res?.response ? res.response : res;

      if (response?.data?.success) {
        setEmployees(response.data.payload.employees || []);
        setTotalPages(response.data.payload.totalPages || 1);
      }
    } catch (err) {
      console.log("Failed fetching employees:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [urlPage, urlSearch]);

  // -------------------------------
  // DELETE HANDLERS
  // -------------------------------
  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (employee_id) => {
    if (!employee_id) return;
    try {
      const res = await DELETE_EMPLOYEE_API(employee_id);
      const response = res?.response ? res.response : res;

      if (response?.data?.success) {
        toast.success("Employee deleted successfully!");
        await fetchEmployees();
      } else {
        toast.error(response?.data?.payload?.message || response?.data?.message || "Failed to delete employee");
      }
    } catch (error) {
      toast.error("An unexpected error occurred while deleting!");
    } finally {
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-slate-900 mb-2 font-bold text-2xl">Employees Overview</h1>
          <p className="text-slate-600">
            View and manage all your organization's employees.
          </p>
        </div>
      </div>


      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <h2 className="text-lg font-black flex items-center gap-2 text-slate-900">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                <User2 className="w-4 h-4 text-blue-600" />
              </div>
              Employee List
            </h2>

            {/* Search Input */}
            <div className="hidden md:flex items-center w-80 flex-none bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 focus-within:bg-white transition-all duration-300 shadow-sm hover:shadow-md hover:border-blue-200 group">
              <Search className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors shrink-0" />
              <input
                type="text"
                placeholder="Search by ID, Name or Email..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400 min-w-0"
                style={{ marginLeft: '12px' }}
              />
              <button
                onClick={() => {
                  setFilterText("");
                  updateUrlParams({ search: "" });
                }}
                className={`shrink-0 p-0.5 ml-2 rounded-full hover:bg-slate-100 transition-all duration-200 group/clear ${filterText ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}
              >
                <X className="h-3.5 w-3.5 text-slate-400 group-hover/clear:text-red-500" />
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            {/* Mobile Search */}
            <div className="md:hidden w-full flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 focus-within:bg-white transition-all duration-300 group">
              <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors shrink-0" />
              <input
                type="text"
                placeholder="Search employees..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-xs text-slate-800 placeholder:text-slate-400 min-w-0"
                style={{ marginLeft: '8px' }}
              />
              <button
                onClick={() => {
                  setFilterText("");
                  updateUrlParams({ search: "" });
                }}
                className={`shrink-0 p-1 ml-2 rounded-full hover:bg-slate-200 transition-all duration-200 group/clear ${filterText ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}
                style={{ cursor: 'pointer' }}
              >
                <X className="w-4 h-4 text-slate-500 group-hover/clear:text-red-500" />
              </button>
            </div>

            <button
              onClick={() => {
                setEmployeeToEdit(null);
                setShowAddEmployeeModal(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 text-sm font-medium whitespace-nowrap shrink-0 w-full md:w-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Employee</span>
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="relative bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-lg border-2 border-slate-100 overflow-hidden"
                >
                  {/* Serial Number Badge Skeleton */}
                  <div
                    className="absolute skeleton-shimmer rounded-full"
                    style={{ top: '16px', right: '16px', width: '32px', height: '24px' }}
                  ></div>

                  {/* Employee Name & ID Skeleton */}
                  <div className="mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-3.5 mb-2 pr-10">
                      <div className="h-10 w-10 skeleton-shimmer rounded-xl"></div>
                      <div className="h-5 w-48 skeleton-shimmer rounded"></div>
                    </div>
                    <div className="flex items-center gap-2 pl-[54px]">
                      <div className="h-4 w-32 skeleton-shimmer rounded"></div>
                      <div className="h-4 w-16 skeleton-shimmer rounded-full"></div>
                    </div>
                  </div>

                  {/* Contact Info Skeleton */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 skeleton-shimmer rounded-lg"></div>
                      <div>
                        <div className="h-2 w-16 skeleton-shimmer rounded mb-1"></div>
                        <div className="h-3 w-24 skeleton-shimmer rounded"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 skeleton-shimmer rounded-lg"></div>
                      <div>
                        <div className="h-2 w-16 skeleton-shimmer rounded mb-1"></div>
                        <div className="h-3 w-28 skeleton-shimmer rounded"></div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info Skeleton */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
                      <div className="h-8 w-8 skeleton-shimmer rounded-lg"></div>
                      <div>
                        <div className="h-2 w-12 skeleton-shimmer rounded mb-1"></div>
                        <div className="h-3 w-32 skeleton-shimmer rounded"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
                      <div className="h-8 w-8 skeleton-shimmer rounded-lg"></div>
                      <div>
                        <div className="h-2 w-14 skeleton-shimmer rounded mb-1"></div>
                        <div className="h-3 w-20 skeleton-shimmer rounded"></div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Skeleton */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                    <div className="h-9 skeleton-shimmer rounded-xl w-full"></div>
                    <div className="h-9 skeleton-shimmer rounded-xl w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : employees.length === 0 ? (
            <div className="w-full">
              <div
                className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center"
                style={{ minHeight: '500px' }}
              >
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User2 className="w-8 h-8 text-blue-600" />
                </div>

                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  No Employees Found
                </h3>

                <p className="text-base text-slate-600 max-w-md mx-auto mb-8">
                  {filterText
                    ? `We couldn't find any employees matching "${filterText}". Try a different search term.`
                    : "You haven't created any employees yet. Start by adding your first employee to begin managing your team."
                  }
                </p>

                {!filterText && (
                  <button
                    onClick={() => {
                      setEmployeeToEdit(null);
                      setShowAddEmployeeModal(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 text-sm md:text-base whitespace-nowrap cursor-pointer border-none outline-none"
                  >
                    <Plus className="w-5 h-5" />
                    Create Your First Employee
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {employees.map((row, index) => (
                  <div
                    key={row.employee_id}
                    className="group relative bg-white border border-slate-200 rounded-3xl p-6 shadow-md hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
                  >
                    {/* Employee Card Header */}
                    <div className="mb-5 pb-4 border-b border-gray-100 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3.5 min-w-0 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-blue-50/80 flex items-center justify-center flex-shrink-0">
                          <User2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h3 className="font-bold text-slate-900 truncate text-[15px] md:text-[17px] leading-snug" title={row.full_name}>
                            {row.full_name}
                          </h3>
                          <div className="mt-0.5 text-[11px] md:text-xs text-slate-400 font-medium flex items-center gap-1.5 group/id">
                            <span className="truncate tracking-wide uppercase">ID: {row.employee_id}</span>
                            <button
                              onClick={() => handleCopy(row.employee_id)}
                              className="p-1 rounded bg-transparent hover:bg-slate-100 transition-all duration-200 cursor-pointer flex items-center justify-center"
                              title="Copy Employee ID"
                            >
                              {copiedId === row.employee_id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in-50 duration-200" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-slate-400 group-hover/id:text-blue-600 transition-colors" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        {/* Serial Number Badge */}
                        <div
                          className="text-white text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full shadow-sm flex-shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: '#3b82f6', minWidth: '32px' }}
                        >
                          #{index + 1 + (urlPage - 1) * 10}
                        </div>
                      </div>
                    </div>

                    {/* Contact Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50/80 border border-blue-50 flex items-center justify-center flex-shrink-0">
                          <Mail className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Email</p>
                          <p className="font-medium text-slate-700 text-xs truncate">{row.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-purple-50/80 border border-purple-50 flex items-center justify-center flex-shrink-0">
                          <Phone className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Mobile</p>
                          <p className="font-medium text-slate-700 text-xs truncate">{row.mobile}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 min-w-0 sm:col-span-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50/80 border border-emerald-50 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Created</p>
                          <p className="font-medium text-slate-700 text-xs truncate">{formatDateWithTime(row.createdAt)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 min-w-0 sm:col-span-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50/80 border border-indigo-50 flex items-center justify-center flex-shrink-0">
                          <FolderKanban className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Projects</p>
                          <p className="font-medium text-slate-700 text-xs truncate">{row.project_count || 0} {row.project_count === 1 ? 'Project' : 'Projects'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 min-w-0 sm:col-span-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border"
                          style={{
                            backgroundColor: row.is_active ? '#ecfdf5' : '#fef2f2',
                            borderColor: row.is_active ? '#d1fae5' : '#fee2e2'
                          }}
                        >
                          {row.is_active ? (
                            <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Account Status</p>
                          {row.is_active ? (
                            <span className="font-bold text-emerald-700 text-xs flex items-center gap-1.5 truncate">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Active Employee
                            </span>
                          ) : (
                            <span className="font-bold text-red-700 text-xs flex items-center gap-1.5 truncate">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Inactive Employee
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 md:flex md:gap-2 md:justify-end mt-auto pt-4 border-t border-slate-100">
                      <Button
                        size="sm"
                        className="rounded-xl h-9 md:h-8 col-span-2 md:col-auto border border-slate-200 bg-white text-slate-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 font-semibold"
                        onClick={() => {
                          setEmployeeToEdit(row);
                          setShowAddEmployeeModal(true);
                        }}
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1 hidden md:block" />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        className="rounded-xl h-9 md:h-8 col-span-2 md:col-auto bg-gradient-to-r from-[#2563eb] to-[#4f46e5] text-white shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 active:translate-y-0 border-none transition-all duration-300 font-bold"
                        onClick={() => {
                          sessionStorage.setItem('impersonate_employee_id', row.employee_id);
                          navigate(`/admin/${row.employee_id}/projects`, { state: { impersonatedUser: row } });
                        }}
                      >
                        <FolderKanban className="w-3.5 h-3.5 mr-1 hidden md:block text-blue-100" />
                        View Projects
                      </Button>

                      <Button
                        size="sm"
                        className="rounded-xl h-9 md:h-8 col-span-2 md:col-auto bg-[#fff1f2] text-[#e11d48] hover:bg-[#e11d48] hover:text-white border-none shadow-sm transition-all duration-300 font-semibold"
                        onClick={() => handleDeleteClick(row)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1 hidden md:block" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* PAGINATION - Enhanced */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 mt-8 border-t border-slate-100">
                  <p className="text-sm font-medium text-slate-500 order-2 sm:order-1">
                    Showing <span className="text-slate-900 font-bold">{urlPage}</span> of <span className="text-slate-900 font-bold">{totalPages}</span> {totalPages > 1 ? 'pages' : 'page'}
                  </p>

                  <div className="flex items-center gap-1 order-1 sm:order-2">
                    {/* First Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateUrlParams({ page: 1 })}
                      disabled={urlPage <= 1}
                      className={`h-9 px-2 rounded-xl border-slate-200 transition-all duration-200 ${urlPage <= 1 ? "opacity-40 bg-slate-50 text-slate-400" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200"
                        }`}
                      style={{ cursor: urlPage <= 1 ? 'not-allowed' : 'pointer', pointerEvents: 'auto' }}
                      title="First Page"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateUrlParams({ page: urlPage - 1 })}
                      disabled={urlPage <= 1}
                      className={`h-9 px-3 rounded-xl border-slate-200 transition-all duration-200 ${urlPage <= 1 ? "opacity-40 bg-slate-50 text-slate-400" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200"
                        }`}
                      style={{ cursor: urlPage <= 1 ? 'not-allowed' : 'pointer', pointerEvents: 'auto' }}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      <span className="hidden sm:inline">Prev</span>
                    </Button>

                    <div className="flex gap-1 px-1">
                      {(() => {
                        let start = Math.max(1, urlPage - 1);
                        let end = Math.min(totalPages, start + 2);
                        if (end - start < 2) {
                          start = Math.max(1, end - 2);
                        }

                        const pages = [];
                        for (let p = start; p <= end; p++) {
                          pages.push(
                            <button
                              key={p}
                              onClick={() => updateUrlParams({ page: p })}
                              className={`w-9 h-9 rounded-xl text-xs font-bold transition-all duration-200 border cursor-pointer ${urlPage === p
                                ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200"
                                : "text-slate-500 bg-white border-transparent hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100"
                                }`}
                              style={urlPage === p ? { backgroundColor: '#2563eb', color: 'white', cursor: 'pointer' } : { cursor: 'pointer' }}
                            >
                              {p}
                            </button>
                          );
                        }
                        return pages;
                      })()}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateUrlParams({ page: urlPage + 1 })}
                      disabled={urlPage >= totalPages}
                      className={`h-9 px-3 rounded-xl border-slate-200 transition-all duration-200 ${urlPage >= totalPages ? "opacity-40 bg-slate-50 text-slate-400" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200"
                        }`}
                      style={{ cursor: urlPage >= totalPages ? 'not-allowed' : 'pointer', pointerEvents: 'auto' }}
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>

                    {/* Last Page */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateUrlParams({ page: totalPages })}
                      disabled={urlPage >= totalPages}
                      className={`h-9 px-2 rounded-xl border-slate-200 transition-all duration-200 ${urlPage >= totalPages ? "opacity-40 bg-slate-50 text-slate-400" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200"
                        }`}
                      style={{ cursor: urlPage >= totalPages ? 'not-allowed' : 'pointer', pointerEvents: 'auto' }}
                      title="Last Page"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      <AddEmployeeModal
        isOpen={showAddEmployeeModal}
        initialData={employeeToEdit}
        onSuccess={() => {
          fetchEmployees();
          setEmployeeToEdit(null);
        }}
        onClose={() => {
          setShowAddEmployeeModal(false);
          setEmployeeToEdit(null);
        }}
      />

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && employeeToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)' }}
          onClick={() => {
            setShowDeleteModal(false);
            setEmployeeToDelete(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-96 p-6 transform transition-all scale-100 m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Delete Employee</h3>
              <p className="text-sm text-slate-600 mb-4">
                Are you sure you want to delete this employee?
              </p>
            </div>

            {/* Employee Info */}
            <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200 text-left">
              <div className="flex items-center gap-3 mb-2">
                <User2 className="w-4 h-4 text-slate-600" />
                <span className="font-bold text-slate-900">{employeeToDelete.full_name}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Mail className="w-4 h-4 shrink-0" />
                <span className="truncate">{employeeToDelete.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 mt-1">
                <span className="text-xs uppercase tracking-wide">ID: {employeeToDelete.employee_id}</span>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6 text-center">
              This action cannot be undone. All employee data will be permanently removed.
            </p>

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setEmployeeToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // We simulate the deleting loading state dynamically here if needed or just wait for await
                  const btn = document.getElementById("confirm-del-btn");
                  if (btn) btn.innerHTML = "Deleting...";
                  await handleDeleteConfirm(employeeToDelete.employee_id);
                  setShowDeleteModal(false);
                  setEmployeeToDelete(null);
                }}
                id="confirm-del-btn"
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium text-sm shadow-lg shadow-red-200 cursor-pointer flex items-center justify-center gap-2"
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
