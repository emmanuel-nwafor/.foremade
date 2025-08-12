import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isDirectAccess = !location.state?.fromValidNavigation; // Check if navigation is direct

  useEffect(() => {
    if (isDirectAccess && location.pathname !== '/') {
      // Show popup or alert for security reasons
      // alert('For security reasons, you are not allowed to access pages via direct URL entry. Redirecting to home...');
      // Redirect to home page after alert
      setTimeout(() => navigate('/'), 1000); // Delay to let user see the alert
    }
  }, [isDirectAccess, location.pathname, navigate]);

  // Allow access only if not direct access or on home page
  if (isDirectAccess && location.pathname !== '/') {
    return null; // Render nothing until redirect completes
  }

  return children;
};

export default ProtectedRoute;