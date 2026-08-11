import indexHtml from '../index.html?raw';

/**
 * Loads the real index.html markup into the jsdom document, so DOM tests
 * exercise the actual form structure main.ts expects instead of a
 * hand-maintained copy that could drift out of sync.
 */
export function loadIndexHtmlBody(): void {
  const match = /<body>([\s\S]*)<\/body>/.exec(indexHtml);
  if (!match) throw new Error('Could not find <body> in index.html');
  document.body.innerHTML = match[1] as string;
  document.documentElement.setAttribute('lang', 'de');
  document.documentElement.setAttribute('dir', 'ltr');
}

/** jsdom implements neither matchMedia nor <dialog>'s showModal/close — both are used by main.ts. */
export function installJsdomPolyfills(): void {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }

  const proto = HTMLDialogElement.prototype as HTMLDialogElement & {
    showModal?: () => void;
    close?: () => void;
  };
  if (!proto.showModal) {
    proto.showModal = function (this: HTMLDialogElement) {
      this.setAttribute('open', '');
      const focusable = this.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      (focusable ?? this).focus();
    };
  }
  if (!proto.close) {
    proto.close = function (this: HTMLDialogElement) {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  }
}

/**
 * Imports main.ts so its top-level DOM-wiring code runs against the current
 * document. main.ts has no exports to call separately — call
 * `vi.resetModules()` beforehand (in the same test) if a previous test
 * already imported it, so the module's top-level side effects re-run
 * against a freshly reset DOM instead of reusing the cached instance.
 */
export async function importMainFresh(): Promise<void> {
  await import('../src/main.ts');
}
