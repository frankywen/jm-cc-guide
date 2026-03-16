import fs from 'fs-extra';
import path from 'path';

// 包定义
const PACKAGES = {
  core: {
    name: 'jm-cc-guide-core',
    description: '基础层 - 核心概念和最佳实践',
    skills: ['core']
  },
  development: {
    name: 'jm-cc-guide-development',
    description: '开发扩展 - 文档技能、开发模板、编排模式',
    skills: ['extensions/development']
  },
  workflows: {
    name: 'jm-cc-guide-workflows',
    description: '工作流扩展 - 端到端开发工作流',
    skills: ['extensions/workflows']
  },
  'beginner-cn': {
    name: 'jm-cc-guide-beginner-cn',
    description: '中文入门 - 零基础学习 Claude Code',
    skills: ['extensions/beginner-cn']
  },
  'agent-sdk': {
    name: 'jm-cc-guide-agent-sdk',
    description: 'Agent SDK - 构建自主代理应用',
    skills: ['extensions/agent-sdk']
  }
};

/**
 * 获取所有可用包
 */
export function getAvailablePackages() {
  return Object.entries(PACKAGES).map(([key, pkg]) => ({
    key,
    ...pkg
  }));
}

/**
 * 获取包信息
 */
export function getPackageInfo(packageName) {
  return PACKAGES[packageName] || null;
}

/**
 * 检查包是否已安装
 */
export async function isPackageInstalled(projectDir, packageName) {
  const pkg = PACKAGES[packageName];
  if (!pkg) return false;

  for (const skill of pkg.skills) {
    const skillPath = path.join(projectDir, '.claude', 'skills', skill, 'SKILL.md');
    if (await fs.pathExists(skillPath)) {
      return true;
    }
  }

  return false;
}

/**
 * 获取已安装的包
 */
export async function getInstalledPackages(projectDir) {
  const installed = [];

  for (const [key, pkg] of Object.entries(PACKAGES)) {
    if (await isPackageInstalled(projectDir, key)) {
      installed.push({ key, ...pkg });
    }
  }

  return installed;
}

/**
 * 获取源目录（CLI 工具所在位置）
 */
export function getSourceDir() {
  // 从 CLI 安装位置查找源文件
  // 开发时从项目根目录查找
  const possiblePaths = [
    path.resolve(process.cwd(), '..'),
    path.resolve(process.cwd(), '..', '..'),
    path.resolve(process.cwd(), '..', '..', '..')
  ];

  for (const p of possiblePaths) {
    if (fs.pathExistsSync(path.join(p, '.claude', 'skills'))) {
      return p;
    }
  }

  return null;
}