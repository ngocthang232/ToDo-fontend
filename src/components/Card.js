import React, { useState, useEffect, useCallback, useRef } from 'react';
import '../css/Card.css';
import { updateCard, deleteCard, getUsers, getCardLabels, createCardLabel, getCardAttachments, uploadCardAttachment } from '../services/api';
import { MoreVertical, Edit3, Trash2, X, Calendar, Tag, Paperclip, Download, File } from 'lucide-react';
import socketService from '../services/socketService';

const Card = ({ card, onDelete, onUpdate, dragListeners }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [status, setStatus] = useState(card.status || 'To Do');
  const [assignedTo, setAssignedTo] = useState(card.assigned_to || null);
  const [dueDate, setDueDate] = useState(card.due_date || '');
  const [showMenu, setShowMenu] = useState(false);
  const [users, setUsers] = useState([]);
  const [labels, setLabels] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [editErrors, setEditErrors] = useState({});
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [showAttachmentForm, setShowAttachmentForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3B82F6');
  const [uploading, setUploading] = useState(false);
  const [labelErrors, setLabelErrors] = useState({});
  
  const menuRef = useRef(null);
  const labelFormRef = useRef(null);
  const attachmentFormRef = useRef(null);

  const fetchUsers = useCallback(async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  const fetchLabels = useCallback(async () => {
    try {
      const labelsData = await getCardLabels(card.id);
      setLabels(labelsData);
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
  }, [card.id]);

  const fetchAttachments = useCallback(async () => {
    try {
      const attachmentsData = await getCardAttachments(card.id);
      setAttachments(attachmentsData);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    }
  }, [card.id]);

  useEffect(() => {
    fetchUsers();
    fetchLabels();
    fetchAttachments();
  }, [card.id, fetchUsers, fetchLabels, fetchAttachments]);

    // Handle click outside to close popups
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (showLabelForm && labelFormRef.current && !labelFormRef.current.contains(event.target)) {
        setShowLabelForm(false);
        setNewLabel('');
        setNewLabelColor('#0079bf');
        setLabelErrors({});
      }
      if (showAttachmentForm && attachmentFormRef.current && !attachmentFormRef.current.contains(event.target)) {
        setShowAttachmentForm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu, showLabelForm, showAttachmentForm]);

  const validateCard = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = 'Card title is required';
    else if (title.length > 100) newErrors.title = 'Card title must be less than 100 characters';
    if (description && description.length > 500) newErrors.description = 'Card description must be less than 500 characters';
    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateCard()) return;
    try {
      const updatedCard = await updateCard(card.id, title.trim(), description.trim(), status, assignedTo, null, null, dueDate);
      setIsEditing(false);
      setEditErrors({});
      if (onUpdate) onUpdate();
      socketService.emitCardUpdated({
        boardId: card.board_id,
        listId: card.list_id,
        card: { ...card, ...updatedCard }
      });
    } catch (error) {
      setEditErrors({ general: error.response?.data?.error || 'Error updating card' });
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      try {
        await deleteCard(card.id);
        onDelete(card.id);
        socketService.emitCardDeleted({
          boardId: card.board_id,
          listId: card.list_id,
          cardId: card.id
        });
      } catch (error) {
        console.error('Error deleting card:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDueDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'To Do': return 'bg-gray-100 text-gray-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Done': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

    const validateLabelForm = () => {
    const newErrors = {};
    
    if (newLabel.trim() && newLabel.trim().length > 50) {
      newErrors.text = 'Label text must be less than 50 characters';
    }
    
    setLabelErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleLabelInputChange = (value) => {
    setNewLabel(value);
    if (labelErrors.text) {
      setLabelErrors({ ...labelErrors, text: '' });
    }
  };

  const handleAddLabel = async () => {
    if (!validateLabelForm()) {
    if (!newLabel.trim()) return;
      return;
    }

    try {
      await createCardLabel(card.id, newLabel.trim() || '', newLabelColor);
      setNewLabel('');
      setNewLabelColor('#3B82F6');
      setLabelErrors({});
      setShowLabelForm(false);
      fetchLabels();
    } catch (error) {
      console.error('Error adding label:', error);
      setLabelErrors({ general: 'Error adding label: ' + (error.response?.data?.error || 'Unknown error') });
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      console.log('Uploading file:', { filename: file.name, size: file.size, type: file.type });
      const result = await uploadCardAttachment(card.id, file);
      console.log('Upload result:', result);
      fetchAttachments();
      setShowAttachmentForm(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      alert('Error uploading file: ' + (error.response?.data?.error || error.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  // Đã xóa handleDeleteLabel vì chưa dùng

  // ==========================
  // Editing Mode
  // ==========================
  if (isEditing) {
    return (
      <div className="card-container space-y-2">
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full p-2 border rounded-md resize-none focus:outline-none focus:ring-2 ${
            editErrors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
          rows="2"
          placeholder="Card title..."
        />
        {editErrors.title && <p className="text-red-600 text-sm">{editErrors.title}</p>}

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add description..."
          className="w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="2"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="To Do">To Do</option>
          <option value="In Progress">In Progress</option>
          <option value="Done">Done</option>
        </select>

        <select
          value={assignedTo || ''}
          onChange={(e) => setAssignedTo(e.target.value ? parseInt(e.target.value) : null)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">No one assigned</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.username}
            </option>
          ))}
        </select>

        <input
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {editErrors.general && <p className="text-red-600 text-sm">{editErrors.general}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-800 text-sm"
          >
            <X size={16} /> Cancel
          </button>
        </div>
      </div>
    );
  }

  // ==========================
  // Normal Mode
  // ==========================
  return (
  <div className="card-container group relative">
      {/* Drag Handle */}
      {dragListeners && (
        <div
          className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-gray-300 rounded cursor-grab hover:bg-gray-400 opacity-0 group-hover:opacity-100 transition"
          {...dragListeners}
          title="Drag to reorder"
        />
      )}

      {/* Header: Title + Status + Menu */}
      <div className="flex items-start justify-between mb-2">
  <h4 className="card-title">{card.title}</h4>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(card.status)}`}>
            <span className={`card-status ${card.status === 'To Do' ? 'todo' : card.status === 'In Progress' ? 'inprogress' : 'done'}`}>{card.status}</span>
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700"
          >
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Description */}
      {card.description && <p className="text-gray-600 text-xs mb-2">{card.description}</p>}
  {card.description && <p className="card-description">{card.description}</p>}

      {/* Due Date */}
      {card.due_date && (
        <div className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full mb-2 ${getStatusColor(card.status)}`}>
          <Calendar size={12} className="mr-1" />
          {formatDueDate(card.due_date)}
        </div>
      )}
      {/* Labels */}
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {labels.map((label) => (
            <span
              key={label.id}
              className="card-label"
              style={{ backgroundColor: label.color }}
            >
              {label.label || '•'}
            </span>
          ))}
        </div>
      )}
      

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="space-y-1 mb-2">
          <div className="flex items-center text-xs text-gray-600 font-medium mb-1">
            <Paperclip size={12} className="mr-1" /> Attachments ({attachments.length})
          </div>
          {attachments.slice(0, 2).map((att) => (
            <div key={att.id} className="card-attachment">
              <div className="flex items-center flex-1 min-w-0">
                <File size={14} className="mr-1 text-gray-500" />
                <span className="truncate text-xs text-gray-700" title={att.original_name}>{att.original_name}</span>
                <span className="text-xs text-gray-400 ml-2">({(att.file_size / 1024).toFixed(2)} KB)</span>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <a href={att.file_path} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                  <Download size={14} />
                </a>
                <button onClick={() => handleDelete(att.id)} className="text-red-500 hover:text-red-700">
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center text-xs text-gray-400">
        <span>Created: {formatDate(card.created_at)}</span>
        {card.assigned_to && (
          <span className="card-assigned">
            {users.find((u) => u.id === card.assigned_to)?.username || 'Unknown'}
          </span>
        )}
      </div>

      {/* Menu */}
      {showMenu && (
        <div className="absolute top-8 right-2 w-40 bg-white rounded-md shadow-lg z-10 border border-gray-200">
          <button onClick={() => { setIsEditing(true); setShowMenu(false); }}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <Edit3 size={16} /> Edit
          </button>
          <button onClick={() => { setShowLabelForm(true); setShowMenu(false); }}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <Tag size={16} /> Add Label
          </button>
          <button onClick={() => { setShowAttachmentForm(true); setShowMenu(false); }}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            <Paperclip size={16} /> Add File
          </button>
          <button onClick={() => { handleDelete(); setShowMenu(false); }}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50">
            <Trash2 size={16} /> Delete
          </button>
        </div>
      )}

      {/* Attachment Form */}
      {showAttachmentForm && (
        <div className="absolute top-8 right-2 w-64 bg-white rounded-md shadow-lg z-20 border border-gray-200 p-3">
          <h4 className="text-sm font-medium mb-2">Add File</h4>
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/*,application/zip,application/x-rar-compressed,video/*,audio/*,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          />
          {uploading && (
            <div className="text-sm text-blue-600 mb-2">Uploading...</div>
          )}
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAttachmentForm(false)}
              className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Label Form */}
      {showLabelForm && (
        <div className="absolute top-8 right-2 w-64 bg-white rounded-md shadow-lg z-20 border border-gray-200 p-3">
          <h4 className="text-sm font-medium mb-2">Add Label</h4>
          <input
            type="text"
            value={newLabel}
            onChange={(e) => handleLabelInputChange(e.target.value)}
            placeholder="Label text (optional)"
            className={`w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 mb-2 ${
              labelErrors.text 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300 focus:ring-trello-blue'
            }`}
          />
          {labelErrors.text && (
            <p className="text-sm text-red-600 mb-2">{labelErrors.text}</p>
          )}
          {labelErrors.general && (
            <p className="text-sm text-red-600 mb-2">{labelErrors.general}</p>
          )}
          <div className="flex flex-wrap gap-1 mb-3">
            {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'].map((color) => (
              <button
                key={color}
                onClick={() => setNewLabelColor(color)}
                className={`w-6 h-6 rounded-full border-2 ${
                  newLabelColor === color ? 'border-gray-800' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handleAddLabel}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowLabelForm(false);
                setNewLabel('');
                setNewLabelColor('#3B82F6');
              }}
              className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Card;
