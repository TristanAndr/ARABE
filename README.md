# Qirāʾa — entraînement à la lecture de l'arabe coranique

Un segment du Coran s'affiche, entièrement vocalisé ; tu écris sa prononciation en alphabet latin ; l'application
la compare à une lecture de référence, mot par mot, selon les conventions de translittération que tu as choisies.
Une section « Révision » propose une fiche de conjugaison et des exercices, une section « Alphabet » les 28 lettres,
leurs formes et un entraînement à la reconnaissance.

Chaque personne a son **compte** (Supabase Auth) : progression, historique, paramètres et résultats sont stockés
dans PostgreSQL (Supabase), isolés par Row Level Security. Le site est **statique** (GitHub Pages) : aucun serveur à
maintenir.

## Architecture

```
Navigateur (GitHub Pages, fichiers statiques)
 ├─ contenu pédagogique commun : intégré au bundle (segments, lectures, fiche) — identique pour tous
 ├─ Supabase Auth : e-mail + mot de passe, session conservée dans le navigateur
 └─ Supabase PostgreSQL (API REST, clé publishable) — 1 ligne = 1 compte, RLS sur toutes les tables
      user_settings         réglages de translittération, normalisation, thème, ordre ; préférences de révision
      reading_progress      session de lecture en cours + cumul des statistiques
      reading_attempts      historique des vérifications de lecture (ajout seul)
      conjugation_attempts  réponses aux exercices de conjugaison (ajout seul)
      conjugation_sessions  sessions de conjugaison terminées (ajout seul)
      alphabet_progress     ancien suivi de l'alphabet (migration 2), plus utilisé par l'application
```

- Le texte coranique et la fiche ne sont **pas** copiés dans les comptes : seule la progression l'est.
- La validation des réponses se fait dans le navigateur, avec les conventions de translittération du compte.
- **Enregistrement fiable** : l'interface n'attend pas le réseau. Chaque modification passe par une file d'envoi
  (`src/sync/syncQueue.ts`) conservée dans le `localStorage` sous une clé propre au compte
  (`qiraa.outbox.<id>`) tant que le serveur ne l'a pas reçue. En cas de coupure : mention « Non enregistré » dans
  l'en-tête, nouvel essai automatique, puis au retour du réseau ou au prochain chargement. Les historiques portent un
  identifiant généré dans le navigateur : un renvoi ne crée pas de doublon.
- Si les données du compte ne peuvent pas être chargées, l'application l'indique et propose de réessayer : elle
  ne démarre jamais avec des valeurs par défaut qui écraseraient le compte.
- Règle en cas d'accès depuis deux appareils : pour les réglages et la progression, la dernière écriture
  l'emporte (pas de fusion).

### Données de l'ancienne version (sans compte)

L'ancienne version enregistrait tout dans le `localStorage` (`qiraa.settings.v1`, `qiraa.progress.v1`,
`qiraa.revision.v1`). Après la première connexion sur un navigateur qui en contient :

- **compte vide** : proposition d'import (ou refus) ;
- **compte déjà utilisé** : choix explicite entre garder le compte (par défaut) et remplacer ses données par celles
  du navigateur, avec confirmation. **Jamais de fusion.**

Dans les deux cas, les anciennes clés sont ensuite **archivées** sous `qiraa.archive.…` (pas effacées) et ne sont
plus proposées, ni à ce compte ni à un autre compte ouvert sur le même navigateur.

### Stockage local restant

| Clé | Contenu |
| --- | --- |
| `qiraa.auth` | session Supabase (jetons), gérée par supabase-js |
| `qiraa.outbox.<id>` | modifications pas encore reçues par le serveur (vide la plupart du temps) |
| `qiraa.archive.*` | copie archivée des données de l'ancienne version |

## Démarrage local

Prérequis : Node 20 ou plus récent, un projet Supabase (voir plus bas).

```sh
npm install
cp .env.example .env.local   # puis renseigner l'URL et la clé publishable
npm run dev                  # http://localhost:5173
```

Sans `.env.local`, l'application affiche « Configuration manquante » au lieu d'un écran blanc.

| Commande | Rôle |
| --- | --- |
| `npm run dev` | serveur de développement |
| `npm test` | tous les tests : logique, interface, build sous sous-chemin, sécurité RLS sur PostgreSQL |
| `npm run test:security` | uniquement les tests RLS (PostgreSQL embarqué, PGlite) |
| `npm run check:rls` | vérification de l'isolation **sur le vrai projet Supabase** (voir plus bas) |
| `npm run build` | vérification TypeScript puis build `dist/` |
| `npm run preview` | sert le build de production |

Raccourcis : **Entrée** vérifie (comme le bouton), **Ctrl/⌘ + Entrée** passe à la phrase suivante après
vérification.

## Mise en place de Supabase

### 1. Créer le projet

1. <https://supabase.com/dashboard> → **New project**. Choisir une région proche (Europe), noter le mot de passe de
   la base (il ne sert pas à l'application et ne doit pas être mis dans le dépôt).
2. **Project Settings → API Keys** : copier la **Publishable key** (`sb_publishable_…`).
   **Project Settings → Data API** : copier la **Project URL** (`https://xxxx.supabase.co`).
   Ne pas copier la *Secret key* ni la clé `service_role` : l'application n'en a pas besoin.

### 2. Appliquer les migrations

Dans l'ordre, chacune une seule fois :

1. `supabase/migrations/20261009120000_user_data.sql` : tables, contraintes, index, RLS et politiques ;
2. `supabase/migrations/20261010120000_alphabet_progress.sql` : table de l'ancien suivi de l'alphabet. Elle
   n'est plus lue ni écrite par l'application ; elle est conservée pour ne pas effacer les données déjà
   enregistrées. Inutile de l'appliquer sur un nouveau projet.
3. `supabase/migrations/20261018120000_pronoun_mode.sql` : autorise le mode de révision « Dire le pronom en
   arabe » dans les tables de conjugaison.

- **Par le dashboard** : **SQL Editor → New query**, coller tout le fichier, **Run**.
- **Ou par la CLI Supabase** : `npx supabase login`, `npx supabase link --project-ref <ref>`, `npx supabase db push`.

Coller **tout** le fichier sans rien sélectionner dans l'éditeur : avec une sélection, seule la partie
sélectionnée est exécutée.

Contrôle : **Database → Tables** doit lister les 6 tables avec le badge *RLS enabled* ;
**Authentication → Policies** doit montrer 4 politiques pour `user_settings` et `reading_progress`, 3 pour chacune
des trois tables d'historique.

### 3. Configurer l'authentification

**Authentication → Sign In / Providers → Email** : laisser *Email* activé. *Confirm email* : activé (recommandé,
réglage par défaut) ; l'application gère les deux cas.

**Authentication → URL Configuration** :

| Champ | Valeur |
| --- | --- |
| Site URL | `https://UTILISATEUR.github.io/NOM-DU-REPO/` |
| Redirect URLs | `https://UTILISATEUR.github.io/NOM-DU-REPO/` |
| | `http://localhost:5173/` (développement) |
| | `http://localhost:4173/` (si tu testes `npm run preview`) |

Remplace `UTILISATEUR` et `NOM-DU-REPO` par tes valeurs réelles (barre d'adresse de ton site une fois publié).
L'application envoie elle-même l'adresse de retour (`origine + sous-chemin`, voir `appUrl()` dans
`src/lib/supabase.ts`) : elle doit figurer exactement dans cette liste, sinon Supabase renvoie vers la *Site URL*.

Les liens de confirmation et de réinitialisation ramènent sur la page d'accueil de l'application, avec les jetons
dans le fragment `#…` (flux « implicite ») : aucun routeur ni page `404.html` n'est nécessaire sur GitHub Pages, et
le lien fonctionne même ouvert sur un autre appareil que celui de la demande. Un lien de réinitialisation ouvre
l'écran « Nouveau mot de passe » ; un lien expiré affiche un message sur l'écran de connexion.

E-mails : le service intégré de Supabase est limité (quelques e-mails par heure), suffisant pour deux personnes.
Pour plus, configurer un SMTP dans **Authentication → Emails → SMTP Settings**.

## Publication sur GitHub Pages

### 1. Envoyer le projet sur GitHub

Créer un dépôt vide sur <https://github.com/new> (sans README), puis :

```sh
git init -b main
git add .
git commit -m "Qirāʾa : comptes Supabase et déploiement GitHub Pages"
git remote add origin https://github.com/UTILISATEUR/NOM-DU-REPO.git
git push -u origin main
```

`.gitignore` exclut `node_modules`, `dist`, `.env` et `.env.*` (sauf `.env.example`).

### 2. Activer Pages et renseigner la configuration

1. Dépôt → **Settings → Pages → Build and deployment → Source : GitHub Actions**.
2. Dépôt → **Settings → Secrets and variables → Actions → onglet Variables → New repository variable** (ou variables de l’environnement `github-pages`, dans **Settings → Environments**) :
   - `VITE_SUPABASE_URL` = l'URL du projet ;
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = la clé publishable.

   Ce sont des **variables**, pas des secrets : elles finissent de toute façon dans le JavaScript public.
   Aucun secret n'est nécessaire au déploiement.
3. Onglet **Actions** → *Déploiement GitHub Pages* → **Run workflow** (ou pousser un commit sur `main`).

Le workflow (`.github/workflows/deploy.yml`) : `npm ci` → `npm test` (y compris les tests RLS) → contrôle des
variables → `npm run build` avec le sous-chemin donné par GitHub (`/NOM-DU-REPO/`) → publication. Si une étape
échoue, rien n'est publié. Ensuite, chaque push sur `main` redéploie.

Le sous-chemin est lu dans la variable `BASE_PATH` (fournie par `actions/configure-pages`) ; en local, la racine
`/` est utilisée. Avec un domaine personnalisé, il devient `/` automatiquement ; penser alors à mettre à jour les
URL dans Supabase.

## Sécurité

- Le navigateur n'a que la **clé publishable**. L'application refuse de démarrer si on lui donne une clé secrète.
- Toutes les tables ont la **RLS activée** ; chaque politique compare `auth.uid()` à `user_id`. `user_id` vaut
  `auth.uid()` par défaut et la vérification `with check` empêche d'écrire au nom d'un autre compte. Le rôle `anon`
  (non connecté) n'a aucun droit. Les historiques ne sont pas modifiables après coup. Supprimer un compte
  (**Authentication → Users**) supprime ses données (`on delete cascade`).
- Le filtre `user_id` dans les requêtes du client n'est qu'une optimisation : l'isolation est imposée par la base.

### Tests de sécurité

- `npm run test:security` : applique la vraie migration à PostgreSQL (PGlite) après avoir reproduit ce que fournit
  Supabase (schéma `auth`, `auth.uid()` lisant les claims du JWT, rôles `anon` et `authenticated` avec les droits
  par défaut de Supabase). Deux comptes, plus l'accès anonyme : lecture, filtre sur l'identifiant de l'autre,
  insertion au nom de l'autre, upsert, modification, suppression, transfert de propriété, contraintes. Ces tests
  vérifient la migration, **pas** la configuration du projet hébergé.
- `npm run check:rls` : à lancer **contre ton projet Supabase**, une fois la migration appliquée. Crée deux comptes
  de test dans l'application (ou **Authentication → Users → Add user**, avec *Auto Confirm*), puis :

  ```sh
  VITE_SUPABASE_URL=… VITE_SUPABASE_PUBLISHABLE_KEY=… \
  RLS_A_EMAIL=… RLS_A_PASSWORD=… RLS_B_EMAIL=… RLS_B_PASSWORD=… \
  npm run check:rls
  ```

  Le script se connecte comme un navigateur (clé publishable), tente de lire, créer, modifier et supprimer les
  données de l'autre compte et d'accéder sans connexion, puis supprime ses lignes de test.

### Tester l'isolation à la main

1. Navigateur A : créer le compte 1, vérifier deux phrases, choisir « Translittération précise ».
2. Navigation privée (ou autre navigateur) : créer le compte 2. Il doit démarrer à la phrase 1, profil « Simplifié ».
3. Dans le dashboard Supabase, **Table Editor** montre les lignes des deux comptes (le dashboard
   contourne la RLS) ; l'application, elle, ne montre que celles du compte connecté.
4. Se reconnecter au compte 1 : progression et profil retrouvés.

## Organisation du code

```
data/tanzil/quran-uthmani.txt   texte Tanzil complet, verbatim (source de vérité, utilisé par les tests)
src/data/corpus.ts              exercices : identifiant, texte arabe, référence de lecture, notes
src/translit/                   inventaire des sons, profils de translittération, rendu des références
src/compare/                    normalisation de la saisie, alignement et diagnostic
src/revision/                   fiche de conjugaison (seule source des formes), vérification, sessions
src/state/                      réglages et progression (état de l'interface)
src/auth/                       session Supabase, écrans de connexion, retours de liens e-mail
src/sync/                       accès aux tables, file d'envoi, migration de l'ancien stockage
src/lib/supabase.ts             configuration et client Supabase
src/Root.tsx                    enchaînement : configuration → session → chargement → application
src/components/                 interface (exercice, révision, paramètres, compte)
supabase/migrations/            schéma SQL et politiques RLS
supabase/tests/                 tests RLS sur PostgreSQL
scripts/check-rls.mjs           vérification de l'isolation sur le projet hébergé
.github/workflows/deploy.yml    tests, build et publication GitHub Pages
```

Quatre éléments sont séparés côté lecture :

1. **le texte arabe original** (`arabic`), copié tel quel de Tanzil ;
2. **la lecture de référence** (`reading`), notée dans un inventaire phonémique fixe, indépendant de tout profil ;
3. **le profil de translittération**, qui associe à chaque son une ou plusieurs graphies ;
4. **les règles de normalisation** de la saisie.

L'affichage de la référence et la vérification utilisent les mêmes graphies : un test garantit que la référence
affichée est jugée juste dans chaque profil.

## Entraînement sur tout le Coran

Dans l'écran d'entraînement, une barre discrète au-dessus du verset permet de choisir une sourate (114, avec
recherche par numéro, nom français, nom arabe ou translittération) et de passer au verset précédent ou suivant.
Choisir une sourate fait passer l'exercice verset par verset ; « Revenir à la sélection d'exercices » retrouve la
série habituelle là où elle en était.

- **Texte** : le fichier Tanzil du dépôt, utilisé tel quel (vérifié ligne à ligne par les tests), chargé à la
  demande dans un fichier séparé (≈ 290 Ko compressés) : changer de verset ne fait aucune requête. La basmala que
  Tanzil place en tête du verset 1 n'est pas comptée dans le verset, comme dans le corpus.
- **Sourates** (`src/data/surahs.ts`) : noms arabes, translittérations Tanzil et nombres de versets tirés des
  métadonnées Tanzil (Quran Metadata 1.0, CC BY 3.0), recoupés avec le texte ; translittération précise et nom
  français ajoutés.
- **Navigation** : précédent désactivé au verset 1 ; au dernier verset, suivant passe au verset 1 de la sourate
  suivante ; désactivé à la fin du Coran.
- **Lecture de référence** (`src/quran/practice.ts`) : celle du corpus écrite à la main si le verset y figure (ou
  ses segments mis bout à bout) ; sinon une lecture **générée automatiquement** à partir du texte vocalisé
  (`src/translit/autoReading.ts`, règles de Ḥafṣ), signalée comme telle après vérification. Le générateur retrouve
  à l'identique les 35 lectures écrites à la main, produit une lecture valide pour les 6236 versets, et ces lectures
  sont jugées justes dans chaque profil. Il n'a pas été relu verset par verset : quelques particularités rares
  (imāla de 11:41, išmām de 12:11, tashīl de 41:44) ne sont pas rendues, et les durées de madd, la ġunna et
  l'iḫfāʾ ne sont pas notées (comme pour le corpus).
- **Enregistrement** : verset en cours dans les réglages du compte (`trainingVerse`, colonne `settings` de
  `user_settings`), résultats dans la progression (`reading_progress`), tentatives dans `reading_attempts`. Aucune
  migration nécessaire.

## Révision : le présent

Entrée « Révision » de l'en-tête. Fiche du présent (الفِعْلُ الْمُضَارِعُ) sur le modèle فَعَلَ / يَفْعَلُ,
14 formes, avec code couleur dans les mots (rouge : pronom, anthracite : radical, vert : préfixe et terminaison,
bleu : français), puis exercice en deux modes (retrouver le verbe, retrouver le pronom).

Comparaison d'une forme saisie : vocalisation complète exigée ; espaces, tatwīl, caractères invisibles et
composition Unicode ignorés. Si seules les voyelles diffèrent, la réponse est fausse mais le retour le précise.
Pour un pronom, tout pronom dont la forme est identique est accepté (تَفْعَلُ : أَنْتَ ou هِيَ).

## Alphabet

Entrée « Alphabet » de l'en-tête. Données : `src/alphabet/letters.ts`.

- Les 28 lettres dans l'ordre hijāʾī (ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي), avec nom
  translittéré, nom arabe vocalisé et indication de prononciation. Le son et la précision de prononciation viennent
  de la table des lettres des paramètres (`src/translit/letters.ts`) : une seule description par lettre.
- Seul le caractère de base (bloc Unicode arabe, jamais une forme de présentation) est stocké ; les formes
  initiale, médiane et finale sont construites avec le tatwīl (ـ) et dessinées par la police. Les six lettres qui
  ne se lient pas à la suivante (ا د ذ ر ز و) n'ont ni forme initiale ni forme médiane : « — / n'existe pas ».
- Les tests comparent chaque lettre à une table de référence indépendante (points de code Unicode et type de
  jonction d'ArabicShaping.txt).
- Entraînement (`src/alphabet/flashcards.ts`) : flashcards en continu, sans score ni fin. Une lettre tirée au
  hasard parmi les 28, sous une de ses formes valides tirée au hasard (100 cartes : jamais de forme initiale ou
  médiane pour ا د ذ ر ز و), jamais deux fois de suite la même lettre sous la même forme. « Afficher la réponse »
  révèle le nom translittéré, le nom arabe et la forme ; « Suivant » n'apparaît qu'après.
- Pas de suivi par lettre : ni statut, ni score. L'ancien suivi (table `alphabet_progress`) n'est plus utilisé.

## Lectures de référence

Elles ne sont **pas** dérivées automatiquement du texte arabe lettre par lettre. Chacune a été écrite pour la
lecture de **Ḥafṣ ʿan ʿĀṣim**, en lisant le segment **à la pause (waqf)**, puis recoupée avec la translittération
anglaise publiée par Tanzil (`en.transliteration`, utilisée uniquement comme contrôle, pas redistribuée).

Format (détaillé dans `src/translit/reference.ts`) :

```
bismi llāhi r-raḥmāni r-raḥīm[i]
wa-lā ʾana ʿābidu{m|n} mā ʿaba{t|d}tum
```

- consonne écrite deux fois = šadda ; macron = voyelle longue ;
- `[…]` = terminaison prononcée seulement sans pause (acceptée selon les réglages) ;
- `{x|y}` = variantes acceptées, la première est la lecture principale. Elles servent quand l'écriture uthmanie
  note une assimilation (yakul lahū) ou qu'une voyelle longue s'abrège dans la liaison (fi l-ʿuqad), la forme
  orthographique restant acceptée.

Les références notent consonnes, voyelles, durée, gémination, élision de l'alif waṣla et assimilations marquées
par la šadda. Elles **ne notent pas** les durées de madd, la ġunna, l'iḫfāʾ ni la qalqala : ces points ne sont donc
pas vérifiés.

### Ajouter un exercice

Ajouter une entrée dans `src/data/corpus.ts` :

```ts
{
  id: '97:1',            // « sourate:verset », ou « sourate:verset:début-fin » pour un segment
  surah: 97,
  ayah: 1,
  words: [1, 5],         // mots du verset (à partir de 1, sans la basmala préfixée par Tanzil)
  arabic: '…',           // copie exacte de ces mots dans data/tanzil/quran-uthmani.txt
  reading: '…',
  notes: ['…'],          // facultatif, affiché après vérification
}
```

puis le nom de la sourate dans `src/data/surahs.ts`. `npm test` vérifie que le texte arabe correspond exactement à
la source, que la lecture est bien formée et qu'elle est jugée juste dans chaque profil. La lecture elle-même doit
être relue par quelqu'un de compétent : aucun test ne peut garantir qu'elle est juste.

## Comparaison

La saisie n'est pas convertie en sons (ce serait ambigu : `th` peut valoir ث ou t + h). Elle est alignée
directement sur la suite des sons attendus, par programmation dynamique : chaque son peut consommer l'une de ses
graphies du profil, et le coût minimal donne le nombre d'écarts.

- Toujours ignorés : espaces, tirets, soulignés, casse (désactivable), différences de composition Unicode.
- Facultatifs (réglables) : hamza en début de mot, terminaison de liaison en fin de segment.
- Comptés comme écarts : šadda oubliée, voyelle de mauvaise durée, son remplacé, manquant ou en trop.
- Verdict : *juste* sans écart, *presque* jusqu'à 25 % de sons en écart, *à reprendre* au-delà.

Limites :

- l'alignement localise les écarts de façon fiable, mais leur nature (« son différent », « durée »…) reste
  indicative quand plusieurs explications sont possibles ;
- si un profil donne la même graphie à deux sons (le profil simplifié pour s/ṣ, d/ḍ, t/ṭ, z/ẓ), ces sons ne sont
  pas distingués ; les paramètres le signalent ;
- une graphie ne peut pas être coupée par un séparateur : `k-h` se lit k + h, jamais ḫ ;
- une seule lecture (Ḥafṣ) est prise en compte.

## Profils

- **Simplifié francophone** : tout au clavier AZERTY. 3 pour ع, 7 pour ح (usage « arabizi »), ch pour ش, voyelles
  longues doublées. Les emphatiques ne sont volontairement pas distinguées. Convention pratique, pas une norme.
- **Translittération précise** : proche de la norme DIN 31635 (ḥ ṣ ḍ ṭ ẓ ṯ ḏ š ḫ ġ ʿ ʾ ā ī ū). Les digrammes
  th, kh, sh, dh, gh et le circonflexe (â) sont acceptés en saisie.
- **Personnalisé** : graphies libres, sur la base de l'un des deux profils. Plusieurs graphies par son,
  séparées par des virgules ; la première sert à l'affichage.

## Sources et licences

- **Texte coranique** : *Tanzil Quran Text* (Uthmani, version 1.1), © 2007-2026 Tanzil Project, licence Creative
  Commons Attribution 3.0, <https://tanzil.net>. Copie verbatim autorisée, modification interdite : le fichier
  `data/tanzil/quran-uthmani.txt` est conservé intact, avec sa notice de licence, et les exercices en sont des
  extraits non modifiés (vérifié par les tests). Mises à jour : <http://tanzil.net/updates/>.
- **Polices** (intégrées via les paquets Fontsource, sans appel à un service tiers), toutes sous SIL Open Font License 1.1 :
  Amiri Quran (The Amiri Project Authors) pour l'arabe, Newsreader (Production Type) pour les transcriptions,
  Inter (Rasmus Andersson) pour l'interface.

Les références de lecture sont un support d'entraînement : elles ne remplacent ni l'écoute d'un récitateur ni
l'enseignement d'un professeur.
