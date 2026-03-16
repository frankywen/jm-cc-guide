import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { doctorCommand } from './commands/doctor.js';
import { updateCommand } from './commands/update.js';
import { configCommand } from './commands/config.js';
import { interactiveCommand } from './commands/interactive.js';
import { syncCommand } from './commands/sync.js';

const program = new Command();

program
  .name('cc-guide')
  .description('Claude Code 协作指南 CLI 工具')
  .version('1.0.0');

program
  .command('init')
  .description('初始化项目配置')
  .option('-f, --force', '强制覆盖现有文件')
  .option('-m, --models <models>', '指定模型配置 (comma-separated: claude,gemini,agents)', 'claude')
  .action(initCommand);

program
  .command('add <package>')
  .description('添加扩展包')
  .option('-s, --skip-conflicts', '跳过冲突检测')
  .action(addCommand);

program
  .command('list')
  .description('列出可用包')
  .action(listCommand);

program
  .command('doctor')
  .description('诊断配置问题')
  .action(doctorCommand);

program
  .command('update')
  .description('更新到最新版本')
  .action(updateCommand);

program
  .command('config')
  .description('配置管理')
  .option('-l, --list', '列出当前配置')
  .option('-r, --reset', '重置为默认配置')
  .action(configCommand);

program
  .command('interactive')
  .alias('i')
  .description('交互式控制台模式')
  .action(interactiveCommand);

program
  .command('sync')
  .description('同步上游更新')
  .option('-a, --apply', '自动应用更新')
  .option('-c, --changelog', '查看变更日志')
  .action(syncCommand);

export { program };