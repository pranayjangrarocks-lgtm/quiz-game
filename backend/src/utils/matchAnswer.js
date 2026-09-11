function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/\(.*?\)/g, ' ') // remove parenthetical text e.g. "(Remastered 2011)"
    .replace(/feat\.?.*$/i, '') // strip "feat. ..." suffixes
    .replace(/[^a-z0-9\s]/g, '') // strip punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Checks a user's guess against one or more accepted answers, allowing for
 * minor typos and partial title matches (e.g. missing "feat. Artist" suffix).
 */
function isMatch(userAnswer, correctAnswers) {
  const guess = normalize(userAnswer);
  if (!guess) return false;

  const candidates = Array.isArray(correctAnswers) ? correctAnswers : [correctAnswers];

  for (const candidate of candidates) {
    const target = normalize(candidate);
    if (!target) continue;

    if (guess === target) return true;
    if (target.length > 4 && (guess.includes(target) || target.includes(guess))) return true;

    const distance = levenshtein(guess, target);
    const threshold = Math.max(1, Math.floor(target.length * 0.2)); // ~20% typo tolerance
    if (distance <= threshold) return true;
  }

  return false;
}

module.exports = { normalize, levenshtein, isMatch };
