import dotenv from 'dotenv';

dotenv.config();

const MEEGLE_API_BASE = process.env.MEEGLE_API_BASE || 'https://open.larksuite.com/open-apis/project/v1';
const AUTH_API_BASE = 'https://open.larksuite.com/open-apis/auth/v3';
const MEEGLE_APP_ID = process.env.MEEGLE_APP_ID;
const MEEGLE_APP_SECRET = process.env.MEEGLE_APP_SECRET;

// Token management
let accessToken = '';
let tokenExpiry = 0;

async function getAccessToken() {
  const now = Date.now();
  if (accessToken && now < tokenExpiry) {
    return accessToken;
  }

  if (!MEEGLE_APP_ID || !MEEGLE_APP_SECRET) {
    console.log('Fetching new Meegle access token (MOCK)...');
    accessToken = 'mock_meegle_token_' + now;
    tokenExpiry = now + 7200 * 1000;
    return accessToken;
  }

  console.log('Fetching new Meegle tenant access token...');
  const response = await fetch(`${AUTH_API_BASE}/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: MEEGLE_APP_ID,
      app_secret: MEEGLE_APP_SECRET
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.statusText}`);
  }

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`Auth Error: ${data.msg}`);
  }

  accessToken = data.tenant_access_token;
  tokenExpiry = now + (data.expire - 60) * 1000; // Expire 1 minute early for safety
  return accessToken;
}

export const meegleService = {
  /**
   * Fetch all available work item types in a project
   */
  async getWorkItemTypes(projectKey: string) {
    const token = await getAccessToken();
    if (!MEEGLE_APP_ID) {
      // Mock data
      return [
        { type_key: 'LEGISLATIVE', name: 'Legislative Process' },
        { type_key: 'EXECUTIVE', name: 'Executive Order' },
        { type_key: 'APPOINTMENT', name: 'Appointment' }
      ];
    }

    // Lark Project API to list work item types
    // Note: Actual endpoint might differ, checking documentation...
    // Usually: GET /projects/:project_key/work_item_types
    const response = await fetch(`${MEEGLE_API_BASE}/projects/${projectKey}/work_item_types?page_size=50`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
       const errorText = await response.text();
       console.error(`Meegle API Error (getTypes): ${errorText}`);
       return [];
    }
    
    const data = await response.json();
    return data.data?.work_item_types || [];
  },

  /**
   * Create a new work item (process instance) in Meegle
   */
  async createWorkItem(projectKey: string, workItemType: string, fields: any) {
    const token = await getAccessToken();
    // Mocking the call if no real API credentials
    if (!MEEGLE_APP_ID) {
      console.log(`[Mock Meegle] Create Work Item in ${projectKey}, type: ${workItemType}`, fields);
      return {
        data: {
          work_item: {
            id: 'mock_wi_' + Date.now(),
            project_key: projectKey,
            work_item_type_key: workItemType,
            fields
          }
        }
      };
    }

    const response = await fetch(`${MEEGLE_API_BASE}/projects/${projectKey}/work_items`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        work_item_type_key: workItemType,
        fields
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Meegle API Error (${response.status}): ${errorText}`);
    }
    return response.json();
  },

  /**
   * Update fields of a work item
   */
  async updateWorkItem(workItemId: string, fields: any) {
    const token = await getAccessToken();
     if (!MEEGLE_APP_ID) {
      console.log(`[Mock Meegle] Update Work Item ${workItemId}`, fields);
      return { data: { work_item: { id: workItemId, fields } } };
    }

    const response = await fetch(`${MEEGLE_API_BASE}/work_items/${workItemId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    });

    if (!response.ok) {
       const errorText = await response.text();
      throw new Error(`Meegle API Error (${response.status}): ${errorText}`);
    }
    return response.json();
  },
  
  /**
   * Transition a work item to a new state
   */
  async transitionState(workItemId: string, transitionId: string) {
     const token = await getAccessToken();
      if (!MEEGLE_APP_ID) {
      console.log(`[Mock Meegle] Transition Work Item ${workItemId} via ${transitionId}`);
      return { data: { work_item: { id: workItemId, transition_id: transitionId } } };
    }

    const response = await fetch(`${MEEGLE_API_BASE}/work_items/${workItemId}/transitions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ transition_id: transitionId })
    });

    if (!response.ok) {
       const errorText = await response.text();
      throw new Error(`Meegle API Error (${response.status}): ${errorText}`);
    }
    return response.json();
  }
};
