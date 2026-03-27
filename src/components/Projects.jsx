import { Plus } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Button } from './ui/button';
import {
  FileText,
  Layers,
  MapPin,
  Building2,
  FolderKanban,
  Ruler,
  Calendar,
  User2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Check,
  Search,
  X,
  Trash2,
  Edit3,
  Sparkles,
  Clock,
  Briefcase,
} from "lucide-react";

import { GET_ALL_PROJECTS_API, DELETE_PROJECT_API } from "../Services/user";
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { formatDateWithTime, formatRelativeDate } from "../utils/formatDateMoment";
import { useProjectModal } from "../Context/ProjectModalContext";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { tourConfig } from "../utils/tourConfig";

export function Projects() {
  const navigate = useNavigate();
  const { openProjectModal } = useProjectModal();

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const urlPage = Number(searchParams.get("page")) || 1;
  const urlSearch = searchParams.get("search") || "";

  const [projects, setProjects] = useState([]);
  const [filterText, setFilterText] = useState(urlSearch);

  // const [page, setPage] = useState(1); // Now derived from URL
  const [totalPages, setTotalPages] = useState(1);

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
    // 1. Target window/document for global scroll
    window.scrollTo(0, 0);
    if (document.documentElement) document.documentElement.scrollTo(0, 0);
    if (document.body) document.body.scrollTo(0, 0);

    // 2. Target the specific scrollable container in the layout (main tag)
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [urlPage, location.pathname, location.search]);



  const [isLoading, setIsLoading] = useState(true);

  // 🔥 Track which row is being deleted
  const [deleteItem, setDeleteItem] = useState(null);
  const [isTourActive, setIsTourActive] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("Project ID Copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };



  // -------------------------------
  // DELETE HANDLERS
  // -------------------------------
  const handleDeleteClick = (project_id) => {
    setDeleteItem(project_id);
  };

  const handleDeleteCancel = () => {
    setDeleteItem(null);
  };

  const handleDeleteConfirm = async (project_id) => {
    if (!project_id) return;

    setDeletingId(project_id);
    try {
      const res = await DELETE_PROJECT_API(project_id);
      const response = res?.response ? res.response : res;

      if (response?.data?.success) {
        toast.success("Project deleted successfully!");
        // Optimistic update: remove from local state immediately
        setProjects(prev => prev.filter(p => p.project_id !== project_id));
        await fetchProjects();
      } else {
        // Show the backend error message if available
        toast.error(response?.data?.payload?.message || response?.data?.message || "Failed to delete project");
      }

    } catch (error) {
      toast.error("An unexpected error occurred while deleting!");
    } finally {
      setDeleteItem(null);
      setDeletingId(null);
    }
  };


  // -------------------------------
  // FETCH PROJECTS API
  // -------------------------------
  const fetchProjects = async () => {
    try {
      setIsLoading(true);

      const params = {
        page: urlPage,
        limit: 10,
        search: urlSearch,
      };

      const res = await GET_ALL_PROJECTS_API(params);
      const response = res?.response ? res.response : res;
      console.log("🙋🏻‍♂️ ~ handleDeleteConfirm ~ response:", response)

      if (response?.data?.success) {
        const fetchedProjects = response.data.payload.projects || [];
        setProjects(fetchedProjects);
        setTotalPages(response.data.payload.totalPages);

        // If current page is empty and not on page 1, go back automatically
        if (fetchedProjects.length === 0 && urlPage > 1) {
          updateUrlParams({ page: urlPage - 1 });
        }
      }

    } catch (err) {
      console.log("Failed fetching projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [urlPage, urlSearch]);

  // Onboarding Tour
  useEffect(() => {
    if (isLoading) return;

    const isHintDone = localStorage.getItem('onboarding_hint_done');
    const isTourDone = localStorage.getItem('onboarding_tour_done');

    // Show hint if no projects and hint not done
    // Show full tour if projects exist and tour not done
    const shouldShowHint = projects.length === 0 && !isHintDone;
    const shouldShowTour = projects.length > 0 && !isTourDone;

    if (shouldShowHint || shouldShowTour) {
      setIsTourActive(true);

      let steps = [];
      let tourType = 'hint';

      if (shouldShowHint) {
        steps = [...tourConfig.projectsTour];
        tourType = 'hint';
      } else {
        steps = [...tourConfig.projectDetailsSteps];
        tourType = 'full';
      }

      const driverObj = driver({
        showProgress: true,
        steps: steps,
        overlayClickable: false,
        allowClose: false,
        showButtons: steps.length > 1 ? ['next', 'previous', 'close'] : ['next', 'close'],
        closeBtnText: 'SKIP',
        nextBtnText: 'NEXT',
        prevBtnText: 'PREVIOUS',
        doneBtnText: 'DONE',
        onHighlightStarted: (element) => {
          setIsTourActive(true);
        },
        onHighlighted: (element) => {
          setIsTourActive(true);
        },
        onDeselected: (element) => {
          // No action needed
        },
        onDestroyed: () => {
          setIsTourActive(false);
          if (tourType === 'hint') {
            localStorage.setItem('onboarding_hint_done', 'true');
          } else {
            localStorage.setItem('onboarding_tour_done', 'true');
          }
        }
      });

      // Small delay to ensure button is rendered and visible
      const timer = setTimeout(() => {
        driverObj.drive();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isLoading, projects.length]);

  // Block scrolling and enforce cursor when tour is active
  useEffect(() => {
    if (isTourActive) {
      const style = document.createElement('style');
      style.id = 'tour-interaction-block-projects';
      style.innerHTML = `
        html, body, main, section { 
          overflow: hidden !important; 
          touch-action: none !important;
          height: 100% !important;
          position: relative !important;
        }
        .driver-popover.driverjs-theme {
          background-color: #ffffff !important;
          color: #1e293b !important;
          padding: 28px !important;
          border-radius: 24px !important;
          box-shadow: 
            0 0 1px rgba(0, 0, 0, 0.1),
            0 10px 40px -10px rgba(0, 0, 0, 0.12),
            0 20px 25px -5px rgba(0, 0, 0, 0.08) !important;
          border: 1px solid rgba(226, 232, 240, 1) !important;
          font-family: 'Inter', -apple-system, system-ui, sans-serif !important;
          max-width: 360px !important;
          overflow: visible !important;
        }

        /* Decorative Accent */
        .driver-popover.driverjs-theme::before {
          content: '';
          position: absolute;
          top: -1px;
          left: 28px;
          right: 28px;
          height: 3px;
          background: linear-gradient(to right, #2563eb, #4f46e5);
          border-radius: 0 0 100px 100px;
          opacity: 0.8;
        }

        .driver-popover-title {
          font-weight: 800 !important;
          font-size: 20px !important;
          color: #0f172a !important;
          margin-bottom: 12px !important;
          line-height: 1.3 !important;
          letter-spacing: -0.02em !important;
        }

        .driver-popover-description {
          font-size: 14.5px !important;
          color: #475569 !important;
          line-height: 1.7 !important;
          font-weight: 500 !important;
        }

        .driver-popover-footer {
          margin-top: 32px !important;
          padding-top: 18px !important;
          border-top: 1px solid #f1f5f9 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          gap: 10px !important;
        }

        /* Standard Buttons */
        .driver-popover-next-btn, 
        .driver-popover-prev-btn {
          background: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
          color: #0f172a !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          padding: 8px 16px !important;
          border-radius: 10px !important;
          cursor: pointer !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
        }

        .driver-popover-next-btn {
          background: #2563eb !important;
          border-color: #2563eb !important;
          color: #ffffff !important;
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2) !important;
        }

        .driver-popover-next-btn:hover {
          background: #1d4ed8 !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 6px 15px rgba(37, 99, 235, 0.3) !important;
        }

        .driver-popover-prev-btn:hover {
          background: #ffffff !important;
          border-color: #cbd5e1 !important;
          transform: translateY(-1px) !important;
        }

        /* The Main Close (Cross) Icon */
        .driver-popover-close-btn {
          position: absolute !important;
          top: 18px !important;
          right: 18px !important;
          width: 24px !important;
          height: 24px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 16px !important;
          color: #94a3b8 !important;
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 8px !important;
          padding: 0 0 1px 0 !important;
          margin: 0 !important;
          line-height: 1 !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          cursor: pointer !important;
          z-index: 100 !important;
        }

        .driver-popover-close-btn:hover {
          background: #f1f5f9 !important;
          color: #1e293b !important;
          border-color: #cbd5e1 !important;
        }

        /* The Footer 'SKIP/DONE' Button */
        .driver-popover-footer .driver-popover-close-btn {
          position: relative !important;
          top: auto !important;
          right: auto !important;
          width: auto !important;
          height: auto !important;
          background: transparent !important;
          border: none !important;
          color: #64748b !important;
          font-size: 12px !important;
          font-weight: 700 !important;
          padding: 8px 12px !important;
          margin-right: auto !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }

        .driver-popover-footer .driver-popover-close-btn:hover {
          background: #f1f5f9 !important;
          color: #ef4444 !important;
          border-radius: 8px !important;
        }

        .driver-popover-progress-text {
          color: #94a3b8 !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          margin-right: 14px !important;
          background: #f8fafc !important;
          padding: 4px 10px !important;
          border-radius: 6px !important;
          border: 1px solid #f1f5f9 !important;
        }

        /* Fix Arrow Shape */
        .driver-popover-arrow {
          display: block !important;
          filter: drop-shadow(0 -1px 0 rgba(226, 232, 240, 1)) !important;
        }
      `;
      document.head.appendChild(style);
      return () => {
        const existingStyle = document.getElementById('tour-interaction-block-projects');
        if (existingStyle) existingStyle.remove();
      };
    }
  }, [isTourActive]);



  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
      <style>
        {`
          .driver-js--targeted, 
          .driver-active-element,
          [data-driver-js-stage] {
            pointer-events: auto !important;
          }
          .driver-popover,
          .driver-js--popover {
            pointer-events: auto !important;
          }
          .tour-disabled-btn {
            cursor: not-allowed !important;
            pointer-events: auto !important;
            opacity: 0.7 !important;
          }
          button:disabled, input:disabled {
            cursor: not-allowed !important;
            pointer-events: auto !important;
          }
          ${isTourActive ? `
            #add-project-btn {
              pointer-events: auto !important;
              opacity: 0.9;
            }
          ` : ''}
        `}
      </style>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-slate-900 mb-1 font-bold text-xl md:text-2xl">Projects Overview</h1>
          <p className="text-slate-600 text-sm md:text-base">
            View and manage all your CAD analysis projects.
          </p>
        </div>

      </div>


      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <h2 className="text-base md:text-lg font-black flex items-center gap-2 text-slate-900">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-blue-50 rounded-lg md:rounded-xl flex items-center justify-center">
                <FolderKanban className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600" />
              </div>
              Project List
            </h2>

            {/* Search Input (Desktop) */}
            <div className="hidden md:flex items-center w-80 flex-none bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 focus-within:bg-white transition-all duration-300 shadow-sm hover:shadow-md hover:border-blue-200 group">
              <Search className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors shrink-0" />
              <input
                type="text"
                placeholder="Search by ID, Name or Location..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                disabled={isTourActive}
                className={`flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400 min-w-0 ${isTourActive ? 'cursor-not-allowed' : ''}`}
                style={{ marginLeft: '12px' }}
              />
              <button
                onClick={() => {
                  setFilterText("");
                  updateUrlParams({ search: "" });
                }}
                disabled={isTourActive}
                className={`shrink-0 p-0.5 ml-2 rounded-full hover:bg-slate-100 transition-all duration-200 group/clear ${filterText ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'} ${isTourActive ? 'cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}
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
                placeholder="Search projects..."
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
              id="add-project-btn"
              disabled={isTourActive}
              onClick={() => !isTourActive && openProjectModal(null, (newProject) => {
                // Fetch projects to update the list
                fetchProjects();

                // If this is NOT the first project, navigate directly to evaluation
                // If it is the first project, stay here so the tour can explain the project card
                if (projects.length > 0) {
                  const match = window.location.pathname.match(/^\/admin\/([^/]+)\//);
                  const prefix = match ? `/admin/${match[1]}` : '';
                  navigate(`${prefix}/project/${newProject.project_id}`);
                }
              })}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 text-sm font-medium whitespace-nowrap shrink-0 w-full md:w-auto ${isTourActive ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}
            >
              <Plus className="w-4 h-4" />
              <span>Add New Project</span>
            </button>
          </div>
        </div>


        {/* LOADING STATE - Skeleton Cards */}
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
                  style={{ top: '12px', right: '12px', width: '40px', height: '24px' }}
                ></div>

                {/* Project Name & ID Skeleton */}
                <div className="mb-3 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-2 pr-10">
                    <div className="h-5 w-5 skeleton-shimmer rounded"></div>
                    <div className="h-5 w-48 skeleton-shimmer rounded"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3.5 w-3.5 skeleton-shimmer rounded"></div>
                    <div className="h-3 w-32 skeleton-shimmer rounded"></div>
                  </div>
                </div>

                {/* Developer & Location Skeleton */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 skeleton-shimmer rounded"></div>
                    <div>
                      <div className="h-3 w-16 skeleton-shimmer rounded mb-1"></div>
                      <div className="h-4 w-24 skeleton-shimmer rounded"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 skeleton-shimmer rounded"></div>
                    <div>
                      <div className="h-3 w-16 skeleton-shimmer rounded mb-1"></div>
                      <div className="h-4 w-28 skeleton-shimmer rounded"></div>
                    </div>
                  </div>
                </div>

                {/* Plot & Area Skeleton */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 skeleton-shimmer rounded"></div>
                    <div>
                      <div className="h-3 w-12 skeleton-shimmer rounded mb-1"></div>
                      <div className="h-4 w-20 skeleton-shimmer rounded"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 skeleton-shimmer rounded"></div>
                    <div>
                      <div className="h-3 w-12 skeleton-shimmer rounded mb-1"></div>
                      <div className="h-4 w-24 skeleton-shimmer rounded"></div>
                    </div>
                  </div>
                </div>

                {/* Floors & Created Skeleton */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 skeleton-shimmer rounded"></div>
                    <div>
                      <div className="h-3 w-12 skeleton-shimmer rounded mb-1"></div>
                      <div className="h-4 w-8 skeleton-shimmer rounded"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 skeleton-shimmer rounded"></div>
                    <div>
                      <div className="h-3 w-14 skeleton-shimmer rounded mb-1"></div>
                      <div className="h-4 w-32 skeleton-shimmer rounded"></div>
                    </div>
                  </div>
                </div>

                {/* Files Skeleton */}
                <div className="mb-3 pb-3 border-b border-gray-100">
                  <div className="flex gap-2">
                    <div className="h-6 w-20 skeleton-shimmer rounded"></div>
                    <div className="h-6 w-28 skeleton-shimmer rounded"></div>
                  </div>
                </div>

                {/* Actions Skeleton */}
                <div className="flex gap-2 justify-end">
                  <div className="h-8 w-16 skeleton-shimmer rounded"></div>
                  <div className="h-8 w-16 skeleton-shimmer rounded"></div>
                  <div className="h-8 w-16 skeleton-shimmer rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="w-full">
            <div
              className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center"
              style={{ minHeight: '500px' }}
            >
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FolderKanban className="w-8 h-8 text-blue-600" />
              </div>

              <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2 md:mb-3">
                No Projects Found
              </h3>

              <p className="text-sm md:text-base text-slate-600 max-w-xs md:max-w-md mx-auto mb-6 md:mb-8 px-4">
                {filterText
                  ? `We couldn't find any projects matching "${filterText}". Try a different search term.`
                  : "You haven't created any projects yet. Start by adding your first project to begin analyzing CAD drawings."
                }
              </p>

              {!filterText && (
                <button
                  onClick={() => openProjectModal(null, (newProject) => {
                    fetchProjects();
                    navigate(`/project/${newProject.project_id}`);
                  })}
                  className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 text-sm md:text-base whitespace-nowrap cursor-pointer border-none outline-none"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Project
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* GRID LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {projects.map((row, index) => (
                <div
                  key={row.project_id}
                  id={index === 0 ? "project-card-0" : undefined}
                  className="group relative bg-white border border-slate-200 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-md hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
                >
                  {/* Project Header with Serial Number */}
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
                            onClick={() => handleCopy(row.project_id)}
                            className="p-1 rounded bg-transparent hover:bg-slate-100 transition-all duration-200 cursor-pointer flex items-center justify-center"
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
                    {/* Serial Number Badge */}
                    <div
                      className="text-white text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full shadow-sm flex-shrink-0 flex items-center justify-center mt-1"
                      style={{ backgroundColor: '#3b82f6', minWidth: '32px' }}
                    >
                      #{index + 1 + (urlPage - 1) * 10}
                    </div>
                  </div>

                  {/* Project Details Grid */}
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 md:gap-4 mb-5">
                    {/* Developer */}
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-blue-50/80 flex items-center justify-center flex-shrink-0">
                        <User2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Master Developer</p>
                        <p className="font-medium text-slate-700 text-[11px] md:text-xs truncate">{row.client_developer || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Usage Type */}
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

                    {/* Project Type */}
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-pink-50/80 flex items-center justify-center flex-shrink-0">
                        <Briefcase className="h-3.5 w-3.5 md:h-4 md:w-4 text-pink-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Project Type</p>
                        <p className="font-medium text-slate-700 text-[11px] md:text-xs truncate">
                          {row.project_type ? row.project_type.replace(/_/g, ' ') : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-emerald-50/80 flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-3.5 w-3.5 md:h-4 md:w-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Location</p>
                        <p className="font-medium text-slate-700 text-[11px] md:text-xs truncate">{row.location || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Plot Number */}
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-3.5 w-3.5 md:h-4 md:w-4 text-slate-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Plot Number</p>
                        <p className="font-medium text-slate-700 text-[11px] md:text-xs truncate">{row.plot_number || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Built-up Area */}
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-amber-50/80 border border-amber-50 flex items-center justify-center flex-shrink-0">
                        <Ruler className="h-3.5 w-3.5 md:h-4 md:w-4 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Built-up Area</p>
                        <p className="font-medium text-slate-700 text-[11px] md:text-xs truncate">{row.built_up_area ? `${row.built_up_area} sq.ft` : 'N/A'}</p>
                      </div>
                    </div>

                    {/* Floors */}
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

                    {/* Created On */}
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-blue-50/80 border border-blue-50 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Created On</p>
                        <p className="font-medium text-slate-700 text-[11px] md:text-xs truncate">{formatDateWithTime(row.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 md:flex md:gap-2 md:justify-end mt-6 pt-4 border-t border-slate-100">
                    {deleteItem !== row.project_id ? (
                      <>
                        <Button
                          id={index === 0 ? "chat-ai-btn-0" : undefined}
                          size="sm"
                          disabled={isTourActive}
                          className={`rounded-xl h-9 md:h-8 bg-[#f0f7ff] text-[#2563eb] hover:bg-[#2563eb] hover:text-white border-none transition-all duration-300 group/chat ${isTourActive ? 'tour-disabled-btn' : ''}`}
                          title="Chat with AI"
                          onClick={() => {
                            if (isTourActive) return;
                            const match = window.location.pathname.match(/^\/admin\/([^/]+)\//);
                            const prefix = match ? `/admin/${match[1]}` : '';

                            if (row.chat_id) {
                              navigate(`${prefix}/assistant/${row.chat_id}`);
                            } else {
                              navigate(`${prefix}/assistant?projectId=${row.project_id}`);
                            }
                          }}
                        >
                          <MessageSquare className="w-3.5 h-3.5 group-hover/chat:scale-110 transition-transform" />
                        </Button>

                        <Button
                          id={index === 0 ? "edit-project-btn-0" : undefined}
                          size="sm"
                          disabled={isTourActive}
                          className={`rounded-xl h-9 md:h-8 border border-slate-200 bg-white text-slate-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 font-semibold ${isTourActive ? 'tour-disabled-btn' : ''}`}
                          onClick={() => !isTourActive && openProjectModal(row, fetchProjects)}
                        >
                          <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                          Edit
                        </Button>

                        <Button
                          id={index === 0 ? "open-dashboard-btn-0" : undefined}
                          size="sm"
                          disabled={isTourActive}
                          className={`rounded-xl h-9 md:h-8 col-span-2 md:col-auto bg-gradient-to-r from-[#2563eb] to-[#4f46e5] text-white shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 active:translate-y-0 border-none transition-all duration-300 font-bold ${isTourActive ? 'tour-disabled-btn' : ''}`}
                          onClick={() => {
                            const match = window.location.pathname.match(/^\/admin\/([^/]+)\//);
                            const prefix = match ? `/admin/${match[1]}` : '';
                            navigate(`${prefix}/project/${row.project_id}`)
                          }}
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-blue-100" />
                          Open Dashboard
                        </Button>

                        <Button
                          id={index === 0 ? "delete-project-btn-0" : undefined}
                          size="sm"
                          disabled={isTourActive}
                          className={`rounded-xl h-9 md:h-8 col-span-2 md:col-auto bg-[#fff1f2] text-[#e11d48] hover:bg-[#e11d48] hover:text-white border-none shadow-sm transition-all duration-300 font-semibold ${isTourActive ? 'tour-disabled-btn' : ''}`}
                          onClick={() => !isTourActive && handleDeleteClick(row.project_id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                          Delete
                        </Button>
                      </>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-center justify-end gap-2 col-span-2 w-full md:w-auto">
                        <Button
                          size="sm"
                          className="rounded-xl h-9 w-full sm:w-auto bg-[#e11d48] text-white hover:bg-[#be123c] border-none shadow-md transition-all duration-200 font-bold"
                          onClick={() => handleDeleteConfirm(row.project_id)}
                          disabled={deletingId === row.project_id}
                        >
                          {deletingId === row.project_id ? "Deleting..." : "Confirm Delete"}
                        </Button>
                        <Button
                          size="sm"
                          className="rounded-xl h-9 w-full sm:w-auto border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all duration-200 font-semibold"
                          onClick={handleDeleteCancel}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                    </div>
                  </div>
              ))}
            </div>

            {/* PAGINATION - Enhanced */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 mt-8 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-500 order-2 sm:order-1">
                Showing <span className="text-slate-900 font-bold">{urlPage}</span> of <span className="text-slate-900 font-bold">{totalPages}</span> {totalPages > 1 ? 'pages' : 'page'}
              </p>

              <div className="flex items-center gap-1 order-1 sm:order-2">
                {/* First Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => !isTourActive && updateUrlParams({ page: 1 })}
                  disabled={urlPage <= 1 || isTourActive}
                  className={`h-9 px-2 rounded-xl border-slate-200 transition-all duration-200 ${urlPage <= 1 || isTourActive ? "tour-disabled-btn" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200"
                    }`}
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => !isTourActive && updateUrlParams({ page: urlPage - 1 })}
                  disabled={urlPage <= 1 || isTourActive}
                  className={`h-9 px-3 rounded-xl border-slate-200 transition-all duration-200 ${urlPage <= 1 || isTourActive ? "tour-disabled-btn" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200"
                    }`}
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
                          onClick={() => !isTourActive && updateUrlParams({ page: p })}
                          disabled={isTourActive}
                          className={`w-9 h-9 rounded-xl text-xs font-bold transition-all duration-200 border ${urlPage === p
                            ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200"
                            : "text-slate-500 bg-white border-transparent hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100"
                            } ${isTourActive ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                          style={urlPage === p && !isTourActive ? { backgroundColor: '#2563eb', color: 'white' } : {}}
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
                  onClick={() => !isTourActive && updateUrlParams({ page: urlPage + 1 })}
                  disabled={urlPage >= totalPages || isTourActive}
                  className={`h-9 px-3 rounded-xl border-slate-200 transition-all duration-200 ${urlPage >= totalPages || isTourActive ? "tour-disabled-btn" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200"
                    }`}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>

                {/* Last Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => !isTourActive && updateUrlParams({ page: totalPages })}
                  disabled={urlPage >= totalPages || isTourActive}
                  className={`h-9 px-2 rounded-xl border-slate-200 transition-all duration-200 ${urlPage >= totalPages || isTourActive ? "tour-disabled-btn" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200"
                    }`}
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>



    </div >
  );
}
