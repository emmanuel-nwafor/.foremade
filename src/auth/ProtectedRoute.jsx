import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        const userDoc = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDoc);
        if (userSnap.exists()) {
          const role = userSnap.data().role;
          setUserRole(role);
          console.log('User role loaded:', role); // Debug log
        } else {
          setUserRole(null);
        }
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Simple loading state
  }

  const path = location.pathname;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: path }} />;
  }

  // if (path.startsWith('/admin') && userRole !== 'Admin') {
  //   console.log('Redirecting from admin path, role:', userRole); // Debug log
  //   return <Navigate to="/profile" replace />;
  // }

  // if (path.startsWith('/admin') && userRole == 'Admin') {
  //   console.log('Redirecting from admin path, role:', userRole); // Debug log
  //   return <Navigate to="/admin/dashboard" replace />;
  // }

  // if (path.startsWith('/seller') && !['Seller', 'Admin'].includes(userRole)) {
  //   console.log('Redirecting from seller path, role:', userRole); // Debug log
  //   return <Navigate to="/profile" replace />;
  // }

  return <Outlet />;
};

export default ProtectedRoute;