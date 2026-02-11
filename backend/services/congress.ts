import dotenv from 'dotenv';
dotenv.config();

const CONGRESS_API_KEY = process.env.CONGRESS_API_KEY;
const BASE_URL = 'https://api.congress.gov/v3';

export const congressService = {
  async fetchRecentBills(limit = 20) {
    if (!CONGRESS_API_KEY) {
      console.log('[Mock Congress] Fetching recent bills');
      // Return some mock data for development
      return {
        bills: [
          {
            number: '1234',
            title: 'To improve the economy',
            type: 'HR',
            updateDate: new Date().toISOString()
          },
          {
            number: '5678',
            title: 'To secure the border',
            type: 'S',
            updateDate: new Date().toISOString()
          }
        ]
      };
    }
    
    try {
      const response = await fetch(`${BASE_URL}/bill?limit=${limit}&api_key=${CONGRESS_API_KEY}&format=json`);
      if (!response.ok) {
        throw new Error(`Congress API Error: ${response.statusText}`);
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching from Congress API:', error);
      throw error;
    }
  }
};
