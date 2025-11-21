import { Queue, Worker, Job } from 'bullmq';
import { logger } from './logger';
import { redis } from './redis';

/**
 * Queue connection configuration
 */
const connection = {
  host: process.env.REDIS_URL?.split(':')[1]?.replace('//', '') || 'localhost',
  port: parseInt(process.env.REDIS_URL?.split(':')[2] || '6379'),
  password: process.env.REDIS_PASSWORD,
};

/**
 * Translation Queue
 */
export const translationQueue = new Queue('translation', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

/**
 * Publishing Queue
 */
export const publishQueue = new Queue('publish', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

/**
 * Sync Queue (WordPress sync)
 */
export const syncQueue = new Queue('sync', {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 50,
    removeOnFail: 25,
  },
});

/**
 * Email Queue
 */
export const emailQueue = new Queue('email', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

/**
 * Add translation job
 */
export async function addTranslationJob(data: {
  articleId: number;
  sourceLang: string;
  targetLangs: string[];
}) {
  try {
    const job = await translationQueue.add('translate-article', data);
    logger.info(`Translation job added: ${job.id}`, { data });
    return job;
  } catch (error) {
    logger.error('Failed to add translation job', { error, data });
    throw error;
  }
}

/**
 * Add publish job
 */
export async function addPublishJob(data: {
  articleId: number;
  wordPressSiteIds: number[];
  languages: string[];
}) {
  try {
    const job = await publishQueue.add('publish-article', data);
    logger.info(`Publish job added: ${job.id}`, { data });
    return job;
  } catch (error) {
    logger.error('Failed to add publish job', { error, data });
    throw error;
  }
}

/**
 * Add sync job
 */
export async function addSyncJob(data: {
  wordPressSiteId: number;
  syncType: 'import' | 'export' | 'full';
}) {
  try {
    const job = await syncQueue.add('sync-wordpress', data);
    logger.info(`Sync job added: ${job.id}`, { data });
    return job;
  } catch (error) {
    logger.error('Failed to add sync job', { error, data });
    throw error;
  }
}

/**
 * Add email job
 */
export async function addEmailJob(data: {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}) {
  try {
    const job = await emailQueue.add('send-email', data);
    logger.info(`Email job added: ${job.id}`, { to: data.to, subject: data.subject });
    return job;
  } catch (error) {
    logger.error('Failed to add email job', { error, data });
    throw error;
  }
}

/**
 * Get job status
 */
export async function getJobStatus(queueName: string, jobId: string) {
  try {
    let queue: Queue;

    switch (queueName) {
      case 'translation':
        queue = translationQueue;
        break;
      case 'publish':
        queue = publishQueue;
        break;
      case 'sync':
        queue = syncQueue;
        break;
      case 'email':
        queue = emailQueue;
        break;
      default:
        throw new Error(`Unknown queue: ${queueName}`);
    }

    const job = await queue.getJob(jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress;

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      state,
      progress,
      attemptsMade: job.attemptsMade,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
    };
  } catch (error) {
    logger.error('Failed to get job status', { error, queueName, jobId });
    return null;
  }
}

/**
 * Clean up old jobs
 */
export async function cleanupQueues() {
  try {
    await translationQueue.clean(24 * 3600 * 1000, 100); // 24 hours
    await publishQueue.clean(24 * 3600 * 1000, 100);
    await syncQueue.clean(48 * 3600 * 1000, 50); // 48 hours
    await emailQueue.clean(12 * 3600 * 1000, 100); // 12 hours

    logger.info('Queues cleaned up successfully');
  } catch (error) {
    logger.error('Failed to cleanup queues', { error });
  }
}

// Export all queues
export const queues = {
  translation: translationQueue,
  publish: publishQueue,
  sync: syncQueue,
  email: emailQueue,
};
