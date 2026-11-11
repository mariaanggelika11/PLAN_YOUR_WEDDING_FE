import { createPlan, type WeddingTask } from "./model.ts";
import { translateInterfaceText, type AppLocale } from "../../shared/i18n/translate.ts";

const templates = createPlan({
  date: "",
  event: "",
  guests: 0,
  budget: 0,
  location: "",
  traditional: true,
  outdoor: true,
  useWo: true,
}).tasks;

/** Only recognized built-in template copy is localized; edited titles and user notes stay intact. */
export function planningTaskText(task: WeddingTask, text: string, locale: AppLocale) {
  const template = templates.find(
    (entry) => entry.category === task.category && entry.guide === task.guide,
  );
  if (!template) return text;
  const predefined =
    text === template.title ||
    text === template.guide ||
    template.subtasks.some((entry) => entry.title === text);
  return predefined ? translateInterfaceText(text, locale) : text;
}
