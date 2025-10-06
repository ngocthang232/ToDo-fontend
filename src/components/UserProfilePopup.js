import React, { useState } from 'react';
import { updateUserProfile, uploadAvatar } from '../services/api';
import { X, User, Mail, Lock, Eye, EyeOff, Camera } from 'lucide-react';

const UserProfilePopup = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    email: user.email || '',
    phone: user.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [avatarPreview, setAvatarPreview] = useState(user.avatar || user.avatarUrl || '');
  const [avatarFile, setAvatarFile] = useState(null);
  // Xử lý chọn file ảnh
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
        return '';
      case 'phone':
        if (value && !/^\d{8,15}$/.test(value)) return 'Số điện thoại không hợp lệ';
        return '';
      case 'currentPassword':
        if (formData.newPassword && !value) return 'Current password is required';
        return '';
      case 'newPassword':
        if (value && value.length < 6) return 'New password must be at least 6 characters';
        return '';
      case 'confirmPassword':
        if (formData.newPassword && !value) return 'Please confirm your new password';
        if (formData.newPassword && value !== formData.newPassword) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors = {};

  if (!formData.email.trim()) newErrors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
  if (formData.phone && !/^\d{8,15}$/.test(formData.phone)) newErrors.phone = 'Số điện thoại không hợp lệ';

    // Chỉ validate mật khẩu nếu có nhập newPassword hoặc confirmPassword
    // Chỉ validate mật khẩu nếu có nhập mật khẩu mới
    if (formData.newPassword) {
      if (!formData.currentPassword) newErrors.currentPassword = 'Current password is required';
      if (formData.newPassword.length < 6) newErrors.newPassword = 'At least 6 characters';
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
      else if (formData.newPassword !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      let avatarUrl = user.avatarUrl;
      if (avatarFile) {
        try {
          avatarUrl = await uploadAvatar(avatarFile);
        } catch (err) {
          setErrors({ general: 'Upload avatar failed' });
          setLoading(false);
          return;
        }
      }
      await updateUserProfile(
        formData.email.trim(),
        formData.phone.trim(),
        formData.currentPassword || null,
        formData.newPassword || null,
        avatarUrl
      );
      onUpdate({ ...user, email: formData.email.trim(), phone: formData.phone.trim(), avatarUrl });
      onClose();
    } catch (error) {
      setErrors({ general: error.response?.data?.error || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-2"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fadeIn overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center gap-3">
            <User className="w-7 h-7 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Thông tin cá nhân</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-200 rounded-full transition"
            title="Đóng"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative group">
              <img
                src={avatarPreview || `https://ui-avatars.com/api/?name=${user.username}`}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-200 shadow-md"
              />
              <label className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow cursor-pointer hover:bg-blue-100 transition group-hover:scale-110">
                <Camera className="w-5 h-5 text-blue-600" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <span className="text-xs text-gray-500">Nhấn vào biểu tượng để đổi ảnh</span>
          </div>

          {/* Username, Email & Phone */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tên đăng nhập</label>
              <input
                type="text"
                value={user.username}
                disabled
                className="w-full p-3 rounded-lg bg-gray-100 text-gray-500 border border-gray-300 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full pl-10 pr-3 py-3 rounded-lg border focus:outline-none focus:ring-2 ${
                    errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Nhập email của bạn"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 ${
                  errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Nhập số điện thoại (tùy chọn)"
              />
              {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
            </div>
          </div>

          {/* Đổi mật khẩu */}
          <div className="border-t pt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Đổi mật khẩu <span className="text-gray-400">(Không bắt buộc)</span></h3>
            <div className="grid grid-cols-1 gap-4">
              {['currentPassword', 'newPassword', 'confirmPassword'].map((field, i) => {
                const label = ['Mật khẩu hiện tại', 'Mật khẩu mới', 'Xác nhận mật khẩu mới'][i];
                const show = ['current', 'new', 'confirm'][i];
                return (
                  <div key={field}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showPasswords[show] ? 'text' : 'password'}
                        name={field}
                        value={formData[field]}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full pl-10 pr-10 py-3 rounded-lg border focus:outline-none focus:ring-2 ${
                          errors[field] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        placeholder={label}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(show)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                        tabIndex={-1}
                      >
                        {showPasswords[show] ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors[field] && <p className="mt-1 text-xs text-red-600">{errors[field]}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 text-center">
              {errors.general}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-600 hover:text-blue-700 hover:bg-blue-50 transition font-semibold"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-semibold disabled:opacity-50"
            >
              {loading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfilePopup;
