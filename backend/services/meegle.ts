import dotenv from 'dotenv';
import process from 'process';

dotenv.config();

const getMeegleConfig = () => {
  const env = (typeof process !== 'undefined' && process.env) || {};
  return {
    API_BASE: env.MEEGLE_API_BASE || 'https://open.larksuite.com/open-apis/project/v1',
    PLUGIN_ID: env.MEEGLE_PLUGIN_ID || env.MEEGLE_APP_ID,
    PLUGIN_SECRET: env.MEEGLE_PLUGIN_SECRET || env.MEEGLE_APP_SECRET
  };
};

const AUTH_API_BASE = 'https://open.larksuite.com/open-apis/auth/v3';

// Token management
let accessToken = '';
let tokenExpiry = 0;

async function getAccessToken() {
  const now = Date.now();
  if (accessToken && now < tokenExpiry) {
    return accessToken;
  }

  const { PLUGIN_ID, PLUGIN_SECRET } = getMeegleConfig();

  if (!PLUGIN_ID || !PLUGIN_SECRET) {
    console.error('CRITICAL: Missing MEEGLE_PLUGIN_ID or MEEGLE_PLUGIN_SECRET.');
    console.error('System is running in MOCK MODE. Data will NOT be synced to Meegle.');
    
    // Return mock token to allow local dev, but log heavily
    accessToken = 'mock_meegle_token_' + now;
    tokenExpiry = now + 7200 * 1000;
    return accessToken;
  }
  
  console.log(`[Meegle Debug] Auth using Plugin ID: ${PLUGIN_ID?.substring(0, 5)}...`);

  console.log('Fetching new Meegle tenant access token (Plugin Auth)...');
  // Note: Meegle Plugins use the same auth endpoint as Lark Apps for tenant_access_token
  // using app_id = plugin_id and app_secret = plugin_secret.
  const response = await fetch(`${AUTH_API_BASE}/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: PLUGIN_ID,
      app_secret: PLUGIN_SECRET
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
    const { PLUGIN_ID, API_BASE } = getMeegleConfig();
    
    if (!PLUGIN_ID) {
      // Mock data
      return [
        { type_key: 'LEGISLATIVE', name: 'Bill' },
        { type_key: 'EXECUTIVE', name: 'Executive Orders' },
        { type_key: 'APPOINTMENT', name: 'Oops' },
        { type_key: 'SOCIAL', name: 'Social Media' }
      ];
    }

    // Lark Project API to list work item types
    // Note: Actual endpoint might differ, checking documentation...
    // Usually: GET /projects/:project_key/work_item_types
    const response = await fetch(`${API_BASE}/projects/${projectKey}/work_item_types?page_size=50`, {
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
   * Fetch fields for a specific work item type
   */
  async getWorkItemTypeFields(projectKey: string, workItemTypeKey: string) {
    const token = await getAccessToken();
    const { PLUGIN_ID, API_BASE } = getMeegleConfig();

    if (!PLUGIN_ID) {
      // Mock fields
      return [
        { field_key: 'title', name: 'Title' },
        { field_key: 'field_trump_said', name: 'Trump said that' },
        { field_key: 'field_we_need_to', name: 'We need to' },
        { field_key: 'field_which_means', name: 'Which means' },
        { field_key: 'field_start_date', name: 'It should started at' }
      ];
    }

    // Usually: GET /projects/:project_key/work_item_types/:type_key/fields
    const response = await fetch(`${API_BASE}/projects/${projectKey}/work_item_types/${workItemTypeKey}/fields`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
       const errorText = await response.text();
       console.error(`Meegle API Error (getFields): ${errorText}`);
       return [];
    }
    
    const data = await response.json();
    return data.data?.fields || [];
  },

  /**
   * Create a new work item (process instance) in Meegle
   */
  async createWorkItem(projectKey: string, workItemType: string, fields: any) {
    const token = await getAccessToken();
    const { PLUGIN_ID, API_BASE } = getMeegleConfig();

    console.log(`[Meegle Debug] Creating Item - Project: ${projectKey}, Type: ${workItemType}`);
    console.log(`[Meegle Debug] Fields Payload:`, JSON.stringify(fields, null, 2));

    // Mocking the call if no real API credentials
    if (!PLUGIN_ID) {
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

    const response = await fetch(`${API_BASE}/projects/${projectKey}/work_items`, {
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
      // Detailed logging for debugging sync issues
      console.error(`[Meegle API] Create Work Item Failed.`);
      console.error(`Status: ${response.status} ${response.statusText}`);
      console.error(`Endpoint: ${API_BASE}/projects/${projectKey}/work_items`);
      console.error(`Type Key: ${workItemType}`);
      console.error(`Payload:`, JSON.stringify(fields, null, 2));
      console.error(`Error Body: ${errorText}`);
      throw new Error(`Meegle API Error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`[Meegle Debug] Create Success Response:`, JSON.stringify(data, null, 2));

    // Check internal code if successful HTTP status but business error
    if (data.code && data.code !== 0) {
        console.error(`[Meegle API] Business Error: ${data.msg}`);
        console.error(`Response:`, data);
        throw new Error(`Meegle Business Error: ${data.msg}`);
    }
    
    return data;
  },

  /**
   * Update fields of a work item
   */
  async updateWorkItem(workItemId: string, fields: any) {
    const token = await getAccessToken();
    const { PLUGIN_ID, API_BASE } = getMeegleConfig();

     if (!PLUGIN_ID) {
      console.log(`[Mock Meegle] Update Work Item ${workItemId}`, fields);
      return { data: { work_item: { id: workItemId, fields } } };
    }

    const response = await fetch(`${API_BASE}/work_items/${workItemId}`, {
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
     const { PLUGIN_ID, API_BASE } = getMeegleConfig();

      if (!PLUGIN_ID) {
      console.log(`[Mock Meegle] Transition Work Item ${workItemId} via ${transitionId}`);
      return { data: { work_item: { id: workItemId, transition_id: transitionId } } };
    }

    const response = await fetch(`${API_BASE}/work_items/${workItemId}/transitions`, {
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
