import * as cheerio from 'cheerio';

async function debugCongress() {
    // 119th Congress, Legislation
    const url = 'https://www.congress.gov/search?q=%7B%22source%22%3A%22legislation%22%2C%22congress%22%3A%22119%22%7D&pageSize=250';
    console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
            }
        });
        const html = await res.text();
        console.log('HTML Preview:', html.substring(0, 1000));
        
        const $ = cheerio.load(html);
        const items = $('ol.basic-search-results-lists > li');
        console.log('Congress Items found:', items.length);
        
        items.each((i, el) => {
            if (i > 2) return;
            const title = $(el).find('.result-heading a').text().trim();
            const link = $(el).find('.result-heading a').attr('href');
            // Date is often in metadata or text
            // e.g. "Introduced in House (01/03/2025)"
            const text = $(el).text();
            
            console.log(`--- Congress Item ${i} ---`);
            console.log('Title:', title);
            console.log('Link:', link);
            console.log('Text snippet:', text.substring(0, 100).replace(/\s+/g, ' '));
        });

    } catch (e) {
        console.error(e);
    }
}

debugCongress();
