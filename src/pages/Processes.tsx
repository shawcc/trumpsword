import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { CheckCircle, Clock, ArrowLeft, ExternalLink, MessageSquare, FileText, Gavel, UserCheck } from 'lucide-react';

export default function Processes() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [type]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Map URL param to database 'type'
      let dbType = type;
      if (type === 'social') dbType = 'social_post';
      
      // Fetch events with specific type, limit 100 for a good list
      const res = await api.get(`/events?type=${dbType}&limit=100`);
      setEvents(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'success': return 'bg-green-100 text-green-800';
        case 'failed': return 'bg-red-100 text-red-800';
        default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getIcon = () => {
      switch(type) {
          case 'legislative': return <Gavel className="w-8 h-8 text-blue-600" />;
          case 'executive': return <FileText className="w-8 h-8 text-green-600" />;
          case 'appointment': return <UserCheck className="w-8 h-8 text-purple-600" />;
          case 'social': return <MessageSquare className="w-8 h-8 text-pink-600" />;
          default: return <Clock className="w-8 h-8 text-gray-600" />;
      }
  };

  const getTitle = () => {
      switch(type) {
          case 'legislative': return 'Legislative Actions';
          case 'executive': return 'Executive Orders & Actions';
          case 'appointment': return 'Nominations & Appointments';
          case 'social': return 'Social Media Updates';
          default: return 'All Events';
      }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <button 
        onClick={() => navigate('/dashboard')}
        className="mb-6 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </button>

      <div className="flex items-center mb-8">
          <div className={`p-3 rounded-lg mr-4 ${
              type === 'legislative' ? 'bg-blue-100' :
              type === 'executive' ? 'bg-green-100' :
              type === 'appointment' ? 'bg-purple-100' :
              type === 'social' ? 'bg-pink-100' : 'bg-gray-100'
          }`}>
              {getIcon()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{getTitle()}</h1>
            <p className="text-gray-500 mt-1">
                {events.length} items found
            </p>
          </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md rounded-lg border border-gray-200">
          <ul className="divide-y divide-gray-200">
            {events.map((event) => (
              <li key={event.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                <div className="px-6 py-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${
                            event.source === 'whitehouse' ? 'bg-blue-100 text-blue-800' :
                            event.source === 'congress' ? 'bg-gray-100 text-gray-800' :
                            event.source === 'truth_social' ? 'bg-purple-100 text-purple-800' :
                            event.source === 'x' ? 'bg-black text-white' : 'bg-gray-100 text-gray-800'
                        }`}>
                            {event.source}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                            {new Date(event.event_date).toLocaleString()}
                        </span>
                    </div>
                    {event.raw_data?.url && (
                        <a 
                            href={event.raw_data.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {event.title}
                  </h3>
                  
                  {event.raw_data?.content && (
                      <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                          {event.raw_data.content.replace(/<[^>]*>?/gm, '')}
                      </p>
                  )}
                  
                  {/* Debug/Internal Info */}
                  <div className="flex items-center text-xs text-gray-400 mt-2">
                      <span className="mr-4">ID: {event.external_id || event.id}</span>
                      <span>Sync: {event.meegle_sync_status}</span>
                  </div>
                </div>
              </li>
            ))}
            {events.length === 0 && (
                <div className="p-12 text-center">
                    <p className="text-gray-500 text-lg">No events found for this category.</p>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="mt-4 text-blue-600 hover:underline"
                    >
                        Go back and try syncing more data
                    </button>
                </div>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
