import Parser from 'rss-parser';
import * as cheerio from 'cheerio';

const parser = new Parser();
const FEED_URL = 'https://www.whitehouse.gov/presidential-actions/feed/';
const BASE_URL = 'https://www.whitehouse.gov/presidential-actions/';

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
        // Fallback to historical fetch for recent items if RSS fails
        try {
            console.log('[WhiteHouse] RSS failed, falling back to scraper...');
            const historical = await this.fetchHistoricalOrders(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // Last 7 days
            return historical;
        } catch (fallbackError) {
             throw new Error('Failed to fetch White House data');
        }
    }
  },

  async fetchHistoricalOrders(sinceDate: Date) {
      console.log(`[WhiteHouse] Fetching historical orders since ${sinceDate.toISOString()}...`);
      let page = 1;
      let keepFetching = true;
      const allOrders: any[] = [];
      const MAX_PAGES = 50; // Safety limit

      while (keepFetching && page <= MAX_PAGES) {
          const url = page === 1 ? BASE_URL : `${BASE_URL}page/${page}/`;
          console.log(`[WhiteHouse] Scraping page ${page}: ${url}`);
          
          try {
              const res = await fetch(url, {
                  headers: {
                      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                  }
              });
              
              if (!res.ok) {
                  console.warn(`[WhiteHouse] Failed to fetch page ${page}: ${res.status}`);
                  break;
              }
              
              const html = await res.text();
              const $ = cheerio.load(html);
              const posts = $('.post'); // Based on debug analysis
              
              if (posts.length === 0) {
                  console.log('[WhiteHouse] No more posts found.');
                  keepFetching = false;
                  break;
              }

              let pageHasNewItems = false;

              posts.each((i, el) => {
                  const title = $(el).find('h2').text().trim();
                  const link = $(el).find('a').attr('href');
                  const timeStr = $(el).find('time').attr('datetime');
                  const date = timeStr ? new Date(timeStr) : new Date();
                  
                  // Stop if we reached before the start date
                  if (date < sinceDate) {
                      keepFetching = false;
                      return false; // Break cheerio loop
                  }

                  // Only collect if it's an Executive Order or Proclamation
                  if (title.toLowerCase().includes('executive order') || title.toLowerCase().includes('proclamation')) {
                      allOrders.push({
                          title,
                          date: date.toISOString(),
                          url: link,
                          summary: '' // Summary not available in list view
                      });
                      pageHasNewItems = true;
                  }
              });

              if (!keepFetching) break;
              
              page++;
              // Be nice to the server
              await new Promise(resolve => setTimeout(resolve, 500));

          } catch (e) {
              console.error(`[WhiteHouse] Error scraping page ${page}:`, e);
              keepFetching = false;
          }
      }
      
      console.log(`[WhiteHouse] Found ${allOrders.length} historical orders.`);
      return allOrders;
  }
};
