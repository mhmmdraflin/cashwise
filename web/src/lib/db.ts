'use client';

import { CashWiseIndexedDbStorage, DEFAULT_USER_ID } from '@cashwise/shared';

let storageInstance: CashWiseIndexedDbStorage | null = null;

export async function getStorage(): Promise<CashWiseIndexedDbStorage> {
  if (typeof window === 'undefined') {
    throw new Error('IndexedDB storage hanya dapat diakses di sisi klien browser.');
  }

  if (!storageInstance) {
    storageInstance = new CashWiseIndexedDbStorage();
    await storageInstance.init();
  }

  return storageInstance;
}

export { DEFAULT_USER_ID };
