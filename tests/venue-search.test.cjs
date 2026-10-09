const test = require("node:test");
const assert = require("node:assert/strict");

// Helper so khớp tiếng Việt độc lập để kiểm thử logic
function normalizeVietnamese(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .trim();
}

function matchesVietnamese(source, keyword) {
  if (!keyword || !keyword.trim()) return true;
  if (!source) return false;
  const rawSource = source.toLowerCase();
  const rawKeyword = keyword.toLowerCase().trim();
  if (rawSource.includes(rawKeyword)) return true;
  return normalizeVietnamese(source).includes(normalizeVietnamese(keyword));
}

test("Tìm kiếm tiếng Việt: Chuẩn hóa không dấu và loại bỏ dấu thanh", () => {
  assert.equal(normalizeVietnamese("Cầu Giấy"), "cau giay");
  assert.equal(normalizeVietnamese("Thanh Xuân"), "thanh xuan");
  assert.equal(normalizeVietnamese("Đống Đa"), "dong da");
  assert.equal(normalizeVietnamese("Hà Đông"), "ha dong");
});

test("Tìm kiếm tiếng Việt: So khớp mờ giữa có dấu và không dấu", () => {
  assert.equal(matchesVietnamese("Sân Cầu Lông Thanh Xuân Xanh", "thanh xuan"), true);
  assert.equal(matchesVietnamese("Sân Cầu Lông Cầu Giấy VIP", "cau giay"), true);
  assert.equal(matchesVietnamese("Số 168 Khuất Duy Tiến, Thanh Xuân", "khuat duy tien"), true);
  assert.equal(matchesVietnamese("Sân Cầu Lông Ba Đình", "cau giay"), false);
});

test("Bộ lọc tìm kiếm: Lọc theo khoảng giá minPrice và maxPrice", () => {
  const venues = [
    { name: "Sân A", priceFrom: 50000 },
    { name: "Sân B", priceFrom: 90000 },
    { name: "Sân C", priceFrom: 150000 },
  ];

  const under80 = venues.filter((v) => v.priceFrom <= 80000);
  assert.equal(under80.length, 1);
  assert.equal(under80[0].name, "Sân A");

  const midPrice = venues.filter((v) => v.priceFrom >= 80000 && v.priceFrom <= 120000);
  assert.equal(midPrice.length, 1);
  assert.equal(midPrice[0].name, "Sân B");

  const highPrice = venues.filter((v) => v.priceFrom >= 120000);
  assert.equal(highPrice.length, 1);
  assert.equal(highPrice[0].name, "Sân C");
});

test("Bộ lọc tìm kiếm: Sắp xếp theo giá tăng dần và giảm dần", () => {
  const venues = [
    { name: "Sân B", priceFrom: 90000 },
    { name: "Sân A", priceFrom: 50000 },
    { name: "Sân C", priceFrom: 150000 },
  ];

  const asc = [...venues].sort((a, b) => a.priceFrom - b.priceFrom);
  assert.equal(asc[0].name, "Sân A");
  assert.equal(asc[2].name, "Sân C");

  const desc = [...venues].sort((a, b) => b.priceFrom - a.priceFrom);
  assert.equal(desc[0].name, "Sân C");
  assert.equal(desc[2].name, "Sân A");
});

test("Bộ lọc tìm kiếm: Lọc theo tình trạng còn sân tối nay", () => {
  const venues = [
    { name: "Sân 1", hasSlotTonight: true },
    { name: "Sân 2", hasSlotTonight: false },
  ];

  const availableTonight = venues.filter((v) => v.hasSlotTonight);
  assert.equal(availableTonight.length, 1);
  assert.equal(availableTonight[0].name, "Sân 1");
});
