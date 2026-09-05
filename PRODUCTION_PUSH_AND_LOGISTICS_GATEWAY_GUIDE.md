# Guide de production — Notifications et gateway logistique

## Configuration FCM v1 pour Android

Le projet doit garder l’identifiant Android `com.app.globallogixmobile` stable. Dans Firebase Console, ajouter ou vérifier l’application Android avec cet identifiant, puis télécharger `google-services.json` depuis les paramètres du projet. Placer le fichier à la racine du projet et déclarer son chemin dans `android.googleServicesFile` dans `app.config.ts`. Ce fichier peut être versionné car il contient des identifiants publics ; il ne remplace pas la clé privée du compte de service. [1]

Ensuite, dans **Firebase Console → Project settings → Service accounts**, générer un compte de service dédié aux notifications et stocker son JSON uniquement dans un coffre de secrets. Dans le gestionnaire d’identifiants de build Expo, choisir **Android → production → Google Service Account → FCM V1**, puis charger ce JSON. Ne pas réutiliser cette clé dans le bundle mobile ni dans le dépôt. [1]

| Vérification Android | Action attendue |
|---|---|
| `google-services.json` | Le fichier est présent et référencé par `android.googleServicesFile`. |
| API key restreinte | Autoriser FCM Registration API et Firebase Installations API si la clé est restreinte. |
| Signature Play | Utiliser la SHA-1 de la clé de signature Play, et non la clé d’upload, si Play App Signing est activé. |
| Test réel | Installer une build de développement ou une build de publication sur appareil physique, activer les alertes depuis Réglages et envoyer un événement important. |

## Configuration APNs pour iOS

Dans Apple Developer, créer ou vérifier l’App ID correspondant à `com.app.globallogixmobile`, puis activer la capacité **Push Notifications**. Créer une clé APNs (`.p8`) dans **Keys**, en notant le **Key ID** et le **Team ID** ; le fichier `.p8` ne peut être téléchargé qu’une seule fois et doit être stocké dans un coffre sécurisé. Charger ensuite cette clé APNs dans les identifiants iOS du projet Expo/EAS pour l’environnement de production. Apple exige que l’App ID soit activé pour les push notifications et que l’application transmette le token appareil au fournisseur de notifications. [2]

> Chaque paire application–appareil reçoit son propre token APNs. Ne pas le mettre en cache uniquement côté client : le terminal peut être restauré, remplacé ou réinstallé. Le mobile doit le réenregistrer auprès de l’API lorsqu’il change. [2]

Vérifier que le plugin `expo-notifications` est présent, que la build est produite après la configuration des credentials et que le test est effectué sur un iPhone physique. Le `projectId` Expo doit être disponible au moment de l’obtention de l’Expo Push Token. Les notifications distantes ne sont pas prises en charge par Expo Go Android récent. [3]

## Raccorder la gateway aux données logistiques réelles

Le fichier `server/realtime.ts` contient aujourd’hui un registre de démonstration `knownShipments`. Le remplacer par une couche `ShipmentRepository` qui fait autorité sur l’agence propriétaire de l’expédition, son dernier état et son numéro de séquence. La gateway ne doit jamais accepter un `agencyId` fourni par le client comme preuve d’autorisation.

| Étape | Implémentation recommandée |
|---|---|
| 1. Modèle source | Créer une table `shipments` avec `id`, `agencyId`, `trackingNumber`, `status`, `progress`, `distanceRemainingKm`, `eta`, `currentPosition`, `lastTelemetryAt` et `sequence`. Indexer `(agencyId, id)` et `trackingNumber`. |
| 2. Ingestion | Faire recevoir les signaux d’un TMS, ERP, GPS ou webhook dans un endpoint serveur authentifié. Valider le schéma et traduire les identifiants externes vers une expédition locale. |
| 3. Transaction | Dans une transaction, vérifier `agencyId`, refuser une séquence ancienne ou dupliquée, mettre à jour `shipments`, écrire `shipment_events`, puis publier l’événement après validation. |
| 4. Diffusion | Appeler `publishShipmentUpdate` avec l’événement persistant. La gateway filtre déjà les sockets par claims Firebase et abonnement autorisé. |
| 5. Alertes | Définir des règles explicites : retard, passage douane, ETA dépassée ou arrivée. Envoyer une push seulement après écriture réussie et limiter les doublons par `eventId`. |
| 6. Reprise | Au retour d’une app au premier plan, recharger l’état REST/HTTP le plus récent puis reprendre le flux WebSocket. Cela protège contre les événements perdus hors ligne. |

Pour que les connexions WebSocket restent actives en production, déployer la gateway sur une instance persistante. Deux solutions sont possibles : une instance gérée persistante, adaptée à une gateway Node légère et facturée à l’usage avec un plafond d’environ 37,50 USD/mois à pleine utilisation, auquel s’applique le crédit mensuel de 10 USD ; ou une plateforme temps réel externe si les besoins de volume, de multi-région ou de messages dépassent une instance légère. Le premier choix simplifie l’exploitation, le second peut mieux s’adapter à une charge très élevée. [4]

## Références

[1] [Expo — Identifiants FCM v1](https://docs.expo.dev/push-notifications/fcm-credentials/)

[2] [Apple — Registering your app with APNs](https://developer.apple.com/documentation/usernotifications/registering-your-app-with-apns)

[3] [Expo — Push notification setup](https://docs.expo.dev/push-notifications/push-notifications-setup/)

[4] [Manus — Hébergement persistant : référence de capacité et coût](/home/ubuntu/skills/persistent-computing/references/reserved-hosting-reference.md)
