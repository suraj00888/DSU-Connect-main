import React, { useState } from 'react';
import { Upload, File, X, Tag, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

/**
 * ResourceUploadForm component for uploading new resources
 * 
 * @param {Object} props
 * @param {Function} props.onSubmit - Function to call when form is submitted
 * @param {Function} props.onCancel - Function to call when form is cancelled
 * @param {boolean} props.isLoading - Whether the form is in loading state
 */
const ResourceUploadForm = ({ onSubmit, onCancel, isLoading = false }) => {
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'lecture_notes',
    tags: []
  });
  
  // File state
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  
  // Tag input state
  const [tagInput, setTagInput] = useState('');
  
  // Validation state
  const [errors, setErrors] = useState({});
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) {
      setFile(null);
      setFilePreview(null);
      setErrors(prev => ({...prev, file: null}));
      return;
    }
    
    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrors(prev => ({...prev, file: 'File must be less than 10MB'}));
      return;
    }
    
    setFile(selectedFile);
    setFilePreview({
      name: selectedFile.name,
      size: formatFileSize(selectedFile.size),
      type: selectedFile.type
    });
    
    setErrors(prev => ({...prev, file: null}));
  };
  
  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  
  // Add a tag
  const addTag = () => {
    if (!tagInput.trim()) return;
    
    // Don't add duplicate tags
    if (formData.tags.includes(tagInput.trim())) {
      setTagInput('');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tagInput.trim()]
    }));
    
    setTagInput('');
  };
  
  // Remove a tag
  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  // Validate the form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!file) {
      newErrors.file = 'Please select a file to upload';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Create FormData for file upload
    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('description', formData.description);
    submitData.append('category', formData.category);
    submitData.append('tags', JSON.stringify(formData.tags));
    submitData.append('file', file);
    
    if (onSubmit) {
      onSubmit(submitData);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base">
          Resource Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Enter a title for your resource"
          className={errors.title ? 'border-destructive' : ''}
          disabled={isLoading}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title}</p>
        )}
      </div>
      
      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-base">
          Description <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe what this resource contains"
          className={errors.description ? 'border-destructive' : ''}
          rows={4}
          disabled={isLoading}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description}</p>
        )}
      </div>
      
      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category" className="text-base">
          Category <span className="text-destructive">*</span>
        </Label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className={`w-full px-3 py-2 rounded-md border bg-background ${
            errors.category ? 'border-destructive' : 'border-input'
          }`}
          disabled={isLoading}
        >
          <option value="lecture_notes">Lecture Notes</option>
          <option value="project_files">Project Files</option>
          <option value="assignments">Assignments</option>
          <option value="textbooks">Textbooks</option>
          <option value="presentations">Presentations</option>
          <option value="other">Other</option>
        </select>
        {errors.category && (
          <p className="text-xs text-destructive">{errors.category}</p>
        )}
      </div>
      
      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags" className="text-base">
          Tags <span className="text-muted-foreground text-sm">(optional)</span>
        </Label>
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Input
              id="tagInput"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add tags to help others find your resource"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              className="pl-8"
            />
            <Tag className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={addTag}
            disabled={isLoading}
          >
            <Plus size={16} className="mr-1" />
            Add
          </Button>
        </div>
        
        {/* Display tags */}
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag, index) => (
              <div 
                key={index} 
                className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-primary hover:text-primary/80"
                  disabled={isLoading}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* File Upload */}
      <div className="space-y-2">
        <Label htmlFor="file" className="text-base">
          Upload File <span className="text-destructive">*</span>
        </Label>
        
        <div className={`border-2 border-dashed rounded-md p-4 text-center ${
          errors.file ? 'border-destructive' : 'border-border'
        }`}>
          {!filePreview ? (
            <div className="space-y-2">
              <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="text-sm">
                <label htmlFor="file-upload" className="cursor-pointer text-primary hover:underline">
                  Click to upload
                </label>
                <span className="text-muted-foreground"> or drag and drop</span>
              </div>
              <p className="text-xs text-muted-foreground">
                PDF, DOCX, PPTX, JPG, PNG up to 10MB
              </p>
              <input
                id="file-upload"
                name="file"
                type="file"
                className="sr-only"
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 bg-primary/5 rounded-md">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-md mr-3">
                  <File className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium truncate max-w-[200px]">{filePreview.name}</p>
                  <p className="text-xs text-muted-foreground">{filePreview.size}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setFilePreview(null);
                }}
                className="text-destructive hover:text-destructive/80"
                disabled={isLoading}
              >
                <X size={20} />
              </button>
            </div>
          )}
        </div>
        
        {errors.file && (
          <p className="text-xs text-destructive">{errors.file}</p>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="flex justify-end space-x-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Uploading...
            </div>
          ) : (
            'Upload Resource'
          )}
        </Button>
      </div>
    </form>
  );
};

export default ResourceUploadForm; 