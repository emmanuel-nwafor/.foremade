// AdminActionButtons.jsx
import React from 'react';

function AdminActionButtons({ productId, currentStatus, onStatusChange, onDelete }) {
  return (
    <div className="flex space-x-2">
      {currentStatus !== 'approved' && (
        <button
          onClick={() => onStatusChange(productId, 'approved')}
          className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Approve
        </button>
      )}
      {currentStatus !== 'not_approved' && (
        <button
          onClick={() => onStatusChange(productId, 'not_approved')}
          className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reject
        </button>
      )}
      <button
        onClick={() => onDelete(productId)}
        className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Delete
      </button>
    </div>
  );
}

export default AdminActionButtons;