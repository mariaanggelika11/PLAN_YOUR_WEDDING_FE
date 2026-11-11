import { planningCopy } from "./planning.generated.ts";
export function planningText(
  task: { category: string; guide: string | null },
  text: string,
  locale: "id" | "en",
) {
  if (locale !== "en") return text;
  const template = planningCopy.find(
    (entry) => entry.category === task.category && entry.guide === task.guide,
  );
  return template && Object.hasOwn(template.copy, text) ? template.copy[text] : text;
}
