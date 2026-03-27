import React from 'react';
import { LogOut, X } from 'lucide-react';

export const LogoutModal = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    title = 'Sign Out?',
    message = 'Are you sure you want to end your current session?',
    confirmText = 'Sign Out',
    hideButtons = false
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-200"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)' }}
            onClick={!isLoading && !hideButtons ? onClose : undefined}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-96 p-6 transform transition-all scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LogOut className="w-6 h-6 text-red-600" />
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-1">
                        {isLoading ? (confirmText === 'Sign In' ? 'Signing Out...' : 'Signing Out...') : title}
                    </h3>

                    <p className="text-sm text-slate-500 mb-6 px-2">
                        {isLoading
                            ? 'Please wait while we securely end your session.'
                            : message
                        }
                    </p>

                    {!hideButtons && (
                        <div className="flex gap-3 justify-center">
                            {!isLoading && (
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium text-sm cursor-pointer"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium text-sm shadow-lg shadow-red-200 cursor-pointer flex items-center justify-center gap-2"
                                style={{
                                    backgroundColor: '#dc2626',
                                    color: 'white',
                                    opacity: isLoading ? 0.7 : 1,
                                    cursor: isLoading ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    confirmText
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
