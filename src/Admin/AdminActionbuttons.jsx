import React from 'react';

function AdminActionButtons({ productId, currentStatus, onStatusChange, onDelete, loading, isModal }) {
  return (
    <div className={`flex ${isModal ? 'justify-end mt-4' : 'space-x-2'}`}>
      {currentStatus !== 'approved' && (
        <button
          onClick={(e) => { e.stopPropagation(); onStatusChange(productId, 'approved'); }}
          disabled={loading}
          className="py-2 px-4 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-sm"
          title="Approve product for sale"
        >
          {loading ? <i className="bx bx-loader bx-spin"></i> : <i className="bx bx-check"></i>}
          Approve
        </button>
      )}
      {currentStatus !== 'not_approved' && (
        <button
          onClick={(e) => { e.stopPropagation(); onStatusChange(productId, 'not_approved'); }}
          disabled={loading}
          className="py-2 px-4 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-sm"
          title="Reject product"
        >
          {loading ? <i className="bx bx-loader bx-spin"></i> : <i className="bx bx-x"></i>}
          Reject
        </button>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(productId); }}
        disabled={loading}
        className="py-2 px-4 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-sm"
        title="Delete product permanently"
      >
        {loading ? <i className="bx bx-loader bx-spin"></i> : <i className="bx bx-trash"></i>}
        Delete
      </button>
    </div>
  );
}

export default AdminActionButtons;