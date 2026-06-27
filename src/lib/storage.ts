import type { SavedWork } from '../types'

const KEY = 'omakase.works.v1'

export function loadWorks(): SavedWork[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as SavedWork[]
    return parsed.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

export function saveWork(work: SavedWork): SavedWork[] {
  const works = loadWorks()
  const idx = works.findIndex((w) => w.id === work.id)
  if (idx >= 0) works[idx] = work
  else works.unshift(work)
  persist(works)
  return works
}

export function deleteWork(id: string): SavedWork[] {
  const works = loadWorks().filter((w) => w.id !== id)
  persist(works)
  return works
}

export function getWork(id: string): SavedWork | undefined {
  return loadWorks().find((w) => w.id === id)
}

function persist(works: SavedWork[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(works))
  } catch (e) {
    // Most likely quota exceeded from too many thumbnails.
    console.error('Failed to persist works', e)
  }
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}
