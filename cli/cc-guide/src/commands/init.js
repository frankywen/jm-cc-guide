import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import {
  isClaudeProject,
  hasClaudeMd,
  readClaudeMd,
  writeClaudeMd,
  getClaudeMdLineCount,
  createDirectoryStructure,
  copySkill
} from '../lib/file-utils.js';
import { previewMerge, mergeContent } from '../lib/merger.js';
import { getAvailablePackages, getPackageInfo, getSourceDir } from '../lib/package-manager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'claude-md-template.md');

export async function initCommand(options) {
  const projectDir = process.cwd();
  const sourceDir = getSourceDir();

  console.log(chalk.blue('\n🚀 Claude Code 协作指南 初始化\n'));

  // 检查项目状态
  const isProject = await isClaudeProject(projectDir);
  const hasMd = await hasClaudeMd(projectDir);

  if (hasMd && !options.force) {
    // 已有 CLAUDE.md
    await handleExistingProject(projectDir, sourceDir);
  } else {
    // 新项目或强制覆盖
    await handleNewProject(projectDir, sourceDir, options.force);
  }
}

async function handleExistingProject(projectDir, sourceDir) {
  const existingContent = await readClaudeMd(projectDir);
  const lineCount = await getClaudeMdLineCount(projectDir);

  console.log(chalk.yellow(`检测到已有 CLAUDE.md（${lineCount} 行）`));

  // 获取基础层内容
  const coreSkillPath = path.join(sourceDir, '.claude', 'skills', 'core', 'SKILL.md');
  let newContent = '';

  if (await fs.pathExists(coreSkillPath)) {
    // 使用 CLAUDE.md 作为基础层内容
    const claudeMdPath = path.join(sourceDir, 'CLAUDE.md');
    newContent = await fs.readFile(claudeMdPath, 'utf-8');
  }

  // 预览合并
  const preview = previewMerge(existingContent, newContent, 'core');

  console.log(chalk.gray('\n建议添加以下内容：'));
  console.log(chalk.gray('  + 项目上下文指引（来自 core）'));
  console.log(chalk.gray('  + 常用命令快捷方式（来自 core）'));

  if (preview.conflicts.length > 0) {
    console.log(chalk.yellow('\n检测到冲突：'));
    for (const c of preview.conflicts) {
      console.log(chalk.gray(`  - ${c.message}`));
    }
  }

  const { proceed } = await inquirer.prompt([
    {
      type: 'list',
      name: 'proceed',
      message: '是否继续？',
      choices: [
        { name: 'Yes - 确认合并', value: 'yes' },
        { name: 'diff - 查看详细差异', value: 'diff' },
        { name: 'No - 取消', value: 'no' }
      ]
    }
  ]);

  if (proceed === 'diff') {
    console.log('\n' + chalk.gray('=== 新内容预览 ==='));
    console.log(newContent.slice(0, 500) + '...\n');

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '确认合并？',
        default: true
      }
    ]);

    if (!confirm) return;
  } else if (proceed === 'no') {
    console.log(chalk.gray('已取消'));
    return;
  }

  // 执行合并
  const result = await mergeContent(existingContent, newContent, 'core');
  await writeClaudeMd(projectDir, result.content);

  console.log(chalk.green(`\n✓ 已更新 CLAUDE.md（新增 ${result.addedLines} 行）`));

  // 复制基础技能
  await copySkill(sourceDir, projectDir, 'core');
  console.log(chalk.green('✓ 已创建 .claude/skills/core/'));

  // 询问是否安装扩展
  await askForExtensions(projectDir, sourceDir);
}

async function handleNewProject(projectDir, sourceDir, force) {
  console.log(chalk.gray('创建新项目配置...'));

  // 创建目录结构
  await createDirectoryStructure(projectDir);
  console.log(chalk.green('✓ 已创建目录结构'));

  // 复制 CLAUDE.md
  const claudeMdPath = path.join(sourceDir, 'CLAUDE.md');
  if (await fs.pathExists(claudeMdPath)) {
    await fs.copy(claudeMdPath, path.join(projectDir, 'CLAUDE.md'));
    console.log(chalk.green('✓ 已创建 CLAUDE.md'));
  }

  // 复制基础技能
  await copySkill(sourceDir, projectDir, 'core');
  console.log(chalk.green('✓ 已创建 .claude/skills/core/'));

  // 询问是否安装扩展
  await askForExtensions(projectDir, sourceDir);
}

async function askForExtensions(projectDir, sourceDir) {
  const packages = getAvailablePackages().filter(p => p.key !== 'core');

  const { extensions } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'extensions',
      message: '选择要安装的扩展：',
      choices: packages.map(p => ({
        name: `${p.key} - ${p.description}`,
        value: p.key
      }))
    }
  ]);

  for (const ext of extensions) {
    const pkg = getPackageInfo(ext);
    if (pkg) {
      for (const skill of pkg.skills) {
        await copySkill(sourceDir, projectDir, skill);
      }
      console.log(chalk.green(`✓ 已安装 ${ext}`));
    }
  }

  console.log(chalk.blue('\n🎉 初始化完成！\n'));
  console.log(chalk.gray('启动 Claude Code 验证：'));
  console.log(chalk.gray('  claude'));
  console.log(chalk.gray('  > 请告诉我你知道的核心概念'));
}

export { initCommand };