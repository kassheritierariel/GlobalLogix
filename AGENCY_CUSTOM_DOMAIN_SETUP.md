# Domaines personnalisés d’agence

Chaque administrateur d’agence peut saisir un domaine public tel que `suivi.votreagence.com` depuis **Réglages → Identité et messages client**. GlobalLogix normalise le domaine, refuse les URL complètes et impose une unicité globale : un même domaine ne peut pas être rattaché à deux agences.

La saisie crée uniquement une **demande de validation DNS**. Aucun portail n’est redirigé automatiquement, et l’espace client continue d’utiliser `/agency/{publicSlug}` tant que le statut n’est pas `verified`. Cette séparation évite qu’une agence détourne un domaine qu’elle ne contrôle pas.

| Statut | Signification | Action attendue |
|---|---|---|
| `not_configured` | Aucun domaine n’est demandé. | Utiliser le lien GlobalLogix de l’agence. |
| `pending_dns` | Le domaine est enregistré mais non vérifié. | Attendre les instructions DNS de GlobalLogix. |
| `verified` | Le domaine a été contrôlé par l’éditeur. | Activer le routage seulement après vérification du certificat TLS. |
| `disabled` | Le domaine n’est plus servi. | Revenir au lien GlobalLogix et corriger la configuration. |

> La cible DNS, la vérification de propriété et l’émission du certificat TLS doivent être mises en place par l’infrastructure d’hébergement GlobalLogix. Ne publiez pas de CNAME avant de recevoir la cible officielle de l’éditeur.
