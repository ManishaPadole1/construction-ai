import { useState } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  MessageSquare
} from 'lucide-react';
import { Checkbox } from './ui/checkbox';

const documents = [
  { id: 'dm-1', name: 'Completed Application Form', authority: 'Dubai Municipality', status: 'approved' },
  { id: 'dm-2', name: 'Title Deed Copy', authority: 'Dubai Municipality', status: 'approved' },
  { id: 'dm-3', name: 'Approved Building Plan', authority: 'Dubai Municipality', status: 'uploaded' },
  { id: 'dm-4', name: 'Structural Drawings', authority: 'Dubai Municipality', status: 'uploaded' },
  { id: 'dm-5', name: 'MEP Drawings', authority: 'Dubai Municipality', status: 'pending' },
  { id: 'dm-6', name: 'Site Plan', authority: 'Dubai Municipality', status: 'pending' },

  { id: 'dewa-1', name: 'DEWA Application Form', authority: 'DEWA', status: 'approved' },
  { id: 'dewa-2', name: 'MEP Drawings (Approved)', authority: 'DEWA', status: 'uploaded' },
  { id: 'dewa-3', name: 'Load Calculation Report', authority: 'DEWA', status: 'pending' },
  { id: 'dewa-4', name: 'Electrical Single Line Diagram', authority: 'DEWA', status: 'pending' },

  { id: 'dcd-1', name: 'Civil Defence Application', authority: 'Civil Defence', status: 'uploaded' },
  { id: 'dcd-2', name: 'Fire Safety Design Report', authority: 'Civil Defence', status: 'uploaded' },
  { id: 'dcd-3', name: 'Fire Fighting Drawings', authority: 'Civil Defence', status: 'pending' },
  { id: 'dcd-4', name: 'Emergency Exit Routes', authority: 'Civil Defence', status: 'pending' },
  { id: 'dcd-5', name: 'Sprinkler System Layout', authority: 'Civil Defence', status: 'pending' },

  { id: 'rta-1', name: 'RTA Application Form', authority: 'RTA', status: 'approved' },
  { id: 'rta-2', name: 'Site Access Plan', authority: 'RTA', status: 'uploaded' },
  { id: 'rta-3', name: 'Parking Layout', authority: 'RTA', status: 'pending' },

  { id: 'emaar-1', name: 'Emaar NOC Application', authority: 'Emaar', status: 'uploaded' },
  { id: 'emaar-2', name: 'Façade Material Specs', authority: 'Emaar', status: 'pending' },
  { id: 'emaar-3', name: 'Landscape Plan', authority: 'Emaar', status: 'pending' },
];

const authorities = ['All', 'Dubai Municipality', 'DEWA', 'Civil Defence', 'RTA', 'Emaar'];

export function DocumentChecklistContent() {
  const [selectedAuthority, setSelectedAuthority] = useState('All');
  const [selectedDocs, setSelectedDocs] = useState([]);

  const filteredDocs = selectedAuthority === 'All'
    ? documents
    : documents.filter(doc => doc.authority === selectedAuthority);

  const stats = {
    total: documents.length,
    approved: documents.filter(d => d.status === 'approved').length,
    uploaded: documents.filter(d => d.status === 'uploaded').length,
    pending: documents.filter(d => d.status === 'pending').length,
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'approved':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-600',
          bg: 'bg-emerald-50',
          label: 'Approved'
        };
      case 'uploaded':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          label: 'Under Review'
        };
      case 'rejected':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          label: 'Rejected'
        };
      default:
        return {
          icon: FileText,
          color: 'text-slate-400',
          bg: 'bg-slate-50',
          label: 'Pending Upload'
        };
    }
  };

  const toggleDoc = (docId) => {
    setSelectedDocs(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  return (
    <div className="step-transition max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-slate-900 mb-2">Document Checklist</h1>
        <p className="text-slate-600 text-sm md:text-base">Track and manage all required documents for your project</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <p className="text-sm text-slate-600 mb-1">Total Documents</p>
          <p className="text-slate-900 text-3xl">{stats.total}</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200">
          <p className="text-sm text-emerald-700 mb-1">Approved</p>
          <p className="text-emerald-900 text-3xl">{stats.approved}</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <p className="text-sm text-blue-700 mb-1">Under Review</p>
          <p className="text-blue-900 text-3xl">{stats.uploaded}</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
          <p className="text-sm text-slate-700 mb-1">Pending</p>
          <p className="text-slate-900 text-3xl">{stats.pending}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-slate-600">
            <Filter className="w-5 h-5" />
            <span className="text-sm">Filter by Authority:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {authorities.map((authority) => (
              <button
                key={authority}
                onClick={() => setSelectedAuthority(authority)}
                className={`
                  px-4 py-2 rounded-xl text-sm transition-all duration-200
                  ${selectedAuthority === authority
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }
                `}
              >
                {authority}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Document List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-slate-900">Documents</h2>
            <p className="text-sm text-slate-600">{filteredDocs.length} items</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredDocs.map((doc) => {
            const statusConfig = getStatusConfig(doc.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={doc.id}
                className="p-6 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={selectedDocs.includes(doc.id)}
                    onCheckedChange={() => toggleDoc(doc.id)}
                    className="mt-1"
                  />

                  <div className={`w-12 h-12 rounded-2xl ${statusConfig.bg} flex items-center justify-center`}>
                    <StatusIcon className={`w-6 h-6 ${statusConfig.color}`} />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-slate-900 mb-1">{doc.name}</h3>
                    <p className="text-sm text-slate-600">{doc.authority}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-3 py-1 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>

                    {doc.status === 'pending' && (
                      <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all text-sm flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload
                      </button>
                    )}

                    {doc.status === 'uploaded' && (
                      <button className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all text-sm">
                        View
                      </button>
                    )}

                    {doc.status === 'approved' && (
                      <button className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all text-sm">
                        Download
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedDocs.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-4">
          <span className="text-sm">{selectedDocs.length} documents selected</span>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-sm transition-colors">
              Bulk Upload
            </button>
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm transition-colors">
              Download All
            </button>
            <button
              onClick={() => setSelectedDocs([])}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm transition-colors"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function DocumentChecklist() {
  return <DocumentChecklistContent />;
}
