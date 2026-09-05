# Inscription d’agence avec compte Google

L’inscription Google permet à un futur administrateur d’agence de s’authentifier avec son adresse Gmail, sans créer de mot de passe GlobalLogix. Elle ne lui donne **aucun rôle ni accès aux données** tant que GlobalLogix n’a pas approuvé sa demande et attribué explicitement le périmètre de son agence.

| Étape | Responsable | Résultat attendu |
|---|---|---|
| Activer le fournisseur Google | Propriétaire Firebase | Firebase Console → Authentication → Sign-in method → Google activé. |
| Créer la demande d’agence | Futur agency_admin | Identité Gmail vérifiée et informations générales de l’agence recueillies. |
| Examiner et approuver | super_admin GlobalLogix | Création de l’agence et attribution du Custom Claim `agency_admin` avec le seul `agencyId` concerné. |
| Actualiser la session | Nouvel agency_admin | Accès à son espace brandé ; les autres agences restent invisibles. |

> L’adresse Gmail et l’adresse opérationnelle de l’agence sont traitées séparément. La première identifie l’administrateur ; la seconde sert aux communications publiques de l’agence.

Le fournisseur Google doit être activé dans Firebase avant le premier essai. La documentation Firebase indique que l’activation se fait dans **Authentication → Sign-in method → Google**.[1]

## Contrôles appliqués

La demande ne crée pas directement d’agence active, ne divulgue aucun identifiant Meta, et ne permet pas de choisir soi-même le rôle `super_admin`. L’approbation par le super administrateur est nécessaire avant la génération du lien d’agence et l’accès opérationnel. Pour les builds Android/iOS, les clients OAuth et empreintes de signature doivent être configurés dans le projet Firebase/Google avant de proposer la connexion Google native.[2]

## Références

[1]: https://firebase.google.com/docs/auth/web/google-signin "Firebase Authentication — Google Sign-In"
[2]: https://docs.expo.dev/guides/google-authentication/ "Expo — Google authentication"
