# PR #1 — CI, Firebase et migrations Drizzle

## Résumé de validation

La branche `feat/saas-multi-agence` est désormais couverte par le contrôle GitHub Actions **quality-security**. La branche `main` impose ce contrôle, une revue approuvée et la résolution des conversations avant fusion. Le workflow exécute TypeScript, les tests portables, la détection de fichiers sensibles suivis par Git et des assertions sur les garde-fous Firebase et `agencyId`.

| Contrôle | Résultat | Portée |
|---|---:|---|
| Profil CI sans secrets | Conforme | 71 tests réussis, 9 validations de préproduction ignorées volontairement |
| Validation Firebase préproduction | Conforme | 10 tests réussis, sans création ni modification de données |
| CI GitHub `quality-security` | Conforme | Exécution réussie sur le dernier commit de la PR |
| Protection de `main` | Active | Contrôle requis, une approbation, conversations résolues |
| Revue Drizzle d’isolation | Conforme après correction | 4 assertions automatisées sur les migrations multi-agence |

## Firebase de préproduction

Les tests qui appellent Firebase, FCM v1 ou utilisent `google-services.json` sont désormais opt-in via `RUN_FIREBASE_PREPROD_TESTS=true`. Ils ne s’exécutent pas dans la CI publique et ne requièrent donc aucun secret GitHub. Le profil de préproduction a vérifié la configuration Android Firebase, l’obtention de jetons OAuth Firebase et FCM, la clé Web Firebase, ainsi que la connexion du super administrateur.

> Les tests de préproduction doivent être lancés dans un environnement contrôlé où les secrets Firebase sont injectés hors dépôt. Aucun compte, rôle, numéro de téléphone ou expédition n’est créé par cette suite.

## Analyse des migrations Drizzle

Les migrations opérationnelles, SaaS et WhatsApp portent une frontière `agencyId` non nulle et des index adaptés aux requêtes par tenant. Les liens publics restent uniques par agence et les demandes d’inscription sont séparées des tenants actifs jusqu’à leur approbation.

| Migration | Constat d’isolation | État |
|---|---|---|
| `0002` | Expéditions, événements, exceptions et liens de partage portent `agencyId` ; index opérationnels par agence. | Conforme |
| `0003` | Les liens client–colis portent `agencyId` ; le numéro WhatsApp reste globalement unique par exigence produit. | Conforme avec contrôle applicatif requis |
| `0004` | Souscriptions et transactions Chariow portent `agencyId` ; index temporel par agence. | Conforme |
| `0005` | Un second `ADD planId` aurait fait échouer une base neuve. L’opération dupliquée a été supprimée. | Corrigé |
| `0006` | Profils, secrets chiffrés et journaux WhatsApp sont séparés par `agencyId`. | Conforme |
| `0007` | `publicSlug` unique par agence ; aucune jointure inter-tenant ajoutée. | Conforme |
| `0008` | Les demandes d’agence restent indépendantes des tenants actifs jusqu’à décision. | Conforme |

La base ne définit pas de clés étrangères composites liant systématiquement `shipmentId` et `agencyId`. L’isolation dépend donc à la fois du schéma et des garde-fous applicatifs `resolveAgencyManagementScope`, `verifyFirebaseAuthorization` et `canManageAgency`. Cette architecture est validée par les tests actuels ; toute future route doit conserver ce contrôle avant une lecture ou écriture tenant.

## Conditions de fusion

La PR peut être envisagée pour fusion une fois la revue humaine terminée et la dernière CI `quality-security` verte. Avant une mise en production, conservez l’exécution de préproduction Firebase dans un environnement de confiance et vérifiez que les migrations ont été appliquées dans l’ordre sur une copie de la base de production.
