import dotenv from 'dotenv';
import Parser from 'rss-parser';

dotenv.config();

const parser = new Parser();
const CONGRESS_RSS_URL = 'https://www.congress.gov/rss/bill/most-recent-bills.xml';

export const congressService = {
  async fetchRecentBills(limit = 20) {
    console.log('[Congress] Fetching recent bills from RSS...');
    try {
        const feed = await parser.parseURL(CONGRESS_RSS_URL);
        
        const bills = feed.items.map(item => {
            // Extract type and number from title if possible, e.g. "H.R. 123 - Title"
            let type = 'legislative'; // Internal type
            let number = '';
            
            if (item.title) {
                const match = item.title.match(/^([A-Z]\.?[A-Z]?\.?)\s*(\d+)/i);
                if (match) {
                    number = match[2];
                }
            }

            return {
                number: number || 'unknown',
                title: item.title || 'Untitled Bill',
                type: 'legislative', // Uniform type for our internal logic
                updateDate: item.pubDate || new Date().toISOString(),
                url: item.link || '',
                summary: item.contentSnippet || ''
            };
        });

        return { bills: bills.slice(0, limit) };
    } catch (error) {
        console.error('Error fetching Congress RSS:', error);
        throw new Error('Failed to fetch Congress data');
    }
  }
};
