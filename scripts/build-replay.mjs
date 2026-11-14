// Génère public/replay/bresil-2026.json : rejeu réel compact (tracé + temps au tour/secteurs) pour la démo de l'accueil.
// Données gratuites OpenF1 (historique). Usage : node scripts/build-replay.mjs [session_key] [tours]
import { writeFileSync, mkdirSync } from 'node:fs'

const SK = Number(process.argv[2] ?? 11412)
const LAPS = Number(process.argv[3] ?? 12)
const B = 'https://api.openf1.org/v1'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function get(path) {
  for (let i = 0; i < 5; i++) {
    const r = await fetch(`${B}/${path}`)
    if (r.ok) return r.json()
    if (r.status === 404) return []
    await sleep(1500 * (i + 1))
  }
  throw new Error('échec ' + path)
}
const ms = (s) => Date.parse(s)

const [session] = await get(`sessions?session_key=${SK}`)
const drivers = await get(`drivers?session_key=${SK}`); await sleep(400)
const laps = await get(`laps?session_key=${SK}`); await sleep(400)
const result = await get(`session_result?session_key=${SK}`); await sleep(400)
const t0 = Math.min(...laps.filter((l) => l.lap_number === 1 && l.date_start).map((l) => ms(l.date_start)))
const pos = await get(`position?session_key=${SK}&date<=${new Date(t0 + 5000).toISOString()}`); await sleep(400)

// tracé : meilleur tour propre
const best = laps.filter((l) => l.lap_duration && !l.is_pit_out_lap && l.lap_number > 1 && l.duration_sector_1 && l.duration_sector_2).sort((a, b) => a.lap_duration - b.lap_duration)[0]
const bs = ms(best.date_start)
const loc = await get(`location?session_key=${SK}&driver_number=${best.driver_number}&date>=${new Date(bs).toISOString()}&date<${new Date(bs + best.lap_duration * 1000 + 800).toISOString()}`)
const raw = []
for (const r of loc) { if (r.x === 0 && r.y === 0) continue; const l = raw[raw.length - 1]; if (!l || l[0] !== r.x || l[1] !== r.y) raw.push([r.x, r.y, ms(r.date)]) }
const cum = [0]
for (let i = 1; i < raw.length; i++) cum.push(cum[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]))
const total = cum.at(-1)
const fracAt = (t) => { let bi = 0, bd = Infinity; raw.forEach((p, i) => { const d = Math.abs(p[2] - t); if (d < bd) { bd = d; bi = i } }); return +(cum[bi] / total).toFixed(4) }
const s1 = fracAt(bs + best.duration_sector_1 * 1000)
const s2 = fracAt(bs + (best.duration_sector_1 + best.duration_sector_2) * 1000)
// sous-échantillonnage du tracé (~1 point tous les 0,4 % du tour)
const track = []
let lastC = -Infinity
raw.forEach((p, i) => { if (cum[i] - lastC >= total * 0.004 || i === raw.length - 1) { track.push([Math.round(p[0]), Math.round(p[1])]); lastC = cum[i] } })

// tracé plus haut que large : on le tourne de 90° pour remplir la carte (format paysage)
const xs = track.map((p) => p[0]), ys = track.map((p) => p[1])
if (Math.max(...ys) - Math.min(...ys) > Math.max(...xs) - Math.min(...xs)) for (const p of track) { const [x, y] = p; p[0] = y; p[1] = -x }

const gridPos = {}
for (const p of pos) gridPos[p.driver_number] = p.position // dernière valeur avant le départ
const order = result.filter((r) => r.position).sort((a, b) => a.position - b.position).map((r) => r.driver_number)
const out = {
  name: session ? `${session.country_name} ${session.year}` : 'Course',
  gp: 'Grand Prix du Brésil 2026', circuit: session?.circuit_short_name ?? '', totalLaps: Math.max(...laps.map((l) => l.lap_number)),
  sectors: [s1, s2], track,
  drivers: drivers.map((d) => {
    const mine = laps.filter((l) => l.driver_number === d.driver_number && l.lap_number <= LAPS + 1).sort((a, b) => a.lap_number - b.lap_number)
    return {
      n: d.driver_number, acr: d.name_acronym, name: d.full_name, team: d.team_name, color: `#${d.team_colour}`, grid: gridPos[d.driver_number] ?? 20, finish: order.indexOf(d.driver_number) + 1 || null,
      // [tour, départ (s depuis t0), S1, S2, S3]
      laps: mine.filter((l) => l.date_start).map((l) => [l.lap_number, +((ms(l.date_start) - t0) / 1000).toFixed(2), l.duration_sector_1, l.duration_sector_2, l.duration_sector_3]),
    }
  }).sort((a, b) => a.grid - b.grid),
}
mkdirSync('public/replay', { recursive: true })
writeFileSync('public/replay/bresil-2026.json', JSON.stringify(out))
console.log('ok', out.track.length, 'points,', out.drivers.length, 'pilotes, secteurs', s1, s2)
