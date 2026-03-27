import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, LogOut, ShieldAlert } from 'lucide-react';
import { GET_EMPLOYEE_API } from '../Services/admin';

export const ImpersonationBanner = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [impersonatedUser, setImpersonatedUser] = useState(location.state?.impersonatedUser || null);
    const [loading, setLoading] = useState(false);

    // Extract ID from URL
    const match = location.pathname.match(/^\/admin\/([^/]+)/);
    const urlImpersonateId = match && !['dashboard', 'employees', 'users', 'settings'].includes(match[1]) ? match[1] : null;

    useEffect(() => {

        if (location.state?.impersonatedUser) {
            setImpersonatedUser(location.state.impersonatedUser);
            return;
        }

        const fetchUser = async () => {
            if (urlImpersonateId) {
                try {
                    setLoading(true);
                    const res = await GET_EMPLOYEE_API(urlImpersonateId);

                    if (res?.data?.success) {
                        // The get-employee API usually returns detailed object, check payload structure
                        setImpersonatedUser(res.data.payload?.employee || res.data.payload);
                    } else {
                        console.error("Failed to fetch employee profile:", res);
                    }
                } catch (error) {
                    console.error("Error fetching impersonated employee:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setImpersonatedUser(null);
            }
        };

        fetchUser();

    }, [urlImpersonateId, location.state]);

    if (!urlImpersonateId) return null;

    return (
        <div id="impersonation-banner" className="bg-amber-100 border-b border-amber-200 px-3 py-3 sm:px-4 relative z-40 shadow-sm mt-14 -mb-14 lg:mt-0 lg:mb-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between max-w-7xl mx-auto gap-3 sm:gap-4">
                <div className="flex items-start sm:items-center gap-3 text-amber-900 w-full sm:w-auto min-w-0">
                    <div className="p-2 bg-amber-200 rounded-full animate-pulse shrink-0" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <p className="text-[13px] sm:text-sm font-bold truncate">
                                Admin Impersonation Mode
                            </p>
                            <span className="shrink-0" style={{
                                backgroundColor: '#16a34a', // Green-600
                                color: 'white',
                                fontSize: '9px',
                                padding: '1px 6px',
                                borderRadius: '999px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                fontWeight: 'bold',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}>
                                Active
                            </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-amber-800 opacity-90 mt-0.5 flex flex-wrap items-center gap-1">
                            <span>Viewing on behalf of:</span>
                            <span className="font-bold" style={{ fontWeight: '800', color: '#78350f' }}>
                                {impersonatedUser?.full_name || 'User'}
                            </span>
                            <span className="opacity-75 text-[10px] break-all">
                                (ID: {urlImpersonateId})
                            </span>
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => {
                        sessionStorage.removeItem('impersonate_employee_id');
                        navigate('/admin/employees');
                    }}
                    className="flex shrink-0 items-center justify-center gap-2 px-3 py-2 sm:px-4 bg-white text-amber-900 rounded-lg hover:bg-amber-50 hover:shadow shadow-sm transition-all text-xs sm:text-sm font-semibold border border-amber-200 w-full sm:w-auto"
                    style={{ cursor: 'pointer' }}
                >
                    <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Exit View
                </button>
            </div>
        </div>
    );
};
