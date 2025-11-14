export function semanticChunking(text, minChunkSize = 300, maxChunkSize = 600, overlapWords = 50) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

  if (sentences.length === 0) {
    return [{ text, index: 0 }];
  }

  const chunks = [];
  let currentChunk = '';
  let chunkIndex = 0;
  let overlapBuffer = '';

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();

    if ((currentChunk + sentence).split(/\s+/).length <= maxChunkSize) {
      currentChunk += ' ' + sentence;
    } else {
      if (currentChunk.split(/\s+/).length >= minChunkSize) {
        chunks.push({
          text: currentChunk.trim(),
          index: chunkIndex,
        });
        chunkIndex++;

        const words = currentChunk.split(/\s+/);
        overlapBuffer = words.slice(-overlapWords).join(' ');
      }

      currentChunk = overlapBuffer + ' ' + sentence;
    }
  }

  if (currentChunk.split(/\s+/).length >= minChunkSize) {
    chunks.push({
      text: currentChunk.trim(),
      index: chunkIndex,
    });
  }

  return chunks.length > 0 ? chunks : [{ text: text.trim(), index: 0 }];
}

export function normalizeText(text) {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\r+/g, ' ');
}
