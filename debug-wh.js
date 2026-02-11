import * as cheerio from 'cheerio';

async function debugWhiteHouse() {
    const url = 'https://www.whitehouse.gov/presidential-actions/';
    console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const html = await res.text();
        // console.log('HTML Preview:', html.substring(0, 1000));
        const $ = cheerio.load(html);
        
        const articles = $('article');
        const items = $('.news-item'); // Try another common class
        const posts = $('.post'); // Another one

        console.log('Article count:', articles.length);
        console.log('.news-item count:', items.length);
        console.log('.post count:', posts.length);
        
        posts.each((i, el) => {
            if (i > 1) return;
            console.log(`--- Post ${i} ---`);
            console.log('HTML:', $(el).html().substring(0, 300));
            
            const title = $(el).find('h2').text().trim();
            const link = $(el).find('a').attr('href');
            // Try to find date
            const time = $(el).find('time').attr('datetime');
            const dateText = $(el).find('.posted-on').text().trim();
            const entryDate = $(el).find('.entry-date').text().trim();
            
            console.log('Title:', title);
            console.log('Link:', link);
            console.log('Time Attr:', time);
            console.log('Date Text:', dateText);
            console.log('Entry Date:', entryDate);
        });
    } catch (e) {
        console.error(e);
    }
}

debugWhiteHouse();
