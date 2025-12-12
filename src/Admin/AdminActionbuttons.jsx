import React from 'react';
import { CheckCircle2, XCircle, Trash2, Loader, Edit2 } from 'lucide-react';

function AdminActionButtons({ productId, currentStatus, onStatusChange, onDelete, loading, onEdit, isModal }) {
  return (
    <div className={`flex ${isModal ? 'justify-end mt-4' : 'space-x-2'}`}>
      {currentStatus !== 'approved' && (
        <button
          onClick={(e) => { e.stopPropagation(); onStatusChange(productId, 'approved'); }}
          disabled={loading}
          className="py-2 px-2 m-1 bg-gray-800 text-white rounded-xl text-sm hover:bg-gray-600 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-md"
          title="Approve product for sale"
        >
          {loading ? <Loader size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
        </button>
      )}
      {currentStatus !== 'rejected' && (
        <button
          onClick={(e) => { e.stopPropagation(); onStatusChange(productId, 'rejected'); }}
          disabled={loading}
          className="py-2 px-4 m-1 bg-gray-600 text-white rounded-xl text-sm hover:bg-amber-900 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-md"
          title="Reject product"
        >
          {loading ? <Loader size={16} className="animate-spin" /> : <XCircle size={16} />}
        </button>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(productId); }}
        disabled={loading}
        className="py-2 px-4 m-1 bg-gray-600 text-white rounded-xl text-sm hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-md"
        title="Delete product permanently"
      >
        {loading ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(productId); }}
        disabled={loading}
        className="py-2 px-4 m-1 bg-gray-600 text-white rounded-xl text-sm hover:bg-gray-700 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-md"
        title="Edit product details"
      >
        {loading ? <Loader size={16} className="animate-spin" /> : <Edit2 size={16} />}
      </button>
    </div>
  );
}

export default AdminActionButtons;