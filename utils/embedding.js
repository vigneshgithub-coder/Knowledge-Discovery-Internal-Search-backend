import crypto from 'crypto';

function deterministicHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export function generateDeterministicEmbedding(text) {
  const hash = deterministicHash(text);

  const embedding = [];
  for (let i = 0; i < 384; i++) {
    const byteIndex = (i * 2) % hash.length;
    const hexByte = hash.substring(byteIndex, byteIndex + 2);
    const byte = parseInt(hexByte, 16) / 255;
    embedding.push((byte * 2) - 1);
  }

  return embedding;
}

export function cosineSimilarity(vec1, vec2) {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }

  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);

  if (mag1 === 0 || mag2 === 0) {
    return 0;
  }

  return dotProduct / (mag1 * mag2);
}
