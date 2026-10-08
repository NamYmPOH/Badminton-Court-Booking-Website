/** Prisma 5 cần chế độ PgBouncer khi dùng Supabase transaction pooler. */
export function runtimeDatabaseUrl(value: string | undefined): string | undefined {
  if (!value) return value;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    // Để Prisma báo lỗi cấu hình, không ghi chuỗi kết nối chứa mật khẩu ra log.
    return value;
  }
  const isTransactionPooler =
    ["postgres:", "postgresql:"].includes(url.protocol) &&
    url.hostname.endsWith(".pooler.supabase.com") &&
    url.port === "6543";
  if (!isTransactionPooler) return value;

  // Thay thế cả giá trị false/trùng lặp, giữ nguyên các tham số SSL và schema.
  url.searchParams.set("pgbouncer", "true");
  return url.toString();
}
