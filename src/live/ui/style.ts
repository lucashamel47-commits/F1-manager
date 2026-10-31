import type { SectorState, TrackKind } from '../model'

export const COMPOUND: Record<string, { color: string; letter: string; label: string }> = {
  SOFT: { color: '#ef4444', letter: 'S', label: 'Tendre' },
  MEDIUM: { color: '#facc15', letter: 'M', label: 'Medium' },
  HARD: { color: '#f4f4f5', letter: 'H', label: 'Dur' },
  INTERMEDIATE: { color: '#22c55e', letter: 'I', label: 'Inter' },
  WET: { color: '#3b82f6', letter: 'W', label: 'Pluie' },
  UNKNOWN: { color: '#71717a', letter: '?', label: 'Inconnu' },
}
export const compound = (c?: string | null) => COMPOUND[(c ?? 'UNKNOWN').toUpperCase()] ?? COMPOUND.UNKNOWN

export const stateClass = (s: SectorState | undefined, base = 'text-zinc-200') =>
  s === 'purple' ? 'text-fuchsia-400' : s === 'green' ? 'text-emerald-400' : s === 'yellow' ? 'text-yellow-300' : base

export const stateBar = (s: SectorState | undefined) =>
  s === 'purple' ? 'bg-fuchsia-500' : s === 'green' ? 'bg-emerald-500' : s === 'yellow' ? 'bg-yellow-400' : 'bg-zinc-800'

export const TRACK_LABEL: Record<TrackKind, { label: string; cls: string }> = {
  NONE: { label: 'Piste', cls: 'bg-zinc-800 text-zinc-300' },
  GREEN: { label: 'Drapeau vert', cls: 'bg-emerald-600 text-white' },
  YELLOW: { label: 'Drapeau jaune', cls: 'bg-yellow-400 text-black' },
  SC: { label: 'Safety Car', cls: 'bg-orange-500 text-black' },
  VSC: { label: 'Virtual Safety Car', cls: 'bg-orange-500 text-black' },
  RED: { label: 'Drapeau rouge', cls: 'bg-red-600 text-white' },
  CHEQUERED: { label: 'Damier', cls: 'bg-white text-black' },
}
