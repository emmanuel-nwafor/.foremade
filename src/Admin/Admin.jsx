import React, { useState, useEffect } from 'react';
import { auth, vendorAuth, db } from '/src/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, setDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import SellerSidebar from '/src/seller/SellerSidebar';

export default function Admin() {
  const [data, setData] = useState({ users: [], admins: [], vendors: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newUser, setNewUser] = useState({ email: '' });
  const [newAdmin, setNewAdmin] = useState({ email: '' });
  const [newVendor, setNewVendor] = useState({ email: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [editingVendor, setEditingVendor] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersSnap, adminsSnap, vendorsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'admins')),
          getDocs(collection(db, 'vendors')),
        ]);

        setData({
          users: usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
          admins: adminsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
          vendors: vendorsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        });
      } catch (err) {
        setError('Failed to fetch data: ' + err.message);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleCreate = async (collectionName, newEntry) => {
    try {
      const docId = Date.now().toString();
      await setDoc(doc(db, collectionName, docId), newEntry);
      setData((prev) => ({
        ...prev,
        [collectionName]: [...prev[collectionName], { id: docId, ...newEntry }],
      }));
      if (collectionName === 'users') setNewUser({ email: '' });
      if (collectionName === 'admins') setNewAdmin({ email: '' });
      if (collectionName === 'vendors') setNewVendor({ email: '' });
    } catch (err) {
      setError(`Failed to create ${collectionName.slice(0, -1)}: ` + err.message);
    }
  };

  const handleUpdate = async (collectionName, docId, updatedEntry) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, updatedEntry);
      setData((prev) => ({
        ...prev,
        [collectionName]: prev[collectionName].map((item) =>
          item.id === docId ? { ...item, ...updatedEntry } : item
        ),
      }));
      // Note: Updating email in Authentication requires Admin SDK on the backend
      console.log(`Would update ${collectionName} email in Authentication: ${docId} to ${updatedEntry.email}`);
      if (collectionName === 'users') setEditingUser(null);
      if (collectionName === 'admins') setEditingAdmin(null);
      if (collectionName === 'vendors') setEditingVendor(null);
    } catch (err) {
      console.error(`Error updating ${collectionName} document ${docId}:`, err);
      setError(`Failed to update ${collectionName.slice(0, -1)}: ` + err.message);
    }
  };

  const handleDelete = async (collectionName, docId) => {
    try {
      await deleteDoc(doc(db, collectionName, docId));
      setData((prev) => ({
        ...prev,
        [collectionName]: prev[collectionName].filter((item) => item.id !== docId),
      }));
      // Note: Deleting user from Authentication requires Admin SDK on the backend
      console.log(`Would delete ${collectionName} from Authentication: ${docId}`);
    } catch (err) {
      console.error(`Error deleting ${collectionName} document ${docId}:`, err);
      setError(`Failed to delete ${collectionName.slice(0, -1)}: ` + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white dark:bg-gray-900">
        <SellerSidebar />
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
        <SellerSidebar />
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
      <SellerSidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-6">Admin Dashboard</h1>

          {/* Create User Form */}
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Add New User</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ email: e.target.value })}
                placeholder="Enter user email"
                className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
              />
              <button
                onClick={() => handleCreate('users', newUser)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add User
              </button>
            </div>
          </div>

          {/* Users Table */}
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Users</h2>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="p-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">User ID</th>
                  <th className="p-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Email</th>
                  <th className="p-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3 text-xs sm:text-sm text-gray-800 dark:text-gray-200">{user.id}</td>
                    <td className="p-3 text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                      {editingUser?.id === user.id ? (
                        <input
                          type="email"
                          value={editingUser.email}
                          onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                          className="p-1 border rounded dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                        />
                      ) : (
                        user.email || 'N/A'
                      )}
                    </td>
                    <td className="p-3 text-xs sm:text-sm">
                      {editingUser?.id === user.id ? (
                        <>
                          <button
                            onClick={() => handleUpdate('users', user.id, { email: editingUser.email })}
                            className="text-green-600 hover:underline mr-2 dark:text-green-400"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="text-gray-600 hover:underline dark:text-gray-400"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-blue-600 hover:underline mr-2 dark:text-blue-400"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete('users', user.id)}
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

          {/* Create Admin Form */}
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Add New Admin</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ email: e.target.value })}
                placeholder="Enter admin email"
                className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
              />
              <button
                onClick={() => handleCreate('admins', newAdmin)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add Admin
              </button>
            </div>
          </div>

          {/* Admins Table */}
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Admins</h2>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="p-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Admin ID</th>
                  <th className="p-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Email</th>
                  <th className="p-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.admins.map((admin) => (
                  <tr key={admin.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3 text-xs sm:text-sm text-gray-800 dark:text-gray-200">{admin.id}</td>
                    <td className="p-3 text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                      {editingAdmin?.id === admin.id ? (
                        <input
                          type="email"
                          value={editingAdmin.email}
                          onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
                          className="p-1 border rounded dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                        />
                      ) : (
                        admin.email || 'N/A'
                      )}
                    </td>
                    <td className="p-3 text-xs sm:text-sm">
                      {editingAdmin?.id === admin.id ? (
                        <>
                          <button
                            onClick={() => handleUpdate('admins', admin.id, { email: editingAdmin.email })}
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
                            onClick={() => setEditingAdmin(admin)}
                            className="text-blue-600 hover:underline mr-2 dark:text-blue-400"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete('admins', admin.id)}
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

          {/* Create Vendor Form */}
          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Add New Vendor</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={newVendor.email}
                onChange={(e) => setNewVendor({ email: e.target.value })}
                placeholder="Enter vendor email"
                className="p-2 border rounded-lg dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
              />
              <button
                onClick={() => handleCreate('vendors', newVendor)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add Vendor
              </button>
            </div>
          </div>

          {/* Vendors Table */}
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Vendors</h2>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="p-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Vendor ID</th>
                  <th className="p-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Email</th>
                  <th className="p-3 text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.vendors.map((vendor) => (
                  <tr key={vendor.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-3 text-xs sm:text-sm text-gray-800 dark:text-gray-200">{vendor.id}</td>
                    <td className="p-3 text-xs sm:text-sm text-gray-800 dark:text-gray-200">
                      {editingVendor?.id === vendor.id ? (
                        <input
                          type="email"
                          value={editingVendor.email}
                          onChange={(e) => setEditingVendor({ ...editingVendor, email: e.target.value })}
                          className="p-1 border rounded dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600"
                        />
                      ) : (
                        vendor.email || 'N/A'
                      )}
                    </td>
                    <td className="p-3 text-xs sm:text-sm">
                      {editingVendor?.id === vendor.id ? (
                        <>
                          <button
                            onClick={() => handleUpdate('vendors', vendor.id, { email: editingVendor.email })}
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
                            onClick={() => setEditingVendor(vendor)}
                            className="text-blue-600 hover:underline mr-2 dark:text-blue-400"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete('vendors', vendor.id)}
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