import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, getIdToken } from "firebase/auth";

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const auth = getAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate("/login", { replace: true, state: { from: location.pathname } });
        return;
      }

      try {
        const token = await getIdToken(user);
        const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/check`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok || (requireAdmin && !data.isAdmin)) {
          navigate("/login", { replace: true, state: { from: location.pathname } });
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error("Auth check failed:", error);
        navigate("/login", { replace: true, state: { from: location.pathname } });
      }
    });

    return () => unsubscribe();
  }, [auth, location.pathname, navigate, requireAdmin]);

  if (loading) return <div>Loading...</div>;

  return children;
};

export default ProtectedRoute;
