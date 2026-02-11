/**
 * local server entry file, for local development
 */
import app from './app.js';
// import { startCronJobs } from './cron.js';
import { workflowService } from './services/workflow.js';

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, async () => {
  console.log(`Server ready on port ${PORT}`);
  
  // Initialize services
  try {
    await workflowService.ensureTemplates();
    // Start background jobs (Not recommended for Vercel Serverless, use Vercel Cron instead)
    // startCronJobs();
    console.log('Services initialized');
  } catch (error) {
    console.error('Failed to initialize services:', error);
  }
});

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
