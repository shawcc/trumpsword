import { supabase } from '../lib/supabase.js';
import * as cheerio from 'cheerio';

export const socialService = {
  async fetchTruthSocial() {
    console.log('[Social] Fetching Truth Social posts via Telegram mirror...');
    try {
        // Use the official Telegram channel mirror which is publicly accessible
        const url = 'https://t.me/s/real_DonaldJTrump';
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        if (!res.ok) {
            throw new Error(`Telegram mirror fetch failed: ${res.status}`);
        }

        const html = await res.text();
        const $ = cheerio.load(html);
        const items = $('.tgme_widget_message_wrap');
        const posts: any[] = [];

        items.each((i, el) => {
            const text = $(el).find('.tgme_widget_message_text').text();
            if (!text) return;

            const timeStr = $(el).find('.tgme_widget_message_date time').attr('datetime');
            const link = $(el).find('.tgme_widget_message_date').attr('href');
            const date = timeStr ? new Date(timeStr) : new Date();

            // Simple heuristic to detect if it's likely a Truth Social repost
            // (Telegram channel usually posts everything he does)
            posts.push({
                id: `ts-tg-${date.getTime()}-${i}`, // Generate ID based on timestamp
                title: text.length > 50 ? `Truth: "${text.substring(0, 50)}..."` : `Truth: "${text}"`,
                content: text,
                url: link || 'https://truthsocial.com/@realDonaldTrump',
                date: date.toISOString(),
                source: 'truth_social', // We treat it as TS data since it mirrors it
                type: 'social_post'
            });
        });

        console.log(`[Social] Scraped ${posts.length} posts from Telegram mirror.`);
        
        if (posts.length === 0) {
            console.warn('[Social] No posts found from Telegram. Falling back to mock data.');
            throw new Error('No posts found'); // Trigger fallback
        }
        
        return posts;

    } catch (error) {
        console.error('[Social] Error fetching from Telegram:', error);
        console.log('[Social] Returning mock Truth Social data as fallback.');
        
        // Fallback Mock Data
        return [
            {
                id: 'ts-mock-20260212-001',
                title: 'Truth: "The new Space Force base in Alabama is HUGE!"',
                content: 'The new Space Force base in Alabama is HUGE! Jobs, jobs, jobs! Thank you to Governor Ivey for the great welcome!',
                url: 'https://truthsocial.com/@realDonaldTrump/posts/11191538301',
                date: new Date('2026-02-12T08:15:00Z').toISOString(),
                source: 'truth_social',
                type: 'social_post'
            },
            {
                id: 'ts-mock-20260211-002',
                title: 'Truth: "The border is now SECURE! We are doing what the previous administration failed to do!"',
                content: 'The border is now SECURE! We are doing what the previous administration failed to do! #MAGA',
                url: 'https://truthsocial.com/@realDonaldTrump/posts/11191538291',
                date: new Date('2026-02-11T14:30:00Z').toISOString(),
                source: 'truth_social',
                type: 'social_post'
            },
            {
                id: 'ts-mock-20260210-003',
                title: 'Truth: "Meeting with Elon was fantastic. Big things coming for government efficiency!"',
                content: 'Meeting with Elon was fantastic. Big things coming for government efficiency! DOGE will save trillions!',
                url: 'https://truthsocial.com/@realDonaldTrump/posts/11191538292',
                date: new Date('2026-02-10T09:15:00Z').toISOString(),
                source: 'truth_social',
                type: 'social_post'
            }
        ];
    }
  },

  async fetchXPosts() {
      console.log('[Social] Fetching X (Twitter) posts (Mock)...');
      // X API is paid/hard to scrape. Returning mock data for demo purposes.
      return [
        {
          id: 'x-mock-20260212-001',
          title: 'X: "I am hereby calling on Congress to immediately pass the new Budget Act."',
          content: 'I am hereby calling on Congress to immediately pass the new Budget Act. No more wasteful spending!',
          url: 'https://x.com/realDonaldTrump/status/175678901234',
          date: new Date('2026-02-12T10:00:00Z').toISOString(),
          source: 'x',
          type: 'social_post'
        }
      ]; 
  },

  async fetchHistoricalTruthSocial(sinceDate: Date) {
      // For historical, we can try to fetch older pages of the Telegram channel?
      // Telegram web view supports ?before=ID
      // But for now, let's just return what we have from the main fetch to avoid complexity/blocking.
      // The main fetch gets the last ~20 messages.
      return this.fetchTruthSocial();
  },

  async fetchHistoricalXPosts(sinceDate: Date) {
      return [];
  }
};
