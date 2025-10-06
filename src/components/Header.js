import React, { useState } from 'react';
import { PlusCircle, LogOut, UserCircle2, Search, Users, Eye } from 'lucide-react'; // icon đẹp
import UserProfilePopup from './UserProfilePopup';
import SearchComponent from './Search';
import TeamManagement from './TeamManagement';
import OnlineUsers from './OnlineUsers';
import OnlineUsersList from './OnlineUsersList';

const Header = ({ user, boards, currentBoard, onBoardChange, onCreateBoard, onLogout, onUserUpdate, onCardClick, onBoardClick }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showTeamManagement, setShowTeamManagement] = useState(false);
  const [showOnlineUsersList, setShowOnlineUsersList] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!newBoardTitle.trim()) {
      newErrors.title = 'Board title is required';
    } else if (newBoardTitle.length > 100) {
      newErrors.title = 'Board title must be less than 100 characters';
    }
    if (newBoardDescription && newBoardDescription.length > 500) {
      newErrors.description = 'Board description must be less than 500 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onCreateBoard(newBoardTitle.trim(), newBoardDescription.trim());
      setNewBoardTitle('');
      setNewBoardDescription('');
      setErrors({});
      setShowCreateForm(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'title') setNewBoardTitle(value);
    else if (field === 'description') setNewBoardDescription(value);

    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <header className="bg-white shadow border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <span className="bg-blue-500 text-white px-2 py-1 rounded-lg font-bold">TD</span>
            <h1 className="text-xl font-bold text-gray-900">ToDo App</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search Button */}
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition"
            >
              <Search size={16} />
              <span>Search</span>
            </button>

            {/* Board Selector */}
            <div>
              <label className="sr-only">Select Board</label>
              <select
                value={currentBoard?.id || ''}
                onChange={(e) => {
                  const board = boards.find((b) => b.id === parseInt(e.target.value));
                  onBoardChange(board);
                }}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a board</option>
                {boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Team Management Button */}
            {currentBoard && (
              <button
                onClick={() => setShowTeamManagement(true)}
                className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition"
              >
                <Users size={16} />
                <span>Team</span>
              </button>
            )}

            {/* Online Users */}
            {currentBoard && <OnlineUsers boardId={currentBoard.id} />}

            {/* View Online Users List */}
            {currentBoard && (
              <button
                onClick={() => setShowOnlineUsersList(true)}
                className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm hover:bg-gray-100 transition"
              >
                <Eye size={16} />
                <span>View Online</span>
              </button>
            )}

            {/* Create Board Button */}
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-md text-sm hover:opacity-90 shadow"
            >
              <PlusCircle size={16} />
              <span>New Board</span>
            </button>

            {/* User Info & Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('http://localhost:5000/api/users/profile', {
                      method: 'GET',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      }
                    });
                    if (res.ok) {
                      console.log('Profile fetch response status:', res.status);
                      const data = await res.json();
                      console.log('Fetched profile data:', data);
                      setProfileData(data);
                      setShowUserProfile(true);
                    } else {
                      console.log('Profile fetch failed with status:', res.status);
                      setProfileData(user); // fallback
                      setShowUserProfile(true);
                    }
                  } catch (e) {
                    console.error('Profile fetch error:', e);
                    setProfileData(user); // fallback
                    setShowUserProfile(true);
                  }
                }}
                className="flex items-center text-sm text-gray-700 hover:text-blue-600 px-3 py-1 rounded transition"
              >
                <UserCircle2 className="mr-1" size={18} />
                {user?.username}
              </button>
              <button
                onClick={onLogout}
                className="flex items-center text-gray-600 hover:text-red-600 text-sm px-3 py-1 rounded transition"
              >
                <LogOut size={16} className="mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Board Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4">
            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-semibold">Create New Board</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {/* Title */}
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={newBoardTitle}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                    errors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Enter board title"
                  autoFocus
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              {/* Description */}
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={newBoardDescription}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 ${
                    errors.description
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  rows="3"
                  placeholder="Enter board description"
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewBoardTitle('');
                    setNewBoardDescription('');
                    setErrors({});
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 shadow transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Profile Popup */}
      {showUserProfile && (
        <UserProfilePopup
          user={profileData || user}
          onClose={() => {
            setShowUserProfile(false);
            setProfileData(null);
          }}
          onUpdate={onUserUpdate}
        />
      )}

      {/* Search Component */}
      <SearchComponent
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onCardClick={onCardClick}
        onBoardClick={onBoardClick}
      />

      {/* Team Management Component */}
      <TeamManagement
        boardId={currentBoard?.id}
        isOpen={showTeamManagement}
        onClose={() => setShowTeamManagement(false)}
      />

      {/* Online Users List Component */}
      <OnlineUsersList
        boardId={currentBoard?.id}
        isOpen={showOnlineUsersList}
        onClose={() => setShowOnlineUsersList(false)}
      />
    </header>
  );
};

export default Header;
