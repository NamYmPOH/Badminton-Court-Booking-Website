const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Tự động nạp .env.local nếu chưa có DATABASE_URL
if (!process.env.DATABASE_URL) {
  try {
    const envPath = path.join(__dirname, "../.env.local");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch {}
}

const Module = require("node:module");
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    request = path.join(__dirname, "../src", request.slice(2));
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require.extensions[".ts"] = function (module, filename) {
  const content = fs.readFileSync(filename, "utf8");
  const transpiled = ts.transpileModule(content, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      downlevelIteration: true,
    },
    fileName: filename,
  });
  module._compile(transpiled.outputText, filename);
};

const {
  normalizeVietnamese,
  levenshteinDistance,
  calculateMatchScore,
} = require("../src/lib/utils/search-ranker.ts");

const { searchVenueSuggestions } = require("../src/services/venue.service.ts");

test("Search Ranker - Chuẩn hóa tiếng Việt (normalizeVietnamese)", () => {
  assert.equal(normalizeVietnamese("Thanh Xuân"), "thanh xuan");
  assert.equal(normalizeVietnamese("Cầu Giấy"), "cau giay");
  assert.equal(normalizeVietnamese("Đống Đa"), "dong da");
  assert.equal(normalizeVietnamese("   Quận   ĐỐNG   ĐA  "), "quan dong da");
  assert.equal(normalizeVietnamese("Đà Nẵng - Điện Biên"), "da nang - dien bien");
  assert.equal(normalizeVietnamese(""), "");
});

test("Search Ranker - Khoảng cách Levenshtein", () => {
  assert.equal(levenshteinDistance("thanh xuan", "thanh xuan"), 0);
  assert.equal(levenshteinDistance("thanh xuan", "thanh xua"), 1); // Thiếu 1 chữ n
  assert.equal(levenshteinDistance("cau giay", "cau giya"), 2); // Đổi chỗ 2 chữ
  assert.equal(levenshteinDistance("badminton", "badminton"), 0);
  assert.equal(levenshteinDistance("abc", ""), 3);
});

test("Search Ranker - Xếp hạng thứ bậc điểm (calculateMatchScore)", () => {
  // 1. Khớp chính xác (Exact match)
  const exact = calculateMatchScore("Thanh Xuân", "thanh xuan");
  assert.equal(exact.matched, true);
  assert.equal(exact.matchType, "exact");
  assert.ok(exact.score >= 1000, "Exact match phải có điểm >= 1000");

  // 2. Khớp tiền tố (Prefix match)
  const prefix = calculateMatchScore("Thanh Xuân Arena", "thanh xuan");
  assert.equal(prefix.matched, true);
  assert.equal(prefix.matchType, "prefix");
  assert.ok(prefix.score >= 800, "Prefix match phải có điểm >= 800");

  // Gõ một phần từ đầu ("thanh xua" là prefix của "thanh xuan")
  const prefixPartial = calculateMatchScore("Thanh Xuân", "thanh xua");
  assert.equal(prefixPartial.matched, true);
  assert.equal(prefixPartial.matchType, "prefix");

  // 3. Khớp ranh giới từ (Word boundary)
  const wordBoundary = calculateMatchScore("Sân Cầu Lông Thanh Xuân", "thanh xuan");
  assert.equal(wordBoundary.matched, true);
  assert.ok(wordBoundary.score >= 600, "Word boundary match phải có điểm >= 600");

  // 4. Khớp chứa chuỗi con (Substring)
  const substring = calculateMatchScore("Câu lạc bộ ThanhXuân Sports", "thanhxuan");
  assert.equal(substring.matched, true);

  // 5. Khớp gần đúng sai 1-2 ký tự (Fuzzy match)
  // Ví dụ "cau giay" gõ sai thành "cau giya" (đổi vị trí 2 chữ cái)
  const fuzzy1 = calculateMatchScore("Cầu Giấy", "cau giya");
  assert.equal(fuzzy1.matched, true);
  assert.equal(fuzzy1.matchType, "fuzzy");
  assert.ok(fuzzy1.score >= 250, "Fuzzy match sai 1-2 ký tự phải được chấp nhận");

  // 6. Chuỗi không liên quan -> rejected
  const irrelevant = calculateMatchScore("Cầu Giấy", "thanh xuan");
  assert.equal(irrelevant.matched, false);
  assert.equal(irrelevant.score, 0);
});

test("searchVenueSuggestions - Ưu tiên khu vực vs sân", async () => {
  // 1. Ô HeroSearch: priority = "district", từ khóa "thanh xuan"
  const districtHeroResults = await searchVenueSuggestions("thanh xuan", 6, "district");
  assert.ok(districtHeroResults.length > 0, "Phải trả về ít nhất 1 kết quả");
  
  // Mục đầu tiên phải là Khu vực Thanh Xuân
  const firstItem = districtHeroResults[0];
  assert.equal(firstItem.type, "district", "Khi priority=district, item đầu tiên phải là district");
  assert.ok(
    normalizeVietnamese(firstItem.name).includes("thanh xuan"),
    "Tên khu vực đầu tiên phải là Thanh Xuân"
  );

  // 2. Ô NavbarSearch: priority = "venue", từ khóa "thanh xuan"
  const venueNavbarResults = await searchVenueSuggestions("thanh xuan", 6, "venue");
  assert.ok(venueNavbarResults.length > 0, "Phải trả về ít nhất 1 kết quả");
  
  // Với priority="venue", các sân có tên khớp với từ khóa phải được ưu tiên đứng trước khu vực
  const hasVenue = venueNavbarResults.some((item) => item.type === "venue");
  if (hasVenue) {
    const firstVenueIndex = venueNavbarResults.findIndex((item) => item.type === "venue");
    const firstDistrictIndex = venueNavbarResults.findIndex((item) => item.type === "district");
    if (firstDistrictIndex !== -1 && firstVenueIndex !== -1) {
      assert.ok(
        firstVenueIndex <= firstDistrictIndex,
        "Khi priority=venue, sân phù hợp phải xếp trước hoặc bằng khu vực"
      );
    }
  }

  // 3. Từ khóa sai chính tả nhẹ: "thanh xua" (thiếu n)
  const typoResults = await searchVenueSuggestions("thanh xua", 6, "district");
  assert.ok(typoResults.length > 0, "Sai chính tả nhẹ 1 ký tự vẫn phải tìm ra kết quả");
  assert.ok(
    typoResults.some(
      (r) =>
        normalizeVietnamese(r.name).includes("thanh xuan") ||
        normalizeVietnamese(r.district || "").includes("thanh xuan")
    ),
    "Kết quả gợi ý phải chứa Thanh Xuân"
  );

  // 4. Từ khóa Cầu Giấy không dấu: "cau giay"
  const cauGiayResults = await searchVenueSuggestions("cau giay", 6, "district");
  assert.ok(cauGiayResults.length > 0, "cau giay phải có kết quả");
  assert.equal(
    cauGiayResults[0].type,
    "district",
    "cau giay với priority=district phải ưu tiên khu vực Cầu Giấy"
  );
  assert.ok(
    normalizeVietnamese(cauGiayResults[0].name).includes("cau giay"),
    "Mục đầu tiên phải là Khu vực Cầu Giấy"
  );

  // 5. Từ khóa có dấu tiếng Việt chuẩn: "Đống Đa"
  const dongDaResults = await searchVenueSuggestions("Đống Đa", 6, "district");
  assert.ok(dongDaResults.length > 0, "Đống Đa phải có kết quả");
  assert.ok(
    dongDaResults.some((r) => normalizeVietnamese(r.district || r.name).includes("dong da")),
    "Gợi ý Đống Đa phải chứa khu vực Đống Đa"
  );

  // 6. Từ khóa có khoảng trắng thừa: "   cầu     giấy   "
  const extraSpacesResults = await searchVenueSuggestions("   cầu     giấy   ", 6, "district");
  assert.ok(extraSpacesResults.length > 0, "Khoảng trắng thừa phải được xử lý tốt");
  assert.equal(extraSpacesResults[0].type, "district");

  // 7. Từ khóa không liên quan: "xyz999foobar" -> phải trả về mảng rỗng
  const emptyResults = await searchVenueSuggestions("xyz999foobar", 6, "district");
  assert.equal(emptyResults.length, 0, "Không được trả kết quả rác cho từ khóa không liên quan");
});
