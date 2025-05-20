import React, { useState, useEffect } from 'react';
import { db } from '/src/firebase';
import { collection, getDocs, setDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import AdminSidebar from '/src/admin/AdminSidebar';

export default function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [newVendor, setNewVendor] = useState({ email: '', name: '' });
  const [editingVendor, setEditingVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const vendorsSnap = await getDocs(collection(db, 'vendors'));
        setVendors(vendorsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setError('Failed to fetch vendors: ' + err.message);
      }
      setLoading(false);
    };

    fetchVendors();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(collection(db, 'vendors'));
      await setDoc(docRef, {
        email: newVendor.email,
        name: newVendor.name,
        createdAt: new Date().toISOString(),
      });
      setVendors([...vendors, { id: docRef.id, ...newVendor, createdAt: new Date().toISOString() }]);
      setNewVendor({ email: '', name: '' });
    } catch (err) {
      setError('Failed to create vendor: ' + err.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, 'vendors', editingVendor.id);
      await updateDoc(docRef, { email: editingVendor.email, name: editingVendor.name });
      setVendors(vendors.map((v) => (v.id === editingVendor.id ? { ...v, ...editingVendor } : v)));
      setEditingVendor(null);
    } catch (err) {
      setError('Failed to update vendor: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;
    try {
      await deleteDoc(doc(db, 'vendors', id));
      setVendors(vendors.filter((v) => v.id !== id));
    } catch (err) {
      setError('Failed to delete vendor: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white dark:bg-gray-900">
        <AdminSidebar />
        <main className="flex-1 ml-0 md:ml-64 p-6">
          <div className="container mx-auto px-4 py-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-white dark:bg-gray-900">
        <AdminSidebar />
        <main className="flex-1 ml-0 md:ml-64 p-6">
          <div className="container mx-auto px-4 py-8">
            <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-lg dark:bg-red-900 dark:border-red-700">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      <AdminSidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-6">Manage Vendors</h1>
          <form onSubmit={handleCreate} className="mb-8 bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Add New Vendor</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={newVendor.email}
                onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                placeholder="Enter vendor email"
                className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                required
              />
              <input
                type="text"
                value={newVendor.name}
                onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                placeholder="Enter vendor name"
                className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                required
              />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Add Vendor
              </button>
            </div>
          </form>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="p-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Vendor ID</th>
                  <th className="p-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Name</th>
                  <th className="p-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Email</th>
                  <th className="p-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3 text-xs sm:text-sm text-gray-800 dark:text-gray-200">{vendor.id}</td>
                    <td className="p-3 text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                      {editingVendor?.id === vendor.id ? (
                        <input
                          type="text"
                          value={editingVendor.name}
                          onChange={(e) => setEditingVendor({ ...editingVendor, name: e.target.value })}
                          className="p-1 border rounded dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                        />
                      ) : (
                        vendor.name
                      )}
                    </td>
                    <td className="p-3 text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                      {editingVendor?.id === vendor.id ? (
                        <input
                          type="email"
                          value={editingVendor.email}
                          onChange={(e) => setEditingVendor({ ...editingVendor, email: e.target.value })}
                          className="p-1 border rounded dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                        />
                      ) : (
                        vendor.email
                      )}
                    </td>
                    <td className="p-3 text-xs sm:text-sm">
                      {editingVendor?.id === vendor.id ? (
                        <>
                          <button
                            onClick={handleUpdate}
                            className="text-green-600 hover:underline mr-2 dark:text-green-400"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingVendor(null)}
                            className="text-gray-600 hover:underline dark:text-gray-400"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingVendor({ ...vendor })}
                            className="text-blue-600 hover:underline mr-2 dark:text-blue-400"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(vendor.id)}
                            className="text-red-600 hover:underline dark:text-red-400"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}