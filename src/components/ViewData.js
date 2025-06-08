import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { FaThermometerHalf, FaTint } from 'react-icons/fa';
import ReactSpeedometer from 'react-d3-speedometer';

function ViewData() {
  const navigate = useNavigate();
  const [sensorData, setSensorData] = useState(null);

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase
        .from('sensor_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setSensorData(data[0]);
      }
    };

    getData();

    const channel = supabase
      .channel('public:sensor_data')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_data' }, payload => {
        setSensorData(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="p-4 bg-green-100 min-h-screen">
      <div className="mb-4 p-4 bg-white shadow rounded text-center">
        <h1 className="text-6xl font-bold mb-4 text-green-700">View Data</h1>
        {sensorData && (
          <div className="grid grid-cols-1 gap-2">
            <div className="p-1 bg-green-200 rounded shadow flex items-center justify-between">
              <div className="flex items-center">
                <FaThermometerHalf className="text-2xl mr-1 text-green-700" />
                <h2 className="text-4xl font-bold text-green-700">Water Temperature</h2>
              </div>
              <div className="w-24 mx-auto mt-6">
                <ReactSpeedometer
                  maxValue={100}
                  value={sensorData.water_temperature}
                  needleColor="black"
                  startColor="green"
                  endColor="red"
                  textColor="green"
                  segments={10}
                  currentValueText={`${sensorData.water_temperature} °C`}
                  textStyle={{ fontSize: '12px' }}
                />
              </div>
            </div>
            <div className="p-1 bg-green-200 rounded shadow flex items-center justify-between">
              <div className="flex items-center">
                <FaTint className="text-2xl mr-1 text-green-700" />
                <h2 className="text-4xl font-bold text-green-700">Nutrient Solution</h2>
              </div>
              <div className="flex justify-around w-full mt-6">
                <div className="flex flex-col items-center w-24 mx-auto">
                  <h3 className="text-lg font-bold text-green-700 mb-1">pH Level</h3>
                  <ReactSpeedometer
                    maxValue={14}
                    value={sensorData.ph}
                    needleColor="black"
                    startColor="green"
                    endColor="red"
                    textColor="green"
                    segments={10}
                    currentValueText={`${sensorData.ph}`}
                    textStyle={{ fontSize: '12px' }}
                  />
                </div>
                <div className="flex flex-col items-center w-24 mx-auto">
                  <h3 className="text-lg font-bold text-green-700 mb-1">EC</h3>
                  <ReactSpeedometer
                    maxValue={10}
                    value={sensorData.ec}
                    needleColor="black"
                    startColor="green"
                    endColor="red"
                    textColor="green"
                    segments={10}
                    currentValueText={`${sensorData.ec} mS/cm`}
                    textStyle={{ fontSize: '12px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        <button className="mt-4 px-6 py-3 bg-green-500 text-white rounded text-2xl" onClick={() => navigate("/")}>GO HOMEPAGE</button>
      </div>
    </div>
  );
}

export default ViewData;
