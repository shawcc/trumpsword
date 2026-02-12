import * as cheerio from 'cheerio';

async function debugTelegram() {
    const url = 'https://t.me/s/real_DonaldJTrump';
    console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url);
        const html = await res.text();
        const $ = cheerio.load(html);
        
        const items = $('.tgme_widget_message_wrap');
        console.log(`Found ${items.length} message wrappers.`);
        
        items.each((i, el) => {
            if (i > 5) return;
            const text = $(el).find('.tgme_widget_message_text').text();
            const time = $(el).find('.tgme_widget_message_date time').attr('datetime');
            const link = $(el).find('.tgme_widget_message_date').attr('href');
            
            console.log(`--- Message ${i} ---`);
            console.log('Text:', text.substring(0, 100));
            console.log('Date:', time);
            console.log('Link:', link);
        });

    } catch (e) {
        console.error(e);
    }
}

debugTelegram();
