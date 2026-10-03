# Fiche Google Play — GlobalLogix Mobile

## Informations de base

| Champ | Valeur proposée |
|---|---|
| Nom de l’application | GlobalLogix Mobile |
| Nom du package | `com.app.globallogixmobile` |
| Langue par défaut | Français (France) |
| Catégorie | Professionnel |
| Type | Application |
| Public cible | Professionnels et utilisateurs adultes, 18 ans et plus |
| Contient des annonces | Non |
| Site Web | https://globallogix-j5jxfyba.manus.space |
| Politique de confidentialité | https://globallogix-j5jxfyba.manus.space/privacy |
| Suppression de compte | https://globallogix-j5jxfyba.manus.space/account-deletion |
| Contact | info@telgroups.org |

## Description courte

> Suivi logistique multi-agence, alertes et visibilité colis en temps réel.

## Description complète

> **GlobalLogix Mobile** centralise les opérations logistiques des agences, équipes et clients sur Web, Android et iOS.
>
> Suivez les expéditions aériennes, maritimes et terrestres depuis une interface professionnelle. Les statuts, positions, délais et événements de transit sont synchronisés avec le périmètre de chaque agence.
>
> **Fonctionnalités principales**
>
> • Suivi multimodal et journal complet des événements de transit  
> • Centre d’exceptions pour les retards, blocages douaniers et risques opérationnels  
> • Espaces d’agence personnalisés avec logo, couleurs et lien public  
> • Portail client sécurisé avec authentification Firebase  
> • Partage de suivi par lien protégé et QR code  
> • Alertes locales et notifications push sur appareil compatible  
> • Exports CSV et PDF pour le pilotage et les rapports  
> • Console centralisée, contrôle des rôles et isolation stricte par agence  
> • Mode sombre et interface responsive adaptée aux téléphones et tablettes
>
> Les intégrations WhatsApp Business et de paiement sont activées uniquement lorsque l’agence ou l’éditeur fournit une configuration valide. Aucun message ou paiement réel n’est simulé comme actif.
>
> GlobalLogix donne aux professionnels une vue claire, sécurisée et exploitable de chaque mouvement logistique.

## Notes de version 1.0.0

> Première version commerciale de GlobalLogix Mobile. Cette version apporte le suivi logistique multi-agence, le portail client sécurisé, les alertes de colis, les rapports PDF/CSV, la personnalisation des agences, les contrôles RBAC Firebase, le test de notification locale et l’expérience Google Sign-In avec progression visible.

## Accès pour l’équipe de revue Google

L’application nécessite une authentification pour les écrans d’administration. Créez un compte de revue dédié avec le rôle `viewer` ou `agency_admin` dans une agence de démonstration ne contenant aucune donnée client réelle. Ne transmettez jamais le mot de passe d’un compte personnel.

Dans **Play Console > Contenu de l’application > Accès à l’application**, fournir :

| Champ | Contenu à renseigner avant envoi |
|---|---|
| E-mail de revue | Compte dédié à créer |
| Mot de passe | Mot de passe temporaire unique |
| Instructions | « Ouvrir l’application, choisir Accès agence, saisir les identifiants ci-dessus. L’agence de démonstration permet de consulter le tableau de bord et les écrans de suivi sans paiement. » |
| Autres accès | Le portail public KivuLine Cargo est accessible sans authentification depuis le lien d’agence. |

## Projet de déclaration Data safety

Cette section est un **projet à valider dans Play Console** contre les prestataires réellement activés au moment de la soumission. Le formulaire final engage l’éditeur.

| Type de donnée | Collectée | Partagée | Finalité | Suppression |
|---|---:|---:|---|---|
| Nom et adresse e-mail | Oui | Prestataires techniques seulement | Gestion de compte, authentification, administration | Parcours intégré et URL Web |
| Numéro de téléphone | Oui, pour les clients SMS/WhatsApp | Firebase et Meta uniquement si activé | Authentification, association des colis, notifications | Supprimé ou anonymisé à la demande |
| Identifiants utilisateur | Oui | Firebase et Expo | Authentification, RBAC, notifications | Supprimés avec le compte |
| Informations d’agence | Oui | Non publiquement, sauf identité choisie par l’agence | Personnalisation et exploitation SaaS | Revue contractuelle pour les administrateurs |
| Données de colis et événements | Oui | Transporteurs/prestataires configurés selon le service | Fonctionnement principal et suivi | Conservées ou anonymisées selon obligations opérationnelles |
| Photos ou fichiers | Oui lorsque l’agence importe un logo ou un document pris en charge | Hébergement applicatif | Personnalisation et opérations | Suppression selon demande et cycle de conservation |
| Jetons de notification | Oui | Expo/Google | Alertes d’expédition | Supprimés lors de la suppression du compte |
| Informations de paiement | Traitement externe conditionnel | Chariow si activé | Souscription SaaS | Selon obligations de facturation du prestataire et de l’éditeur |
| Messages | Conditionnel | Meta WhatsApp Business si activé | Notifications et relation client | Journaux minimisés; suppression selon demande et obligations |

Déclarations générales proposées : les données sont chiffrées en transit; l’application propose une demande de suppression; aucune vente de données; aucune collecte de localisation précise de l’appareil; aucune publicité; aucune permission SMS, journal d’appels, caméra ou microphone active dans le manifeste commercial.

## Assets préparés

Le dossier contient l’icône 512 × 512, la bannière 1024 × 500 et cinq captures téléphone 432 × 768. Les captures représentent l’application réelle et n’exposent aucune donnée client.

## Parcours de publication recommandé

La première build doit être envoyée en **piste interne** avec le statut **brouillon**. Une fois installée et testée sur plusieurs appareils Android, elle peut être promue vers un test fermé puis la production. Pour un compte personnel créé après le 13 novembre 2023, Google exige au moins 12 testeurs inscrits sans interruption pendant 14 jours avant la demande d’accès à la production.[1]

## Références

[1]: https://support.google.com/googleplay/android-developer/answer/14151465 "App testing requirements for new personal developer accounts"
[2]: https://support.google.com/googleplay/android-developer/answer/11926878 "Target API level requirements for Google Play apps"
[3]: https://support.google.com/googleplay/android-developer/answer/13327111 "Understanding Google Play’s app account deletion requirements"
[4]: https://support.google.com/googleplay/android-developer/answer/10787469 "Provide information for Google Play's Data safety section"
[5]: https://docs.expo.dev/submit/android/ "Submit to the Google Play Store with EAS Submit"
