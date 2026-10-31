# Mise en route : comptes + rappels par email

Tout se fait depuis un navigateur (iPad compris). Compte à compter : ~15 minutes.

## Ce qu'il faut

| Quoi | Où le trouver | Où le mettre |
|---|---|---|
| **Project URL** Supabase (`https://xxxx.supabase.co`) | Supabase › Project Settings › **API** (ou Data API) | GitHub › repo › Settings › Secrets and variables › Actions › onglet **Variables** › `VITE_SUPABASE_URL` |
| **Clé `anon` / `publishable`** (publique) | Supabase › Project Settings › **API Keys** | Variable GitHub `VITE_SUPABASE_ANON_KEY` |
| **Clé `service_role` / `secret`** (⚠️ privée) | Supabase › Project Settings › **API Keys** | **Secret** GitHub `SUPABASE_SERVICE_ROLE_KEY` (onglet *Secrets*) |
| **Adresse Gmail d'envoi** (un Gmail dédié à l'app) | étape 4 | **Secret** GitHub `GMAIL_USER` |
| **Mot de passe d'application Gmail** (16 caractères) | étape 4 | **Secret** GitHub `GMAIL_APP_PASSWORD` |

Ne jamais mettre la clé `service_role` ni le mot de passe d'application Gmail dans l'app, dans un message public ou dans le code : uniquement dans les **Secrets** GitHub.

## 1. Supabase : créer les tables

1. Supabase › **SQL Editor** › *New query*.
2. Colle tout le contenu de [`supabase/migrations/20261031_reminders.sql`](supabase/migrations/20261031_reminders.sql) puis **Run**. (Relançable sans risque.)
   Il crée `reminder_prefs` (réglages de chaque utilisateur, visibles uniquement par lui grâce à la sécurité RLS) et `reminder_log` (anti-doublon, réservé au robot d'envoi).

## 2. Supabase : réglages d'authentification

Supabase › **Authentication** :

- **URL Configuration** › *Site URL* = `https://lucashamel47-commits.github.io/F1-manager/` et ajoute la même adresse dans *Redirect URLs*. (Indispensable pour les liens de confirmation et « mot de passe oublié ».)
- **Sign In / Providers › Email** : *Email* activé. Deux options :
  - **Simple (pour démarrer)** : désactive *Confirm email*. Les gens s'inscrivent et entrent directement. Contre : pas de vérification de l'adresse, et pas de mot de passe oublié par email.
  - **Plus tard (vraie app)** : réactive *Confirm email* **et** configure un SMTP personnalisé dans Supabase › Authentication › SMTP Settings (tu peux y mettre le même Gmail : `smtp.gmail.com`, port `465`, identifiant = le Gmail, mot de passe = le mot de passe d'application). Sans SMTP personnalisé, Supabase n'envoie des emails qu'aux membres de ton équipe Supabase : les autres utilisateurs ne recevraient jamais le lien de confirmation.

## 3. GitHub : variables et secrets

Repo › **Settings › Secrets and variables › Actions** :

- Onglet **Variables** › *New repository variable* : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Onglet **Secrets** › *New repository secret* : `SUPABASE_SERVICE_ROLE_KEY`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`.

Après avoir ajouté/modifié les variables `VITE_…`, relance le déploiement : onglet **Actions › Déploiement GitHub Pages › Run workflow** (elles sont intégrées à l'app au moment du build). Tant qu'elles sont vides, l'app marche comme avant (comptes locaux, sans rappels email).

## 4. Gmail : le compte qui envoie les rappels

Crée un Gmail **dédié à l'app** (pas ton adresse personnelle), puis :

1. Compte Google › **Sécurité** › active la **validation en deux étapes** (obligatoire pour les mots de passe d'application).
2. Va sur <https://myaccount.google.com/apppasswords>, nom « F1 Manager » › **Créer**. Google affiche 16 caractères (par blocs de 4) : copie-les (les espaces sont ignorés).
3. Secrets GitHub : `GMAIL_USER` = l'adresse Gmail complète, `GMAIL_APP_PASSWORD` = les 16 caractères.

Le robot se connecte à `smtp.gmail.com` (port 465, SSL). Limites de Gmail : environ **500 emails par jour** pour un compte gratuit, et l'expéditeur affiché est toujours ce Gmail. Pour de gros volumes, il faudra passer à un vrai service d'envoi.

## 5. Tester

1. Ouvre l'app, crée un compte, va dans **Rappels & calendrier**, active les rappels, choisis sessions et délais, **Enregistrer**.
2. GitHub › **Actions › Rappels par email avant les sessions › Run workflow** :
   - *Envoyer aussi un email de test* ✔ → chaque inscrit actif reçoit un email de test (avec ton compte, tu reçois le tien).
   - *Simulation* ✔ → affiche dans les logs ce qui partirait, sans envoyer.
   (Tant que `GMAIL_USER` / `GMAIL_APP_PASSWORD` ne sont pas définis, le workflow ne fait rien.)
3. Ensuite le robot tourne tout seul toutes les 15 min.

## Comment ça marche

- `.github/workflows/send-reminders.yml` (cron `*/15 * * * *`) lance `scripts/send-reminders.mjs` (aucune dépendance).
- Le script lit le calendrier Jolpica, lit les inscrits actifs dans Supabase, et pour chaque session/délai choisi dont l'heure d'envoi est passée depuis moins de 90 min (et session pas encore commencée), **réserve** une ligne dans `reminder_log` puis envoie l'email via Gmail (nodemailer). La réservation est unique par (utilisateur, session, délai) : jamais de doublon, même si le cron de GitHub est en retard ou tourne deux fois. Si l'envoi échoue, la réservation est annulée et le prochain run réessaie.
- L'adresse email vient toujours du compte connecté (trigger SQL), jamais du navigateur.
- Heures affichées dans le fuseau de l'appareil au moment de l'enregistrement des réglages.
- Sans les variables/secrets (Supabase ou Gmail), le workflow reste vert et ne fait rien.

À savoir : GitHub désactive les workflows planifiés d'un dépôt sans aucune activité pendant 60 jours (un push suffit à les réactiver), et les crons peuvent avoir quelques minutes de retard.

## Désinscription

L'utilisateur désactive les rappels dans l'app (Rappels & calendrier). Supprimer un compte dans Supabase › Authentication › Users supprime aussi ses réglages et son historique.
