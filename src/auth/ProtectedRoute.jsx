import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const auth = getAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        console.log('No user authenticated, redirecting to login');
        navigate("/login", { replace: true, state: { from: location.pathname } });
        setLoading(false);
        return;
      }

      const adminEmails = ['Foremade@icloud.com', 'echinecherem729@gmail.com'];
      const userEmail = user.email.toLowerCase();
      const isAdmin = adminEmails.some(email => email.toLowerCase() === userEmail);

      console.log("Authenticated user email:", user.email);
      console.log("Normalized user email:", userEmail);
      console.log("Admin emails:", adminEmails);
      console.log("Is admin?", isAdmin);

      if (requireAdmin && !isAdmin) {
        console.log('Non-admin access attempted, redirecting to login');
        navigate("/login", { replace: true, state: { from: location.pathname } });
      } else {
        setHasAccess(true); // Grant access if not redirected
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, location.pathname, navigate, requireAdmin]);

  console.log("Rendering ProtectedRoute, loading:", loading, "hasAccess:", hasAccess); // Debug render

  if (loading) return <div>Loading...</div>;
  if (!hasAccess) return null; // Prevent rendering if access is denied

  return children; // Render children only if access is granted
};

export default ProtectedRoute;