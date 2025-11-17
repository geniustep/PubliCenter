import { MemoryCache } from '../cache';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('set and get', () => {
    it('should set and get a value', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should handle different data types', () => {
      cache.set('string', 'text');
      cache.set('number', 123);
      cache.set('boolean', true);
      cache.set('object', { foo: 'bar' });
      cache.set('array', [1, 2, 3]);

      expect(cache.get('string')).toBe('text');
      expect(cache.get('number')).toBe(123);
      expect(cache.get('boolean')).toBe(true);
      expect(cache.get('object')).toEqual({ foo: 'bar' });
      expect(cache.get('array')).toEqual([1, 2, 3]);
    });

    it('should return null for non-existent key', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should overwrite existing value', () => {
      cache.set('key', 'value1');
      cache.set('key', 'value2');
      expect(cache.get('key')).toBe('value2');
    });

    it('should handle empty string as key', () => {
      cache.set('', 'empty key');
      expect(cache.get('')).toBe('empty key');
    });

    it('should handle null and undefined values', () => {
      cache.set('null', null);
      cache.set('undefined', undefined);

      expect(cache.get('null')).toBe(null);
      expect(cache.get('undefined')).toBe(undefined);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entry after TTL', async () => {
      cache.set('key', 'value', 100); // 100ms TTL

      // Immediately available
      expect(cache.get('key')).toBe('value');

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be expired
      expect(cache.get('key')).toBeNull();
    });

    it('should use default TTL if not specified', () => {
      cache.set('key', 'value'); // Default TTL: 300000ms (5 minutes)
      expect(cache.get('key')).toBe('value');
    });

    it('should handle custom TTL', () => {
      cache.set('short', 'value', 50); // 50ms
      cache.set('long', 'value', 10000); // 10s

      expect(cache.get('short')).toBe('value');
      expect(cache.get('long')).toBe('value');
    });

    it('should not expire before TTL', async () => {
      cache.set('key', 'value', 1000); // 1 second TTL

      // Wait 500ms (half of TTL)
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should still be available
      expect(cache.get('key')).toBe('value');
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      cache.set('key', 'value');
      expect(cache.has('key')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return false for expired key', async () => {
      cache.set('key', 'value', 100);

      expect(cache.has('key')).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(cache.has('key')).toBe(false);
    });

    it('should delete expired entry when checking', async () => {
      cache.set('key', 'value', 100);

      await new Promise((resolve) => setTimeout(resolve, 150));

      cache.has('key'); // Should delete the expired entry

      expect(cache.size()).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete existing key', () => {
      cache.set('key', 'value');
      cache.delete('key');
      expect(cache.get('key')).toBeNull();
    });

    it('should handle deleting non-existent key', () => {
      expect(() => cache.delete('nonexistent')).not.toThrow();
    });

    it('should reduce cache size', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      expect(cache.size()).toBe(2);

      cache.delete('key1');

      expect(cache.size()).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.size()).toBe(3);

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
    });

    it('should work with empty cache', () => {
      expect(() => cache.clear()).not.toThrow();
      expect(cache.size()).toBe(0);
    });
  });

  describe('size', () => {
    it('should return 0 for empty cache', () => {
      expect(cache.size()).toBe(0);
    });

    it('should return correct size', () => {
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);

      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);

      cache.set('key3', 'value3');
      expect(cache.size()).toBe(3);
    });

    it('should decrease when deleting', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.delete('key1');

      expect(cache.size()).toBe(1);
    });

    it('should include expired entries until cleanup', async () => {
      cache.set('key1', 'value1', 100);
      cache.set('key2', 'value2', 1000);

      expect(cache.size()).toBe(2);

      await new Promise((resolve) => setTimeout(resolve, 150));

      // Size still 2 until cleanup or get
      expect(cache.size()).toBe(2);

      // Access expired key triggers deletion
      cache.get('key1');

      expect(cache.size()).toBe(1);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      cache.set('expired1', 'value1', 100);
      cache.set('expired2', 'value2', 100);
      cache.set('valid', 'value3', 10000);

      await new Promise((resolve) => setTimeout(resolve, 150));

      cache.cleanup();

      expect(cache.size()).toBe(1);
      expect(cache.get('valid')).toBe('value3');
    });

    it('should not remove valid entries', () => {
      cache.set('key1', 'value1', 10000);
      cache.set('key2', 'value2', 10000);

      cache.cleanup();

      expect(cache.size()).toBe(2);
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
    });

    it('should work with empty cache', () => {
      expect(() => cache.cleanup()).not.toThrow();
    });
  });

  describe('destroy', () => {
    it('should clear cache and stop cleanup interval', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.destroy();

      expect(cache.size()).toBe(0);
    });

    it('should be safe to call multiple times', () => {
      cache.destroy();
      expect(() => cache.destroy()).not.toThrow();
    });
  });

  describe('TypeScript generics', () => {
    interface User {
      id: number;
      name: string;
    }

    it('should maintain type safety with generics', () => {
      const user: User = { id: 1, name: 'John' };

      cache.set<User>('user', user);

      const retrieved = cache.get<User>('user');

      expect(retrieved).toEqual(user);
      if (retrieved) {
        expect(retrieved.id).toBe(1);
        expect(retrieved.name).toBe('John');
      }
    });

    it('should handle arrays of custom types', () => {
      const users: User[] = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ];

      cache.set<User[]>('users', users);

      const retrieved = cache.get<User[]>('users');

      expect(retrieved).toEqual(users);
      expect(retrieved?.length).toBe(2);
    });
  });

  describe('stress test', () => {
    it('should handle many entries', () => {
      for (let i = 0; i < 1000; i++) {
        cache.set(`key${i}`, `value${i}`);
      }

      expect(cache.size()).toBe(1000);

      for (let i = 0; i < 1000; i++) {
        expect(cache.get(`key${i}`)).toBe(`value${i}`);
      }
    });

    it('should handle rapid set/get operations', () => {
      const operations = 10000;

      for (let i = 0; i < operations; i++) {
        cache.set(`key${i % 100}`, `value${i}`);
        cache.get(`key${i % 100}`);
      }

      expect(cache.size()).toBeLessThanOrEqual(100);
    });
  });
});
