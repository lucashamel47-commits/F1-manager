# F1 Manager

Application web de suivi de la Formule 1 (saison 2026) : classements pilotes et constructeurs, calendrier des courses, statistiques, fiches circuits et écuries, et suivi de tes pilotes et de ton écurie favoris.

L'interface est responsive : elle s'adapte au téléphone, à l'iPad et à l'ordinateur.

## Technologies

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Données en direct via l'API [Jolpica F1](https://api.jolpi.ca/ergast/f1/)

## Comptes et rappels par email

Comptes (Supabase) + rappels automatiques avant les sessions (Resend, envoyés par un cron GitHub Actions) : voir [SETUP.md](SETUP.md). Sans configuration, l'app fonctionne comme avant et masque ces fonctions.

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
