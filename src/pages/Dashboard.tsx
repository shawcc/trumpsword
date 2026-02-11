import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { useNavigate } from 'react-router-dom';
import { FileText, Gavel, UserCheck, Activity, AlertCircle, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { api } from '../lib/api';

export default function Dashboard() {
  const user = useAuthStore(s => s.user);
  const navigate = useNavigate();
  const [triggering, setTriggering] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [triggerResult, setTriggerResult] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);

  const fetchRecentEvents = async () => {
      try {
          const res = await api.get('/events?limit=10');
          setRecentEvents(res.data || []);
      } catch (e) {
          console.error('Failed to fetch events:', e);
      }
  };

  useEffect(() => {
      fetchRecentEvents();
  }, []);

  const handleManualTrigger = async () => {
    setTriggering(true);
    setTriggerResult(null);
    try {
      const res = await api.post('/events/trigger', {});
      
      // Check if there are errors even in a success response
      if (res.stats && res.stats.errors && res.stats.errors.length > 0) {
          setTriggerResult({
            message: `Processed ${res.stats.total_processed}. Error: ${res.stats.errors[0]}`, // Show first error
            type: 'error'
          });
      } else {
          setTriggerResult({
            message: `Processed ${res.stats.total_processed} items successfully.`,
            type: 'success'
          });
      }
      // Refresh list
      await fetchRecentEvents();
    } catch (e: any) {
      setTriggerResult({
        message: e.message || 'Trigger failed',
        type: 'error'
      });
    } finally {
      setTriggering(false);
    }
  };

  const handleRetryPending = async () => {
    setRetrying(true);
    setTriggerResult(null);
    try {
        const res = await api.post('/events/retry', {});
        if (res.stats && res.stats.failCount > 0) {
             setTriggerResult({
                message: `Retry: ${res.stats.successCount} success, ${res.stats.failCount} failed. Last Error: ${res.stats.errors[0]}`,
                type: 'error'
            });
        } else {
            setTriggerResult({
                message: res.message || 'Retry successful',
                type: 'success'
            });
        }
        await fetchRecentEvents();
    } catch (e: any) {
        setTriggerResult({
            message: e.message || 'Retry failed',
            type: 'error'
        });
    } finally {
        setRetrying(false);
    }
  };

  const getSyncStatusIcon = (status: string, error?: string) => {
      if (status === 'success') return <CheckCircle className="w-5 h-5 text-green-500" />;
      if (status === 'failed') return <XCircle className="w-5 h-5 text-red-500" />;
      return <Clock className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {user?.name}</p>
        </div>
        <div className="flex space-x-2 items-center">
            {triggerResult && (
                <span className={`text-sm px-3 py-1 rounded-full ${triggerResult.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {triggerResult.message}
                </span>
            )}
            <button 
                onClick={handleRetryPending}
                disabled={retrying}
                className={`flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none disabled:opacity-50 transition-colors`}
            >
                <RefreshCw className={`w-4 h-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
                {retrying ? 'Retrying...' : 'Retry Pending'}
            </button>
            <button 
                onClick={handleManualTrigger}
                disabled={triggering}
                className={`flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none disabled:opacity-50 transition-colors`}
            >
                <RefreshCw className={`w-4 h-4 mr-2 ${triggering ? 'animate-spin' : ''}`} />
                {triggering ? 'Syncing...' : 'Sync Events'}
            </button>
            <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full flex items-center h-9">
                <Activity className="w-4 h-4 mr-1" /> System Online
            </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* ... Cards ... */}
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

      {/* Live Data Feed Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Live Data Feed</h3>
            <button onClick={fetchRecentEvents} className="text-sm text-blue-600 hover:underline">Refresh</button>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type (AI)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meegle Sync</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {recentEvents.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No events found. Click 'Sync Events' to fetch data.</td>
                        </tr>
                    ) : (
                        recentEvents.map((event: any) => (
                            <tr key={event.id}>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={event.title}>{event.title}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${event.source === 'whitehouse' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {event.source}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{event.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(event.event_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        {getSyncStatusIcon(event.meegle_sync_status, event.meegle_sync_error)}
                                        {event.meegle_sync_status === 'failed' && (
                                            <span className="ml-2 text-xs text-red-600 truncate max-w-[150px]" title={event.meegle_sync_error}>
                                                {event.meegle_sync_error}
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
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
