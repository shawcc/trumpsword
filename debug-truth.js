async function checkTruthSocial() {
    console.log('Checking Truth Social API...');
    try {
        // 1. Lookup Account ID
        const lookupUrl = 'https://truthsocial.com/api/v1/accounts/lookup?acct=realDonaldTrump';
        console.log(`Fetching ${lookupUrl}...`);
        const res = await fetch(lookupUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });
        
        if (!res.ok) {
            console.error(`Lookup failed: ${res.status} ${res.statusText}`);
            const text = await res.text();
            console.error('Response:', text);
            return;
        }

        const account = await res.json();
        console.log('Account found:', account.id, account.username);
        
        // 2. Fetch Statuses
        const statusesUrl = `https://truthsocial.com/api/v1/accounts/${account.id}/statuses?limit=5`;
        console.log(`Fetching statuses from ${statusesUrl}...`);
        
        const res2 = await fetch(statusesUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });

        if (!res2.ok) {
             console.error(`Statuses failed: ${res2.status} ${res2.statusText}`);
             return;
        }

        const statuses = await res2.json();
        console.log(`Found ${statuses.length} statuses.`);
        
        statuses.forEach((s, i) => {
            console.log(`--- Status ${i} ---`);
            console.log('Date:', s.created_at);
            console.log('Content:', s.content.substring(0, 100)); // Content is HTML
            console.log('URL:', s.url);
        });

    } catch (e) {
        console.error('Error:', e);
    }
}

checkTruthSocial();
