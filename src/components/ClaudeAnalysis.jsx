import React, { useState, useRef, useMemo } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

// Helper to format keys
const formatKey = (key) => {
    if (!key) return "";
    return key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim();
};

// Helper: Recursively clean data to remove empty objects/arrays/nulls
// This prevents "Ghost Cards" and large empty spaces in the UI
const cleanData = (data) => {
    if (data === null || data === undefined) return null;
    if (typeof data !== 'object') return data;

    if (Array.isArray(data)) {
        const cleanedArr = data.map(cleanData).filter(item => item !== null);
        return cleanedArr.length > 0 ? cleanedArr : null;
    }

    const cleanedObj = {};
    let hasKeys = false;
    for (const [key, value] of Object.entries(data)) {
        // Skip metadata keys if needed, but primary goal is removing empty structures
        if (value === null || value === undefined) continue;

        const cleanedValue = cleanData(value);
        if (cleanedValue !== null) {
            cleanedObj[key] = cleanedValue;
            hasKeys = true;
        }
    }
    return hasKeys ? cleanedObj : null;
};

// Recursive Component
const RecursiveRenderer = ({ data, depth = 0 }) => {
    if (data === null || data === undefined) return null;

    // 1. Array Handling
    if (Array.isArray(data)) {
        if (data.length === 0) return null;

        const isArrayOfObjects = data.some(item => typeof item === 'object' && item !== null);

        if (isArrayOfObjects) {
            return (
                <div className="space-y-4 w-full">
                    {data.map((item, index) => (
                        <div key={index} className={`border-l-2 border-white/10 pl-4 py-2 w-full ${depth > 0 ? 'mt-2' : ''}`}>
                            <RecursiveRenderer data={item} depth={depth + 1} />
                        </div>
                    ))}
                </div>
            );
        } else {
            return (
                <ul className="list-disc ml-5 space-y-1 text-white/90 w-full">
                    {data.map((item, index) => (
                        <li key={index} className="text-sm leading-relaxed break-words break-all whitespace-pre-line">
                            {String(item)}
                        </li>
                    ))}
                </ul>
            );
        }
    }

    // 2. Object Handling
    if (typeof data === 'object') {
        const entries = Object.entries(data);
        if (entries.length === 0) return null;

        // Depth 0: Vertical Stack
        // Depth 1: Grid (Side by Side)
        const isGrid = depth >= 1;

        return (
            <div className={isGrid ? "grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 w-full" : "space-y-8 w-full"}>
                {entries.map(([key, value]) => {
                    // Filter again just in case (though cleanData handles most)
                    if (value === null) return null;

                    // Main Headers (Depth 0)
                    if (depth === 0) {
                        return (
                            <div key={key} className="w-full">
                                <div className="text-xl font-bold text-blue-100 border-b border-white/10 pb-2 mb-4 mt-2 flex items-center gap-2 break-words">
                                    <span className="w-1.5 h-6 bg-blue-500 rounded-full inline-block shrink-0"></span>
                                    {formatKey(key)}
                                </div>
                                <div className="pl-2 w-full">
                                    <RecursiveRenderer data={value} depth={depth + 1} />
                                </div>
                            </div>
                        );
                    }

                    // Sub-section Cards (Depth 1+)
                    // Force full width for description-heavy fields
                    const isFullWidth = key.includes('step_by') || key.includes('narrative') || key.includes('detailed_room') || String(value).length > 200;

                    return (
                        <div
                            key={key}
                            className={`${isFullWidth ? 'md:col-span-2' : ''} p-4 rounded-xl transition-colors h-full flex flex-col w-full`}
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}
                        >
                            <div className="text-sm font-bold text-white/90 mb-3 uppercase tracking-wider opacity-80 flex items-center gap-2 break-words">
                                {formatKey(key)}
                            </div>
                            <div className="text-white/80 flex-1 w-full min-w-0">
                                <RecursiveRenderer data={value} depth={depth + 1} />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // 3. Primitives
    return (
        <p className="text-sm text-white/80 leading-relaxed break-words break-all whitespace-pre-line min-w-0 w-full">
            {String(data)}
        </p>
    );
};

export function ClaudeAnalysis({ claudeData, isCollapsible = true }) {
    const [isOpen, setIsOpen] = useState(false);
    const contentRef = useRef(null);

    // Clean data before rendering to avoid empty spaces
    const cleanedData = useMemo(() => cleanData(claudeData), [claudeData]);

    if (!cleanedData || Object.keys(cleanedData).length === 0) {
        return (
            <div className="bg-slate-800 rounded-lg p-6 text-white text-center">
                <p>No detailed analysis data available</p>
            </div>
        );
    }

    const handleOpenChange = (open) => {
        if (!open && contentRef.current) {
            contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => setIsOpen(false), 600);
        } else {
            setIsOpen(open);
        }
    };

    return (
        <div
            ref={contentRef}
            className="bg-slate-900 rounded-xl p-6 md:p-8 text-white space-y-6 shadow-2xl border border-white/5 font-sans w-full max-w-full overflow-hidden"
        >
            {/* Main Header */}
            <div className="border-b border-slate-700 pb-4 flex items-center gap-3">
                <span className="text-3xl">📋</span>
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight break-words">Detailed Analysis Report</h2>
                    <p className="text-slate-400 text-sm">Comprehensive AI-generated compliance breakdown</p>
                </div>
            </div>

            {/* Content Area */}
            <div className="w-full">
                {isCollapsible ? (
                    <Collapsible open={isOpen} onOpenChange={handleOpenChange} className="w-full">
                        {!isOpen && (
                            <div className="text-center py-8">
                                <p className="text-white/60 mb-4">Click below to view the full detailed hierarchical report</p>
                            </div>
                        )}

                        <CollapsibleContent className="space-y-6 collapsible-content w-full">
                            <RecursiveRenderer data={cleanedData} />
                        </CollapsibleContent>

                        <div className="flex justify-center pt-6 border-t border-white/10 mt-6">
                            <CollapsibleTrigger asChild>
                                <Button
                                    className="bg-blue-600 hover:bg-blue-500 text-white min-w-[240px] gap-2 rounded-full shadow-lg transition-all duration-300 hover:scale-105 font-medium"
                                >
                                    {isOpen ? (
                                        <>
                                            Collapse Report <ChevronUp className="w-4 h-4" />
                                        </>
                                    ) : (
                                        <>
                                            View Full Analysis Report <ChevronDown className="w-4 h-4" />
                                        </>
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                        </div>
                    </Collapsible>
                ) : (
                    <div className="space-y-6 pt-2 w-full">
                        <RecursiveRenderer data={cleanedData} />
                    </div>
                )}
            </div>
        </div>
    );
}
