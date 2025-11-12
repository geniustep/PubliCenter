import axios, { AxiosInstance } from 'axios';
import { logger } from './logger';

interface WordPressConfig {
  url: string;
  username: string;
  password: string; // Application Password
}

interface WordPressPost {
  title: string;
  content: string;
  excerpt?: string;
  status?: 'publish' | 'draft' | 'pending';
  categories?: number[];
  tags?: number[];
  featured_media?: number;
  meta?: Record<string, any>;
  lang?: string;
}

interface WordPressPostResponse {
  id: number;
  link: string;
  status: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
  };
}

/**
 * WordPress API Client
 */
class WordPressClient {
  private client: AxiosInstance;
  private config: WordPressConfig;

  constructor(config: WordPressConfig) {
    this.config = config;

    this.client = axios.create({
      baseURL: `${config.url}/wp-json/wp/v2`,
      auth: {
        username: config.username,
        password: config.password,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Test connection to WordPress
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/users/me');
      logger.info('WordPress connection successful', { url: this.config.url });
      return true;
    } catch (error) {
      logger.error('WordPress connection failed', {
        url: this.config.url,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Create a new post
   */
  async createPost(post: WordPressPost): Promise<WordPressPostResponse> {
    try {
      const response = await this.client.post<WordPressPostResponse>('/posts', post);

      logger.info('WordPress post created', {
        postId: response.data.id,
        title: post.title,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to create WordPress post', {
        error: error instanceof Error ? error.message : 'Unknown error',
        title: post.title,
      });

      throw new Error('Failed to create WordPress post: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Update an existing post
   */
  async updatePost(postId: number, post: Partial<WordPressPost>): Promise<WordPressPostResponse> {
    try {
      const response = await this.client.put<WordPressPostResponse>(`/posts/${postId}`, post);

      logger.info('WordPress post updated', {
        postId: response.data.id,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to update WordPress post', {
        error: error instanceof Error ? error.message : 'Unknown error',
        postId,
      });

      throw new Error('Failed to update WordPress post');
    }
  }

  /**
   * Delete a post
   */
  async deletePost(postId: number): Promise<void> {
    try {
      await this.client.delete(`/posts/${postId}`);

      logger.info('WordPress post deleted', { postId });
    } catch (error) {
      logger.error('Failed to delete WordPress post', {
        error: error instanceof Error ? error.message : 'Unknown error',
        postId,
      });

      throw new Error('Failed to delete WordPress post');
    }
  }

  /**
   * Get post by ID
   */
  async getPost(postId: number): Promise<WordPressPostResponse> {
    try {
      const response = await this.client.get<WordPressPostResponse>(`/posts/${postId}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get WordPress post', {
        error: error instanceof Error ? error.message : 'Unknown error',
        postId,
      });

      throw new Error('Failed to get WordPress post');
    }
  }

  /**
   * Upload media
   */
  async uploadMedia(file: Buffer, filename: string, mimeType: string): Promise<number> {
    try {
      const formData = new FormData();
      const blob = new Blob([file], { type: mimeType });
      formData.append('file', blob, filename);

      const response = await this.client.post('/media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      logger.info('WordPress media uploaded', {
        mediaId: response.data.id,
        filename,
      });

      return response.data.id;
    } catch (error) {
      logger.error('Failed to upload WordPress media', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filename,
      });

      throw new Error('Failed to upload media to WordPress');
    }
  }
}

/**
 * Create WordPress client instance
 */
export function createWordPressClient(): WordPressClient {
  const config: WordPressConfig = {
    url: process.env.WORDPRESS_URL || '',
    username: process.env.WORDPRESS_USERNAME || '',
    password: process.env.WORDPRESS_APP_PASSWORD || '',
  };

  if (!config.url || !config.username || !config.password) {
    throw new Error('WordPress configuration is incomplete. Check environment variables.');
  }

  return new WordPressClient(config);
}

/**
 * Test WordPress connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = createWordPressClient();
    return await client.testConnection();
  } catch (error) {
    logger.error('WordPress connection test failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

export { WordPressClient };
export type { WordPressPost, WordPressPostResponse };
