import React, { useEffect } from 'react';
import './App.css';
import { RouterProvider } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkSessionExpiry } from './features/auth/authSlice';
import TokenRefresher from './features/auth/TokenRefresher';
import socketService from './services/socketService';
import router from './routes/Routes';

function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(state => state.auth.status);
  
  // Check token validity when app loads
  useEffect(() => {
    dispatch(checkSessionExpiry());
  }, [dispatch]);

  // Initialize socket if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Initialize socket connection when user is authenticated
      socketService.connect();
      
      // Clean up socket on app unmount
      return () => {
        socketService.disconnect();
      };
    }
  }, [isAuthenticated]);

  return (
    <>
      <RouterProvider router={router} />
      {isAuthenticated && <TokenRefresher />}
    </>
  );
}

export default App; 