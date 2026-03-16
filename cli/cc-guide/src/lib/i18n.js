const locales = {
  'zh-CN': {
    // 通用
    appName: 'Claude Code 协作指南',
    version: '版本',
    yes: '是',
    no: '否',
    cancel: '取消',
    confirm: '确认',
    success: '成功',
    error: '错误',
    warning: '警告',

    // init 命令
    init: {
      title: '🚀 初始化项目配置',
      detected: '检测到已有配置',
      creating: '创建新项目配置...',
      directoryCreated: '已创建目录结构',
      claudeMdCreated: '已创建 CLAUDE.md',
      skillsCreated: '已创建 .claude/skills/',
      selectExtensions: '选择要安装的扩展：',
      complete: '初始化完成！',
      forceConfirm: '已检测到 CLAUDE.md，是否强制覆盖？'
    },

    // add 命令
    add: {
      title: '📦 添加扩展包',
      installed: '已安装',
      notFound: '未找到扩展包',
      conflictDetected: '检测到冲突',
      conflictResolve: '如何处理冲突？'
    },

    // list 命令
    list: {
      title: '📋 可用扩展包',
      name: '名称',
      description: '描述',
      status: '状态',
      installed: '已安装',
      notInstalled: '未安装'
    },

    // doctor 命令
    doctor: {
      title: '🔧 配置诊断',
      checking: '检查中...',
      allPassed: '所有检查通过',
      foundIssues: '发现 {count} 个问题',
      fixSuggestion: '建议修复方案'
    },

    // sync 命令
    sync: {
      title: '🔄 同步检查',
      checking: '检查远程更新...',
      upToDate: '已是最新版本',
      foundUpdates: '发现 {count} 个更新',
      applyConfirm: '是否应用更新？',
      applied: '更新已应用'
    },

    // config 命令
    config: {
      title: '⚙️ 配置管理',
      saved: '配置已保存',
      reset: '配置已重置为默认值',
      currentConfig: '当前配置'
    },

    // interactive 命令
    interactive: {
      title: '🎯 交互式控制台',
      selectAction: '选择操作：',
      exit: '退出'
    }
  },

  'en-US': {
    // General
    appName: 'Claude Code Guide',
    version: 'Version',
    yes: 'Yes',
    no: 'No',
    cancel: 'Cancel',
    confirm: 'Confirm',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',

    // init command
    init: {
      title: '🚀 Initialize Project',
      detected: 'Existing configuration detected',
      creating: 'Creating new project configuration...',
      directoryCreated: 'Directory structure created',
      claudeMdCreated: 'CLAUDE.md created',
      skillsCreated: '.claude/skills/ created',
      selectExtensions: 'Select extensions to install:',
      complete: 'Initialization complete!',
      forceConfirm: 'CLAUDE.md already exists. Force overwrite?'
    },

    // add command
    add: {
      title: '📦 Add Extension Package',
      installed: 'Installed',
      notFound: 'Package not found',
      conflictDetected: 'Conflict detected',
      conflictResolve: 'How to resolve conflict?'
    },

    // list command
    list: {
      title: '📋 Available Packages',
      name: 'Name',
      description: 'Description',
      status: 'Status',
      installed: 'Installed',
      notInstalled: 'Not installed'
    },

    // doctor command
    doctor: {
      title: '🔧 Configuration Diagnostics',
      checking: 'Checking...',
      allPassed: 'All checks passed',
      foundIssues: 'Found {count} issue(s)',
      fixSuggestion: 'Suggested fix'
    },

    // sync command
    sync: {
      title: '🔄 Sync Check',
      checking: 'Checking for remote updates...',
      upToDate: 'Already up to date',
      foundUpdates: 'Found {count} update(s)',
      applyConfirm: 'Apply updates?',
      applied: 'Updates applied'
    },

    // config command
    config: {
      title: '⚙️ Configuration',
      saved: 'Configuration saved',
      reset: 'Configuration reset to defaults',
      currentConfig: 'Current configuration'
    },

    // interactive command
    interactive: {
      title: '🎯 Interactive Console',
      selectAction: 'Select action:',
      exit: 'Exit'
    }
  }
};

/**
 * 获取本地化文本
 * @param {string} locale - 语言代码
 * @param {string} key - 文本键（支持点分隔，如 'init.title'）
 * @param {object} params - 插值参数
 */
export function t(locale, key, params = {}) {
  const keys = key.split('.');
  let value = locales[locale] || locales['zh-CN'];

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      // 回退到中文
      value = locales['zh-CN'];
      for (const k2 of keys) {
        value = value?.[k2];
      }
      break;
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  // 插值替换
  return Object.entries(params).reduce(
    (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, 'g'), v),
    value
  );
}

/**
 * 获取所有支持的语言
 */
export function getSupportedLocales() {
  return Object.keys(locales);
}

export default locales;