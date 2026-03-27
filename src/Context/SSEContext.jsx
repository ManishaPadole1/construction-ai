import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SSEContext = createContext(null);

export const useSSE = () => useContext(SSEContext);

export const SSEProvider = ({ children }) => {
    const [activeJobs, setActiveJobs] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        // Native EventSource does not support custom headers (like API key). 
        // We will pass the API_KEY in the URL query string instead if your backend supports auth via query parameter.
        // Or better yet, we can use the popular 'event-source-polyfill' if you need headers, or pass it as a query param.
        const API_KEY_NAME = import.meta.env.VITE_API_KEY || 'X-API-SECRET';
        const API_KEY_VALUE = import.meta.env.VITE_API_VALUE || 'ABCD1234';

        const source = new EventSource(`${import.meta.env.VITE_API_URL}/api/v1/user/analyses/stream?${API_KEY_NAME}=${API_KEY_VALUE}`, {
            withCredentials: true
        });

        source.addEventListener('progress', (e) => {
            const data = JSON.parse(e.data);
            setActiveJobs(prev => ({
                ...prev,
                [data.analysis_id]: { progress: data.progress }
            }));
        });

        source.addEventListener('completed', (e) => {
            const data = JSON.parse(e.data);
            setActiveJobs(prev => {
                const newJobs = { ...prev };
                delete newJobs[data.analysis_id];
                return newJobs;
            });

            // Fire an event so that the local history table can update its records instantly
            window.dispatchEvent(new CustomEvent('ANALYSIS_COMPLETED', { detail: data.analysis_id }));

            // Redirect to report toast function
            toast.custom((t) => (
                <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                    <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                            <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                    Analysis Complete!
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    {data.title || data.analysis_id} has been fully processed.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex border-l border-gray-200">
                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                                // Redirect to exact user view link
                                if (data.project_id && data.authority && data.upload_mode) {
                                    navigate(`/project/${data.project_id}?authority=${data.authority}&mode=${data.upload_mode}&step=2&view=edit&analysis_id=${data.analysis_id}`);
                                } else {
                                    // Fallback 
                                    navigate(`/admin/active/analyses?analysis_id=${data.analysis_id}&view=edit&step=2`);
                                }
                            }}
                            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 gap-2 cursor-pointer"
                        >
                            <ExternalLink size={16} /> View
                        </button>
                    </div>
                </div>
            ), { duration: 6000 });
        });

        source.addEventListener('failed', (e) => {
            const data = JSON.parse(e.data);
            setActiveJobs(prev => {
                const newJobs = { ...prev };
                delete newJobs[data.analysis_id];
                return newJobs;
            });
            toast.error(`Analysis failed: ${data.analysis_id}`);
        });

        source.onerror = (err) => {
            // Keep silent reconnects, eventSource auto-reconnects
        };

        return () => {
            source.close();
        };
    }, []);

    return (
        <SSEContext.Provider value={{ activeJobs }}>
            {children}
        </SSEContext.Provider>
    );
};
