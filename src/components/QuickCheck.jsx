import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Upload, ArrowLeft,
  RefreshCw,
  Clock,
  X,
  Trash2,
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ArrowUp
} from 'lucide-react';
import { Button } from './ui/button';
import { toast } from "react-hot-toast";
import { QUICK_CHECK_API } from '../Services/user';
import { ClaudeAnalysis } from './ClaudeAnalysis';
import {
  ADD_QUICK_CHECK_RECORD,
  REMOVE_QUICK_CHECK_RECORD,
  selectUserQuickChecks
} from '../store/quickCheckSlice';
import { formatRelativeDate } from '../utils/formatDateMoment';
import { formatFileSize } from '../utils/formatFileSize';

export function QuickCheck() {

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


  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isViewResult = searchParams.get('mode') === 'view-result';
  const dispatch = useDispatch();
  const { employee_id } = useSelector((state) => state.auth);
  const historyRecords = useSelector((state) => selectUserQuickChecks(state, employee_id));

  const [drawingFile, setDrawingFile] = useState(null);
  const [requirementFile, setRequirementFile] = useState(null);
  const [drawingDragActive, setDrawingDragActive] = useState(false);
  const [reqDragActive, setReqDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [hoveredRecordId, setHoveredRecordId] = useState(null);
  const topRef = useRef(null);

  // Auto-scroll to top when result view toggles
  useEffect(() => {
    const timer = setTimeout(() => {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => clearTimeout(timer);
  }, [analysisResult]);

  const MAX_DRAWING_FILE_SIZE_MB = 700; // 700 MB
  const MAX_REQUIREMENT_FILE_SIZE_MB = 10; // 10 MB

  const handleDrawingDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (["dragenter", "dragover"].includes(e.type)) setDrawingDragActive(true);
    if (e.type === "dragleave") setDrawingDragActive(false);
  };

  const handleReqDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (["dragenter", "dragover"].includes(e.type)) setReqDragActive(true);
    if (e.type === "dragleave") setReqDragActive(false);
  };

  const handleDrawingDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDrawingDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const name = file.name.toLowerCase();
      const isDxf = name.endsWith(".dxf");
      const isPdf = name.endsWith(".pdf");

      if (!isDxf && !isPdf) {
        toast.error("Only DXF or PDF files are allowed for drawing");
        return;
      }
      if (file.size > MAX_DRAWING_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`Drawing file size cannot exceed ${MAX_DRAWING_FILE_SIZE_MB}MB`);
        return;
      }
      setDrawingFile(file);
    }
  };

  const handleRequirementDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setReqDragActive(false);
    const file = e.dataTransfer.files?.[0];

    if (file) {
      const isTxt = file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

      if (!isTxt && !isPdf) {
        toast.error("Only TXT or PDF files are allowed");
        return;
      }
      if (file.size > MAX_REQUIREMENT_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`File size cannot exceed ${MAX_REQUIREMENT_FILE_SIZE_MB}MB`);
        return;
      }
      setRequirementFile(file);
    }
  };

  const validate = () => {
    if (!drawingFile) {
      toast.error("Drawing file is required");
      return false;
    }
    if (!requirementFile) {
      toast.error("Requirement file is required");
      return false;
    }
    return true;
  };

  const handleAnalyze = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      setUploadMessage('Initializing upload...');

      const messages = [
        'Uploading files...',
        'Analyzing requirements...',
        'Running quick check...',
        'Generating report...'
      ];

      let currentIndex = 0;
      const messageInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % messages.length;
        setUploadMessage(messages[currentIndex]);
      }, 2000);

      const fd = new FormData();

      // Only include files for Quick Check
      fd.append("drawing", drawingFile);
      fd.append("requirement", requirementFile);
      // Authority will be handled by backend as 'all'

      const res = await QUICK_CHECK_API(fd);

      clearInterval(messageInterval);

      const response = res?.response ? res?.response : res;

      if (response?.data?.success) {
        toast.success("Quick Check completed");
        const aiResponse = response.data.payload.ai_response;
        console.log('🤖 AI Response:', aiResponse);
        const parsed = parseAIResponse(aiResponse);
        console.log('🤖 Parsed AI Response:', parsed);
        const ai = parsed.isJson ? parsed.data : null;
        console.log('🤖 AI:', ai);
        // Extract Data (ui_compat can be nested inside engine_result OR at top level)
        const engineResult = ai?.engine_result || {};
        console.log('🤖 Engine Result:', engineResult);

        // Extract ui_view data (NEW PRIORITY)
        let uiView = engineResult?.ui_view || null;
        console.log('🤖 UI View:', uiView);
        const uiCompat = uiView || engineResult?.ui_compat || engineResult || ai?.ui_compat || {};
        console.log('🤖 UI Compat:', uiCompat);

        // Match what ClaudeAnalysis expects (ui_compat or the object itself)
        // const finalData = aiResponse?.ui_compat || aiResponse;
        const finalData = uiView?.claude_like_data || uiCompat?.claude_like_data || engineResult?.claude_like_data || null;
        console.log('🤖 Final Data:', finalData);


        setAnalysisResult(finalData);
        setSearchParams({ mode: 'view-result' });

        // Save to History
        if (employee_id) {
          dispatch(ADD_QUICK_CHECK_RECORD({
            employee_id: employee_id,
            record: {
              id: Date.now(),
              date: new Date().toISOString(),
              fileName: drawingFile?.name || "Test_Drawing.dxf",
              data: finalData
            }
          }));
        }

      } else {
        toast.error(response?.data?.payload?.message || "Analysis failed");
      }

    } catch (err) {
      console.error("Error analyzing:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setUploadMessage('');
    }
  };

  return (
    <>
      <div ref={topRef} />

      {loading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/10"
          style={{ backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
        >
          <div className="relative">
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full blur-3xl opacity-10 animate-pulse"></div>

            {/* Loader card */}
            <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 md:p-12 min-w-[280px] md:min-w-[400px]">

              {/* Spinner container */}
              <div className="flex flex-col items-center space-y-6">

                {/* Animated icon container */}
                <div className="relative">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3 flex items-center justify-center">
                    <Upload className="w-10 h-10 text-white" strokeWidth={2} />
                  </div>
                </div>

                {/* Loading text */}
                <div className="text-center space-y-2">
                  <h3 className="text-xl md:text-2xl font-semibold text-slate-900">
                    Running Quick Check
                  </h3>
                  <p className="text-sm md:text-base text-slate-600 min-h-[24px] transition-all duration-300">
                    {uploadMessage || 'Initializing upload...'}
                  </p>
                </div>

                {/* Enhanced Animated dots */}
                <div className="flex space-x-3">
                  <div
                    className="w-3 h-3 rounded-full animate-bounce shadow-lg"
                    style={{
                      animationDelay: '0ms',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                    }}
                  ></div>
                  <div
                    className="w-3 h-3 rounded-full animate-bounce shadow-lg"
                    style={{
                      animationDelay: '150ms',
                      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
                    }}
                  ></div>
                  <div
                    className="w-3 h-3 rounded-full animate-bounce shadow-lg"
                    style={{
                      animationDelay: '300ms',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                      boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
                    }}
                  ></div>
                </div>

                {/* Status message */}
                <p className="text-xs text-slate-500 text-center">
                  Please wait, this may take a few moments
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {analysisResult && isViewResult ? (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">

            <div>
              <h1 className="text-slate-900 mb-2 font-bold text-2xl">Quick Check Results</h1>
              <p className="text-slate-600">
                Review the AI analysis of your submission
              </p>
            </div>

            <Button
              onClick={() => {
                setAnalysisResult(null);
                setDrawingFile(null);
                setRequirementFile(null);
                setSearchParams({});
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 transition-all rounded-xl px-6 h-12"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Start New Check
            </Button>
          </div>
          <ClaudeAnalysis claudeData={analysisResult} isCollapsible={false} />

          {/* Navigation Buttons (Non-floating) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-12 border-t border-slate-100 mt-8">
            <button
              onClick={() => {
                setAnalysisResult(null);
                setDrawingFile(null);
                setRequirementFile(null);
                setSearchParams({});
                window.scrollTo(0, 0);
              }}
              style={{ backgroundColor: '#0f172a' }}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 h-14 text-white rounded-2xl shadow-lg hover:opacity-90 transition-all hover:scale-105 active:scale-95 border border-white/10 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-bold whitespace-nowrap">Go Back to Upload</span>
            </button>

            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
                if (topRef.current) {
                  topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              style={{ backgroundColor: '#2563eb' }}
              className="w-full sm:w-auto h-14 px-8 text-white rounded-2xl shadow-xl hover:opacity-90 transition-all hover:scale-105 active:scale-95 border-2 border-white/20 flex items-center justify-center gap-3 cursor-pointer font-bold"
            >
              <span className="tracking-wide">Scroll to Top</span>
              <ArrowUp className="w-5 h-5 animate-bounce" />
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
          <div>
            <h1 className="text-slate-900 mb-2 font-bold text-2xl">Quick Check</h1>
            <p className="text-slate-600">
              Upload drawing and requirements for a quick analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Drawing Upload */}
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 p-4 md:p-8 space-y-4">
              <div>
                <h2 className="text-slate-900 font-bold text-lg">
                  Upload Drawing
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1 mb-2">
                  <span className="text-xs font-medium text-slate-500">Supported formats:</span>
                  <span className="px-2  rounded-md text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-tighter shadow-sm">
                    DXF / PDF
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[12px] font-medium italic">
                    Maximum file size: <span className="text-slate-900 font-bold not-italic">{MAX_DRAWING_FILE_SIZE_MB}MB</span>
                  </span>
                </div>
              </div>

              <div
                onDragEnter={handleDrawingDrag}
                onDragLeave={handleDrawingDrag}
                onDragOver={handleDrawingDrag}
                onDrop={handleDrawingDrop}
                className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all duration-200 ${drawingDragActive ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                  }`}
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-slate-900 mb-2 text-sm">Drop drawing here or click to browse</h3>
                <input
                  type="file"
                  accept=".dxf,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const name = file.name.toLowerCase();
                    const isDxf = name.endsWith(".dxf");
                    const isPdf = name.endsWith(".pdf");

                    if (!isDxf && !isPdf) {
                      toast.error("Only DXF or PDF files are allowed for drawing");
                      e.target.value = null;
                      return;
                    }

                    if (file.size > MAX_DRAWING_FILE_SIZE_MB * 1024 * 1024) {
                      toast.error(`Drawing file size cannot exceed ${MAX_DRAWING_FILE_SIZE_MB}MB`);
                      e.target.value = null;
                      return;
                    }
                    setDrawingFile(file);
                  }}
                  className="hidden"
                  id="drawing-upload"
                />
                <label htmlFor="drawing-upload">
                  <Button asChild variant="outline" className="cursor-pointer">
                    <span>Select Drawing</span>
                  </Button>
                </label>
              </div>

              {drawingFile && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="truncate">
                      <span className="text-sm font-medium text-slate-700 block truncate">
                        {drawingFile.name}
                      </span>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(drawingFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setDrawingFile(null);
                      const el = document.getElementById("drawing-upload");
                      if (el) el.value = "";
                    }}
                    className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center ml-2 flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              )}
            </div>

            {/* Requirement Upload */}
            <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 p-4 md:p-8 space-y-4">
              <div>
                <h2 className="text-slate-900 font-bold text-lg">
                  Upload Requirement
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1 mb-2">
                  <span className="text-xs font-medium text-slate-500">Supported formats:</span>
                  <span className="px-2  rounded-md text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-tighter shadow-sm">
                    TXT / PDF
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[12px] font-medium italic">
                    Maximum file size: <span className="text-slate-900 font-bold not-italic">{MAX_REQUIREMENT_FILE_SIZE_MB}MB</span>
                  </span>
                </div>
              </div>

              <div
                onDragEnter={handleReqDrag}
                onDragLeave={handleReqDrag}
                onDragOver={handleReqDrag}
                onDrop={handleRequirementDrop}
                className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all duration-200 ${reqDragActive ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
                  }`}
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-slate-900 mb-2 text-sm">Drop requirement here or click to browse</h3>
                <input
                  type="file"
                  accept=".txt,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const isTxt = file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");
                    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

                    if (!isTxt && !isPdf) {
                      toast.error("Only TXT or PDF files are allowed");
                      e.target.value = null;
                      return;
                    }
                    if (file.size > MAX_REQUIREMENT_FILE_SIZE_MB * 1024 * 1024) {
                      toast.error(`File size cannot exceed ${MAX_REQUIREMENT_FILE_SIZE_MB}MB`);
                      e.target.value = null;
                      return;
                    }
                    setRequirementFile(file);
                  }}
                  className="hidden"
                  id="requirement-upload"
                />
                <label htmlFor="requirement-upload">
                  <Button asChild variant="outline" className="cursor-pointer">
                    <span>Select Requirement</span>
                  </Button>
                </label>
              </div>

              {requirementFile && (
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="truncate">
                      <span className="text-sm font-medium text-slate-700 block truncate">
                        {requirementFile.name}
                      </span>
                      <p className="text-xs text-slate-500">
                        {formatFileSize(requirementFile.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setRequirementFile(null);
                      const el = document.getElementById("requirement-upload");
                      if (el) el.value = "";
                    }}
                    className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center ml-2 flex-shrink-0"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={!drawingFile || !requirementFile || loading}
              className="w-full md:w-auto min-w-[200px] bg-slate-900 hover:bg-slate-800 text-white"
            >
              Run Quick Check
            </Button>
          </div>

          {/* HISTORY SECTION */}
          {historyRecords?.length > 0 && (
            <div className="mt-12 bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Header */}
              <div className="p-4 md:p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-slate-900 font-bold text-lg mb-1">Recent Quick Checks</h2>
                  <p className="text-sm text-slate-600 hidden sm:block">History of your analysis reports</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>

              {/* List */}
              <div className="divide-y divide-slate-100">
                {historyRecords.map((record) => (
                  <div
                    key={record.id}
                    className="p-3 md:p-4 transition-all duration-200 group cursor-pointer relative"
                    style={{
                      borderLeft: `4px solid ${hoveredRecordId === record.id ? '#3b82f6' : 'transparent'}`,
                      backgroundColor: hoveredRecordId === record.id ? 'rgba(239, 246, 255, 0.8)' : 'transparent',
                    }}
                    onMouseEnter={() => setHoveredRecordId(record.id)}
                    onMouseLeave={() => setHoveredRecordId(null)}
                    onClick={() => {
                      setAnalysisResult(record.data);
                      setSearchParams({ mode: 'view-result' });
                    }}
                  >
                    {/* Top Row: File Info */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 md:gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <h3 className="text-slate-900 font-medium text-sm md:text-base truncate">{record.fileName}</h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 pl-12 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{formatRelativeDate(record.date)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1"></div>
                      <div className="flex gap-3">
                        <button
                          className="cursor-pointer flex-1 sm:flex-none px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs md:text-sm font-medium rounded-xl hover:border-indigo-500 hover:text-indigo-600 hover:shadow-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                          View Result <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(REMOVE_QUICK_CHECK_RECORD({ employee_id: employee_id, recordId: record.id }));
                          }}
                          className="cursor-pointer rounded-xl border transition-colors flex-shrink-0"
                          style={{
                            backgroundColor: '#fef2f2',
                            color: '#ef4444',
                            borderColor: '#fee2e2',
                            padding: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ height: '2px' }} />
    </>
  );
}