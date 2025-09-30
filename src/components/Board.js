import React, { useState, useEffect, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import SortableList from './SortableList';
import { getLists, createList, updateListPositions } from '../services/api';
import socketService from '../services/socketService';

const Board = ({ boardId }) => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddList, setShowAddList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchLists = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLists(boardId);
      setLists(data);
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (boardId) {
      fetchLists();
      
      // Set up WebSocket listeners for real-time updates
      const handleListCreated = (data) => {
        if (data.boardId === boardId) {
          setLists(prev => [...prev, data.list]);
        }
      };

      const handleListUpdated = (data) => {
        if (data.boardId === boardId) {
          setLists(prev => prev.map(list => 
            list.id === data.list.id ? { ...list, ...data.list } : list
          ));
        }
      };

      const handleListDeleted = (data) => {
        if (data.boardId === boardId) {
          setLists(prev => prev.filter(list => list.id !== data.listId));
        }
      };

      // Set up listeners
      socketService.onListCreated(handleListCreated);
      socketService.onListUpdated(handleListUpdated);
      socketService.onListDeleted(handleListDeleted);

      // Cleanup
      return () => {
        socketService.offListCreated(handleListCreated);
        socketService.offListUpdated(handleListUpdated);
        socketService.offListDeleted(handleListDeleted);
      };
    }
  }, [boardId, fetchLists]);

  const [listErrors, setListErrors] = useState({});

  const validateListForm = () => {
    const newErrors = {};
    
    if (!newListTitle.trim()) {
      newErrors.title = 'List title is required';
    } else if (newListTitle.length > 50) {
      newErrors.title = 'List title must be less than 50 characters';
    }
    
    setListErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (validateListForm()) {
      try {
        const newList = await createList(boardId, newListTitle.trim());
        setLists([...lists, newList]);
        setNewListTitle('');
        setListErrors({});
        setShowAddList(false);
        
        // Emit WebSocket event for real-time collaboration
        socketService.emitListCreated({
          boardId,
          list: newList
        });
      } catch (error) {
        console.error('Error creating list:', error);
        setListErrors({ general: 'Error creating list: ' + (error.response?.data?.error || 'Unknown error') });
      }
    }
  };

  const handleListInputChange = (value) => {
    setNewListTitle(value);
    if (listErrors.title) {
      setListErrors({ ...listErrors, title: '' });
    }
  };

  const handleDeleteList = (listId) => {
    setLists(lists.filter(list => list.id !== listId));
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = lists.findIndex(list => list.id === active.id);
      const newIndex = lists.findIndex(list => list.id === over.id);

      const newLists = arrayMove(lists, oldIndex, newIndex);
      setLists(newLists);

      // Update positions in database
      try {
        const updatedLists = newLists.map((list, index) => ({
          id: list.id,
          position: index
        }));
        await updateListPositions(updatedLists);
      } catch (error) {
        console.error('Error updating list positions:', error);
        // Revert on error
        setLists(lists);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading board...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="flex overflow-x-auto space-x-4 pb-4">
          <SortableContext items={lists.map(list => list.id)} strategy={horizontalListSortingStrategy}>
            {lists.map((list) => (
              <SortableList
                key={list.id}
                list={list}
                onDelete={() => handleDeleteList(list.id)}
              />
            ))}
          </SortableContext>
          
          {/* Add List Form */}
          <div className="flex-shrink-0 w-72">
          {showAddList ? (
            <form onSubmit={handleCreateList} className="bg-gray-100 rounded-lg p-3">
              <input
                type="text"
                value={newListTitle}
                onChange={(e) => handleListInputChange(e.target.value)}
                placeholder="Enter list title..."
                className={`w-full p-2 border rounded focus:outline-none focus:ring-2 ${
                  listErrors.title 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                autoFocus
              />
              {listErrors.title && (
                <p className="mt-1 text-sm text-red-600">{listErrors.title}</p>
              )}
              {listErrors.general && (
                <p className="mt-1 text-sm text-red-600">{listErrors.general}</p>
              )}
              <div className="flex justify-between mt-2">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors"
                >
                  Add List
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddList(false);
                    setNewListTitle('');
                    setListErrors({});
                  }}
                  className="text-gray-600 px-3 py-1 rounded text-sm hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
            ) : (
              <button
                onClick={() => setShowAddList(true)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <span className="text-lg mr-2">+</span>
                Add a list
              </button>
            )}
          </div>
        </div>
      </DndContext>
    </div>
  );
};

export default Board;
