# Chariow et abonnements GlobalLogix

## Constat vérifié le 22 août 2026

Chariow expose une API Checkout (`POST https://api.chariow.com/v1/checkout`) avec redirection vers une page de paiement sécurisée et retour d’un identifiant de vente. Les Pulses Chariow permettent de recevoir les événements de vente et de paiement ; l’application GlobalLogix doit utiliser ces événements signés pour activer ou renouveler un accès, et non la seule redirection navigateur.

L’API Checkout accepte les produits téléchargeables, cours, licences et bundles. Elle ne prend pas en charge, via cette API, les produits de type Service, Coaching ou à prix libre. Pour GlobalLogix, la voie compatible à confirmer avec le propriétaire est donc la vente de licences SaaS ou l’utilisation d’une page/Widget Chariow pour les produits non compatibles.

## Règles d’intégration

- Conserver la clé API Chariow uniquement dans les secrets serveur.
- Créer une commande interne avant le checkout et lier l’ID de vente Chariow à l’agence, au plan et à la période.
- Activer ou prolonger un abonnement uniquement après événement de paiement finalisé reçu par Pulse.
- Rendre le traitement de webhook idempotent, journaliser les tentatives et vérifier toute signature fournie par Chariow.
- Ne jamais stocker de carte, de code Mobile Money ou de données sensibles de paiement dans GlobalLogix.

## Sécurité Pulse vérifiée

Chaque Pulse utilise un secret distinct préfixé `whsec_`. Le récepteur doit calculer un HMAC-SHA256 sur les octets bruts du corps de requête et comparer la valeur complète de l’en-tête `x-chariow-signature` en temps constant. Les tentatives doivent être dédupliquées par `x-pulse-delivery-id`, qui reste identique lors des retries. Les événements de test ne portent pas cet identifiant et ne doivent jamais activer une souscription.

## Sources

- https://chariow.dev/fr/guides/checkout
- https://chariow.dev/en/introduction/overview
- https://help.chariow.com/en/articles/259-developer-documentation-and-api
- https://chariow.dev/en/guides/pulse-security
