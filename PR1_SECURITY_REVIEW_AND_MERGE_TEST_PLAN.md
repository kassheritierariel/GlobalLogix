# PR #1 — Revue de sécurité et plan de test de fusion

**Pull request :** [#1 — feat: migration GlobalLogix SaaS multi-agence](https://github.com/kassheritierariel/GlobalLogix/pull/1)  
**Branche :** `feat/saas-multi-agence` vers `main`  
**Portée :** migration du socle Web précédent vers GlobalLogix Mobile et Web, avec architecture SaaS multi-agence.

## 1. Synthèse de la revue automatisée

La revue a été exécutée sur le code de la branche locale correspondant à la pull request. Le compilateur TypeScript est passé sans erreur. Huit suites de sécurité ciblées ont également été exécutées avec succès, pour **17 tests réussis**. Elles couvrent Firebase RBAC, l’accès client, le périmètre des administrateurs d’agence, le lien public d’agence, la prévisualisation éditeur, les identifiants chiffrés et l’activation WhatsApp.

| Contrôle automatisé | Résultat | Constat |
|---|---|---|
| TypeScript (`pnpm check`) | Réussi | Aucun échec de typage sur le parcours SaaS. |
| Tests Firebase et RBAC | Réussi | Les rôles et les Custom Claims attendus sont couverts. |
| Tests de périmètre agence | Réussi | Les scénarios d’administration croisée sont refusés. |
| Tests client et lien public | Réussi | L’accès est lié au client et, lorsqu’il existe, au contexte d’agence. |
| Tests Meta/WhatsApp | Réussi | L’activation exige les prérequis de canal et les secrets restent chiffrés. |
| Analyse statique des routes | Réussi | 21 appels à `resolveAgencyManagementScope` sont présents dans les routes serveur. |
| Garde contre les secrets | Réussi | Aucun champ `accessTokenCiphertext`, `appSecretCiphertext` ou `verifyTokenCiphertext` n’est renvoyé directement par les réponses JSON contrôlées. |

## 2. Constats de sécurité

### Firebase et rôles

Le serveur vérifie les jetons Firebase en demandant la révocation, puis interprète les rôles autorisés. Un rôle d’agence sans `agencyId` est refusé. Les comptes clients exigent un numéro Firebase confirmé. Les Custom Claims associés à `super_admin` et `client` retirent explicitement le champ `agencyId`, tandis que les rôles d’agence doivent le posséder.

| Contrôle | Verdict | Justification |
|---|---|---|
| Attribution des claims | Conforme | `agencyId` est obligatoire pour `agency_admin`, `staff` et `viewer`. |
| Réutilisation de compte | Conforme | Un `super_admin` ne peut pas être transformé en administrateur d’agence ; un administrateur d’une autre agence est refusé. |
| Compte Google en attente | Conforme | L’inscription Google vérifiée n’attribue pas de rôle tenant avant la décision de l’éditeur. |
| Révocation Firebase | Conforme | Les jetons sont vérifiés avec le contrôle de révocation activé. |

### Isolation des données par `agencyId`

La fonction `resolveAgencyManagementScope` applique le périmètre sur les routes de profil, clients, analytique, abonnements, équipes et WhatsApp. Un `agency_admin` ne peut pas fournir un autre code d’agence ; un `super_admin` doit fournir explicitement l’agence ciblée pour les opérations de gestion. Les parcours client utilisent le Firebase UID et, pour le portail d’agence, le slug public afin de limiter la liste et le détail des colis.

> **Verdict de revue :** les contrôles serveur analysés appliquent une isolation cohérente par `agencyId`. La console centrale doit rester limitée aux agrégats assainis explicitement prévus pour le `super_admin`.

## 3. Limites de la revue

Cette analyse combine compilation, tests unitaires ciblés et analyse statique. Elle ne remplace pas une validation en environnement de préproduction avec Firebase, MySQL et les fournisseurs externes. Aucun envoi e-mail, SMS, WhatsApp ni paiement Chariow n’a été déclenché pendant la revue.

| Risque résiduel | Mesure requise avant production |
|---|---|
| Configuration Firebase réelle | Exécuter les scénarios avec comptes et numéros de test Firebase. |
| Migrations MySQL | Sauvegarder, appliquer en préproduction, vérifier les index et les valeurs de `publicSlug`. |
| Meta/WhatsApp | Valider le webhook, la signature et un modèle avec une agence pilote. |
| E-mail et SMS transactionnels | Vérifier les domaines, identifiants et destinataires autorisés ; envoyer un seul message de test approuvé. |
| Grande migration GitHub | Ajouter une CI GitHub obligatoire avant toute fusion. |

## 4. Plan de test de fusion

### Préparation

La branche `main` doit être à jour, la base de préproduction sauvegardée et les variables de secrets configurées uniquement par le mécanisme sécurisé prévu. Les journaux de préproduction ne doivent pas contenir de numéros complets, jetons Firebase, secrets Meta, clés Chariow ou identifiants transactionnels.

### Cas de test prioritaires

| ID | Domaine | Scénario | Résultat attendu |
|---|---|---|---|
| T01 | Build | Exécuter `pnpm check` puis `pnpm test`. | Typage et tests sans échec. |
| T02 | Web | Exécuter l’export Web Expo. | Export construit sans erreur. |
| T03 | Super admin | Ouvrir la console centrale. | Agrégats d’agence disponibles, sans secrets ni numéro complet. |
| T04 | Agency admin | Tenter de lire l’agence d’un autre tenant. | Refus serveur explicite. |
| T05 | Staff/viewer | Tenter une action réservée à l’administrateur. | Refus selon RBAC. |
| T06 | Client | Se connecter par Firebase Phone avec un numéro de test. | Session client créée ou restaurée. |
| T07 | Client | Demander les colis depuis un slug d’une autre agence. | Aucun colis hors périmètre n’est retourné. |
| T08 | Onboarding | Déposer une demande Google. | Statut `pending`, sans Custom Claim tenant. |
| T09 | Approbation | Approuver la demande depuis le super admin. | Profil, lien et rôle `agency_admin` créés après décision. |
| T10 | Rejet | Rejeter une demande. | Demande auditée, aucune agence ni claim créée. |
| T11 | Meta | Tester une configuration incomplète. | Canal non activable et message de diagnostic sans secret. |
| T12 | Meta | Valider une agence pilote avec webhook signé. | Passage contrôlé à `verified`, puis activation explicite. |
| T13 | Analytique | Choisir 7/30/90 jours et une plage personnalisée. | Indicateurs et rapport PDF cohérents avec la période. |
| T14 | Exports | Produire CSV et PDF agency-branded. | Fichiers sans données de contact sensibles. |
| T15 | Régression mobile | Vérifier Android et iOS sur écran étroit. | Menus, thème, défilement et boutons Haut/Bas utilisables. |

### Tests de non-régression recommandés

Les parcours de suivi partagé, QR, impression, export, simulateur GPS clairement identifié, détail de colis, exceptions et gestion d’équipe doivent être testés après la migration. Vérifier également que le portail public ne rend aucune donnée d’un autre tenant lorsque le slug est altéré ou absent.

### Critères de fusion

La fusion ne doit être effectuée qu’après réussite des tests T01 à T10, contrôle des migrations en préproduction et approbation humaine de la sécurité Firebase/`agencyId`. Les tests T11 à T14 deviennent bloquants dès que Meta ou des canaux transactionnels sont activés.

## 5. Procédure de déploiement et retour arrière

Créer un checkpoint applicatif avant la fusion, effectuer une sauvegarde de base, puis appliquer les migrations dans l’ordre. Publier d’abord en préproduction, vérifier les journaux et exécuter les tests de fumée. En cas d’incident de contrôle d’accès ou de migration, restaurer le checkpoint applicatif stable et utiliser la sauvegarde de base validée par l’équipe ; ne pas supprimer les données pour corriger un symptôme.

