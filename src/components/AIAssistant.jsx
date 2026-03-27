import { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Send,
  Sparkles,
  ChevronDown,
  User,
  ChevronLeft,
  MessageSquare,
  ChevronRight,
  PanelLeft,
  PanelRight,
  Plus,
  PanelRightOpen,

  PanelLeftOpen,
  AlertCircle,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  Link as LinkIcon,
  Download,
  Copy,
  ExternalLink,
  ArrowDown,
  Search,
  Loader2,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { limitText } from "../utils/textHelpers";
import { nanoid } from "nanoid";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  GET_USER_CHATS_API,
  GET_CHAT_BY_ID_API,
  CREATE_CHAT_API,
  ADD_MESSAGE_API,
  UPDATE_CHAT_TITLE_API,
  DELETE_CHAT_API,
  GET_USER_PROJECTS_API,
  ASSIGN_PROJECT_TO_CHAT_API,
} from "../Services/chat";
import { GET_ANALYSES_BY_PROJECT_API } from "../Services/user";
import toast from "react-hot-toast";

const suggestedQuestions = [
  "Why is Civil Defence approval required for my project?",
  "Which documents are missing from my checklist?",
  "How can I expedite the DEWA approval process?",
  "What are the parking requirements for mixed-use buildings?",
  "Explain the fire safety modifications needed",
];

const TypewriterTitle = ({ text }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i > text.length) clearInterval(timer);
    }, 50);
    return () => clearInterval(timer);
  }, [text]);

  return <span>{displayedText}</span>;
};

const ChatListSkeleton = () => (
  <div className="space-y-3 animate-pulse px-3">
    {[1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="h-10 bg-slate-100 rounded-lg w-full"></div>
    ))}
  </div>
);

const MessageSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    {[1, 2, 3].map((i) => (
      <div key={i} className={`flex gap-4 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
        <div className="w-10 h-10 bg-slate-200 rounded-2xl flex-shrink-0"></div>
        <div className="flex-1 space-y-3">
          <div className={`h-4 bg-slate-200 rounded w-1/4 ${i % 2 === 0 ? 'ml-auto' : ''}`}></div>
          <div className="h-4 bg-slate-200 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

export function AIAssistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const { chatId } = useParams();

  // Get Project ID from Local Storage (set by Project Viewer)
  // const queryParams = new URLSearchParams(location.search);
  // const projectId = queryParams.get('projectId');

  // Use localStorage for persistence across reloads during demo
  const [projectId, setProjectId] = useState(() => localStorage.getItem("activeProjectId"));
  const [analysisId, setAnalysisId] = useState(() => localStorage.getItem("activeAnalysisId"));

  // Listen for storage changes (optional, for mostly static demo)
  useEffect(() => {
    const savedId = localStorage.getItem("activeProjectId");
    if (savedId !== projectId) setProjectId(savedId);
    
    const savedAnalysisId = localStorage.getItem("activeAnalysisId");
    if (savedAnalysisId !== analysisId) setAnalysisId(savedAnalysisId);
  }, []);

  // Clear project context if navigating to root /assistant without params
  // Clear project context if navigating to root /assistant without params
  useEffect(() => {
    if (!chatId && !location.search.includes("projectId")) {
      setProjectId(null);
      setAnalysisId(null);
      localStorage.removeItem("activeProjectId");
      localStorage.removeItem("activeAnalysisId");
    }
  }, [chatId, location.search]);

  const [animatingChatId, setAnimatingChatId] = useState(() => location.state?.animatingChatId || null);

  useEffect(() => {
    if (location.state?.animatingChatId) {
      setAnimatingChatId(location.state.animatingChatId);
      // Clear the animating state from history so it doesn't persist on refresh
      window.history.replaceState({}, document.title);
    } else {
      setAnimatingChatId(null);
    }
  }, [location]);

  // Prevent repeated animation on re-renders (e.g. sidebar toggle)
  useEffect(() => {
    if (animatingChatId) {
      const timer = setTimeout(() => {
        setAnimatingChatId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [animatingChatId]);

  const [chats, setChats] = useState(() => {
    try {
      const saved = sessionStorage.getItem("ai_assistant_chats");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [currentChatId, setCurrentChatId] = useState(chatId);
  const [input, setInput] = useState("");
  const [expandedReasoning, setExpandedReasoning] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth > 768 : true);

  const [isChatsLoading, setIsChatsLoading] = useState(() => {
    try {
      return !sessionStorage.getItem("ai_assistant_chats");
    } catch { return true; }
  });

  const [isMessagesLoading, setIsMessagesLoading] = useState(() => !!chatId);
  const [pendingUserMessage, setPendingUserMessage] = useState(null); // For new chat optimistic UI
  const [error, setError] = useState(null);
  const [chatNotFound, setChatNotFound] = useState(false); // Track if chat ID is invalid
  const messagesEndRef = useRef(null);
  const sidebarRef = useRef(null);
  const chatInputRef = useRef(null);
  const deletedChatIdRef = useRef(null); // Track ID of chat being deleted to prevent error toast
  const editInputRef = useRef(null);

  // New state for chat management
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitleInput, setEditTitleInput] = useState("");
  const [deletingChat, setDeletingChat] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeMenuId && !event.target.closest('.chat-menu-container')) {
        setActiveMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenuId]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingChatId]);

  const currentChat = chats.find((c) => c.chatId === currentChatId);

  // Sync chats to sessionStorage
  useEffect(() => {
    if (chats.length > 0) {
      sessionStorage.setItem("ai_assistant_chats", JSON.stringify(chats));
    }
  }, [chats]);

  // Fetch chats on mount
  useEffect(() => {
    const fetchChats = async () => {
      // Only show skeleton if we have no chats
      if (chats.length === 0) setIsChatsLoading(true);

      try {
        setError(null);

        const response = await GET_USER_CHATS_API();

        if (response?.data?.success) {
          setChats(response.data.payload.chats || []);
        }
      } catch (err) {
        console.error("Error fetching chats:", err);
        setError("Failed to load chats. Please refresh the page.");
        toast.error("Failed to load chats. Please try again.");
        setChats([]);
      } finally {
        setIsChatsLoading(false);
      }
    };

    fetchChats();
  }, []);

  // Handle URL sync and chatId validation
  useEffect(() => {
    if (isChatsLoading) return;

    if (chats.length === 0) {
      if (chatId) {
        navigate('/assistant', { replace: true });
      }
      setCurrentChatId(null);
      setChatNotFound(false);
      setIsMessagesLoading(false);
      return;
    }

    // Validate chatId from URL
    if (chatId) {
      const chatIndex = chats.findIndex(c => c.chatId === chatId);

      if (chatIndex !== -1) {
        const targetChat = chats[chatIndex];

        // If messages not loaded yet (backend sends partial data), fetch them
        if (!targetChat.messages) {
          setIsMessagesLoading(true);
          setCurrentChatId(chatId); // Optimistic update

          GET_CHAT_BY_ID_API(chatId)
            .then(response => {
              if (response?.data?.success) {
                const fullChat = response.data.payload.chat;
                setChats(prev => {
                  const newChats = [...prev];
                  newChats[chatIndex] = fullChat;
                  return newChats;
                });
              }
            })
            .catch(err => {
              console.error("Error fetching chat details:", err);
              toast.error("Failed to load conversation details");
              setIsMessagesLoading(false);
            });
        } else {
          // Messages already loaded
          if (isMessagesLoading || chatId !== currentChatId) {
            if (!isMessagesLoading) setIsMessagesLoading(true);
            setTimeout(() => setIsMessagesLoading(false), 500);
          } else {
            setIsMessagesLoading(false);
          }
          setCurrentChatId(chatId);
          setChatNotFound(false);
        }
      } else {
        // Invalid chatId in URL
        if (!chatNotFound && chatId !== deletedChatIdRef.current) {
          toast.error(`Unable to load conversation ${chatId}.`);
        }
        setCurrentChatId(null);
        setChatNotFound(true);
        setIsMessagesLoading(false);
      }
    } else {
      // No chatId in URL
      setCurrentChatId(null);
      setChatNotFound(false);
      setIsMessagesLoading(false);
    }
  }, [chatId, chats, isChatsLoading, navigate, chatNotFound]);

  // Handle Input Autofocus
  useEffect(() => {
    if (!isMessagesLoading && chatInputRef.current) {
      // Small timeout to ensure DOM is ready and animations are done
      setTimeout(() => {
        chatInputRef.current?.focus();
      }, 100);
    }
  }, [currentChatId, isMessagesLoading]);

  const handleNewChat = () => {
    // Clear current chat to show empty state with welcome message
    // New chat will be created when user sends first message
    setCurrentChatId(null);
    // Don't manually reset chatNotFound here - let the useEffect handling URL change do it
    // setChatNotFound(false); 
    setInput("");
    setExpandedReasoning(null);
    setIsTyping(false);
    navigate('/assistant', { state: { preservedChats: chats } });
    // toast.success("Ready for new conversation!");
  };

  const handleSend = async (manualContent = null, overrideProjectId = null, overrideAnalysisId = null) => {
    // Determine content: argument OR state
    const contentToSend = (typeof manualContent === 'string' && manualContent) ? manualContent : input;

    if (!contentToSend.trim() || isTyping) return;

    const userMessageContent = contentToSend;
    setInput("");

    const startTime = Date.now();
    const tempId = nanoid();

    // 1. Optimistic UI Update
    if (currentChatId) {
      // Add user message to existing chat locally
      setChats(prev => prev.map(c => {
        if (c.chatId === currentChatId) {
          return {
            ...c,
            messages: [...(c.messages || []), {
              id: tempId,
              role: 'user',
              content: userMessageContent,
              timestamp: new Date()
            }],
            // Don't update updatedAt locally so it doesn't jump to top immediately
            // updatedAt: new Date().toISOString()
          };
        }
        return c;
      }));
    } else {
      // Show message in virtual new chat interface
      setPendingUserMessage(userMessageContent);
    }

    setIsTyping(true);

    try {
      let response;

      if (!currentChatId) {
        // First message - create new chat with initial message
        response = await CREATE_CHAT_API({
          initialMessage: {
            role: "user",
            content: userMessageContent,
          },
          projectId: overrideProjectId || projectId, // Pass selected project ID
          analysisId: overrideAnalysisId || analysisId, // Pass selected analysis ID
        });

        if (response?.data?.success) {
          const newChat = response.data.payload.chat;

          // Calculate timing for smooth UX
          const elapsedTime = Date.now() - startTime;
          const minimumTypingTime = 1200;
          const delay = Math.max(0, minimumTypingTime - elapsedTime);

          setTimeout(() => {
            setChats(prev => {
              // Check if chat already exists to avoid duplicates (unlikely for new chat but good practice)
              if (prev.some(c => c.chatId === newChat.chatId)) return prev;
              return [newChat, ...prev];
            });
            setCurrentChatId(newChat.chatId);
            setPendingUserMessage(null); // Clear virtual message

            // Update URL with new chatId
            navigate(`/assistant/${newChat.chatId}`, { state: { preservedChats: [newChat, ...chats], animatingChatId: newChat.chatId } });

            // Scroll sidebar to top
            if (sidebarRef.current) sidebarRef.current.scrollTop = 0;

            setIsTyping(false);
          }, delay);
        }
      } else {
        // Subsequent message - add to existing chat
        response = await ADD_MESSAGE_API(currentChatId, {
          role: "user",
          content: userMessageContent,
        });

        if (response?.data?.success) {
          const updatedChat = response.data.payload.chat;

          // Calculate how long the request took
          const elapsedTime = Date.now() - startTime;
          const minimumTypingTime = 1200;
          const delay = Math.max(0, minimumTypingTime - elapsedTime);

          setTimeout(() => {
            setChats((prevChats) =>
              prevChats.map((chat) =>
                // Keep original updatedAt to prevent jumping to top
                chat.chatId === currentChatId ? { ...updatedChat, updatedAt: chat.updatedAt } : chat
              )
            );
            setIsTyping(false);
          }, delay);
        }
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
      toast.error("Failed to send message");

      // Revert Optimistic Update
      if (currentChatId) {
        setChats(prev => prev.map(c => {
          if (c.chatId === currentChatId && c.messages) {
            return {
              ...c,
              messages: c.messages.filter(m => m.id !== tempId)
            }
          }
          return c;
        }));
      } else {
        setPendingUserMessage(null);
      }

      setInput(userMessageContent);
      setIsTyping(false);
    }
  };

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [allProjects, setAllProjects] = useState([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);

  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [isAnalysesLoading, setIsAnalysesLoading] = useState(false);
  const [projectAnalyses, setProjectAnalyses] = useState([]);
  const [selectedProjectForAnalysis, setSelectedProjectForAnalysis] = useState(null);
  const [analysisSearchQuery, setAnalysisSearchQuery] = useState("");

  // Fetch projects for the modal
  const fetchProjects = async () => {
    setIsProjectsLoading(true);
    try {
      const response = await GET_USER_PROJECTS_API();
      if (response?.data?.success) {
        setAllProjects(response.data.payload.projects || []);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setIsProjectsLoading(false);
    }
  };

  useEffect(() => {
    if (showProjectModal) {
      fetchProjects();
    }
  }, [showProjectModal]);

  const filteredProjects = allProjects.filter(p =>
    p.project_name.toLowerCase().includes(projectSearchQuery.toLowerCase()) ||
    p.project_id.toLowerCase().includes(projectSearchQuery.toLowerCase())
  );

  const filteredAnalyses = projectAnalyses.filter(a =>
    (a.title || "").toLowerCase().includes(analysisSearchQuery.toLowerCase()) ||
    (a.authority_type || "").toLowerCase().includes(analysisSearchQuery.toLowerCase()) ||
    (a.analysis_id || "").toLowerCase().includes(analysisSearchQuery.toLowerCase())
  );

  const handleProjectSelect = async (project) => {
    setSelectedProjectForAnalysis(project);
    setShowProjectModal(false);
    setShowAnalysisModal(true);
    setAnalysisSearchQuery(""); // Reset search on modal open
    setIsAnalysesLoading(true);
    try {
      const res = await GET_ANALYSES_BY_PROJECT_API(project.project_id);
      if (res?.data?.success) {
        setProjectAnalyses(res.data.payload.analyses || []);
      }
    } catch (err) {
      toast.error("Failed to load analyses");
    } finally {
      setIsAnalysesLoading(false);
    }
  };

  const handleAnalysisSelect = async (analysis) => {
    const project = selectedProjectForAnalysis;
    
    // 1. Check if a chat already exists for this project + analysis
    const existingChat = chats.find(c => c.projectId === project.project_id && c.analysisId === analysis.analysis_id);

    // 2. Info about current chat
    const currentChat = chats.find(c => c.chatId === currentChatId);
    const isCurrentChatBound = currentChat && currentChat.projectId; // True if bound to a project

    setProjectId(project.project_id);
    setAnalysisId(analysis.analysis_id);
    localStorage.setItem("activeProjectId", project.project_id);
    localStorage.setItem("activeAnalysisId", analysis.analysis_id);

    if (existingChat) {
      if (existingChat.chatId === currentChatId) {
        toast("You are already in the chat for this project and analysis.");
        setShowAnalysisModal(false);
        return;
      }

      // SWITCHING to existing chat
      handleSidebarChatClick(existingChat.chatId);
      toast.success(`Switched to existing chat`);

      // If current chat is temporary/unbound, DELETE it silently in background
      if (currentChatId && !isCurrentChatBound) {
        const chatToDelete = currentChatId;

        // Mark as being deleted to prevent "Unable to load" error from URL validation
        deletedChatIdRef.current = chatToDelete;

        // Remove locally immediately
        setChats(prev => prev.filter(c => c.chatId !== chatToDelete));

        // Delete on server (best effort, silent)
        DELETE_CHAT_API(chatToDelete).catch(err => {
          console.warn("Background delete of empty chat failed (harmless):", err);
        });
      }

    } else {
      // NO existing chat. Need to Assign or Create.
      if (currentChatId && !isCurrentChatBound) {
        // CASE: Current chat is FREE. Assign project here.
        try {
          const res = await ASSIGN_PROJECT_TO_CHAT_API(currentChatId, project.project_id, analysis.analysis_id);
          if (res?.data?.success) {
            toast.success(`Project and analysis assigned to this chat`);

            // Auto-send project identifier to trigger AI response
            const projectString = `Project: ${project.project_name} | Analysis: ${analysis.title} - ${analysis.authority_type} [${analysis.analysis_id}] (${project.project_id})`;
            handleSend(projectString, project.project_id, analysis.analysis_id);

            // Update chat metadata locally
            setChats(prev => prev.map(c => c.chatId === currentChatId ? { ...c, projectId: project.project_id, analysisId: analysis.analysis_id } : c));
          } else {
            toast.error("Failed to assign project");
          }
        } catch (err) {
          toast.error("Failed to assign project");
        }
      } else {
        // CASE: Current chat is BOUND or NO CHAT open. Create NEW chat.
        try {
          const projectString = `Project: ${project.project_name} | Analysis: ${analysis.title} - ${analysis.authority_type} [${analysis.analysis_id}] (${project.project_id})`;
          const res = await CREATE_CHAT_API({
            projectId: project.project_id,
            analysisId: analysis.analysis_id,
            title: `${project.project_name} - ${analysis.authority_type}`,
            initialMessage: { role: 'user', content: projectString }
          });

          if (res?.data?.success) {
            const newChat = res.data.payload.chat;
            setChats(prev => [newChat, ...prev]);
            handleSidebarChatClick(newChat.chatId);
            toast.success(`New chat started for ${project.project_name}`);
          }
        } catch (err) {
          toast.error("Failed to create new chat");
        }
      }
    }

    setShowAnalysisModal(false);
  };

  const handleSuggestedQuestion = (question) => {
    if (question === "More Projects...") {
      setShowProjectModal(true);
      return;
    }

    // Check if suggestion is a project: "Project Name (ID)"
    // The format from backend is `${p.project_name} (${p.project_id})`
    // We try to extract the last parenthesis group as ID
    const match = question.match(/^(.*) \((.*)\)$/);
    if (match) {
      const name = match[1];
      const id = match[2];
      // Trigger generic selection logic
      handleProjectSelect({ project_name: name, project_id: id });
      return;
    }

    setInput(question);
    chatInputRef.current?.focus();
  };

  // Handle projectId from URL (deep link)
  useEffect(() => {
    if (isChatsLoading) return;

    const queryParams = new URLSearchParams(location.search);
    const urlProjectId = queryParams.get('projectId');
    const urlAnalysisId = queryParams.get('analysisId');

    if (urlProjectId) {
      navigate(location.pathname, { replace: true });

      if (urlAnalysisId) {
        const message = `Project (${urlProjectId}) - Analysis [${urlAnalysisId}]`;

        setInput(message);
        setProjectId(urlProjectId);
        setAnalysisId(urlAnalysisId);
        localStorage.setItem("activeProjectId", urlProjectId);
        localStorage.setItem("activeAnalysisId", urlAnalysisId);

        const existingChat = chats.find(c => c.projectId === urlProjectId && c.analysisId === urlAnalysisId);
        if (existingChat && existingChat.chatId !== currentChatId) {
          handleSidebarChatClick(existingChat.chatId);
          toast.success("Switched to existing project chat.");
          setInput("");
        } else {
          handleSend(message, urlProjectId, urlAnalysisId);
        }
      } else {
        // If no analysis id passes, pop the modal
        setSelectedProjectForAnalysis({ project_id: urlProjectId, project_name: "Project " + urlProjectId });
        setShowAnalysisModal(true);
        setIsAnalysesLoading(true);
        GET_ANALYSES_BY_PROJECT_API(urlProjectId).then(res => {
          if (res?.data?.success) setProjectAnalyses(res.data.payload.analyses || []);
        }).finally(() => setIsAnalysesLoading(false));
      }
    }
  }, [location.search, isChatsLoading, chats]);

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
  };

  const handleSidebarChatClick = (chatId) => {
    setInput("");
    setExpandedReasoning(null);
    setIsTyping(false);

    // Update URL when switching chats
    navigate(`/assistant/${chatId}`, { state: { preservedChats: chats } });
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const toggleMenu = (e, chatId) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === chatId ? null : chatId);
  };

  const handleEditClick = (e, chat) => {
    e.stopPropagation();
    setEditingChatId(chat.chatId);
    setEditTitleInput(chat.title || "");
    setActiveMenuId(null);
  };

  const handleSaveTitle = async (chatId) => {
    if (!editTitleInput.trim() || editTitleInput === chats.find(c => c.chatId === chatId)?.title) {
      setEditingChatId(null);
      return;
    }

    // Optimistic update
    const oldTitle = chats.find(c => c.chatId === chatId)?.title;
    const oldUpdatedAt = chats.find(c => c.chatId === chatId)?.updatedAt;

    // 1. Update title immediately (no re-sort)
    setChats(prev => prev.map(c =>
      c.chatId === chatId ? { ...c, title: editTitleInput.trim() } : c
    ));

    try {
      await UPDATE_CHAT_TITLE_API(chatId, editTitleInput.trim());

      // 2. Delayed re-sort after 1200ms
      setTimeout(() => {
        setChats(prev => prev.map(c =>
          c.chatId === chatId ? { ...c, updatedAt: new Date().toISOString() } : c
        ));
      }, 1200);

    } catch (err) {
      console.error("Failed to update title:", err);
      toast.error("Failed to update title");
      // Revert
      setChats(prev => prev.map(c =>
        c.chatId === chatId ? { ...c, title: oldTitle, updatedAt: oldUpdatedAt } : c
      ));
    }
    setEditingChatId(null);
  };

  const handleEditKeyDown = (e, chatId) => {
    if (e.key === 'Enter') {
      handleSaveTitle(chatId);
    } else if (e.key === 'Escape') {
      setEditingChatId(null);
    }
  };

  const handleDeleteClick = (e, chat) => {
    e.stopPropagation();
    setDeletingChat(chat);
    setActiveMenuId(null);
  };

  const confirmDelete = async () => {
    if (!deletingChat) return;

    setIsDeleting(true);
    const chatId = deletingChat.chatId;
    deletedChatIdRef.current = chatId;

    try {
      // Optimistic remove
      setChats(prev => prev.filter(c => c.chatId !== chatId));

      // If deleted active chat, navigate away
      if (currentChatId === chatId) {
        handleNewChat();
      }

      await DELETE_CHAT_API(chatId);
      toast.success("Chat deleted");
    } catch (err) {
      console.error("Failed to delete chat:", err);
      toast.error("Failed to delete chat");
      // Could re-fetch chats here to revert, but simple toast is okay for now
    } finally {
      setIsDeleting(false);
      setDeletingChat(null);
    }
  };

  // Get messages to display
  // Virtual welcome message: Shows on /assistant (before chat is created)
  // Database welcome message: Shows in every chat (saved as first message)
  const msgs = currentChat?.messages || [];

  // Add virtual welcome message for new chats (not saved to database)
  // Only show if: no currentChatId AND not in chatNotFound state
  // Once user sends first message, database welcome message will replace this
  const displayMessages = (!currentChatId && !chatNotFound) ? [
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: "Hello! I'm your Aerotive UAE AI Assistant. I can help you understand approval requirements, explain regulations, and answer questions about your construction project. What would you like to know?",
      timestamp: new Date(),
      isVirtual: true, // Flag to indicate this is not from database
    },
    ...(pendingUserMessage ? [{
      id: 'temp-user',
      role: 'user',
      content: pendingUserMessage,
      timestamp: new Date(),
      isVirtual: true
    }] : [])
  ] : msgs;

  const emptyChat = displayMessages.length <= 1 && !chatNotFound && !isChatsLoading && !isMessagesLoading;

  const [showScrollButton, setShowScrollButton] = useState(false);

  const handleScroll = () => {
    if (messagesEndRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesEndRef.current;
      // Show button if user is more than 100px away from bottom
      const isScrollable = scrollHeight > clientHeight + 10;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(isScrollable && !isNearBottom);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollTo({
      top: messagesEndRef.current.scrollHeight,
      behavior: "smooth"
    });
  };

  useEffect(() => {
    if (messagesEndRef.current && !isMessagesLoading) {
      // Only auto-scroll if we are already near bottom or it's a new message
      // preventing auto-scroll if user is reading up history could be a future enhancement
      // For now, default behavior is auto-scroll on new message
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [displayMessages, isTyping, isMessagesLoading]);

  const chatsWithTitles = chats.filter(chat => chat.title).sort((a, b) => {
    const aTime = new Date(a.updatedAt || a.createdAt).getTime();
    const bTime = new Date(b.updatedAt || b.createdAt).getTime();
    return bTime - aTime;
  });

  return (
    <div className="max-w-7xl mx-auto p-0 sm:p-4 md:p-8 fixed top-[56px] bottom-0 left-0 right-0 sm:relative sm:top-auto sm:bottom-auto sm:left-auto sm:right-auto sm:h-full flex gap-4 overflow-hidden bg-white sm:bg-transparent z-10">
      {/* Add CSS for slide animations */}


      {/* ✅ MAIN CHAT AREA */}
      <div className={`bg-white rounded-none sm:rounded-3xl shadow-sm border-0 sm:border sm:border-slate-200 flex flex-col overflow-hidden h-full main-content flex-1 w-full min-w-0 relative ${isSidebarOpen ? 'md:with-sidebar' : 'md:without-sidebar'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 flex-shrink-0">
          <div>
            <h1 className="text-slate-900 mb-1 sm:mb-2 font-bold text-xl sm:text-2xl">AI Assistant</h1>
            <p className="text-slate-600 text-xs sm:text-base">
              Get instant answers about construction approvals and regulations
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden h-10 w-10 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center text-blue-600 shadow"
              title="Toggle chat history"
              aria-label="Toggle chat history"
            >
              {isSidebarOpen ? <PanelRightOpen className="w-5 h-5 rotate-180" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            {isSidebarOpen && (
              <button
                onClick={handleCloseSidebar}
                style={{
                  cursor: "col-resize"
                }}
                className="hidden md:flex h-10 w-10 bg-blue-100 hover:bg-blue-200 rounded-full items-center justify-center text-blue-600 shadow"
                title="Hide chat history"
                aria-label="Hide chat history"
              >
                <PanelRightOpen className="w-5 h-5 rotate-180" />
              </button>
            )}
          </div>
        </div>
        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-6 chatbox-scroll" ref={messagesEndRef} onScroll={handleScroll}>
          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center min-h-full">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 max-w-md text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-red-900 font-semibold mb-2">Something went wrong</h3>
                <p className="text-red-700 text-sm mb-4">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {(isChatsLoading || isMessagesLoading) && (
            <div className="h-full w-full flex flex-col justify-center">
              <MessageSkeleton />
            </div>
          )}

          {/* Empty State - No chats */}
          {/* {!isChatsLoading && !isMessagesLoading && !error && chats.length === 0 && (
            <div className="flex items-center justify-center min-h-full">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-slate-900 font-semibold text-lg mb-2">No chats yet</h3>
                <p className="text-slate-600 mb-6">
                  Start a new conversation to get instant answers about construction approvals and regulations.
                </p>
                <button
                  onClick={handleNewChat}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 cursor-pointer"
                >
                  <Plus className="w-5 h-5 inline-block mr-2" />
                  Start New Chat
                </button>
              </div>
            </div>
          )} */}

          {/* Chat Not Found State - Invalid chatId in URL */}
          {!isChatsLoading && !isMessagesLoading && !error && chatNotFound && (
            <div className="flex items-center justify-center min-h-full">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-slate-900 font-semibold text-lg mb-2">Chat not found</h3>
                <p className="text-slate-600 mb-6">
                  The selected chat doesn't exist. Please select another chat or start a new one.
                </p>
                <button
                  onClick={handleNewChat}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 cursor-pointer"
                >
                  <Plus className="w-5 h-5 inline-block mr-2" />
                  Start New Chat
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          {!isChatsLoading && !isMessagesLoading && !error && displayMessages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${message.role === "user"
                  ? "bg-gradient-to-br from-slate-600 to-slate-700"
                  : "bg-gradient-to-br from-blue-500 to-indigo-600"
                  }`}
              >
                {message.role === "user" ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Sparkles className="w-5 h-5 text-white" />
                )}
              </div>
              {/* Message Content */}
              <div className={`flex-1 min-w-0 max-w-3xl ${message.role === "user" ? "flex justify-end" : ""}`}>
                <div className={`rounded-2xl px-4 py-3 ${message.role === "user"
                  ? "bg-gradient-to-br from-slate-700 to-slate-800 text-white inline-block max-w-full"
                  : "bg-slate-50 border border-slate-200 inline-block max-w-full"
                  }`}>
                  <div className={`text-sm leading-relaxed ${message.role === "user" ? "text-white" : "text-slate-800"
                    } prose prose-sm max-w-none break-words ${message.role === "user"
                      ? "prose-invert prose-p:text-white prose-a:text-white prose-strong:text-white"
                      : "prose-slate prose-p:text-slate-700 prose-a:text-blue-600 prose-strong:text-slate-900"
                    }`}>
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => <p className="m-0" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                        li: ({ node, ...props }) => <li className="" {...props} />,
                        a: ({ node, ...props }) => <a className="underline font-medium hover:text-blue-500 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                        code: ({ node, inline, className, children, ...props }) => {
                          return inline ? (
                            <code className="bg-black/10 px-1 py-0.5 rounded font-mono text-xs" {...props}>{children}</code>
                          ) : (
                            <code className="block bg-black/5 p-2 rounded-lg font-mono text-xs overflow-x-auto my-2" {...props}>{children}</code>
                          );
                        }
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>

                  {/* Metadata: Suggestions & Links */}
                  {message.role === "assistant" && message.metadata && (
                    <div className="mt-4 space-y-4">

                      {/* Suggestions (Click to fill input) */}
                      {message.metadata.suggestions && message.metadata.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {message.metadata.suggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSuggestedQuestion(suggestion)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100 transition-colors border border-blue-200 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Links (Visit / Download) */}
                      {message.metadata.links && message.metadata.links.length > 0 && (
                        <div className="flex flex-col gap-2">
                          {message.metadata.links.map((link, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border border-slate-200 rounded-xl gap-3 shadow-sm">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center ${link.type === 'download' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                  {link.type === 'download' ? <Download className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-800 truncate">{link.label}</p>
                                  <p className="text-[10px] text-slate-400 truncate max-w-[200px] font-mono">{link.url}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(link.url);
                                    toast.success("Link copied!");
                                  }}
                                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                  title="Copy Link"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>

                                {link.type === 'download' ? (
                                  <a
                                    href={link.url}
                                    download
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 text-xs font-bold rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors cursor-pointer"
                                  >
                                    <Download className="w-3 h-3" />
                                    Download
                                  </a>
                                ) : (
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    Visit
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Reasoning (collapsible) */}
                  {message.role === "assistant" && message.reasoning && (
                    <div className="mt-4 border-t border-slate-200 pt-4">
                      <button
                        onClick={() => setExpandedReasoning(expandedReasoning === message.id ? null : message.id)}
                        className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>View AI Reasoning</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedReasoning === message.id ? "rotate-180" : ""}`} />
                      </button>
                      {expandedReasoning === message.id && (
                        <p className="text-xs text-slate-600 mt-3 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                          {message.reasoning}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Suggested Questions */}
        {emptyChat && (
          <div className="px-6 pb-4">
            <p className="text-xs text-slate-500 mb-3">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="text-xs px-3 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scroll to Bottom Button */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute left-1/2 transform -translate-x-1/2 bg-white text-blue-600 rounded-full p-2 shadow-lg border border-slate-200 hover:bg-slate-50 transition-all z-50 cursor-pointer flex items-center justify-center w-10 h-10"
            style={{ bottom: '120px' }}
            aria-label="Scroll to bottom"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        )}

        {/* Input */}
        <div className="border-t border-slate-200 p-3 pb-0 sm:p-4 bg-white z-20 sticky bottom-0 flex-shrink-0 mt-auto">
          <div className="flex gap-2 sm:gap-3">
            <input
              ref={chatInputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !isTyping && handleSend()}
              className="flex-1 px-4 py-3 bg-slate-50 border rounded-2xl text-sm"
              placeholder="Ask me anything..."
            />
            <Button onClick={handleSend} disabled={!input.trim() || isTyping}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] sm:text-xs text-slate-500 mt-1 sm:mt-2 mb-1 sm:mb-0 text-center">
            AI responses are based on UAE regulations current as of November 2025. Always verify with authorities.
          </p>
        </div>
      </div>

      {/* ✅ SIDEBAR - Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden absolute inset-0 z-[40] bg-slate-900/20 backdrop-blur-sm"
          onClick={handleCloseSidebar}
        />  
      )}

      {/* ✅ SIDEBAR - Transitions between full (240px) and mini (64px) on Desktop, full slide-in on Mobile */}
      <div
        className={`sidebar-container absolute md:relative right-0 top-0 h-full z-[50] md:z-auto transition-all duration-300 transform md:transform-none ${isSidebarOpen ? 'translate-x-0 w-[300px] md:w-[240px]' : 'translate-x-[300px] md:translate-x-0 w-[300px] md:w-[64px]'}`}
        style={{
          flexShrink: 0,
        }}
      >
        <div
          className={`bg-white rounded-none md:rounded-3xl shadow-2xl md:shadow-sm border-l md:border flex flex-col overflow-hidden w-full h-full`}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
          }}
        >
          {isSidebarOpen ? (
            // Full Sidebar Content
            <>
              <div className="p-4 border-b flex gap-2 items-center justify-between">
                <div className="flex gap-2 items-center">
                  <MessageSquare className="w-4 h-4" />
                  <h2 className="text-sm font-medium">Chat History</h2>
                </div>
                {/* New Chat Button */}
                <button
                  aria-label="Start new chat"
                  title="Start a new chat"
                  className="p-1 rounded-md bg-blue-100 hover:bg-blue-200 text-blue-600 text-xs font-bold cursor-pointer transition-colors"
                  onClick={() => {
                    setCurrentChatId(null);
                    setProjectId(null); // Clear project context
                    localStorage.removeItem("activeProjectId");
                    setInput("");
                    setExpandedReasoning(null);
                    setIsTyping(false);
                    navigate('/assistant');
                    chatInputRef.current?.focus();
                    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
                      setIsSidebarOpen(false);
                    }
                  }}
                >
                  + New
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 sidebar-scroll" ref={sidebarRef}>
                {(isChatsLoading && chats.length === 0) ? (
                  <ChatListSkeleton />
                ) : chatsWithTitles.length > 0 ? (
                  chatsWithTitles.map((chat) => (
                    <div
                      key={chat.chatId}
                      className={`group relative flex items-center w-full rounded-lg text-sm ${chat.chatId === currentChatId ? "bg-blue-100 text-blue-800 font-bold border border-blue-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"} cursor-pointer`}
                    >
                      {editingChatId === chat.chatId ? (
                        <div className="w-full px-2 py-2">
                          <input
                            ref={editInputRef}
                            value={editTitleInput}
                            onChange={(e) => setEditTitleInput(e.target.value)}
                            onBlur={() => handleSaveTitle(chat.chatId)}
                            onKeyDown={(e) => handleEditKeyDown(e, chat.chatId)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full bg-white border border-blue-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleSidebarChatClick(chat.chatId)}
                            className="flex-1 text-left px-3 py-2 overflow-hidden truncate cursor-pointer"
                            title={chat.title}
                          >
                            {chat.chatId === animatingChatId ? <TypewriterTitle text={chat.title} /> : chat.title}
                          </button>

                          {/* 3-Dot Menu Trigger */}
                          <div className={`chat-menu-container relative flex-shrink-0 flex items-center pr-2 ${activeMenuId === chat.chatId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-200`}>
                            <button
                              onClick={(e) => toggleMenu(e, chat.chatId)}
                              className={`p-1 mr-1 rounded-full hover:bg-slate-300 ${activeMenuId === chat.chatId ? 'bg-slate-300' : ''} cursor-pointer`}
                            >
                              <MoreVertical className="w-4 h-4 text-slate-500" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuId === chat.chatId && (
                              <div className="absolute right-0 top-1/2 mt-3 w-32 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  onClick={(e) => handleEditClick(e, chat)}
                                  className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  Edit
                                </button>
                                <button
                                  onClick={(e) => handleDeleteClick(e, chat)}
                                  className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 px-4">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-xs">No chats yet</p>
                    <p className="text-slate-400 text-xs mt-1">Click "+ New" to start</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Mini Sidebar Content
            <div className="flex flex-col items-center gap-3 py-3">
              <button
                onClick={handleNewChat}
                className="h-10 w-10 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center text-blue-600 shadow cursor-pointer"
                title="Start new chat"
                aria-label="Start new chat"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={handleOpenSidebar}
                className="hidden md:flex h-10 w-10 bg-blue-100 hover:bg-blue-200 rounded-full items-center justify-center text-blue-600 shadow"
                style={{
                  cursor: "col-resize"
                }}
                title="Show chat history"
                aria-label="Show chat history"
              >
                <PanelRightOpen className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deletingChat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setDeletingChat(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-96 p-6 transform transition-all scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Delete chat?</h3>
              <p className="text-sm text-slate-500 mb-2">This will delete <span className="font-semibold text-slate-700">"{deletingChat.title}"</span></p>
              <p className="text-xs text-slate-400 mb-6">You will not be able to recover this conversation.</p>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeletingChat(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium text-sm shadow-lg shadow-red-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#dc2626', color: 'white' }}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Selection Modal */}
      {/* Project Selection Modal */}
      {/* Project Selection Dropdown (Floating above input) */}
      {showProjectModal && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[1px] transition-all"
            onClick={() => setShowProjectModal(false)}
          />

          <div
            className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white border border-slate-200 shadow-2xl shadow-slate-200/50 ring-1 ring-slate-900/5 rounded-xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 duration-200 ease-out"
            style={{ maxHeight: '350px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Search */}
            <div className="p-2.5 border-b border-slate-100 flex gap-2 items-center bg-white">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <input
                className="flex-1 bg-transparent text-xs font-medium outline-none placeholder:text-slate-400 text-slate-700"
                placeholder="Search projects..."
                value={projectSearchQuery}
                onChange={(e) => setProjectSearchQuery(e.target.value)}
                autoFocus
              />
              <button
                onClick={() => setShowProjectModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto p-1.5 space-y-1 chatbox-scroll bg-slate-50/50" style={{ maxHeight: '280px' }}>
              {isProjectsLoading ? (
                <div className="flex flex-col justify-center items-center py-8 gap-2 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="text-[10px]">Loading...</span>
                </div>
              ) : filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <button
                    key={project.project_id}
                    onClick={() => handleProjectSelect(project)}
                    className="cursor-pointer w-full text-left px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm hover:border-blue-100 border border-transparent transition-all flex justify-between items-center group relative overflow-hidden"
                  >
                    <div className="min-w-0 flex-1 pr-2 z-10">
                      <p
                        className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition-colors truncate"
                        title={project.project_name}
                      >
                        {project.project_name}
                      </p>
                      <p className="text-[9px] font-mono text-slate-400 mt-0.5 group-hover:text-blue-400 truncate">
                        {project.project_id}
                      </p>
                    </div>
                    <div className="flex flex-col items-end z-10">
                      <span className="text-[9px] font-medium text-slate-400 group-hover:text-blue-400 transition-colors whitespace-nowrap">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {/* Hover Effect Background */}
                    <div className="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50/50 transition-colors duration-200 pointer-events-none" />
                  </button>
                ))
              ) : (
                <div className="text-center py-8 px-4 text-slate-400">
                  <p className="text-xs font-medium">No projects found</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Analysis Selection Modal */}
      {showAnalysisModal && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[1px] transition-all"
            onClick={() => setShowAnalysisModal(false)}
          />

          <div
            className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white border border-slate-200 shadow-2xl shadow-slate-200/50 ring-1 ring-slate-900/5 rounded-xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 duration-200 ease-out"
            style={{ maxHeight: '350px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-2.5 border-b border-slate-100 flex flex-col gap-2 bg-white">
              <div className="flex justify-between items-center w-full">
                <span className="text-xs font-semibold text-slate-700 truncate pr-2">Select Analysis for {selectedProjectForAnalysis?.project_name}</span>
                <button
                  onClick={() => setShowAnalysisModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400 ml-1" />
                <input
                  className="flex-1 bg-transparent text-xs font-medium outline-none placeholder:text-slate-400 text-slate-700 pb-1"
                  placeholder="Search analyses..."
                  value={analysisSearchQuery}
                  onChange={(e) => setAnalysisSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto p-1.5 space-y-1 chatbox-scroll bg-slate-50/50" style={{ maxHeight: '280px' }}>
              {isAnalysesLoading ? (
                <div className="flex flex-col justify-center items-center py-8 gap-2 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="text-[10px]">Loading Analyses...</span>
                </div>
              ) : filteredAnalyses.length > 0 ? (
                filteredAnalyses.map((analysis) => {
                  const isPending = analysis.status !== "completed";
                  return (
                    <button
                      key={analysis.analysis_id}
                      onClick={() => !isPending && handleAnalysisSelect(analysis)}
                      disabled={isPending}
                      className={`w-full text-left px-3 py-2 rounded-lg border border-transparent transition-all flex justify-between items-center relative overflow-hidden ${
                        isPending 
                          ? 'opacity-60 cursor-not-allowed bg-slate-50' 
                          : 'cursor-pointer hover:bg-white hover:shadow-sm hover:border-blue-100 group'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2 z-10">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-xs font-semibold truncate ${
                              isPending 
                                ? 'text-slate-500' 
                                : 'text-slate-700 group-hover:text-blue-600 transition-colors'
                            }`}
                            title={analysis.title}
                          >
                            {analysis.title}
                          </p>
                          {isPending && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase tracking-wider whitespace-nowrap">
                              Pending
                            </span>
                          )}
                        </div>
                        <p className={`text-[9px] font-mono mt-0.5 truncate ${
                          isPending ? 'text-slate-400' : 'text-slate-400 group-hover:text-blue-400'
                        }`}>
                          {analysis.authority_type} • {analysis.analysis_id}
                        </p>
                      </div>
                      <div className="flex flex-col items-end z-10">
                        <span className={`text-[9px] font-medium whitespace-nowrap transition-colors ${
                          isPending ? 'text-slate-400' : 'text-slate-400 group-hover:text-blue-400'
                        }`}>
                          {new Date(analysis.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {/* Hover Effect Background */}
                      {!isPending && (
                        <div className="absolute inset-0 bg-blue-50/0 group-hover:bg-blue-50/50 transition-colors duration-200 pointer-events-none" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8 px-4 text-slate-400">
                  <p className="text-xs font-medium">No analyses found</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}