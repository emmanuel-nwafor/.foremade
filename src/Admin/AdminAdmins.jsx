import React, { useState, useEffect } from 'react';
import { db } from '/src/firebase';
import { collection, getDocs, setDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import AdminSidebar from '/src/admin/AdminSidebar';

export default function AdminAdmins() {
  const [admins, setAdmins] = useState([]);
  const [newAdmin, setNewAdmin] = useState({ email: '', name: '' });
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const adminsSnap = await getDocs(collection(db, 'admins'));
        setAdmins(adminsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setError('Failed to fetch admins: ' + err.message);
      }
      setLoading(false);
    };

    fetchAdmins();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(collection(db, 'admins'));
      await setDoc(docRef, {
        email: newAdmin.email,
        name: newAdmin.name,
        createdAt: new Date().toISOString(),
      });
      setAdmins([...admins, { id: docRef.id, ...newAdmin, createdAt: new Date().toISOString() }]);
      setNewAdmin({ email: '', name: '' });
    } catch (err) {
      setError('Failed to create admin: ' + err.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const docRef = doc(db, 'admins', editingAdmin.id);
      await updateDoc(docRef, { email: editingAdmin.email, name: editingAdmin.name });
      setAdmins(admins.map((a) => (a.id === editingAdmin.id ? { ...a, ...editingAdmin } : a)));
      setEditingAdmin(null);
    } catch (err) {
      setError('Failed to update admin: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      await deleteDoc(doc(db, 'admins', id));
      setAdmins(admins.filter((a) => a.id !== id));
    } catch (err) {
      setError('Failed to delete admin: ' + err.message);
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-6">Manage Admins</h1>
          <form onSubmit={handleCreate} className="mb-8 bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Add New Admin</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                placeholder="Enter admin email"
                className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                required
              />
              <input
                type="text"
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                placeholder="Enter admin name"
                className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                required
              />
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Add Admin
              </button>
            </div>
          </form>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="p-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Admin ID</th>
                  <th className="p-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Name</th>
                  <th className="p-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Email</th>
                  <th className="p-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr key={admin.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3 text-xs sm:text-sm text-gray-800 dark:text-gray-200">{admin.id}</td>
                    <td className="p-3 text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                      {editingAdmin?.id === admin.id ? (
                        <input
                          type="text"
                          value={editingAdmin.name}
                          onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
                          className="p-1 border rounded dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                        />
                      ) : (
                        admin.name
                      )}
                    </td>
                    <td className="p-3 text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                      {editingAdmin?.id === admin.id ? (
                        <input
                          type="email"
                          value={editingAdmin.email}
                          onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
                          className="p-1 border rounded dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                        />
                      ) : (
                        admin.email
                      )}
                    </td>
                    <td className="p-3 text-xs sm:text-sm">
                      {editingAdmin?.id === admin.id ? (
                        <>
                          <button
                            onClick={handleUpdate}
                            className="text-green-600 hover:underline mr-2 dark:text-green-400"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingAdmin(null)}
                            className="text-gray-600 hover:underline dark:text-gray-400"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingAdmin({ ...admin })}
                            className="text-blue-600 hover:underline mr-2 dark:text-blue-400"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(admin.id)}
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