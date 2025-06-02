import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import groupsApi from '../api/groupsApi';
import { toast } from 'react-hot-toast';
import AppLayout from '../components/AppLayout';
import Header from '../components/Header';
import { Search, Users, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const GroupsPage = () => {
  const user = useSelector((state) => state.auth.user);
  const isAdmin = user?.role === 'admin';
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all'); // all, joined, created

  useEffect(() => {
    loadGroups();
  }, [filter, searchQuery]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        search: searchQuery,
        filter: filter !== 'all' ? filter : undefined
      };
      const response = await groupsApi.getGroups(params);
      console.log('Groups API Response:', response);
      
      if (response && response.success) {
        console.log('Groups data:', response.data);
        setGroups(Array.isArray(response.data) ? response.data : []);
      } else {
        setGroups([]);
        setError(response?.message || 'Failed to load groups');
      }
    } catch (err) {
      console.error('Error loading groups:', err);
      setGroups([]);
      setError(err?.message || 'An error occurred while loading groups');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadGroups();
  };

  const handleJoinGroup = async (groupId) => {
    if (!groupId) {
      toast.error('Invalid group ID');
      return;
    }
    
    try {
      const response = await groupsApi.joinGroup(groupId);
      if (response && response.success) {
        toast.success('Successfully joined the group');
        loadGroups(); // Reload groups to update the UI
      } else {
        toast.error(response?.message || 'Failed to join group');
      }
    } catch (err) {
      toast.error(err?.message || 'An error occurred while joining the group');
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      const response = await groupsApi.leaveGroup(groupId);
      if (response?.success) {
        toast.success('Successfully left the group');
        loadGroups(); // Reload groups to update the UI
      } else {
        toast.error(response?.message || 'Failed to leave group');
      }
    } catch (err) {
      toast.error(err?.message || 'An error occurred while leaving the group');
    }
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete the group "${groupName}"? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      const response = await groupsApi.deleteGroup(groupId);
      if (response?.success) {
        toast.success('Group deleted successfully');
        loadGroups(); // Reload groups to update the UI
      } else {
        toast.error(response?.message || 'Failed to delete group');
      }
    } catch (err) {
      toast.error(err?.message || 'An error occurred while deleting the group');
    }
  };

  // Helper function to check if user can delete a group
  const canDeleteGroup = (group) => {
    if (!user || !group) return false;
    
    const currentUserId = user.id || user._id;
    const isCreator = group.createdBy && (
      (typeof group.createdBy === 'object' && String(group.createdBy._id) === String(currentUserId)) ||
      (typeof group.createdBy === 'string' && String(group.createdBy) === String(currentUserId))
    );
    
    return isAdmin || isCreator;
  };

  const renderGroups = () => {
    if (!Array.isArray(groups)) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-lg">No groups found</p>
        </div>
      );
    }

    if (groups.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-lg">No groups found</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <div
            key={group?._id || Math.random().toString()}
            className="bg-card/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2 text-card-foreground">{group?.name || 'Unnamed Group'}</h2>
              <p className="text-muted-foreground mb-4">{group?.description || 'No description'}</p>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {group?.members && group.members.length ? group.members.length : 0} members
                </span>
                <span>
                  Created by {group?.createdBy ? (group.createdBy.name || group.createdBy.email || 'Unknown') : 'Unknown'}
                </span>
              </div>
              <div className="flex gap-2">
                {user && group?.members && Array.isArray(group.members) && 
                  group.members.some(member => {
                    // Get the current user's ID (from Redux, it's stored as 'id', not '_id')
                    const currentUserId = user.id || user._id;
                    
                    // Check if member is an object with _id or a string
                    const memberId = typeof member === 'object' ? member._id : member;
                    
                    // Compare as strings to ensure proper matching
                    return String(memberId) === String(currentUserId);
                  }) ? (
                  // User is a member - show View Group and Leave buttons
                  <>
                    <Link
                      to={`/groups/${group?._id}`}
                      className="flex-1 px-4 py-2 bg-primary text-primary-foreground text-center rounded-md hover:bg-primary/90 transition-colors"
                    >
                      View Group
                    </Link>
                    <Button
                      onClick={() => handleLeaveGroup(group._id)}
                      variant="destructive"
                      size="sm"
                    >
                      Leave
                    </Button>
                    {/* Delete button for admins and group creators */}
                    {canDeleteGroup(group) && (
                      <Button
                        onClick={() => handleDeleteGroup(group._id, group.name)}
                        variant="destructive"
                        size="sm"
                        className="px-2"
                        title="Delete Group"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                ) : (
                  // User is not a member - show Join button and Delete button (if authorized)
                  <>
                    <Button
                      onClick={() => handleJoinGroup(group?._id)}
                      variant="outline"
                      className="flex-1"
                    >
                      Join Group
                    </Button>
                    {/* Delete button for admins and group creators */}
                    {canDeleteGroup(group) && (
                      <Button
                        onClick={() => handleDeleteGroup(group._id, group.name)}
                        variant="destructive"
                        size="sm"
                        className="px-2"
                        title="Delete Group"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <Header title="Discussion Groups" />
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Header title="Discussion Groups" />
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="text-center py-8">
            <div className="text-destructive">
              <h2 className="text-2xl font-bold mb-2">Error</h2>
              <p>{error}</p>
              <Button
                onClick={loadGroups}
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </div>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Header title="Discussion Groups" />
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="bg-card/90 backdrop-blur-sm rounded-xl shadow-lg p-6 sm:p-7 md:p-8">
          {/* Header section with title and actions */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
            <div className="text-center sm:text-left">
              <h2 className="text-lg sm:text-xl font-medium text-card-foreground mb-2">Discussion Groups</h2>
              <p className="text-sm text-muted-foreground">
                Connect with other DSU students in topic-specific discussion groups
              </p>
            </div>
            
            {isAdmin && (
              <Link
                to="/groups/create"
                className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Link>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <form onSubmit={handleSearch}>
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search groups..."
                  className="pl-10"
                />
              </form>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant={filter === 'all' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilter('all')}
              >
                All Groups
              </Button>
              <Button 
                variant={filter === 'joined' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilter('joined')}
              >
                My Groups
              </Button>
              <Button 
                variant={filter === 'created' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setFilter('created')}
              >
                Created by Me
              </Button>
            </div>
          </div>

          {/* Groups Grid */}
          {renderGroups()}
        </div>
      </main>
    </AppLayout>
  );
};

export default GroupsPage; 