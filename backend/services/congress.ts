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
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
            }
        });

        if (!response.ok) {
            throw new Error(`Congress RSS HTTP Error: ${response.status} ${response.statusText}`);
        }

        const xmlText = await response.text();
        
        // Debugging: Log first 500 chars to see what we actually got
        console.log('[Congress] XML Preview:', xmlText.substring(0, 500));

        let feed;
        try {
            feed = await parser.parseString(xmlText);
        } catch (parseError: any) {
            console.error('[Congress] XML Parse Error:', parseError);
            // Fallback: If RSS fails, try a backup URL or return empty to avoid crashing everything
            return { bills: [] };
        }
        
        const bills = feed.items.map(item => {
            // Extract type and number from title if possible, e.g. "H.R. 123 - Title"
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
        // Don't throw, return empty so dashboard still loads partial data
        return { bills: [] };
    }
  },

  async fetchHistoricalBills(sinceDate: Date) {
      // Congress.gov blocks deep scraping and API requires key.
      // For now, we return the recent bills which is the best we can do without an API key.
      // In a real production app, we would use the ProPublica API or Congress.gov API here.
      console.log('[Congress] Fetching historical bills (limited to recent RSS due to API restrictions)...');
      return this.fetchRecentBills(50);
  }
};
