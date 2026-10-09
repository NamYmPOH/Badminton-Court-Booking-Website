/**
 * Utility chuẩn hóa tiếng Việt hỗ trợ tìm kiếm không dấu và so khớp mờ (Fuzzy Search)
 * Chuẩn hóa Unicode NFD, loại bỏ dấu thanh, chuyển đ/Đ thành d
 */

export function normalizeVietnamese(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .trim();
}

/**
 * Kiểm tra chuỗi nguồn có chứa từ khóa mục tiêu hay không (cả có dấu lẫn không dấu)
 */
export function matchesVietnamese(source: string, keyword: string): boolean {
  if (!keyword || !keyword.trim()) return true;
  if (!source) return false;

  const rawSource = source.toLowerCase();
  const rawKeyword = keyword.toLowerCase().trim();

  if (rawSource.includes(rawKeyword)) {
    return true;
  }

  const normSource = normalizeVietnamese(source);
  const normKeyword = normalizeVietnamese(keyword);

  return normSource.includes(normKeyword);
}
