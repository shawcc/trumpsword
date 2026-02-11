export const whiteHouseService = {
  async fetchExecutiveOrders() {
    console.log('[Mock WhiteHouse] Fetching Executive Orders');
    // In a real implementation, this might scrape the White House website or parse an RSS feed
    return [
      {
        title: 'Executive Order on Artificial Intelligence',
        date: new Date().toISOString(),
        url: 'https://www.whitehouse.gov/briefing-room/presidential-actions/2023/10/30/executive-order-on-the-safe-secure-and-trustworthy-development-and-use-of-artificial-intelligence/'
      },
      {
        title: 'Executive Order on Immigration',
        date: new Date(Date.now() - 86400000).toISOString(),
        url: 'https://www.whitehouse.gov/briefing-room/presidential-actions/'
      }
    ];
  }
};
