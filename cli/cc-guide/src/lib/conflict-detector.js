import levenshtein from 'fast-levenshtein';

/**
 * 提取 Markdown 标题
 */
export function extractHeadings(content) {
  const lines = content.split('\n');
  const headings = [];

  for (const line of lines) {
    const match = line.match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim().toLowerCase(),
        original: match[2].trim()
      });
    }
  }

  return headings;
}

/**
 * 计算字符串相似度
 */
export function calculateSimilarity(a, b) {
  const distance = levenshtein.get(a.toLowerCase(), b.toLowerCase());
  const maxLen = Math.max(a.length, b.length);
  return 1 - (distance / maxLen);
}

/**
 * 检测内容块边界
 */
export function detectContentBlocks(content) {
  const lines = content.split('\n');
  const blocks = [];
  let currentBlock = { start: 0, heading: null, lines: [] };

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(#{2,3})\s+(.+)$/);
    if (match) {
      if (currentBlock.lines.length > 0) {
        blocks.push(currentBlock);
      }
      currentBlock = {
        start: i,
        heading: match[2].trim(),
        level: match[1].length,
        lines: [lines[i]]
      };
    } else {
      currentBlock.lines.push(lines[i]);
    }
  }

  if (currentBlock.lines.length > 0) {
    blocks.push(currentBlock);
  }

  return blocks;
}

/**
 * 检测冲突类型
 */
export function detectConflict(existingContent, newContent) {
  const existingBlocks = detectContentBlocks(existingContent);
  const newBlocks = detectContentBlocks(newContent);

  const conflicts = [];

  for (const newBlock of newBlocks) {
    if (!newBlock.heading) continue;

    for (const existingBlock of existingBlocks) {
      if (!existingBlock.heading) continue;

      const similarity = calculateSimilarity(newBlock.heading, existingBlock.heading);

      if (similarity > 0.8) {
        // 标题相似
        const existingText = existingBlock.lines.join('\n');
        const newText = newBlock.lines.join('\n');

        if (existingText === newText) {
          conflicts.push({
            type: 'exact_duplicate',
            heading: newBlock.heading,
            action: 'skip',
            message: `完全重复: "${newBlock.heading}" 可跳过`
          });
        } else {
          conflicts.push({
            type: 'partial_overlap',
            heading: newBlock.heading,
            similarity,
            existingBlock,
            newBlock,
            action: 'ask',
            message: `部分重叠: "${newBlock.heading}" (相似度: ${(similarity * 100).toFixed(0)}%)`
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * 检测完全重复（逐行比对）
 */
export function detectExactDuplicate(existingContent, newContent) {
  const existingLines = existingContent.split('\n').filter(l => l.trim());
  const newLines = newContent.split('\n').filter(l => l.trim());

  for (const newLine of newLines) {
    if (existingLines.includes(newLine)) {
      return true;
    }
  }

  return false;
}