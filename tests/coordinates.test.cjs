const fs = require("node:fs");
const ts = require("typescript");
const assert = require("node:assert/strict");
const { test } = require("node:test");
const source = ts.transpileModule(fs.readFileSync(require.resolve("../src/lib/coordinates.ts"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const compiled = { exports: {} };
new Function("exports", "module", source)(compiled.exports, compiled);
const { parseCoordinates } = compiled.exports;

test("Google Maps paste preserves latitude, longitude order and whitespace", () => {
  assert.deepEqual(parseCoordinates(" 21.009055, 105.802321\n"), { lat: 21.009055, lng: 105.802321 });
  assert.deepEqual(parseCoordinates("-90, +180"), { lat: -90, lng: 180 });
  assert.deepEqual(parseCoordinates("0,0"), { lat: 0, lng: 0 });
});

test("rejects incomplete, reversed Vietnam coordinates and out-of-range input", () => {
  for (const value of ["", ",", "21,", ",105", "21 105", "105.802321, 21.009055", "91,105", "21,-181", "NaN,105", "21,105,1", "21abc,105"]) {
    assert.equal(parseCoordinates(value), null, value);
  }
});
