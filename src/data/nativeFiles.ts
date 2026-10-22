import { Capacitor } from '@capacitor/core';

export const IS_NATIVE_APP = Capacitor.isNativePlatform();

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/**
 * Saves a generated file. In a browser it downloads; in the Android app (which cannot download blobs)
 * it opens the phone's share sheet so the file can be saved to Drive / Files or sent on WhatsApp.
 */
export async function saveBlobFile(filename: string, blob: Blob): Promise<void> {
  if (IS_NATIVE_APP) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const written = await Filesystem.writeFile({ path: filename, data: await blobToBase64(blob), directory: Directory.Cache });
    await Share.share({ title: filename, url: written.uri, dialogTitle: filename });
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
