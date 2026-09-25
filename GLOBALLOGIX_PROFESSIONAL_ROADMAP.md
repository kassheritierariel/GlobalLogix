# GlobalLogix — Références de marché et feuille de route professionnelle

## Positionnement recommandé

GlobalLogix ne doit pas tenter de reproduire à court terme toute la profondeur d’un grand TMS ou d’une plateforme mondiale de visibilité. Le positionnement le plus crédible est une **tour de contrôle logistique multi-agence, mobile-first et API-first**, centrée sur la visibilité fiable, la gestion proactive des exceptions et la collaboration client. Cette orientation reprend les principes les plus utiles de project44, FourKites et SAP TM tout en restant adaptée à une équipe produit de taille raisonnable. [1] [2] [3]

## Comparaison des applications de référence

| Référence | Ce qui la distingue | Apprentissage concret pour GlobalLogix |
|---|---|---|
| **project44** | Visibilité multimodale, données API-first, ETA prédictives, événements de perturbation, association expédition–commande–SKU. [1] | Centraliser les événements, exposer une API propre et relier chaque expédition à un client, une commande et une priorité métier. |
| **FourKites** | Normalisation du suivi, source et niveau de confiance des signaux, événements douaniers, partage externe et prévention d’exception. [2] | Afficher la qualité de la donnée, proposer un portail client partagé et créer des alertes exploitables plutôt que de simples notifications. |
| **SAP TM** | Planification, replanification dynamique, moteur de règles, tarifs, optimisation et intégration ERP. [3] | Ajouter progressivement les règles de routage, les coûts, la planification de capacité et l’intégration ERP/CRM. |

## Architecture fonctionnelle cible

| Domaine | Amélioration professionnelle | Valeur opérationnelle |
|---|---|---|
| **Données de suivi** | Journal d’événements immutable avec source, horodatage, séquence, confiance et géolocalisation. | Traçabilité, déduplication, résolution des litiges et recalcul fiable de l’état. |
| **ETA & exceptions** | ETA calculée par tronçon, seuils de retard, score de risque et recommandations d’action. | Intervention avant l’échec de SLA ; réduction des appels manuels. |
| **Expérience client** | Lien de suivi externe expirant, statut en langage simple, documents de transport et préférences d’alertes. | Transparence sans donner un accès interne complet. |
| **Opérations** | Centre d’exception priorisé par impact, SLA, client, valeur de cargaison et délai restant. | Les opérateurs traitent d’abord ce qui affecte réellement le client ou le coût. |
| **Planification** | Affectation transporteur, tarifs, contraintes de capacité et replanification. | Arbitrage coût–service avec règles auditées. |
| **Sécurité** | RBAC Firebase, frontières par agence, audit log et politiques de rétention. | Contrôle multi-tenant et conformité opérationnelle. |
| **Intégrations** | API REST versionnée, webhooks signés, import CSV contrôlé et connecteurs ERP/TMS/GPS. | Mise en service progressive avec les systèmes réels des clients. |

## Feuille de route priorisée

### Priorité 1 — Fondations de production

Mettre en service Firebase Auth, le premier `super_admin`, les Custom Claims, FCM/APNs et la gateway WebSocket sur un hébergement persistant. Remplacer le registre d’expéditions de démonstration par une table source `shipments` et un journal `shipment_events`. Ajouter les champs `agencyId`, `sequence`, `source`, `confidence`, `eventId` et `lastTelemetryAt` à chaque événement.

Ajouter un centre d’exception dans l’application avec des règles explicites : retard, arrivée estimée dépassée, absence de signal, blocage douanier ou écart de température. Chaque règle doit produire une tâche assignable, une échéance et un historique de résolution.

### Priorité 2 — Visibilité et service client

Créer un portail de suivi externe à lien expirant, limité à une expédition ou une commande. Ajouter les préférences d’alertes par client et par événement, puis des documents de transport sécurisés. Afficher la source et la fraîcheur du dernier signal, afin de distinguer une donnée GPS, transporteur, douane ou saisie manuelle ; FourKites illustre la valeur de cette transparence de source. [2]

Construire des tableaux de bord par agence : expéditions à risque, ETA respectées, incidents ouverts, temps de résolution et données sans signal. L’objectif initial est la qualité de la décision, non la multiplication des graphiques.

### Priorité 3 — Planification et intelligence métier

Ajouter des ETA par tronçon et un moteur de règles pour sélectionner transporteur, service et itinéraire selon le coût, la capacité, les SLA et les contraintes douanières. Ajouter ensuite une replanification manuelle contrôlée, suivie d’une replanification assistée. SAP TM est une référence utile pour cette progression vers des règles et une planification dynamique. [3]

Introduire l’analyse prédictive seulement après avoir collecté suffisamment d’événements propres. À ce stade, commencer par des modèles explicables : risque de retard, probabilité de SLA non respecté et recommandation de contact transporteur. Les ETA prédictives des plateformes de visibilité reposent sur une base d’événements robuste, pas uniquement sur une carte. [1] [2]

## Indicateurs de pilotage

| Indicateur | Définition | Usage |
|---|---|---|
| Fraîcheur du signal | Temps écoulé depuis le dernier événement fiable | Détecter les expéditions silencieuses. |
| Respect de l’ETA | Écart entre ETA annoncée et heure réelle | Mesurer la qualité de promesse client. |
| Taux d’exception | Part des expéditions avec au moins un incident | Prioriser les améliorations de processus. |
| Temps de résolution | Durée entre ouverture et clôture d’une exception | Mesurer la réactivité opérationnelle. |
| Couverture de suivi | Part des expéditions ayant une source de position fiable | Piloter les connecteurs transporteurs et GPS. |

## Décision recommandée

Commencer par la **Priorité 1**. Elle transforme l’application actuelle en plateforme fiable : sécurité, données réelles, temps réel et traitement d’incidents. La Priorité 2 renforce ensuite la valeur client ; la Priorité 3 doit venir après l’accumulation de données de qualité.

## Références

[1] [project44 — Supply Chain Visibility](https://www.project44.com/platform/visibility/)

[2] [FourKites — Global Movement](https://www.fourkites.ai/domains/global-movement)

[3] [SAP — Transportation Management Features](https://www.sap.com/products/scm/transportation-logistics/features.html)
