import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import groupsApi from '../api/groupsApi';
import messagesApi from '../api/messagesApi';
import socketService from '../services/socketService';
import { toast } from 'react-hot-toast';

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

  useEffect(() => {
    loadGroupAndMessages();
    setupSocketListeners();

    return () => {
      socketService.leaveGroup(groupId);
      socketService.disconnect();
    };
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
      if (!groupResponse.data.members || !groupResponse.data.members.includes(user._id)) {
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

      // Join group chat
      socketService.connect();
      socketService.joinGroup(groupId);
    } catch (err) {
      setError(err.message || 'An error occurred while loading the group');
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socketService.on('new_message', (message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    socketService.on('typing', ({ userId, isTyping }) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    });
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
        socketService.sendTypingIndicator(groupId, false);
      } else {
        toast.error(response.message || 'Failed to send message');
      }
    } catch (err) {
      toast.error(err.message || 'An error occurred while sending the message');
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
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
      socketService.sendTypingIndicator(groupId, false);
    }, 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
            onClick={() => navigate('/groups')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Group not found</h2>
          <button
            onClick={() => navigate('/groups')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Group Header */}
      <div className="bg-white shadow-md p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <p className="text-gray-600">{group.description}</p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="container mx-auto max-w-4xl">
          {messages.map((message) => (
            <div
              key={message._id}
              className={`mb-4 ${
                message.sender && user && message.sender._id === user._id ? 'text-right' : 'text-left'
              }`}
            >
              <div
                className={`inline-block p-3 rounded-lg ${
                  message.sender && user && message.sender._id === user._id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800'
                }`}
              >
                <div className="text-sm font-semibold mb-1">
                  {message.sender && (message.sender.name || message.sender.email)}
                </div>
                <div>{message.content}</div>
                <div className="text-xs mt-1 opacity-75">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Typing Indicator */}
      {typingUsers.size > 0 && (
        <div className="bg-white p-2 text-sm text-gray-500">
          {Array.from(typingUsers)
            .map((userId) => {
              const typingUser = group.members.find((m) => m._id === userId);
              return typingUser?.name || typingUser?.email;
            })
            .join(', ')}{' '}
          {typingUsers.size === 1 ? 'is' : 'are'} typing...
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white shadow-md p-4">
        <div className="container mx-auto max-w-4xl">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleTyping}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GroupChatPage; 