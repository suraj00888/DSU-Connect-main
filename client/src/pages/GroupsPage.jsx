import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import groupsApi from '../api/groupsApi';
import { toast } from 'react-hot-toast';

const GroupsPage = () => {
  const user = useSelector((state) => state.auth.user);
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
      if (response && response.success) {
        setGroups(Array.isArray(response.data.groups) ? response.data.groups : []);
      } else {
        setGroups([]);
        setError(response?.message || 'Failed to load groups');
      }
    } catch (err) {
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
    if (!groupId) {
      toast.error('Invalid group ID');
      return;
    }
    
    try {
      const response = await groupsApi.leaveGroup(groupId);
      if (response && response.success) {
        toast.success('Successfully left the group');
        loadGroups(); // Reload groups to update the UI
      } else {
        toast.error(response?.message || 'Failed to leave group');
      }
    } catch (err) {
      toast.error(err?.message || 'An error occurred while leaving the group');
    }
  };

  const renderGroups = () => {
    if (!Array.isArray(groups)) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No groups found</p>
        </div>
      );
    }

    if (groups.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg">No groups found</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <div
            key={group?._id || Math.random().toString()}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2">{group?.name || 'Unnamed Group'}</h2>
              <p className="text-gray-600 mb-4">{group?.description || 'No description'}</p>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{group?.members && group.members.length ? group.members.length : 0} members</span>
                <span>
                  Created by {group?.createdBy ? (group.createdBy.name || group.createdBy.email || 'Unknown') : 'Unknown'}
                </span>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/groups/${group?._id}`}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white text-center rounded hover:bg-blue-600"
                >
                  View Group
                </Link>
                {user && group?.members && Array.isArray(group.members) && group.members.includes(user._id) ? (
                  <button
                    onClick={() => handleLeaveGroup(group._id)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Leave
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoinGroup(group?._id)}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Join
                  </button>
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500 text-center">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button
            onClick={loadGroups}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Discussion Groups</h1>
        <Link
          to="/groups/create"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Group
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-4 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search groups..."
            className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Search
          </button>
        </form>

        <div className="flex gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            All Groups
          </button>
          <button
            onClick={() => setFilter('joined')}
            className={`px-4 py-2 rounded ${
              filter === 'joined'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            My Groups
          </button>
          <button
            onClick={() => setFilter('created')}
            className={`px-4 py-2 rounded ${
              filter === 'created'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Created by Me
          </button>
        </div>
      </div>

      {/* Groups Grid */}
      {renderGroups()}
    </div>
  );
};

export default GroupsPage; 