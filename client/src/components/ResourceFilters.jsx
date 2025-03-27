import React, { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

/**
 * ResourceFilters component for filtering and searching resources
 * 
 * @param {Object} props
 * @param {Function} props.onFilterChange - Function to call when filters change
 * @param {Object} props.initialFilters - Initial filter values
 */
const ResourceFilters = ({ onFilterChange, initialFilters = {} }) => {
  // Set up filters state with defaults
  const [filters, setFilters] = useState({
    search: initialFilters.search || '',
    category: initialFilters.category || '',
    sort: initialFilters.sort || 'newest',
    ...initialFilters
  });
  
  // Track expanded state for mobile
  const [expanded, setExpanded] = useState(false);
  
  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, search: value }));
  };
  
  // Handle category selection
  const handleCategoryChange = (category) => {
    setFilters(prev => ({ 
      ...prev, 
      category: prev.category === category ? '' : category 
    }));
  };
  
  // Handle sort selection
  const handleSortChange = (e) => {
    setFilters(prev => ({ ...prev, sort: e.target.value }));
  };
  
  // Apply filters
  const applyFilters = () => {
    if (onFilterChange) {
      onFilterChange(filters);
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    const resetFilters = {
      search: '',
      category: '',
      sort: 'newest'
    };
    setFilters(resetFilters);
    if (onFilterChange) {
      onFilterChange(resetFilters);
    }
  };
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setExpanded(prev => !prev);
  };
  
  // Check if any filters are active
  const hasActiveFilters = filters.search || filters.category || filters.sort !== 'newest';
  
  return (
    <div className="bg-background rounded-lg border border-border p-4 mb-6">
      {/* Search input and expand button */}
      <div className="flex gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search resources..."
            value={filters.search}
            onChange={handleSearchChange}
            className="pl-10 w-full"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                applyFilters();
              }
            }}
          />
        </div>
        
        <Button
          variant={expanded ? "default" : "outline"}
          size="sm"
          onClick={toggleExpanded}
          className="flex items-center gap-1 md:hidden"
        >
          <SlidersHorizontal size={16} />
          {expanded ? 'Hide' : 'Filters'}
        </Button>
        
        <Button
          variant="default"
          size="sm"
          onClick={applyFilters}
        >
          Apply
        </Button>
      </div>
      
      {/* Filters section - always visible on desktop, toggleable on mobile */}
      <div className={`${expanded ? 'block' : 'hidden md:block'} mt-4`}>
        <div className="flex flex-col md:flex-row justify-between gap-4">
          {/* Categories */}
          <div>
            <h3 className="text-sm font-medium mb-2">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {['lecture_notes', 'project_files', 'assignments', 'textbooks', 'presentations', 'other'].map((category) => (
                <Button
                  key={category}
                  variant={filters.category === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCategoryChange(category)}
                  className="capitalize"
                >
                  {category.replace('_', ' ')}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Sort options */}
          <div className="min-w-[180px]">
            <h3 className="text-sm font-medium mb-2">Sort By</h3>
            <select
              value={filters.sort}
              onChange={handleSortChange}
              className="w-full px-3 py-2 rounded-md border border-input bg-background"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most_downloaded">Most Downloaded</option>
              <option value="most_viewed">Most Viewed</option>
              <option value="title_asc">Title (A-Z)</option>
              <option value="title_desc">Title (Z-A)</option>
            </select>
          </div>
        </div>
        
        {/* Active filters and clear button */}
        {hasActiveFilters && (
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-1 text-sm">
              <span className="text-muted-foreground">Active filters:</span>
              <div className="flex flex-wrap gap-1 max-w-md">
                {filters.search && (
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs flex items-center">
                    Search: {filters.search}
                    <button 
                      className="ml-1 hover:text-primary/80"
                      onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                
                {filters.category && (
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs flex items-center capitalize">
                    Category: {filters.category.replace('_', ' ')}
                    <button 
                      className="ml-1 hover:text-primary/80"
                      onClick={() => setFilters(prev => ({ ...prev, category: '' }))}
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
                
                {filters.sort !== 'newest' && (
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs flex items-center">
                    Sort: {filters.sort.replace('_', ' ')}
                    <button 
                      className="ml-1 hover:text-primary/80"
                      onClick={() => setFilters(prev => ({ ...prev, sort: 'newest' }))}
                    >
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground h-7 px-2 hover:text-foreground"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceFilters; 