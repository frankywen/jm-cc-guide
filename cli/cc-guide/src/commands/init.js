import chalk from 'chalk';
import inquirer from 'inquirer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import {
  hasClaudeMd,
  readClaudeMd,
  writeClaudeMd,
  getClaudeMdLineCount,
  createDirectoryStructure,
  copySkill
} from '../lib/file-utils.js';
import { getAvailablePackages, getPackageInfo, getSourceDir } from '../lib/package-manager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'claude-md-template.md');
const GEMINI_TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'gemini-md-template.md');
const AGENTS_TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'agents-md-template.md');

// 支持的模型配置
const MODEL_CONFIGS = {
  claude: {
    file: 'CLAUDE.md',
    template: TEMPLATE_PATH,
    description: 'Claude Code 配置'
  },
  gemini: {
    file: 'GEMINI.md',
    template: GEMINI_TEMPLATE_PATH,
    description: 'Gemini CLI 配置'
  },
  agents: {
    file: 'AGENTS.md',
    template: AGENTS_TEMPLATE_PATH,
    description: '多模型统一配置'
  }
};

export async function initCommand(options) {
  const projectDir = process.cwd();
  const sourceDir = getSourceDir();

  console.log(chalk.blue('\n🚀 Claude Code 协作指南 初始化\n'));

  // 解析 models 选项
  const models = parseModelsOption(options.models);

  // 检查是否已有 CLAUDE.md
  const hasMd = await hasClaudeMd(projectDir);

  if (hasMd && !options.force) {
    // 已有 CLAUDE.md
    await handleExistingProject(projectDir, sourceDir, models);
  } else {
    // 新项目或强制覆盖
    await handleNewProject(projectDir, sourceDir, options.force, models);
  }
}

/**
 * 解析 --models 选项
 * @param {string} modelsStr - 逗号分隔的模型列表，如 "claude,gemini"
 */
function parseModelsOption(modelsStr) {
  if (!modelsStr) {
    return ['claude']; // 默认只创建 Claude 配置
  }

  const requestedModels = modelsStr.split(',').map(m => m.trim().toLowerCase());
  const validModels = [];

  for (const model of requestedModels) {
    if (MODEL_CONFIGS[model]) {
      validModels.push(model);
    } else {
      console.log(chalk.yellow(`警告: 未知的模型配置 "${model}"，已跳过`));
    }
  }

  return validModels.length > 0 ? validModels : ['claude'];
}

async function handleExistingProject(projectDir, sourceDir, models) {
  const existingContent = await readClaudeMd(projectDir);
  const lineCount = await getClaudeMdLineCount(projectDir);

  console.log(chalk.yellow(`检测到已有 CLAUDE.md（${lineCount} 行）`));
  console.log(chalk.gray('将保留现有内容，仅添加技能引用...'));

  // 检查是否已有技能引用
  const hasSkillRef = existingContent.includes('.claude/skills/');

  if (hasSkillRef) {
    console.log(chalk.gray('检测到已有技能引用，跳过修改'));
  } else {
    // 询问是否添加技能引用
    const { addRef } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addRef',
        message: '是否在 CLAUDE.md 中添加技能引用？',
        default: true
      }
    ]);

    if (addRef) {
      // 添加简洁的技能引用
      const skillRef = `\n## Claude Code 技能\n\n已通过 \`cc-guide\` 安装以下技能：\n\n- \`.claude/skills/core/\` - 核心概念和最佳实践\n`;
      const newContent = existingContent.trimEnd() + '\n' + skillRef;
      await writeClaudeMd(projectDir, newContent);
      console.log(chalk.green('✓ 已添加技能引用到 CLAUDE.md'));
    }
  }

  // 复制基础技能
  await copySkill(sourceDir, projectDir, 'core');
  console.log(chalk.green('✓ 已创建 .claude/skills/core/'));

  // 创建多模型配置
  await createModelConfigs(projectDir, models);

  // 询问是否安装扩展
  await askForExtensions(projectDir, sourceDir);
}

async function handleNewProject(projectDir, sourceDir, force, models) {
  console.log(chalk.gray('创建新项目配置...'));

  // 创建目录结构
  await createDirectoryStructure(projectDir);
  console.log(chalk.green('✓ 已创建目录结构'));

  // 使用模板创建 CLAUDE.md（而不是复制完整的指南文档）
  const templatePath = TEMPLATE_PATH;
  if (await fs.pathExists(templatePath)) {
    // 读取模板并添加技能引用
    let templateContent = await fs.readFile(templatePath, 'utf-8');

    // 添加已安装技能的引用
    const skillRef = `\n## Claude Code 技能\n\n已通过 \`cc-guide\` 安装以下技能：\n\n- \`.claude/skills/core/\` - 核心概念和最佳实践\n`;
    templateContent = templateContent.trimEnd() + '\n' + skillRef;

    await fs.writeFile(path.join(projectDir, 'CLAUDE.md'), templateContent);
    console.log(chalk.green('✓ 已创建 CLAUDE.md'));
  }

  // 复制基础技能
  await copySkill(sourceDir, projectDir, 'core');
  console.log(chalk.green('✓ 已创建 .claude/skills/core/'));

  // 创建多模型配置
  await createModelConfigs(projectDir, models);

  // 询问是否安装扩展
  await askForExtensions(projectDir, sourceDir);
}

/**
 * 创建多模型配置文件
 */
async function createModelConfigs(projectDir, models) {
  for (const model of models) {
    if (model === 'claude') continue; // Claude 配置已经处理

    const config = MODEL_CONFIGS[model];
    if (!config) continue;

    const targetPath = path.join(projectDir, config.file);

    // 检查文件是否已存在
    if (await fs.pathExists(targetPath)) {
      console.log(chalk.gray(`  跳过 ${config.file}（已存在）`));
      continue;
    }

    // 从模板复制
    if (await fs.pathExists(config.template)) {
      await fs.copy(config.template, targetPath);
      console.log(chalk.green(`✓ 已创建 ${config.file}（${config.description}）`));
    }
  }
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