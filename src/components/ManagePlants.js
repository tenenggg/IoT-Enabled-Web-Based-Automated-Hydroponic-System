import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaEdit, FaTrash } from 'react-icons/fa';

function ManagePlants() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPlant, setEditingPlant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    ph_min: '',
    ph_max: '',
    ec_min: '',
    ec_max: '',
    image_url: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    try {
      const { data, error } = await supabase
        .from('plant_profiles')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setPlants(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plant) => {
    setEditingPlant(plant);
    setFormData({
      name: plant.name,
      ph_min: plant.ph_min,
      ph_max: plant.ph_max,
      ec_min: plant.ec_min,
      ec_max: plant.ec_max,
      image_url: plant.image_url,
    });
  };

  const handleDelete = async (plantId) => {
    if (!window.confirm('Are you sure you want to delete this plant?')) return;

    try {
      const { error } = await supabase
        .from('plant_profiles')
        .delete()
        .eq('id', plantId);

      if (error) throw error;
      fetchPlants();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlant) {
        const { error } = await supabase
          .from('plant_profiles')
          .update(formData)
          .eq('id', editingPlant.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('plant_profiles')
          .insert([formData]);

        if (error) throw error;
      }

      setEditingPlant(null);
      setFormData({
        name: '',
        ph_min: '',
        ph_max: '',
        ec_min: '',
        ec_max: '',
        image_url: '',
      });
      fetchPlants();
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <div className="text-center mt-8">Loading...</div>;

  return (
    <div className="min-h-screen bg-green-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Manage Plants</h1>
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

        {/* Add/Edit Plant Form */}
        <div className="bg-white text-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-bold mb-4">
            {editingPlant ? 'Edit Plant' : 'Add New Plant'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2">Plant Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-gray-800"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">pH Min</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.ph_min}
                  onChange={(e) => setFormData({ ...formData, ph_min: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-gray-800"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">pH Max</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.ph_max}
                  onChange={(e) => setFormData({ ...formData, ph_max: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-gray-800"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">EC Min</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.ec_min}
                  onChange={(e) => setFormData({ ...formData, ec_min: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-gray-800"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">EC Max</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.ec_max}
                  onChange={(e) => setFormData({ ...formData, ec_max: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-gray-800"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2">Image URL</label>
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-gray-800"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-green-700 hover:bg-green-800 px-4 py-2 rounded-lg"
              >
                {editingPlant ? 'Update Plant' : 'Add Plant'}
              </button>
              {editingPlant && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPlant(null);
                    setFormData({
                      name: '',
                      ph_min: '',
                      ph_max: '',
                      ec_min: '',
                      ec_max: '',
                      image_url: '',
                    });
                  }}
                  className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Plants List */}
        <div className="bg-white text-gray-800 rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  pH Min
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  pH Max
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EC Min
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  EC Max
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image URL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {plants.map((plant) => (
                <tr key={plant.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{plant.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{plant.ph_min}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{plant.ph_max}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{plant.ec_min}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{plant.ec_max}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {plant.image_url ? (
                      <div className="flex items-center gap-2">
                        <img
                          src={plant.image_url}
                          alt={plant.name}
                          style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }}
                          title={plant.image_url}
                        />
                        <span title={plant.image_url} style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', whiteSpace: 'nowrap' }}>
                          {plant.image_url.length > 20 ? plant.image_url.slice(0, 20) + '...' : plant.image_url}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No image</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(plant)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(plant.id)}
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

export default ManagePlants; 