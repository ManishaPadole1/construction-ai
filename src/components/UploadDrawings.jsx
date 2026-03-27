import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Select as MuiSelect, MenuItem, FormControl, InputLabel, Tooltip, Zoom } from '@mui/material';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import {
  Upload, FileText, X, CheckCircle2, ArrowRightLeft, Loader2,
  Layers, ScanSearch, FileCode2, FolderKanban, Plus, Clock,
  Trash2, Edit3, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, FileDigit,
  MapPin, Building2, Hash, Settings2, Calendar, Layout, Info, ExternalLink,
  Search, Copy, Lightbulb, Zap, Bot, Sparkles, AlertTriangle, FileImage, Download, ChevronUp
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AIAnalysisContent } from './AIAnalysis';
import { AuthorityBreakdownContent } from './AuthorityBreakdown';
import { DocumentChecklistContent } from './DocumentChecklist';
import { FeasibilityReportContent } from './FeasibilityReport';
import { DewaRuleCheck } from './DewaRuleCheck';
import { DcdRuleCheck } from './DcdRuleCheck';
import { toast } from "react-hot-toast";
import { useProjectModal } from '../Context/ProjectModalContext';
import { useSSE } from '../Context/SSEContext';
import { formatFileSize } from '../utils/formatFileSize';
import { formatDateWithTime } from '../utils/formatDateMoment';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { tourConfig } from "../utils/tourConfig";
import {
  GET_SINGLE_PROJECT_API,
  CREATE_ANALYSIS_API,
  GET_ANALYSES_BY_PROJECT_API,
  UPDATE_ANALYSIS_TITLE_API,
  DELETE_ANALYSIS_API,
  DOWNLOAD_ANALYSIS_REPORT_API
} from '../Services/user';
import { getAuthorityRules } from '../config/authorityRules';

// ==================== FILE TYPE ICONS MAPPING ====================
// Centralized mapping of file extensions to their corresponding icons and colors
const FILE_TYPE_ICONS = {
  'pdf': {
    icon: FileText,
    bgColor: '#fee2e2',
    textColor: '#dc2626',
    hoverBgColor: '#fecaca'
  },
  'dxf': {
    icon: FileImage,
    bgColor: '#dbeafe',
    textColor: '#2563eb',
    hoverBgColor: '#bfdbfe'
  },
  'xlsx': {
    icon: FileDigit,
    bgColor: '#d1fae5',
    textColor: '#059669',
    hoverBgColor: '#a7f3d0'
  },
  'xls': {
    icon: FileDigit,
    bgColor: '#d1fae5',
    textColor: '#059669',
    hoverBgColor: '#a7f3d0'
  },
  'txt': {
    icon: FileCode2,
    bgColor: '#f1f5f9',
    textColor: '#475569',
    hoverBgColor: '#e2e8f0'
  },
  // Fallback for unknown file types
  'default': {
    icon: FileText,
    bgColor: '#f1f5f9',
    textColor: '#64748b',
    hoverBgColor: '#e2e8f0'
  }
};

// Helper function to get icon component and colors based on file extension or file name
const getFileIcon = (fileExtOrName) => {
  if (!fileExtOrName) return FILE_TYPE_ICONS['default'];

  // Extract extension if full filename is provided
  const ext = fileExtOrName.includes('.')
    ? fileExtOrName.split('.').pop().toLowerCase()
    : fileExtOrName.toLowerCase();

  return FILE_TYPE_ICONS[ext] || FILE_TYPE_ICONS['default'];
};

// ==================== ROTATING FORMAT ICONS COMPONENT ====================
// Component to display supported file formats in a rotating carousel
// v2.0 - Fixed React Hooks violation
const RotatingFormatIcons = ({ formats }) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isSliding, setIsSliding] = React.useState(false);
  const slideRef = React.useRef(null);

  // Generate random interval between 1.8-2.5 seconds for staggered effect
  const [interval] = React.useState(() => 1800 + Math.random() * 700);

  React.useEffect(() => {
    // Only slide if there are multiple formats
    if (formats.length <= 1) return;

    const timer = setInterval(() => {
      setIsSliding(true);

      // Wait for slide-out animation, then change icon
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % formats.length);
        setIsSliding(false);
      }, 400); // Slide animation duration

    }, interval);

    return () => clearInterval(timer);
  }, [formats.length, interval]);

  // Trigger slide-in animation when isSliding becomes true
  React.useEffect(() => {
    if (isSliding && slideRef.current) {
      // Reset to right position
      slideRef.current.style.transform = 'translateX(100%)';
      // Trigger slide-in animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (slideRef.current) {
            slideRef.current.style.transform = 'translateX(0)';
          }
        });
      });
    }
  }, [isSliding]);

  const currentFormat = formats[currentIndex];
  const fileInfo = getFileIcon(currentFormat);
  const FileIcon = fileInfo.icon;

  const nextFormat = formats[(currentIndex + 1) % formats.length];
  const nextFileInfo = getFileIcon(nextFormat);
  const NextIcon = nextFileInfo.icon;

  return (
    <div className="relative w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
      <div
        key={currentIndex}
        className="absolute inset-0 flex items-center justify-center transition-all duration-400 ease-in-out"
        style={{
          backgroundColor: fileInfo.bgColor,
          transform: isSliding ? 'translateX(-100%)' : 'translateX(0)',
          opacity: isSliding ? 0 : 1
        }}
      >
        <FileIcon
          className="w-5 h-5 transition-all duration-400"
          style={{
            color: fileInfo.textColor,
            transform: isSliding ? 'scale(0.8)' : 'scale(1)'
          }}
        />
      </div>

      {/* Next icon sliding in from right */}
      {isSliding && formats.length > 1 && (
        <div
          ref={slideRef}
          className="absolute inset-0 flex items-center justify-center"
          style={{
            backgroundColor: nextFileInfo.bgColor,
            transform: 'translateX(100%)',
            transition: 'transform 400ms ease-in-out'
          }}
        >
          <NextIcon className="w-5 h-5" style={{ color: nextFileInfo.textColor }} />
        </div>
      )}
    </div>
  );
};


const steps = [
  { id: 1, label: 'Upload', path: '/upload' },
  { id: 2, label: 'Analyze', path: '/analysis' },
  { id: 3, label: 'Review', path: '/authorities' },
  { id: 4, label: 'Document Checklist', path: '/checklist' },
  { id: 5, label: 'Report', path: '/report' },
];

const authorityMeta = {
  all: { color: 'from-slate-700 to-slate-900' },
  DM: { color: 'from-blue-500 to-indigo-600' },
  DEWA: { color: 'from-emerald-500 to-teal-600' },
  DCD: { color: 'from-red-500 to-orange-600' },
  RTA: { color: 'from-violet-500 to-purple-600' },
  DDA: { color: 'from-amber-500 to-orange-600' },
  DLD: { color: 'from-cyan-500 to-blue-600' },
  DHA: { color: 'from-sky-500 to-indigo-600' },
  TRAKHEES: { color: 'from-yellow-500 to-amber-600' },
  DUBAI_ENV: { color: 'from-green-500 to-emerald-600' },
  RERA: { color: 'from-rose-500 to-pink-600' }
};

const authorities = [
  { id: 1, short: 'DM', label: 'Dubai Municipality', value: 'DM' },
  { id: 2, short: 'DEWA', label: 'Dubai Electricity & Water Authority', value: 'DEWA' },
  { id: 3, short: 'DCD', label: 'Dubai Civil Defence', value: 'DCD' },
  { id: 4, short: 'RTA', label: 'Roads & Transport Authority', value: 'RTA' },
  { id: 6, short: 'DDA', label: 'Dubai Development Authority', value: 'DDA' },
  { id: 7, short: 'DLD', label: 'Dubai Land Department', value: 'DLD' },
  { id: 8, short: 'DHA', label: 'Dubai Health Authority', value: 'DHA' },
  { id: 9, short: 'TRAKHEES', label: 'Trakhees', value: 'TRAKHEES' },
  { id: 10, short: 'ENV', label: 'Dubai Environment Department', value: 'DUBAI_ENV' },
  { id: 11, short: 'RERA', label: 'Real Estate Regulatory Agency', value: 'RERA' },
  { id: 5, short: 'ALL', label: 'All Authorities', value: 'all' },
];

// ==================== AUTHORITY-WISE UPLOAD RULES ====================
// Dynamic configuration for each authority's upload requirements
// Helper to map Mode IDs to Icons
const MODE_ICONS = {
  1: Layers,
  2: ScanSearch,
  3: FileCode2
};

const LoaderProgress = ({ open, progress, onClose, isDummyLoading }) => {
  if (!open) return null;

  const getLoaderMessage = (p) => {
    if (isDummyLoading) {
      switch (true) {
        case p < 15: return "Initializing secure connection...";
        case p < 30: return "Verifying document signatures...";
        case p < 45: return "Scanning for malicious content...";
        case p < 60: return "Validating CAD file integrity...";
        case p < 80: return "Checking authority constraints...";
        case p < 95: return "Preparing AI processing queue...";
        default: return "Launching Analysis Engine...";
      }
    } else {
      switch (true) {
        case p < 20: return "Uploading files to server...";
        case p < 45: return "Processing file formats...";
        case p < 70: return "Transferring to AI Pipeline...";
        case p < 90: return "AI generating insights...";
        default: return "Finalizing Analysis Report...";
      }
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
    >
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10 z-0"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-50 rounded-tr-full -ml-8 -mb-8 z-0"></div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Logo / Icon Animation */}
          <div className="mb-6 relative">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center relative">
              <Bot className="w-10 h-10 text-indigo-600 animate-pulse" />
              <div className="absolute inset-0 border-4 border-indigo-100 rounded-full border-t-indigo-600 animate-spin"></div>
            </div>
            <div className="absolute -bottom-2 right-0 bg-white shadow-md rounded-full p-1.5 border border-slate-100">
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 animate-bounce" />
            </div>
          </div>

          <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">AI Analysis in Progress</h3>
          <p className="text-slate-500 text-sm text-center mb-8 max-w-[280px] leading-relaxed">
            Please wait while our AI engine analyzes your drawings and requirements...
          </p>

          {/* Progress Bar Container */}
          <div className="w-full relative mb-4">
            <div className="flex justify-between text-xs font-bold text-slate-600 mb-2 px-1">
              <span>Processing...</span>
              <span>{Math.round(progress)}%</span>
            </div>

            <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
              <div
                className="h-full transition-all duration-300 ease-out relative"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(to right, #6366f1, #a855f7, #ec4899)'
                }}
              >
                <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_1.5s_infinite]"></div>
              </div>
            </div>
          </div>

          {/* Steps / Messages based on progress */}
          <div className="h-6 overflow-hidden w-full text-center">
            <p className="text-xs font-medium text-slate-400 animate-pulse">
              {getLoaderMessage(progress)}
            </p>
          </div>

          {/* Abort Button during Dummy Phase */}
          {isDummyLoading && (
            <button
              onClick={onClose}
              className="mt-6 text-xs font-bold px-5 py-2.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors shadow-sm cursor-pointer"
            >
              Abort Analysis
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

const toTitleCase = (str) => {
  if (!str) return '';
  return str.toLowerCase().split(/[_\s]+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export function UploadDrawings() {
  const navigate = useNavigate();
  const { project_id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { activeJobs } = useSSE();

  // ---------------------- STATES ----------------------
  const [projectData, setProjectData] = useState(null);

  // Immediate validation of URL parameters
  // Initial derivation of current state from URL
  const allowedAuthorities = authorities.map(a => a.value);
  const rawAuthority = searchParams.get("authority");
  const currentAuthority = (rawAuthority && allowedAuthorities.includes(rawAuthority)) ? rawAuthority : authorities[0].value;

  // Get Authority Rules from centralized config
  const authorityRules = getAuthorityRules(currentAuthority, projectData?.project_type || "RENOVATION");

  // Transform authority rules into consumable UPLOAD_MODES array
  const UPLOAD_MODES = useMemo(() => Object.keys(authorityRules).map(modeId => {
    const modeConfig = authorityRules[modeId];
    const id = parseInt(modeId);
    return {
      id: id,
      dbValue: `MODULE${id}`,
      title: modeConfig.name,
      subtitle: modeConfig.description,
      icon: MODE_ICONS[id] || Layers
    };
  }), [authorityRules]);

  const getModeLabelHelper = (val) => {
    if (!val) return 'Unknown Mode';
    // Match by DB Value (string) or ID (number)
    const mode = UPLOAD_MODES.find(m => m.dbValue === val || m.id === val);
    return mode ? mode.title : val;
  };

  const analysis_id = searchParams.get("analysis_id");
  const urlMode = Number(searchParams.get("mode"));
  const urlStep = Number(searchParams.get("step"));

  const rawView = searchParams.get("view") || "history";
  const allowedViews = ["add", "edit", "history"];
  const urlView = allowedViews.includes(rawView) ? rawView : "history";

  const { openProjectModal } = useProjectModal();

  // ---------------------- STATES ----------------------
  // projectData moved to top
  const [historyRecords, setHistoryRecords] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  // Derived states from URL (Single Source of Truth)
  const isAddingNewInitial = urlView === "add";
  const [isAddingNew, setIsAddingNew] = useState(isAddingNewInitial);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0);

  // Derived states from URL (Single Source of Truth)
  const uploadMode = Number(searchParams.get("mode")) || 1;
  const activeStep = Number(searchParams.get("step")) || 1;

  const [analysisTitle, setAnalysisTitle] = useState('');
  const [isTitleFocused, setIsTitleFocused] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [copiedProjectId, setCopiedProjectId] = useState(false);
  const [copiedAnalysisId, setCopiedAnalysisId] = useState(false);

  // Mode Change Confirmation State
  const [pendingMode, setPendingMode] = useState(null);
  const [showModeChangeConfirmation, setShowModeChangeConfirmation] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isDummyLoading, setIsDummyLoading] = useState(false);
  const abortRef = useRef(false);

  // Loader State (Progress only, visibility driven by 'loading')
  const [loaderProgress, setLoaderProgress] = useState(0);

  useEffect(() => {
    if (!loading) {
      setLoaderProgress(0);
    }
  }, [loading]);

  // Listen to SSE completion to immediately trigger re-fetching so we get full data
  useEffect(() => {
    const handleAnalysisCompleted = (e) => {
      setRefreshHistoryTrigger(prev => prev + 1);
    };
    window.addEventListener('ANALYSIS_COMPLETED', handleAnalysisCompleted);
    return () => window.removeEventListener('ANALYSIS_COMPLETED', handleAnalysisCompleted);
  }, []);

  const [copiedAnalysisIdCard, setCopiedAnalysisIdCard] = useState(null);
  const [editingAnalysis, setEditingAnalysis] = useState(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [deletingAnalysis, setDeletingAnalysis] = useState(null);
  const [drawingFiles, setDrawingFiles] = useState({});
  const [requirementFiles, setRequirementFiles] = useState({});
  const [requirementType, setRequirementType] = useState('txt');
  const [activeDragKey, setActiveDragKey] = useState(null); // Stores the key of the input being dragged over
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [authorityCounts, setAuthorityCounts] = useState({});
  const mainContentRef = useRef(null);
  const tabsListRef = useRef([]);
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [slideDirection, setSlideDirection] = useState('right');
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [isTourActive, setIsTourActive] = useState(false);

  // Drag to Scroll Logic Removed as per user request
  const modeScrollRef = useRef(null);
  const authScrollRef = useRef(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkForScrollVisibility = () => {
    if (modeScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = modeScrollRef.current;
      setCanScrollLeft(scrollLeft > 10); // buffer
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkForScrollVisibility();
    window.addEventListener('resize', checkForScrollVisibility);
    return () => window.removeEventListener('resize', checkForScrollVisibility);
  }, [UPLOAD_MODES]);

  const scrollContainer = (direction) => {
    if (modeScrollRef.current) {
      const scrollAmount = 400;
      modeScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Floating Sticky Header State (BoundingRect based)
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [headerStyle, setHeaderStyle] = useState({ left: 0, width: '100%' });
  const sentinelRef = useRef(null);
  const [bannerOffset, setBannerOffset] = useState(0);

  useEffect(() => {
    const checkBanner = () => {
      const banner = document.getElementById('impersonation-banner');
      if (banner) {
        setBannerOffset(banner.getBoundingClientRect().height);
      } else {
        setBannerOffset(0);
      }
    };
    checkBanner();
    // initial check after short delay to ensure DOM layout
    const timer = setTimeout(checkBanner, 100);
    window.addEventListener('resize', checkBanner);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkBanner);
    };
  }, []);

  const updateHeaderDimensions = () => {
    if (mainContentRef.current) {
      const rect = mainContentRef.current.getBoundingClientRect();
      setHeaderStyle({
        left: rect.left,
        width: rect.width,
      });
    }
  };

  useEffect(() => {
    const handleScrollCheck = () => {
      if (mainContentRef.current) {
        const rect = mainContentRef.current.getBoundingClientRect();
        // Trigger sticky header sooner on mobile (after 150px) and 250px on desktop
        const threshold = window.innerWidth < 768 ? -150 : -250;
        setShowStickyHeader(rect.top < threshold);

        if (rect.top < threshold && headerStyle.left === 0) {
          updateHeaderDimensions();
        }
      }
    };

    // Use ResizeObserver for more reliable dimension tracking
    let resizeObserver = null;
    if (mainContentRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateHeaderDimensions();
      });
      resizeObserver.observe(mainContentRef.current);
    }

    // Initial measurements with a small delay to ensure layout has settled after refresh
    const timer = setTimeout(() => {
      updateHeaderDimensions();
      handleScrollCheck();
    }, 100);

    // Event Listeners
    window.addEventListener('scroll', handleScrollCheck, { capture: true });
    window.addEventListener('resize', handleScrollCheck);
    window.addEventListener('resize', updateHeaderDimensions);

    return () => {
      clearTimeout(timer);
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('scroll', handleScrollCheck, { capture: true });
      window.removeEventListener('resize', handleScrollCheck);
      window.removeEventListener('resize', updateHeaderDimensions);
    };
  }, [selectedAnalysis, isAddingNew]); // Re-run when view changes

  // Main Authority Indicator logic
  const [authIndicatorReady, setAuthIndicatorReady] = useState(false);

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const activeIndex = authorities.findIndex(a => a.value === currentAuthority);
      if (activeIndex !== -1 && tabsListRef.current[activeIndex]) {
        const el = tabsListRef.current[activeIndex];
        if (el.offsetWidth === 0) return;

        setTabIndicatorStyle({
          left: el.offsetLeft,
          width: el.offsetWidth,
          opacity: 1
        });
        setAuthIndicatorReady(true);

        if (authScrollRef.current) {
          const container = authScrollRef.current;
          const scrollLeft = el.offsetLeft - (container.offsetWidth / 2) + (el.offsetWidth / 2);
          container.scrollTo({
            left: scrollLeft,
            behavior: isFirstRender ? 'auto' : 'smooth'
          });
        }
      }
    };

    updateIndicator();
    // Retries for potential layout shifts (fonts, project data loading)
    const timers = [50, 150, 400, 1000, 2000].map(ms => setTimeout(updateIndicator, ms));
    window.addEventListener('resize', updateIndicator);

    return () => {
      timers.forEach(t => clearTimeout(t));
      window.removeEventListener('resize', updateIndicator);
    };
  }, [currentAuthority, authorityCounts, selectedAnalysis, isAddingNew]);

  const modeTabsRef = useRef([]);
  const [modeIndicatorStyle, setModeIndicatorStyle] = useState({ left: 0, width: 0, height: 0, opacity: 0 });
  const [modeIndicatorReady, setModeIndicatorReady] = useState(false);

  useLayoutEffect(() => {
    const updateModeIndicator = () => {
      const activeIndex = UPLOAD_MODES.findIndex(m => m.id === uploadMode);
      if (activeIndex !== -1 && modeTabsRef.current[activeIndex]) {
        const el = modeTabsRef.current[activeIndex];
        if (el.offsetWidth === 0) return;

        setModeIndicatorStyle({
          left: el.offsetLeft,
          top: el.offsetTop,
          width: el.offsetWidth,
          height: el.offsetHeight,
          opacity: 1
        });
        setModeIndicatorReady(true);
        if (isFirstRender) setIsFirstRender(false);

        if (modeScrollRef.current) {
          const container = modeScrollRef.current;
          const scrollLeft = el.offsetLeft - (container.offsetWidth / 2) + (el.offsetWidth / 2);
          container.scrollTo({
            left: scrollLeft,
            behavior: isFirstRender ? 'auto' : 'smooth'
          });
        }
      }
    };

    updateModeIndicator();
    const timers = [50, 150, 400, 1000, 2000].map(ms => setTimeout(updateModeIndicator, ms));
    window.addEventListener('resize', updateModeIndicator);
    return () => {
      timers.forEach(t => clearTimeout(t));
      window.removeEventListener('resize', updateModeIndicator);
    };
  }, [uploadMode, UPLOAD_MODES, isAddingNew, currentAuthority]);

  const [paginationStats, setPaginationStats] = useState(null);


  const [searchTerm, setSearchTerm] = useState(searchParams.get("analysis_search") || "");

  // URL Params
  const urlPage = Number(searchParams.get("analysis_page")) || 1;
  const urlSearch = searchParams.get("analysis_search") || "";

  // Scroll to top on page change - now selective to exclude mode switch
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
  }, [
    urlPage,
    location.pathname,
    searchParams.get("authority"),
    searchParams.get("step"),
    searchParams.get("view"),
    searchParams.get("analysis_id")
  ]);

  // Debounce search update to URL
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== (searchParams.get("analysis_search") || "")) {
        updateUrlParams({ analysis_search: searchTerm, analysis_page: 1 });
      }
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const updateUrlParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "") next.delete(k);
      else next.set(k, String(v));
    });
    setSearchParams(next, { replace: true });
  };

  const getExt = (name) => (name ? name.split(".").pop().toLowerCase() : "");
  const isAllowed = (file, allowedExts) => allowedExts.includes(getExt(file?.name || ""));

  // Sanitize URL params (force defaults if missing or invalid)
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    const allowedAuthorities = new Set(authorities.map(a => a.value));
    const allowedViews = new Set(["add", "edit", "history"]);
    let changed = false;

    // 1. Authority Sanitization
    const authInUrl = next.get("authority");
    if (!authInUrl || !allowedAuthorities.has(authInUrl)) {
      next.set("authority", authorities[0].value);
      changed = true;
    }

    // 2. Mode Sanitization - Only if we have modes defined
    if (UPLOAD_MODES.length > 0) {
      const validModeIds = UPLOAD_MODES.map(m => m.id);
      const rawModeInUrl = next.get("mode");
      const modeInUrl = Number(rawModeInUrl);

      if (!rawModeInUrl || !validModeIds.includes(modeInUrl)) {
        const defaultMode = String(validModeIds[0]);
        if (rawModeInUrl !== defaultMode) {
          next.set("mode", defaultMode);
          changed = true;
        }
      }
    }

    // 3. Step Sanitization
    const rawStepInUrl = next.get("step");
    const stepInUrl = Number(rawStepInUrl);
    if (!rawStepInUrl || ![1, 2, 3, 4, 5].includes(stepInUrl)) {
      if (rawStepInUrl !== "1") {
        next.set("step", "1");
        changed = true;
      }
    }

    // 4. View Sanitization
    const viewInUrl = next.get("view");
    if (!viewInUrl || !allowedViews.has(viewInUrl)) {
      if (viewInUrl !== "history") {
        next.set("view", "history");
        changed = true;
      }
    }

    if (changed && next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, UPLOAD_MODES]);

  // Sync activeStep logic removed as it's now derived

  // Sync requirement type and clear files with upload mode change
  useEffect(() => {
    if (uploadMode === 1) setRequirementType('txt');
    else setRequirementType('dxf');

    setDrawingFiles({});
    setRequirementFiles({});
  }, [uploadMode]);

  // Keep inline edit title in sync when selected analysis changes
  useEffect(() => {
    if (selectedAnalysis?.title) {
      setEditTitle(selectedAnalysis.title);
      setIsEditingTitle(false);
    }
  }, [selectedAnalysis]);

  // Hydration logic removed as states are derived directly from URL

  // Sync to URL removed as interactions now update URL directly

  // Fetch Project Details
  useEffect(() => {
    if (!project_id) {
      toast.error("Invalid Project ID");
      navigate('/projects');
      return;
    }

    const fetchProject = async () => {
      try {
        const res = await GET_SINGLE_PROJECT_API(project_id);
        const response = res?.response || res;
        if (response?.data?.success) {
          setProjectData(response.data.payload);
        } else {
          toast.error("Project not found");
          navigate('/projects');
        }
      } catch (err) {
        toast.error("Failed to fetch project");
      }
    };
    fetchProject();
  }, [project_id]);

  // Fetch Analysis History
  useEffect(() => {
    if (!project_id) {
      setLoadingHistory(false);
      return;
    }

    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const params = {
          page: urlPage,
          limit: 10,
          search: urlSearch
        };
        const res = await GET_ANALYSES_BY_PROJECT_API(project_id, currentAuthority, params);
        const response = res?.response || res;
        if (response?.data?.success) {
          setHistoryRecords(response.data.payload.analyses || []);
          if (response.data.payload.pagination) {
            setPaginationStats(response.data.payload.pagination);
          }
          if (response.data.payload.authorityCounts) {
            setAuthorityCounts(response.data.payload.authorityCounts);
          }
        }
      } catch (err) {
        console.error("History fetch error:", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [project_id, currentAuthority, urlPage, urlSearch, refreshHistoryTrigger]);

  // Auto-focus input when editing title
  useEffect(() => {
    if (isEditingTitle) {
      const input = document.getElementById("edit-analysis-title");
      if (input) {
        setTimeout(() => input.focus(), 100);
      }
    }
  }, [isEditingTitle]);

  // Sync view state from URL
  useEffect(() => {
    if (urlView === "add") {
      setIsAddingNew(true);
      setSelectedAnalysis(null);
    } else if (urlView === "edit" && analysis_id && historyRecords.length > 0) {
      const found = historyRecords.find(r => r.analysis_id === analysis_id);
      if (found) {
        setSelectedAnalysis(found);
        setIsAddingNew(false);
      } else {
        toast.error("Analysis not found");
        updateUrlParams({ view: "history", analysis_id: null, step: 1 });
      }
    } else if (urlView === "history") {
      setSelectedAnalysis(null);
      setIsAddingNew(false);
      if (!analysis_id && activeStep !== 1) {
        updateUrlParams({ step: 1 });
      }
    }
  }, [urlView, analysis_id, historyRecords]);

  // Dashboard Initial Tour
  useEffect(() => {
    if (loading || isAddingNew || selectedAnalysis) return;

    const isTourDone = localStorage.getItem('dashboard_tour_done');
    if (!isTourDone) {
      setIsTourActive(true);
      const driverObj = driver({
        showProgress: true,
        steps: tourConfig.dashboardTour,
        overlayClickable: false,
        allowClose: false,
        showButtons: tourConfig.dashboardTour.length > 1 ? ['next', 'previous', 'close'] : ['next', 'close'],
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
          localStorage.setItem('dashboard_tour_done', 'true');
        }
      });

      const timer = setTimeout(() => {
        driverObj.drive();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [loading, isAddingNew, selectedAnalysis]);

  // Block scrolling and enforce cursor when tour is active
  useEffect(() => {
    if (isTourActive) {
      const style = document.createElement('style');
      style.id = 'tour-interaction-block';
      style.innerHTML = `
        html, body, main, section { 
          overflow: hidden !important; 
          touch-action: none !important;
          height: 100% !important;
          position: relative !important;
        }
        .tour-disabled-btn {
          cursor: not-allowed !important;
          pointer-events: auto !important;
          opacity: 0.7 !important;
        }
        button:disabled, input:disabled, label.tour-disabled-label {
          cursor: not-allowed !important;
          pointer-events: auto !important;
          opacity: 0.7 !important;
        }

        /* Modernized Driver.js Popover - Premium SaaS Look */
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
        const existingStyle = document.getElementById('tour-interaction-block');
        if (existingStyle) existingStyle.remove();
      };
    }
  }, [isTourActive]);

  // New Analysis Page Tour
  useEffect(() => {
    if (!isAddingNew || selectedAnalysis) return;

    const isNewAnalysisTourDone = localStorage.getItem('new_analysis_tour_done');
    if (!isNewAnalysisTourDone) {
      setIsTourActive(true);
      const driverObj = driver({
        showProgress: true,
        steps: tourConfig.newAnalysisTour,
        overlayClickable: false,
        allowClose: false,
        showButtons: tourConfig.newAnalysisTour.length > 1 ? ['next', 'previous', 'close'] : ['next', 'close'],
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
          localStorage.setItem('new_analysis_tour_done', 'true');
        }
      });

      const timer = setTimeout(() => {
        driverObj.drive();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isAddingNew, selectedAnalysis]);

  // Upload/Analysis Tour
  useEffect(() => {
    if (activeStep !== 2 || isAddingNew || !selectedAnalysis) return;

    const isTourDone = localStorage.getItem('upload_tour_done');
    if (!isTourDone) {
      setIsTourActive(true);
      const driverObj = driver({
        showProgress: true,
        steps: tourConfig.uploadTour,
        overlayClickable: false,
        allowClose: false,
        showButtons: tourConfig.uploadTour.length > 1 ? ['next', 'previous', 'close'] : ['next', 'close'],
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
          localStorage.setItem('upload_tour_done', 'true');
        }
      });

      const timer = setTimeout(() => {
        driverObj.drive();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [activeStep, isAddingNew, selectedAnalysis]);

  const handleAuthorityChange = (auth) => {
    // Get rules for the new authority
    const newAuthorityRules = getAuthorityRules(auth, projectData?.project_type || "RENOVATION");
    const allowedModes = Object.keys(newAuthorityRules).map(Number);

    // Check if current mode is allowed for new authority
    if (!allowedModes.includes(uploadMode)) {
      // Reset to first allowed mode
      const firstAllowedMode = allowedModes[0];
      updateUrlParams({ authority: auth, analysis_id: null, view: "history", mode: firstAllowedMode, step: 1 });
    } else {
      updateUrlParams({ authority: auth, analysis_id: null, view: "history", step: 1 });
    }

    setIsAddingNew(false);
    setSelectedAnalysis(null);
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setSelectedAnalysis(null);
    setDrawingFiles({});
    setRequirementFiles({});
    updateUrlParams({ authority: currentAuthority, analysis_id: null, step: 1, mode: 1, view: "add" });
  };

  const handleSelectAnalysis = (rec) => {
    updateUrlParams({ authority: currentAuthority, analysis_id: rec.analysis_id, step: 2, view: "edit" });
  };

  const handleDeleteClick = (e, rec) => {
    e.stopPropagation();
    setDeletingAnalysis(rec);
  };

  const handleDownloadReport = async (e, analysis) => {
    e.stopPropagation();
    try {
      toast.loading("Downloading report...");
      const response = await DOWNLOAD_ANALYSIS_REPORT_API(analysis.analysis_id);

      if (response && response.data) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Analysis_Report_${analysis.analysis_id}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.dismiss();
        toast.success("Report downloaded successfully");
      } else {
        toast.dismiss();
        toast.error("Failed to download report");
      }
    } catch (err) {
      toast.dismiss();
      toast.error("Error downloading report");
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    if (!deletingAnalysis) return;
    const aid = deletingAnalysis.analysis_id;
    try {
      setIsDeleting(true);
      const res = await DELETE_ANALYSIS_API(aid);
      if (res?.data?.success) {
        toast.success("Deleted");
        setHistoryRecords(prev => prev.filter(r => r.analysis_id !== aid));

        // Update counts
        setAuthorityCounts(prev => {
          const updated = { ...prev };

          // User specified "All" is a distinct authority type, not an aggregate.
          // Only decrement the specific matched authority.
          const authRaw = deletingAnalysis.authority || deletingAnalysis.authority_type || currentAuthority;

          if (authRaw) {
            const key = Object.keys(updated).find(k => k.toUpperCase() === authRaw.toUpperCase());
            if (key && updated[key] > 0) {
              updated[key] -= 1;
            }
          }
          return updated;
        });
        if (analysis_id === aid) {
          updateUrlParams({ authority: currentAuthority, analysis_id: null, view: "history" });
        }
        setDeletingAnalysis(null);
      }
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (e, rec) => {
    e.stopPropagation();
    setEditingAnalysis(rec);
    setEditingTitleValue(rec.title);
  };

  const confirmEditTitle = async () => {
    if (!editingAnalysis || !editingTitleValue.trim() || editingTitleValue.trim() === editingAnalysis.title) {
      setEditingAnalysis(null);
      return;
    }
    try {
      setIsUpdatingTitle(true);
      const res = await UPDATE_ANALYSIS_TITLE_API(editingAnalysis.analysis_id, editingTitleValue.trim());
      if (res?.data?.success) {
        toast.success("Title updated");
        setHistoryRecords(prev => prev.map(r => r.analysis_id === editingAnalysis.analysis_id ? { ...r, title: editingTitleValue.trim() } : r));
        if (selectedAnalysis?.analysis_id === editingAnalysis.analysis_id) {
          setSelectedAnalysis(prev => prev ? { ...prev, title: editingTitleValue.trim() } : prev);
        }
        setEditingAnalysis(null);
      }
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setIsUpdatingTitle(false);
    }
  };

  const handleInlineTitleUpdate = async () => {
    const trimmed = editTitle.trim();
    if (!selectedAnalysis || !trimmed || trimmed === selectedAnalysis.title) {
      setIsEditingTitle(false);
      setEditTitle(selectedAnalysis?.title || '');
      return;
    }
    try {
      const res = await UPDATE_ANALYSIS_TITLE_API(selectedAnalysis.analysis_id, trimmed);
      if (res?.data?.success) {
        toast.success("Title updated");
        setHistoryRecords(prev =>
          prev.map(r => r.analysis_id === selectedAnalysis.analysis_id ? { ...r, title: trimmed } : r)
        );
        setSelectedAnalysis(prev => prev ? { ...prev, title: trimmed } : prev);
        setIsEditingTitle(false);
      } else {
        toast.error("Update failed");
      }
    } catch (err) {
      toast.error("Update failed");
    }
  };

  const MAX_DRAWING_FILE_SIZE_MB = 700;
  const MAX_REQUIREMENT_FILE_SIZE_MB = 10;

  const handleDragEvent = (e, key) => {
    e.preventDefault();
    e.stopPropagation();
    if (["dragenter", "dragover"].includes(e.type)) setActiveDragKey(key);
    if (e.type === "dragleave") setActiveDragKey(null);
  };

  const handleFileDrop = (section, key, file) => {
    if (section === 'drawing') setDrawingFiles(prev => ({ ...prev, [key]: file }));
    else setRequirementFiles(prev => ({ ...prev, [key]: file }));
  };

  const handleModeChangeRequest = (newMode) => {
    // If currently selected mode is same, do nothing
    if (uploadMode === newMode) return;

    // Check if any files are currently selected
    const currentIndex = UPLOAD_MODES.findIndex(m => m.id === uploadMode);
    const newIndex = UPLOAD_MODES.findIndex(m => m.id === newMode);
    setSlideDirection(newIndex > currentIndex ? 'right' : 'left');

    const hasFiles = Object.keys(drawingFiles).length > 0 || Object.keys(requirementFiles).length > 0;

    if (hasFiles) {
      setPendingMode(newMode);
      setShowModeChangeConfirmation(true);
    } else {
      updateUrlParams({ mode: newMode });
    }
  };

  const confirmModeChange = () => {
    if (pendingMode) {
      updateUrlParams({ mode: pendingMode });
      setPendingMode(null);
    }
    setShowModeChangeConfirmation(false);
  };

  const cancelModeChange = () => {
    setPendingMode(null);
    setShowModeChangeConfirmation(false);
  };

  const removeFile = (section, key) => {
    if (section === 'drawing') {
      setDrawingFiles(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } else {
      setRequirementFiles(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    const inputId = `${section}-upload-${key}`;
    const input = document.getElementById(inputId);
    if (input) input.value = "";
  };



  const handleAnalyze = async () => {
    if (!isAddingNew) return;

    // Get active rules for current authority and mode
    const config = authorityRules[uploadMode];

    if (!config) {
      toast.error("Invalid configuration for selected authority and mode");
      return;
    }

    if (!analysisTitle?.trim()) {
      toast.error("Please enter an Analysis Title");
      // Focus the title input for better UX
      const titleInput = document.getElementById("analysis-title");
      if (titleInput) titleInput.focus();
      return;
    }

    // Restrict max 2 concurrent analyses
    const pendingAnalysesCount = historyRecords.filter(r => r.status === 'pending' || r.status === 'processing' || activeJobs?.[r.analysis_id]).length;
    if (pendingAnalysesCount >= 2) {
      toast.error("You cannot run more than 2 analyses at a time. Please wait for the pending ones to complete.");
      return;
    }

    // ===== Validation Helper =====
    const validateInputs = (inputs, files, typeName) => {
      if (!inputs || !Array.isArray(inputs)) return true;

      for (const input of inputs) {
        if (!input.enabled) continue;
        const file = files[input.key];

        // Required check
        if (!input.optional && !file) {
          toast.error(`${input.heading} is required`);
          return false;
        }

        // File checks
        if (file) {
          const ext = getExt(file.name);
          if (!input.supportedFormats.includes(ext)) {
            toast.error(
              `Invalid format for ${input.heading}. Supported: ${input.supportedFormats.join(', ').toUpperCase()}`
            );
            return false;
          }

          const sizeInMB = file.size / (1024 * 1024);
          if (sizeInMB > input.maxSize) {
            toast.error(`${input.heading} file size must be less than ${input.maxSize}MB`);
            return false;
          }
        }
      }
      return true;
    };

    // Run Validations
    if (!validateInputs(config.drawingInput, drawingFiles, "Drawing")) return;
    if (!validateInputs(config.requirementInput, requirementFiles, "Requirement")) return;

    try {
      setLoading(true);
      setIsDummyLoading(true);
      abortRef.current = false;
      setLoaderProgress(0);
      setUploadMessage('Initializing secure connection...');

      // 1. Dummy Wait going to 50%
      let dummyProgress = 0;
      const dummyPromise = new Promise((resolve, reject) => {
        const interval = setInterval(() => {
          if (abortRef.current) {
            clearInterval(interval);
            reject(new Error('ABORTED'));
            return;
          }
          // Slow down dummy to hit 50 in 10s (100 steps of 0.5)
          dummyProgress += 0.5;
          setLoaderProgress(Math.min(dummyProgress, 50));
          if (dummyProgress >= 50) {
            clearInterval(interval);
            resolve();
          }
        }, 100); // 100 steps * 100ms = 10 seconds total
      });

      try {
        await dummyPromise;
      } catch (err) {
        if (err.message === 'ABORTED') {
          setLoading(false);
          setIsDummyLoading(false);
          setLoaderProgress(0);
          toast("Analysis aborted by user", { icon: '🛑' });
          return;
        }
      }

      // If user did not abort, continue to API Request Phase
      setIsDummyLoading(false);
      // DO NOT RESET LOADER PROGRESS TO 0 - maintain continuity
      setUploadMessage('Preparing Queue...');

      const fd = new FormData();
      fd.append("project_id", project_id);
      fd.append("authority", currentAuthority);
      fd.append("title", analysisTitle);
      fd.append("upload_mode", uploadMode);

      // Append Drawing Files
      Object.entries(drawingFiles).forEach(([key, file]) => {
        if (file instanceof File) fd.append(`drawing[${key}]`, file);
      });

      // Append Requirement Files
      Object.entries(requirementFiles).forEach(([key, file]) => {
        if (file instanceof File) fd.append(`requirement[${key}]`, file);
      });

      // Start actual API Request and track its upload progress from 0 to 99
      let uploadInterval;

      const onUploadProgress = (progressEvent) => {
        let percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (percentCompleted >= 100) percentCompleted = 100;

        // Map 0-100% upload to 50-99% loader progress
        let scaledProgress = Math.floor(50 + (percentCompleted * 0.49));
        setLoaderProgress(scaledProgress);
      };

      const res = await CREATE_ANALYSIS_API(fd, onUploadProgress);
      const response = res?.response || res;

      if (response?.data?.success) {
        toast.success("Analysis started successfully! AI is reviewing your files in the background.");
        const newRecord = response.data.payload;

        // Optimistically update history
        setHistoryRecords(prev => [newRecord, ...prev]);

        // Optimistically update counts
        setAuthorityCounts(prev => ({
          ...prev,
          [currentAuthority]: (prev[currentAuthority] || 0) + 1,
          all: (prev.all || 0) + 1
        }));

        setSelectedAnalysis(newRecord);
        setIsAddingNew(false);

        // Reset to page 1 and go to history view instead of edit view
        updateUrlParams({
          authority: currentAuthority,
          analysis_id: newRecord.analysis_id,
          step: 1,
          view: 'history',
          analysis_page: 1
        });
      } else {
        toast.error(response?.data?.payload?.message || "Something went wrong, please try again");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.response?.data?.payload?.message || "Something went wrong");
    } finally {
      setLoading(false);
      setUploadMessage('');
    }
  };

  const scrollToTop = () => {
    if (mainContentRef.current) mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!projectData) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  return (
    <>
      <style>
        {`
          .driver-js--targeted,
          .driver-active-element,
          [data-driver-js-stage] {
            pointer-events: none !important;
          }
          .driver-popover,
          .driver-js--popover {
            pointer-events: auto !important;
          }
          ${isTourActive ? `
            #step-btn-2,
            #step-btn-3,
            #step-btn-4,
            #step-btn-5 {
              pointer-events: none !important;
              opacity: 0.9;
            }
          ` : ''}
        `}
      </style>
      {/* Loader Component - Now handles Real Loading only */}
      <LoaderProgress
        open={loading}
        progress={loaderProgress}
        isDummyLoading={isDummyLoading}
        onClose={() => abortRef.current = true}
      />

      <div ref={mainContentRef} className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">

        {/* Sentinel for Scroll Detection */}
        <div ref={sentinelRef} className="absolute top-24 w-full h-1 pointer-events-none opacity-0" />

        {/* Floating Compact Sticky Header (Portal to Body) */}
        {!isAddingNew && selectedAnalysis && createPortal(
          <div
            className={`fixed z-[40] bg-white/95 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-b border-slate-200 transition-all duration-500 transform ${showStickyHeader ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}
            style={{
              top: window.innerWidth < 1024 ? `${56 + bannerOffset}px` : `${bannerOffset}px`,
              left: window.innerWidth < 1024 ? 0 : headerStyle.left,
              width: window.innerWidth < 1024 ? '100%' : headerStyle.width,
            }}
          >
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-2 md:py-3">
              <div className="flex items-center justify-between gap-2 md:gap-4">
                <div className="flex items-center gap-1.5 md:gap-3 min-w-0">
                  <button
                    onClick={() => {
                      setIsAddingNew(false);
                      setSelectedAnalysis(null);
                      updateUrlParams({ authority: currentAuthority, analysis_id: null, view: "history" });
                    }}
                    className="flex items-center gap-1.5 px-2 py-1.5 md:px-3 md:py-2 bg-white border border-slate-200 rounded-lg md:rounded-xl cursor-pointer text-slate-600 font-bold text-[10px] md:text-xs shadow-sm hover:border-blue-300 hover:text-blue-600 transition-all shrink-0"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline md:hidden">History</span>
                    <span className="hidden md:inline">Back to History</span>
                  </button>

                  <div className="h-5 md:h-6 w-px bg-slate-200 mx-0.5 md:mx-1 shrink-0"></div>

                  <div className="flex items-center gap-1.5 min-w-0 bg-slate-50/80 px-2 py-1 md:py-1.5 rounded-lg border border-slate-100">
                    <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[8px] md:text-[9px] font-black uppercase shrink-0 shadow-sm">
                      {authorities.find(a => a.value === currentAuthority)?.short || currentAuthority}
                    </span>
                    <span
                      className="text-[10px] md:text-xs font-bold text-slate-800 truncate max-w-[100px] xs:max-w-[140px] sm:max-w-[300px]"
                      title={selectedAnalysis?.title}
                    >
                      {selectedAnalysis?.title}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const scrollOpts = { top: 0, behavior: 'smooth' };
                      window.scrollTo(scrollOpts);
                      document.querySelector('main')?.scrollTo(scrollOpts);
                      document.documentElement.scrollTo(scrollOpts);
                      document.body.scrollTo(scrollOpts);
                    }}
                    className="flex items-center gap-1.5 px-2 py-1.5 md:px-3 md:py-2 bg-blue-50/50 border border-blue-100 rounded-lg md:rounded-xl cursor-pointer text-blue-600 font-bold text-[10px] md:text-xs shadow-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all group"
                  >
                    <ChevronUp className="w-3.5 h-3.5 group-hover:animate-bounce" />
                    <span className="hidden sm:inline">Back to Top</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Back to Projects & Project Information Bar */}
        {!isAddingNew && !selectedAnalysis && (
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => {
                const match = window.location.pathname.match(/^\/admin\/([^/]+)\//);
                const prefix = match ? `/admin/${match[1]}` : '';
                navigate(`${prefix}/projects`);
              }}
              className="flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer text-slate-600 font-bold text-xs md:text-sm shadow-sm hover:shadow-md hover:border-blue-300 hover:text-blue-600 transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Projects</span>
            </button>
          </div>
        )}

        {/* Project Information Bar - Enhanced */}
        <div id="project-info-bar" className="relative overflow-hidden bg-white rounded-2xl p-4 md:p-6 shadow-md shadow-slate-200/30 border border-slate-100 mb-6">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50/50 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-indigo-50/30 rounded-full blur-2xl -ml-18 -mb-18 pointer-events-none" />

          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div className="flex items-start md:items-center gap-4 flex-1 min-w-0 w-full">
              {/* Main Icon */}
              <div
                className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10 shrink-0"
              >
                <Layout className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>

              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                {/* Middle Row: Title */}
                <h1
                  className="text-base md:text-lg font-bold text-slate-900 tracking-tight leading-tight flex flex-wrap items-center gap-2"
                  title={projectData.project_name}
                >
                  <span
                    className="shrink-0 text-slate-500 font-semibold"
                  >
                    Project Name:
                  </span>
                  <span className="text-slate-900 break-words">
                    {projectData.project_name}
                  </span>
                </h1>

                {/* Bottom Row: Metadata Sentence */}
                <div className="flex flex-wrap items-center gap-x-4 md:gap-x-6 gap-y-2 text-[11px] md:text-xs font-medium text-slate-500 mt-1">
                  {projectData.project_id && (
                    <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                      <Hash className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-600 font-bold tracking-tight">{projectData.project_id}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (projectData.project_id && navigator.clipboard) {
                            navigator.clipboard.writeText(projectData.project_id).then(() => {
                              setCopiedProjectId(true);
                              setTimeout(() => setCopiedProjectId(false), 2000);
                              toast.success("Copied");
                            });
                          }
                        }}
                        className="ml-0.5 p-0.5 hover:bg-white rounded transition-all outline-none cursor-pointer"
                        title="Copy ID"
                      >
                        {copiedProjectId ? <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5 opacity-40 hover:opacity-100" />}
                      </button>
                    </div>
                  )}

                  {projectData.location && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-600 font-bold">{toTitleCase(projectData.location)}</span>
                    </div>
                  )}

                  {projectData.plot_number && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-600 font-bold">Plot {projectData.plot_number}</span>
                    </div>
                  )}

                  {projectData.client_developer && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-600 font-bold">{toTitleCase(projectData.client_developer)}</span>
                    </div>
                  )}

                  {projectData.building_usage_type && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-600 font-bold">{toTitleCase(projectData.building_usage_type)}</span>
                    </div>
                  )}

                  {projectData.built_up_area && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Layers className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-600 font-bold">{projectData.built_up_area} sqm</span>
                    </div>
                  )}

                  {projectData.number_of_floors !== undefined && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-600 font-bold">
                        {projectData.include_basement && projectData.number_of_basements > 0 ? `${projectData.number_of_basements}B + ` : ''}
                        {projectData.include_ground_floor ? 'G + ' : ''}
                        {projectData.include_mezzanine ? 'M + ' : ''}
                        {projectData.number_of_floors || '0'} Typical
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 shrink-0 w-full md:w-auto mt-2 md:mt-0">
              <Button
                id="project-settings-btn"
                variant="outline"
                disabled={isTourActive}
                onClick={() => openProjectModal(projectData, setProjectData)}
                className={`w-full md:w-auto rounded-xl border-slate-200 bg-white text-slate-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all font-bold px-4 h-10 text-xs md:text-sm shadow-sm ${isTourActive ? 'tour-disabled-btn' : ''}`}
              >
                <Settings2 className="w-4 h-4 mr-2" />
                Project Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Authority Selection Tabs - Enhanced for Mobile */}
        <div id="authority-tabs" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-4">
          <div
            ref={authScrollRef}
            className="flex justify-start md:justify-center border-b border-slate-200 overflow-x-auto scrollbar-none relative"
          >
            {/* Sliding Indicator */}
            <div
              className={`absolute top-0 bottom-0 bg-gradient-to-br from-[#2563eb] to-[#4f46e5] z-0 ${authIndicatorReady ? 'opacity-100' : 'opacity-0'}`}
              style={{
                left: tabIndicatorStyle.left,
                width: tabIndicatorStyle.width,
                visibility: tabIndicatorStyle.width === 0 ? 'hidden' : 'visible',
                transition: authIndicatorReady && !isFirstRender ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
              }}
            />

            {authorities.map((auth, idx) => {
              const isActive = currentAuthority === auth.value;

              return (
                <Tooltip
                  key={auth.value}
                  title={auth.label}
                  TransitionComponent={Zoom}
                  arrow
                  placement="top"
                >
                  <button
                    ref={el => tabsListRef.current[idx] = el}
                    onClick={() => handleAuthorityChange(auth.value)}
                    disabled={isTourActive}
                    className={`
                      relative z-10 flex-1 min-w-[80px] md:min-w-fit px-4 py-3 md:py-4 transition-all duration-200 text-xs md:text-sm whitespace-nowrap text-center font-bold tracking-tight
                      ${isActive ? 'text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
                      ${isTourActive ? 'tour-disabled-btn' : 'cursor-pointer'}
                    `}
                    style={isActive && !authIndicatorReady ? {
                      background: 'linear-gradient(to bottom right, #2563eb, #4f46e5)',
                      color: 'white'
                    } : {}}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>{auth.short}</span>
                      <span className={`text-[10px] opacity-70 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                        ({(authorityCounts[auth.value] || 0) > 999 ? '999+' : (authorityCounts[auth.value] || 0)})
                      </span>
                    </div>
                  </button>
                </Tooltip>
              );
            })}
          </div>
        </div>

        {/* Analysis Body */}
        {!isAddingNew && !selectedAnalysis ? (
          <div id="analysis-history" className="space-y-6 transition-all duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto min-w-0">
                <h2 className="text-base md:text-lg font-black flex items-center gap-2 text-slate-900 shrink-0">
                  <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  Recent Analyses
                </h2>

                {/* Search Input - Desktop/Tablet */}
                <div className="hidden sm:flex items-center w-full sm:w-64 flex-none bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-1.5 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 focus-within:bg-white transition-all duration-300 shadow-sm hover:shadow-md hover:border-blue-200 group">
                  <Search className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors shrink-0" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isTourActive}
                    placeholder="Search analyses..."
                    className={`flex-1 bg-transparent border-none outline-none text-xs md:text-sm text-slate-800 placeholder:text-slate-400 min-w-0 ml-2 ${isTourActive ? 'cursor-not-allowed' : ''}`}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      disabled={isTourActive}
                      className={`shrink-0 p-0.5 rounded-full hover:bg-slate-100 transition-all ${isTourActive ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      <X className="h-3 w-3 text-slate-400 hover:text-red-500" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col xs:flex-row gap-3 w-full md:w-auto">
                {/* Mobile Search - Only visible on very small screens */}
                <div className="sm:hidden flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500 focus-within:bg-white transition-all duration-300 group">
                  <Search className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors shrink-0" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={isTourActive}
                    placeholder="Search analyses..."
                    className={`flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400 min-w-0 ml-2 ${isTourActive ? 'cursor-not-allowed opacity-60' : ''}`}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      disabled={isTourActive}
                      className={`shrink-0 p-1 rounded-full hover:bg-slate-200 transition-all ${isTourActive ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    >
                      <X className="h-4 w-4 text-slate-500 hover:text-red-500" />
                    </button>
                  )}
                </div>

                <button
                  id="start-analysis-btn"
                  onClick={handleAddNew}
                  disabled={isTourActive}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 transition-all duration-200 text-sm font-bold whitespace-nowrap shrink-0 w-full xs:w-auto ${isTourActive ? 'tour-disabled-btn' : 'cursor-pointer'}`}
                >
                  <Plus className="w-4 h-4" />
                  <span>Start New Analysis</span>
                </button>
              </div>
            </div>

            {loadingHistory ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6" style={{ minHeight: '500px' }}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div
                    key={i}
                    className="relative bg-white p-6 rounded-3xl shadow-md border border-slate-200 overflow-hidden flex flex-col"
                  >
                    {/* Header Skeleton */}
                    <div className="mb-4 pb-3 border-b border-gray-100">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-8 h-8 rounded-lg skeleton-shimmer" />
                          <div className="h-5 skeleton-shimmer rounded w-3/4" />
                        </div>
                        <div className="w-8 h-5 rounded-full skeleton-shimmer" />
                      </div>
                      <div className="mt-2 ml-10">
                        <div className="h-3 skeleton-shimmer rounded w-1/3" />
                      </div>
                    </div>

                    {/* Details Grid Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg skeleton-shimmer" />
                        <div className="flex-1 space-y-1">
                          <div className="h-2 w-12 skeleton-shimmer rounded" />
                          <div className="h-3 w-20 skeleton-shimmer rounded" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg skeleton-shimmer" />
                        <div className="flex-1 space-y-1">
                          <div className="h-2 w-12 skeleton-shimmer rounded" />
                          <div className="h-3 w-20 skeleton-shimmer rounded" />
                        </div>
                      </div>
                    </div>

                    {/* Actions Skeleton */}
                    <div className="flex gap-2 justify-end mt-auto pt-4 border-t border-slate-100">
                      <div className="h-9 w-16 skeleton-shimmer rounded-lg" />
                      <div className="h-9 w-24 skeleton-shimmer rounded-lg" />
                      <div className="h-9 w-16 skeleton-shimmer rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : historyRecords.length === 0 ? (
              <div
                style={{
                  paddingTop: '16px',
                  paddingBottom: '16px',
                  minHeight: '500px'
                }}
                className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ScanSearch className="w-8 h-8 text-blue-600" />
                </div>

                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  No Analyses Found
                </h3>

                <p className="text-base text-slate-600 max-w-md mx-auto mb-8">
                  Get started by uploading your DXF drawings and requirements for{' '}
                  <span className="font-semibold text-blue-600">
                    {authorities.find(a => a.value === currentAuthority)?.label || currentAuthority}
                  </span>
                </p>

                <button
                  onClick={handleAddNew}
                  className="inline-flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 text-sm md:text-base whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  Start First Analysis
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-6">
                {historyRecords.map((rec, index) => (
                  <div
                    key={rec.analysis_id}
                    className="group relative bg-white border border-slate-200 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-md hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
                  >
                    {/* Header with Serial Number */}
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
                                      toast.success("Copied");
                                    })
                                    .catch(() => toast.error("Copy failed"));
                                }
                              }}
                              className="p-1 rounded bg-transparent hover:bg-slate-100 transition-all duration-200 cursor-pointer flex items-center justify-center"
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
                      {/* Serial Number Badge */}
                      <div
                        className="text-white text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full shadow-sm flex-shrink-0 flex items-center justify-center mt-1"
                        style={{ backgroundColor: '#3b82f6', minWidth: '32px' }}
                      >
                        #{index + 1 + ((paginationStats?.currentPage || 1) - 1) * (paginationStats?.itemsPerPage || 9)}
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 md:gap-4 mb-5">
                      {/* Created Date */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50/80 border border-blue-50 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Created On</p>
                          <p className="font-medium text-slate-700 text-[11px] md:text-xs truncate">{formatDateWithTime(rec.createdAt)}</p>
                        </div>
                      </div>

                      {/* Upload Mode */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50/80 border border-indigo-50 flex items-center justify-center flex-shrink-0">
                          <Layers className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Upload Mode</p>
                          <p className="font-medium text-slate-700 text-[11px] md:text-xs truncate">
                            {getModeLabelHelper(rec.upload_mode)}
                          </p>
                        </div>
                      </div>

                      {/* Authority */}
                      {currentAuthority === 'all' && (
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50/80 border border-emerald-50 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-4 w-4 text-emerald-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 font-bold leading-none mb-1">Authority</p>
                            <p className="font-medium text-slate-700 text-[11px] md:text-xs truncate">
                              {authorities.find(a => a.value === (rec.authority || rec.authority_type))?.label || rec.authority || 'N/A'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar for Pending/Processing Jobs */}
                    {(rec.status === 'pending' || rec.status === 'processing' || activeJobs?.[rec.analysis_id]) && (
                      <div className="mb-4">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-1">
                          <span className="flex items-center gap-1 text-blue-600 animate-pulse">
                            <Bot className="w-3 h-3" />
                            {activeJobs?.[rec.analysis_id]?.progress ? 'AI Processing...' : 'Pending in Queue...'}
                          </span>
                          <span className="text-blue-600">{activeJobs?.[rec.analysis_id]?.progress || 0}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100/80 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-1"
                            style={{ width: `${Math.max(activeJobs?.[rec.analysis_id]?.progress || 0, 5)}%` }}
                          >
                            <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 md:flex md:gap-2 md:justify-end mt-6 pt-4 border-t border-slate-100">
                      <Button
                        size="sm"
                        disabled={rec.status === 'pending' || rec.status === 'processing' || !!activeJobs?.[rec.analysis_id]}
                        className="rounded-xl h-9 md:h-8 border border-slate-200 bg-white text-slate-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={(e) => handleEditClick(e, rec)}
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        disabled={rec.status === 'pending' || rec.status === 'processing' || !!activeJobs?.[rec.analysis_id]}
                        className="rounded-xl h-9 md:h-8 bg-gradient-to-r from-[#2563eb] to-[#4f46e5] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleSelectAnalysis(rec)}
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                        View Report
                      </Button>

                      <Button
                        size="sm"
                        disabled={rec.status === 'pending' || rec.status === 'processing' || !!activeJobs?.[rec.analysis_id]}
                        className="rounded-xl h-9 md:h-8 col-span-2 md:col-auto bg-[#fff1f2] text-[#e11d48] hover:bg-[#e11d48] hover:text-white border-none shadow-sm transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={(e) => handleDeleteClick(e, rec)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* PAGINATION - Enhanced */}
            {paginationStats && paginationStats.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 mt-8 border-t border-slate-100">
                <p className="text-sm font-medium text-slate-500 order-2 sm:order-1">
                  Showing <span className="text-slate-900 font-bold">{paginationStats.currentPage}</span> of <span className="text-slate-900 font-bold">{paginationStats.totalPages}</span> {paginationStats.totalPages > 1 ? 'pages' : 'page'}
                </p>

                <div className="flex items-center gap-1 order-1 sm:order-2">
                  {/* First Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateUrlParams({ analysis_page: 1 })}
                    disabled={paginationStats.currentPage <= 1}
                    className={`h-9 px-2 rounded-xl border-slate-200 transition-all duration-200 ${paginationStats.currentPage <= 1 ? "opacity-40 bg-slate-50 text-slate-400" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200"
                      }`}
                    style={{ cursor: paginationStats.currentPage <= 1 ? 'not-allowed' : 'pointer', pointerEvents: 'auto' }}
                    title="First Page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateUrlParams({ analysis_page: paginationStats.currentPage - 1 })}
                    disabled={paginationStats.currentPage <= 1}
                    className={`h-9 px-3 rounded-xl border-slate-200 transition-all duration-200 ${paginationStats.currentPage <= 1 ? "opacity-40 bg-slate-50 text-slate-400" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200"
                      }`}
                    style={{ cursor: paginationStats.currentPage <= 1 ? 'not-allowed' : 'pointer', pointerEvents: 'auto' }}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Prev</span>
                  </Button>

                  <div className="flex gap-1 px-1">
                    {(() => {
                      let start = Math.max(1, paginationStats.currentPage - 1);
                      let end = Math.min(paginationStats.totalPages, start + 2);
                      if (end - start < 2) {
                        start = Math.max(1, end - 2);
                      }

                      const pages = [];
                      for (let p = start; p <= end; p++) {
                        pages.push(
                          <button
                            key={p}
                            onClick={() => updateUrlParams({ analysis_page: p })}
                            className={`w-9 h-9 rounded-xl text-xs font-bold transition-all duration-200 border cursor-pointer ${paginationStats.currentPage === p
                              ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200"
                              : "text-slate-500 bg-white border-transparent hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100"
                              }`}
                            style={paginationStats.currentPage === p ? { backgroundColor: '#2563eb', color: 'white', cursor: 'pointer' } : { cursor: 'pointer' }}
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
                    onClick={() => updateUrlParams({ analysis_page: paginationStats.currentPage + 1 })}
                    disabled={paginationStats.currentPage >= paginationStats.totalPages}
                    className={`h-9 px-3 rounded-xl border-slate-200 transition-all duration-200 ${paginationStats.currentPage >= paginationStats.totalPages ? "opacity-40 bg-slate-50 text-slate-400" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200"
                      }`}
                    style={{ cursor: paginationStats.currentPage >= paginationStats.totalPages ? 'not-allowed' : 'pointer', pointerEvents: 'auto' }}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>

                  {/* Last Page */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateUrlParams({ analysis_page: paginationStats.totalPages })}
                    disabled={paginationStats.currentPage >= paginationStats.totalPages}
                    className={`h-9 px-2 rounded-xl border-slate-200 transition-all duration-200 ${paginationStats.currentPage >= paginationStats.totalPages ? "opacity-40 bg-slate-50 text-slate-400" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200"
                      }`}
                    style={{ cursor: paginationStats.currentPage >= paginationStats.totalPages ? 'not-allowed' : 'pointer', pointerEvents: 'auto' }}
                    title="Last Page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col lg:flex-row items-center justify-start gap-3 sm:gap-4 min-w-0">
              <button
                id="back-to-history-btn"
                disabled={isTourActive}
                onClick={() => {
                  setIsAddingNew(false);
                  setSelectedAnalysis(null);
                  updateUrlParams({ view: "history", is_adding_new: null, analysis_id: null, step: 1 });
                }}
                className={`w-full lg:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-extrabold text-sm shadow-sm hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95 shrink-0 ${isTourActive ? 'tour-disabled-btn' : 'cursor-pointer'}`}
              >
                <ChevronLeft className="w-4 h-4" /> Back to History
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto justify-start min-w-0 flex-1">
                <div id="current-authority-badge" className="flex items-center justify-start gap-2.5 p-2.5 sm:p-3 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm w-full lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl min-w-0">
                  <span style={{
                    padding: '6px 12px',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    borderRadius: '10px',
                    fontSize: '10px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    border: '1.5px solid #dbeafe',
                    flexShrink: 0,
                    boxShadow: '0 2px 4px -1px rgba(37, 99, 235, 0.1)'
                  }}>
                    {authorities.find(a => a.value === currentAuthority)?.label || currentAuthority}
                  </span>

                  <div className="h-4 w-px bg-slate-300 hidden sm:block mx-1 shrink-0"></div>

                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span style={{ width: '10px', height: '10px', backgroundColor: '#3b82f6', borderRadius: '50%', flexShrink: 0, boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.1)' }}></span>
                    <span title={isAddingNew ? "New Analysis" : selectedAnalysis?.title} className="truncate text-[15px] font-[800] text-slate-900 leading-tight p-1">
                      {isAddingNew ? "New Analysis" : selectedAnalysis?.title}
                    </span>
                  </div>
                </div>

                {!isAddingNew && selectedAnalysis && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedAnalysis?.analysis_id && navigator.clipboard) {
                        navigator.clipboard.writeText(selectedAnalysis.analysis_id)
                          .then(() => {
                            setCopiedAnalysisId(true);
                            setTimeout(() => setCopiedAnalysisId(false), 2000);
                            toast.success("Analysis ID copied");
                          })
                          .catch(() => toast.error("Copy failed"));
                      }
                    }}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg border border-dashed border-slate-300 bg-white text-[11px] font-mono font-semibold text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    <span>#{selectedAnalysis.analysis_id}</span>
                    {copiedAnalysisId ? (
                      <CheckCircle2 className="w-3 h-3 text-green-600 animate-in fade-in duration-200" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Stepper logic */}
            {/* Stepper logic */}
            <div id="analysis-stepper" className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 p-3 md:p-6">
              <div className="flex items-start justify-between max-w-3xl mx-auto overflow-x-auto scrollbar-hide relative pb-2 pt-1">
                {steps.map((step, index) => {
                  const isActive = step.id === activeStep;
                  const isCompleted = step.id < activeStep;
                  const isDisabled = isAddingNew && step.id !== 1;

                  return (
                    <div key={step.id} className="relative flex-1 flex flex-col items-center min-w-[70px]">
                      {/* Absolute Line connecting steps */}
                      {index < steps.length - 1 && (
                        <div
                          className={`absolute top-[13px] md:top-[19px] left-[50%] w-full h-[2px] ${activeStep > step.id
                            ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                            : "bg-slate-100"
                            }`}
                          style={{ zIndex: 0 }}
                        />
                      )}

                      {/* Step Button */}
                      <button
                        type="button"
                        id={`step-btn-${step.id}`}
                        onClick={() => (!isDisabled && !isTourActive) && updateUrlParams({ step: step.id })}
                        disabled={isDisabled || isTourActive}
                        className={`relative z-10 flex flex-col items-center w-full group focus:outline-none ${isDisabled || isTourActive ? 'tour-disabled-btn' : 'cursor-pointer'}`}
                      >
                        {/* Icon Wrapper with BG hiding the line */}
                        <div className="bg-white px-2">
                          <div
                            className={`w-7 h-7 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all duration-200
                          ${isActive || isCompleted
                                ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                                : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                              }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-3.5 h-3.5 md:w-5 md:h-5" />
                            ) : (
                              <span className="text-[10px] md:text-sm font-bold">{step.id}</span>
                            )}
                          </div>
                        </div>

                        {/* Label */}
                        <span
                          className={`mt-2 text-[9px] md:text-[10px] md:text-xs text-center font-bold uppercase leading-tight
                          ${isActive ? "text-slate-900" : isCompleted ? "text-slate-600" : "text-slate-400"}`}
                        >
                          {step.label.split(' ')[0]}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Content */}
            {activeStep === 1 && (
              <div className="step-transition space-y-4 bg-white p-3 sm:p-4 md:p-6 rounded-xl md:rounded-2xl">

                {/* 1. Title Field */}
                {isAddingNew ? (
                  <div id="analysis-title-field" className="space-y-1">
                    <Label htmlFor="analysis-title" className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                      Analysis Title
                    </Label>
                    <Input
                      id="analysis-title"
                      value={analysisTitle}
                      onChange={e => setAnalysisTitle(e.target.value)}
                      onFocus={() => setIsTitleFocused(true)}
                      onBlur={() => setIsTitleFocused(false)}
                      placeholder="e.g. Villa 101 Initial Review"
                      maxLength={100}
                      className="rounded-lg h-9 px-3 shadow-sm w-full font-medium transition-all outline-none border text-sm"
                      style={{
                        backgroundColor: isTitleFocused ? '#ffffff' : '#f8fafc',
                        color: '#000000',
                        borderColor: isTitleFocused ? '#3b82f6' : '#e2e8f0',
                        boxShadow: isTitleFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
                      }}
                    />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="edit-analysis-title" className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                        Analysis Title
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="edit-analysis-title"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          disabled={!isEditingTitle}
                          onFocus={() => setIsTitleFocused(true)}
                          onBlur={() => setIsTitleFocused(false)}
                          autoComplete="off"
                          maxLength={100}
                          className="rounded-lg h-10 px-3 shadow-sm w-full font-medium transition-all outline-none border text-sm"
                          style={{
                            backgroundColor: isEditingTitle && isTitleFocused ? '#ffffff' : isEditingTitle ? '#ffffff' : '#f8fafc',
                            color: '#000000',
                            borderColor: isEditingTitle && isTitleFocused ? '#3b82f6' : isEditingTitle ? '#3b82f6' : '#e2e8f0',
                            boxShadow: isEditingTitle && isTitleFocused ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
                          }}
                        />
                        {!isEditingTitle ? (
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingTitle(true);
                              setEditTitle(selectedAnalysis?.title || '');
                            }}
                            className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-400 bg-white shadow-sm cursor-pointer transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingTitle(false);
                                setEditTitle(selectedAnalysis?.title || '');
                                setIsTitleFocused(false);
                              }}
                              className="w-10 h-10 rounded-lg border border-red-200 flex items-center justify-center text-red-600 hover:bg-red-50 hover:border-red-400 bg-white shadow-sm cursor-pointer transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={handleInlineTitleUpdate}
                              className="w-10 h-10 rounded-lg border border-green-200 flex items-center justify-center text-green-600 hover:bg-green-50 hover:border-green-400 bg-white shadow-sm cursor-pointer transition-all"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedAnalysis && (
                      <div className="space-y-4">
                        {/* Mode Display - elevated to a subtle header card */}
                        {selectedAnalysis.upload_mode && (
                          <div className="w-full bg-gradient-to-r from-purple-50 via-slate-50 to-blue-50 border border-purple-100/60 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-white shadow-sm border border-purple-100 flex items-center justify-center shrink-0">
                                <Sparkles className="w-5 h-5 text-purple-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-purple-600">
                                  Mode
                                </p>
                                <p className="text-sm font-semibold text-slate-900 truncate">
                                  {getModeLabelHelper(selectedAnalysis.upload_mode)}
                                </p>
                                <p className="text-xs text-slate-500 hidden sm:block">
                                  Review the approved drawing and requirement files for this analysis.
                                </p>
                              </div>
                            </div>
                            <div className="hidden sm:flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/70 border border-purple-100 px-2.5 py-1 text-[11px] font-medium text-purple-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Active configuration
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 items-stretch">
                          {(() => {
                            const drawingFiles = Array.isArray(selectedAnalysis.drawing_file)
                              ? selectedAnalysis.drawing_file
                              : selectedAnalysis.drawing_file
                                ? [{
                                  name: selectedAnalysis.drawing_file,
                                  size: selectedAnalysis.drawing_file_size || null,
                                  heading: 'Upload Approved'
                                }]
                                : [];

                            const requirementFiles = Array.isArray(selectedAnalysis.requirement_file)
                              ? selectedAnalysis.requirement_file
                              : selectedAnalysis.requirement_file
                                ? [{
                                  name: selectedAnalysis.requirement_file,
                                  size: selectedAnalysis.requirement_file_size || null,
                                  heading: 'Requirement Document'
                                }]
                                : [];

                            if (drawingFiles.length === 0 && requirementFiles.length === 0) return null;

                            return (
                              <>
                                {drawingFiles.length > 0 && (
                                  <div className="bg-slate-50/50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full">
                                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                      <h3 className="text-sm font-bold text-slate-800">
                                        Approved Drawing ({drawingFiles.length})
                                      </h3>
                                    </div>
                                    <div className="p-3 space-y-2 flex-1 overflow-y-auto">
                                      {drawingFiles.map((file, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 mb-2 last:mb-0"
                                        >
                                          <div className="flex items-center gap-3 min-w-0 flex-1">
                                            {(() => {
                                              const fileInfo = getFileIcon(file.name);
                                              const FileIcon = fileInfo.icon;
                                              return (
                                                <div
                                                  className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0 cursor-pointer transition-colors duration-200"
                                                  style={{ backgroundColor: fileInfo.bgColor }}
                                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = fileInfo.hoverBgColor}
                                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = fileInfo.bgColor}
                                                >
                                                  <FileIcon className="w-4 h-4 md:w-5 md:h-5" style={{ color: fileInfo.textColor }} />
                                                </div>
                                              );
                                            })()}
                                            <div className="flex flex-col items-start px-1 min-w-0 flex-1">
                                              <span className="text-sm text-slate-700 truncate w-full font-medium" title={file.name}>
                                                {file.name}
                                              </span>
                                              <span className="text-xs text-slate-400">
                                                {file.size ? formatFileSize(file.size) : 'Size not available'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {requirementFiles.length > 0 && (
                                  <div className="bg-slate-50/50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-full">
                                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                      <h3 className="text-sm font-bold text-slate-800">
                                        Proposed Drawing ({requirementFiles.length})
                                      </h3>
                                    </div>
                                    <div className="p-3 space-y-2 flex-1 overflow-y-auto">
                                      {requirementFiles.map((file, idx) => (
                                        <div
                                          key={idx}
                                          className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 mb-2 last:mb-0"
                                        >
                                          <div className="flex items-center gap-3 min-w-0 flex-1">
                                            {(() => {
                                              const fileInfo = getFileIcon(file.name);
                                              const FileIcon = fileInfo.icon;
                                              return (
                                                <div
                                                  className="w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center shrink-0 cursor-pointer transition-colors duration-200"
                                                  style={{ backgroundColor: fileInfo.bgColor }}
                                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = fileInfo.hoverBgColor}
                                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = fileInfo.bgColor}
                                                >
                                                  <FileIcon className="w-4 h-4 md:w-5 md:h-5" style={{ color: fileInfo.textColor }} />
                                                </div>
                                              );
                                            })()}
                                            <div className="flex flex-col items-start px-1 min-w-0 flex-1">
                                              <span className="text-sm text-slate-700 truncate w-full font-medium" title={file.name}>
                                                {file.name}
                                              </span>
                                              <span className="text-xs text-slate-400">
                                                {file.size ? formatFileSize(file.size) : 'Size not available'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <Button
                        onClick={() => {
                          updateUrlParams({ step: 2 });
                        }}
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl px-8 h-12 text-base font-bold shadow-xl shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                      >
                        Open Results Console
                      </Button>
                    </div>
                  </div>
                )}



                {isAddingNew && (
                  <>
                    {/* Mode Selection Tabs - Sliding Indicator */}
                    {/* Mode Selection Tabs - Sliding Indicator */}
                    <div id="upload-modes-container" className="relative mb-5">
                      {/* Left Scroll Indicator */}
                      {canScrollLeft && (
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 z-50">
                          <button
                            type="button"
                            disabled={isTourActive}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); !isTourActive && scrollContainer('left'); }}
                            className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border border-slate-200 flex items-center justify-center text-slate-900 transition-all ${isTourActive ? 'tour-disabled-btn' : 'hover:text-blue-600 hover:scale-110 active:scale-95 cursor-pointer'}`}
                            aria-label="Scroll Left"
                          >
                            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                          </button>
                        </div>
                      )}

                      {/* Right Scroll Indicator */}
                      {canScrollRight && (
                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-50">
                          <button
                            type="button"
                            disabled={isTourActive}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); !isTourActive && scrollContainer('right'); }}
                            className={`w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-lg border border-slate-200 flex items-center justify-center text-slate-900 transition-all ${isTourActive ? 'tour-disabled-btn' : 'hover:text-blue-600 hover:scale-110 active:scale-95 cursor-pointer'}`}
                            aria-label="Scroll Right"
                          >
                            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                          </button>
                        </div>
                      )}

                      <div
                        ref={modeScrollRef}
                        onScroll={checkForScrollVisibility}
                        className={`flex items-stretch gap-3 md:gap-5 p-2 md:p-4 bg-transparent relative z-0 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-4 md:px-0 ${UPLOAD_MODES.length === 1 ? 'w-fit mx-0' : 'w-full mx-auto'}`}
                      >
                        {/* Sliding Indicator */}
                        <div
                          className={`absolute rounded-lg md:rounded-xl shadow-md z-0 ${modeIndicatorReady ? 'opacity-100' : 'opacity-0'}`}
                          style={{
                            left: modeIndicatorStyle.left,
                            top: modeIndicatorStyle.top,
                            width: modeIndicatorStyle.width,
                            height: modeIndicatorStyle.height,
                            visibility: modeIndicatorStyle.width === 0 ? 'hidden' : 'visible',
                            transition: modeIndicatorReady && !isFirstRender ? 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
                          }}
                        >
                          <div className="w-full h-full rounded-lg md:rounded-xl bg-gradient-to-br from-[#2563eb] to-[#4f46e5] shadow-sm shadow-blue-500/10" />
                        </div>

                        {UPLOAD_MODES.map((mode, index) => {
                          const isSelected = uploadMode === mode.id;
                          const Icon = mode.icon;

                          return (
                            <button
                              key={mode.id}
                              ref={el => modeTabsRef.current[index] = el}
                              disabled={isTourActive}
                              onClick={() => !isTourActive && handleModeChangeRequest(mode.id)}
                              className={`
                                relative z-10 flex items-center gap-2 md:gap-3 px-2 py-1 md:px-3 md:py-1.5 rounded-md md:rounded-lg transition-all duration-300 text-left group snap-center border
                                ${UPLOAD_MODES.length === 1 ? 'w-full' : 'min-w-[calc(100vw-100px)] xs:min-w-[260px] md:min-w-[180px] lg:flex-1'}
                                ${isSelected ? 'text-white border-transparent' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-slate-200'}
                                ${isTourActive ? 'tour-disabled-btn' : 'cursor-pointer'}
                              `}
                              style={isSelected && !modeIndicatorReady ? {
                                background: 'linear-gradient(to bottom right, #2563eb, #4f46e5)',
                                color: 'white'
                              } : {}}
                            >
                              <div className={`
                                p-1 md:p-1.5 rounded-md md:rounded-lg transition-all duration-300 shrink-0 border
                                ${isSelected
                                  ? 'bg-white/20 border-white/20 text-white backdrop-blur-md shadow-inner'
                                  : 'bg-slate-50 border-slate-100 shadow-sm text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 group-hover:border-blue-100'
                                }
                              `}>
                                <Icon className="w-3.5 h-3.5 md:w-5 md:h-5" />
                              </div>

                              <div className={`text-left min-w-0 flex-1 py-0`}>
                                <div className={`leading-tight text-[9px] md:text-[13px] font-bold transition-colors duration-200 mb-0 ${isSelected ? 'text-white' : 'text-slate-800 group-hover:text-blue-600'}`}>
                                  {mode.title}
                                </div>
                                <div className={`text-[7px] md:text-[10px] font-medium transition-colors duration-200 leading-tight ${isSelected ? 'text-blue-50/80' : 'text-slate-400 group-hover:text-slate-500'}`}>
                                  {mode.subtitle}
                                </div>
                              </div>

                              {isSelected && (
                                <div className="shrink-0 bg-white/20 rounded-full p-1.5 backdrop-blur-md animate-in fade-in zoom-in duration-300 shadow-inner ml-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Upload sections with Animation */}
                    <div id="file-upload-sections" key={uploadMode} className={`grid grid-cols-1 ${(authorityRules[uploadMode]?.drawingInput?.length && authorityRules[uploadMode]?.requirementInput?.length) ? 'lg:grid-cols-2' : 'max-w-3xl mx-auto'} gap-4 md:gap-6 ${slideDirection === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'}`}>

                      {(() => {
                        const config = authorityRules[uploadMode];
                        if (!config) return <p className="text-red-500">Invalid configuration</p>;

                        return (
                          <>
                            {/* -------------------- DRAWING UPLOAD -------------------- */}
                            {config.drawingInput && config.drawingInput.length > 0 && (
                              <>
                                {config.drawingInput.length === 1 ? (
                                  // --- SINGLE BOX LAYOUT ---
                                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-6">
                                    {config.drawingInput.map((inputConfig) => {
                                      const file = drawingFiles[inputConfig.key];
                                      const isActiveDrag = activeDragKey === inputConfig.key;

                                      return (
                                        <div key={inputConfig.key} className="space-y-3">
                                          <div>
                                            <h2 className="text-slate-900 mb-0.5 text-sm font-bold">
                                              {inputConfig.heading}
                                              {inputConfig.optional && (
                                                <span className="text-xs font-normal text-slate-400 ml-1.5" style={{ marginLeft: "4px" }}>(optional)</span>
                                              )}
                                            </h2>
                                            <p className="text-xs text-slate-500">
                                              Supported formats: {inputConfig.supportedFormats.join(', ').toUpperCase()}
                                            </p>
                                          </div>

                                          {/* Dropzone */}
                                          <div
                                            onDragEnter={(e) => handleDragEvent(e, inputConfig.key)}
                                            onDragLeave={(e) => handleDragEvent(e, inputConfig.key)}
                                            onDragOver={(e) => handleDragEvent(e, inputConfig.key)}
                                            onDrop={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              if (isTourActive) return;
                                              setActiveDragKey(null);
                                              const droppedFile = e.dataTransfer.files?.[0];
                                              if (!droppedFile) return;

                                              if (!isAllowed(droppedFile, inputConfig.supportedFormats)) {
                                                toast.error(`Only ${inputConfig.supportedFormats.join(', ').toUpperCase()} files are allowed`);
                                                return;
                                              }
                                              if (droppedFile.size > inputConfig.maxSize * 1024 * 1024) {
                                                toast.error(`File size cannot exceed ${inputConfig.maxSize}MB`);
                                                return;
                                              }
                                              handleFileDrop('drawing', inputConfig.key, droppedFile);
                                            }}
                                            className={`
                                              border-2 border-dashed rounded-xl p-4 text-center transition-all duration-200 ${isTourActive ? "tour-disabled-btn" : ""}
                                              ${isActiveDrag ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}
                                            `}
                                          >
                                            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                              <Upload className="w-5 h-5 text-white" />
                                            </div>

                                            <h3 className="text-slate-900 mb-1 text-sm font-medium">Drop file here or click to browse</h3>
                                            <p className="text-xs text-slate-500 mb-3">Maximum file size: {inputConfig.maxSize}MB</p>

                                            <input
                                              type="file"
                                              disabled={isTourActive}
                                              accept={inputConfig.supportedFormats.map(f => `.${f}`).join(',')}
                                              onChange={(e) => {
                                                const selectedFile = e.target.files?.[0];
                                                if (!selectedFile) return;
                                                if (!isAllowed(selectedFile, inputConfig.supportedFormats)) {
                                                  toast.error(`Only ${inputConfig.supportedFormats.join(', ').toUpperCase()} files are allowed`);
                                                  e.target.value = '';
                                                  return;
                                                }
                                                if (selectedFile.size > inputConfig.maxSize * 1024 * 1024) {
                                                  toast.error(`File size cannot exceed ${inputConfig.maxSize}MB`);
                                                  e.target.value = '';
                                                  return;
                                                }
                                                handleFileDrop('drawing', inputConfig.key, selectedFile);
                                              }}
                                              className="hidden"
                                              id={`drawing-upload-${inputConfig.key}`}
                                            />

                                            <label
                                              htmlFor={isTourActive ? "" : `drawing-upload-${inputConfig.key}`}
                                              className={isTourActive ? "tour-disabled-label" : ""}
                                            >
                                              <Button
                                                asChild
                                                size="sm"
                                                className={`h-8 text-xs ${isTourActive ? "tour-disabled-btn" : ""}`}
                                                disabled={isTourActive}
                                              >
                                                <span className={isTourActive ? "cursor-not-allowed" : "cursor-pointer"}>Select File</span>
                                              </Button>
                                            </label>
                                          </div>

                                          {/* Selected File Display */}
                                          {file && (
                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                                {(() => {
                                                  const fileInfo = getFileIcon(file.name);
                                                  const FileIcon = fileInfo.icon;
                                                  return (
                                                    <div
                                                      className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-200"
                                                      style={{ backgroundColor: fileInfo.bgColor }}
                                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = fileInfo.hoverBgColor}
                                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = fileInfo.bgColor}
                                                    >
                                                      <FileIcon className="w-5 h-5" style={{ color: fileInfo.textColor }} />
                                                    </div>
                                                  );
                                                })()}
                                                <div className="min-w-0 flex-1">
                                                  <span className="text-sm font-medium text-slate-700 block truncate" title={file.name}>
                                                    {file.name}
                                                  </span>
                                                  <p className="text-xs text-slate-500">
                                                    {formatFileSize(file.size)}
                                                  </p>
                                                </div>
                                              </div>

                                              <button
                                                onClick={() => !isTourActive && removeFile('drawing', inputConfig.key)}
                                                disabled={isTourActive}
                                                style={{
                                                  backgroundColor: '#fee2e2',
                                                  color: '#ef4444',
                                                  borderRadius: '50%',
                                                  width: '32px',
                                                  height: '32px',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  border: 'none',
                                                  cursor: isTourActive ? 'not-allowed' : 'pointer'
                                                }}
                                                className={`hover:bg-red-200 transition-colors ml-2 shrink-0 ${isTourActive ? 'opacity-60' : ''}`}
                                                title="Remove file"
                                              >
                                                <X className="w-4 h-4" />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  // --- MULTI-LIST INLINE LAYOUT ---
                                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                      <h3 className="text-sm font-bold text-slate-800">Upload Approved Drawings</h3>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                      {config.drawingInput.map((inputConfig) => {
                                        const file = drawingFiles[inputConfig.key];
                                        const isActiveDrag = activeDragKey === inputConfig.key;

                                        return (
                                          <div
                                            key={inputConfig.key}
                                            onDragEnter={(e) => handleDragEvent(e, inputConfig.key)}
                                            onDragLeave={(e) => handleDragEvent(e, inputConfig.key)}
                                            onDragOver={(e) => handleDragEvent(e, inputConfig.key)}
                                            onDrop={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              if (isTourActive) return;
                                              setActiveDragKey(null);
                                              const droppedFile = e.dataTransfer.files?.[0];
                                              if (!droppedFile) return;

                                              if (!isAllowed(droppedFile, inputConfig.supportedFormats)) {
                                                toast.error(`Only ${inputConfig.supportedFormats.join(', ').toUpperCase()} files are allowed`);
                                                return;
                                              }
                                              if (droppedFile.size > inputConfig.maxSize * 1024 * 1024) {
                                                toast.error(`File size cannot exceed ${inputConfig.maxSize}MB`);
                                                return;
                                              }
                                              handleFileDrop('drawing', inputConfig.key, droppedFile);
                                            }}
                                            className={`
                                              p-4 transition-colors flex flex-col gap-3
                                              ${isActiveDrag ? 'bg-blue-50' : 'bg-white'}
                                            `}
                                          >
                                            {/* Header Row - Hidden if file selected */}
                                            {!file && (
                                              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 sm:gap-4">
                                                {/* Left: Info */}
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-start sm:items-center gap-3">
                                                    <div className="shrink-0 mt-0.5 sm:mt-0">
                                                      <RotatingFormatIcons formats={inputConfig.supportedFormats} />
                                                    </div>
                                                    <div className="min-w-0">
                                                      <h3 className="text-[13px] sm:text-sm font-bold text-slate-800 leading-tight">
                                                        {inputConfig.heading}
                                                        {inputConfig.optional && (
                                                          <span className="text-[10px] font-normal text-slate-400 ml-1.5 block sm:inline">(Optional)</span>
                                                        )}
                                                      </h3>
                                                      <p className="text-[10px] md:text-xs text-slate-400 mt-1">
                                                        {inputConfig.supportedFormats.join(', ').toUpperCase()} • Max {inputConfig.maxSize}MB
                                                      </p>
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Right: Upload Button */}
                                                <div className="shrink-0">
                                                  <input
                                                    type="file"
                                                    id={`drawing-list-upload-${inputConfig.key}`}
                                                    className="hidden"
                                                    disabled={isTourActive}
                                                    accept={inputConfig.supportedFormats.map(f => `.${f}`).join(',')}
                                                    onChange={(e) => {
                                                      const selectedFile = e.target.files?.[0];
                                                      if (!selectedFile) return;
                                                      if (!isAllowed(selectedFile, inputConfig.supportedFormats)) {
                                                        toast.error(`Only ${inputConfig.supportedFormats.join(', ').toUpperCase()} files are allowed`);
                                                        e.target.value = '';
                                                        return;
                                                      }
                                                      if (selectedFile.size > inputConfig.maxSize * 1024 * 1024) {
                                                        toast.error(`File size cannot exceed ${inputConfig.maxSize}MB`);
                                                        e.target.value = '';
                                                        return;
                                                      }
                                                      handleFileDrop('drawing', inputConfig.key, selectedFile);
                                                    }}
                                                  />
                                                  <label
                                                    htmlFor={isTourActive ? "" : `drawing-list-upload-${inputConfig.key}`}
                                                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-xs sm:text-sm font-extrabold transition-all bg-white w-full sm:w-auto ${isTourActive ? 'tour-disabled-label' : 'hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer'}`}
                                                  >
                                                    <Upload className="w-3.5 h-3.5" />
                                                    Upload
                                                  </label>
                                                </div>
                                              </div>
                                            )}

                                            {/* File Info - Shown if file selected */}
                                            {file && (
                                              <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                  {(() => {
                                                    const fileInfo = getFileIcon(file.name);
                                                    const FileIcon = fileInfo.icon;
                                                    return (
                                                      <div
                                                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 cursor-pointer transition-colors duration-200"
                                                        style={{ backgroundColor: fileInfo.bgColor }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = fileInfo.hoverBgColor}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = fileInfo.bgColor}
                                                      >
                                                        <FileIcon className="w-5 h-5" style={{ color: fileInfo.textColor }} />
                                                      </div>
                                                    );
                                                  })()}
                                                  <div className="flex flex-col items-start px-1 min-w-0 flex-1">
                                                    <span className="text-sm text-slate-700 truncate w-full" title={file.name}>
                                                      <span className="font-semibold">{inputConfig.heading}</span>
                                                      <span className="mx-2">-</span>
                                                      {file.name}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                      {formatFileSize(file.size)}
                                                    </span>
                                                  </div>
                                                </div>
                                                <button
                                                  onClick={() => !isTourActive && removeFile('drawing', inputConfig.key)}
                                                  disabled={isTourActive}
                                                  style={{
                                                    backgroundColor: '#fee2e2',
                                                    color: '#ef4444',
                                                    borderRadius: '50%',
                                                    width: '28px',
                                                    height: '28px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: 'none',
                                                    cursor: isTourActive ? 'not-allowed' : 'pointer'
                                                  }}
                                                  className={`hover:bg-red-200 transition-colors ml-3 shrink-0 ${isTourActive ? 'opacity-60' : ''}`}
                                                  title="Remove file"
                                                >
                                                  <X className="w-4 h-4" />
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}

                            {/* -------------------- REQUIREMENT UPLOAD -------------------- */}
                            {/* -------------------- REQUIREMENT UPLOAD -------------------- */}
                            {/* -------------------- REQUIREMENT UPLOAD -------------------- */}
                            {config.requirementInput && config.requirementInput.length > 0 && (
                              <>
                                {config.requirementInput.length === 1 ? (
                                  // --- SINGLE BOX LAYOUT ---
                                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-6">
                                    {config.requirementInput.map((inputConfig) => {
                                      const file = requirementFiles[inputConfig.key];
                                      const isActiveDrag = activeDragKey === inputConfig.key;

                                      return (
                                        <div key={inputConfig.key} className="space-y-3">
                                          <div>
                                            <h2 className="text-slate-900 mb-0.5 text-sm font-bold">
                                              {inputConfig.heading}
                                              {inputConfig.optional && (
                                                <span className="text-xs font-normal text-slate-400 ml-1.5" style={{ marginLeft: "4px" }}>(optional)</span>
                                              )}
                                            </h2>
                                            <p className="text-xs text-slate-500">
                                              Supported formats: {inputConfig.supportedFormats.join(', ').toUpperCase()}
                                            </p>
                                          </div>

                                          {/* Dropzone */}
                                          <div
                                            onDragEnter={(e) => handleDragEvent(e, inputConfig.key)}
                                            onDragLeave={(e) => handleDragEvent(e, inputConfig.key)}
                                            onDragOver={(e) => handleDragEvent(e, inputConfig.key)}
                                            onDrop={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              if (isTourActive) return;
                                              setActiveDragKey(null);
                                              const droppedFile = e.dataTransfer.files?.[0];
                                              if (!droppedFile) return;

                                              if (!isAllowed(droppedFile, inputConfig.supportedFormats)) {
                                                toast.error(`Only ${inputConfig.supportedFormats.join(', ').toUpperCase()} files are allowed`);
                                                return;
                                              }
                                              if (droppedFile.size > inputConfig.maxSize * 1024 * 1024) {
                                                toast.error(`File size cannot exceed ${inputConfig.maxSize}MB`);
                                                return;
                                              }
                                              handleFileDrop('requirement', inputConfig.key, droppedFile);
                                            }}
                                            className={`
                                              border-2 border-dashed rounded-xl p-4 text-center transition-all duration-200
                                              ${isActiveDrag ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}
                                            `}
                                          >
                                            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                              <Upload className="w-5 h-5 text-white" />
                                            </div>

                                            <h3 className="text-slate-900 mb-1 text-sm font-medium">Drop file here or click to browse</h3>
                                            <p className="text-xs text-slate-500 mb-3">Maximum file size: {inputConfig.maxSize}MB</p>

                                            <input
                                              type="file"
                                              disabled={isTourActive}
                                              accept={inputConfig.supportedFormats.map(f => `.${f}`).join(',')}
                                              onChange={(e) => {
                                                const selectedFile = e.target.files?.[0];
                                                if (!selectedFile) return;
                                                if (!isAllowed(selectedFile, inputConfig.supportedFormats)) {
                                                  toast.error(`Only ${inputConfig.supportedFormats.join(', ').toUpperCase()} files are allowed`);
                                                  e.target.value = '';
                                                  return;
                                                }
                                                if (selectedFile.size > inputConfig.maxSize * 1024 * 1024) {
                                                  toast.error(`File size cannot exceed ${inputConfig.maxSize}MB`);
                                                  e.target.value = '';
                                                  return;
                                                }
                                                handleFileDrop('requirement', inputConfig.key, selectedFile);
                                              }}
                                              className="hidden"
                                              id={`req-upload-${inputConfig.key}`}
                                            />

                                            <label
                                              htmlFor={isTourActive ? "" : `req-upload-${inputConfig.key}`}
                                              className={isTourActive ? "tour-disabled-label" : ""}
                                            >
                                              <Button
                                                asChild
                                                size="sm"
                                                className={`h-8 text-xs ${isTourActive ? "tour-disabled-btn" : ""}`}
                                                disabled={isTourActive}
                                              >
                                                <span className={isTourActive ? "cursor-not-allowed" : "cursor-pointer"}>Select File</span>
                                              </Button>
                                            </label>
                                          </div>

                                          {/* Selected File Display */}
                                          {file && (
                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                                {(() => {
                                                  const fileInfo = getFileIcon(file.name);
                                                  const FileIcon = fileInfo.icon;
                                                  return (
                                                    <div
                                                      className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-colors duration-200"
                                                      style={{ backgroundColor: fileInfo.bgColor }}
                                                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = fileInfo.hoverBgColor}
                                                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = fileInfo.bgColor}
                                                    >
                                                      <FileIcon className="w-5 h-5" style={{ color: fileInfo.textColor }} />
                                                    </div>
                                                  );
                                                })()}
                                                <div className="min-w-0 flex-1">
                                                  <span className="text-sm font-medium text-slate-700 block truncate" title={file.name}>
                                                    {file.name}
                                                  </span>
                                                  <p className="text-xs text-slate-500">
                                                    {formatFileSize(file.size)}
                                                  </p>
                                                </div>
                                              </div>

                                              <button
                                                onClick={() => !isTourActive && removeFile('requirement', inputConfig.key)}
                                                disabled={isTourActive}
                                                style={{
                                                  backgroundColor: '#fee2e2',
                                                  color: '#ef4444',
                                                  borderRadius: '50%',
                                                  width: '32px',
                                                  height: '32px',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  border: 'none',
                                                  cursor: isTourActive ? 'not-allowed' : 'pointer'
                                                }}
                                                className={`hover:bg-red-200 transition-colors ml-2 shrink-0 ${isTourActive ? 'opacity-60' : ''}`}
                                                title="Remove file"
                                              >
                                                <X className="w-4 h-4" />
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  // --- MULTI-LIST INLINE LAYOUT ---
                                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                      <h3 className="text-sm font-bold text-slate-800">Upload Proposed Drawings</h3>
                                    </div>
                                    <div className="divide-y divide-slate-100">
                                      {config.requirementInput.map((inputConfig) => {
                                        const file = requirementFiles[inputConfig.key];
                                        const isActiveDrag = activeDragKey === inputConfig.key;

                                        return (
                                          <div
                                            key={inputConfig.key}
                                            onDragEnter={(e) => handleDragEvent(e, inputConfig.key)}
                                            onDragLeave={(e) => handleDragEvent(e, inputConfig.key)}
                                            onDragOver={(e) => handleDragEvent(e, inputConfig.key)}
                                            onDrop={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              if (isTourActive) return;
                                              setActiveDragKey(null);
                                              const droppedFile = e.dataTransfer.files?.[0];
                                              if (!droppedFile) return;

                                              if (!isAllowed(droppedFile, inputConfig.supportedFormats)) {
                                                toast.error(`Only ${inputConfig.supportedFormats.join(', ').toUpperCase()} files are allowed`);
                                                return;
                                              }
                                              if (droppedFile.size > inputConfig.maxSize * 1024 * 1024) {
                                                toast.error(`File size cannot exceed ${inputConfig.maxSize}MB`);
                                                return;
                                              }
                                              handleFileDrop('requirement', inputConfig.key, droppedFile);
                                            }}
                                            className={`
                                              p-4 transition-colors flex flex-col gap-3
                                              ${isActiveDrag ? 'bg-blue-50' : 'bg-white'}
                                            `}
                                          >
                                            {!file && (
                                              <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 sm:gap-4">
                                                {/* Left: Info */}
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-start sm:items-center gap-3">
                                                    <div className="shrink-0 mt-0.5 sm:mt-0">
                                                      <RotatingFormatIcons formats={inputConfig.supportedFormats} />
                                                    </div>
                                                    <div className="min-w-0">
                                                      <h3 className="text-[13px] sm:text-sm font-bold text-slate-800 leading-tight">
                                                        {inputConfig.heading}
                                                        {inputConfig.optional && (
                                                          <span className="text-[10px] font-normal text-slate-400 ml-1.5 block sm:inline">(Optional)</span>
                                                        )}
                                                      </h3>
                                                      <p className="text-[10px] md:text-xs text-slate-400 mt-1">
                                                        {inputConfig.supportedFormats.join(', ').toUpperCase()} • Max {inputConfig.maxSize}MB
                                                      </p>
                                                    </div>
                                                  </div>
                                                </div>

                                                {/* Right: Upload Button */}
                                                <div className="shrink-0">
                                                  <input
                                                    type="file"
                                                    id={`req-list-upload-${inputConfig.key}`}
                                                    className="hidden"
                                                    disabled={isTourActive}
                                                    accept={inputConfig.supportedFormats.map(f => `.${f}`).join(',')}
                                                    onChange={(e) => {
                                                      const selectedFile = e.target.files?.[0];
                                                      if (!selectedFile) return;
                                                      if (!isAllowed(selectedFile, inputConfig.supportedFormats)) {
                                                        toast.error(`Only ${inputConfig.supportedFormats.join(', ').toUpperCase()} files are allowed`);
                                                        e.target.value = '';
                                                        return;
                                                      }
                                                      if (selectedFile.size > inputConfig.maxSize * 1024 * 1024) {
                                                        toast.error(`File size cannot exceed ${inputConfig.maxSize}MB`);
                                                        e.target.value = '';
                                                        return;
                                                      }
                                                      handleFileDrop('requirement', inputConfig.key, selectedFile);
                                                    }}
                                                  />
                                                  <label
                                                    htmlFor={isTourActive ? "" : `req-list-upload-${inputConfig.key}`}
                                                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-xs sm:text-sm font-extrabold transition-all bg-white w-full sm:w-auto ${isTourActive ? 'tour-disabled-label' : 'hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer'}`}
                                                  >
                                                    <Upload className="w-3.5 h-3.5" />
                                                    Upload
                                                  </label>
                                                </div>
                                              </div>
                                            )}

                                            {/* File Info - Shown if file selected */}
                                            {file && (
                                              <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                  {(() => {
                                                    const fileInfo = getFileIcon(file.name);
                                                    const FileIcon = fileInfo.icon;
                                                    return (
                                                      <div
                                                        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 cursor-pointer transition-colors duration-200"
                                                        style={{ backgroundColor: fileInfo.bgColor }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = fileInfo.hoverBgColor}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = fileInfo.bgColor}
                                                      >
                                                        <FileIcon className="w-5 h-5" style={{ color: fileInfo.textColor }} />
                                                      </div>
                                                    );
                                                  })()}
                                                  <div className="flex flex-col items-start px-1 min-w-0 flex-1">
                                                    <span className="text-sm text-slate-700 truncate w-full" title={file.name}>
                                                      <span className="font-semibold">{inputConfig.heading}</span>
                                                      <span className="mx-2">-</span>
                                                      {file.name}
                                                    </span>
                                                    <span className="text-xs text-slate-400">
                                                      {formatFileSize(file.size)}
                                                    </span>
                                                  </div>
                                                </div>
                                                <button
                                                  onClick={() => !isTourActive && removeFile('requirement', inputConfig.key)}
                                                  disabled={isTourActive}
                                                  style={{
                                                    backgroundColor: '#fee2e2',
                                                    color: '#ef4444',
                                                    borderRadius: '50%',
                                                    width: '28px',
                                                    height: '28px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: 'none',
                                                    cursor: isTourActive ? 'not-allowed' : 'pointer'
                                                  }}
                                                  className={`hover:bg-red-200 transition-colors ml-3 shrink-0 ${isTourActive ? 'opacity-60' : ''}`}
                                                  title="Remove file"
                                                >
                                                  <X className="w-4 h-4" />
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </>
                        );
                      })()}
                    </div >

                    <Button
                      id="start-analyze-action-btn"
                      onClick={handleAnalyze}
                      disabled={loading || isTourActive}
                      className={`w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold text-lg shadow-xl shadow-blue-500/20 mt-6 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isTourActive ? 'tour-disabled-btn' : 'hover:shadow-lg hover:shadow-blue-500/30 active:scale-95'}`}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        "Start Analysis"
                      )}
                    </Button>

                    {/* Helpful Content Section */}
                    <div className="mt-8 space-y-6">
                      {/* Quick Tips */}
                      <div className="bg-white rounded-2xl p-2.5 sm:p-4 md:p-5 border border-blue-100 shadow-sm w-full max-w-full">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                          </div>
                          <h3 className="text-sm md:text-lg font-bold text-slate-900">Quick Tips</h3>
                        </div>
                        <ul className="grid grid-cols-1 gap-2.5 text-[11px] md:text-sm text-slate-600 font-medium">
                          <li className="flex items-start gap-2 md:gap-3">
                            <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                              <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-600" />
                            </div>
                            <span>Ensure your drawings are clear and properly scaled for accurate analysis</span>
                          </li>
                          <li className="flex items-start gap-2 md:gap-3">
                            <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                              <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-600" />
                            </div>
                            <span>Use descriptive analysis titles to easily identify different versions</span>
                          </li>
                          <li className="flex items-start gap-2 md:gap-3">
                            <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                              <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-600" />
                            </div>
                            <span>DXF files provide more detailed analysis than PDF files</span>
                          </li>
                          <li className="flex items-start gap-2 md:gap-3">
                            <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                              <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5 text-emerald-600" />
                            </div>
                            <span>Analysis typically completes within 2-5 minutes depending on file complexity</span>
                          </li>
                        </ul>
                      </div>

                      <div className="relative overflow-hidden bg-white rounded-3xl p-5 md:p-8 border border-slate-100 shadow-sm">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50/50 rounded-full blur-3xl -ml-24 -mb-24" />

                        <div className="relative">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#4f46e5] flex items-center justify-center shadow-lg shadow-blue-500/20">
                              <Zap className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg md:text-xl font-bold text-slate-900">What Happens Next?</h3>
                              <p className="text-xs md:text-sm text-slate-500 font-medium tracking-tight">Your analysis journey in 3 simple steps</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                            {/* Step 1 - Upload & Process */}
                            <div className="group relative bg-slate-50/50 rounded-2xl p-5 border border-slate-100 hover:border-blue-200 transition-all duration-300 hover:shadow-md">
                              {/* Icon */}
                              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                                <Upload className="w-6 h-6 text-[#2563eb]" />
                              </div>

                              {/* Content */}
                              <div className="flex items-center gap-2 mb-2">
                                <span
                                  className="flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-extrabold"
                                  style={{ backgroundColor: '#2563eb' }}
                                >
                                  1
                                </span>
                                <h4 className="font-bold text-slate-900 text-sm md:text-base">Upload & Process</h4>
                              </div>
                              <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
                                Your files are securely uploaded and processed instantly
                              </p>

                              {/* Progress indicator */}
                              <div className="mt-4 flex items-center gap-2 text-[10px] md:text-xs text-blue-600 font-bold uppercase tracking-wider">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                                Secure & Fast
                              </div>
                            </div>

                            {/* Step 2 - AI Analysis */}
                            <div className="group relative bg-slate-50/50 rounded-2xl p-5 border border-slate-100 hover:border-indigo-200 transition-all duration-300 hover:shadow-md">
                              {/* Icon */}
                              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                                <Bot className="w-6 h-6 text-[#4f46e5]" />
                              </div>

                              {/* Content */}
                              <div className="flex items-center gap-2 mb-2">
                                <span
                                  className="flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-extrabold"
                                  style={{ backgroundColor: '#4f46e5' }}
                                >
                                  2
                                </span>
                                <h4 className="font-bold text-slate-900 text-sm md:text-base">AI Analysis</h4>
                              </div>
                              <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
                                Advanced AI checks compliance and regulations thoroughly
                              </p>

                              {/* Progress indicator */}
                              <div className="mt-4 flex items-center gap-2 text-[10px] md:text-xs text-[#4f46e5] font-bold uppercase tracking-wider">
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                AI Powered
                              </div>
                            </div>

                            {/* Step 3 - Get Results */}
                            <div className="group relative bg-slate-50/50 rounded-2xl p-5 border border-slate-100 hover:border-emerald-200 transition-all duration-300 hover:shadow-md">
                              {/* Icon */}
                              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                                <FileText className="w-6 h-6 text-[#10b981]" />
                              </div>

                              {/* Content */}
                              <div className="flex items-center gap-2 mb-2">
                                <span
                                  className="flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-extrabold"
                                  style={{ backgroundColor: '#10b981' }}
                                >
                                  3
                                </span>
                                <h4 className="font-bold text-slate-900 text-sm md:text-base">Get Results</h4>
                              </div>
                              <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
                                Detailed report with actionable insights and recommendations
                              </p>

                              {/* Progress indicator */}
                              <div className="mt-4 flex items-center gap-2 text-[10px] md:text-xs text-[#10b981] font-bold uppercase tracking-wider">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Ready to Use
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>


                  </>
                )}
              </div >
            )
            }

            {
              activeStep === 2 && (
                <div className="step-transition bg-white rounded-3xl border border-slate-200 overflow-hidden anima-fade-in">
                  {currentAuthority === 'DEWA' ? (
                    <DewaRuleCheck
                      aiResponseText={selectedAnalysis?.ai_response_text || {}}
                      projectData={projectData}
                      navigateTo={p => navigate(p)}
                    />
                  ) : currentAuthority === 'DCD' ? (
                    <DcdRuleCheck
                      aiResponseText={selectedAnalysis?.ai_response_text || {}}
                      projectData={projectData}
                      navigateTo={p => navigate(p)}
                    />
                  ) : (
                    <AIAnalysisContent
                      showFloatingAssistant={false}
                      navigateTo={p => navigate(p)}
                      aiResponseText={selectedAnalysis?.ai_response_text || {}}
                      projectData={projectData}
                    />
                  )}
                </div>
              )
            }

            {
              activeStep === 3 && (
                <div className="step-transition bg-white rounded-3xl border border-slate-200 overflow-hidden anima-fade-in">
                  <AuthorityBreakdownContent
                    aiResponseText={selectedAnalysis?.ai_response_text || {}}
                    projectData={projectData}
                  />
                </div>
              )
            }

            {activeStep === 4 && <DocumentChecklistContent />}
            {activeStep === 5 && <FeasibilityReportContent />}
          </div >
        )
        }

        {/* Edit Title Modal */}
        {
          editingAnalysis && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)' }}
              onClick={() => setEditingAnalysis(null)}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl w-96 p-6 transform transition-all scale-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Edit3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Edit Analysis Title</h3>
                  <p className="text-sm text-slate-500 mb-4">Update the title for <span className="font-semibold text-slate-700">"{editingAnalysis.title}"</span></p>

                  <Input
                    value={editingTitleValue}
                    onChange={(e) => setEditingTitleValue(e.target.value)}
                    placeholder="Enter new title"
                    className="mb-6 rounded-xl h-12 px-4 shadow-sm w-full font-medium transition-all outline-none border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmEditTitle();
                      if (e.key === 'Escape') setEditingAnalysis(null);
                    }}
                  />

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setEditingAnalysis(null)}
                      className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium text-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmEditTitle}
                      disabled={isUpdatingTitle}
                      style={{
                        flex: '1',
                        padding: '10px 16px',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: '600',
                        border: 'none',
                        cursor: isUpdatingTitle ? 'not-allowed' : 'pointer',
                        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        opacity: isUpdatingTitle ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (isUpdatingTitle) return;
                        e.currentTarget.style.backgroundColor = '#1d4ed8';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        if (isUpdatingTitle) return;
                        e.currentTarget.style.backgroundColor = '#2563eb';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
                      }}
                    >
                      {isUpdatingTitle ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* Delete Confirmation Modal */}
        {
          deletingAnalysis && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)' }}
              onClick={() => setDeletingAnalysis(null)}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl w-96 p-6 transform transition-all scale-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Delete Analysis?</h3>
                  <p className="text-sm text-slate-500 mb-2">This will delete <span className="font-semibold text-slate-700">"{deletingAnalysis.title}"</span></p>
                  <p className="text-xs text-slate-400 mb-6">You will not be able to recover this analysis.</p>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setDeletingAnalysis(null)}
                      className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium text-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDelete}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium text-sm shadow-lg shadow-red-200 cursor-pointer flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: '#dc2626',
                        color: 'white',
                        opacity: isDeleting ? 0.7 : 1,
                        cursor: isDeleting ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* Mode Change Confirmation Modal */}
        {
          showModeChangeConfirmation && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)' }}
              onClick={cancelModeChange}
            >
              <div
                className="bg-white rounded-2xl shadow-2xl w-96 p-6 transform transition-all scale-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Switch Mode?</h3>
                  <p className="text-sm text-slate-500 mb-6">Changing the upload mode will clear your currently selected files. Do you want to continue?</p>

                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={cancelModeChange}
                      style={{
                        backgroundColor: '#f1f5f9',
                        color: '#334155',
                        padding: '10px 20px',
                        borderRadius: '12px',
                        fontWeight: '600',
                        fontSize: '14px',
                        border: 'none',
                        cursor: 'pointer',
                        flex: 1,
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                    >
                      No, Keep Files
                    </button>
                    <button
                      onClick={confirmModeChange}
                      style={{
                        backgroundColor: '#2563eb',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '12px',
                        fontWeight: '500',
                        fontSize: '14px',
                        border: 'none',
                        cursor: 'pointer',
                        flex: 1,
                        boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    >
                      Yes, Switch
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        }
      </div >
    </>
  );
}
