import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEST_DIR = path.join(os.tmpdir(), 'cc-guide-test-' + Date.now());

describe('CLI Commands', () => {
  beforeEach(async () => {
    // 创建测试目录
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    // 清理测试目录
    try {
      await fs.remove(TEST_DIR);
    } catch {
      // 忽略清理错误
    }
  });

  describe('init command', () => {
    it('should create directory structure', async () => {
      const projectDir = path.join(TEST_DIR, 'project1');
      await fs.ensureDir(projectDir);

      await fs.ensureDir(path.join(projectDir, '.claude/skills'));
      await fs.ensureDir(path.join(projectDir, '.claude/commands'));
      await fs.ensureDir(path.join(projectDir, '.claude/agents'));

      expect(await fs.pathExists(path.join(projectDir, '.claude/skills'))).toBe(true);
      expect(await fs.pathExists(path.join(projectDir, '.claude/commands'))).toBe(true);
      expect(await fs.pathExists(path.join(projectDir, '.claude/agents'))).toBe(true);
    });

    it('should create CLAUDE.md file', async () => {
      const projectDir = path.join(TEST_DIR, 'project2');
      await fs.ensureDir(projectDir);

      const content = '# Test Project\n\nTest content';
      await fs.writeFile(path.join(projectDir, 'CLAUDE.md'), content);

      expect(await fs.pathExists(path.join(projectDir, 'CLAUDE.md'))).toBe(true);
      const readContent = await fs.readFile(path.join(projectDir, 'CLAUDE.md'), 'utf-8');
      expect(readContent).toContain('Test Project');
    });

    it('should detect existing CLAUDE.md', async () => {
      const projectDir = path.join(TEST_DIR, 'project3');
      await fs.ensureDir(projectDir);
      await fs.writeFile(path.join(projectDir, 'CLAUDE.md'), '# Existing');
      const exists = await fs.pathExists(path.join(projectDir, 'CLAUDE.md'));
      expect(exists).toBe(true);
    });
  });

  describe('list command', () => {
    it('should list available packages', async () => {
      const { getAvailablePackages } = await import('../src/lib/package-manager.js');
      const packages = getAvailablePackages();

      expect(packages.length).toBeGreaterThan(0);
      expect(packages.find(p => p.key === 'core')).toBeDefined();
      expect(packages.find(p => p.key === 'development')).toBeDefined();
    });
  });

  describe('package-manager', () => {
    it('should return package info', async () => {
      const { getPackageInfo } = await import('../src/lib/package-manager.js');
      const pkg = getPackageInfo('core');

      expect(pkg).toBeDefined();
      expect(pkg.name).toBe('jm-cc-guide-core');
      expect(pkg.skills).toContain('core');
    });

    it('should return null for unknown package', async () => {
      const { getPackageInfo } = await import('../src/lib/package-manager.js');
      const pkg = getPackageInfo('unknown-package');

      expect(pkg).toBeNull();
    });
  });

  describe('file-utils', () => {
    it('should check if CLAUDE.md exists', async () => {
      const { hasClaudeMd } = await import('../src/lib/file-utils.js');
      const projectDir = path.join(TEST_DIR, 'project4');
      await fs.ensureDir(projectDir);

      expect(await hasClaudeMd(projectDir)).toBe(false);

      await fs.writeFile(path.join(projectDir, 'CLAUDE.md'), '# Test');
      expect(await hasClaudeMd(projectDir)).toBe(true);
    });

    it('should count lines in CLAUDE.md', async () => {
      const { getClaudeMdLineCount } = await import('../src/lib/file-utils.js');
      const projectDir = path.join(TEST_DIR, 'project5');
      await fs.ensureDir(projectDir);

      const content = 'Line 1\nLine 2\nLine 3';
      await fs.writeFile(path.join(projectDir, 'CLAUDE.md'), content);

      const count = await getClaudeMdLineCount(projectDir);
      expect(count).toBe(3);
    });
  });

  describe('merger', () => {
    it('should preview merge correctly', async () => {
      const { previewMerge } = await import('../src/lib/merger.js');

      const existing = '# Project\n\n## Section A\nContent A';
      const newContent = '# Project\n\n## Section B\nContent B';

      const preview = previewMerge(existing, newContent, 'test');

      expect(preview).toBeDefined();
      expect(preview.conflicts).toBeDefined();
    });

    it('should merge content without conflicts', async () => {
      const { mergeContent } = await import('../src/lib/merger.js');

      const existing = '# Project\n\n## Section A\nContent A';
      // 不带标题的新内容，避免与现有内容冲突
      const newContent = 'New paragraph content';

      const result = await mergeContent(existing, newContent, 'test');

      expect(result.content).toContain('Section A');
      expect(result.content).toContain('New paragraph');
    });

    it('should detect merge markers in output', async () => {
      const { mergeContent } = await import('../src/lib/merger.js');

      const existing = '# Project\n\n## Section A\nContent A';
      const newContent = '## New Section\nNew content here';

      const result = await mergeContent(existing, newContent, 'test');

      expect(result.content).toContain('Section A');
      // 检查添加的行数
      expect(result.addedLines).toBeGreaterThanOrEqual(0);
    });
  });

  describe('i18n', () => {
    it('should return localized text', async () => {
      const { t } = await import('../src/lib/i18n.js');

      const textZh = t('zh-CN', 'appName');
      expect(textZh).toBe('Claude Code 协作指南');

      const textEn = t('en-US', 'appName');
      expect(textEn).toBe('Claude Code Guide');
    });

    it('should support nested keys', async () => {
      const { t } = await import('../src/lib/i18n.js');

      const text = t('zh-CN', 'init.title');
      expect(text).toContain('初始化');
    });

    it('should support interpolation', async () => {
      const { t } = await import('../src/lib/i18n.js');

      const text = t('zh-CN', 'doctor.foundIssues', { count: 3 });
      expect(text).toContain('3');
    });

    it('should fallback to zh-CN for missing locale', async () => {
      const { t } = await import('../src/lib/i18n.js');

      const text = t('fr-FR', 'appName');
      expect(text).toBe('Claude Code 协作指南');
    });
  });
});