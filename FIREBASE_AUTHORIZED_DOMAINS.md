# Autoriser le domaine Web GlobalLogix dans Firebase

L’erreur `auth/unauthorized-domain` provient de Firebase Authentication lorsque le domaine affichant la connexion Google n’a pas été déclaré dans le projet Firebase. Ce réglage est externe au code et ne doit pas être contourné par une clé ou une redirection non autorisée.

## Étapes

Ouvrez Firebase Console, sélectionnez le projet **globallogix-74286**, puis allez à **Authentication → Settings → Authorized domains**. Ajoutez le domaine de production GlobalLogix sans protocole ni chemin :

```
globallogix-j5jxfyba.manus.space
```

Conservez `localhost` pour les essais locaux. Ajoutez également tout futur domaine personnalisé de l’éditeur, par exemple `app.globallogix.com`, avant de l’utiliser. Ne saisissez ni adresse e-mail complète, ni URL avec `https://`, ni chemin `/agency/...` dans cette liste.

Après enregistrement, rechargez l’application Web et utilisez une adresse e-mail au format `nom@domaine.tld` dans la demande d’agence. L’application affiche désormais des messages distincts pour le domaine non autorisé et l’adresse e-mail incorrecte.
