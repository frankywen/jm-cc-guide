import chalk from 'chalk';
import inquirer from 'inquirer';
import { initCommand } from './init.js';
import { addCommand } from './add.js';
import { listCommand } from './list.js';
import { doctorCommand } from './doctor.js';
import { updateCommand } from './update.js';
import { configCommand } from './config.js';
import { readConfig } from './config.js';

/**
 * 交互式模式
 */
export async function interactiveCommand() {
  console.log(chalk.blue('\n🎯 cc-guide 交互式控制台\n'));
  console.log(chalk.gray('使用箭头键选择操作，按 Enter 确认\n'));

  // 加载用户配置
  const config = await readConfig();
  console.log(chalk.gray(`语言: ${config.language} | 主题: ${config.theme}\n`));

  let running = true;

  while (running) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '选择操作：',
        choices: [
          { name: '🚀 init  - 初始化项目', value: 'init' },
          { name: '📦 add   - 添加扩展包', value: 'add' },
          { name: '📋 list  - 列出可用包', value: 'list' },
          { name: '🔧 doctor - 诊断配置', value: 'doctor' },
          { name: '⬆️  update - 检查更新', value: 'update' },
          { name: '⚙️  config - 配置管理', value: 'config' },
          new inquirer.Separator(),
          { name: '❌ exit  - 退出', value: 'exit' }
        ]
      }
    ]);

    switch (action) {
      case 'init':
        await interactiveInit();
        break;
      case 'add':
        await interactiveAdd();
        break;
      case 'list':
        await listCommand({});
        break;
      case 'doctor':
        await doctorCommand({});
        break;
      case 'update':
        await updateCommand({});
        break;
      case 'config':
        await configCommand({});
        break;
      case 'exit':
        running = false;
        console.log(chalk.gray('\n再见！ 👋\n'));
        break;
    }

    if (running) {
      console.log(''); // 空行分隔
    }
  }
}

/**
 * 交互式初始化
 */
async function interactiveInit() {
  const { models, force } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'models',
      message: '选择要创建的配置文件：',
      choices: [
        { name: 'CLAUDE.md - Claude Code 配置', value: 'claude', checked: true },
        { name: 'GEMINI.md - Gemini CLI 配置', value: 'gemini' },
        { name: 'AGENTS.md - 多模型统一配置', value: 'agents' }
      ]
    },
    {
      type: 'confirm',
      name: 'force',
      message: '强制覆盖现有文件？',
      default: false
    }
  ]);

  if (models.length === 0) {
    console.log(chalk.yellow('请至少选择一个配置文件'));
    return;
  }

  await initCommand({
    models: models.join(','),
    force
  });
}

/**
 * 交互式添加扩展
 */
async function interactiveAdd() {
  const { packages, skipConflicts } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'packages',
      message: '选择要添加的扩展包：',
      choices: [
        { name: 'development - 开发扩展', value: 'development' },
        { name: 'workflows - 工作流扩展', value: 'workflows' },
        { name: 'beginner-cn - 中文入门', value: 'beginner-cn' },
        { name: 'agent-sdk - Agent SDK', value: 'agent-sdk' }
      ]
    },
    {
      type: 'confirm',
      name: 'skipConflicts',
      message: '跳过冲突检测？',
      default: false
    }
  ]);

  if (packages.length === 0) {
    console.log(chalk.yellow('请至少选择一个扩展包'));
    return;
  }

  for (const pkg of packages) {
    await addCommand({ skipConflicts }, pkg);
  }
}