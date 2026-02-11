import Parser from 'rss-parser';

const parser = new Parser();

async function checkFeeds() {
    console.log('--- White House ---');
    try {
        const feed = await parser.parseURL('https://www.whitehouse.gov/presidential-actions/feed/');
        if (feed.items.length > 0) {
            console.log('First item title:', feed.items[0].title);
            console.log('First item link:', feed.items[0].link);
        } else {
            console.log('No items found.');
        }
    } catch (e) {
        console.error('White House Error:', e.message);
    }

    console.log('\n--- Congress (GovTrack) ---');
    try {
        const response = await fetch('https://www.govtrack.us/events/events.rss?feeds=misc:bill_introduced', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const text = await response.text();
        // console.log('GovTrack Preview:', text.substring(0, 500));
        const feed = await parser.parseString(text);
        if (feed.items.length > 0) {
            console.log('First item title:', feed.items[0].title);
            console.log('First item link:', feed.items[0].link);
        } else {
            console.log('No items found.');
        }
    } catch (e) {
        console.error('GovTrack Error:', e.message);
    }
}

checkFeeds();
