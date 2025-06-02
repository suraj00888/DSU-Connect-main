import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../features/auth/authSlice';
import AppLayout from '../components/AppLayout';
import Header from '../components/Header';
import { User, Mail, Shield, Eye, EyeOff, CheckCircle, AlertCircle, Camera, Upload, Trash2, X } from 'lucide-react';
import api from '../api/index.js';
import userApi from '../api/userApi.js';

const ProfilePage = () => {
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Photo upload states
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Camera states
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  // Form data states
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  
  // Password states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Show/hide password states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Error and success states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Debug: Log user object to see structure
  console.log('Current user object:', user);
  console.log('User profile photo:', user?.profilePhoto);

  // Cleanup camera stream on component unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Monitor video element availability
  useEffect(() => {
    if (showCameraModal && cameraStream && videoRef.current && !isCameraActive) {
      console.log('Video element became available, setting up stream...');
      
      // Set up the video element with the existing stream
      videoRef.current.onloadedmetadata = () => {
        console.log('Video metadata loaded (from useEffect)');
        console.log('Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
        setIsCameraActive(true);
      };
      
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(error => {
        console.error('Error playing video from useEffect:', error);
      });
    }
  }, [showCameraModal, cameraStream, isCameraActive]);

  // Camera functions
  const startCamera = async () => {
    try {
      setError(''); // Clear any previous errors
      console.log('Starting camera...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      console.log('Camera stream obtained:', stream);
      console.log('Stream tracks:', stream.getTracks());
      console.log('Video tracks:', stream.getVideoTracks());
      
      setCameraStream(stream);
      
      // Small delay to ensure video element is available
      setTimeout(() => {
        if (videoRef.current) {
          console.log('Video element found:', videoRef.current);
          
          // Set up event handlers before assigning stream
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            console.log('Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
            setIsCameraActive(true);
          };
          
          videoRef.current.oncanplay = () => {
            console.log('Video can play');
          };
          
          videoRef.current.onplaying = () => {
            console.log('Video is playing');
          };
          
          videoRef.current.onerror = (error) => {
            console.error('Video error:', error);
            setError('Error loading camera feed');
          };
          
          videoRef.current.onloadstart = () => {
            console.log('Video load started');
          };
          
          // Assign the stream
          videoRef.current.srcObject = stream;
          
          // Force video to load and play
          try {
            console.log('Attempting to load video...');
            videoRef.current.load();
            
            console.log('Attempting to play video...');
            const playPromise = videoRef.current.play();
            
            if (playPromise !== undefined) {
              playPromise.then(() => {
                console.log('Video playing successfully');
              }).catch(playError => {
                console.error('Error playing video:', playError);
                setError('Unable to start video playback: ' + playError.message);
              });
            }
          } catch (playError) {
            console.error('Error playing video:', playError);
            setError('Unable to start video playback: ' + playError.message);
          }
        } else {
          console.error('Video element not found!');
          setError('Video element not available');
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Unable to access camera. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Camera is not supported on this browser.';
      } else {
        errorMessage += 'Please check your camera and try again.';
      }
      
      setError(errorMessage);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    console.log('Stopping camera...');
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        track.stop();
        console.log('Camera track stopped:', track.kind);
      });
      setCameraStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      // Check if video has valid dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setError('Camera not ready. Please wait a moment and try again.');
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      console.log('Capturing photo with dimensions:', canvas.width, 'x', canvas.height);
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
          setCapturedPhoto({
            file,
            preview: canvas.toDataURL('image/jpeg')
          });
          stopCamera();
          console.log('Photo captured successfully');
        } else {
          setError('Failed to capture photo. Please try again.');
        }
      }, 'image/jpeg', 0.8);
    } else {
      setError('Camera not ready. Please try again.');
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const savePhotoFromCamera = () => {
    if (capturedPhoto) {
      setSelectedPhoto(capturedPhoto.file);
      setPhotoPreview(capturedPhoto.preview);
      setShowCameraModal(false);
      setCapturedPhoto(null);
      setError('');
    }
  };

  const openCameraModal = async () => {
    setShowCameraModal(true);
    setError('');
    setIsCameraActive(false);
    
    // Small delay to ensure modal is rendered
    setTimeout(async () => {
      await startCamera();
    }, 100);
  };

  const closeCameraModal = () => {
    setShowCameraModal(false);
    stopCamera();
    setCapturedPhoto(null);
    setError(''); // Clear any camera-related errors
  };
  
  // Handle input changes for profile form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Handle input changes for password form
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value,
    });
  };
  
  // Handle profile update submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      // API call to update user profile
      const response = await api.put('/api/user/profile', formData);
      
      // Update the user in Redux store
      dispatch(updateUser(response.data.user));
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle password change submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      // API call to update password
      await api.put('/api/user/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      setSuccess('Password updated successfully!');
      setIsChangingPassword(false);
      
      // Reset form data
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
    });
    setError('');
  };
  
  // Toggle password change mode
  const togglePasswordMode = () => {
    setIsChangingPassword(!isChangingPassword);
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setError('');
  };
  
  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false);
    setIsChangingPassword(false);
    setError('');
  };

  // Handle photo selection
  const handlePhotoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      setSelectedPhoto(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async () => {
    if (!selectedPhoto) return;
    
    setUploadingPhoto(true);
    setError('');
    
    try {
      const response = await userApi.uploadProfilePhoto(selectedPhoto);
      console.log('Upload response:', response);
      console.log('Profile photo data:', response.data?.profilePhoto);
      
      // Update user in Redux store with new profile photo
      dispatch(updateUser({
        ...user,
        profilePhoto: response.data?.profilePhoto
      }));
      
      setSuccess('Profile photo updated successfully!');
      setSelectedPhoto(null);
      setPhotoPreview(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.message || 'Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Handle photo deletion
  const handlePhotoDelete = async () => {
    setUploadingPhoto(true);
    setError('');
    
    try {
      await userApi.deleteProfilePhoto();
      
      // Update user in Redux store to remove profile photo
      dispatch(updateUser({
        ...user,
        profilePhoto: null
      }));
      
      setSuccess('Profile photo deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (error) {
      setError(error.message || 'Failed to delete photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Cancel photo selection
  const handlePhotoCancelSelection = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <AppLayout>
      <Header title="Profile" />
      
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="max-w-3xl mx-auto">
          {/* Success message */}
          {success && (
            <div className="mb-6 bg-gradient-to-r from-green-500/20 to-green-500/5 backdrop-blur-sm rounded-lg shadow-sm p-4 animate-fade-in">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="mb-6 bg-gradient-to-r from-destructive/20 to-destructive/5 backdrop-blur-sm rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Profile Card */}
          <div className="bg-card/90 backdrop-blur-sm rounded-xl shadow-lg p-6 sm:p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar with Photo Upload */}
              <div className="relative">
                <div className="h-24 w-24 rounded-full overflow-hidden flex items-center justify-center text-white text-2xl font-medium border-4 border-primary/20"
                     style={{ 
                       backgroundColor: user?.name 
                         ? `hsl(${user.name.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0) % 360}, 70%, 50%)`
                         : 'hsl(215, 70%, 50%)' 
                     }}>
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="Profile preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : user?.profilePhoto?.fileUrl ? (
                    <img 
                      src={user.profilePhoto.fileUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user?.name 
                      ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                      : 'U'
                  )}
                </div>
                
                {/* Photo Upload Options */}
                <div className="absolute -bottom-2 -right-2 flex gap-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-full shadow-lg transition-colors"
                    disabled={uploadingPhoto}
                    title="Upload from device"
                  >
                    <Upload className="h-4 w-4" />
                  </button>
                  <button
                    onClick={openCameraModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors"
                    disabled={uploadingPhoto}
                    title="Capture from camera"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </div>
              
              {/* Photo Upload Controls */}
              {(selectedPhoto || user?.profilePhoto?.fileUrl) && (
                <div className="flex flex-col gap-2">
                  {selectedPhoto && (
                    <div className="flex gap-2">
                      <button
                        onClick={handlePhotoUpload}
                        disabled={uploadingPhoto}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md transition-colors disabled:opacity-50"
                      >
                        {uploadingPhoto ? (
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        Upload
                      </button>
                      <button
                        onClick={handlePhotoCancelSelection}
                        className="px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  
                  {user?.profilePhoto?.fileUrl && !selectedPhoto && (
                    <button
                      onClick={handlePhotoDelete}
                      disabled={uploadingPhoto}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md transition-colors disabled:opacity-50"
                    >
                      {uploadingPhoto ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Remove Photo
                    </button>
                  )}
                </div>
              )}
              
              {/* User Info */}
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-2xl font-bold text-card-foreground">{user?.name || 'User'}</h2>
                <p className="text-muted-foreground mt-1">{user?.email || 'email@example.com'}</p>
                <div className="mt-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Camera Modal */}
          {showCameraModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-card rounded-xl shadow-2xl max-w-md w-full">
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <h3 className="text-lg font-semibold text-card-foreground">
                    {capturedPhoto ? 'Photo Captured' : 'Take Photo'}
                  </h3>
                  <button
                    onClick={closeCameraModal}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="p-4">
                  {capturedPhoto ? (
                    // Show captured photo
                    <div className="space-y-4">
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={capturedPhoto.preview} 
                          alt="Captured" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={retakePhoto}
                          className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
                        >
                          Retake
                        </button>
                        <button
                          onClick={savePhotoFromCamera}
                          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                        >
                          Save Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Show camera feed
                    <div className="space-y-4">
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                        {/* Always render video element for ref attachment */}
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          controls={false}
                          width="100%"
                          height="100%"
                          className={`w-full h-full object-cover bg-black ${isCameraActive ? 'block' : 'hidden'}`}
                          style={{ transform: 'scaleX(-1)' }} // Mirror effect for selfie
                          onLoadedMetadata={() => {
                            console.log('Video onLoadedMetadata event fired');
                            setIsCameraActive(true);
                          }}
                          onCanPlay={() => {
                            console.log('Video onCanPlay event fired');
                          }}
                          onPlaying={() => {
                            console.log('Video onPlaying event fired');
                          }}
                          onError={(e) => {
                            console.error('Video onError event:', e);
                            setError('Video playback error');
                          }}
                        />
                        
                        {/* Loading overlay - shown when camera is not active */}
                        {!isCameraActive && (
                          <div className="absolute inset-0 w-full h-full flex items-center justify-center text-muted-foreground bg-gray-200">
                            <div className="text-center">
                              <Camera className="h-12 w-12 mx-auto mb-2" />
                              <p className="text-sm">
                                {cameraStream ? 'Loading camera...' : 'Starting camera...'}
                              </p>
                              {error && (
                                <p className="text-xs text-red-500 mt-2 max-w-xs">
                                  {error}
                                </p>
                              )}
                              {cameraStream && !isCameraActive && (
                                <button
                                  onClick={() => {
                                    console.log('Manual video setup triggered');
                                    console.log('Video ref current:', videoRef.current);
                                    if (videoRef.current && cameraStream) {
                                      console.log('Setting srcObject manually...');
                                      videoRef.current.srcObject = cameraStream;
                                      videoRef.current.play().then(() => {
                                        console.log('Manual play successful');
                                        setIsCameraActive(true);
                                      }).catch(err => {
                                        console.error('Manual play failed:', err);
                                      });
                                    } else {
                                      console.log('Video ref or stream not available:', {
                                        videoRef: !!videoRef.current,
                                        cameraStream: !!cameraStream
                                      });
                                    }
                                  }}
                                  className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                >
                                  Force Start Video
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Debug info - remove in production */}
                        {import.meta.env.DEV && (
                          <div className="absolute top-2 left-2 bg-black/50 text-white text-xs p-1 rounded z-10">
                            Stream: {cameraStream ? '✓' : '✗'} | 
                            Active: {isCameraActive ? '✓' : '✗'} |
                            Video: {videoRef.current?.videoWidth || 0}x{videoRef.current?.videoHeight || 0} |
                            Ref: {videoRef.current ? '✓' : '✗'}
                          </div>
                        )}
                      </div>
                      
                      {isCameraActive && (
                        <button
                          onClick={capturePhoto}
                          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors flex items-center justify-center gap-2"
                        >
                          <Camera className="h-4 w-4" />
                          Capture Photo
                        </button>
                      )}
                      
                      {/* Retry button if camera fails */}
                      {error && !isCameraActive && (
                        <button
                          onClick={startCamera}
                          className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors flex items-center justify-center gap-2"
                        >
                          <Camera className="h-4 w-4" />
                          Retry Camera
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Hidden canvas for photo capture */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Profile Details / Edit Form */}
          <div className="bg-card/90 backdrop-blur-sm rounded-xl shadow-lg p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-card-foreground">Profile Details</h3>
              {!isEditing && !isChangingPassword && (
                <button 
                  onClick={toggleEditMode}
                  className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md transition-colors"
                >
                  Edit Profile
                </button>
              )}
            </div>
            
            {isEditing ? (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="flex items-center">
                  <label htmlFor="name" className="text-sm font-medium text-muted-foreground w-1/4">Full Name</label>
                  <div className="relative w-3/4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card"
                      placeholder="Your Full Name"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex items-center">
                  <label htmlFor="email" className="text-sm font-medium text-muted-foreground w-1/4">Email Address</label>
                  <div className="relative w-3/4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card"
                      placeholder="Your Email Address"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="text-sm bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md transition-colors flex items-center"
                    disabled={loading}
                  >
                    {loading && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    Save Changes
                  </button>
                </div>
              </form>
            ) : isChangingPassword ? (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="flex items-center">
                  <label htmlFor="currentPassword" className="text-sm font-medium text-muted-foreground w-1/4">Current Password</label>
                  <div className="relative w-3/4">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="block w-full pl-3 pr-10 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card"
                      placeholder="Your Current Password"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground focus:outline-none"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <label htmlFor="newPassword" className="text-sm font-medium text-muted-foreground w-1/4">New Password</label>
                  <div className="relative w-3/4">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="block w-full pl-3 pr-10 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card"
                      placeholder="Your New Password"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground focus:outline-none"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-muted-foreground w-1/4">Confirm New Password</label>
                  <div className="relative w-3/4">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="block w-full pl-3 pr-10 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card"
                      placeholder="Confirm New Password"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground focus:outline-none"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="text-sm bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md transition-colors flex items-center"
                    disabled={loading}
                  >
                    {loading && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    Update Password
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="space-y-6">
                  <div className="flex items-center">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="text-foreground">{user?.name || 'Not set'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-muted-foreground">Email Address</p>
                      <p className="text-foreground">{user?.email || 'Not set'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-muted-foreground">Role</p>
                      <p className="text-foreground">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-border">
                  <button 
                    onClick={togglePasswordMode}
                    className="w-full text-center px-4 py-2.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                  >
                    Change Password
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

export default ProfilePage; 