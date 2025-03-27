import React, { useState } from 'react';
import { X } from 'lucide-react';
import ResourceUploadForm from './ResourceUploadForm';
import { Button } from './ui/button';

/**
 * ResourceUploadModal component for displaying the resource upload form in a modal
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when modal is closed
 * @param {Function} props.onSubmit - Function to call when form is submitted
 */
const ResourceUploadModal = ({ isOpen, onClose, onSubmit }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  if (!isOpen) return null;
  
  // Handle form submission
  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call the onSubmit function with the form data
      await onSubmit(formData);
      
      // Show success message
      setSuccess(true);
      
      // Close the modal after a delay
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
      
    } catch (err) {
      console.error('Error uploading resource:', err);
      setError(err.message || 'Failed to upload resource. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle modal close
  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      setSuccess(false);
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-xl font-medium">Upload Resource</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Close modal"
          >
            <X size={20} />
          </Button>
        </div>
        
        {/* Modal content */}
        <div className="p-6">
          {success ? (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md flex flex-col items-center">
              <svg className="h-12 w-12 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-center">Resource uploaded successfully!</p>
              <p className="text-sm text-green-600 mt-1">Closing this window...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-md mb-6">
                  <p>{error}</p>
                </div>
              )}
              
              <ResourceUploadForm
                onSubmit={handleSubmit}
                onCancel={handleClose}
                isLoading={isLoading}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceUploadModal; 