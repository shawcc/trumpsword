import dotenv from 'dotenv';
import Parser from 'rss-parser';

dotenv.config();

const parser = new Parser();
const CONGRESS_RSS_URL = 'https://www.congress.gov/rss/bill/most-recent-bills.xml';

export const congressService = {
  async fetchRecentBills(limit = 20) {
    console.log('[Congress] Fetching recent bills from RSS...');
    try {
        // Fix: Use fetch with User-Agent to bypass potential blocks
        const response = await fetch(CONGRESS_RSS_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*'
            }
        });

        if (!response.ok) {
            throw new Error(`Congress RSS HTTP Error: ${response.status} ${response.statusText}`);
        }

        const xmlText = await response.text();
        const feed = await parser.parseString(xmlText);
        
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
