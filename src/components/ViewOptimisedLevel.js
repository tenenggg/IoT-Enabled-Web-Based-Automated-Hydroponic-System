import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTint } from 'react-icons/fa';
import ReactSpeedometer from 'react-d3-speedometer';
import { supabase } from '../supabaseClient';

function ViewOptimisedLevel() {
  const navigate = useNavigate();
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlants = async () => {
      const { data, error } = await supabase
        .from('plant_profiles')
        .select('*');
      if (error) {
        setError(error.message);
      } else {
        setPlants(data);
      }
      setLoading(false);
    };
    fetchPlants();
  }, []);

  return (
    <div className="p-4 bg-green-100 min-h-screen">
      <div className="mb-4 p-4 bg-white shadow rounded text-center">
        <h1 className="text-6xl font-bold mb-4 text-green-700">View Optimised Level</h1>
        {loading ? (
          <div className="text-green-700 text-xl">Loading...</div>
        ) : error ? (
          <div className="text-red-700 text-xl">{error}</div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {plants.map((item, index) => {
              const avgPh = ((item.ph_min + item.ph_max) / 2).toFixed(2);
              const avgEc = ((item.ec_min + item.ec_max) / 2).toFixed(2);
              return (
                <div key={index} className="p-1 bg-green-200 rounded shadow flex items-center justify-between">
                  <div className="flex items-center">
                    <FaTint className="text-2xl mr-1 text-green-700" />
                    <h2 className="text-4xl font-bold text-green-700">{item.name}</h2>
                  </div>
                  <div className="flex justify-around w-full mt-6">
                    <div className="flex flex-col items-center w-24 mx-auto">
                      <h3 className="text-lg font-bold text-green-700 mb-1">pH Level</h3>
                      <ReactSpeedometer
                        maxValue={14}
                        value={parseFloat(avgPh)}
                        needleColor="black"
                        startColor="green"
                        endColor="red"
                        textColor="green"
                        segments={10}
                        currentValueText={`${avgPh}`}
                        textStyle={{ fontSize: '12px' }}
                      />
                    </div>
                    <div className="flex flex-col items-center w-24 mx-auto">
                      <h3 className="text-lg font-bold text-green-700 mb-1">EC</h3>
                      <ReactSpeedometer
                        maxValue={10}
                        value={parseFloat(avgEc)}
                        needleColor="black"
                        startColor="green"
                        endColor="red"
                        textColor="green"
                        segments={10}
                        currentValueText={`${avgEc} mS/cm`}
                        textStyle={{ fontSize: '12px' }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <button className="mt-4 px-6 py-3 bg-green-500 text-white rounded text-2xl" onClick={() => navigate("/")}>GO HOMEPAGE</button>
      </div>
    </div>
  );
}

export default ViewOptimisedLevel;
