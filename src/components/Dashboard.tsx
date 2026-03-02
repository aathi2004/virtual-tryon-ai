import React from 'react';
import { ChartBarIcon, UserGroupIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Home Dashboard</h1>
      
      {/* Top Stats Cards [cite: 374, 375] */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Users" value="1,240" icon={<UserGroupIcon className="w-6 h-6"/>} />
        <StatCard title="Active Sessions" value="45" icon={<ChartBarIcon className="w-6 h-6"/>} />
        <StatCard title="Try-Ons Today" value="312" icon={<ShoppingBagIcon className="w-6 h-6"/>} />
        <StatCard title="Avg. Time" value="4m 20s" icon={<ChartBarIcon className="w-6 h-6"/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales/Traffic Chart [cite: 380] */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Outfit Engagement Trends</h3>
          <div className="h-64 bg-gray-50 flex items-end justify-between p-4 rounded border border-dashed border-gray-300">
             {/* Placeholder for Chart */}
             {[40, 60, 45, 90, 75, 50, 80].map((h, i) => (
               <div key={i} style={{height: `${h}%`}} className="w-8 bg-blue-500 rounded-t opacity-80 hover:opacity-100 transition-all"></div>
             ))}
          </div>
        </div>

        {/* Recent Activities [cite: 377] */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent System Alerts</h3>
          <ul className="space-y-3">
             <li className="flex items-center text-sm text-gray-600 border-b pb-2">
               <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
               User ID #8822 completed a try-on session.
             </li>
             <li className="flex items-center text-sm text-gray-600 border-b pb-2">
               <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
               High latency detected in Rendering Engine (GPU).
             </li>
             <li className="flex items-center text-sm text-gray-600 border-b pb-2">
               <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
               New garment assets uploaded to database.
             </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }: { title: string, value: string, icon: any }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm flex items-center space-x-4">
    <div className="p-3 bg-blue-100 text-blue-600 rounded-full">{icon}</div>
    <div>
      <p className="text-gray-500 text-sm">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

export default Dashboard;