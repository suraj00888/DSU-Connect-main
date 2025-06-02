import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import groupsApi from '../api/groupsApi';
import { toast } from 'react-hot-toast';
import AppLayout from '../components/AppLayout';
import Header from '../components/Header';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';
import socketService from '../services/socketService';

const CreateGroupPage = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize socket connection once when component mounts
  useEffect(() => {
    // We don't need to connect to socket for group creation
    // This prevents calls to uninitialized socket
    return () => {
      // Only disconnect if socket is already connected
      if (socketService.connected) {
        socketService.disconnect();
      }
    };
  }, []);

  // Check if user is admin, if not redirect
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Only administrators can create discussion groups');
      navigate('/groups');
    }
  }, [user, navigate]);

  // If user is not admin, don't render the page content
  if (user && user.role !== 'admin') {
    return (
      <AppLayout>
        <Header title="Unauthorized" />
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-card/90 backdrop-blur-sm rounded-xl shadow-lg p-6 sm:p-7 md:p-8">
              <h2 className="text-destructive text-lg font-medium mb-2">Access Denied</h2>
              <p className="text-muted-foreground mb-4">
                Only administrators can create discussion groups.
              </p>
              <Button onClick={() => navigate('/groups')}>
                Return to Groups
              </Button>
            </div>
          </div>
        </main>
      </AppLayout>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCheckboxChange = (checked) => {
    setFormData((prev) => ({
      ...prev,
      isPrivate: checked
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await groupsApi.createGroup(formData);
      if (response.success) {
        toast.success('Group created successfully');
        
        // Navigate to the new group page after a brief delay
        // This gives time for state updates to complete
        setTimeout(() => {
          navigate(`/groups/${response.data._id}`);
        }, 100);
      } else {
        setError(response.message || 'Failed to create group');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while creating the group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <Header title="Create New Group" />
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="max-w-2xl mx-auto">
          <div className="bg-card/90 backdrop-blur-sm rounded-xl shadow-lg p-6 sm:p-7 md:p-8">
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  minLength={3}
                  maxLength={50}
                  placeholder="Enter group name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  minLength={10}
                  maxLength={500}
                  rows={4}
                  placeholder="Describe the purpose of this group"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isPrivate" 
                  checked={formData.isPrivate} 
                  onCheckedChange={handleCheckboxChange} 
                />
                <Label htmlFor="isPrivate" className="text-sm font-medium leading-none cursor-pointer">
                  Make this group private
                </Label>
              </div>

              <div className="flex gap-4 pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Creating...' : 'Create Group'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/groups')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

export default CreateGroupPage; 