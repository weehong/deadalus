// From apps/backend: node --env-file=.env --import tsx ../../.scratch/projects/verification/check-upload-contract.mjs
// Read-only: exercises the actual Express OpenAPI endpoint and locale files.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { createApp } from "../../../apps/backend/src/app.ts";

const require = createRequire(
  new URL("../../../apps/backend/package.json", import.meta.url),
);
const request = require("supertest");
const response = await request(createApp()).get("/openapi.json");
assert.equal(response.status, 200);
const paths = response.body.paths;
const parse = paths["/api/v1/projects/{id}/unit-matrix/parse"].post;
const commit = paths["/api/v1/projects/{id}/structure"].post;
for (const operation of [parse, commit]) {
  assert.deepEqual(operation.security, [{ bearerAuth: [] }]);
  assert.equal(operation.requestBody.required, true);
  assert(
    operation.parameters.some(
      (parameter) =>
        parameter.name === "id" &&
        parameter.in === "path" &&
        parameter.required,
    ),
  );
  for (const status of ["400", "401", "404"])
    assert(operation.responses[status]);
}
const upload = parse.requestBody.content["multipart/form-data"].schema;
assert(upload.required.includes("file"));
assert.equal(upload.properties.file.format, "binary");
const block =
  parse.responses["200"].content["application/json"].schema.properties.data
    .properties.sheets.items.properties.blocks.items;
assert(block.properties.stacks.items);
assert(block.properties.storeys.items.properties.cells.items);
assert.deepEqual(block.properties.warnings.items.properties.code.enum, [
  "EMPTY_STOREY",
  "DUPLICATE_STOREY",
  "NON_CONSECUTIVE_STACKS",
  "INFERRED_STACKS",
  "EMPTY_BLOCK",
]);
assert(
  block.properties.warnings.items.properties.label.description.includes(
    "Original workbook Storey label",
  ),
);
const body = commit.requestBody.content["application/json"].schema;
assert.equal(body.properties.blocks.minItems, 1);
assert.equal(body.properties.blocks.maxItems, 50);
const unit =
  body.properties.blocks.items.properties.storeys.items.properties.units.items;
assert.equal(unit.properties.name.maxLength, 60);
assert.equal(unit.properties.unitTypeCode.maxLength, 40);
assert(commit.responses["409"].description.includes("PROJECT_HAS_BLOCKS"));
assert(
  commit.responses["201"].content["application/json"].schema.properties.data,
);

const locales = await Promise.all(
  ["en-US", "zh-CN"].map(async (locale) =>
    JSON.parse(
      await readFile(
        new URL(
          `../../../apps/frontend/src/assets/locales/${locale}/translations.json`,
          import.meta.url,
        ),
        "utf8",
      ),
    ),
  ),
);
function flatten(value, prefix = "", leaves = {}) {
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "object" && entry !== null)
      flatten(entry, `${prefix}${key}.`, leaves);
    else leaves[`${prefix}${key}`] = entry;
  }
  return leaves;
}
const [en, zh] = locales.map((locale) => flatten(locale.projects.upload));
assert.deepEqual(Object.keys(zh).sort(), Object.keys(en).sort());
for (const key of Object.keys(en)) {
  assert.equal(typeof zh[key], "string");
  assert(zh[key].length > 0);
  const placeholders = (text) =>
    [...text.matchAll(/\{\{([^}]+)\}\}/g)].map((match) => match[1]).sort();
  assert.deepEqual(placeholders(zh[key]), placeholders(en[key]), key);
}
assert.match(locales[1]._comment, /Machine-translated.*flagged for review/);
console.log(
  JSON.stringify({
    openapi: "parse and commit schemas verified through HTTP",
    translatedUploadKeys: Object.keys(en).length,
    placeholders: "match",
    nativeReviewFlag: true,
  }),
);
