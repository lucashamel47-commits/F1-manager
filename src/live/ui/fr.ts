/** Traduction des messages les plus fréquents de la direction de course. */
export function frMsg(m: string): string {
  const u = m.trim()
  const rules: [RegExp, (g: RegExpMatchArray) => string][] = [
    [/^GREEN LIGHT - PIT EXIT OPEN/i, () => 'Feu vert — sortie des stands ouverte'],
    [/^PIT EXIT CLOSED/i, () => 'Sortie des stands fermée'],
    [/^DOUBLE YELLOW IN TRACK SECTOR (\d+)/i, (g) => `Double jaune — secteur ${g[1]}`],
    [/^YELLOW IN TRACK SECTOR (\d+)/i, (g) => `Jaune — secteur ${g[1]}`],
    [/^CLEAR IN TRACK SECTOR (\d+)/i, (g) => `Piste libre — secteur ${g[1]}`],
    [/^TRACK CLEAR/i, () => 'Piste dégagée'],
    [/^VSC DEPLOYED/i, () => 'Virtual Safety Car déployée'],
    [/^VSC ENDING/i, () => 'Fin de la Virtual Safety Car'],
    [/^SAFETY CAR DEPLOYED/i, () => 'Safety Car déployée'],
    [/^SAFETY CAR IN THIS LAP/i, () => 'La Safety Car rentre à ce tour'],
    [/^CHEQUERED FLAG/i, () => 'Drapeau à damier'],
    [/^RED FLAG/i, () => 'Drapeau rouge'],
    [/^SESSION STARTED/i, () => 'Session lancée'],
    [/^ALL PASS HOLDERS MAY ACCESS THE PIT LANE/i, () => 'Accès libre à la voie des stands'],
    [/^RACE START/i, () => 'Départ de la course'],
    [/^(\d+) MINUTES? TO (?:GO|SESSION START)/i, (g) => `${g[1]} min avant le départ`],
    [/^SESSION FINISHED/i, () => 'Session terminée'],
    [/^SESSION (RESUMED|WILL RESUME)/i, () => 'Reprise de la session'],
    [/^WAVED BLUE FLAG FOR CAR \d+ \((\w+)\)/i, (g) => `Drapeau bleu — ${g[1]}`],
    [/^BLACK AND WHITE FLAG FOR CAR \d+ \((\w+)\) - TRACK LIMITS/i, (g) => `Drapeau noir et blanc — ${g[1]} (limites de piste)`],
    [/^BLACK AND WHITE FLAG FOR CAR \d+ \((\w+)\)/i, (g) => `Drapeau noir et blanc — ${g[1]}`],
    [/^RISK OF RAIN FOR THE F1 RACE IS (\d+)%/i, (g) => `Risque de pluie pour la course : ${g[1]} %`],
    [/^RISK OF RAIN.* IS (\d+)%/i, (g) => `Risque de pluie : ${g[1]} %`],
    [/^DRS ENABLED/i, () => 'DRS activé'],
    [/^DRS DISABLED/i, () => 'DRS désactivé'],
    [/^OVERTAKE DISABLED/i, () => 'Mode dépassement désactivé'],
    [/^OVERTAKE ENABLED/i, () => 'Mode dépassement activé'],
    [/^CAR (\d+) \((\w+)\) TIME (.+) DELETED - TRACK LIMITS/i, (g) => `Temps annulé — ${g[2]} (limites de piste)`],
    [/^LOW GRIP DELTA ACTIVE/i, () => 'Delta basse adhérence activé'],
    [/^LOW GRIP CONDITIONS/i, () => 'Conditions de faible adhérence'],
    [/^SAFETY CAR ENDING/i, () => 'Fin de la Safety Car'],
    [/^VSC DEPLOYED|^VIRTUAL SAFETY CAR DEPLOYED/i, () => 'Virtual Safety Car déployée'],
    [/^VIRTUAL SAFETY CAR ENDING/i, () => 'Fin de la Virtual Safety Car'],
    [/^PIT ENTRY CLOSED/i, () => 'Entrée des stands fermée'],
    [/^PIT ENTRY OPEN/i, () => 'Entrée des stands ouverte'],
    [/^PIT LANE (?:EXIT )?OPEN/i, () => 'Voie des stands ouverte'],
    [/^PIT LANE (?:EXIT )?CLOSED/i, () => 'Voie des stands fermée'],
    [/^LAPPED CARS MAY NOW OVERTAKE/i, () => 'Les attardés peuvent se dédoubler'],
    [/^LAPPED CARS WILL NOT BE ALLOWED TO OVERTAKE/i, () => 'Les attardés ne pourront pas se dédoubler'],
    [/^RACE WILL START BEHIND THE SAFETY CAR/i, () => 'Départ derrière la Safety Car'],
    [/^STANDING START/i, () => 'Départ arrêté'],
    [/^ROLLING START/i, () => 'Départ lancé'],
    [/^(?:FORMATION LAP|EXTRA FORMATION LAP)/i, () => 'Tour de formation'],
    [/^START ABORTED/i, () => 'Départ interrompu'],
    [/^RED FLAG/i, () => 'Drapeau rouge'],
    [/^CAR (\d+) \((\w+)\) TIME (.+) DELETED - TRACK LIMITS.*/i, (g) => `Temps annulé — ${g[2]} (limites de piste)`],
    [/^CAR (\d+) \((\w+)\) LAP (\d+) DELETED.*/i, (g) => `Tour ${g[3]} annulé — ${g[2]}`],
    [/^FIA STEWARDS: (.+) UNDER INVESTIGATION.*/i, (g) => `Commissaires : enquête — ${frIncident(g[1])}`],
    [/^FIA STEWARDS: (.+) NOTED.*/i, (g) => `Commissaires : incident noté — ${frIncident(g[1])}`],
    [/^FIA STEWARDS: (.+) REVIEWED NO FURTHER (?:ACTION|INVESTIGATION).*/i, (g) => `Commissaires : pas de sanction — ${frIncident(g[1])}`],
    [/^FIA STEWARDS: NO FURTHER (?:ACTION|INVESTIGATION) (?:FOR|-)? ?(.*)/i, (g) => `Commissaires : pas de sanction — ${frIncident(g[1])}`],
    [/^FIA STEWARDS: (\d+) SECOND TIME PENALTY FOR CAR (\d+) \((\w+)\)(.*)/i, (g) => `Commissaires : ${g[1]} s de pénalité pour ${g[3]}${frIncident(g[4]) ? ' — ' + frIncident(g[4]) : ''}`],
    [/^FIA STEWARDS: DRIVE THROUGH PENALTY FOR CAR (\d+) \((\w+)\)(.*)/i, (g) => `Commissaires : drive-through pour ${g[2]}`],
    [/^FIA STEWARDS: STOP\/GO PENALTY.* FOR CAR (\d+) \((\w+)\)(.*)/i, (g) => `Commissaires : stop & go pour ${g[2]}`],
    [/^FIA STEWARDS: PENALTY SERVED.*CAR (\d+) \((\w+)\)/i, (g) => `Pénalité purgée — ${g[2]}`],
    [/^FIA STEWARDS: (.*)/i, (g) => `Commissaires : ${frIncident(g[1])}`],
  ]
  for (const [re, f] of rules) { const g = u.match(re); if (g) return f(g) }
  return u
}

/** « TURN 4 INCIDENT INVOLVING CARS 1 (NOR) AND 12 (ANT) - CAUSING A COLLISION » → texte lisible en français. */
function frIncident(x: string): string {
  const tlas = new Set([...x.matchAll(/\((\w{3})\)/g)].map((m) => m[1].toLowerCase()))
  let out = x.trim().replace(/^-\s*/, '')
    .replace(/TURN (\d+)/gi, 'virage $1')
    .replace(/INCIDENT INVOLVING CARS? /gi, 'incident entre ')
    .replace(/(?:CARS? )?\b\d+ \((\w{3})\)/gi, '$1')
    .replace(/\bAND\b/gi, 'et')
    .replace(/CAUSING A COLLISION/gi, 'accrochage provoqué')
    .replace(/FORCING ANOTHER DRIVER OFF THE TRACK/gi, 'pilote poussé hors de la piste')
    .replace(/LEAVING THE TRACK AND GAINING AN ADVANTAGE/gi, 'avantage pris hors piste')
    .replace(/UNSAFE RELEASE/gi, 'relâche dangereuse')
    .replace(/PIT LANE SPEEDING/gi, 'excès de vitesse dans les stands')
    .replace(/TRACK LIMITS/gi, 'limites de piste')
    .replace(/FALSE START/gi, 'départ anticipé')
    .replace(/IMPEDING/gi, 'gêne')
    .replace(/MOVING UNDER BRAKING/gi, 'changement de trajectoire au freinage')
    .replace(/WILL BE INVESTIGATED AFTER THE (RACE|SESSION)/gi, 'examiné après la session')
    .replace(/UNDER INVESTIGATION/gi, 'sous enquête')
    .replace(/\bNOTED\b/gi, 'noté')
    .replace(/\bREVIEWED\b/gi, 'examiné')
    .replace(/\s+-\s+/g, ' — ')
    .replace(/\s{2,}/g, ' ')
    .toLowerCase()
  for (const t of tlas) out = out.replace(new RegExp(`\\b${t}\\b`, 'g'), t.toUpperCase())
  return out
}
