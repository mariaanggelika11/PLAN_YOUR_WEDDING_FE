import assert from "node:assert/strict";
import test from "node:test";
import { messages } from "../src/shared/i18n/catalog.ts";
import { textKeys } from "../src/shared/i18n/textKeys.ts";
import { resolveLocale, isAppLocale } from "../src/shared/i18n/locale.ts";
import { createTranslator } from "next-intl";
import { translateInterfaceText } from "../src/shared/i18n/translate.ts";
import { formatCurrency } from "../src/shared/utils/formatCurrency.ts";
import { formatThousands, parseFormattedInteger } from "../src/shared/utils/number.ts";
import { formatDate } from "../src/shared/utils/formatDate.ts";
import { displayDate, dueLabel, dueGuidance } from "../src/features/planning/format.ts";
import { overdueMonthLabels } from "../src/features/planning/calendar.ts";
import { createPlan } from "../src/features/planning/model.ts";
import { paymentInstallmentLabel } from "../src/features/orders/rules.ts";
import { confirmationTimeLeft } from "../src/features/orders/completion.ts";

test("next-intl catalogs cover the same keys and every migrated message formats in both languages", () => {
  const errors: unknown[] = [];
  const translators = {
    id: createTranslator({
      locale: "id",
      messages: messages.id,
      onError: (error) => errors.push(error),
    }),
    en: createTranslator({
      locale: "en",
      messages: messages.en,
      onError: (error) => errors.push(error),
    }),
  };
  function paths(value: object, prefix = ""): string[] {
    return Object.entries(value).flatMap(([key, entry]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof entry === "string" ? [path] : paths(entry, path);
    });
  }
  assert.deepEqual(paths(messages.id).sort(), paths(messages.en).sort());
  for (const [text, key] of Object.entries(textKeys)) {
    assert.equal(translators.id.has(key), true, key);
    assert.equal(translators.en.has(key), true, key);
    const variables = Object.fromEntries(
      [...text.matchAll(/\{(\w+)\}/g)].map((match) => [match[1], match[0]]),
    );
    assert.equal(translators.id(key, variables), text, key);
    assert.equal(translateInterfaceText(text, "id"), text, key);
    assert.equal(translateInterfaceText(text, "en"), translators.en(key, variables), key);
  }
  assert.deepEqual(errors, []);
});

test("locale preferences accept only the supported language codes", () => {
  assert.equal(resolveLocale("en"), "en");
  assert.equal(resolveLocale("id"), "id");
  for (const value of [undefined, null, "fr", "EN", "__proto__", "en-US"]) {
    assert.equal(resolveLocale(value), "id");
    assert.equal(isAppLocale(value), false);
  }
});

test("interface translations switch both ways and preserve unknown user text", () => {
  assert.equal(translateInterfaceText("Masuk", "en"), "Sign in");
  assert.equal(translateInterfaceText("Masuk", "id"), "Masuk");
  const userText = "Our wedding: Rani & Budi <3 {custom}";
  assert.equal(translateInterfaceText(userText, "en"), userText);
  assert.equal(translateInterfaceText("constructor", "en"), "constructor");
  assert.equal(translateInterfaceText("__proto__", "en"), "__proto__");
  assert.equal(translateInterfaceText("Pesanan {0}", "en", { 0: "PYW-42" }), "Order PYW-42");
  assert.equal(translateInterfaceText("Pesanan {0}", "id", { 0: "PYW-42" }), "Pesanan PYW-42");
  assert.equal(
    translateInterfaceText("Pesanan {0}", "en", { 0: "$& {other}" }),
    "Order $& {other}",
  );
  assert.equal(translateInterfaceText("Pesanan {0}", "en"), "Order {0}");
});

test("locale changes presentation while keeping amounts in Indonesian rupiah", () => {
  const date = new Date(2026, 10, 10);
  assert.equal(formatDate(date, "id"), "10 November 2026");
  assert.equal(formatDate(date, "en"), "10 November 2026");
  assert.equal(displayDate("2026-08-17", "id"), "17 Agustus 2026");
  assert.equal(displayDate("2026-08-17", "en"), "17 August 2026");
  assert.match(formatCurrency(1250000, "id"), /1\.250\.000/);
  assert.match(formatCurrency(1250000, "en"), /IDR.*1,250,000/);
  assert.equal(displayDate("", "en"), "Date not set");
  assert.equal(formatThousands("1250000", "en"), "1,250,000");
  assert.equal(formatThousands("1250000", "id"), "1.250.000");
  assert.equal(parseFormattedInteger("1,250,000"), "1250000");
  assert.equal(parseFormattedInteger("1.250.000"), "1250000");
});

test("planning deadlines and month summaries follow the selected language without changing tasks", () => {
  const task = createPlan({
    date: "2026-12-01",
    event: "",
    guests: 50,
    budget: 0,
    location: "",
    traditional: false,
    outdoor: false,
    useWo: false,
  }).tasks[0];
  const overdue = { ...task, status: "TODO" as const, due: "2026-08-17" };
  const before = structuredClone(overdue);
  assert.equal(dueLabel(overdue, "2026-11-10", "en"), "Overdue · 17 August 2026");
  assert.equal(dueLabel({ ...overdue, due: "2026-11-10" }, "2026-11-10", "en"), "Due today");
  assert.equal(dueLabel({ ...overdue, due: "2026-11-12" }, "2026-11-10", "en"), "2 days left");
  assert.match(
    dueGuidance({ ...overdue, customDue: true }, "2026-12-01", "2026-11-10", "en"),
    /You set this deadline/,
  );
  assert.deepEqual(overdueMonthLabels([overdue], "en"), ["1 tasks from August 2026"]);
  assert.deepEqual(overdue, before);
});

test("payment stages and confirmation countdowns are bilingual", () => {
  assert.equal(paymentInstallmentLabel("DP", "en"), "Deposit");
  assert.equal(paymentInstallmentLabel("REMAINING", "en"), "Balance payment");
  assert.equal(paymentInstallmentLabel("FULL", "en"), "Full payment");
  assert.equal(paymentInstallmentLabel("DP"), "DP");
  assert.equal(confirmationTimeLeft(61_000, 0, "en"), "Time remaining: 2 minutes.");
  assert.equal(confirmationTimeLeft(0, 0, "en"), "The confirmation deadline has passed.");
});

test("translated interface labels never replace values submitted by native form controls", async () => {
  const { readdir, readFile } = await import("node:fs/promises");
  const { default: ts } = await import("typescript");
  async function inspect(directory: URL) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = new URL(entry.name, directory);
      if (entry.isDirectory()) {
        await inspect(new URL(`${entry.name}/`, directory));
      } else if (entry.name.endsWith(".tsx")) {
        const source = ts.createSourceFile(
          file.pathname,
          await readFile(file, "utf8"),
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TSX,
        );
        function visit(node: import("typescript").Node) {
          if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
            if (["input", "select", "option", "textarea"].includes(node.tagName.getText(source))) {
              for (const attribute of node.attributes.properties) {
                if (
                  ts.isJsxAttribute(attribute) &&
                  ["value", "defaultValue", "name"].includes(attribute.name.getText(source))
                ) {
                  assert.doesNotMatch(
                    attribute.initializer?.getText(source) ?? "",
                    /\b(?:translateText|translateInterfaceText)\(/,
                    `${file.pathname}: ${attribute.getText(source)}`,
                  );
                }
              }
            }
          }
          ts.forEachChild(node, visit);
        }
        visit(source);
      }
    }
  }
  await inspect(new URL("../src/", import.meta.url));
});

test("customer dashboard shortcuts have explicit translations in both languages", () => {
  const english = createTranslator({ locale: "en", messages: messages.en });
  const indonesian = createTranslator({ locale: "id", messages: messages.id });
  const keys = ["findVendors", "myOrders", "weddingPreparations", "viewBudget"] as const;
  assert.deepEqual(
    keys.map((key) => english(`customerDashboard.${key}`)),
    ["Find vendors", "My orders", "Wedding preparations", "View budget"],
  );
  assert.deepEqual(
    keys.map((key) => indonesian(`customerDashboard.${key}`)),
    ["Cari vendor", "Pesanan saya", "Persiapan pernikahan", "Lihat budget"],
  );
});

test("shared order details translate every label while retaining original Indonesian labels", () => {
  const labels = [
    ["Vendor", "Vendor"],
    ["Paket", "Package"],
    ["Tanggal acara", "Event date"],
    ["Lokasi", "Location"],
    ["Jumlah tamu", "Guest count"],
    ["Total", "Total"],
    ["Status pesanan", "Order status"],
    ["Pembayaran", "Payment"],
    ["Tanggal", "Date"],
    ["Catatan customer", "Customer notes"],
  ];
  for (const [indonesian, english] of labels) {
    assert.equal(translateInterfaceText(indonesian, "en"), english, indonesian);
    assert.equal(translateInterfaceText(indonesian, "id"), indonesian);
  }
});

test("API validation messages follow the selected locale and preserve validation meaning", async () => {
  const { translateValidationMessage } = await import("../src/shared/api/apiClient.ts");
  assert.equal(
    translateValidationMessage("price must be an integer number", "en"),
    "Price must be a whole number.",
  );
  assert.equal(
    translateValidationMessage("price must not be less than 0", "en"),
    "Price must be at least 0.",
  );
  assert.equal(
    translateValidationMessage("name should not be empty", "en"),
    "Product name is required.",
  );
  assert.equal(
    translateValidationMessage("unknown server message", "en"),
    "unknown server message",
  );
});

test("built-in planning copy is bilingual without changing saved tasks or custom notes", async () => {
  const { planningTaskText } = await import("../src/features/planning/taskCopy.ts");
  const task = createPlan({
    date: "2027-01-01",
    event: "",
    guests: 0,
    budget: 0,
    location: "",
    traditional: true,
    outdoor: true,
    useWo: true,
  }).tasks[0];
  const original = structuredClone(task);
  assert.equal(planningTaskText(task, task.title, "en"), "Agree on your concept and priorities");
  assert.equal(planningTaskText(task, task.title, "id"), task.title);
  assert.equal(
    planningTaskText(
      { ...task, title: "Rencana khusus keluarga" },
      "Rencana khusus keluarga",
      "en",
    ),
    "Rencana khusus keluarga",
  );
  assert.equal(planningTaskText({ ...task, guide: "Custom guide" }, task.title, "en"), task.title);
  assert.deepEqual(task, original);
});
