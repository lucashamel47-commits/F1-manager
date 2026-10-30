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
