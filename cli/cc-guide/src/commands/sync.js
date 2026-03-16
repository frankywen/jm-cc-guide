import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { getSourceDir, getPackageInfo } from '../lib/package-manager.js';
import { readConfig } from './config.js';

// 上游仓库信息
const UPSTREAM_REPO = 'https://github.com/frankywen/jm-cc-guide';
const CHANGELOG_URL = 'https://raw.githubusercontent.com/frankywen/jm-cc-guide/main/CHANGELOG.md';

/**
 * 同步命令
 */
export async function syncCommand(options) {
  console.log(chalk.blue('\n🔄 cc-guide 同步检查\n'));

  const sourceDir = getSourceDir();

  if (!sourceDir) {
    console.log(chalk.red('无法确定源目录'));
    return;
  }

  // 检查是否在 git 仓库中
  const isGitRepo = await checkGitRepo(sourceDir);

  if (options.changelog) {
    await showChangelog();
    return;
  }

  if (!isGitRepo) {
    console.log(chalk.yellow('当前不是 git 仓库，无法检查更新'));
    console.log(chalk.gray(`请手动访问 ${UPSTREAM_REPO} 查看更新`));
    return;
  }

  // 检查上游更新
  const updates = await checkForUpdates(sourceDir);

  if (updates.length === 0) {
    console.log(chalk.green('✓ 已是最新版本'));
    return;
  }

  // 显示更新内容
  console.log(chalk.yellow(`发现 ${updates.length} 个更新：\n`));
  for (const update of updates) {
    console.log(chalk.gray(`  - ${update.name}: ${update.status}`));
  }

  if (options.apply) {
    await applyUpdates(sourceDir, updates);
  } else {
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '是否应用更新？',
        default: true
      }
    ]);

    if (confirm) {
      await applyUpdates(sourceDir, updates);
    } else {
      console.log(chalk.gray('\n已取消更新'));
    }
  }
}

/**
 * 检查是否在 git 仓库中
 */
async function checkGitRepo(dir) {
  try {
    execSync('git rev-parse --git-dir', { cwd: dir, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * 检查上游更新
 */
async function checkForUpdates(sourceDir) {
  const updates = [];

  try {
    // 获取当前分支
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: sourceDir,
      encoding: 'utf-8'
    }).trim();

    // 获取远程更新
    console.log(chalk.gray('检查远程更新...'));
    execSync('git fetch origin', { cwd: sourceDir, stdio: 'ignore' });

    // 检查本地和远程的差异
    const localCommit = execSync('git rev-parse HEAD', {
      cwd: sourceDir,
      encoding: 'utf-8'
    }).trim();

    const remoteCommit = execSync(`git rev-parse origin/${currentBranch}`, {
      cwd: sourceDir,
      encoding: 'utf-8'
    }).trim();

    if (localCommit !== remoteCommit) {
      // 获取变更文件列表
      const changedFiles = execSync(`git diff --name-only ${localCommit} ${remoteCommit}`, {
        cwd: sourceDir,
        encoding: 'utf-8'
      }).trim().split('\n').filter(Boolean);

      // 分类更新
      for (const file of changedFiles) {
        if (file.startsWith('.claude/skills/')) {
          const skillName = file.split('/')[2];
          updates.push({
            name: `技能: ${skillName}`,
            type: 'skill',
            file,
            status: '已更新'
          });
        } else if (file === 'CLAUDE.md') {
          updates.push({
            name: 'CLAUDE.md',
            type: 'core',
            file,
            status: '已更新'
          });
        } else if (file.startsWith('docs/')) {
          updates.push({
            name: `文档: ${file}`,
            type: 'doc',
            file,
            status: '已更新'
          });
        } else if (file.startsWith('cli/')) {
          updates.push({
            name: 'CLI 工具',
            type: 'cli',
            file,
            status: '已更新'
          });
        }
      }
    }
  } catch (error) {
    console.log(chalk.yellow(`检查更新失败: ${error.message}`));
  }

  return updates;
}

/**
 * 应用更新
 */
async function applyUpdates(sourceDir, updates) {
  console.log(chalk.blue('\n📥 应用更新...\n'));

  try {
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: sourceDir,
      encoding: 'utf-8'
    }).trim();

    // 检查是否有未提交的更改
    const status = execSync('git status --porcelain', {
      cwd: sourceDir,
      encoding: 'utf-8'
    }).trim();

    if (status) {
      console.log(chalk.yellow('检测到未提交的更改，正在暂存...'));
      execSync('git stash', { cwd: sourceDir, stdio: 'ignore' });
    }

    // 拉取更新
    execSync(`git pull origin ${currentBranch}`, { cwd: sourceDir, stdio: 'ignore' });

    // 恢复暂存的更改
    if (status) {
      execSync('git stash pop', { cwd: sourceDir, stdio: 'ignore' });
    }

    console.log(chalk.green('✓ 更新已应用'));

    // 显示更新后的版本
    const newCommit = execSync('git log -1 --oneline', {
      cwd: sourceDir,
      encoding: 'utf-8'
    }).trim();
    console.log(chalk.gray(`  当前版本: ${newCommit}`));

  } catch (error) {
    console.log(chalk.red(`更新失败: ${error.message}`));
    console.log(chalk.gray('请手动执行: git pull'));
  }
}

/**
 * 显示变更日志
 */
async function showChangelog() {
  console.log(chalk.blue('\n📜 变更日志\n'));

  try {
    const response = await fetch(CHANGELOG_URL);
    if (response.ok) {
      const changelog = await response.text();
      // 显示最近的部分
      const lines = changelog.split('\n').slice(0, 50);
      console.log(lines.join('\n'));
      console.log(chalk.gray(`\n完整日志: ${UPSTREAM_REPO}/blob/main/CHANGELOG.md`));
    } else {
      console.log(chalk.yellow('无法获取变更日志'));
      console.log(chalk.gray(`请访问: ${UPSTREAM_REPO}`));
    }
  } catch (error) {
    console.log(chalk.yellow(`获取变更日志失败: ${error.message}`));
    console.log(chalk.gray(`请访问: ${UPSTREAM_REPO}`));
  }
}

/**
 * 检查并提示更新（用于其他命令）
 */
export async function checkForUpdatesIfNeeded() {
  const config = await readConfig();

  if (!config.autoUpdate) {
    return;
  }

  const sourceDir = getSourceDir();
  if (!sourceDir) return;

  try {
    const updates = await checkForUpdates(sourceDir);
    if (updates.length > 0) {
      console.log(chalk.yellow(`\n💡 发现 ${updates.length} 个更新，运行 'cc-guide sync' 查看详情\n`));
    }
  } catch {
    // 静默失败
  }
}