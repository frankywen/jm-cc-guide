import chalk from 'chalk';
import { getAvailablePackages, getInstalledPackages } from '../lib/package-manager.js';

export async function listCommand() {
  const projectDir = process.cwd();

  console.log(chalk.blue('\n📦 可用包\n'));

  const packages = getAvailablePackages();
  const installed = await getInstalledPackages(projectDir);
  const installedKeys = installed.map(p => p.key);

  for (const pkg of packages) {
    const isInstalled = installedKeys.includes(pkg.key);
    const status = isInstalled ? chalk.green('✓ 已安装') : chalk.gray('○ 未安装');

    console.log(`  ${status} ${chalk.cyan(pkg.key)}`);
    console.log(`         ${chalk.gray(pkg.description)}`);
    console.log();
  }

  console.log(chalk.gray('使用 cc-guide add <package> 安装扩展'));
}