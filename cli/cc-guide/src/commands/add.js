import chalk from 'chalk';
import inquirer from 'inquirer';
import { getPackageInfo, getSourceDir, isPackageInstalled } from '../lib/package-manager.js';
import { copySkill } from '../lib/file-utils.js';

export async function addCommand(packageName, options) {
  const projectDir = process.cwd();
  const sourceDir = getSourceDir();

  const pkg = getPackageInfo(packageName);

  if (!pkg) {
    console.log(chalk.red(`\n错误: 未找到包 "${packageName}"`));
    console.log(chalk.gray('\n可用包: core, development, workflows, beginner-cn'));
    return;
  }

  // 检查是否已安装
  if (await isPackageInstalled(projectDir, packageName)) {
    console.log(chalk.yellow(`\n${packageName} 已安装`));

    const { reinstall } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'reinstall',
        message: '是否重新安装？',
        default: false
      }
    ]);

    if (!reinstall) return;
  }

  console.log(chalk.blue(`\n📦 安装 ${pkg.name}...`));
  console.log(chalk.gray(pkg.description));

  // 复制技能文件
  for (const skill of pkg.skills) {
    const success = await copySkill(sourceDir, projectDir, skill);
    if (success) {
      console.log(chalk.green(`✓ 已复制 .claude/skills/${skill}/`));
    } else {
      console.log(chalk.yellow(`⚠ 跳过 .claude/skills/${skill}/ (源不存在)`));
    }
  }

  console.log(chalk.green(`\n✓ ${packageName} 安装完成`));
}