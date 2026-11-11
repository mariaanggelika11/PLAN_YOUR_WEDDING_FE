import type { AppLocale } from "./locale";
import type { AppMessages } from "./catalog";

export async function loadLocaleMessages(locale: AppLocale): Promise<AppMessages> {
  if (locale === "en") {
    const [base, validation, errors] = await Promise.all([
      import("./messages/en.json"),
      import("./messages/validation.en.json"),
      import("./messages/errors.en.json"),
    ]);
    return { ...base.default, ...validation.default, ...errors.default };
  }
  const [base, validation, errors] = await Promise.all([
    import("./messages/id.json"),
    import("./messages/validation.id.json"),
    import("./messages/errors.id.json"),
  ]);
  return { ...base.default, ...validation.default, ...errors.default };
}
