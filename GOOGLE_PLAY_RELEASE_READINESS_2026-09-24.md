# Préparation Google Play — GlobalLogix Mobile

## Conclusion

GlobalLogix doit être livré au format **Android App Bundle (`.aab`)** avec le package stable `com.app.globallogixmobile`. Depuis le 31 août 2026, une nouvelle application ou une mise à jour Android mobile doit cibler **Android 16 / API 36 ou supérieur** pour être soumise à Google Play.[1]

La publication commerciale ne doit pas être automatisée directement vers la production. La première livraison sera préparée comme une release **brouillon sur la piste de test interne**, afin de permettre les contrôles Play Console, la validation des déclarations et les tests sur appareils avant promotion.

## Exigences de build et soumission

EAS Submit exige un compte Google Play Developer, une application créée dans Play Console et une clé de compte de service Google autorisée, chargée dans les identifiants EAS sans être ajoutée au dépôt. Expo confirme qu’un nouveau produit Google Play doit être soumis au format `.aab`; un profil qui force `android.buildType: apk` sert aux tests d’installation, mais ne peut pas être soumis au Play Store.[2]

Le profil `production` doit donc produire un AAB, utiliser l’environnement EAS `production`, incrémenter automatiquement le `versionCode` distant et disposer d’un profil `submit.production` limité à la piste interne avec le statut `draft`. Le profil `production-apk` peut être conservé séparément pour les essais sur téléphone.

## Confidentialité et suppression de compte

Google Play exige que toute application permettant de créer un compte fournisse à la fois un parcours de suppression **dans l’application** et une ressource Web où l’utilisateur peut demander la suppression de son compte et des données associées.[3]

Tous les développeurs doivent remplir le formulaire **Data safety**. La déclaration doit couvrir les données collectées ou partagées par l’application et par ses SDK tiers. Même une application déclarant ne collecter aucune donnée doit remplir le formulaire et fournir une politique de confidentialité.[4]

GlobalLogix traite notamment des identifiants Firebase, des adresses e-mail, des numéros de téléphone/WhatsApp, des données d’agence, des données de colis, des positions et événements logistiques, des jetons de notification et, selon l’activation des prestataires, des métadonnées WhatsApp et de paiement. La fiche Play doit refléter le comportement réellement activé en production et non les fonctionnalités seulement préparées.

## Accès à la production

Si le compte développeur est un compte personnel créé après le 13 novembre 2023, Google impose un test fermé avec au moins **12 testeurs inscrits sans interruption pendant 14 jours** avant de pouvoir demander l’accès à la production. La piste interne reste recommandée pour la première livraison, mais elle ne remplace pas ce test fermé lorsqu’il est exigé.[5]

## Références

[1]: https://support.google.com/googleplay/android-developer/answer/11926878 "Target API level requirements for Google Play apps"
[2]: https://docs.expo.dev/submit/android/ "Submit to the Google Play Store with EAS Submit"
[3]: https://support.google.com/googleplay/android-developer/answer/13327111 "Understanding Google Play’s app account deletion requirements"
[4]: https://support.google.com/googleplay/android-developer/answer/10787469 "Provide information for Google Play's Data safety section"
[5]: https://support.google.com/googleplay/android-developer/answer/14151465 "App testing requirements for new personal developer accounts"
