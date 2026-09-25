# Guide de collecte des identifiants de notifications de production

Ce guide permet de préparer les notifications push Android et iOS de **GlobalLogix Mobile**. La configuration déjà présente dans l’application gère la permission utilisateur, le canal Android et le token Expo ; les étapes ci-dessous ajoutent les identifiants de distribution nécessaires aux builds de production.

> Ne copiez jamais une clé privée ou un fichier de compte de service dans une conversation, un dépôt Git ou un e-mail. Les champs sécurisés de l’application seront utilisés dès que les éléments auront été récupérés.

| Élément | Plateforme | Où le trouver | Sensibilité |
|---|---|---|---|
| `google-services.json` | Android | Firebase Console | Configuration publique de l’application |
| Clé de compte de service FCM v1 (JSON) | Android | Firebase Console → Comptes de service | **Secret** |
| Clé APNs `.p8` | iOS | Apple Developer → Keys | **Secret** |
| Key ID APNs | iOS | Liste Apple Developer Keys | Identifiant |
| Team ID Apple | iOS | Apple Developer → Membership | Identifiant |
| EAS Project ID (UUID) | Android/iOS | Expo dashboard → Project settings | Identifiant |

## 1. Préparer Android avec Firebase Cloud Messaging v1

Dans [Firebase Console](https://console.firebase.google.com/), ouvrez le projet **globallogix-74286**, puis allez dans **Paramètres du projet → Comptes de service**. Cliquez sur **Générer une nouvelle clé privée**, puis confirmez le téléchargement. Le fichier JSON généré est la clé de compte de service FCM v1 : conservez-le localement et ne le déposez pas dans le code source. Les instructions Expo demandent ensuite de le téléverser dans les identifiants Android du projet EAS.[1]

Vérifiez ensuite que l’application Android dont l’identifiant de package est **`com.app.globallogixmobile`** est enregistrée dans Firebase. Dans **Paramètres du projet → Général → Vos applications**, téléchargez le fichier **`google-services.json`** associé à cette application Android. Ce fichier doit être ajouté à la configuration du build, car il relie l’application Android à FCM.[1]

Dans l’interface Expo, ouvrez le projet, puis **Project settings → Credentials → Android → Service Credentials → FCM V1 service account key**. Ajoutez ou importez le JSON du compte de service. Si vous préférez le terminal sur votre ordinateur, la même opération est proposée par `eas credentials`, avec le chemin Android puis **Google Service Account**.[1]

Si l’application ne reçoit pas de token push Android après la configuration, contrôlez les restrictions de la clé API située dans `google-services.json`. Expo indique que **FCM Registration API** et **Firebase Installations API** doivent être autorisées lorsque la clé est restreinte.[1]

## 2. Préparer iOS avec Apple Push Notification service

Un abonnement **Apple Developer Program** actif est nécessaire. Dans [Apple Developer](https://developer.apple.com/account/), ouvrez **Certificates, Identifiers & Profiles → Identifiers**, sélectionnez l’App ID correspondant au bundle **`com.app.globallogixmobile`**, puis activez la capacité **Push Notifications** si elle ne l’est pas déjà.

Ouvrez ensuite **Keys**, cliquez sur **+**, donnez un nom explicite à la clé, par exemple `GlobalLogix APNs Production`, cochez **Apple Push Notifications service (APNs)**, puis enregistrez. Téléchargez immédiatement le fichier `.p8` : Apple ne permet généralement qu’un seul téléchargement. Relevez le **Key ID** affiché dans la liste des clés. La clé APNs ne doit jamais être versionnée ni partagée en clair. Apple précise qu’une clé APNs fonctionne aussi bien en développement qu’en production et qu’elle reste valide jusqu’à révocation.[2]

Pour récupérer le **Team ID**, ouvrez **Membership** dans Apple Developer, puis copiez la valeur affichée sous **Team ID**. Gardez également le Key ID de la clé créée ; ces deux identifiants accompagnent le contenu sécurisé du fichier `.p8` pour EAS/APNs.[3]

## 3. Récupérer l’identifiant Expo/EAS

Dans [expo.dev](https://expo.dev/), ouvrez ou créez le projet GlobalLogix Mobile, puis ouvrez **Project settings**. Copiez le **Project ID** au format UUID. Cet identifiant sert à lier les `ExpoPushToken` à votre projet, même si le compte Expo est renommé ou transféré.[4]

Si le projet n’est pas encore lié à EAS, connectez-vous d’abord avec `eas login`, exécutez `eas init` à la racine de l’application, puis relevez le Project ID créé. Une build de développement ou de production installée sur appareil physique est nécessaire pour tester les notifications distantes ; Expo Go Android ne les prend pas en charge avec les SDK Expo récents.[4]

## 4. Éléments à fournir ensuite

Lorsque vous les aurez, communiquez seulement les identifiants non sensibles ici : **APNs Key ID**, **Apple Team ID** et **EAS Project ID**. Pour le JSON FCM v1 et le contenu `.p8`, demandez les **champs sécurisés** afin de les saisir hors de la conversation. Une fois ces informations enregistrées, la configuration Android/iOS, les tests de token et la documentation de build pourront être finalisés.

## Références

[1]: https://docs.expo.dev/push-notifications/fcm-credentials/ "Expo — Add Android FCM V1 credentials"
[2]: https://developer.apple.com/help/account/capabilities/communicate-with-apns-using-authentication-tokens/ "Apple Developer — APNs authentication tokens"
[3]: https://docs.expo.dev/push-notifications/sending-notifications-custom/ "Expo — Send notifications with FCM and APNs"
[4]: https://docs.expo.dev/push-notifications/push-notifications-setup/ "Expo — Push notifications setup"
