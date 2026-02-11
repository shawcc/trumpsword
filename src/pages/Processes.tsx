import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { CheckCircle, Clock } from 'lucide-react';

export default function Processes() {
  const { type } = useParams();
  const [processes, setProcesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProcesses();
  }, [type]);

  const loadProcesses = async () => {
    setLoading(true);
    try {
      // In real app, filter by template type derived from URL param 'type'
      // But our API /processes doesn't filter by template type yet, so we fetch all or update API
      const res = await api.get('/processes');
      // Client side filter for demo, as API returns all
      // Assuming workflow_templates.type matches our URL param (legislative, executive, appointment)
      const filtered = type 
        ? res.data.filter((p: any) => p.workflow_templates?.type === type)
        : res.data;
        
      setProcesses(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'active': return 'bg-blue-100 text-blue-800';
        case 'completed': return 'bg-green-100 text-green-800';
        case 'suspended': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6 capitalize">{type || 'All'} Processes</h1>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {processes.map((process) => (
              <li key={process.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition cursor-pointer">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-600 truncate">{process.events?.title}</p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(process.status)}`}>
                        {process.status}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        <CheckCircle className="flex-shrink-0 mr-1.5 h-4 w-4 text-green-400" />
                        Current Node: {process.current_node}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                      <p>
                        Started {new Date(process.started_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {processes.length === 0 && (
                <div className="p-4 text-center text-gray-500">No processes found for this category.</div>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
