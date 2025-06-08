import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaEdit, FaTrash } from 'react-icons/fa';

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'user',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      role: user.role,
    });
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      // 1. Delete from Auth via backend
      await fetch(`http://localhost:5000/api/users/${userId}`, { method: 'DELETE' });

      // 2. Delete from profiles table
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      fetchUsers();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // 1. Update in Auth via backend
        const updateBody = { email: formData.email };
        if (formData.password && formData.password.length >= 6) {
          updateBody.password = formData.password;
        }
        await fetch(`http://localhost:5000/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateBody),
        });

        // 2. Update in profiles table
        const { error } = await supabase
          .from('profiles')
          .update({
            email: formData.email,
            role: formData.role,
          })
          .eq('id', editingUser.id);

        if (error) throw error;
      } else {
        // First create the auth user with email and password
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;

        // Then create the profile entry
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: authData.user.id,
            email: formData.email,
            role: formData.role,
          }]);

        if (profileError) throw profileError;
      }

      setEditingUser(null);
      setFormData({ email: '', password: '', role: 'user' });
      fetchUsers();
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <div className="text-center mt-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-green-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Manage Users</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Add/Edit User Form */}
        <div className="bg-white text-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-bold mb-4">
            {editingUser ? 'Edit User' : 'Add New User'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-gray-800"
                required
              />
            </div>
            {(editingUser || !editingUser) && (
              <div>
                <label className="block text-sm font-bold mb-2">Password{editingUser && ' (leave blank to keep unchanged)'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-gray-800"
                  minLength={editingUser ? 0 : 6}
                  placeholder={editingUser ? 'Leave blank to keep current password' : ''}
                  required={!editingUser}
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-bold mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-gray-800"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-lg"
              >
                {editingUser ? 'Update User' : 'Add User'}
              </button>
              {editingUser && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setFormData({ email: '', password: '', role: 'user' });
                  }}
                  className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Users List */}
        <div className="bg-white text-gray-800 rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ManageUsers;