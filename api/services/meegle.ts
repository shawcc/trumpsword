import dotenv from 'dotenv';

dotenv.config();

const MEEGLE_API_BASE = process.env.MEEGLE_API_BASE || 'https://open.feishu.cn/open-apis/meegle/v1';
const MEEGLE_APP_ID = process.env.MEEGLE_APP_ID;
const MEEGLE_APP_SECRET = process.env.MEEGLE_APP_SECRET;

// Token management (simplified for now)
let accessToken = '';
let tokenExpiry = 0;

async function getAccessToken() {
  const now = Date.now();
  if (accessToken && now < tokenExpiry) {
    return accessToken;
  }

  // TODO: Implement actual tenant_access_token fetching from Meegle/Lark Open Platform
  // response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', ...)
  
  console.log('Fetching new Meegle access token...');
  accessToken = 'mock_meegle_token_' + now;
  tokenExpiry = now + 7200 * 1000; // 2 hours
  
  return accessToken;
}

export const meegleService = {
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
