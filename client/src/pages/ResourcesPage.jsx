import React, { useState, useEffect } from 'react';
import { Plus, FileText } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import Header from '../components/Header';
import { Button } from '../components/ui/button';
import ResourceCard from '../components/ResourceCard';
import ResourceFilters from '../components/ResourceFilters';
import ResourceUploadModal from '../components/ResourceUploadModal';
import ResourceDetailView from '../components/ResourceDetailView';
import resourcesApi from '../api/resourcesApi';

const ResourcesPage = () => {
  // State for resources and pagination
  const [resources, setResources] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    pages: 0
  });
  
  // State for UI controls
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    sort: 'newest'
  });
  
  // State for modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  
  // Load resources
  const loadResources = async (filterParams = {}, page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare params
      const params = {
        page,
        limit: pagination.limit,
        ...filterParams
      };
      
      // Add search parameter if provided
      if (filterParams.search) {
        params.search = filterParams.search;
      }
      
      // Add category filter if selected
      if (filterParams.category) {
        params.category = filterParams.category;
      }
      
      // Handle sorting
      if (filterParams.sort) {
        const sort = filterParams.sort;
        
        // Convert UI sort options to API sort parameters
        switch (sort) {
          case 'newest':
            params.sort = '-createdAt'; // Descending by creation date
            break;
          case 'oldest':
            params.sort = 'createdAt'; // Ascending by creation date
            break;
          case 'most_downloaded':
            params.sort = '-downloads'; // Descending by downloads
            break;
          case 'most_viewed':
            params.sort = '-views'; // Descending by views
            break;
          case 'title_asc':
            params.sort = 'title'; // Ascending by title
            break;
          case 'title_desc':
            params.sort = '-title'; // Descending by title
            break;
          default:
            params.sort = '-createdAt'; // Default sort
        }
      }
      
      // Fetch resources from API
      const response = await resourcesApi.getResources(params);
      
      // Update state with fetched data
      setResources(response.resources || []);
      setPagination(response.pagination || {
        page,
        limit: pagination.limit,
        total: response.resources?.length || 0,
        pages: Math.ceil((response.resources?.length || 0) / pagination.limit)
      });
      
    } catch (err) {
      console.error('Error loading resources:', err);
      setError('Failed to load resources. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Load resources on mount and when filters change
  useEffect(() => {
    loadResources(filters, pagination.page);
  }, []);
  
  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    loadResources(newFilters, 1); // Reset to first page when filters change
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    loadResources(filters, newPage);
  };
  
  // Handle resource upload
  const handleResourceUpload = async (formData) => {
    try {
      await resourcesApi.uploadResource(formData);
      
      // Reload resources after successful upload
      loadResources(filters, pagination.page);
      
      return true;
    } catch (err) {
      console.error('Error uploading resource:', err);
      throw err;
    }
  };
  
  // Handle resource download
  const handleResourceDownload = async (resource) => {
    try {
      const result = await resourcesApi.trackDownload(resource._id);
      
      // Open download URL in a new tab
      if (result && result.downloadUrl) {
        window.open(result.downloadUrl, '_blank');
      }
    } catch (err) {
      console.error('Error downloading resource:', err);
    }
  };
  
  // Handle resource deletion
  const handleResourceDelete = async (resource) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) {
      return;
    }
    
    try {
      await resourcesApi.deleteResource(resource._id);
      
      // Remove resource from state immediately
      setResources(resources.filter(r => r._id !== resource._id));
      
      // If viewing the resource, close the detail view
      if (selectedResource && selectedResource._id === resource._id) {
        setSelectedResource(null);
      }
    } catch (err) {
      console.error('Error deleting resource:', err);
      alert('Failed to delete resource. Please try again.');
    }
  };
  
  return (
    <AppLayout>
      <Header title="Resources" />
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-medium text-foreground">Learning Resources</h2>
            <p className="text-sm text-muted-foreground">
              Access study materials, guides, and resources for your academic journey.
            </p>
          </div>
          
          <Button onClick={() => setIsUploadModalOpen(true)}>
            <Plus size={16} className="mr-2" />
            Upload Resource
          </Button>
        </div>
        
        {/* Resource filters */}
        <ResourceFilters 
          onFilterChange={handleFilterChange} 
          initialFilters={filters}
        />
        
        {/* Content area */}
        <div className="bg-card/90 backdrop-blur-sm rounded-xl shadow-lg p-6 sm:p-7 md:p-8">
          {/* Loading state */}
          {loading && (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Loading resources...</p>
            </div>
          )}
          
          {/* Error state */}
          {error && !loading && (
            <div className="py-12 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button 
                variant="outline" 
                onClick={() => loadResources(filters, pagination.page)}
              >
                Try Again
              </Button>
            </div>
          )}
          
          {/* Empty state */}
          {!loading && !error && resources.length === 0 && (
            <div className="py-12 text-center">
              <div className="bg-primary/10 p-6 rounded-full inline-flex">
                <FileText className="h-12 w-12 text-primary" />
              </div>
              <h3 className="mt-4 font-medium text-lg">No resources found</h3>
              <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                {filters.search || filters.category ? 
                  'No resources match your search criteria. Try adjusting your filters.' : 
                  'No resources have been uploaded yet. Be the first to share learning materials!'}
              </p>
              <Button 
                className="mt-6"
                onClick={() => setIsUploadModalOpen(true)}
              >
                <Plus size={16} className="mr-2" />
                Upload Resource
              </Button>
            </div>
          )}
          
          {/* Resource grid */}
          {!loading && !error && resources.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map((resource) => (
                  <ResourceCard
                    key={resource._id}
                    resource={resource}
                    onDelete={() => handleResourceDelete(resource)}
                    onDownload={() => handleResourceDownload(resource)}
                    onView={() => setSelectedResource(resource)}
                  />
                ))}
              </div>
              
              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="mt-8 flex justify-center">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    
                    {/* Page number buttons */}
                    {[...Array(pagination.pages)].map((_, i) => (
                      <Button
                        key={i}
                        variant={pagination.page === i + 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    ))}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      {/* Upload modal */}
      {isUploadModalOpen && (
        <ResourceUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSubmit={handleResourceUpload}
        />
      )}
      
      {/* Resource detail view */}
      {selectedResource && (
        <ResourceDetailView
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
          onDownload={handleResourceDownload}
        />
      )}
    </AppLayout>
  );
};

export default ResourcesPage; 