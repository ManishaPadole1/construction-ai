import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { SSEProvider } from './Context/SSEContext.jsx';
import { Sidebar } from './components/Sidebar';
// ... imports

// ... imports
import { MobileNav } from './components/MobileNav';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { UploadDrawings } from './components/UploadDrawings';
import { AIAnalysisContent } from './components/AIAnalysis';
import { AuthorityBreakdown } from './components/AuthorityBreakdown';
import { DocumentChecklist } from './components/DocumentChecklist';
import { FeasibilityReport } from './components/FeasibilityReport';
import { AIAssistant } from './components/AIAssistant';
import { Employees } from './components/Employees';
import { handleLogout, finalLogout } from './Services/extras/handleLogout';
import { LOGOUT_API } from './Services/Auth';
import { FORCE_LOGOUT_REDUX, HARD_REFRESH_REDUX, LOGOUT_REDUX } from './store/authSlice';
import { AdminDashboard } from './components/AdminDashboard';
import { useEffect, useState } from 'react';
import { updateMyDetailsInRedux } from './Services/extras/UpdateMyDetailsInRedux';
import { Projects } from './components/Projects';
import { QuickCheck } from './components/QuickCheck';
import { ProjectModalProvider } from './Context/ProjectModalContext';
import ProjectModal from './components/ProjectModal';
import { ImpersonationBanner } from './components/ImpersonationBanner';
import { LogoutModal } from './components/LogoutModal';

export default function App() {
  const FORCE_LOGOUT_VALUE = import.meta.env.VITE_FORCE_LOGOUT_VALUE;
  const HARD_REFRESH_VALUE = import.meta.env.VITE_HARD_REFRESH_VALUE;

  const { forceLogout, hardRefresh, employee_id, isAuthenticated, role, isAdmin } = useSelector(
    (state) => state.auth
  );

  const dispatch = useDispatch();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [modalContent, setModalContent] = useState({
    title: 'Sign Out?',
    message: 'Are you sure you want to end your current session?',
    confirmText: 'Sign Out',
    hideButtons: false
  });

  useEffect(() => {
    // Listen for session expiry event from ApiManager
    const handleSessionExpiryEvent = () => {
      // Store current full path (including query params) and user ID before logout to enable redirect back after login
      sessionStorage.setItem('redirectPath', window.location.pathname + window.location.search);
      sessionStorage.setItem('expiredUserId', employee_id);

      setModalContent({
        title: 'Session Expired',
        message: 'Your session has expired. Redirecting to login...',
        confirmText: '',
        hideButtons: true
      });
      setShowLogoutModal(true);

      // Automatically logout after 2 seconds
      setTimeout(() => {
        handleConfirmLogout();
      }, 2000);
    };

    window.addEventListener('session-expired', handleSessionExpiryEvent);
    return () => window.removeEventListener('session-expired', handleSessionExpiryEvent);
  }, [employee_id]); // Added employee_id to dependency array to ensure we capture the correct ID

  useEffect(() => {
    const checkForceLogoutAndHardRefresh = async () => {
      if (forceLogout !== FORCE_LOGOUT_VALUE) {
        try {
          await LOGOUT_API(employee_id);
        } catch (error) {
          console.log("error", error);
        }
        dispatch(LOGOUT_REDUX());
        dispatch(FORCE_LOGOUT_REDUX(FORCE_LOGOUT_VALUE));
      }
      if (hardRefresh !== HARD_REFRESH_VALUE) {
        dispatch(HARD_REFRESH_REDUX(HARD_REFRESH_VALUE));
        window.location.reload(true);
      }
    };
    checkForceLogoutAndHardRefresh();
  }, [forceLogout, hardRefresh]);



  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          {/* Navigate to Login but keep track of where the user was trying to go (including query params) */}
          <Route path="*" element={<Navigate to="/" state={{ from: window.location.pathname + window.location.search }} replace />} />
        </Routes>
      </Router>
    );
  }

  // -----------------------
  // Dynamic Routes Arrays
  // -----------------------
  // -----------------------
  // Dynamic Routes Arrays
  // -----------------------
  const userRoutes = [
    { path: "/dashboard", element: <Dashboard /> },
    { path: "/projects", element: <Projects /> },
    { path: "/project/:project_id", element: <UploadDrawings /> },
    { path: "/quick-check", element: <QuickCheck /> },
    { path: "/assistant/:chatId?", element: <AIAssistant /> },
    // { path: "/analysis", element: <AIAnalysisContent /> },
    // { path: "/authorities", element: <AuthorityBreakdown /> },
    // { path: "/checklist", element: <DocumentChecklist /> },
    // { path: "/report", element: <FeasibilityReport /> },
  ];

  const adminRoutes = [
    { path: "/admin/dashboard", element: <AdminDashboard /> },
    { path: "/admin/employees", element: <Employees /> },
    // { path: "/admin/users", element: <div>Manage Users</div> },
    // { path: "/admin/settings", element: <div>Admin Settings</div> },
  ];

  // Wrapper to capture and store impersonation ID synchronously
  const ImpersonationWrapper = ({ children }) => {
    const { impersonateId } = useParams();

    if (impersonateId && !['dashboard', 'employees', 'users', 'settings'].includes(impersonateId)) {
      sessionStorage.setItem('impersonate_employee_id', impersonateId);
    }

    return children;
  };

  const impersonatedRoutes = userRoutes.map(r => ({
    ...r,
    path: `/admin/:impersonateId${r.path === '/' ? '' : r.path}`,
    element: <ImpersonationWrapper>{r.element}</ImpersonationWrapper>
  }));

  const finalRoutes = isAdmin || role === "admin"
    ? [...adminRoutes, ...impersonatedRoutes]
    : userRoutes;



  // ... (rest of the component)

  // Custom Logout Handlers
  const requestLogout = () => {
    setModalContent({
      title: 'Sign Out?',
      message: 'Are you sure you want to end your current session?',
      confirmText: 'Sign Out'
    });
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    // Simulate a small delay for the spinner (1s) usually improves UX so user sees something happening
    await new Promise(resolve => setTimeout(resolve, 800));

    await finalLogout();
    setIsLoggingOut(false);
    setShowLogoutModal(false);
  };

  return (
    <ProjectModalProvider>
      <Router>
        <SSEProvider>
          <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="hidden lg:block">
            <Sidebar onLogout={requestLogout} />
          </div>

          <MobileNav onLogout={requestLogout} />

          <div className="flex-1 flex flex-col overflow-hidden relative">
            <ImpersonationBanner />
            <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
              <Routes>
                {finalRoutes.map((r, index) => (
                  <Route key={index} path={r.path} element={r.element} />
                ))}

                <Route path="*" element={<Navigate to={isAdmin ? "/admin/dashboard" : "/dashboard"} replace />} />
              </Routes>
            </main>
          </div>
        </div>

        {/* Render the Custom Logout Modal */}
        <LogoutModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={handleConfirmLogout}
          isLoading={isLoggingOut}
          title={modalContent.title}
          message={modalContent.message}
          confirmText={modalContent.confirmText}
          hideButtons={modalContent.hideButtons}
        />
        </SSEProvider>
      </Router>
      <ProjectModal />
    </ProjectModalProvider>
  );
}
