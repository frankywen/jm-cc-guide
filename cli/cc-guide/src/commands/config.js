import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const CONFIG_FILE = path.join(os.homedir(), '.cc-guiderc.json');

// 默认配置
const DEFAULT_CONFIG = {
  defaultPackages: ['core'],
  language: 'zh-CN',
  autoUpdate: false,
  editor: null,
  theme: 'default'
};

/**
 * 获取配置文件路径
 */
export function getConfigPath() {
  return CONFIG_FILE;
}

/**
 * 读取配置
 */
export async function readConfig() {
  try {
    if (await fs.pathExists(CONFIG_FILE)) {
      const config = await fs.readJson(CONFIG_FILE);
      return { ...DEFAULT_CONFIG, ...config };
    }
  } catch (error) {
    console.log(chalk.yellow(`配置文件读取失败，使用默认配置`));
  }
  return { ...DEFAULT_CONFIG };
}

/**
 * 写入配置
 */
export async function writeConfig(config) {
  await fs.writeJson(CONFIG_FILE, config, { spaces: 2 });
  console.log(chalk.green(`✓ 配置已保存到 ${CONFIG_FILE}`));
}

/**
 * 配置命令
 */
export async function configCommand(options) {
  console.log(chalk.blue('\n⚙️  cc-guide 配置管理\n'));

  if (options.list) {
    // 列出当前配置
    const config = await readConfig();
    console.log(chalk.gray('当前配置：'));
    console.log(JSON.stringify(config, null, 2));
    return;
  }

  if (options.reset) {
    // 重置配置
    await writeConfig(DEFAULT_CONFIG);
    console.log(chalk.green('✓ 配置已重置为默认值'));
    return;
  }

  // 交互式配置
  const currentConfig = await readConfig();

  const answers = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'defaultPackages',
      message: '默认安装的扩展包：',
      choices: [
        { name: 'core - 基础层', value: 'core', checked: currentConfig.defaultPackages.includes('core') },
        { name: 'development - 开发扩展', value: 'development', checked: currentConfig.defaultPackages.includes('development') },
        { name: 'workflows - 工作流扩展', value: 'workflows', checked: currentConfig.defaultPackages.includes('workflows') },
        { name: 'beginner-cn - 中文入门', value: 'beginner-cn', checked: currentConfig.defaultPackages.includes('beginner-cn') },
        { name: 'agent-sdk - Agent SDK', value: 'agent-sdk', checked: currentConfig.defaultPackages.includes('agent-sdk') }
      ]
    },
    {
      type: 'list',
      name: 'language',
      message: '默认语言：',
      choices: [
        { name: '中文', value: 'zh-CN' },
        { name: 'English', value: 'en-US' }
      ],
      default: currentConfig.language
    },
    {
      type: 'confirm',
      name: 'autoUpdate',
      message: '启用自动更新检查？',
      default: currentConfig.autoUpdate
    },
    {
      type: 'list',
      name: 'theme',
      message: '输出主题：',
      choices: [
        { name: '默认', value: 'default' },
        { name: '简洁', value: 'minimal' },
        { name: '详细', value: 'verbose' }
      ],
      default: currentConfig.theme
    }
  ]);

  const newConfig = { ...currentConfig, ...answers };
  await writeConfig(newConfig);

  console.log(chalk.blue('\n🎉 配置完成！\n'));
}

/**
 * 获取配置值
 */
export async function getConfigValue(key) {
  const config = await readConfig();
  return config[key];
}

/**
 * 设置配置值
 */
export async function setConfigValue(key, value) {
  const config = await readConfig();
  config[key] = value;
  await writeConfig(config);
}