import Parser from 'rss-parser';
const parser = new Parser();

async function checkRSSHub() {
    const url = 'https://rsshub.app/truthsocial/user/realDonaldTrump';
    console.log(`Checking ${url}...`);
    try {
        const feed = await parser.parseURL(url);
        console.log(`Title: ${feed.title}`);
        console.log(`Items: ${feed.items.length}`);
        feed.items.forEach(item => {
            console.log(`- ${item.title} (${item.pubDate})`);
        });
    } catch (e) {
        console.error('RSSHub failed:', e.message);
    }
}

checkRSSHub();
