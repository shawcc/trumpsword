import { socialService } from './backend/services/social.js';

async function test() {
    console.log('Testing Truth Social Scraper...');
    const posts = await socialService.fetchTruthSocial();
    console.log(`Found ${posts.length} posts.`);
    if (posts.length > 0) {
        console.log('Sample:', posts[0]);
    }
}

test();
