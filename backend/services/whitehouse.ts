import Parser from 'rss-parser';

const parser = new Parser();
const FEED_URL = 'https://www.whitehouse.gov/presidential-actions/feed/';

export const whiteHouseService = {
  async fetchExecutiveOrders() {
    console.log('[WhiteHouse] Fetching Executive Orders from RSS...');
    try {
        const feed = await parser.parseURL(FEED_URL);
        const orders = feed.items.map(item => ({
            title: item.title || 'Untitled Order',
            date: item.pubDate || new Date().toISOString(),
            url: item.link || '',
            summary: item.contentSnippet || item.content || ''
        }));
        
        // Filter for "Executive Order" in title to be precise
        return orders.filter(o => o.title.toLowerCase().includes('executive order'));
    } catch (error) {
        console.error('Error fetching White House RSS:', error);
        throw new Error('Failed to fetch White House data');
    }
  }
};
