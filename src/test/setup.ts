/**
 * Node 25 exposes its own `localStorage` global, which shadows the one jsdom
 * installs and is inert unless the process was started with a
 * `--localstorage-file` path. Tests get a plain in-memory Storage instead, so
 * anything touching persistence behaves the way it does in a browser.
 */
import { beforeEach } from 'vitest'

class MemoryStorage implements Storage {
  #entries = new Map<string, string>()

  get length(): number {
    return this.#entries.size
  }

  key(index: number): string | null {
    return [...this.#entries.keys()][index] ?? null
  }

  getItem(key: string): string | null {
    return this.#entries.get(String(key)) ?? null
  }

  setItem(key: string, value: string): void {
    this.#entries.set(String(key), String(value))
  }

  removeItem(key: string): void {
    this.#entries.delete(String(key))
  }

  clear(): void {
    this.#entries.clear()
  }
}

const storage = new MemoryStorage()

for (const target of [globalThis, globalThis.window]) {
  if (!target) continue
  Object.defineProperty(target, 'localStorage', {
    value: storage,
    configurable: true,
    writable: true,
  })
}

// Each test file shares one process, so start every test from an empty store.
beforeEach(() => storage.clear())
