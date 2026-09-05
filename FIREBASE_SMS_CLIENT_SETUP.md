# Authentification client par SMS Firebase

Le portail client GlobalLogix utilise Firebase Phone Authentication dans une **build native Android ou iOS**, et non dans Expo Go ni dans le navigateur. Le client s’inscrit avec son numéro WhatsApp au format international E.164 ; l’application le vérifie par SMS, puis le serveur associe ce numéro unique à un seul compte client.

Avant le test sur appareil réel, activez le fournisseur **Phone** dans Firebase Authentication. Pour Android, suivez la configuration Firebase Phone Auth et vérifiez les empreintes d’application requises. Pour iOS, téléchargez et configurez `GoogleService-Info.plist`, activez les réglages de vérification d’application et générez une nouvelle build.

Les numéros de test et codes de test peuvent être définis dans Firebase Authentication afin de valider le parcours sans envoyer de SMS. Le numéro de téléphone sert à la vérification et au rattachement des colis ; il ne doit pas être affiché en clair hors du portail du client.

## Références

- [Expo — Using Firebase](https://docs.expo.dev/guides/using-firebase/)
- [React Native Firebase — Phone Authentication](https://rnfirebase.io/auth/phone-auth)
- [React Native Firebase — Authentication](https://rnfirebase.io/auth/usage)
