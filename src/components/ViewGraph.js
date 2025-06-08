import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import Chart from 'react-apexcharts';

function ViewGraph() {
  const navigate = useNavigate();
  const [chartData, setChartData] = useState([]);
  const [plantName, setPlantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('15'); // Default to last 15 entries
  const [statistics, setStatistics] = useState({
    temperature: { min: 0, max: 0, avg: 0, latest: 0 },
    ph: { min: 0, max: 0, avg: 0, latest: 0 },
    ec: { min: 0, max: 0, avg: 0, latest: 0 }
  });

  // Calculate statistics for a given data array and key
  const calculateStats = (data, key) => {
    if (!data.length) return { min: 0, max: 0, avg: 0, latest: 0 };
    const values = data.map(d => d[key]);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      latest: values[values.length - 1]
    };
  };

  // Check if value is out of range
  const isOutOfRange = (value, type) => {
    const ranges = {
      temperature: { min: 18, max: 30 },
      ph: { min: 5.5, max: 7.5 },
      ec: { min: 1.0, max: 3.0 }
    };
    return value < ranges[type].min || value > ranges[type].max;
  };

  const getSelectedPlantData = useCallback(async () => {
    try {
      // 1. Get selected plant ID from system_config
      const { data: configData, error: configError } = await supabase
        .from('system_config')
        .select('selected_plant_id')
        .limit(1)
        .single();

      if (configError || !configData) {
        console.error('Error fetching selected plant ID:', configError);
        return;
      }

      const selectedPlantId = configData.selected_plant_id;

      // 2. Get plant name using ID (only fetch if plantName is not already set)
      let fetchedPlantName = plantName;
      if (!plantName) {
        const { data: profileData, error: profileError } = await supabase
          .from('plant_profiles')
          .select('name')
          .eq('id', selectedPlantId)
          .single();

        if (profileError || !profileData) {
          console.error('Error fetching plant name:', profileError);
          return;
        }

        fetchedPlantName = profileData.name;
        setPlantName(fetchedPlantName);
      }

      // 3. Get data from sensor_data table for the selected plant
      const { data: sensorData, error: dataError } = await supabase
        .from('sensor_data')
        .select('*')
        .eq('plant_profile_name', fetchedPlantName)
        .order('created_at', { ascending: true });

      if (dataError) {
        console.error(`Error fetching data from sensor_data:`, dataError);
        return;
      }

      setChartData(sensorData);
      
      // Calculate statistics
      setStatistics({
        temperature: calculateStats(sensorData, 'water_temperature'),
        ph: calculateStats(sensorData, 'ph'),
        ec: calculateStats(sensorData, 'ec')
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error updating graph data:', error);
    }
  }, [plantName]);

  useEffect(() => {
    getSelectedPlantData(); // fetch on mount

    const interval = setInterval(() => {
      getSelectedPlantData(); // fetch every 3 seconds
    }, 3000);

    return () => clearInterval(interval); // cleanup
  }, [getSelectedPlantData]); // Added getSelectedPlantData as a dependency

  const limitedChartData = chartData.slice(-parseInt(timeRange));

  const commonOptions = {
    chart: { 
      id: 'sensor-data', 
      toolbar: { 
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: false // <-- This removes the home (reset zoom) icon
        }
      },
      zoom: { enabled: true }
    },
    xaxis: {
      categories: limitedChartData.map(d => new Date(d.created_at).toLocaleTimeString()),
    },
    tooltip: {
      enabled: true,
      shared: true,
      intersect: false,
      x: {
        format: 'HH:mm:ss'
      },
      y: {
        formatter: (value) => value.toFixed(2)
      }
    },
    markers: {
      size: 4,
      hover: {
        size: 6
      }
    }
  };

  const StatCard = ({ title, stats, type }) => (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">Min: <span className={isOutOfRange(stats.min, type) ? 'text-red-500' : ''}>{stats.min.toFixed(2)}</span></p>
          <p className="text-sm text-gray-600">Max: <span className={isOutOfRange(stats.max, type) ? 'text-red-500' : ''}>{stats.max.toFixed(2)}</span></p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Avg: {stats.avg.toFixed(2)}</p>
          <p className="text-sm text-gray-600">Latest: <span className={isOutOfRange(stats.latest, type) ? 'text-red-500' : ''}>{stats.latest.toFixed(2)}</span></p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 bg-green-100 min-h-screen">
      <div className="mb-4 p-4 bg-white shadow rounded text-center">
        <h1 className="text-6xl font-bold mb-4 text-green-700">View Graph</h1>
        <h2 className="text-2xl mb-4 text-gray-600">{plantName ? `Plant: ${plantName}` : 'Loading...'}</h2>

        {loading ? (
          <p className="text-lg text-gray-500">Fetching data...</p>
        ) : (
          <>
            <div className="mb-4 flex justify-between items-center">
              <select 
                className="p-2 border rounded"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="15">Last 15 entries</option>
                <option value="30">Last 30 entries</option>
                <option value="60">Last 60 entries</option>
                <option value="all">All data</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <StatCard title="Temperature Statistics" stats={statistics.temperature} type="temperature" />
              <StatCard title="pH Statistics" stats={statistics.ph} type="ph" />
              <StatCard title="EC Statistics" stats={statistics.ec} type="ec" />
            </div>

            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2 text-green-700">Temperature (°C)</h2>
              <Chart
                options={commonOptions}
                series={[{ name: 'Temperature (°C)', data: limitedChartData.map(d => d.water_temperature) }]}
                type="line"
                width="100%"
                height="400"
              />
            </div>

            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2 text-green-700">pH</h2>
              <Chart
                options={commonOptions}
                series={[{ name: 'pH', data: limitedChartData.map(d => d.ph) }]}
                type="line"
                width="100%"
                height="400"
              />
            </div>

            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2 text-green-700">EC (mS/cm)</h2>
              <Chart
                options={commonOptions}
                series={[{ name: 'EC (mS/cm)', data: limitedChartData.map(d => d.ec) }]}
                type="line"
                width="100%"
                height="400"
              />
            </div>
          </>
        )}

        <button className="mt-4 px-6 py-3 bg-green-500 text-white rounded text-2xl" onClick={() => navigate("/")}>
          GO HOMEPAGE
        </button>
      </div>
    </div>
  );
}

export default ViewGraph;
