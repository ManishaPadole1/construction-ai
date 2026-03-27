import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Building2 } from 'lucide-react';
import { Select as MuiSelect, MenuItem, FormControl } from '@mui/material';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { toast } from "react-hot-toast";
import { useProjectModal } from '../Context/ProjectModalContext';
import { CREATE_PROJECT_ONLY_API, UPDATE_PROJECT_ONLY_API } from '../Services/user';

const usageTypes = [
    { id: 1, label: 'Residential', value: 'residential' },
    { id: 2, label: 'Commercial', value: 'commercial' },
    { id: 3, label: 'Mixed-Use', value: 'mixed_use' },
    { id: 4, label: 'Industrial', value: 'industrial' },
    { id: 5, label: 'Healthcare', value: 'healthcare' }
];

const masterDevelopers = [
    { id: 1, label: 'Emaar', value: 'Emaar' },
    { id: 2, label: 'Nakheel', value: 'Nakheel' }
];

const projectTypes = [
    { id: 1, label: 'Renovation', value: 'RENOVATION' },
    { id: 2, label: 'New Building', value: 'NEW_BUILDING' }
];

const initialFormData = {
    project_name: "",
    project_type: "RENOVATION",
    client_developer: "",
    location: "",
    plot_number: "",
    built_up_area: "",
    number_of_floors: "",
    building_usage_type: "",
    include_ground_floor: true,
    include_mezzanine: false,
    include_basement: false,
    number_of_basements: 0,
};

export default function ProjectModal() {
    const { isOpen, projectData, closeProjectModal, onSuccess } = useProjectModal();
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(false);
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isClosing, setIsClosing] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    // Sync visibility with context state but handle animation for closing
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

    useEffect(() => {
        if (projectData) {
            setFormData({
                project_name: projectData.project_name || "",
                project_type: projectData.project_type || "RENOVATION",
                client_developer: projectData.client_developer || "",
                location: projectData.location || "",
                plot_number: projectData.plot_number || "",
                built_up_area: projectData.built_up_area || "",
                number_of_floors: projectData.number_of_floors || "",
                building_usage_type: projectData.building_usage_type || "",
                include_ground_floor: !!(projectData.include_ground_floor ?? true),
                include_mezzanine: !!(projectData.include_mezzanine ?? false),
                include_basement: !!(projectData.include_basement ?? false),
                number_of_basements: projectData.include_basement ? (parseInt(projectData.number_of_basements) || 1) : 0,
            });
        } else {
            setFormData(initialFormData);
        }
    }, [projectData, isOpen]);

    const updateForm = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const validate = () => {
        if (!formData.project_name?.trim()) {
            toast.error("Project Name is required");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        // Trim all string values before sending
        const trimmedData = Object.keys(formData).reduce((acc, key) => {
            acc[key] = typeof formData[key] === 'string' ? formData[key].trim() : formData[key];
            return acc;
        }, {});

        // Enforce valid basement count if included
        if (trimmedData.include_basement) {
            if (!trimmedData.number_of_basements || trimmedData.number_of_basements < 1) {
                trimmedData.number_of_basements = 1;
            }
        }

        try {
            setLoading(true);
            let res;
            if (projectData?.project_id) {
                res = await UPDATE_PROJECT_ONLY_API(projectData.project_id, trimmedData);
            } else {
                res = await CREATE_PROJECT_ONLY_API(trimmedData);
            }

            const response = res?.response ? res.response : res;

            if (response?.data?.success) {
                toast.success(projectData ? "Project updated successfully" : "Project created successfully");
                if (onSuccess) onSuccess(response.data.payload);
                closeProjectModal();
            } else {
                toast.error(response?.data?.payload?.message || "Something went wrong");
            }
        } catch (err) {
            console.error("Project action failed:", err);
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (!shouldRender) return null;

    return createPortal(
        <div
            className={`fixed inset-0 z-[99999] flex items-center justify-center p-0 md:p-4 ${isClosing ? 'animate-modal-fade-out' : 'animate-modal-fade'}`}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => e.target === e.currentTarget && closeProjectModal()}
        >
            <div className={`bg-white md:rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-full md:h-auto md:max-h-[90vh] ${isClosing ? 'animate-modal-zoom-out' : 'animate-modal-zoom'}`}>
                {/* Header - Stays fixed at top */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div>
                        <h2 className="text-slate-900 mb-2 font-bold text-2xl">
                            {projectData ? 'Update Project' : 'Create New Project'}
                        </h2>
                        <p className="text-slate-600">
                            {projectData ? `Editing details for Project ID: ${projectData.project_id}` : 'Provide information about your project'}
                        </p>
                    </div>
                    <button
                        onClick={closeProjectModal}
                        className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600 cursor-pointer active:scale-95"
                    >
                        <X className="w-5 h-5" strokeWidth={2.5} />
                    </button>
                </div>

                {/* Form Body - Scrollable Area */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1" style={{ touchAction: 'pan-y' }}>
                    {/* Project Name - Full Width */}
                    <div className="space-y-2">
                        <Label htmlFor="project_name" style={{ fontWeight: '600', color: '#334155', marginLeft: '4px' }}>Project Name <span style={{ color: '#ef4444' }}>*</span></Label>
                        <Input
                            id="project_name"
                            value={formData.project_name}
                            onChange={updateForm}
                            onFocus={() => setFocusedField('project_name')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="e.g. Dubailand Project"
                            maxLength={100}
                            className="rounded-xl h-12 px-4 shadow-sm w-full font-medium transition-all outline-none border border-slate-200"
                            style={{
                                backgroundColor: focusedField === 'project_name' ? '#ffffff' : '#f8fafc',
                                color: '#000000',
                                borderColor: focusedField === 'project_name' ? '#3b82f6' : '#e2e8f0',
                                boxShadow: focusedField === 'project_name' ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none'
                            }}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="project_type" style={{ fontWeight: '600', color: '#334155', marginLeft: '4px' }}>Project Type</Label>
                            <FormControl fullWidth size="small">
                                <MuiSelect
                                    id="project_type"
                                    value={formData.project_type}
                                    onChange={(e) => updateForm({ target: { id: "project_type", value: e.target.value } })}
                                    className="rounded-xl"
                                    displayEmpty
                                    disabled={!!projectData}
                                    sx={{
                                        borderRadius: '0.75rem',
                                        height: '48px',
                                        backgroundColor: !!projectData ? '#f1f5f9' : '#f8fafc',
                                        color: !!projectData ? '#64748b' : '#000000',
                                        cursor: !!projectData ? 'not-allowed' : 'pointer',
                                        '&.Mui-disabled': {
                                            cursor: 'not-allowed',
                                            pointerEvents: 'auto',
                                        },
                                        '& .MuiSelect-select.Mui-disabled': {
                                            cursor: 'not-allowed',
                                            WebkitTextFillColor: '#64748b',
                                            pointerEvents: 'auto',
                                        },
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                                        '&.Mui-focused': {
                                            backgroundColor: '#ffffff',
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6', borderWidth: '1px' }
                                        },
                                        fontSize: '0.875rem'
                                    }}
                                    renderValue={(selected) => {
                                        if (!selected) return <span style={{ color: '#94a3b8' }}>Select Type</span>;
                                        return projectTypes.find(item => item.value === selected)?.label;
                                    }}
                                >
                                    {projectTypes.map((item) => (
                                        <MenuItem key={item.id} value={item.value} sx={{ fontSize: '0.875rem' }}>{item.label}</MenuItem>
                                    ))}
                                </MuiSelect>
                            </FormControl>
                            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                                <p className="text-amber-700 font-bold leading-tight flex items-start gap-1" style={{ fontSize: '12px' }}>
                                    <span className="shrink-0">⚠️</span>
                                    <span>Note: Project Type cannot be changed later.</span>
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location" style={{ fontWeight: '600', color: '#334155', marginLeft: '4px' }}>Location</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={updateForm}
                                onFocus={() => setFocusedField('location')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="e.g. Dubai Investment Park"
                                className="rounded-xl h-12 px-4 shadow-sm transition-all outline-none border border-slate-200"
                                style={{
                                    backgroundColor: focusedField === 'location' ? '#ffffff' : '#f8fafc',
                                    color: '#000000',
                                    borderColor: focusedField === 'location' ? '#3b82f6' : '#e2e8f0',
                                    boxShadow: focusedField === 'location' ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none'
                                }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="plot_number" style={{ fontWeight: '600', color: '#334155', marginLeft: '4px' }}>Plot Number</Label>
                            <Input
                                id="plot_number"
                                value={formData.plot_number}
                                onChange={updateForm}
                                onFocus={() => setFocusedField('plot_number')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="e.g. 123-456"
                                className="rounded-xl h-12 px-4 shadow-sm transition-all outline-none border border-slate-200"
                                style={{
                                    backgroundColor: focusedField === 'plot_number' ? '#ffffff' : '#f8fafc',
                                    color: '#000000',
                                    borderColor: focusedField === 'plot_number' ? '#3b82f6' : '#e2e8f0',
                                    boxShadow: focusedField === 'plot_number' ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none'
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="built_up_area" style={{ fontWeight: '600', color: '#334155', marginLeft: '4px' }}>Built-up Area (sq.ft)</Label>
                            <Input
                                id="built_up_area"
                                value={formData.built_up_area}
                                onChange={(e) => /^\d*\.?\d*$/.test(e.target.value) && updateForm(e)}
                                onFocus={() => setFocusedField('built_up_area')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="e.g. 5000"
                                className="rounded-xl h-12 px-4 shadow-sm transition-all outline-none border border-slate-200"
                                style={{
                                    backgroundColor: focusedField === 'built_up_area' ? '#ffffff' : '#f8fafc',
                                    color: '#000000',
                                    borderColor: focusedField === 'built_up_area' ? '#3b82f6' : '#e2e8f0',
                                    boxShadow: focusedField === 'built_up_area' ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none'
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="number_of_floors" style={{ fontWeight: '600', color: '#334155', marginLeft: '4px' }}>Number of Floors</Label>
                            <Input
                                id="number_of_floors"
                                value={formData.number_of_floors}
                                onChange={(e) => /^\d*$/.test(e.target.value) && updateForm(e)}
                                onFocus={() => setFocusedField('number_of_floors')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="e.g. 2"
                                className="rounded-xl h-12 px-4 shadow-sm w-full font-medium transition-all outline-none border border-slate-200"
                                style={{
                                    backgroundColor: focusedField === 'number_of_floors' ? '#ffffff' : '#f8fafc',
                                    color: '#000000',
                                    borderColor: focusedField === 'number_of_floors' ? '#3b82f6' : '#e2e8f0',
                                    boxShadow: focusedField === 'number_of_floors' ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* Structural Features Toggles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Include Ground Floor */}
                        <div className="space-y-2 w-full">
                            <Label style={{ fontWeight: '600', color: '#334155', display: 'block', whiteSpace: 'nowrap', marginLeft: '4px' }}>Include Ground Floor?</Label>
                            <div
                                className="flex items-center justify-between px-3 rounded-xl h-12 transition-all cursor-pointer select-none border w-full"
                                onClick={() => setFormData(prev => ({ ...prev, include_ground_floor: !prev.include_ground_floor }))}
                                style={{
                                    backgroundColor: formData.include_ground_floor ? '#ffffff' : '#f8fafc',
                                    borderColor: formData.include_ground_floor ? '#2563eb' : '#e2e8f0',
                                    boxShadow: formData.include_ground_floor ? '0 4px 12px rgba(37, 99, 235, 0.1)' : 'none'
                                }}
                            >
                                <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: '900',
                                    color: formData.include_ground_floor ? '#2563eb' : '#94a3b8',
                                    letterSpacing: '0.05em'
                                }}>
                                    {formData.include_ground_floor ? 'YES' : 'NO'}
                                </span>
                                <div style={{
                                    width: '32px',
                                    height: '18px',
                                    borderRadius: '20px',
                                    backgroundColor: formData.include_ground_floor ? '#2563eb' : '#cbd5e1',
                                    position: 'relative',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        backgroundColor: '#ffffff',
                                        position: 'absolute',
                                        top: '3px',
                                        left: formData.include_ground_floor ? '17px' : '3px',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                    }} />
                                </div>
                            </div>
                        </div>

                        {/* Include Mezzanine */}
                        <div className="space-y-2 w-full">
                            <Label style={{ fontWeight: '600', color: '#334155', display: 'block', whiteSpace: 'nowrap', marginLeft: '4px' }}>Include Mezzanine?</Label>
                            <div
                                className="flex items-center justify-between px-3 rounded-xl h-12 transition-all cursor-pointer select-none border w-full"
                                onClick={() => setFormData(prev => ({ ...prev, include_mezzanine: !prev.include_mezzanine }))}
                                style={{
                                    backgroundColor: formData.include_mezzanine ? '#ffffff' : '#f8fafc',
                                    borderColor: formData.include_mezzanine ? '#2563eb' : '#e2e8f0',
                                    boxShadow: formData.include_mezzanine ? '0 4px 12px rgba(37, 99, 235, 0.1)' : 'none'
                                }}
                            >
                                <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: '900',
                                    color: formData.include_mezzanine ? '#2563eb' : '#94a3b8',
                                    letterSpacing: '0.05em'
                                }}>
                                    {formData.include_mezzanine ? 'YES' : 'NO'}
                                </span>
                                <div style={{
                                    width: '32px',
                                    height: '18px',
                                    borderRadius: '20px',
                                    backgroundColor: formData.include_mezzanine ? '#2563eb' : '#cbd5e1',
                                    position: 'relative',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        backgroundColor: '#ffffff',
                                        position: 'absolute',
                                        top: '3px',
                                        left: formData.include_mezzanine ? '17px' : '3px',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                    }} />
                                </div>
                            </div>
                        </div>

                        {/* Include Basement */}
                        <div className="space-y-2 w-full">
                            <Label style={{ fontWeight: '600', color: '#334155', display: 'block', whiteSpace: 'nowrap', marginLeft: '4px' }}>Include Basement?</Label>
                            <div
                                className="flex items-center justify-between px-3 rounded-xl h-12 transition-all cursor-pointer select-none border w-full"
                                onClick={() => setFormData(prev => {
                                    const nextState = !prev.include_basement;
                                    return {
                                        ...prev,
                                        include_basement: nextState,
                                        number_of_basements: nextState ? (prev.number_of_basements > 0 ? prev.number_of_basements : 1) : 0
                                    };
                                })}
                                style={{
                                    backgroundColor: formData.include_basement ? '#ffffff' : '#f8fafc',
                                    borderColor: formData.include_basement ? '#2563eb' : '#e2e8f0',
                                    boxShadow: formData.include_basement ? '0 4px 12px rgba(37, 99, 235, 0.1)' : 'none'
                                }}
                            >
                                <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: '900',
                                    color: formData.include_basement ? '#2563eb' : '#94a3b8',
                                    letterSpacing: '0.05em'
                                }}>
                                    {formData.include_basement ? 'YES' : 'NO'}
                                </span>
                                <div style={{
                                    width: '32px',
                                    height: '18px',
                                    borderRadius: '20px',
                                    backgroundColor: formData.include_basement ? '#2563eb' : '#cbd5e1',
                                    position: 'relative',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <div style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        backgroundColor: '#ffffff',
                                        position: 'absolute',
                                        top: '3px',
                                        left: formData.include_basement ? '17px' : '3px',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                    }} />
                                </div>
                            </div>
                        </div>

                        {/* Number of Basements */}
                        {Boolean(formData.include_basement) && (
                            <div className="space-y-2 w-full animate-in fade-in zoom-in duration-300">
                                <Label htmlFor="number_of_basements" style={{ fontWeight: '600', color: '#334155', marginLeft: '4px' }}>Number of Basements</Label>
                                <Input
                                    id="number_of_basements"
                                    value={formData.number_of_basements}
                                    onChange={(e) => (e.target.value === '' || /^[1-9]\d*$/.test(e.target.value)) && updateForm(e)}
                                    onFocus={() => setFocusedField('number_of_basements')}
                                    onBlur={() => setFocusedField(null)}
                                    placeholder="e.g. 1"
                                    className="rounded-xl h-12 px-4 shadow-sm w-full font-medium transition-all outline-none border border-slate-200"
                                    style={{
                                        backgroundColor: focusedField === 'number_of_basements' ? '#ffffff' : '#f8fafc',
                                        color: '#000000',
                                        borderColor: focusedField === 'number_of_basements' ? '#3b82f6' : '#e2e8f0',
                                        boxShadow: focusedField === 'number_of_basements' ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none'
                                    }}
                                />
                            </div>
                        )}
                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="building_usage_type" style={{ fontWeight: '600', color: '#334155', marginLeft: '4px' }}>Building Usage Type</Label>
                            <FormControl fullWidth size="small">
                                <MuiSelect
                                    id="building_usage_type"
                                    value={formData.building_usage_type}
                                    onChange={(e) => updateForm({ target: { id: "building_usage_type", value: e.target.value } })}
                                    className="rounded-xl"
                                    displayEmpty
                                    sx={{
                                        borderRadius: '0.75rem',
                                        height: '48px',
                                        backgroundColor: '#f8fafc',
                                        color: '#000000',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                                        '&.Mui-focused': {
                                            backgroundColor: '#ffffff',
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6', borderWidth: '1px' }
                                        },
                                        fontSize: '0.875rem'
                                    }}
                                    renderValue={(selected) => {
                                        if (!selected) return <span style={{ color: '#94a3b8' }}>Select Usage Type</span>;
                                        return usageTypes.find(item => item.value === selected)?.label;
                                    }}
                                >
                                    {usageTypes.map((item) => (
                                        <MenuItem key={item.id} value={item.value} sx={{ fontSize: '0.875rem' }}>{item.label}</MenuItem>
                                    ))}
                                </MuiSelect>
                            </FormControl>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="client_developer" style={{ fontWeight: '600', color: '#334155', marginLeft: '4px' }}>Master Developer</Label>
                            <FormControl fullWidth size="small">
                                <MuiSelect
                                    id="client_developer"
                                    value={formData.client_developer}
                                    onChange={(e) => updateForm({ target: { id: "client_developer", value: e.target.value } })}
                                    className="rounded-xl"
                                    displayEmpty
                                    sx={{
                                        borderRadius: '0.75rem',
                                        height: '48px',
                                        backgroundColor: '#f8fafc',
                                        color: '#000000',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                                        '&.Mui-focused': {
                                            backgroundColor: '#ffffff',
                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6', borderWidth: '1px' }
                                        },
                                        fontSize: '0.875rem'
                                    }}
                                    renderValue={(selected) => {
                                        if (!selected) return <span style={{ color: '#94a3b8' }}>Select Developer</span>;
                                        return masterDevelopers.find(item => item.value === selected)?.label;
                                    }}
                                >
                                    {masterDevelopers.map((item) => (
                                        <MenuItem key={item.id} value={item.value} sx={{ fontSize: '0.875rem' }}>{item.label}</MenuItem>
                                    ))}
                                </MuiSelect>
                            </FormControl>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t border-slate-100 bg-white flex gap-4 shrink-0">
                    <Button
                        variant="outline"
                        onClick={closeProjectModal}
                        className="flex-1 rounded-xl h-10 md:h-12 text-sm md:text-base"
                        disabled={loading}
                        style={{ border: '2px solid #ef4444', color: '#ef4444', fontWeight: '700', backgroundColor: '#ffffff' }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="flex-1 rounded-xl h-10 md:h-12 text-sm md:text-base"
                        disabled={loading}
                        style={{ backgroundColor: '#2563eb', color: '#ffffff', fontWeight: '800', border: 'none', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)' }}
                    >
                        {loading ? (
                            <div className="flex items-center gap-2 justify-center">
                                <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" style={{ color: '#ffffff' }} />
                                <span style={{ color: '#ffffff' }}>{projectData ? 'Updates...' : 'Creating...'}</span>
                            </div>
                        ) : (
                            <span style={{ color: '#ffffff' }}>
                                {projectData ? 'Update Project' : 'Create Project'}
                            </span>
                        )}
                    </Button>
                </div>
            </div>
        </div>,
        document.getElementById('modal-root')
    );
}
