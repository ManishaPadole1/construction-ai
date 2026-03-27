import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Lock, Sparkles, UserPlus, Edit3, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ADD_EMPLOYEE_API, UPDATE_EMPLOYEE_API } from '../Services/admin';
import toast from 'react-hot-toast';

export function AddEmployeeModal({ isOpen, onClose, onSuccess, initialData }) {
  const isEdit = Boolean(initialData);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile: '',
    password: '',
    is_active: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

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
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        full_name: initialData.full_name || '',
        email: initialData.email || '',
        mobile: initialData.mobile || '',
        password: '', // Don't show password on edit
        is_active: initialData.is_active ?? true
      });
    } else {
      setFormData({
        full_name: '',
        email: '',
        mobile: '',
        password: '',
        is_active: true
      });
    }
    setError('');
  }, [initialData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (!formData.full_name?.trim()) {
      toast.error("Full Name is required");
      setIsLoading(false);
      return;
    }
    if (!formData.email?.trim()) {
      toast.error("Email Address is required");
      setIsLoading(false);
      return;
    }
    if (!formData.mobile?.trim()) {
      toast.error("Mobile Number is required");
      setIsLoading(false);
      return;
    }
    if (!isEdit && !formData.password?.trim()) {
      toast.error("System Password is required");
      setIsLoading(false);
      return;
    }

    try {
      let res;
      if (isEdit) {
        res = await UPDATE_EMPLOYEE_API(initialData.employee_id, formData);
      } else {
        res = await ADD_EMPLOYEE_API(formData);
      }

      const response = res?.response ? res.response : res;

      if (response?.data?.success) {
        toast.success(isEdit ? "Employee updated successfully!" : "Employee added successfully!");
        onSuccess();
        onClose();
      } else {
        setError(response?.data?.payload?.message || response?.data?.message || "Something went wrong");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4 ${isClosing ? 'animate-modal-fade-out' : 'animate-modal-fade'}`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`bg-white md:rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-full md:h-auto md:max-h-[90vh] ${isClosing ? 'animate-modal-zoom-out' : 'animate-modal-zoom'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-slate-900 mb-2 font-bold text-2xl">
              {isEdit ? 'Update Employee' : 'Add New Employee'}
            </h2>
            {isEdit ? (
              <>
                <p className="text-slate-600">Editing details for {initialData?.full_name}</p>
                <p className="text-slate-500 text-sm mt-1">Employee ID: {initialData?.employee_id}</p>
              </>
            ) : (
              <p className="text-slate-600">Provide information about the new employee</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable Area */}
        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1" style={{ touchAction: 'pan-y' }}>
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 ml-1">Full Name <span style={{ color: '#ef4444' }}>*</span></Label>
                <Input
                  placeholder="e.g. John Doe"
                  className="rounded-xl h-12 px-4 shadow-sm w-full font-medium transition-all outline-none border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 ml-1">Email Address <span style={{ color: '#ef4444' }}>*</span></Label>
                  <Input
                    type="email"
                    placeholder="john@example.com"
                    className="rounded-xl h-12 px-4 shadow-sm font-medium transition-all outline-none border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    autoComplete="off"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 ml-1">Mobile Number <span style={{ color: '#ef4444' }}>*</span></Label>
                  <Input
                    placeholder="+91 98765 43210"
                    className="rounded-xl h-12 px-4 shadow-sm font-medium transition-all outline-none border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 ml-1">
                  System Password {!isEdit && <span style={{ color: '#ef4444' }}>*</span>}
                </Label>
                <Input
                  type="password"
                  placeholder={isEdit ? "Leave blank to keep same" : "Secure Password"}
                  className="rounded-xl h-12 px-4 shadow-sm font-medium transition-all outline-none border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  autoComplete="new-password"
                />
                {!isEdit && (
                  <p className="text-[11px] font-bold text-slate-400 ml-1">
                    Must be 8+ chars with uppercase, lowercase, numbers & symbols.
                  </p>
                )}
              </div>

              {/* Active/Inactive Toggle */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 ml-1">Account Status</Label>
                <div
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className="flex items-center gap-3 cursor-pointer select-none p-4 rounded-xl border-2 transition-all duration-200"
                  style={{
                    borderColor: formData.is_active ? '#2563eb' : '#e2e8f0',
                    backgroundColor: formData.is_active ? '#eff6ff' : '#f8fafc'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '18px',
                    borderRadius: '20px',
                    backgroundColor: formData.is_active ? '#2563eb' : '#cbd5e1',
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
                      left: formData.is_active ? '17px' : '3px',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">
                      {formData.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formData.is_active ? 'Employee can login to the system' : 'Employee cannot login to the system'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="p-4 md:p-6 border-t border-slate-100 bg-white flex gap-4 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 rounded-xl h-12"
              disabled={isLoading}
              style={{ border: '2px solid #ef4444', color: '#ef4444', fontWeight: '700', backgroundColor: '#ffffff' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 rounded-xl h-12"
              style={{ backgroundColor: '#2563eb', color: '#ffffff', fontWeight: '800', border: 'none', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)' }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#ffffff' }} />
                  <span style={{ color: '#ffffff' }}>{isEdit ? 'Updating...' : 'Creating...'}</span>
                </div>
              ) : (
                <span style={{ color: '#ffffff' }}>
                  {isEdit ? 'Update Employee' : 'Create Employee'}
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}