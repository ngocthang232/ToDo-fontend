import React, { useState, useEffect } from 'react';
import { Users, Wifi, WifiOff } from 'lucide-react';
import socketService from '../services/socketService';

const OnlineUsers = ({ boardId }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  useEffect(() => {
    if (!boardId) return;

    // Join board room
    socketService.joinBoard(boardId);

    // Event listeners
    const handleUserJoined = (user) => {
      if (user.userId === currentUser.id) return; // ignore self
      setOnlineUsers(prev => {
        const exists = prev.find(u => u.userId === user.userId);
        if (!exists) {
          return [...prev, user];
        }
        return prev;
      });
    };

    const handleUserLeft = (user) => {
      setOnlineUsers(prev => prev.filter(u => u.userId !== user.userId));
    };

    const handleConnect = () => {
      setIsConnected(true);
      socketService.joinBoard(boardId);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setOnlineUsers([]);
    };

    const handleOnlineUsers = (payload) => {
      if (!payload || payload.boardId !== boardId) return;
      const others = (payload.users || []).filter(u => u.userId !== currentUser.id);
      setOnlineUsers(others);
    };

    // Set up listeners
    socketService.onUserJoined(handleUserJoined);
    socketService.onUserLeft(handleUserLeft);
    socketService.onOnlineUsers(handleOnlineUsers);
    socketService.socket?.on('connect', handleConnect);
    socketService.socket?.on('disconnect', handleDisconnect);

    // Cleanup
    return () => {
      socketService.offUserJoined(handleUserJoined);
      socketService.offUserLeft(handleUserLeft);
      socketService.offOnlineUsers(handleOnlineUsers);
      socketService.socket?.off('connect', handleConnect);
      socketService.socket?.off('disconnect', handleDisconnect);
      socketService.leaveBoard(boardId);
    };
  }, [boardId, currentUser.id]);

  if (!isConnected) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <WifiOff size={16} />
        <span className="text-sm">Offline</span>
      </div>
    );
  }

  const usernames = [currentUser?.username, ...onlineUsers.map(u => u.username)].filter(Boolean);
  const namesPreview = usernames.slice(0, 3).join(', ');
  const extra = usernames.length > 3 ? `, +${usernames.length - 3}` : '';

  return (
    <div className="flex items-center space-x-2" title={`${namesPreview}${extra}`}>
      <div className="flex items-center space-x-1">
        <Wifi size={16} className="text-green-500" />
        <Users size={16} className="text-gray-600" />
        <span className="text-sm text-gray-600">
          {onlineUsers.length + 1} online
        </span>
      </div>
      
      {onlineUsers.length > 0 && (
        <div className="flex -space-x-2">
          {onlineUsers.slice(0, 3).map((user) => (
            <div
              key={user.userId}
              className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
              title={user.username}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
          ))}
          {onlineUsers.length > 3 && (
            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
              +{onlineUsers.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OnlineUsers;
