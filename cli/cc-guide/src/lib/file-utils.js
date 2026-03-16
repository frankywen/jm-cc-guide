import fs from 'fs-extra';
import path from 'path';

/**
 * 检查是否为 Claude Code 项目
 */
export async function isClaudeProject(dir) {
  const claudeMd = path.join(dir, 'CLAUDE.md');
  const claudeDir = path.join(dir, '.claude');

  return await fs.pathExists(claudeMd) || await fs.pathExists(claudeDir);
}

/**
 * 检查 CLAUDE.md 是否存在
 */
export async function hasClaudeMd(dir) {
  return await fs.pathExists(path.join(dir, 'CLAUDE.md'));
}

/**
 * 读取 CLAUDE.md 内容
 */
export async function readClaudeMd(dir) {
  const filePath = path.join(dir, 'CLAUDE.md');
  if (await fs.pathExists(filePath)) {
    return await fs.readFile(filePath, 'utf-8');
  }
  return null;
}

/**
 * 写入 CLAUDE.md
 */
export async function writeClaudeMd(dir, content) {
  const filePath = path.join(dir, 'CLAUDE.md');
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * 获取 CLAUDE.md 行数
 */
export async function getClaudeMdLineCount(dir) {
  const content = await readClaudeMd(dir);
  if (!content) return 0;
  return content.split('\n').length;
}

/**
 * 创建目录结构
 */
export async function createDirectoryStructure(dir) {
  const dirs = [
    '.claude/skills/core',
    '.claude/skills/extensions',
    '.claude/commands',
    '.claude/agents',
    '.claude/hooks',
    '.claude/rules',
    'docs'
  ];

  for (const subDir of dirs) {
    await fs.ensureDir(path.join(dir, subDir));
  }
}

/**
 * 复制技能文件
 */
export async function copySkill(sourceDir, targetDir, skillName) {
  const source = path.join(sourceDir, '.claude', 'skills', skillName);
  const target = path.join(targetDir, '.claude', 'skills', skillName);

  if (await fs.pathExists(source)) {
    await fs.copy(source, target, { overwrite: true });
    return true;
  }
  return false;
}

/**
 * 列出可用的技能包
 */
export async function listAvailableSkills(sourceDir) {
  const skillsDir = path.join(sourceDir, '.claude', 'skills');
  const result = { core: [], extensions: [] };

  // 核心
  const coreDir = path.join(skillsDir, 'core');
  if (await fs.pathExists(coreDir)) {
    result.core = (await fs.readdir(coreDir)).filter(f => !f.startsWith('.'));
  }

  // 扩展
  const extDir = path.join(skillsDir, 'extensions');
  if (await fs.pathExists(extDir)) {
    result.extensions = (await fs.readdir(extDir)).filter(f => !f.startsWith('.'));
  }

  return result;
}