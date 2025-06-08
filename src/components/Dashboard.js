import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLeaf, FaFlask, FaChartLine, FaClock, FaUsers, FaUserCog, FaSeedling, FaSignOutAlt, FaTable } from 'react-icons/fa';
import { supabase } from '../supabaseClient';

function Dashboard() {
  const navigate = useNavigate();
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    setUserRole(role);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-green-900 text-white flex flex-col items-center">
      {/* Header */}
      <div className="h-48 flex items-center justify-center">
        <div className="bg-green-700 bg-opacity-90 px-8 py-3 rounded-lg">
          <h1 className="text-6xl font-bold">Hydroponic Monitoring</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-row items-start justify-center px-16 py-12 gap-40 mt-48">
        {/* 2x2 Grid for Widgets */}
        <div className="grid grid-cols-2 gap-10">
          {/* Common Widgets for both User and Admin */}
          <div onClick={() => navigate("/view-data")} className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform">
            <FaLeaf size={80} />
            <p className="mt-2 underline text-xl">View Data</p>
          </div>
          <div onClick={() => navigate("/view-optimised-level")} className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform">
            <FaFlask size={80} />
            <p className="mt-2 underline text-xl">Optimized Level</p>
          </div>
          <div onClick={() => navigate("/view-graph")} className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform">
            <FaChartLine size={80} />
            <p className="mt-2 underline text-xl">View Graph</p>
          </div>
          <div onClick={() => navigate("/select-plant")} className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform">
            <FaLeaf size={80} />
            <p className="mt-2 underline text-xl">Select Plant</p>
          </div>
          <div onClick={() => navigate("/raw-data")} className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform">
            <FaTable size={80} />
            <p className="mt-2 underline text-xl">Raw Data</p>
          </div>

          {/* Admin-only Widgets */}
          {userRole === 'admin' && (
            <>
              <div onClick={() => navigate("/manage-users")} className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform">
                <FaUsers size={80} />
                <p className="mt-2 underline text-xl">Manage Users</p>
              </div>
              <div onClick={() => navigate("/manage-plants")} className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform">
                <FaSeedling size={80} />
                <p className="mt-2 underline text-xl">Manage Plants</p>
              </div>
            </>
          )}
        </div>

        {/* Right Side Widgets */}
        <div className="flex flex-col gap-6">
          {/* Clock Widget */}
          <div className="flex flex-col items-center border-4 border-white rounded-2xl p-6">
            <FaClock size={100} />
            <p className="mt-4 text-4xl">{currentTime}</p>
          </div>

          {/* User Info and Logout */}
          <div className="flex flex-col items-center border-4 border-white rounded-2xl p-6">
            <FaUserCog size={80} />
            <p className="mt-4 text-xl">Role: {userRole}</p>
            <button
              onClick={handleLogout}
              className="mt-4 flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
