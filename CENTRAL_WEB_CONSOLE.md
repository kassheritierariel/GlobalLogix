# Console Web centralisatrice GlobalLogix

La console centralisatrice est un espace Web réservé au **super administrateur GlobalLogix**. Elle consolide les indicateurs de pilotage des locataires SaaS sans transformer le super administrateur en propriétaire des comptes Meta ou des secrets de communication des agences.

| Domaine | Données visibles dans la console | Données explicitement exclues |
|---|---|---|
| Agences | Nom, identité visuelle, plan, état d’abonnement, volume d’expéditions | Identifiants Meta, Access Token, App Secret, Verify Token |
| Opérations | Expéditions actives, dossiers à risque, exceptions ouvertes, prévisualisation par agence | Numéros clients complets et liens de suivi bruts |
| Communications | État non sensible du canal WhatsApp : non configuré, à valider ou actif | Contenu privé, numéros complets, secrets et signatures de webhook |
| SaaS | Plan, essai ou état de souscription, accès à la facturation | Clés Chariow et données de paiement sensibles |

Chaque carte agence ouvre une **prévisualisation strictement en lecture seule**. L’API exige le rôle `super_admin` avant de retourner les données d’une agence précise. Les rôles `agency_admin`, `staff`, `viewer` et `client` ne peuvent pas accéder à cette console.

> Cette console est un outil d’édition et de supervision. Les administrateurs d’agence continuent de gérer leur marque, leur équipe, leurs données opérationnelles et leur connexion Meta dans leur propre périmètre.
