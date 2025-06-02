import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import groupsApi from '../api/groupsApi';
import messagesApi from '../api/messagesApi';
import socketService from '../services/socketService';
import { toast } from 'react-hot-toast';
import AppLayout from '../components/AppLayout';
import Header from '../components/Header';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Send, ArrowLeft, Users } from 'lucide-react';

const GroupChatPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketInitializedRef = useRef(false);
  const messageListenerRef = useRef(null);
  const typingListenerRef = useRef(null);

  // Effect for initializing socket connection
  useEffect(() => {
    // Initialize socket connection if needed
    if (!socketService.initialized) {
      socketService.connect();
    }
    
    return () => {
      // Don't disconnect the socket here
      // We'll handle cleanup in a separate effect
    };
  }, []);

  // Effect for handling group-specific socket operations
  useEffect(() => {
    if (!groupId || !user) return;
    
    const joinChat = async () => {
      // Only try to join if socket is initialized
      if (socketService.initialized && socketService.connected) {
        socketService.joinGroup(groupId);
        setupSocketListeners();
        socketInitializedRef.current = true;
      } else {
        // If socket is not connected yet, wait a bit and try again
        const checkInterval = setInterval(() => {
          if (socketService.connected) {
            socketService.joinGroup(groupId);
            setupSocketListeners();
            socketInitializedRef.current = true;
            clearInterval(checkInterval);
          }
        }, 500);
        
        // Clean up interval if component unmounts
        return () => clearInterval(checkInterval);
      }
    };
    
    joinChat();
    
    // Cleanup function for leaving the group
    return () => {
      cleanupGroupListeners();
      if (socketService.initialized && socketService.connected) {
        socketService.leaveGroup(groupId);
      }
    };
  }, [groupId, user]);

  // Handle component unmount
  useEffect(() => {
    return () => {
      cleanupGroupListeners();
      // Only disconnect if no other components need the socket
      // We'll let the socket service handle reconnection as needed
    };
  }, []);

  const cleanupGroupListeners = () => {
    // Remove any group-specific listeners to prevent memory leaks
    if (messageListenerRef.current) {
      socketService.off('new_message', messageListenerRef.current);
      messageListenerRef.current = null;
    }
    
    if (typingListenerRef.current) {
      socketService.off('typing', typingListenerRef.current);
      typingListenerRef.current = null;
    }
  };

  useEffect(() => {
    loadGroupAndMessages();
  }, [groupId]);

  const loadGroupAndMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is logged in
      if (!user) {
        navigate('/login');
        toast.error('You must be logged in to view this group');
        return;
      }

      // Load group details
      const groupResponse = await groupsApi.getGroup(groupId);
      if (!groupResponse.success) {
        throw new Error(groupResponse.message || 'Failed to load group');
      }
      setGroup(groupResponse.data);

      // Check if user is a member
      const currentUserId = user.id || user._id;
      const isMember = groupResponse.data.members && groupResponse.data.members.some(member => {
        const memberId = typeof member === 'object' ? member._id : member;
        return String(memberId) === String(currentUserId);
      });
      
      if (!isMember) {
        navigate('/groups');
        toast.error('You must be a member to view this group');
        return;
      }

      // Load messages
      const messagesResponse = await messagesApi.getMessages(groupId);
      if (messagesResponse.success) {
        setMessages(messagesResponse.data.messages || []);
      } else {
        throw new Error(messagesResponse.message || 'Failed to load messages');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading the group');
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    // Clear existing listeners first
    cleanupGroupListeners();
    
    // Create new message listener and store reference
    messageListenerRef.current = (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    };
    
    // Create typing listener and store reference
    typingListenerRef.current = ({ userId, isTyping }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    };
    
    // Register listeners with socket service
    socketService.on('new_message', messageListenerRef.current);
    socketService.on('typing', typingListenerRef.current);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const messageData = {
        content: newMessage.trim(),
        groupId
      };

      const response = await messagesApi.sendMessage(groupId, messageData);
      if (response.success) {
        setNewMessage('');
        setIsTyping(false);
        
        // Only try to send typing indicator if socket is connected
        if (socketService.connected) {
          socketService.sendTypingIndicator(groupId, false);
        }
      } else {
        toast.error(response.message || 'Failed to send message');
      }
    } catch (err) {
      toast.error(err.message || 'An error occurred while sending the message');
    }
  };

  const handleTyping = () => {
    if (!isTyping && socketService.connected) {
      setIsTyping(true);
      socketService.sendTypingIndicator(groupId, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socketService.connected) {
        socketService.sendTypingIndicator(groupId, false);
      }
    }, 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading) {
    return (
      <AppLayout>
        <Header title="Group Chat" />
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
        <Header title="Group Chat" />
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="text-center py-8">
            <div className="text-destructive">
              <h2 className="text-2xl font-bold mb-2">Error</h2>
              <p>{error}</p>
              <Button
                onClick={() => navigate('/groups')}
                className="mt-4"
              >
                Back to Groups
              </Button>
            </div>
          </div>
        </main>
      </AppLayout>
    );
  }

  if (!group) {
    return (
      <AppLayout>
        <Header title="Group Chat" />
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-2">Group not found</h2>
            <Button
              onClick={() => navigate('/groups')}
              className="mt-4"
            >
              Back to Groups
            </Button>
          </div>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Header title={group.name || 'Group Chat'} />
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col h-[calc(100vh-64px)]">
        <div className="bg-card/90 backdrop-blur-sm rounded-xl shadow-lg flex flex-col flex-grow overflow-hidden">
          {/* Group Header */}
          <div className="bg-gradient-to-r from-primary/10 to-transparent p-4 border-b border-border flex justify-between items-center">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2" 
                onClick={() => navigate('/groups')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{group.name}</h2>
                <p className="text-sm text-muted-foreground">{group.description}</p>
              </div>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Users className="h-4 w-4 mr-1" />
              <span className="text-sm">{group.members ? group.members.length : 0} members</span>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No messages yet. Be the first to send a message!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const currentUserId = user?.id || user?._id;
                  const isOwnMessage = message.sender && String(message.sender._id) === String(currentUserId);
                  
                  return (
                  <div
                    key={message._id}
                    className={`flex ${
                      isOwnMessage ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 shadow-sm ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card text-card-foreground'
                      }`}
                    >
                      {message.sender && !isOwnMessage && (
                        <div className="font-semibold text-xs pb-1">
                          {message.sender.name || message.sender.email || 'Unknown'}
                        </div>
                      )}
                      <div className="mb-1">{message.content}</div>
                      <div className="text-xs opacity-70 text-right">
                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  );
                })
              )}
              
              {/* Typing indicator */}
              {typingUsers.size > 0 && (
                <div className="text-muted-foreground text-sm italic">
                  {Array.from(typingUsers).length === 1
                    ? 'Someone is typing...'
                    : 'Multiple people are typing...'}
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-border">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button type="submit" disabled={!newMessage.trim() || !socketService.connected}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </main>
    </AppLayout>
  );
};

export default GroupChatPage; 