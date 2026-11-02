import { normalizeVietnamese } from "./vietnamese";

export { normalizeVietnamese };

/**
 * Tính khoảng cách Levenshtein giữa hai chuỗi đã chuẩn hóa
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) {
    row[j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      let val: number;
      if (a[i - 1] === b[j - 1]) {
        val = row[j - 1];
      } else {
        val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
      }
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }

  return row[b.length];
}

export interface MatchScoreResult {
  score: number;
  matched: boolean;
  matchType: "exact" | "prefix" | "word-boundary" | "contains" | "fuzzy" | "none";
}

/**
 * Tính điểm độ liên quan giữa chuỗi nguồn (target) và từ khóa người dùng nhập (query).
 * Điểm số:
 * - 1000+: Khớp chính xác (Exact match)
 * - 800+: Bắt đầu bằng từ khóa (Prefix match)
 * - 600+: Khớp ranh giới từ hoặc cụm từ con (Word boundary match)
 * - 400+: Chứa toàn bộ các từ (All words match)
 * - 200+: So khớp mờ gần đúng (Fuzzy match sai lệch 1-2 ký tự)
 */
export function calculateMatchScore(target: string, query: string): MatchScoreResult {
  if (!query || !query.trim() || !target) {
    return { score: 0, matched: false, matchType: "none" };
  }

  const normTarget = normalizeVietnamese(target);
  const normQuery = normalizeVietnamese(query);

  if (!normTarget || !normQuery) {
    return { score: 0, matched: false, matchType: "none" };
  }

  // 1. Khớp chính xác (Exact Match)
  if (normTarget === normQuery) {
    return { score: 1000, matched: true, matchType: "exact" };
  }

  // 2. Khớp tiền tố (Prefix Match): Tên bắt đầu bằng từ khóa
  if (normTarget.startsWith(normQuery)) {
    // Ưu tiên từ khóa chiếm tỉ lệ lớn hơn trong tên
    const ratio = normQuery.length / normTarget.length;
    return { score: 800 + Math.round(ratio * 100), matched: true, matchType: "prefix" };
  }

  // 3. Khớp ranh giới từ (Word Boundary Match): Ví dụ "Thanh Xuân" khớp từ khóa "Xuân"
  const wordBoundaryRegex = new RegExp(`(^|\\s)${escapeRegex(normQuery)}(\\s|$)`, "i");
  if (wordBoundaryRegex.test(normTarget)) {
    return { score: 650, matched: true, matchType: "word-boundary" };
  }

  // 4. Chứa chuỗi con liên tục (Substring Match)
  if (normTarget.includes(normQuery)) {
    const ratio = normQuery.length / normTarget.length;
    return { score: 500 + Math.round(ratio * 100), matched: true, matchType: "contains" };
  }

  // 5. Kiểm tra nếu tất cả các từ trong query đều xuất hiện trong target
  const queryWords = normQuery.split(/\s+/).filter(Boolean);
  if (queryWords.length > 1) {
    const targetWords = normTarget.split(/\s+/).filter(Boolean);
    const allWordsMatch = queryWords.every((qw) =>
      targetWords.some((tw) => tw.includes(qw) || levenshteinDistance(tw, qw) <= (qw.length >= 5 ? 1 : 0))
    );
    if (allWordsMatch) {
      return { score: 450, matched: true, matchType: "contains" };
    }
  }

  // 6. So khớp mờ (Fuzzy Matching): Sai nhẹ 1-2 ký tự cho từ đủ dài
  // Cho phép sai 1 ký tự nếu từ khóa >= 4 ký tự, sai tối đa 2 ký tự nếu từ khóa >= 7 ký tự
  const maxAllowedDistance = normQuery.length >= 7 ? 2 : normQuery.length >= 4 ? 1 : 0;
  if (maxAllowedDistance > 0) {
    // So khớp toàn chuỗi
    const fullDist = levenshteinDistance(normTarget, normQuery);
    if (fullDist <= maxAllowedDistance) {
      return { score: 350 - fullDist * 50, matched: true, matchType: "fuzzy" };
    }

    // So khớp mờ với từng cụm từ con có cùng số từ
    const targetWords = normTarget.split(/\s+/);
    const qWordCount = queryWords.length;

    for (let i = 0; i <= targetWords.length - qWordCount; i++) {
      const sliceText = targetWords.slice(i, i + qWordCount).join(" ");
      const dist = levenshteinDistance(sliceText, normQuery);
      if (dist <= maxAllowedDistance) {
        return { score: 300 - dist * 50, matched: true, matchType: "fuzzy" };
      }
    }
  }

  return { score: 0, matched: false, matchType: "none" };
}

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
