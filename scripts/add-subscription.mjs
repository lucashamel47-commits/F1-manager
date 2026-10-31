// Ajoute (ou remplace) un code d'activation copié depuis l'app, puis met à jour le secret GitHub PUSH_SUBSCRIPTIONS.
// Les secrets GitHub ne peuvent pas être relus : la liste complète est gardée dans un fichier local.
//   node scripts/add-subscription.mjs <code>            (fichier par défaut : ~/.f1-manager-subscriptions.txt)
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'

const file = process.env.F1_SUBS_FILE || `${homedir()}/.f1-manager-subscriptions.txt`
const code = (process.argv[2] || '').trim()
const endpointOf = (c) => JSON.parse(Buffer.from(c, 'base64url').toString('utf8')).sub.endpoint
try { endpointOf(code) } catch { console.error('Code invalide.'); process.exit(1) }

const all = existsSync(file) ? readFileSync(file, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean) : []
const kept = all.filter((c) => { try { return endpointOf(c) !== endpointOf(code) } catch { return false } })
kept.push(code)
writeFileSync(file, kept.join('\n') + '\n', { mode: 0o600 })
execFileSync('gh', ['secret', 'set', 'PUSH_SUBSCRIPTIONS'], { input: kept.join('\n'), stdio: ['pipe', 'inherit', 'inherit'] })
console.log(`${kept.length} abonné(s) enregistré(s).`)
