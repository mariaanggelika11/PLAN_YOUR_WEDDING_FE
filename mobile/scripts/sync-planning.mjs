import { writeFileSync } from "node:fs";
import { createPlan } from "../../src/features/planning/model.ts";
import { translateInterfaceText } from "../../src/shared/i18n/translate.ts";
const tasks = createPlan({
  date: "",
  event: "",
  guests: 0,
  budget: 0,
  location: "",
  traditional: true,
  outdoor: true,
  useWo: true,
}).tasks;
const entries = tasks.map((task) => ({
  category: task.category,
  guide: task.guide,
  copy: Object.fromEntries(
    [task.title, task.guide, ...task.subtasks.map((subtask) => subtask.title)].map((text) => [
      text,
      translateInterfaceText(text, "en"),
    ]),
  ),
}));
const output = `// Generated from the web planning templates/catalog. Run npm run sync:planning.\nexport const planningCopy: { category: string; guide: string; copy: Record<string, string> }[] = ${JSON.stringify(entries, null, 2)};\n`;
writeFileSync(new URL("../src/i18n/planning.generated.ts", import.meta.url), output);
