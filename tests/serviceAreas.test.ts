import test from "node:test";
import assert from "node:assert/strict";
import {
  parseServiceAreas,
  serializeServiceAreas,
  marketplaceLocations,
} from "../src/features/locations/serviceAreas.ts";

test("legacy coverage is preserved without inventing geographical membership", () => {
  assert.deepEqual(parseServiceAreas("Jabodetabek"), ["Jabodetabek"]);
  assert.deepEqual(parseServiceAreas(null), []);
  assert.deepEqual(parseServiceAreas(" Bandung, CIMAHI; Bandung\n cimahi "), ["Bandung", "CIMAHI"]);
});

test("multi-city coverage roundtrips through the API string contract", () => {
  const areas = ["Kota Bandung", "Kabupaten Bandung", "Kota Jakarta Selatan"];
  assert.deepEqual(parseServiceAreas(serializeServiceAreas(areas)), areas);
  assert.equal(serializeServiceAreas([]), "");
});

test("marketplace turns compound coverage into unique searchable server substrings", () => {
  assert.deepEqual(marketplaceLocations(["Bandung, Cimahi", "bandung", "Jabodetabek", ""]), [
    "Bandung",
    "Cimahi",
    "Jabodetabek",
  ]);
});
