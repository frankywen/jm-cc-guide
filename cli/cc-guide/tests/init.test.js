import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { isClaudeProject, hasClaudeMd, createDirectoryStructure } from '../src/lib/file-utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DIR = path.join(__dirname, 'test-project');

describe('File Utilities', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  describe('isClaudeProject', () => {
    it('should return false for empty directory', async () => {
      const result = await isClaudeProject(TEST_DIR);
      expect(result).toBe(false);
    });

    it('should return true when CLAUDE.md exists', async () => {
      await fs.writeFile(path.join(TEST_DIR, 'CLAUDE.md'), '# Test');
      const result = await isClaudeProject(TEST_DIR);
      expect(result).toBe(true);
    });

    it('should return true when .claude/ exists', async () => {
      await fs.ensureDir(path.join(TEST_DIR, '.claude'));
      const result = await isClaudeProject(TEST_DIR);
      expect(result).toBe(true);
    });
  });

  describe('hasClaudeMd', () => {
    it('should return false when CLAUDE.md does not exist', async () => {
      const result = await hasClaudeMd(TEST_DIR);
      expect(result).toBe(false);
    });

    it('should return true when CLAUDE.md exists', async () => {
      await fs.writeFile(path.join(TEST_DIR, 'CLAUDE.md'), '# Test');
      const result = await hasClaudeMd(TEST_DIR);
      expect(result).toBe(true);
    });
  });

  describe('createDirectoryStructure', () => {
    it('should create all required directories', async () => {
      await createDirectoryStructure(TEST_DIR);

      const expectedDirs = [
        '.claude/skills/core',
        '.claude/skills/extensions',
        '.claude/commands',
        '.claude/agents',
        '.claude/hooks',
        '.claude/rules',
        'docs'
      ];

      for (const dir of expectedDirs) {
        const exists = await fs.pathExists(path.join(TEST_DIR, dir));
        expect(exists).toBe(true);
      }
    });
  });
});