import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Calendar, Clock, MapPin, Users, ChevronLeft, Edit, Trash2, Share2, AlertCircle, ChevronDown, ChevronUp, UserCheck, Download, QrCode } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import Header from '../components/Header';
import AttendanceModal from '../components/AttendanceModal';
import { Button } from '../components/ui/button';
import eventsApi from '../api/eventsApi';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [registering, setRegistering] = useState(false);
  const [unregistering, setUnregistering] = useState(false);
  const [attendeesOpen, setAttendeesOpen] = useState(false);
  const [attendanceModal, setAttendanceModal] = useState({
    isOpen: false,
    event: null
  });
  const [downloadingQR, setDownloadingQR] = useState(false);
  const user = useSelector((state) => state.auth.user);
  
  // Check if user is registered for the event - use isAttending from backend or check attendees array
  const isRegistered =  
    // First check if backend provided the isAttending flag (preferred)
    event?.isAttending || 
    // Fallback to checking the attendees array
    event?.attendees?.some(attendee => 
      // Check appropriate structure - attendee.userId is from MongoDB, so it should have _id
      (attendee.userId?._id === user?.id) || 
      (attendee.userId === user?.id) ||
      (attendee.userId?.toString() === user?.id?.toString())
    ) || 
    false;
  
  // Check if user is the organizer of the event
  // event.organizer.id comes from the organizer field in MongoDB and is already mapped to 'id'
  const isOrganizer = event?.isOrganizer || (event?.organizer?.id === user?.id);
 
  // Check if user is an admin
  const isAdmin = user?.role === 'admin' || event?.isAdmin;
  
  // Check if user can mark attendance (organizer or admin)
  const canMarkAttendance = user && (
    user.role === 'admin' || 
    event?.isOrganizer || 
    (event?.organizer?.id && (
      event.organizer.id.toString() === user.id?.toString() || 
      event.organizer.id.toString() === user._id?.toString()
    ))
  );
  
  // Check if the user can register (not an admin, event not at capacity, etc.)
  const canRegister = event?.canRegister !== undefined 
    ? event.canRegister 
    : (!isAdmin && !isRegistered && !event?.isAtCapacity && event?.status === 'upcoming');
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Format time for display
  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };
  
  // Format date range for display
  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // If same day event
    if (start.toDateString() === end.toDateString()) {
      return `${formatDate(startDate)} • ${formatTime(startDate)} - ${formatTime(endDate)}`;
    }
    
    // Multi-day event
    return `${formatDate(startDate)} ${formatTime(startDate)} - ${formatDate(endDate)} ${formatTime(endDate)}`;
  };
  
  // Get status style
  const getStatusStyle = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get category style
  const getCategoryStyle = (category) => {
    switch (category) {
      case 'academic':
        return 'bg-indigo-100 text-indigo-800';
      case 'social':
        return 'bg-pink-100 text-pink-800';
      case 'career':
        return 'bg-amber-100 text-amber-800';
      case 'sports':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Fetch event data
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const eventData = await eventsApi.getEvent(id);
        if (eventData && typeof eventData === 'object') {
          setEvent(eventData);
          setError(null);
        } else {
          setError('Invalid event data received');
        }
      } catch (err) {
        console.error('Failed to fetch event details:', err);
        setError('Failed to load event details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEventDetails();
  }, [id]);
  
  // Handle event registration
  const handleRegister = async () => {
    try {
      setRegistering(true);
      await eventsApi.registerForEvent(id);
      
      // Refetch event to update attendee list
      const updatedEvent = await eventsApi.getEvent(id);
      
      if (updatedEvent && typeof updatedEvent === 'object') {
        setEvent(updatedEvent);
      } else {
        console.error("Failed to get updated event data");
      }
    } catch (err) {
      console.error('Failed to register for event:', err);
      
      // Handle different error messages from server
      const errorMessage = err.response?.data?.message;
      
      if (errorMessage === 'This event has reached its maximum capacity') {
        // Refetch event to ensure UI shows latest capacity data
        try {
          const updatedEvent = await eventsApi.getEvent(id);
          if (updatedEvent) {
            setEvent(updatedEvent);
          }
        } catch (refreshErr) {
          console.error('Failed to refresh event data:', refreshErr);
        }
        
        // Show capacity error message
        alert('This event has reached its maximum capacity. Please try another event.');
      } 
      else if (errorMessage === 'Administrators cannot register for events') {
        alert('As an administrator, you cannot register for events.');
      }
      else {
        // Show generic error message
        alert(`Failed to register: ${errorMessage || 'Unknown error occurred'}`);
      }
      
    } finally {
      setRegistering(false);
    }
  };
  
  // Handle cancelling registration
  const handleCancelRegistration = async () => {
    try {
      setUnregistering(true);
      await eventsApi.cancelRegistration(id);
      
      // Refetch event to update attendee list
      const updatedEvent = await eventsApi.getEvent(id);
      
      if (updatedEvent && typeof updatedEvent === 'object') {
        setEvent(updatedEvent);
      } else {
        console.error("Failed to get updated event data");
      }
    } catch (err) {
      console.error('Failed to cancel registration:', err);
      // Show error toast or message
    } finally {
      setUnregistering(false);
    }
  };
  
  // Handle edit event
  const handleEditEvent = () => {
    navigate(`/events/edit/${id}`);
  };
  
  // Handle delete event
  const handleDeleteEvent = async () => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await eventsApi.deleteEvent(id);
        navigate('/events', { 
          state: { message: 'Event deleted successfully', type: 'success' } 
        });
      } catch (err) {
        console.error('Failed to delete event:', err);
        // Show error toast or message
      }
    }
  };
  
  // Go back to events page
  const goBack = () => {
    navigate('/events');
  };
  
  // Handle share event
  const handleShareEvent = () => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: `Check out this event: ${event.title}`,
        url: window.location.href,
      });
    } else {
      // Copy to clipboard fallback
      navigator.clipboard.writeText(window.location.href);
      alert('Event link copied to clipboard!');
    }
  };
  
  // Handle mark attendance
  const handleMarkAttendance = () => {
    setAttendanceModal({
      isOpen: true,
      event: event
    });
  };
  
  // Handle QR code download
  const handleDownloadQR = async () => {
    try {
      setDownloadingQR(true);
      
      // Get QR code blob from API
      const qrBlob = await eventsApi.downloadQRCode(id);
      
      // Create download link
      const url = window.URL.createObjectURL(qrBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `event-qr-${event.title.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download QR code:', err);
      alert('Failed to download QR code. Please try again.');
    } finally {
      setDownloadingQR(false);
    }
  };
  
  // Close attendance modal
  const closeAttendanceModal = () => {
    setAttendanceModal({
      isOpen: false,
      event: null
    });
  };
  
  // Handle attendance update
  const handleAttendanceUpdate = (stats) => {
    // Optionally refresh event data or update local state
    console.log('Attendance updated:', stats);
  };

  // Download attendance report as CSV
  const downloadAttendanceReport = async () => {
    try {
      // Get the latest attendance data
      const attendanceResponse = await eventsApi.getAttendanceList(id);
      
      // Extract attendees array from the response
      const attendanceData = attendanceResponse?.attendees || [];
      
      // Create CSV content
      const csvContent = generateAttendanceCSV(event, attendanceData);
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_attendance_report.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download attendance report:', error);
      alert('Failed to download attendance report. Please try again.');
    }
  };

  // Generate CSV content for attendance report
  const generateAttendanceCSV = (eventData, attendanceData) => {
    const csvRows = [];
    
    // Event header information
    csvRows.push(['Event Attendance Report']);
    csvRows.push(['']);
    csvRows.push(['Event Name:', eventData.title]);
    csvRows.push(['Event Date:', formatDateRange(eventData.startDate, eventData.endDate)]);
    csvRows.push(['Location:', eventData.location]);
    csvRows.push(['Organizer:', eventData.organizer?.name || 'DSU Connect']);
    csvRows.push(['Total Registered:', eventData.attendees?.length || 0]);
    csvRows.push(['Report Generated:', new Date().toLocaleString()]);
    csvRows.push(['']);
    
    // Attendance data headers
    csvRows.push(['Name', 'Registration Date', 'Attendance Status', 'Marked Present At']);
    
    // Process attendance data
    if (attendanceData && attendanceData.length > 0) {
      attendanceData.forEach((attendee) => {
        const name = attendee.name || 'Unknown';
        const registrationDate = attendee.registeredAt ? new Date(attendee.registeredAt).toLocaleDateString() : 'N/A';
        
        // More explicit attendance status checking
        let attendanceStatus;
        if (attendee.attended === true) {
          attendanceStatus = 'Present';
        } else if (attendee.attended === false) {
          attendanceStatus = 'Absent';
        } else if (attendee.attended === null || attendee.attended === undefined) {
          attendanceStatus = 'Not Marked';
        } else {
          attendanceStatus = 'Unknown';
        }
        
        const markedPresentAt = attendee.attendedAt ? new Date(attendee.attendedAt).toLocaleString() : 'N/A';
        
        csvRows.push([name, registrationDate, attendanceStatus, markedPresentAt]);
      });
    } else if (eventData.attendees && eventData.attendees.length > 0) {
      // Fallback to basic attendee list if detailed attendance data is not available
      eventData.attendees.forEach((attendee) => {
        const name = attendee.name || (attendee.userId?.name) || 'Unknown';
        const registrationDate = attendee.registeredAt ? new Date(attendee.registeredAt).toLocaleDateString() : 'N/A';
        
        // Check if this attendee has attendance data
        let attendanceStatus;
        if (attendee.attended === true) {
          attendanceStatus = 'Present';
        } else if (attendee.attended === false) {
          attendanceStatus = 'Absent';
        } else {
          attendanceStatus = 'Not Marked';
        }
        
        const markedPresentAt = attendee.attendedAt ? new Date(attendee.attendedAt).toLocaleString() : 'N/A';
        
        csvRows.push([name, registrationDate, attendanceStatus, markedPresentAt]);
      });
    } else {
      csvRows.push(['No attendees registered for this event']);
    }
    
    // Convert to CSV string
    return csvRows.map(row => 
      row.map(field => 
        typeof field === 'string' && field.includes(',') 
          ? `"${field.replace(/"/g, '""')}"` 
          : field
      ).join(',')
    ).join('\n');
  };
  
  // Toggle attendees dropdown with logging
  const toggleAttendeesDropdown = () => {
    const newState = !attendeesOpen;
    setAttendeesOpen(newState);
  };
  
  // Display loading state
  if (loading) {
    return (
      <AppLayout>
        <Header title="Event Details" />
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="bg-card/90 backdrop-blur-sm rounded-xl shadow-lg p-6 sm:p-7 md:p-8">
            <div className="flex justify-center items-center h-64">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-4 text-muted-foreground">Loading event details...</p>
            </div>
          </div>
        </main>
      </AppLayout>
    );
  }
  
  // Display error state
  if (error) {
    return (
      <AppLayout>
        <Header title="Event Details" />
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="bg-card/90 backdrop-blur-sm rounded-xl shadow-lg p-6 sm:p-7 md:p-8">
            <div className="flex flex-col items-center justify-center h-64">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="mt-4 text-destructive">{error}</p>
              <div className="mt-6 flex gap-4">
                <Button variant="outline" onClick={goBack}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back to Events
                </Button>
                <Button onClick={() => window.location.reload()}>Try Again</Button>
              </div>
            </div>
          </div>
        </main>
      </AppLayout>
    );
  }
  
  // If event is not found or not loaded yet
  if (!event) {
    return (
      <AppLayout>
        <Header title="Event Not Found" />
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="bg-card/90 backdrop-blur-sm rounded-xl shadow-lg p-6 sm:p-7 md:p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
            <h2 className="mt-4 text-lg font-medium">Event Not Found</h2>
            <p className="mt-2 text-muted-foreground">The event you're looking for doesn't seem to exist.</p>
            <Button className="mt-6" onClick={goBack}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
          </div>
        </main>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <Header title="Event Details" />
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="bg-card/90 backdrop-blur-sm rounded-xl shadow-lg p-6 sm:p-7 md:p-8">
          {/* Back button and Action buttons */}
          <div className="flex justify-between items-center mb-6">
            <Button variant="ghost" size="sm" onClick={goBack}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Events
            </Button>
            
            <div className="flex gap-2">
              {/* Share button */}
              <Button variant="outline" size="sm" onClick={handleShareEvent}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              
              {/* Mark Attendance button - only for organizers and admins */}
              {canMarkAttendance && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleMarkAttendance}
                  disabled={!event.attendees || event.attendees.length === 0}
                  title={event.attendees && event.attendees.length > 0 ? "Mark Attendance" : "No attendees yet"}
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Mark Attendance
                </Button>
              )}
              
              {/* Download Attendance Report button - only for organizers and admins */}
              {canMarkAttendance && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadAttendanceReport}
                  disabled={!event.attendees || event.attendees.length === 0}
                  title={event.attendees && event.attendees.length > 0 ? "Download Attendance Report" : "No attendees to report"}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              )}
              
              {/* Edit button - only for event organizer */}
              {isOrganizer && (
                <Button variant="outline" size="sm" onClick={handleEditEvent}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              
              {/* Delete button - for admin or organizer */}
              {(isAdmin || isOrganizer) && (
                <Button variant="destructive" size="sm" onClick={handleDeleteEvent}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
          
          {/* Event Header with title and badges */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(event.status)}`}>
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </span>
              
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryStyle(event.category)}`}>
                {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
              </span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{event.title}</h1>
            
            {/* Organizer info */}
            <p className="text-sm text-muted-foreground mt-2">
              Organized by {event.organizer?.name || 'DSU Connect'}
            </p>
          </div>
          
          {/* Event details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="md:col-span-2">
              {/* Description */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">About this event</h2>
                <p className="text-foreground whitespace-pre-line">{event.description}</p>
              </div>
              
              {/* Additional details if any */}
              {event.additionalDetails && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-3">Additional Details</h2>
                  <p className="text-foreground whitespace-pre-line">{event.additionalDetails}</p>
                </div>
              )}
            </div>
            
            <div className="bg-background/50 rounded-xl p-5 border border-border h-fit">
              {/* Date and time */}
              <div className="flex items-start mb-4">
                <div className="bg-primary/10 p-2 rounded-full mr-3">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">Date and Time</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatDateRange(event.startDate, event.endDate)}
                  </p>
                </div>
              </div>
              
              {/* Location */}
              <div className="flex items-start mb-4">
                <div className="bg-primary/10 p-2 rounded-full mr-3">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">Location</h3>
                  <p className="text-sm text-muted-foreground mt-1">{event.location}</p>
                </div>
              </div>
              
              {/* Capacity */}
              <div className="flex items-start mb-6">
                <div className="bg-primary/10 p-2 rounded-full mr-3">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">Attendees</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {event.attendees?.length || 0} 
                    {event.capacity ? ` / ${event.capacity}` : ''} 
                    {event.capacity ? ' spots filled' : ' registered'}
                  </p>
                  {event.capacity && (
                    <p className={`text-xs mt-1 ${event.isAtCapacity ? 'text-destructive' : 'text-green-600'}`}>
                      {event.isAtCapacity 
                        ? 'Event is at full capacity' 
                        : `${event.spotsRemaining} spot${event.spotsRemaining !== 1 ? 's' : ''} remaining`}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Registration button */}
              {event.status === 'upcoming' && (
                <>
                  {/* Registration status indicator */}
                  {isRegistered && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3 flex items-center justify-center text-green-700">
                      <Users className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">You are registered for this event</span>
                    </div>
                  )}
                
                  {isRegistered ? (
                    <div className="space-y-2">
                      {/* QR Code Download Button */}
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={handleDownloadQR}
                        disabled={downloadingQR}
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        {downloadingQR ? 'Downloading...' : 'Download QR Code'}
                      </Button>
                      
                      {/* Cancel Registration Button */}
                      <Button 
                        variant="destructive" 
                        className="w-full" 
                        onClick={handleCancelRegistration}
                        disabled={unregistering}
                      >
                        {unregistering ? 'Cancelling...' : 'Cancel Registration'}
                      </Button>
                    </div>
                  ) : (
                    <>
                      {!isAdmin ? (
                        <Button 
                          className="w-full" 
                          onClick={handleRegister}
                          disabled={registering || event.isAtCapacity || !canRegister}
                        >
                          {registering ? 'Registering...' : 'Register Now'}
                        </Button>
                      ) : (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 flex items-center justify-center text-amber-700">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">Administrators cannot register for events</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Capacity warning */}
                  {event.isAtCapacity && !isRegistered && !isAdmin && (
                    <p className="mt-2 text-xs text-center text-destructive">
                      This event has reached its capacity.
                    </p>
                  )}
                </>
              )}
              
              {/* Past event message */}
              {event.status === 'completed' && (
                <div className="bg-muted p-3 rounded-lg text-sm text-center">
                  This event has already taken place.
                </div>
              )}
              
              {/* Ongoing event message */}
              {event.status === 'ongoing' && !isRegistered && (
                <div className="bg-muted p-3 rounded-lg text-sm text-center">
                  This event is currently in progress.
                </div>
              )}
              
              {/* Cancelled event message */}
              {event.status === 'cancelled' && (
                <div className="bg-destructive/10 p-3 rounded-lg text-sm text-center text-destructive">
                  This event has been cancelled.
                </div>
              )}
            </div>
          </div>
          
          {/* Attendees dropdown section */}
          {(event.attendees?.length > 0) && (
            <div className="mt-8">
              <button 
                onClick={toggleAttendeesDropdown}
                className="w-full flex items-center justify-between bg-background/60 rounded-lg p-5 border border-border hover:bg-background/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Attendees ({event.attendees.length})</h2>
                </div>
                {attendeesOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              
              {/* Attendee list (collapsible) */}
              {attendeesOpen && (
                <div className="mt-2 bg-background/60 rounded-lg p-5 border border-border max-h-80 overflow-y-auto">
                  {event.attendees && event.attendees.length > 0 ? (
                    <ul className="divide-y divide-border">
                      {event.attendees.map((attendee, index) => {
                        // Extract the name from the attendee object, handling different structures
                        const attendeeName = attendee.name || 
                                           (attendee.userId && typeof attendee.userId === 'object' && attendee.userId.name) || 
                                           'Unknown';
                        
                        // Extract first letter for avatar
                        const firstLetter = attendeeName.charAt(0);
                        
                        // Unique key for list item
                        const attendeeKey = attendee.userId || attendee._id || index;
                        
                        return (
                          <li key={attendeeKey} className="py-2 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                              {firstLetter || '?'}
                            </div>
                            <span className="font-medium">{attendeeName}</span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No attendees information available</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Attendance Modal */}
      <AttendanceModal
        isOpen={attendanceModal.isOpen}
        onClose={closeAttendanceModal}
        event={attendanceModal.event}
        onAttendanceUpdate={handleAttendanceUpdate}
      />
    </AppLayout>
  );
};

export default EventDetails; 