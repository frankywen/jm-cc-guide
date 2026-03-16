import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { doctorCommand } from './commands/doctor.js';
import { updateCommand } from './commands/update.js';

const program = new Command();

program
  .name('cc-guide')
  .description('Claude Code 协作指南 CLI 工具')
  .version('1.0.0');

program
  .command('init')
  .description('初始化项目配置')
  .option('-f, --force', '强制覆盖现有文件')
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

export { program };