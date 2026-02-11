import cron from 'node-cron';
import { collectorService } from './services/collector.js';

export const startCronJobs = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running scheduled collection...');
    await collectorService.collectAll();
  });
  console.log('[Cron] Jobs scheduled');
};
