import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { logout, checkSessionExpiry } from "../features/auth/authSlice";
import api from "../api/index.js";
import resourcesApi from "../api/resourcesApi.js";
import eventsApi from "../api/eventsApi.js";
import AppLayout from "../components/AppLayout";
import Header from "../components/Header";
import { Calendar, BookOpen, AlertCircle, CheckCircle, Download, FileText, Eye, Clock, MapPin, Users } from "lucide-react";

const HomePage = () => {
  const [sessionExpired, setSessionExpired] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [recentResources, setRecentResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();

  // Utility function to get file type icon
  const getFileTypeIcon = (fileType) => {
    if (fileType?.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (fileType?.includes('image')) return <FileText className="h-5 w-5 text-green-500" />;
    if (fileType?.includes('video')) return <FileText className="h-5 w-5 text-blue-500" />;
    if (fileType?.includes('audio')) return <FileText className="h-5 w-5 text-purple-500" />;
    if (fileType?.includes('text') || fileType?.includes('document')) return <FileText className="h-5 w-5 text-gray-500" />;
    return <FileText className="h-5 w-5 text-primary" />;
  };

  // Utility function to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Check for success message in location state
  useEffect(() => {
    if (location.state?.successMessage) {
      setSuccessMessage(location.state.successMessage);
      // Clear the state after reading it to prevent showing the message after page refresh
      window.history.replaceState({}, document.title);
      
      // Auto-hide success message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location]);

  // Check token validity
  useEffect(() => {
    const checkToken = async () => {
      const result = await dispatch(checkSessionExpiry());
      if (result.payload && !result.payload.valid) {
        setSessionExpired(true);
      }
    };
    checkToken();
  }, [dispatch]);

  // Fetch recent resources
  const fetchRecentResources = async () => {
    try {
      setLoadingResources(true);
      const response = await resourcesApi.getResources({ 
        limit: 6, // Show only 6 most recent resources
        page: 1 
      });
      
      if (response.success && response.data?.resources) {
        setRecentResources(response.data.resources);
      }
    } catch (error) {
      console.error('Failed to fetch recent resources:', error);
    } finally {
      setLoadingResources(false);
    }
  };

  // Fetch upcoming events
  const fetchUpcomingEvents = async () => {
    try {
      setLoadingEvents(true);
      const events = await eventsApi.getEvents({ 
        limit: 3, // Show only 3 upcoming events
        page: 1,
        status: 'upcoming'
      });
      
      if (Array.isArray(events)) {
        setUpcomingEvents(events.slice(0, 3));
      }
    } catch (error) {
      console.error('Failed to fetch upcoming events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchRecentResources();
    fetchUpcomingEvents();
  }, []);

  const handleLogout = async () => {
    try {
      // Use axios instead of fetch
      await api.post("/api/auth/logout");
      
      // Whether the server logout was successful or not, we still logout locally
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still logout locally even if an error occurs
      dispatch(logout());
      navigate("/login");
    }
  };

  return (
    <AppLayout>
      <Header title="Home" />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {successMessage && (
          <div className="mb-6 bg-gradient-to-r from-green-500/20 to-green-500/5 backdrop-blur-sm rounded-lg shadow-sm p-4 animate-fade-in">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        {sessionExpired && (
          <div className="mb-6 bg-gradient-to-r from-destructive/20 to-destructive/5 backdrop-blur-sm rounded-lg shadow-sm p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-destructive">
                  Your session has expired. Please{" "}
                  <button
                    onClick={handleLogout}
                    className="font-medium underline text-destructive hover:text-destructive/80 transition-colors"
                  >
                    log in
                  </button>{" "}
                  again.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-foreground">Welcome, {user?.name || "User"}!</h2>
          <p className="text-muted-foreground">
            Stay updated with upcoming events and access the latest course materials.
          </p>
        </div>

        {/* Upcoming Events Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Upcoming Events</h2>
            <Link 
              to="/events" 
              className="text-primary hover:text-primary/80 transition-colors text-sm font-medium"
            >
              View All →
            </Link>
          </div>

          {loadingEvents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-card/90 backdrop-blur-sm rounded-xl shadow-lg p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3 mb-4"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <div 
                  key={event._id} 
                  className="bg-card/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
                  onClick={() => navigate(`/events/${event._id}`)}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="bg-primary/10 p-2 rounded-lg mr-3 group-hover:bg-primary/20 transition-colors">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-card-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {event.title}
                          </h3>
                          <p className="text-xs text-muted-foreground capitalize">
                            {event.category}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                        event.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {event.description}
                    </p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-2" />
                        <span>{new Date(event.startDate).toLocaleDateString()} at {new Date(event.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3 mr-2" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{event.attendees?.length || 0} attending</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        By {event.organizer?.name || 'DSU Connect'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card/90 backdrop-blur-sm rounded-xl shadow-lg p-8 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">No Upcoming Events</h3>
              <p className="text-muted-foreground mb-4">
                Stay tuned for exciting events and activities coming your way.
              </p>
              <Link
                to="/events"
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Browse Events
              </Link>
            </div>
          )}
        </div>

        {/* Recent Resources Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Recent Resources</h2>
            <Link 
              to="/resources" 
              className="text-primary hover:text-primary/80 transition-colors text-sm font-medium"
            >
              View All →
            </Link>
          </div>

          {loadingResources ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-card/90 backdrop-blur-sm rounded-xl shadow-lg p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3 mb-4"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : recentResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentResources.map((resource) => (
                <div 
                  key={resource._id} 
                  className="bg-card/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="bg-primary/10 p-2 rounded-lg mr-3 group-hover:bg-primary/20 transition-colors">
                          {getFileTypeIcon(resource.fileType)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-card-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {resource.title}
                          </h3>
                          <p className="text-xs text-muted-foreground capitalize">
                            {resource.category}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {resource.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          <span>{resource.views || 0} views</span>
                        </div>
                        <span>{formatFileSize(resource.fileSize)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        By {resource.uploader?.name || 'Unknown'}
                      </span>
                      <Link
                        to={`/resources`}
                        className="inline-flex items-center text-primary hover:text-primary/80 transition-colors text-sm font-medium"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card/90 backdrop-blur-sm rounded-xl shadow-lg p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-card-foreground mb-2">No Resources Yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to share course materials and resources with your peers.
              </p>
              <Link
                to="/resources"
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Resources
              </Link>
            </div>
          )}
        </div>
      </main>
    </AppLayout>
  );
};

export default HomePage; 