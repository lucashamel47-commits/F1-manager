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
    [/^FIA STEWARDS: (.*)/i, (g) => `Commissaires : ${g[1]}`],
  ]
  for (const [re, f] of rules) { const g = u.match(re); if (g) return f(g) }
  return u
}
