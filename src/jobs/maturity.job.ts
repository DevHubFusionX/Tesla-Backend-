import cron from 'node-cron';
import { SyncService } from '../services/sync.service';

/**
 * Initializes all platform background cron jobs.
 */
export const initCronJobs = (): void => {
  console.log('⏰ Initializing background cron jobs...');

  // 1. Scan and mature investments every hour
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Running hourly maturity check...');
    try {
      const result = await SyncService.matureInvestments();
      console.log(`⏰ Maturity check completed. Processed: ${result.processedCount}`);
    } catch (error) {
      console.error('❌ Error during background maturity cron job:', error);
    }
  });

  // 2. Update real-time valuations in DB every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('⏰ Running 15-minute valuation snapshot job...');
    try {
      const result = await SyncService.snapshotValuations();
      console.log(`⏰ Valuation snapshot completed. Updated: ${result.updatedCount}`);
    } catch (error) {
      console.error('❌ Error during background valuation cron job:', error);
    }
  });

  console.log('✅ Background cron jobs successfully scheduled.');
};
