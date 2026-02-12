import Parser from 'rss-parser';

const parser = new Parser();

const bridges = [
    'https://rss-bridge.org/bridge01/?action=display&bridge=TruthSocialBridge&username=realDonaldTrump&format=Atom',
    'https://feed.rssbridge.com/?action=display&bridge=TruthSocialBridge&username=realDonaldTrump&format=Atom',
    'https://rss.app/feeds/v1.1/tCnF8j5J5J5J5J5J.json', // Hypothetical
    'https://nitter.net/realDonaldTrump/rss',
    'https://nitter.cz/realDonaldTrump/rss',
    'https://nitter.privacydev.net/realDonaldTrump/rss'
];

async function checkBridges() {
    console.log('Checking RSS Bridges...');
    
    for (const url of bridges) {
        console.log(`Testing ${url}...`);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
            
            const res = await fetch(url, { 
                signal: controller.signal,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const text = await res.text();
                if (text.includes('<rss') || text.includes('<feed') || text.includes('json')) {
                    console.log(`[SUCCESS] ${url} seems valid.`);
                    console.log('Preview:', text.substring(0, 200));
                    return url;
                }
            } else {
                console.log(`[FAILED] ${res.status}`);
            }
        } catch (e) {
            console.log(`[ERROR] ${e.message}`);
        }
    }
    return null;
}

checkBridges();
