# Design mobile — GlobalLogix Mobile

## Intention produit

GlobalLogix Mobile transforme les flux de supervision logistique du SaaS en une expérience de terrain utilisable à une main, en portrait 9:16. L’application privilégie la lecture immédiate de l’état opérationnel : une agence peut se connecter en démonstration, suivre les expéditions actives, consulter l’avancement d’un vecteur et interrompre ou reprendre le canal de télémétrie simulé.

L’interface adopte les conventions iOS : grandes zones tactiles, titre de navigation clair, informations prioritaires visibles dans le premier écran, onglets bas stables, feuilles ou pages de détail plutôt que des panneaux trop denses. Android conserve la même hiérarchie et les gestes système natifs.

## Écrans

| Écran | Contenu principal | Fonctionnalités |
|---|---|---|
| Connexion | Marque, identifiant agence, mot de passe, note de démonstration | Validation locale, ouverture de session, message d’erreur accessible, persistance locale limitée à la démonstration. |
| Tableau de bord | Salutation, synthèse des expéditions actives, alertes de statut, accès direct au suivi | Lecture du portefeuille, raccourci vers la route prioritaire et déconnexion. |
| Liste Expéditions | Liste virtualisée d’expéditions avec statut, destination, progression et dernière mise à jour | Filtre de statut, sélection d’une expédition et accès au détail. |
| Suivi en direct | Résumé de l’expédition sélectionnée, progression, origine/destination, distance restante, dernier pulse et timeline d’étapes | Simulation de télémétrie toutes les cinq secondes, pause, reprise, réinitialisation et changement de vecteur. |
| Paramètres | Profil de démonstration, état de session et aide de lancement | Déconnexion sécurisée de la session locale. |

## Flux clés

Le flux principal est : **Connexion → Tableau de bord → Suivi en direct → Pause ou reprise du suivi → Sélection d’une autre expédition**. Dès l’ouverture, l’opérateur peut atteindre la route prioritaire en un geste depuis le tableau de bord. Depuis l’onglet Expéditions, il peut filtrer le portefeuille puis toucher une ligne pour ouvrir le suivi déjà focalisé sur le bon identifiant.

Le flux de sécurité local est : **Saisie d’identifiants non vides → Création de session de démonstration dans le stockage local → Restauration au redémarrage → Déconnexion → Suppression de session**. Cette version est explicitement présentée comme une démonstration : l’authentification Firebase, les Custom Claims et le WebSocket sécurisé restent des intégrations de production à brancher ultérieurement.

## Choix visuels

La palette reprend la lisibilité opérationnelle du SaaS : bleu nuit `#0A2540` pour les titres et la navigation, bleu clair `#E8F0F8` pour les fonds, orange signal `#FF6B35` pour les actions ou alertes importantes, vert `#14804A` pour les états stables et rouge `#C43D3D` pour les retards. Les surfaces sont blanches avec des séparateurs fins `#D9E2EC` ; les données en temps réel utilisent des monospaces ponctuels pour l’heure du dernier pulse et les distances.

Chaque écran conserve une marge horizontale de 20 à 24 points, une zone tactile minimale de 44 points et un contraste suffisant. Le suivi privilégie une carte de route simplifiée et une timeline verticale ; il évite une carte lourde ou des interactions nécessitant deux mains.

## Modèle de données mobile

L’application utilise des données de démonstration typées pour les expéditions : `id`, `trackingNumber`, `origin`, `destination`, `type`, `status`, `progress`, `distanceRemainingKm`, `lastTelemetryAt`, `currentPosition` et `eta`. La session de démonstration contient `displayName`, `role` et `agencyId` et est persistée via AsyncStorage. La source de télémétrie est isolée afin qu’un WebSocket ou SSE de production puisse remplacer la simulation sans réécrire les écrans.
