import assert from "node:assert/strict";
import test from "node:test";
import { getErrorMessage, translateValidationMessage } from "../src/shared/api/apiClient.ts";

test("pesan validasi backend diterjemahkan ke bahasa pengguna", () => {
  assert.equal(
    translateValidationMessage("price must be an integer number"),
    "Harga harus berupa angka bulat.",
  );
  assert.equal(translateValidationMessage("price must not be less than 0"), "Harga minimal 0.");
});

test("pesan validasi yang sama tidak ditampilkan berulang", () => {
  assert.equal(
    getErrorMessage({ message: ["name should not be empty", "name should not be empty"] }),
    "Nama produk wajib diisi.",
  );
});
