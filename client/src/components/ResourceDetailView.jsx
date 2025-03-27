import React from 'react';
import {
  FileText,
  FileImage,
  Presentation,
  FileSpreadsheet,
  FileArchive,
  File,
  Download,
  Calendar,
  User,
  Tag,
  Eye,
  X
} from 'lucide-react';
import { Button } from './ui/button';

/**
 * ResourceDetailView component for displaying detailed information about a resource
 * 
 * @param {Object} props
 * @param {Object} props.resource - Resource data object
 * @param {Function} props.onClose - Function to call when detail view is closed
 * @param {Function} props.onDownload - Function to call when download button is clicked
 */
const ResourceDetailView = ({ resource, onClose, onDownload }) => {
  if (!resource) return null;
  
  // Helper to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Helper to get appropriate file icon
  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) {
      return <FileText className="h-8 w-8 text-primary" />;
    } else if (fileType.includes('image')) {
      return <FileImage className="h-8 w-8 text-primary" />;
    } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
      return <Presentation className="h-8 w-8 text-primary" />;
    } else if (fileType.includes('sheet') || fileType.includes('excel')) {
      return <FileSpreadsheet className="h-8 w-8 text-primary" />;
    } else if (fileType.includes('zip') || fileType.includes('compressed')) {
      return <FileArchive className="h-8 w-8 text-primary" />;
    } else {
      return <File className="h-8 w-8 text-primary" />;
    }
  };
  
  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Get category display name
  const getCategoryName = (category) => {
    return category.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase());
  };
  
  // Handle download click
  const handleDownload = () => {
    if (onDownload) {
      onDownload(resource);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-xl font-medium truncate">{resource.title}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close detail view"
          >
            <X size={20} />
          </Button>
        </div>
        
        {/* Resource details */}
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left column - File info */}
            <div className="md:w-1/3 flex flex-col items-center">
              <div className="bg-primary/10 p-6 rounded-xl mb-4 w-full flex justify-center">
                {getFileIcon(resource.fileType)}
              </div>
              
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground mb-1">
                  {resource.fileName}
                </p>
                <p className="text-sm font-medium">
                  {formatFileSize(resource.fileSize)}
                </p>
              </div>
              
              <Button
                className="w-full mb-2"
                onClick={handleDownload}
              >
                <Download size={16} className="mr-2" />
                Download
              </Button>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(resource.fileUrl, '_blank')}
              >
                View File
              </Button>
            </div>
            
            {/* Right column - Metadata */}
            <div className="md:w-2/3">
              <h3 className="text-lg font-medium mb-2">Description</h3>
              <p className="text-muted-foreground mb-6">
                {resource.description}
              </p>
              
              <div className="space-y-4">
                {/* File details */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Resource Details</h4>
                  <div className="bg-muted/40 rounded-lg p-4 space-y-3">
                    <div className="flex items-center text-sm">
                      <Calendar size={16} className="mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Uploaded on:</span>
                      <span className="ml-auto font-medium">{formatDate(resource.createdAt)}</span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <User size={16} className="mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Uploaded by:</span>
                      <span className="ml-auto font-medium">{resource.uploader.name}</span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Tag size={16} className="mr-2 text-muted-foreground" />
                      <span className="text-muted-foreground">Category:</span>
                      <span className="ml-auto font-medium">{getCategoryName(resource.category)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Stats */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Stats</h4>
                  <div className="bg-muted/40 rounded-lg p-4 grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center p-2">
                      <div className="flex items-center text-primary mb-1">
                        <Download size={16} className="mr-1" />
                        <span className="font-medium">Downloads</span>
                      </div>
                      <span className="text-2xl font-bold">{resource.downloads}</span>
                    </div>
                    
                    <div className="flex flex-col items-center p-2">
                      <div className="flex items-center text-primary mb-1">
                        <Eye size={16} className="mr-1" />
                        <span className="font-medium">Views</span>
                      </div>
                      <span className="text-2xl font-bold">{resource.views}</span>
                    </div>
                  </div>
                </div>
                
                {/* Tags */}
                {resource.tags && resource.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {resource.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetailView; 