# Sources vérifiées — Firebase, FCM v1 et APNs

La documentation Firebase confirme que les Custom Claims doivent être attribués dans un environnement serveur privilégié avec Firebase Admin, que les requêtes authentifiées doivent vérifier l’ID token et que le payload de claims doit être JSON-sérialisable et inférieur à 1 000 octets. Les clients obtiennent les nouveaux claims à l’émission du prochain ID token ou après rafraîchissement forcé. [1]

La documentation Expo indique que FCM v1 Android requiert un JSON de compte de service chargé dans les identifiants de build, ainsi que `google-services.json` référencé par `android.googleServicesFile`. Une API key Android restreinte doit autoriser les API FCM Registration et Firebase Installations, et son empreinte SHA-1 doit correspondre à la clé de signature Play si Google Play App Signing est utilisé. [2]

La documentation Expo indique aussi que le `projectId` attribue l’Expo Push Token au projet ; les notifications distantes doivent être testées sur appareil physique et non dans Expo Go Android récent. [3] Apple rappelle que chaque application reçoit un token APNs distinct par appareil, qui doit être transmis de manière sécurisée au serveur et actualisé à chaque lancement. [4]

## Références

[1] [Firebase — Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)

[2] [Expo — FCM v1 credentials](https://docs.expo.dev/push-notifications/fcm-credentials/)

[3] [Expo — Push notification setup](https://docs.expo.dev/push-notifications/push-notifications-setup/)

[4] [Apple — Registering your app with APNs](https://developer.apple.com/documentation/usernotifications/registering-your-app-with-apns)
