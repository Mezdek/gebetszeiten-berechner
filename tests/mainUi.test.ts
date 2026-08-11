import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installJsdomPolyfills, importMainFresh, loadIndexHtmlBody } from './domTestUtils.ts';

const LANGUAGE_KEY = 'gebetszeiten-berechner:language';
const THEME_KEY = 'theme';

async function setup(): Promise<void> {
  localStorage.clear();
  vi.resetModules();
  loadIndexHtmlBody();
  installJsdomPolyfills();
  await importMainFresh();
}

describe('language dropdown', () => {
  beforeEach(setup);

  it('defaults to German/LTR with nothing stored', () => {
    expect(document.documentElement.getAttribute('lang')).toBe('de');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
  });

  it('selecting Arabic applies RTL immediately and persists the choice', () => {
    const select = document.getElementById('lang-select') as HTMLSelectElement;
    select.value = 'ar';
    select.dispatchEvent(new Event('change', { bubbles: true }));

    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(document.documentElement.getAttribute('lang')).toBe('ar');
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('ar');
  });

  it('restores the persisted language on the next load, independent of any saved config', async () => {
    const select = document.getElementById('lang-select') as HTMLSelectElement;
    select.value = 'ar';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('ar');

    // Simulate a fresh page load: reset the module graph and DOM, but keep localStorage.
    vi.resetModules();
    loadIndexHtmlBody();
    installJsdomPolyfills();
    await importMainFresh();

    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    const reloadedSelect = document.getElementById('lang-select') as HTMLSelectElement;
    expect(reloadedSelect.value).toBe('ar');
  });
});

describe('About dialog', () => {
  beforeEach(setup);

  it('is closed initially', () => {
    const dialog = document.getElementById('about-dialog') as HTMLDialogElement;
    expect(dialog.hasAttribute('open')).toBe(false);
  });

  it('opens and moves focus inside when the trigger is clicked', () => {
    const aboutBtn = document.getElementById('about-btn') as HTMLButtonElement;
    const dialog = document.getElementById('about-dialog') as HTMLDialogElement;
    const closeBtn = document.getElementById('about-close-btn') as HTMLButtonElement;

    aboutBtn.click();

    expect(dialog.hasAttribute('open')).toBe(true);
    expect(document.activeElement).toBe(closeBtn);
  });

  it('closes via the close button and returns focus to the trigger', () => {
    const aboutBtn = document.getElementById('about-btn') as HTMLButtonElement;
    const dialog = document.getElementById('about-dialog') as HTMLDialogElement;
    const closeBtn = document.getElementById('about-close-btn') as HTMLButtonElement;

    aboutBtn.click();
    expect(dialog.hasAttribute('open')).toBe(true);

    closeBtn.click();

    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(aboutBtn);
  });

  it('closes on a click outside the dialog box and returns focus to the trigger', () => {
    const aboutBtn = document.getElementById('about-btn') as HTMLButtonElement;
    const dialog = document.getElementById('about-dialog') as HTMLDialogElement;
    dialog.getBoundingClientRect = () => ({
      left: 100,
      top: 100,
      right: 400,
      bottom: 400,
      width: 300,
      height: 300,
      x: 100,
      y: 100,
      toJSON() {},
    });

    aboutBtn.click();
    expect(dialog.hasAttribute('open')).toBe(true);

    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 10, clientY: 10 }));

    expect(dialog.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(aboutBtn);
  });

  it('stays open on a click inside the dialog box', () => {
    const aboutBtn = document.getElementById('about-btn') as HTMLButtonElement;
    const dialog = document.getElementById('about-dialog') as HTMLDialogElement;
    dialog.getBoundingClientRect = () => ({
      left: 100,
      top: 100,
      right: 400,
      bottom: 400,
      width: 300,
      height: 300,
      x: 100,
      y: 100,
      toJSON() {},
    });

    aboutBtn.click();
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 200, clientY: 200 }));

    expect(dialog.hasAttribute('open')).toBe(true);
  });
});

describe('theme toggle', () => {
  beforeEach(setup);

  it('has no data-theme attribute with nothing stored and no dark system preference', () => {
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('toggling switches data-theme and persists the choice', () => {
    const toggle = document.getElementById('theme-toggle') as HTMLButtonElement;
    toggle.click();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');

    toggle.click();

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem(THEME_KEY)).toBe('light');
  });

  it('restores the persisted theme on the next load', async () => {
    const toggle = document.getElementById('theme-toggle') as HTMLButtonElement;
    toggle.click();
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');

    vi.resetModules();
    loadIndexHtmlBody();
    installJsdomPolyfills();
    await importMainFresh();

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
