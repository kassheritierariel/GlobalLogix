# Script technique — PR #1 GlobalLogix SaaS multi-agence

**Audience :** équipe technique  
**Durée indicative :** 9 à 12 minutes  
**Support :** présentation « GlobalLogix SaaS multi-agence ».

## Slide 1 — GlobalLogix SaaS multi-agence

« Cette pull request fait évoluer le socle initial vers GlobalLogix, une tour de contrôle logistique disponible sur mobile et sur le Web. Le changement principal est architectural : l’éditeur GlobalLogix gouverne la plateforme, tandis que chaque agence possède un espace opérationnel, une identité visuelle et un périmètre de données séparés. Aujourd’hui, nous allons expliquer l’isolation multi-agence, les parcours d’onboarding, le portail client, les communications et les prérequis encore nécessaires avant production. »

## Slide 2 — Un éditeur, des agences autonomes

« Le super administrateur est l’unique éditeur du SaaS. Il peut créer ou approuver les agences, superviser leurs indicateurs et administrer les plans. Cela ne lui donne pas accès aux secrets Meta d’une agence ni aux données personnelles complètes des clients. Chaque agence administre ses équipes, son branding, ses colis et sa configuration de communication dans son propre `agencyId`. Ce modèle répond au besoin d’une plateforme centrale sans transformer les tenants en simples vues décoratives. »

## Slide 3 — Architecture de confiance par agence

« La sécurité part de Firebase. Les Custom Claims portent le rôle et, pour les rôles d’agence, le `agencyId`. Le serveur vérifie les jetons, refuse les comptes désactivés et refuse tout rôle d’agence sans périmètre. Toutes les routes de gestion résolvent ensuite l’agence autorisée côté serveur. La donnée logistique reste filtrée par `agencyId`. Enfin, les secrets Meta sont chiffrés et les réponses API renvoient uniquement des résumés sûrs, jamais les valeurs chiffrées ou en clair. »

## Slide 4 — Onboarding Google sous contrôle

« Une agence peut déposer une demande après une connexion Google vérifiée. Cette identité permet de lier le dossier à un demandeur réel, mais elle ne crée aucun privilège d’administration. La demande reste `pending`. Le super administrateur l’examine, choisit le code et le slug public, puis approuve ou rejette. C’est seulement au moment de l’approbation que l’espace agence est créé et que le claim `agency_admin` est accordé. Cette séparation est importante contre l’auto-provisionnement abusif. »

## Slide 5 — Une tour de contrôle opérationnelle

« Chaque agence dispose d’un portefeuille de colis, d’un journal de transit et d’un centre d’exceptions. Le tableau de bord met en évidence les retards, risques douaniers et anomalies à traiter. La santé opérationnelle synthétise ces informations au niveau de l’agence. Les simulateurs GPS restent étiquetés comme simulations locales. Ainsi, nous évitons de faire passer une donnée de test pour une position réelle, tout en donnant aux équipes des outils pour tester l’expérience de suivi. »

## Slide 6 — Un portail client cloisonné

« Le portail client est contextualisé par le lien public d’une agence. Le client s’authentifie par Firebase Phone avec son numéro WhatsApp et l’application restaure sa session. Une fois les colis rattachés par l’équipe, le client ne voit que ses expéditions associées et, s’il entre depuis un lien d’agence, uniquement celles de cette agence. L’interface administrateur ne doit afficher que les quatre derniers chiffres du numéro. La validation réelle nécessite encore un numéro de test configuré dans Firebase. »

## Slide 7 — Communications responsables

« Les événements de livraison importants peuvent produire des notifications WhatsApp, mais le système vérifie d’abord le contexte client et l’état du canal. Les messages sont retenus si le canal Meta de l’agence est incomplet ou inactif. Les simulateurs permettent de tester les modèles statut, ETA, douane, retard et livraison sans envoyer de message réel. Une configuration Meta est propre à chaque agence et ne peut être activée qu’après validation. Les e-mails et SMS transactionnels restent désactivés tant que leurs identifiants fournisseurs ne sont pas valides. »

## Slide 8 — Pilotage et décisions documentées

« L’analytique fournit des périodes 7, 30 et 90 jours, ainsi qu’une plage personnalisée limitée à 366 jours. Elle présente les volumes, statuts, risques, exceptions et résultats WhatsApp dans le périmètre de l’agence. Les alertes de capacité sont visibles lorsque l’usage se rapproche ou atteint la limite de plan. Les rapports CSV et PDF reprennent la période choisie et l’identité visuelle de l’agence. L’objectif est de permettre une décision documentée sans transformer les exports en fuite de données personnelles. »

## Slide 9 — Prérequis avant mise en production

« Le socle technique et les contrôles d’accès sont en place ; la prochaine étape est la validation externe. Il faut activer Google et Phone Auth dans Firebase, tester un numéro de test, configurer chaque canal Meta avec son webhook signé, puis connecter les fournisseurs transactionnels avec un domaine e-mail vérifié. Enfin, Chariow ne doit être activé qu’avec les produits et secrets réels. Je recommande une agence pilote, des tests de bout en bout, puis une activation progressive et surveillée des canaux. »

## Conclusion et transition vers les questions

« Pour résumer, la PR #1 introduit une architecture SaaS multi-agence où l’identité et le périmètre sont vérifiés côté serveur. La base fonctionnelle est prête pour la préproduction ; les intégrations externes restent délibérément conditionnelles. Les questions prioritaires pour la revue sont l’isolation par `agencyId`, la migration des données, la configuration Firebase et la stratégie d’activation contrôlée des canaux. »
