import id from "./messages/id.json" with { type: "json" };
import en from "./messages/en.json" with { type: "json" };

import validationId from "./messages/validation.id.json" with { type: "json" };
import validationEn from "./messages/validation.en.json" with { type: "json" };
import errorsId from "./messages/errors.id.json" with { type: "json" };
import errorsEn from "./messages/errors.en.json" with { type: "json" };

export const messages = {
  id: { ...id, ...validationId, ...errorsId },
  en: { ...en, ...validationEn, ...errorsEn },
};
export type AppMessages = typeof messages.id;

type MessageKeys<T> = {
  [Key in keyof T & string]: T[Key] extends string ? Key : `${Key}.${MessageKeys<T[Key]>}`;
}[keyof T & string];

export type TranslationKey = MessageKeys<AppMessages>;
