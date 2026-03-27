import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  Brain,
  Building2,
  CheckSquare,
  FileText,
  MessageSquare,
  Sparkles,
  LogOut,
  Users,
} from "lucide-react";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { navItemsAdmin, navItemsEmployee } from "./NavItems";
import { getInitials, limitText } from "../utils/textHelpers";


export function Sidebar({ onLogout }) {
  const { isAdmin, user } = useSelector((state) => state.auth);
  const [navItems, setNavItems] = useState([])

  useEffect(() => {
    if (isAdmin) {
      setNavItems(navItemsAdmin)
    } else {
      setNavItems(navItemsEmployee)
    }


  }, [isAdmin])



  const location = useLocation();

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl h-screen sticky top-0">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg tracking-tight">Aerotive UAE</h1>
            <p className="text-xs text-slate-400">UAE Construction AI</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => !item.hidden)
          .map((item) => {
            const Icon = item.icon;
            // Special handling: /projects should be active for both /projects and /project/:id
            // Active State Logic
            // Active State Logic
            let isActive = false;

            // Check if we are in an impersonation route
            const match = location.pathname.match(/^\/admin\/([^/]+)/);
            const isImpersonating = match && !['dashboard', 'employees', 'users', 'settings'].includes(match[1]);

            if (item.path === '/projects') {
              // Normal user flow
              isActive = location.pathname.startsWith('/projects') || location.pathname.startsWith('/project/');
            } else if (item.path === '/admin/employees') {
              // Admin Employees Tab
              // Active if:
              // 1. On /admin/employees
              // 2. Impersonating (e.g. /admin/EMP123/projects...)
              if (location.pathname.startsWith(item.path)) {
                isActive = true;
              } else if (isImpersonating) {
                isActive = true;
              }
            } else if (item.path === '/admin/dashboard') {
              // Admin Dashboard Tab
              isActive = location.pathname === '/admin/dashboard' || location.pathname === '/dashboard';
            } else if (item.path === '/') {
              isActive = location.pathname === '/';
            } else {
              // Default
              isActive = location.pathname.startsWith(item.path);
            }

            // Construct Link Path
            let linkPath = item.path;

            // If we are impersonating, we should try to keep the prefix for "User" routes (if they existed in the admin nav)
            // But currently Admin Nav only has Dashboard and Employees.
            // If Admin clicks "Employees" while impersonating, they probably want to go back to the list (exit impersonation context for sidebar navigation?)
            // Or if we had "Projects" in the sidebar for Admin, we would prefix it. 
            // Since Admin sidebar is fixed, we leave the links as is (going to /admin/employees takes you back to list).

            return (
              <Link
                key={item.path}
                to={linkPath}
                className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${isActive
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }
              `}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-3">
        <div
          className="flex items-center gap-3 px-4 py-3 group relative cursor-help"
          title={user?.full_name}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
            <span className="text-sm">{getInitials(user?.full_name)}</span>
          </div>
          <div className="flex-1 text-capitalize overflow-hidden">
            <p className="text-sm text-white truncate">{limitText(user?.full_name)}</p>
            <p className="text-xs text-slate-400">{user?.role}</p>
          </div>
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200 text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  );
}
