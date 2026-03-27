import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Sparkles,
  LogOut,
} from "lucide-react";
import { useSelector } from "react-redux";
import { navItemsAdmin, navItemsEmployee } from "./NavItems";
import { getInitials, limitText } from "../utils/textHelpers";



export function MobileNav({ onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { isAdmin, user } = useSelector((state) => state.auth);
  const [navItems, setNavItems] = useState([])

  useEffect(() => {
    if (isAdmin) {
      setNavItems(navItemsAdmin)
    } else {
      setNavItems(navItemsEmployee)
    }


  }, [isAdmin])

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-[60] bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm tracking-tight">Aerotive UAE</h1>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-lg hover:bg-slate-800 flex items-center justify-center transition-colors"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-[50] backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="lg:hidden fixed top-[57px] left-0 right-0 bottom-0 bg-slate-900 z-[55] overflow-y-auto">
            <nav className="p-4 space-y-1">
              {navItems
                .filter((item) => !item.hidden)
                .map((item) => {
                  const Icon = item.icon;
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

                  return (
                    <Link
                      key={item.path}
                      to={linkPath}
                      onClick={() => setIsOpen(false)}
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

            <div className="p-4 border-t border-slate-800 mt-4 space-y-3">
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
                  <span className="text-sm text-white">{getInitials(user?.full_name)}</span>
                </div>
                <div className="flex-1 text-capitalize">
                  <p className="text-sm text-white">{limitText(user?.full_name)}</p>
                  <p className="text-xs text-slate-400">{user?.role}</p>
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200 text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
