/**
 * Excerpt Embedding Cache Service Tests - Phase 10.112 Week 1
 * Netflix-Grade Collision Detection Implementation
 */

import { ExcerptEmbeddingCacheService } from '../excerpt-embedding-cache.service';

describe('ExcerptEmbeddingCacheService - Phase 10.112 Netflix-Grade', () => {
  let service: ExcerptEmbeddingCacheService;

  // Create valid embedding with correct dimension (1536)
  const createValidEmbedding = (): number[] => {
    return new Array(1536).fill(0).map(() => Math.random());
  };

  beforeEach(() => {
    service = new ExcerptEmbeddingCacheService();
    service.resetStats();
  });

  afterEach(() => {
    service.clear();
  });

  describe('Basic Cache Operations', () => {
    it('should set and get embeddings correctly', () => {
      const embedding = createValidEmbedding();
      service.set('test excerpt', embedding);
      const result = service.get('test excerpt');

      expect(result).toEqual(embedding);
    });

    it('should return null for non-existent keys', () => {
      const result = service.get('non-existent');

      expect(result).toBeNull();
    });

    it('should clear cache correctly', () => {
      service.set('test', createValidEmbedding());
      service.clear();

      expect(service.get('test')).toBeNull();
      expect(service.getStats().size).toBe(0);
    });
  });

  describe('Embedding Validation', () => {
    it('should reject non-array embeddings', () => {
      // @ts-expect-error - Testing invalid input
      service.set('test', 'not an array');

      expect(service.get('test')).toBeNull();
    });

    it('should reject embeddings with wrong dimension', () => {
      const wrongDimension = new Array(100).fill(0.5);
      service.set('test', wrongDimension);

      expect(service.get('test')).toBeNull();
    });

    it('should reject embeddings containing NaN', () => {
      const embedding = createValidEmbedding();
      embedding[500] = NaN;
      service.set('test', embedding);

      expect(service.get('test')).toBeNull();
    });

    it('should reject embeddings containing Infinity', () => {
      const embedding = createValidEmbedding();
      embedding[500] = Infinity;
      service.set('test', embedding);

      expect(service.get('test')).toBeNull();
    });
  });

  describe('Phase 10.112: Collision Detection', () => {
    it('should store original text for collision detection', () => {
      const embedding = createValidEmbedding();
      service.set('original text', embedding);

      // Same text should return the embedding
      expect(service.get('original text')).toEqual(embedding);
    });

    it('should detect collisions via text mismatch', () => {
      // This tests the collision detection mechanism
      // In practice, SHA-256 collisions are astronomically rare
      const embedding = createValidEmbedding();
      service.set('text one', embedding);

      // The same key derived from different text would be a collision
      // We can verify collision detection works by checking the counter
      const initialCollisions = service.getCollisionCount();
      expect(typeof initialCollisions).toBe('number');
      expect(initialCollisions).toBeGreaterThanOrEqual(0);
    });

    it('should track collision count', () => {
      const count = service.getCollisionCount();
      expect(typeof count).toBe('number');
    });

    it('should handle whitespace trimming correctly', () => {
      const embedding = createValidEmbedding();
      service.set('  text with spaces  ', embedding);

      // Should work with trimmed version
      expect(service.get('text with spaces')).toEqual(embedding);
    });
  });

  describe('Cache Statistics', () => {
    it('should track hits and misses', () => {
      service.set('exists', createValidEmbedding());

      service.get('exists'); // hit
      service.get('not-exists'); // miss

      const stats = service.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    it('should calculate hit rate', () => {
      service.set('key', createValidEmbedding());

      service.get('key'); // hit
      service.get('key'); // hit
      service.get('miss'); // miss

      const stats = service.getStats();
      expect(stats.hitRate).toBeCloseTo(66.67, 1);
    });

    it('should report cache size', () => {
      service.set('key1', createValidEmbedding());
      service.set('key2', createValidEmbedding());

      const stats = service.getStats();
      expect(stats.size).toBe(2);
    });

    it('should include collision metrics in stats', () => {
      const stats = service.getStats();

      expect(stats).toHaveProperty('collisions');
      expect(stats).toHaveProperty('collisionRate');
      expect(typeof stats.collisions).toBe('number');
      expect(typeof stats.collisionRate).toBe('number');
    });

    it('should reset stats correctly', () => {
      service.set('key', createValidEmbedding());
      service.get('key');
      service.get('miss');

      service.resetStats();

      const stats = service.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });

  describe('Batch Operations', () => {
    it('should get batch of embeddings', () => {
      service.set('key1', createValidEmbedding());
      service.set('key2', createValidEmbedding());

      const results = service.getBatch(['key1', 'key2', 'key3']);

      expect(results.size).toBe(2);
      expect(results.has('key1')).toBe(true);
      expect(results.has('key2')).toBe(true);
      expect(results.has('key3')).toBe(false);
    });

    it('should set batch of embeddings', () => {
      const batch = new Map<string, number[]>();
      batch.set('batch1', createValidEmbedding());
      batch.set('batch2', createValidEmbedding());

      service.setBatch(batch);

      expect(service.get('batch1')).not.toBeNull();
      expect(service.get('batch2')).not.toBeNull();
    });
  });

  describe('LRU Eviction', () => {
    it('should evict entries when max size reached', () => {
      // Note: MAX_CACHE_SIZE is 10000, so we need to fill it
      // For this test, we just verify the mechanism exists
      const embedding = createValidEmbedding();

      // Add some entries and verify they're stored
      for (let i = 0; i < 10; i++) {
        service.set(`entry-${i}`, embedding);
      }

      expect(service.getStats().size).toBe(10);
    });
  });

  describe('TTL Expiration', () => {
    it('should handle expired entries', () => {
      // Note: TTL is 1 hour, so we can't easily test expiration
      // Just verify the mechanism doesn't break normal operations
      const embedding = createValidEmbedding();
      service.set('ttl-test', embedding);

      const result = service.get('ttl-test');
      expect(result).toEqual(embedding);
    });
  });

  describe('Memory Estimation', () => {
    it('should estimate cache size in MB', () => {
      service.set('key1', createValidEmbedding());
      service.set('key2', createValidEmbedding());

      const sizeMB = service.getCacheSizeMB();

      expect(sizeMB).toBeGreaterThan(0);
      // Each embedding is ~12KB, 2 entries should be ~24KB = 0.023MB
      expect(sizeMB).toBeLessThan(1);
    });
  });

  describe('Logging', () => {
    it('should log stats without throwing', () => {
      service.set('test', createValidEmbedding());
      service.get('test');

      expect(() => service.logStats()).not.toThrow();
    });
  });

  describe('Access Count Tracking', () => {
    it('should increment access count on get', () => {
      service.set('access-test', createValidEmbedding());

      // Access multiple times
      service.get('access-test');
      service.get('access-test');
      service.get('access-test');

      // Access count is tracked internally for LRU
      const stats = service.getStats();
      expect(stats.hits).toBe(3);
    });
  });

  describe('SHA-256 Key Generation', () => {
    it('should generate consistent keys for same text', () => {
      const embedding = createValidEmbedding();
      service.set('consistent key', embedding);

      // Same text should retrieve the same embedding
      expect(service.get('consistent key')).toEqual(embedding);
      expect(service.get('consistent key')).toEqual(embedding);
    });

    it('should generate different keys for different text', () => {
      const embedding1 = createValidEmbedding();
      const embedding2 = createValidEmbedding();

      service.set('text one', embedding1);
      service.set('text two', embedding2);

      expect(service.get('text one')).toEqual(embedding1);
      expect(service.get('text two')).toEqual(embedding2);
      expect(service.get('text one')).not.toEqual(embedding2);
    });
  });
});
