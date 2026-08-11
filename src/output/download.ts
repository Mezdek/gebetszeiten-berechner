interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
}
interface FileSystemWritableStream {
  write(data: string): Promise<void>;
  close(): Promise<void>;
}
interface FileSystemFileHandleLike {
  createWritable(): Promise<FileSystemWritableStream>;
}
type ShowSaveFilePicker = (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandleLike>;

function getSaveFilePicker(): ShowSaveFilePicker | undefined {
  return (window as unknown as { showSaveFilePicker?: ShowSaveFilePicker }).showSaveFilePicker;
}

export class DownloadCancelledError extends Error {
  constructor() {
    super('The operator cancelled the save dialog.');
    this.name = 'DownloadCancelledError';
  }
}

/**
 * Saves `contents` as a file named `filename`. Uses the File System Access
 * API when the browser offers it, so the operator can choose a location;
 * otherwise falls back to a plain browser download into the default folder.
 */
export async function downloadJsonFile(filename: string, contents: string): Promise<void> {
  const showSaveFilePicker = getSaveFilePicker();
  if (showSaveFilePicker) {
    try {
      const handle = await showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(contents);
      await writable.close();
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new DownloadCancelledError();
      }
      // Any other failure (e.g. API present but non-functional): fall back below.
    }
  }

  const blob = new Blob([contents], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } finally {
    URL.revokeObjectURL(url);
  }
}
