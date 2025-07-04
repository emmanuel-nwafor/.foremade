import React from 'react';
import { CheckCircle2, XCircle, Trash2, Loader, Edit2 } from 'lucide-react';

function AdminActionButtons({ productId, currentStatus, onStatusChange, onDelete, loading, onEdit, isModal }) {
  return (
    <div className={`flex ${isModal ? 'justify-end mt-4' : 'space-x-2'}`}>
      {currentStatus !== 'approved' && (
        <button
          onClick={(e) => { e.stopPropagation(); onStatusChange(productId, 'approved'); }}
          disabled={loading}
          className="py-2 px-4 m-1 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-md"
          title="Approve product for sale"
        >
          {loading ? <Loader size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          Approve
        </button>
      )}
      {currentStatus !== 'not_approved' && (
        <button
          onClick={(e) => { e.stopPropagation(); onStatusChange(productId, 'not_approved'); }}
          disabled={loading}
          className="py-2 px-4 m-1 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-md"
          title="Reject product"
        >
          {loading ? <Loader size={16} className="animate-spin" /> : <XCircle size={16} />}
          Reject
        </button>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(productId); }}
        disabled={loading}
        className="py-2 px-4 m-1 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-md"
        title="Delete product permanently"
      >
        {loading ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
        {/* Delete */}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(productId); }}
        disabled={loading}
        className="py-2 px-4 m-1 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-md"
        title="Edit product details"
      >
        {loading ? <Loader size={16} className="animate-spin" /> : <Edit2 size={16} />}
        Edit
      </button>
    </div>
  );
}

export default AdminActionButtons;