# GlobalLogix Mobile — Firebase, temps réel et alertes

## Ce qui est intégré

La connexion mobile s’appuie désormais sur **Firebase Authentication** avec l’adresse e-mail et le mot de passe. L’application observe les changements de token, lit les Custom Claims `role`, `agencyId` et `disabled`, puis actualise les claims à la demande depuis Réglages. Le serveur vérifie chaque token Firebase avant l’enregistrement d’un terminal push ou l’ouverture du canal WebSocket.

| Rôle | Périmètre | Utilisation mobile |
|---|---|---|
| `super_admin` | Toutes les agences | Administration des claims et visibilité globale. |
| `agency_admin` | Une `agencyId` | Gestion et suivi des expéditions de son agence. |
| `staff` | Une `agencyId` | Consultation et actions limitées à son agence. |
| `viewer` | Une `agencyId` | Consultation seulement. |

## Configuration Firebase initiale

Activer **Email/Password** dans Firebase Console, créer les utilisateurs, puis attribuer le premier rôle. Cette activation est indispensable : si elle est absente, Firebase renvoie `PASSWORD_LOGIN_DISABLED`, la connexion par mot de passe est impossible et le parcours de réinitialisation ne peut pas être validé. Le script suivant s’exécute sur le serveur avec `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` configuré :

```bash
pnpm tsx server/scripts/assign-firebase-claims.ts FIREBASE_UID super_admin
pnpm tsx server/scripts/assign-firebase-claims.ts FIREBASE_UID agency_admin agency-kinshasa
```

Après une modification de rôle, le mobile doit utiliser **Actualiser mes autorisations** ou se reconnecter. Le token précédent reste valable jusqu’à son renouvellement ; le rafraîchissement forcé récupère le nouveau claim.

En cas de non-réception durable du courriel Firebase, un opérateur serveur peut définir un mot de passe temporaire robuste avec `pnpm firebase:set-super-admin-password -- adresse@email.com`. Le mot de passe doit être fourni via un canal sécurisé, ne doit jamais être inscrit dans le dépôt, et doit être remplacé par l’utilisateur après sa première connexion.

L’endpoint de gestion HTTP `POST /api/admin/users/:uid/claims` applique la même règle, mais exige un ID token appartenant déjà à un `super_admin`. Il évite ainsi qu’un administrateur d’agence s’accorde lui-même des droits globaux.

## WebSocket sécurisé

Le client ouvre `wss://…/api/realtime`, envoie son ID token dans le premier message `authenticate`, puis s’abonne aux identifiants d’expédition autorisés. La gateway limite le payload, impose une fenêtre d’authentification, filtre les abonnements et les publications par agence, maintient le canal par heartbeat et le client applique une reconnexion exponentielle avec jitter.

Le code de démonstration conserve une liste d’expéditions GlobalLogix connue du serveur. Pour des données de production, remplacer cette liste par une requête de base ou une API métier qui associe irréfutablement chaque expédition à son `agencyId` avant toute diffusion.

## Notifications push

L’écran Réglages demande l’autorisation, crée le canal Android **Mises à jour d’expédition**, récupère un Expo Push Token et l’enregistre au serveur avec un ID token Firebase. Les mises à jour marquées importantes, notamment les retards ou passages en douane, sont envoyées uniquement aux terminaux liés à la même agence.

Les alertes distantes doivent être testées sur **un appareil physique** et dans une build de développement ou publiée. Elles ne fonctionnent pas dans Expo Go Android avec les SDK Expo récents. La configuration Android GlobalLogix utilise désormais `google-services.json` avec le package `com.app.globallogixmobile` et une clé de compte de service FCM v1 validée. Une nouvelle build Android est nécessaire pour embarquer cette configuration.

Les notifications iOS restent volontairement en attente tant qu’un compte Apple Developer Program n’est pas disponible. Dès son obtention, créer une clé APNs `.p8`, récupérer son Key ID et le Team ID Apple, puis les ajouter aux identifiants iOS EAS avant de reconstruire l’application.

## Validation et exploitation

Les tests projet valident l’accès OAuth du compte de service Firebase, le moteur de suivi et le protocole WebSocket. Exécuter :

```bash
pnpm test
pnpm check
pnpm lint
```

Ne jamais exposer le JSON Firebase Admin dans une variable `EXPO_PUBLIC_*`, un bundle mobile ou un dépôt. Conserver la clé uniquement côté serveur et la faire tourner immédiatement si elle a été divulguée.
