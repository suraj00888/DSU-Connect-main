import { createBrowserRouter } from 'react-router-dom';
import Signup from '../pages/Signup.jsx';
import Login from '../pages/Login.jsx';
import Home from '../pages/Home.jsx';
import { AuthLayout } from '../components/index.jsx';
import EventsPage from '../pages/EventsPage';
import EventDetails from '../pages/EventDetails';
import CreateEvent from '../pages/CreateEvent';
import EditEvent from '../pages/EditEvent';
import MyEvents from '../pages/MyEvents';
import ResourcesPage from '../pages/ResourcesPage';
import GroupsPage from '../pages/GroupsPage';
import GroupChatPage from '../pages/GroupChatPage';
import CreateGroupPage from '../pages/CreateGroupPage';
import ForgotPassword from '../pages/ForgotPassword.jsx';
import ResetPassword from '../pages/ResetPassword.jsx';
import ProfilePage from '../pages/ProfilePage.jsx';
import ErrorBoundary from '../components/ErrorBoundary';
import AdminRoute from '../components/AdminRoute';

// Create custom error element
const ErrorFallbackElement = () => (
  <div className="flex justify-center items-center min-h-screen bg-gray-100">
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
      <p className="text-gray-700 mb-6">
        We encountered an error loading this page. Please try again or return to the home page.
      </p>
      <div className="flex gap-2">
        <a 
          href="/groups" 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Groups
        </a>
        <a 
          href="/" 
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Home
        </a>
      </div>
    </div>
  </div>
);

// Define routes using createBrowserRouter
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthLayout authentication={true}>
        <Home />
      </AuthLayout>
    ),
  },
  {
    path: "/signup",
    element: (
      <AuthLayout authentication={false}>
        <Signup />
      </AuthLayout>
    ),
  },
  {
    path: "/login",
    element: (
      <AuthLayout authentication={false}>
        <Login />
      </AuthLayout>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <AuthLayout authentication={false}>
        <ForgotPassword />
      </AuthLayout>
    ),
  },
  {
    path: "/reset-password/:token",
    element: (
      <AuthLayout authentication={false}>
        <ResetPassword />
      </AuthLayout>
    ),
  },
  {
    path: "/profile",
    element: (
      <AuthLayout authentication={true}>
        <ProfilePage />
      </AuthLayout>
    ),
  },
  {
    path: "/events",
    element: (
      <AuthLayout authentication={true}>
        <EventsPage />
      </AuthLayout>
    ),
  },
  {
    path: "/events/create",
    element: (
      <AuthLayout authentication={true}>
        <CreateEvent />
      </AuthLayout>
    ),
  },
  {
    path: "/events/edit/:id",
    element: (
      <AuthLayout authentication={true}>
        <EditEvent />
      </AuthLayout>
    ),
  },
  {
    path: "/events/:id",
    element: (
      <AuthLayout authentication={true}>
        <EventDetails />
      </AuthLayout>
    ),
  },
  {
    path: "/my-events",
    element: (
      <AuthLayout authentication={true}>
        <MyEvents />
      </AuthLayout>
    ),
  },
  {
    path: "/resources",
    element: (
      <AuthLayout authentication={true}>
        <ResourcesPage />
      </AuthLayout>
    ),
  },
  {
    path: "/groups",
    element: (
      <AuthLayout authentication={true}>
        <ErrorBoundary>
          <GroupsPage />
        </ErrorBoundary>
      </AuthLayout>
    ),
    errorElement: <ErrorFallbackElement />
  },
  {
    path: "/groups/create",
    element: (
      <AuthLayout authentication={true}>
        <ErrorBoundary>
          <AdminRoute>
            <CreateGroupPage />
          </AdminRoute>
        </ErrorBoundary>
      </AuthLayout>
    ),
    errorElement: <ErrorFallbackElement />
  },
  {
    path: "/groups/:groupId",
    element: (
      <AuthLayout authentication={true}>
        <ErrorBoundary>
          <GroupChatPage />
        </ErrorBoundary>
      </AuthLayout>
    ),
    errorElement: <ErrorFallbackElement />
  },
  {
    // Add a catch-all route that redirects to login for any unmatched routes
    path: "*",
    element: <Login />
  }
]);

export default router; 