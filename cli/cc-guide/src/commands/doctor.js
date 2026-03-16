import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { hasClaudeMd, getClaudeMdLineCount, isClaudeProject } from '../lib/file-utils.js';

export async function doctorCommand() {
  const projectDir = process.cwd();

  console.log(chalk.blue('\n🔍 诊断配置问题\n'));

  const issues = [];

  // 检查 CLAUDE.md
  if (await hasClaudeMd(projectDir)) {
    const lineCount = await getClaudeMdLineCount(projectDir);
    if (lineCount > 200) {
      issues.push({
        type: 'warning',
        message: `CLAUDE.md 超过 200 行（当前 ${lineCount} 行）`,
        suggestion: '考虑使用 .claude/rules/ 分割大型指令'
      });
    } else {
      console.log(chalk.green('✓ CLAUDE.md 存在') + chalk.gray(` (${lineCount} 行)`));
    }
  } else {
    issues.push({
      type: 'error',
      message: '缺少 CLAUDE.md',
      suggestion: '运行 cc-guide init 创建'
    });
  }

  // 检查 .claude 目录
  const claudeDir = path.join(projectDir, '.claude');
  if (await fs.pathExists(claudeDir)) {
    console.log(chalk.green('✓ .claude/ 目录存在'));

    // 检查 skills
    const skillsDir = path.join(claudeDir, 'skills');
    if (await fs.pathExists(skillsDir)) {
      const skills = await fs.readdir(skillsDir);
      if (skills.length > 0) {
        console.log(chalk.green('✓ 技能目录: ') + chalk.gray(skills.join(', ')));
      } else {
        issues.push({
          type: 'info',
          message: '.claude/skills/ 目录为空',
          suggestion: '运行 cc-guide add core 安装基础技能'
        });
      }
    }
  } else {
    issues.push({
      type: 'warning',
      message: '缺少 .claude/ 目录',
      suggestion: '运行 cc-guide init 创建'
    });
  }

  // 输出问题
  if (issues.length > 0) {
    console.log(chalk.yellow('\n发现的问题：\n'));

    for (const issue of issues) {
      const icon = issue.type === 'error' ? '✗' : issue.type === 'warning' ? '⚠' : 'ℹ';
      const color = issue.type === 'error' ? chalk.red : issue.type === 'warning' ? chalk.yellow : chalk.blue;

      console.log(`  ${color(icon)} ${issue.message}`);
      console.log(`    ${chalk.gray('→ ' + issue.suggestion)}`);
    }
  } else {
    console.log(chalk.green('\n✓ 配置检查通过，未发现问题'));
  }
}