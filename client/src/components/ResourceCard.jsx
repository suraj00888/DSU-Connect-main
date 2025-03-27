import React from 'react';
import { 
  FileText, 
  FileImage, 
  Presentation, 
  FileSpreadsheet, 
  FileArchive, 
  File, 
  Download, 
  Eye, 
  Trash2 
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { Button } from './ui/button';

/**
 * ResourceCard component for displaying resource information
 * 
 * @param {Object} props
 * @param {Object} props.resource - Resource data object
 * @param {Function} props.onDelete - Function to call when delete button is clicked
 * @param {Function} props.onDownload - Function to call when download button is clicked
 * @param {Function} props.onView - Function to call when view button is clicked
 */
const ResourceCard = ({ resource, onDelete, onDownload, onView }) => {
  const { user } = useSelector(state => state.auth);
  const isAdmin = user?.role === 'admin';
  const isUploader = resource?.uploader?.id === user?._id;
  const canDelete = isAdmin || isUploader;
  
  // Helper to get formatted date string
  const getFormattedDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Helper to get the appropriate icon based on file type
  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) {
      return <FileText className="h-6 w-6 text-primary" />;
    } else if (fileType.includes('image')) {
      return <FileImage className="h-6 w-6 text-primary" />;
    } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
      return <Presentation className="h-6 w-6 text-primary" />;
    } else if (fileType.includes('sheet') || fileType.includes('excel')) {
      return <FileSpreadsheet className="h-6 w-6 text-primary" />;
    } else if (fileType.includes('zip') || fileType.includes('compressed')) {
      return <FileArchive className="h-6 w-6 text-primary" />;
    } else {
      return <File className="h-6 w-6 text-primary" />;
    }
  };
  
  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Event handlers
  const handleDownload = (e) => {
    e.preventDefault();
    if (onDownload) onDownload(resource);
  };
  
  const handleView = (e) => {
    e.preventDefault();
    if (onView) onView(resource);
  };
  
  const handleDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) onDelete(resource);
  };
  
  if (!resource) return null;
  
  return (
    <div className="bg-background rounded-lg border border-border p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start">
        {/* File type icon */}
        <div className="bg-primary/10 p-3 rounded-full mr-4 flex-shrink-0">
          {getFileIcon(resource.fileType)}
        </div>
        
        {/* Resource content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="font-medium text-foreground truncate">{resource.title}</h3>
            
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10 -mt-1 -mr-2"
                onClick={handleDelete}
                aria-label="Delete resource"
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mt-1 mb-2 line-clamp-2">
            {resource.description}
          </p>
          
          <div className="mb-2 flex items-center">
            <span className="text-xs text-muted-foreground">
              {formatFileSize(resource.fileSize)} • {resource.fileName}
            </span>
          </div>
          
          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {resource.tags.map((tag, index) => (
                <span 
                  key={index} 
                  className="text-xs bg-primary/5 text-primary px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleDownload}
              >
                <Download size={14} className="mr-1" />
                Download
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleView}
              >
                <Eye size={14} className="mr-1" />
                View
              </Button>
            </div>
            
            <div className="text-xs text-muted-foreground flex items-center gap-3">
              <span>{resource.downloads} downloads</span>
              <span>{resource.views} views</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Resource metadata */}
      <div className="mt-3 pt-2 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
        <span>
          Uploaded by <span className="font-medium">{resource.uploader?.name}</span>
        </span>
        <span>
          {getFormattedDate(resource.createdAt)}
        </span>
      </div>
    </div>
  );
};

export default ResourceCard; 