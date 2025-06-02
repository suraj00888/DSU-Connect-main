import { io } from 'socket.io-client';
import { getToken } from '../utils/auth';

/**
 * Socket service for real-time communication
 */
class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
    this.connecting = false;
    this.initialized = false;
  }

  /**
   * Initialize socket connection
   * @returns {boolean} Whether the connection was successfully initiated
   */
  connect() {
    // If already connected or connecting, don't try again
    if (this.socket || this.connecting) return true;
    
    this.connecting = true;

    try {
      const token = getToken();
      if (!token) {
        console.warn('No authentication token found for socket connection');
        this.connecting = false;
        return false;
      }

      // Create socket connection
      this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5001', {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.initialized = true;
      this.setupEventListeners();
      return true;
    } catch (error) {
      console.error('Failed to initialize socket connection:', error);
      this.connecting = false;
      return false;
    }
  }

  /**
   * Setup socket event listeners
   */
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.connected = true;
      this.connecting = false;
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.connected = false;
    });

    // Handle reconnection
    this.socket.on('reconnect', () => {
      this.connected = true;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connecting = false;
    });
  }

  /**
   * Checks if socket is ready to use
   * @returns {boolean} Whether socket is connected and ready
   */
  isReady() {
    return this.initialized && this.socket && this.connected;
  }

  /**
   * Join a group chat
   * @param {string} groupId - Group ID
   * @returns {boolean} Whether the operation was successful
   */
  joinGroup(groupId) {
    if (!groupId) return false;
    
    // Try to connect if not already connected
    if (!this.socket) {
      if (!this.connect()) return false;
    }
    
    if (!this.connected) {
      return false;
    }
    
    this.socket.emit('join_group', { groupId });
    return true;
  }

  /**
   * Leave a group chat
   * @param {string} groupId - Group ID
   * @returns {boolean} Whether the operation was successful
   */
  leaveGroup(groupId) {
    if (!groupId || !this.initialized || !this.socket) return false;
    
    if (!this.connected) {
      return false;
    }
    
    this.socket.emit('leave_group', { groupId });
    return true;
  }

  /**
   * Send a message to a group
   * @param {string} groupId - Group ID
   * @param {Object} message - Message data
   * @returns {boolean} Whether the operation was successful
   */
  sendMessage(groupId, message) {
    if (!groupId || !message || !this.initialized || !this.socket) return false;
    
    if (!this.connected) {
      return false;
    }
    
    this.socket.emit('send_message', { groupId, message });
    return true;
  }

  /**
   * Send typing indicator
   * @param {string} groupId - Group ID
   * @param {boolean} isTyping - Whether user is typing
   * @returns {boolean} Whether the operation was successful
   */
  sendTypingIndicator(groupId, isTyping) {
    if (!groupId || !this.initialized || !this.socket) return false;
    
    if (!this.connected) {
      return false;
    }
    
    this.socket.emit('typing', { groupId, isTyping });
    return true;
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {boolean} Whether the operation was successful
   */
  on(event, callback) {
    if (!event || !callback) return false;
    
    // Try to connect if not already connected
    if (!this.socket) {
      if (!this.connect()) return false;
    }
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    
    this.listeners.get(event).add(callback);
    this.socket.on(event, callback);
    return true;
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {boolean} Whether the operation was successful
   */
  off(event, callback) {
    if (!event || !callback || !this.initialized || !this.socket) return false;
    
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
      this.socket.off(event, callback);
      return true;
    }
    
    return false;
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.initialized = false;
      this.connecting = false;
      this.listeners.clear();
    }
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService; 