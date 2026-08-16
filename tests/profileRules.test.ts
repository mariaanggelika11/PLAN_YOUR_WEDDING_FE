import assert from "node:assert/strict";
import test from "node:test";
import {
  canVendorSell,
  eventTypeApiValue,
  serializeCategoryValues,
  vendorDisplayStatus,
} from "../src/domain/profileRules.ts";
import { formatThousands, parseFormattedInteger } from "../src/utils/number.ts";
import { PROFILE_IMAGE_TYPES, validateAttachment } from "../src/utils/attachmentValidation.ts";

const eventOptions = [
  { value: "1", label: "Akad" },
  { value: "2", label: "Resepsi" },
  { value: "3", label: "Akad dan Resepsi" },
  { value: "4", label: "Lamaran" },
];

test("eventType master parameter dipetakan ke enum API", () => {
  assert.equal(eventTypeApiValue("1", eventOptions), "AKAD");
  assert.equal(eventTypeApiValue("2", eventOptions), "RESEPSI");
  assert.equal(eventTypeApiValue("3", eventOptions), "AKAD_DAN_RESEPSI");
  assert.equal(eventTypeApiValue("4", eventOptions), "LAINNYA");
});

test("angka menggunakan titik hanya pada tampilan", () => {
  assert.equal(formatThousands("250000000"), "250.000.000");
  assert.equal(parseFormattedInteger("250.000.000"), "250000000");
});

test("kategori dikirim sebagai JSON bersih tanpa nilai kosong", () => {
  assert.equal(serializeCategoryValues(["1", " 2 ", ""]), '["1","2"]');
});

test("vendor verified aktif dapat menjual tanpa verifikasi ulang", () => {
  assert.equal(canVendorSell({ active: true, isVerified: true, status: 3 }), true);
  assert.equal(
    vendorDisplayStatus({ active: true, isVerified: true, status: 3 }),
    "VERIFIED_ACTIVE",
  );
  assert.equal(canVendorSell({ active: true, isVerified: false, status: 2 }), false);
  assert.equal(canVendorSell({ active: false, isVerified: true, status: 3 }), false);
  assert.equal(canVendorSell({ active: true, isVerified: true, status: 5 }), false);
});

test("validasi attachment menolak format dan ukuran yang tidak valid", () => {
  const invalidFormat = new File(["content"], "logo.gif", { type: "image/gif" });
  assert.equal(
    validateAttachment(invalidFormat, {
      allowedTypes: PROFILE_IMAGE_TYPES,
      formatMessage: "FORMAT_INVALID",
      sizeMessage: "SIZE_INVALID",
    }),
    "FORMAT_INVALID",
  );

  const oversized = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "logo.png", {
    type: "image/png",
  });
  assert.equal(
    validateAttachment(oversized, {
      allowedTypes: PROFILE_IMAGE_TYPES,
      formatMessage: "FORMAT_INVALID",
      sizeMessage: "SIZE_INVALID",
    }),
    "SIZE_INVALID",
  );
});
