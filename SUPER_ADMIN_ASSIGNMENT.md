# Attribuer le premier rôle `super_admin`

L’attribution du premier super-administrateur est une action privilégiée : elle doit être faite une seule fois avec le compte de service Firebase Admin validé. Ensuite, l’endpoint `POST /api/admin/users/:uid/claims` permet au super-administrateur de gérer les rôles sans exposer la clé de service.

## Pré-requis

Créer d’abord le compte utilisateur principal dans **Firebase Console → Authentication → Users** avec le fournisseur Email/Password activé. Relever son **UID** dans la fiche utilisateur. La clé `FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON` doit être présente dans le serveur ; elle a déjà été validée dans ce projet.

## Commande de bootstrap

Depuis la racine du projet, exécuter :

```bash
pnpm firebase:claims -- FIREBASE_UID super_admin
```

Pour un administrateur d’agence ultérieur :

```bash
pnpm firebase:claims -- FIREBASE_UID agency_admin agency-kinshasa
```

Le compte `super_admin` n’a pas d’`agencyId` afin d’éviter de limiter son périmètre. Après attribution, le compte doit se reconnecter ou toucher **Actualiser mes autorisations** afin de forcer l’émission d’un token contenant les nouveaux claims. Firebase indique que les claims personnalisés sont attribués par un environnement serveur privilégié, sont présents dans les ID tokens et doivent être validés avant de traiter une requête. [1]

## Contrôle après attribution

Le rôle attendu apparaît dans Réglages, sous la forme `super_admin · Périmètre global`. Vérifier ensuite que le compte peut appeler l’endpoint d’administration, tandis qu’un `agency_admin` ne peut gérer que le périmètre de son agence.

## Référence

[1] [Firebase — Control Access with Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)
