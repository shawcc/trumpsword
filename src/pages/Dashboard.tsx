import { useAuthStore } from '../store/auth';
import { useNavigate } from 'react-router-dom';
import { FileText, Gavel, UserCheck, Activity, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {user?.name}</p>
        </div>
        <div className="flex space-x-2">
            <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full flex items-center">
                <Activity className="w-4 h-4 mr-1" /> System Online
            </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div 
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" 
            onClick={() => navigate('/processes/legislative')}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Legislative</h2>
            <div className="bg-blue-100 p-2 rounded-lg">
                <Gavel className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm">Track bills, acts, and congressional resolutions.</p>
        </div>

        <div 
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" 
            onClick={() => navigate('/processes/executive')}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Executive Orders</h2>
            <div className="bg-green-100 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm">Monitor presidential actions and executive orders.</p>
        </div>

        <div 
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" 
            onClick={() => navigate('/processes/appointment')}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Appointments</h2>
            <div className="bg-purple-100 p-2 rounded-lg">
                <UserCheck className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm">Track nominations and confirmation hearings.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Alerts</h3>
        <div className="space-y-4">
            <div className="flex items-start p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                    <h4 className="text-sm font-medium text-yellow-800">New Executive Order Detected</h4>
                    <p className="text-sm text-yellow-700 mt-1">System detected a new order regarding "Trade Tariffs" pending classification.</p>
                </div>
            </div>
            {/* More alerts can be mapped here */}
        </div>
      </div>
    </div>
  );
}
