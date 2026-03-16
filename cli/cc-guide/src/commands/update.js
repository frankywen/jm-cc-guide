import chalk from 'chalk';
import { execSync } from 'child_process';

export async function updateCommand() {
  console.log(chalk.blue('\n🔄 检查更新...\n'));

  try {
    // 检查 npm 最新版本
    const latestVersion = execSync('npm view cc-guide version', { encoding: 'utf-8' }).trim();
    const currentVersion = '1.0.0'; // 从 package.json 读取

    if (latestVersion === currentVersion) {
      console.log(chalk.green('✓ 已是最新版本: ' + currentVersion));
    } else {
      console.log(chalk.yellow(`发现新版本: ${currentVersion} → ${latestVersion}`));
      console.log(chalk.gray('\n运行以下命令更新:'));
      console.log(chalk.cyan('  npm update -g cc-guide'));
    }
  } catch (error) {
    console.log(chalk.gray('无法检查更新（可能未发布到 npm）'));
    console.log(chalk.gray('手动更新: npm update -g cc-guide'));
  }
}

export { updateCommand };