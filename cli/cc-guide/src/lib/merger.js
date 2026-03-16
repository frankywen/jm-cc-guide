import { detectConflict, detectContentBlocks, calculateSimilarity } from './conflict-detector.js';

/**
 * 生成合并标记
 */
function generateMergeMarker(packageName, date = new Date().toISOString().split('T')[0]) {
  return {
    start: `<!-- BEGIN jm-cc-guide/${packageName} (${date}) -->`,
    end: `<!-- END jm-cc-guide/${packageName} -->`
  };
}

/**
 * 合并内容到现有 CLAUDE.md
 */
export async function mergeContent(existingContent, newContent, packageName, options = {}) {
  const conflicts = detectConflict(existingContent, newContent);

  // 处理冲突
  const resolvedContent = [];
  const newBlocks = detectContentBlocks(newContent);
  const existingBlocks = detectContentBlocks(existingContent);

  // 添加现有内容
  for (const block of existingBlocks) {
    resolvedContent.push(...block.lines);
  }

  // 添加新内容（跳过冲突）
  const marker = generateMergeMarker(packageName);
  const addedLines = [];

  for (const block of newBlocks) {
    const conflict = conflicts.find(c =>
      c.newBlock && block.heading &&
      calculateSimilarity(c.newBlock.heading, block.heading) > 0.8
    );

    if (!conflict || conflict.action === 'overwrite') {
      addedLines.push(...block.lines);
    }
  }

  if (addedLines.length > 0) {
    resolvedContent.push('');
    resolvedContent.push(marker.start);
    resolvedContent.push(...addedLines);
    resolvedContent.push(marker.end);
  }

  return {
    content: resolvedContent.join('\n'),
    conflicts,
    addedLines: addedLines.length
  };
}

/**
 * 预览合并结果
 */
export function previewMerge(existingContent, newContent, packageName) {
  const conflicts = detectConflict(existingContent, newContent);
  const marker = generateMergeMarker(packageName);

  return {
    existingLineCount: existingContent.split('\n').length,
    newLineCount: newContent.split('\n').length,
    conflicts,
    willAdd: conflicts.filter(c => c.action === 'skip').length === 0,
    marker
  };
}