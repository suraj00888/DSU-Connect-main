import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';

/**
 * AdminRoute - A component that restricts access to admin-only routes
 * Redirects non-admin users back to the home page with an error message
 */
const AdminRoute = ({ children }) => {
  const navigate = useNavigate();
  const user = useSelector(state => state.auth.user);
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    // If user is not admin, redirect them
    if (user && !isAdmin) {
      toast.error('Access denied. Administrator privileges required.');
      navigate('/');
    }
  }, [user, isAdmin, navigate]);

  // If the user is admin, render the children components
  // Otherwise, render nothing (the useEffect will redirect)
  return isAdmin ? children : null;
};

export default AdminRoute; 