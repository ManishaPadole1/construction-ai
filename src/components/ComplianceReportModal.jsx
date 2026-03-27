import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles } from 'lucide-react';
// import ProjectComplianceReport from './json/project_compliance_report.jsx';

export function ComplianceReportModal({ isOpen, onClose, data }) {
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isClosing, setIsClosing] = useState(false);

    // Sync visibility with state but handle animation for closing
    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setIsClosing(false);
        } else {
            setIsClosing(true);
            const timer = setTimeout(() => {
                setShouldRender(false);
                setIsClosing(false);
            }, 200); // match animate-modal-zoom-out duration
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Disable background scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.classList.add('no-scroll');
            document.body.style.paddingRight = `${scrollBarWidth}px`;
        } else {
            document.body.classList.remove('no-scroll');
            document.body.style.paddingRight = '';
        }
        return () => {
            document.body.classList.remove('no-scroll');
            document.body.style.paddingRight = '';
        };
    }, [isOpen]);


    if (!shouldRender) return null;

    return createPortal(
        <div
            className={`fixed inset-0 z-[99999] flex items-center justify-center p-0 md:p-4 ${isClosing ? 'animate-modal-fade-out' : 'animate-modal-fade'}`}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className={`bg-white md:rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-full md:h-auto md:max-h-[90vh] ${isClosing ? 'animate-modal-zoom-out' : 'animate-modal-zoom'}`}>
                {/* Header - Stays fixed at top */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div>
                        <h2 className="text-slate-900 mb-2 font-bold text-2xl flex items-center gap-2">
                            <Sparkles className="w-6 h-6 text-blue-600" />
                            Compliance Report
                        </h2>
                        <p className="text-slate-600">
                            Detailed analysis and compliance check report
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600 cursor-pointer active:scale-95"
                    >
                        <X className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                </div>

                {/* Form Body - Scrollable Area */}
                {/* <div className="p-0 overflow-y-auto custom-scrollbar space-y-6 flex-1 bg-slate-50/50" style={{ touchAction: 'pan-y' }}>
                    <div className="p-6">
                        <ProjectComplianceReport data={data} />
                    </div>
                </div> */}
            </div>
        </div>,
        document.getElementById('modal-root') || document.body
    );
}
