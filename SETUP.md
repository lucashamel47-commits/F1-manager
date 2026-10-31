# Mise en route : comptes + rappels par email

Tout se fait depuis un navigateur (iPad compris). Compte à compter : ~15 minutes.

## Ce qu'il faut

| Quoi | Où le trouver | Où le mettre |
|---|---|---|
| **Project URL** Supabase (`https://xxxx.supabase.co`) | Supabase › Project Settings › **API** (ou Data API) | GitHub › repo › Settings › Secrets and variables › Actions › onglet **Variables** › `VITE_SUPABASE_URL` |
| **Clé `anon` / `publishable`** (publique) | Supabase › Project Settings › **API Keys** | Variable GitHub `VITE_SUPABASE_ANON_KEY` |
| **Clé `service_role` / `secret`** (⚠️ privée) | Supabase › Project Settings › **API Keys** | **Secret** GitHub `SUPABASE_SERVICE_ROLE_KEY` (onglet *Secrets*) |
| **Clé API Resend** | resend.com › **API Keys** › Create API key (permission « Sending access ») | **Secret** GitHub `RESEND_API_KEY` |
| *(optionnel)* adresse d'envoi | voir étape 4 | Variable GitHub `RESEND_FROM`, ex. `F1 Manager <rappels@ton-domaine.fr>` |

Ne jamais mettre la clé `service_role` ni la clé Resend dans l'app, dans un message public ou dans le code : uniquement dans les **Secrets** GitHub.

## 1. Supabase : créer les tables

1. Supabase › **SQL Editor** › *New query*.
2. Colle tout le contenu de [`supabase/migrations/20261031_reminders.sql`](supabase/migrations/20261031_reminders.sql) puis **Run**. (Relançable sans risque.)
   Il crée `reminder_prefs` (réglages de chaque utilisateur, visibles uniquement par lui grâce à la sécurité RLS) et `reminder_log` (anti-doublon, réservé au robot d'envoi).

## 2. Supabase : réglages d'authentification

Supabase › **Authentication** :

- **URL Configuration** › *Site URL* = `https://lucashamel47-commits.github.io/F1-manager/` et ajoute la même adresse dans *Redirect URLs*. (Indispensable pour les liens de confirmation et « mot de passe oublié ».)
- **Sign In / Providers › Email** : *Email* activé. Deux options :
  - **Simple (pour démarrer)** : désactive *Confirm email*. Les gens s'inscrivent et entrent directement. Contre : pas de vérification de l'adresse, et pas de mot de passe oublié par email.
  - **Recommandé (vraie app)** : garde *Confirm email* **et** configure un SMTP personnalisé (étape 4). Sans SMTP personnalisé, Supabase n'envoie des emails qu'aux membres de ton équipe Supabase (limite de son service gratuit intégré) : les autres utilisateurs ne recevraient jamais le lien de confirmation.

## 3. GitHub : variables et secrets

Repo › **Settings › Secrets and variables › Actions** :

- Onglet **Variables** › *New repository variable* : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (et `RESEND_FROM` si étape 4).
- Onglet **Secrets** › *New repository secret* : `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`.

Puis relance le déploiement : onglet **Actions › Déploiement GitHub Pages › Run workflow** (les variables `VITE_…` sont intégrées à l'app au moment du build). Tant qu'elles sont vides, l'app marche comme avant (comptes locaux, sans rappels email).

## 4. Resend : envoyer à tout le monde

Sans domaine, Resend n'autorise l'envoi **qu'à l'adresse de ton propre compte Resend** (expéditeur `onboarding@resend.dev`) : parfait pour tester, pas pour les autres utilisateurs.

Pour écrire à tous :

1. Resend › **Domains** › *Add domain* (il faut posséder un nom de domaine, ~10 €/an chez n'importe quel registrar) puis ajoute les enregistrements DNS demandés jusqu'à voir *Verified*.
2. Variable GitHub `RESEND_FROM` = `F1 Manager <rappels@ton-domaine.fr>`.
3. *(Recommandé)* Supabase › **Authentication › SMTP Settings** › *Enable custom SMTP* : host `smtp.resend.com`, port `465`, username `resend`, password = ta clé API Resend, expéditeur `rappels@ton-domaine.fr`. Les emails de confirmation/mot de passe oublié passent alors par Resend.

Offre gratuite Resend : 3 000 emails/mois, 100/jour.

## 5. Tester

1. Ouvre l'app, crée un compte, va dans **Rappels & calendrier**, active les rappels, choisis sessions et délais, **Enregistrer**.
2. GitHub › **Actions › Rappels par email avant les sessions › Run workflow** :
   - *Envoyer aussi un email de test* ✔ → tu reçois un email de test.
   - *Simulation* ✔ → affiche dans les logs ce qui partirait, sans envoyer.
3. Ensuite le robot tourne tout seul toutes les 15 min.

## Comment ça marche

- `.github/workflows/send-reminders.yml` (cron `*/15 * * * *`) lance `scripts/send-reminders.mjs` (aucune dépendance).
- Le script lit le calendrier Jolpica, lit les inscrits actifs dans Supabase, et pour chaque session/délai choisi dont l'heure d'envoi est passée depuis moins de 90 min (et session pas encore commencée), **réserve** une ligne dans `reminder_log` puis envoie l'email via Resend. La réservation est unique par (utilisateur, session, délai) : jamais de doublon, même si le cron de GitHub est en retard ou tourne deux fois. Si l'envoi échoue, la réservation est annulée et le prochain run réessaie.
- L'adresse email vient toujours du compte connecté (trigger SQL), jamais du navigateur.
- Heures affichées dans le fuseau de l'appareil au moment de l'enregistrement des réglages.
- Sans les variables/secrets, le workflow reste vert et ne fait rien.

À savoir : GitHub désactive les workflows planifiés d'un dépôt sans aucune activité pendant 60 jours (un push suffit à les réactiver), et les crons peuvent avoir quelques minutes de retard.

## Désinscription

L'utilisateur désactive les rappels dans l'app (Rappels & calendrier). Supprimer un compte dans Supabase › Authentication › Users supprime aussi ses réglages et son historique.
