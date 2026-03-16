import { describe, it, expect } from '@jest/globals';
import {
  extractHeadings,
  calculateSimilarity,
  detectConflict
} from '../src/lib/conflict-detector.js';

describe('Conflict Detector', () => {
  describe('extractHeadings', () => {
    it('should extract h2 and h3 headings', () => {
      const content = `# Title
## Section 1
### Subsection 1.1
## Section 2`;

      const headings = extractHeadings(content);

      expect(headings).toHaveLength(3);
      expect(headings[0].text).toBe('section 1');
      expect(headings[1].text).toBe('subsection 1.1');
      expect(headings[2].text).toBe('section 2');
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 1 for identical strings', () => {
      const result = calculateSimilarity('hello', 'hello');
      expect(result).toBe(1);
    });

    it('should return high similarity for similar strings', () => {
      const result = calculateSimilarity('核心概念', '核心概念表');
      expect(result).toBeGreaterThan(0.8);
    });

    it('should return low similarity for different strings', () => {
      const result = calculateSimilarity('hello', 'world');
      expect(result).toBeLessThan(0.5);
    });
  });

  describe('detectConflict', () => {
    it('should detect exact duplicate', () => {
      const existing = `## 核心概念
内容 A`;

      const newContent = `## 核心概念
内容 A`;

      const conflicts = detectConflict(existing, newContent);
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].type).toBe('exact_duplicate');
    });

    it('should detect partial overlap', () => {
      const existing = `## 核心概念
内容 A`;

      const newContent = `## 核心概念
内容 B`;

      const conflicts = detectConflict(existing, newContent);
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].type).toBe('partial_overlap');
    });

    it('should return empty for no conflict', () => {
      const existing = `## Section A
内容 A`;

      const newContent = `## Section B
内容 B`;

      const conflicts = detectConflict(existing, newContent);
      expect(conflicts).toHaveLength(0);
    });
  });
});