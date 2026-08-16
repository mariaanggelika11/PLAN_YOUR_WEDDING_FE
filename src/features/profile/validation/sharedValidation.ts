export interface ProfileValidationError {
  step: number;
  message: string;
}

export function invalidPopulatedControl(form: HTMLFormElement) {
  return Array.from(
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      "input, select, textarea",
    ),
  ).find((control) => Boolean(control.value) && !control.checkValidity());
}

export function controlStep(control: HTMLElement) {
  return Number(control.closest<HTMLElement>("[data-profile-step]")?.dataset.profileStep ?? 0);
}

export function fieldLabel(control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
  return control.labels?.[0]?.textContent?.trim() || control.name;
}
