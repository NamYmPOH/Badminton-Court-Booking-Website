// Tạo SQL để chuyển catalogue hiện có sang database. Không kết nối DB, không đọc .env.
// node scripts/import-catalog.cjs <existing-admin-user-id> > import.sql
// Chỉ chạy một lần theo yêu cầu của chủ dự án; chạy lại không ghi đè sân đã sửa.
const fs = require("node:fs");
const ts = require("typescript");
const path = require("node:path");
require.extensions[".ts"] = (module, filename) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    filename,
  );
const { MOCK_VENUES } = require("../src/data/venues.data.ts");
const ownerId = process.argv[2];
if (!ownerId || !/^[a-zA-Z0-9_-]{1,100}$/.test(ownerId))
  throw new Error("Cần ID tài khoản quản trị hiện có.");
const quote = (value) => "'" + String(value).replace(/'/g, "''") + "'";
const array = (values) => `ARRAY[${values.map(quote).join(",")}]::text[]`;
const statements = [
  "BEGIN;",
  `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM "User" WHERE id=${quote(ownerId)} AND role='ADMIN' AND status='ACTIVE') THEN RAISE EXCEPTION 'Active admin required'; END IF; END $$;`,
];
const usedSlugs = new Set();
for (const source of MOCK_VENUES) {
  const v = {
    ...source,
    slug: usedSlugs.has(source.slug)
      ? `${source.slug}-${source.id}`
      : source.slug,
  };
  usedSlugs.add(v.slug);
  // Đánh giá mẫu không phải đánh giá thực: rating bắt đầu từ 0 theo mặc định DB.
  const columns = [
    "id",
    "slug",
    "name",
    "description",
    "address",
    "district",
    "province",
    "lat",
    "lng",
    "phone",
    "images",
    "amenities",
    "openMin",
    "closeMin",
    "cancelBeforeHours",
    "paymentMode",
    "status",
    "priceFrom",
    "ownerId",
    "updatedAt",
  ];
  const values = [
    quote(v.id),
    quote(v.slug),
    quote(v.name),
    quote(v.description),
    quote(v.address),
    quote(v.district),
    quote(v.city),
    v.lat,
    v.lng,
    "''",
    array(v.images),
    array(v.amenities),
    v.openMin,
    v.closeMin,
    v.cancelBeforeHours,
    quote(v.paymentMode === "AT_VENUE" ? "AT_VENUE" : "ONLINE_FULL"),
    "'ACTIVE'",
    v.priceFrom,
    quote(ownerId),
    "CURRENT_TIMESTAMP",
  ];
  statements.push(
    `INSERT INTO "Venue" (${columns.map((c) => '"' + c + '"').join(",")}) VALUES (${values.join(",")}) ON CONFLICT DO NOTHING;`,
  );
  // Chỉ nhập court/pricing khi id và slug đều thuộc cơ sở này; không gắn vào cơ sở khác.
  for (const [i, c] of v.courts.entries())
    statements.push(
      `INSERT INTO "Court" (id,"venueId",name,"sortOrder",surface,status) SELECT ${quote(c.id)},id,${quote(c.name)},${i},${quote(c.surface)},${quote(c.isActive ? "ACTIVE" : "INACTIVE")}::"CourtStatus" FROM "Venue" WHERE id=${quote(v.id)} AND slug=${quote(v.slug)} ON CONFLICT DO NOTHING;`,
    );
  for (const p of v.pricingRules)
    statements.push(
      `INSERT INTO "PricingRule" (id,"venueId","daysOfWeek","startMin","endMin","walkInPrice","fixedPrice") SELECT ${quote(p.id)},id,ARRAY[${p.daysOfWeek.join(",")}],${p.startMin},${p.endMin},${p.walkInPrice},${p.fixedPrice} FROM "Venue" WHERE id=${quote(v.id)} AND slug=${quote(v.slug)} ON CONFLICT DO NOTHING;`,
    );
}
statements.push(
  `INSERT INTO "AdminAudit" (id,"actorId","actorName",action,"entityId",reason,details) SELECT 'catalog-import-v2',id,name,'IMPORT_CATALOG','catalog-v2','Nhập đầy đủ catalogue, tách slug trùng; số lượng thực tế theo nguồn.', '{"source":"src/data/venues.data.ts","requestedVenues":${MOCK_VENUES.length},"sampleReviewsImported":false}'::jsonb FROM "User" WHERE id=${quote(ownerId)} ON CONFLICT DO NOTHING;`,
  "COMMIT;",
);
const sql = statements.join("\n");
if (process.argv[3])
  fs.writeFileSync(path.resolve(process.argv[3]), sql, "utf8");
else process.stdout.write(sql);
