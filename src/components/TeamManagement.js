import React, { useState, useEffect } from 'react';
import { getUsers, getBoardMembers, addBoardMember, removeBoardMember, register } from '../services/api';
import { Users, UserPlus, UserMinus, Crown, User } from 'lucide-react';

const TeamManagement = ({ boardId, isOpen, onClose }) => {
  const [users, setUsers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      fetchMembers();
    }
  }, [isOpen, boardId]);

  const fetchUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const membersData = await getBoardMembers(boardId);
      setMembers(membersData);
    } catch (error) {
      console.error('Error fetching members:', error);
      setError('Error loading team members');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) return;

    try {
      await addBoardMember(boardId, selectedUserId);
      setSelectedUserId('');
      setError('');
      fetchMembers();
    } catch (error) {
      setError(error.response?.data?.error || 'Error adding member');
    }
  };

  const handleCreateMember = async () => {
    if (!newUsername.trim() || !newEmail.trim() || !newPassword) {
      setError('Vui lòng nhập đầy đủ Username, Email và Mật khẩu');
      return;
    }
    try {
      setCreating(true);
      await register(newUsername.trim(), newEmail.trim(), newPassword);
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setShowCreateForm(false);
      setError('');
      await fetchUsers();
    } catch (e) {
      setError(e.response?.data?.error || 'Không thể tạo thành viên mới');
    } finally {
      setCreating(false);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await removeBoardMember(boardId, userId);
        setError('');
        fetchMembers();
      } catch (error) {
        setError(error.response?.data?.error || 'Error removing member');
      }
    }
  };

  const getAvailableUsers = () => {
    const memberIds = members.map(member => member.id);
    return users.filter(user => !memberIds.includes(user.id));
  };

  const getRoleIcon = (role) => {
    if (role === 'owner') {
      return <Crown size={16} className="text-yellow-500" />;
    }
    return <User size={16} className="text-gray-500" />;
  };

  const getRoleColor = (role) => {
    if (role === 'owner') {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-96 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <Users size={20} className="mr-2" />
              Team Management
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-64 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Add Member */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Add Team Member</h3>
            <div className="flex gap-2">
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a user...</option>
                {getAvailableUsers().map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username} ({user.email})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddMember}
                disabled={!selectedUserId}
                className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <UserPlus size={16} />
                Add
              </button>
            </div>
            <div className="mt-2">
              <button
                type="button"
                onClick={() => { setShowCreateForm(!showCreateForm); setError(''); }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showCreateForm ? 'Ẩn form tạo thành viên' : 'Tạo thành viên mới'}
              </button>
            </div>

            {showCreateForm && (
              <div className="mt-3 p-3 border rounded-md bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="password"
                    placeholder="Mật khẩu"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mt-3">
                  <button
                    onClick={handleCreateMember}
                    disabled={creating}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
                  >
                    {creating ? 'Đang tạo...' : 'Tạo tài khoản'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Members List */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Team Members ({members.length})
            </h3>
            
            {loading ? (
              <div className="text-center py-4 text-gray-500">
                Loading members...
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No team members yet
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getRoleIcon(member.role)}
                      <div>
                        <div className="font-medium text-gray-800">
                          {member.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.email}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                      {member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Remove member"
                        >
                          <UserMinus size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;
