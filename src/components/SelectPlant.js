import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom'; // Assuming you're using React Router

function SelectPlant() {
  const [plants, setPlants] = useState([]);
  const [selected, setSelected] = useState(null);
  const [configId, setConfigId] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // For navigation

  // Fetch plant list and config on load
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Fetch all plant profiles
      const { data: plantList, error: plantError } = await supabase
        .from('plant_profiles')
        .select('*, image_url');

      if (plantError) {
        console.error('Error fetching plant profiles:', plantError.message);
        setLoading(false);
        return;
      }

      setPlants(plantList || []);

      // Get system_config (first one)
      const { data: config, error: configError } = await supabase
        .from('system_config')
        .select('id, selected_plant_id')
        .limit(1)
        .single();

      if (configError) {
        console.error('Error fetching config:', configError.message);
        setLoading(false);
        return;
      }

      setConfigId(config.id);

      const selectedPlant = plantList.find(p => p.id === config.selected_plant_id);
      setSelected(selectedPlant || null);
      setLoading(false);
    }

    fetchData();
  }, []);

  // Handle dropdown change
  const handleChange = async (e) => {
    const selectedId = e.target.value;
    const chosenPlant = plants.find(p => p.id === selectedId);

    if (!chosenPlant || !configId) return;

    setSelected(chosenPlant);

    const { error } = await supabase
      .from('system_config')
      .update({ selected_plant_id: selectedId })
      .eq('id', configId);

    if (error) {
      console.error('Error updating selected plant:', error.message);
    } else {
      console.log('Updated selected plant:', selectedId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-12 flex flex-col items-center justify-start">
      <div className="w-full max-w-3xl bg-white p-12 rounded-3xl shadow-lg flex flex-col justify-between" style={{ minHeight: '600px' }}>
        <div>
          <h1 className="text-6xl font-bold mb-8 text-green-700">Select Plant Profile</h1>

          {loading ? (
            <p className="text-3xl text-gray-500">Loading...</p>
          ) : (
            <>
              <select
                className="w-full p-6 border rounded-2xl mb-10 text-3xl"
                value={selected?.id || ''}
                onChange={handleChange}
              >
                <option value="">Choose a plant...</option>
                {plants.map(plant => (
                  <option key={plant.id} value={plant.id}>
                    {plant.name}
                  </option>
                ))}
              </select>

              {selected && (
                <div className="bg-green-50 border border-green-200 p-8 rounded-2xl text-3xl flex flex-col items-center">
                  <h2 className="text-4xl font-semibold text-green-800 mb-6">Current Selection</h2>
                  {selected.image_url && (
                    <img
                      src={selected.image_url}
                      alt={selected.name}
                      className="mb-6 rounded-xl shadow-lg"
                      style={{ maxWidth: '300px', maxHeight: '300px', objectFit: 'contain' }}
                    />
                  )}
                  <p><span className="font-medium">Name:</span> {selected.name}</p>
                  <p><span className="font-medium">pH Range:</span> {selected.ph_min} - {selected.ph_max}</p>
                  <p><span className="font-medium">EC Range:</span> {selected.ec_min} - {selected.ec_max}</p>
                </div>
              )}
            </>
          )}
        </div>

        <button
          className="mt-4 px-6 py-3 bg-green-500 text-white rounded text-2xl self-center"
          onClick={() => navigate("/")}
        >
          GO HOMEPAGE
        </button>
      </div>
    </div>
  );
}

export default SelectPlant;
