# F1 Manager

Application web de suivi de la Formule 1 (saison 2026) : classements pilotes et constructeurs, calendrier des courses, statistiques, fiches circuits et écuries, et suivi de tes pilotes et de ton écurie favoris.

L'interface est responsive : elle s'adapte au téléphone, à l'iPad et à l'ordinateur.

## Technologies

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Données en direct via l'API [Jolpica F1](https://api.jolpi.ca/ergast/f1/)

## Lancer le projet

```bash
npm install
npm run dev       # serveur de développement
npm run build     # build de production
npm run preview   # prévisualiser le build
npm run lint      # vérification du code
```

## Structure

- `src/pages/` : pages (accueil, choix du mode, mode Hors Course)
- `src/components/` : composants (héros, formulaire de connexion, présentation)
- `src/data/` : données statiques
- `public/cars/` : images des monoplaces

## Modes

- **Hors Course** : classements, calendrier, statistiques, favoris.
- **Live Timing** : à venir.

## Application installable (PWA) et hébergement

F1 Manager est une PWA : installable sur l'écran d'accueil, plein écran, avec un mode hors ligne
(coquille de l'app + dernières données Jolpica et images de circuits en cache).

- Déployé gratuitement sur **GitHub Pages** : https://lucashamel47-commits.github.io/F1-manager/
- Le workflow `.github/workflows/deploy.yml` se lance uniquement à chaque mise à jour de `main`
  (réglage unique : *Settings → Pages → Source : GitHub Actions*).
- Le chemin de base `/F1-manager/` est fourni par la variable `VITE_BASE` au build ; en local, tout reste à `/`.
- Installation sur iPad / iPhone : ouvrir l'URL dans **Safari → Partager → Sur l'écran d'accueil**.
- Les icônes viennent de `assets-src/logo.svg` (PNG générés dans `public/`).

## Notifications avant les sessions (gratuit)

- **Dans l'app** : Modes › *Notifications* — compte à rebours de la prochaine session, choix des sessions (course, qualifs, sprint, essais) et de l'avance (15 min, 1 h, 3 h, 1 jour), export `.ics` de tout le calendrier avec rappels (marche sans serveur).
- **Web Push** (iPadOS 16.4+, app ajoutée à l'écran d'accueil) : l'app génère un *code d'activation* (abonnement + réglages). Le workflow `.github/workflows/notify.yml` (cron toutes les 15 min) lit le calendrier Jolpica et envoie les notifications avec `scripts/notify.mjs`.
- **Secrets GitHub** (jamais dans le code) : `VAPID_PRIVATE_KEY` (clé privée Web Push) et `PUSH_SUBSCRIPTIONS` (un code d'activation par ligne). La clé publique VAPID est dans `src/lib/notify.ts`.
- **Enregistrer un appareil** : `node scripts/add-subscription.mjs <code>` (met à jour le secret via `gh`). Test : Actions › *Notifications avant les sessions* › Run workflow › `test`.
- Limites : le cron GitHub peut avoir quelques minutes de retard (le script rattrape la fenêtre exacte) ; GitHub coupe les crons après 60 jours sans activité dans le dépôt.
