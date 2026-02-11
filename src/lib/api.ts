const API_BASE = '/api';

export const api = {
  async get(endpoint: string) {
    const token = localStorage.getItem('token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, { headers });
    if (!res.ok) {
        if (res.status === 401) {
            localStorage.removeItem('token');
            // Allow component to handle redirect or global listener
        }
        const errorText = await res.text();
        try {
            const json = JSON.parse(errorText);
            throw new Error(json.error || json.message || 'API Error');
        } catch (e: any) {
            throw new Error(errorText || 'API Error');
        }
    }
    return res.json();
  },

  async post(endpoint: string, body: any) {
    const token = localStorage.getItem('token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    if (!res.ok) {
         const errorText = await res.text();
        try {
            const json = JSON.parse(errorText);
            throw new Error(json.error || json.message || 'API Error');
        } catch (e: any) {
            throw new Error(errorText || 'API Error');
        }
    }
    return res.json();
  },
  
  async put(endpoint: string, body: any) {
    const token = localStorage.getItem('token');
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    });
    
    if (!res.ok) {
         const errorText = await res.text();
        try {
            const json = JSON.parse(errorText);
            throw new Error(json.error || json.message || 'API Error');
        } catch (e: any) {
            throw new Error(errorText || 'API Error');
        }
    }
    return res.json();
  }
};
