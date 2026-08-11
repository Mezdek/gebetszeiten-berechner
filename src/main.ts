import "./style.css";
import type {
  AppConfig,
  AsrMethod,
  MetaFields,
  MinuteOffsets,
  PrayerName,
} from "./types.ts";
import { PRAYER_NAMES } from "./types.ts";
import {
  DEFAULT_ASR_METHOD,
  DEFAULT_ELEVATION_M,
  ROUNDING_DIRECTIONS,
} from "./constants.ts";
import { isRtl, translate, type Language } from "./i18n/index.ts";
import type { MessageKey } from "./i18n/messages.ts";
import { loadConfig, saveConfig } from "./storage/config.ts";
import {
  loadLanguagePreference,
  saveLanguagePreference,
} from "./storage/languagePreference.ts";
import {
  InvalidConfigFileError,
  parseImportedConfig,
  serializeConfigForExport,
} from "./storage/exportImport.ts";
import { downloadJsonFile, DownloadCancelledError } from "./output/download.ts";
import {
  generateAndDownload,
  OutputValidationError,
} from "./output/generate.ts";
import {
  decimalToDmsLatitude,
  decimalToDmsLongitude,
  dmsToDecimal,
} from "./core/coordinates.ts";
import {
  validateDepressionAngle,
  validateDmsDegrees,
  validateDmsMinutesOrSeconds,
  validateElevation,
  validateGenerator,
  validateHijriOffset,
  validateLatitude,
  validateLongitude,
  validateMetaKey,
  validateMinuteOffset,
  validateTimezone,
  validateYear,
  type FieldValidation,
} from "./validation.ts";

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el as T;
}

const form = byId<HTMLFormElement>("config-form");
const statusBanner = byId<HTMLDivElement>("status-banner");
const resultBanner = byId<HTMLDivElement>("result-banner");
const latitudeDegreesInput = byId<HTMLInputElement>("latitude-degrees");
const latitudeMinutesInput = byId<HTMLInputElement>("latitude-minutes");
const latitudeSecondsInput = byId<HTMLInputElement>("latitude-seconds");
const latitudeDirectionSelect = byId<HTMLSelectElement>("latitude-direction");
const longitudeDegreesInput = byId<HTMLInputElement>("longitude-degrees");
const longitudeMinutesInput = byId<HTMLInputElement>("longitude-minutes");
const longitudeSecondsInput = byId<HTMLInputElement>("longitude-seconds");
const longitudeDirectionSelect = byId<HTMLSelectElement>("longitude-direction");
const elevationInput = byId<HTMLInputElement>("elevation");
const timezoneInput = byId<HTMLInputElement>("timezone");
const fajrAngleInput = byId<HTMLInputElement>("fajr-angle");
const ishaAngleInput = byId<HTMLInputElement>("isha-angle");
const hijriOffsetInput = byId<HTMLInputElement>("hijri-offset");
const yearInput = byId<HTMLInputElement>("year");
const generatorInput = byId<HTMLInputElement>("generator");
const validateSchemaInput = byId<HTMLInputElement>("validate-schema");
const roundingTableBody = byId<HTMLDivElement>("rounding-table-body");
const metaFieldsList = byId<HTMLDivElement>("meta-fields-list");
const addMetaFieldBtn = byId<HTMLButtonElement>("add-meta-field-btn");
const exportBtn = byId<HTMLButtonElement>("export-btn");
const importBtn = byId<HTMLButtonElement>("import-btn");
const importFile = byId<HTMLInputElement>("import-file");
const langSelect = byId<HTMLSelectElement>("lang-select");
const aboutBtn = byId<HTMLButtonElement>("about-btn");
const aboutDialog = byId<HTMLDialogElement>("about-dialog");
const aboutCloseBtn = byId<HTMLButtonElement>("about-close-btn");

let currentLanguage: Language = "de";

// --- Theme toggle ---
const themeToggle = document.getElementById(
  "theme-toggle",
) as HTMLButtonElement | null;
const htmlElement = document.documentElement;

// Check for saved theme preference
const savedTheme = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

if (savedTheme) {
  htmlElement.setAttribute("data-theme", savedTheme);
} else if (prefersDark) {
  htmlElement.setAttribute("data-theme", "dark");
}

// Toggle theme
themeToggle?.addEventListener("click", () => {
  const currentTheme = htmlElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  htmlElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
});

const minuteOffsetInputs: Partial<Record<PrayerName, HTMLInputElement>> = {};

interface StatusBannerSpec {
  key: MessageKey;
  kind: "info" | "error";
  vars?: Record<string, string>;
}
interface ResultBannerSpec {
  key: MessageKey;
  kind: "info" | "error";
  vars?: Record<string, string>;
  introKey?: MessageKey;
  extraLines?: string[];
}
let currentStatusBanner: StatusBannerSpec | null = null;
let currentResultBanner: ResultBannerSpec | null = null;

// --- i18n -------------------------------------------------------------

function applyTranslations(): void {
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = isRtl(currentLanguage) ? "rtl" : "ltr";

  for (const el of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
    const key = el.dataset.i18n as MessageKey;
    el.textContent = translate(currentLanguage, key);
  }

  for (const el of document.querySelectorAll<HTMLElement>(
    "[data-i18n-aria-label]",
  )) {
    const key = el.dataset.i18nAriaLabel as MessageKey;
    el.setAttribute("aria-label", translate(currentLanguage, key));
  }

  langSelect.value = currentLanguage;

  renderRoundingTable();
  retranslateMetaFieldRows();
  renderStatusBanner();
  renderResultBanner();
}

/** Sets the active language. `persist` is false when restoring a stored/loaded language, true for an explicit operator choice. */
function setLanguage(language: Language, persist: boolean): void {
  currentLanguage = language;
  if (persist) saveLanguagePreference(language);
  applyTranslations();
}

langSelect.addEventListener("change", () => {
  const value = langSelect.value === "ar" ? "ar" : "de";
  setLanguage(value, true);
});

// --- rounding table (minute offsets, rounding direction shown per prayer) --

function renderRoundingTable(): void {
  const previousValues: Partial<Record<PrayerName, string>> = {};
  for (const prayer of PRAYER_NAMES) {
    const existing = minuteOffsetInputs[prayer];
    if (existing) previousValues[prayer] = existing.value;
  }

  roundingTableBody.replaceChildren();
  for (const prayer of PRAYER_NAMES) {
    const direction = ROUNDING_DIRECTIONS[prayer];
    const row = document.createElement("div");
    row.className = "rounding-row";
    row.setAttribute("role", "row");

    const nameCell = document.createElement("div");
    nameCell.className = "rounding-cell rounding-cell-name";
    nameCell.setAttribute("role", "cell");
    nameCell.textContent = translate(
      currentLanguage,
      `prayer${capitalize(prayer)}` as MessageKey,
    );
    row.appendChild(nameCell);

    const offsetCell = document.createElement("div");
    offsetCell.className = "rounding-cell rounding-cell-offset";
    offsetCell.setAttribute("role", "cell");
    const offsetLabel = document.createElement("span");
    offsetLabel.className = "rounding-offset-label";
    offsetLabel.textContent = translate(currentLanguage, "fieldMinuteOffset");
    const offsetInput = document.createElement("input");
    offsetInput.type = "number";
    offsetInput.step = "1";
    offsetInput.value = previousValues[prayer] ?? "0";
    offsetInput.setAttribute(
      "aria-label",
      translate(currentLanguage, "fieldMinuteOffset"),
    );
    offsetCell.append(offsetLabel, offsetInput);
    row.appendChild(offsetCell);
    minuteOffsetInputs[prayer] = offsetInput;

    const roundingCell = document.createElement("div");
    roundingCell.className = "rounding-cell rounding-cell-explanation";
    roundingCell.setAttribute("role", "cell");
    const directionSpan = document.createElement("span");
    directionSpan.className = "rounding-direction";
    directionSpan.textContent = direction === "down" ? "▼" : "▲";
    const explanationSpan = document.createElement("span");
    explanationSpan.className = "rounding-explanation";
    explanationSpan.textContent = translate(
      currentLanguage,
      direction === "down" ? "roundingDown" : "roundingUp",
    );
    roundingCell.appendChild(directionSpan);
    roundingCell.appendChild(explanationSpan);
    row.appendChild(roundingCell);

    roundingTableBody.appendChild(row);
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// --- meta fields (arbitrary operator key/value pairs) ------------------

function addMetaFieldRow(key = "", value = ""): void {
  const row = document.createElement("div");
  row.className = "meta-field-row";

  const keyInput = document.createElement("input");
  keyInput.type = "text";
  keyInput.value = key;
  keyInput.placeholder = translate(currentLanguage, "metaKeyPlaceholder");
  keyInput.dataset.role = "meta-key";

  const valueInput = document.createElement("input");
  valueInput.type = "text";
  valueInput.value = value;
  valueInput.placeholder = translate(currentLanguage, "metaValuePlaceholder");
  valueInput.dataset.role = "meta-value";

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.textContent = translate(currentLanguage, "removeMetaField");
  removeBtn.dataset.role = "meta-remove";
  removeBtn.addEventListener("click", () => row.remove());

  row.append(keyInput, valueInput, removeBtn);
  metaFieldsList.appendChild(row);
}

/** Re-applies current-language placeholders/labels to already-created meta field rows on language switch. */
function retranslateMetaFieldRows(): void {
  for (const row of metaFieldsList.querySelectorAll<HTMLDivElement>(
    ".meta-field-row",
  )) {
    const keyInput = row.querySelector<HTMLInputElement>(
      '[data-role="meta-key"]',
    );
    const valueInput = row.querySelector<HTMLInputElement>(
      '[data-role="meta-value"]',
    );
    const removeBtn = row.querySelector<HTMLButtonElement>(
      '[data-role="meta-remove"]',
    );
    if (keyInput)
      keyInput.placeholder = translate(currentLanguage, "metaKeyPlaceholder");
    if (valueInput)
      valueInput.placeholder = translate(
        currentLanguage,
        "metaValuePlaceholder",
      );
    if (removeBtn)
      removeBtn.textContent = translate(currentLanguage, "removeMetaField");
  }
}

addMetaFieldBtn.addEventListener("click", () => addMetaFieldRow());

function collectMetaFields(): { fields: MetaFields; error: boolean } {
  const fields: MetaFields = {};
  let error = false;
  for (const row of metaFieldsList.querySelectorAll<HTMLDivElement>(
    ".meta-field-row",
  )) {
    const keyInput = row.querySelector<HTMLInputElement>(
      '[data-role="meta-key"]',
    );
    const valueInput = row.querySelector<HTMLInputElement>(
      '[data-role="meta-value"]',
    );
    if (!keyInput || !valueInput) continue;
    const key = keyInput.value.trim();
    const value = valueInput.value;
    if (key.length === 0 && value.trim().length === 0) continue;
    if (!validateMetaKey(key).valid) {
      error = true;
      keyInput.classList.add("invalid");
      continue;
    }
    keyInput.classList.remove("invalid");
    fields[key] = value;
  }
  return { fields, error };
}

// --- field-level validation ---------------------------------------------

function showFieldError(
  input: HTMLInputElement,
  errorElId: string,
  result: FieldValidation,
): void {
  const errorEl = document.getElementById(errorElId);
  if (result.valid) {
    input.classList.remove("invalid");
    input.removeAttribute("aria-invalid");
    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = "";
    }
    return;
  }
  input.classList.add("invalid");
  input.setAttribute("aria-invalid", "true");
  if (errorEl && result.errorKey) {
    errorEl.hidden = false;
    errorEl.textContent = translate(currentLanguage, result.errorKey);
  }
}

interface LiveValidator {
  input: HTMLInputElement;
  errorId: string;
  validate: () => FieldValidation;
}

function wireLiveValidators(): LiveValidator[] {
  const validators: LiveValidator[] = [
    {
      input: elevationInput,
      errorId: "elevation-error",
      validate: () =>
        elevationInput.value.trim() === ""
          ? { valid: true }
          : validateElevation(Number(elevationInput.value)),
    },
    {
      input: timezoneInput,
      errorId: "timezone-error",
      validate: () => validateTimezone(timezoneInput.value),
    },
    {
      input: fajrAngleInput,
      errorId: "fajr-angle-error",
      validate: () => validateDepressionAngle(Number(fajrAngleInput.value)),
    },
    {
      input: ishaAngleInput,
      errorId: "isha-angle-error",
      validate: () => validateDepressionAngle(Number(ishaAngleInput.value)),
    },
    {
      input: hijriOffsetInput,
      errorId: "hijri-offset-error",
      validate: () => validateHijriOffset(Number(hijriOffsetInput.value)),
    },
    {
      input: yearInput,
      errorId: "year-error",
      validate: () => validateYear(Number(yearInput.value)),
    },
    {
      input: generatorInput,
      errorId: "generator-error",
      validate: () => validateGenerator(generatorInput.value),
    },
  ];

  for (const v of validators) {
    v.input.addEventListener("input", () =>
      showFieldError(v.input, v.errorId, v.validate()),
    );
    v.input.addEventListener("blur", () =>
      showFieldError(v.input, v.errorId, v.validate()),
    );
  }
  return validators;
}

const liveValidators = wireLiveValidators();

// --- coordinate groups (degrees/minutes/seconds + N/S/E/W) --------------

interface CoordinateGroupRefs {
  axis: "lat" | "lon";
  degrees: HTMLInputElement;
  minutes: HTMLInputElement;
  seconds: HTMLInputElement;
  direction: HTMLSelectElement;
  errorId: string;
}

const latitudeGroup: CoordinateGroupRefs = {
  axis: "lat",
  degrees: latitudeDegreesInput,
  minutes: latitudeMinutesInput,
  seconds: latitudeSecondsInput,
  direction: latitudeDirectionSelect,
  errorId: "latitude-error",
};
const longitudeGroup: CoordinateGroupRefs = {
  axis: "lon",
  degrees: longitudeDegreesInput,
  minutes: longitudeMinutesInput,
  seconds: longitudeSecondsInput,
  direction: longitudeDirectionSelect,
  errorId: "longitude-error",
};

function toggleInvalid(input: HTMLInputElement, valid: boolean): void {
  input.classList.toggle("invalid", !valid);
  if (valid) input.removeAttribute("aria-invalid");
  else input.setAttribute("aria-invalid", "true");
}

function coordinateGroupDecimal(refs: CoordinateGroupRefs): number {
  return dmsToDecimal({
    degrees: Number(refs.degrees.value),
    minutes: Number(refs.minutes.value),
    seconds: Number(refs.seconds.value),
    direction: refs.direction.value,
  });
}

function validateAndRenderCoordinateGroup(refs: CoordinateGroupRefs): boolean {
  const degResult = validateDmsDegrees(Number(refs.degrees.value), refs.axis);
  const minResult = validateDmsMinutesOrSeconds(Number(refs.minutes.value));
  const secResult = validateDmsMinutesOrSeconds(Number(refs.seconds.value));
  toggleInvalid(refs.degrees, degResult.valid);
  toggleInvalid(refs.minutes, minResult.valid);
  toggleInvalid(refs.seconds, secResult.valid);

  const errorEl = document.getElementById(refs.errorId);
  const partFailure = [degResult, minResult, secResult].find((r) => !r.valid);
  if (partFailure) {
    if (errorEl && partFailure.errorKey) {
      errorEl.hidden = false;
      errorEl.textContent = translate(currentLanguage, partFailure.errorKey);
    }
    return false;
  }

  const combined =
    refs.axis === "lat"
      ? validateLatitude(coordinateGroupDecimal(refs))
      : validateLongitude(coordinateGroupDecimal(refs));
  if (!combined.valid) {
    toggleInvalid(refs.degrees, false);
    if (errorEl && combined.errorKey) {
      errorEl.hidden = false;
      errorEl.textContent = translate(currentLanguage, combined.errorKey);
    }
    return false;
  }

  if (errorEl) {
    errorEl.hidden = true;
    errorEl.textContent = "";
  }
  return true;
}

for (const refs of [latitudeGroup, longitudeGroup]) {
  for (const el of [refs.degrees, refs.minutes, refs.seconds, refs.direction]) {
    el.addEventListener("input", () => validateAndRenderCoordinateGroup(refs));
    el.addEventListener("blur", () => validateAndRenderCoordinateGroup(refs));
    el.addEventListener("change", () => validateAndRenderCoordinateGroup(refs));
  }
}

// --- form <-> AppConfig -------------------------------------------------

function asrMethodFromForm(): AsrMethod {
  const checked = form.querySelector<HTMLInputElement>(
    'input[name="asrMethod"]:checked',
  );
  return checked?.value === "2" ? 2 : 1;
}

function minuteOffsetsFromForm(): MinuteOffsets {
  const offsets = {} as MinuteOffsets;
  for (const prayer of PRAYER_NAMES) {
    const input = minuteOffsetInputs[prayer];
    offsets[prayer] = input ? Number(input.value) || 0 : 0;
  }
  return offsets;
}

function readConfigFromForm(): AppConfig {
  const { fields } = collectMetaFields();
  return {
    location: {
      latitude: coordinateGroupDecimal(latitudeGroup),
      longitude: coordinateGroupDecimal(longitudeGroup),
      elevation:
        elevationInput.value.trim() === ""
          ? DEFAULT_ELEVATION_M
          : Number(elevationInput.value),
      timezone: timezoneInput.value.trim(),
    },
    calculation: {
      fajrAngle: Number(fajrAngleInput.value),
      ishaAngle: Number(ishaAngleInput.value),
      asrMethod: asrMethodFromForm(),
    },
    adjustments: {
      minuteOffsets: minuteOffsetsFromForm(),
      hijriOffsetDays: Number(hijriOffsetInput.value) || 0,
    },
    output: {
      year: Number(yearInput.value),
      generator: generatorInput.value.trim(),
      metaFields: fields,
      validateSchema: validateSchemaInput.checked,
    },
    language: currentLanguage,
  };
}

function applyConfigToForm(config: AppConfig): void {
  // Deliberately does not touch currentLanguage: the UI language is the
  // operator's own dropdown preference (see storage/languagePreference.ts),
  // independent of whichever language a loaded or imported config was saved
  // under. config.language is written on save for the exported file's own
  // record, not read back to drive the UI.

  const lat = decimalToDmsLatitude(config.location.latitude);
  latitudeDegreesInput.value = String(lat.degrees);
  latitudeMinutesInput.value = String(lat.minutes);
  latitudeSecondsInput.value = String(lat.seconds);
  latitudeDirectionSelect.value = lat.direction;

  const lon = decimalToDmsLongitude(config.location.longitude);
  longitudeDegreesInput.value = String(lon.degrees);
  longitudeMinutesInput.value = String(lon.minutes);
  longitudeSecondsInput.value = String(lon.seconds);
  longitudeDirectionSelect.value = lon.direction;

  elevationInput.value = String(config.location.elevation);
  timezoneInput.value = config.location.timezone;

  fajrAngleInput.value = String(config.calculation.fajrAngle);
  ishaAngleInput.value = String(config.calculation.ishaAngle);
  const radio = form.querySelector<HTMLInputElement>(
    `input[name="asrMethod"][value="${config.calculation.asrMethod}"]`,
  );
  if (radio) radio.checked = true;

  hijriOffsetInput.value = String(config.adjustments.hijriOffsetDays);
  for (const prayer of PRAYER_NAMES) {
    const input = minuteOffsetInputs[prayer];
    if (input) input.value = String(config.adjustments.minuteOffsets[prayer]);
  }

  yearInput.value = String(config.output.year);
  generatorInput.value = config.output.generator;
  validateSchemaInput.checked = config.output.validateSchema;

  metaFieldsList.replaceChildren();
  for (const [key, value] of Object.entries(config.output.metaFields)) {
    addMetaFieldRow(key, value);
  }
}

function defaultYear(): number {
  return new Date().getFullYear() + 1;
}

// --- startup: load persisted config -------------------------------------

function showStatusBanner(
  key: MessageKey,
  kind: "info" | "error",
  vars?: Record<string, string>,
): void {
  currentStatusBanner = vars ? { key, kind, vars } : { key, kind };
  renderStatusBanner();
}

function renderStatusBanner(): void {
  if (!currentStatusBanner) return;
  statusBanner.hidden = false;
  statusBanner.className = `banner ${currentStatusBanner.kind}`;
  statusBanner.textContent = translate(
    currentLanguage,
    currentStatusBanner.key,
    currentStatusBanner.vars,
  );
}

function initFromStorage(): void {
  const storedLanguage = loadLanguagePreference();
  if (storedLanguage) currentLanguage = storedLanguage;

  const result = loadConfig();
  if (result.status === "loaded") {
    applyConfigToForm(result.config);
    applyTranslations();
    showStatusBanner("configLoaded", "info");
  } else if (result.status === "recovered") {
    yearInput.value = String(defaultYear());
    addMetaFieldRow();
    applyTranslations();
    showStatusBanner("configRecovered", "error", {
      backupKey: result.backupKey,
    });
  } else {
    yearInput.value = String(defaultYear());
    addMetaFieldRow();
    applyTranslations();
    showStatusBanner("configNotFound", "info");
  }
}

// --- About dialog ---------------------------------------------------------

let aboutTrigger: HTMLElement | null = null;

aboutBtn.addEventListener("click", () => {
  aboutTrigger = aboutBtn;
  aboutDialog.showModal(); // native: moves focus into the dialog, Escape closes it
});

aboutCloseBtn.addEventListener("click", () => aboutDialog.close());

aboutDialog.addEventListener("click", (event) => {
  // Native <dialog> has no distinct backdrop element to target, so a click is
  // "outside" when its coordinates fall outside the dialog's own box.
  const rect = aboutDialog.getBoundingClientRect();
  const inside =
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom;
  if (!inside) aboutDialog.close();
});

aboutDialog.addEventListener("close", () => {
  aboutTrigger?.focus();
  aboutTrigger = null;
});

// --- export / import ------------------------------------------------------

exportBtn.addEventListener("click", () => {
  const config = readConfigFromForm();
  const contents = serializeConfigForExport(config);
  void downloadJsonFile("gebetszeiten-konfiguration.json", contents);
});

importBtn.addEventListener("click", () => importFile.click());

importFile.addEventListener("change", () => {
  const file = importFile.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = String(reader.result ?? "");
      const config = parseImportedConfig(text);
      applyConfigToForm(config);
      saveConfig(config);
      applyTranslations();
      showResultBanner("importSuccess", "info");
    } catch (err) {
      const key: MessageKey =
        err instanceof InvalidConfigFileError && err.message.includes("JSON")
          ? "importFailedParse"
          : "importFailedShape";
      showResultBanner(key, "error");
    } finally {
      importFile.value = "";
    }
  };
  reader.readAsText(file);
});

// --- generate ---------------------------------------------------------

function showResultBanner(
  key: MessageKey,
  kind: "info" | "error",
  options?: {
    vars?: Record<string, string>;
    introKey?: MessageKey;
    extraLines?: string[];
  },
): void {
  currentResultBanner = { key, kind, ...options };
  renderResultBanner();
}

function showResultBannerText(text: string, kind: "info" | "error"): void {
  // For messages that are not translatable (e.g. a raw JS Error.message);
  // shown as-is regardless of language.
  currentResultBanner = null;
  resultBanner.hidden = false;
  resultBanner.className = `banner ${kind}`;
  resultBanner.replaceChildren();
  const p = document.createElement("p");
  p.style.margin = "0";
  p.textContent = text;
  resultBanner.appendChild(p);
}

function renderResultBanner(): void {
  if (!currentResultBanner) return;
  const { key, kind, vars, introKey, extraLines } = currentResultBanner;
  resultBanner.hidden = false;
  resultBanner.className = `banner ${kind}`;
  resultBanner.replaceChildren();
  const p = document.createElement("p");
  p.style.margin = "0";
  p.textContent = introKey
    ? `${translate(currentLanguage, key, vars)} — ${translate(currentLanguage, introKey)}`
    : translate(currentLanguage, key, vars);
  resultBanner.appendChild(p);
  if (extraLines && extraLines.length > 0) {
    const ul = document.createElement("ul");
    for (const line of extraLines) {
      const li = document.createElement("li");
      li.textContent = line;
      ul.appendChild(li);
    }
    resultBanner.appendChild(ul);
  }
}

function runAllValidations(): boolean {
  let allValid = true;
  for (const v of liveValidators) {
    const result = v.validate();
    showFieldError(v.input, v.errorId, result);
    if (!result.valid) allValid = false;
  }
  if (!validateAndRenderCoordinateGroup(latitudeGroup)) allValid = false;
  if (!validateAndRenderCoordinateGroup(longitudeGroup)) allValid = false;
  for (const prayer of PRAYER_NAMES) {
    const input = minuteOffsetInputs[prayer];
    if (input && !validateMinuteOffset(Number(input.value)).valid) {
      input.classList.add("invalid");
      allValid = false;
    } else if (input) {
      input.classList.remove("invalid");
    }
  }
  const { error: metaError } = collectMetaFields();
  if (metaError) allValid = false;
  return allValid;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  void handleGenerate();
});

async function handleGenerate(): Promise<void> {
  if (!runAllValidations()) {
    showResultBanner("errorFixBeforeGenerate", "error");
    return;
  }

  const config = readConfigFromForm();
  saveConfig(config);

  const generateBtn = byId<HTMLButtonElement>("generate-btn");
  const originalLabel = generateBtn.textContent;
  generateBtn.disabled = true;
  generateBtn.textContent = translate(currentLanguage, "generating");

  try {
    const { filename } = await generateAndDownload(config);
    showResultBanner("generateSuccess", "info", { vars: { filename } });
  } catch (err) {
    if (err instanceof DownloadCancelledError) {
      showResultBanner("generateCancelled", "info");
    } else if (err instanceof OutputValidationError) {
      const lines = err.failures.map((f) => `${f.rule}: ${f.detail}`);
      showResultBanner("generateValidationFailedTitle", "error", {
        introKey: "generateValidationFailedIntro",
        extraLines: lines,
      });
    } else {
      showResultBannerText(
        err instanceof Error ? err.message : String(err),
        "error",
      );
    }
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = originalLabel;
  }
}

// --- default asr method (constant used only when nothing is loaded) ---
if (!form.querySelector<HTMLInputElement>('input[name="asrMethod"]:checked')) {
  const defaultRadio = form.querySelector<HTMLInputElement>(
    `input[name="asrMethod"][value="${DEFAULT_ASR_METHOD}"]`,
  );
  if (defaultRadio) defaultRadio.checked = true;
}

renderRoundingTable();
initFromStorage();
