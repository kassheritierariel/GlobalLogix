# WhatsApp Business multi-agence : exigences vérifiées

Chaque agence exploite sa propre application Meta, son compte WhatsApp Business et son numéro professionnel. GlobalLogix doit donc sélectionner la configuration chiffrée associée au `phone_number_id` reçu, ne jamais mélanger les journaux d’agence et ne jamais renvoyer les secrets à l’interface.

Le champ webhook `messages` couvre à la fois les messages entrants et les statuts sortants. Les statuts normalisés pertinents sont `sent`, `delivered`, `read` et `failed`. Le webhook fournit le `phone_number_id`, l’identifiant de message, le statut, l’horodatage et, en cas d’échec, un code d’erreur. Un statut `read` implique qu’il a été livré ; l’absence de `delivered` séparé est possible.

Le point de terminaison doit répondre HTTP 200 rapidement. Meta peut renvoyer les événements de webhook pendant plusieurs jours après un échec, donc le traitement doit être idempotent sur l’identifiant de message et le statut. Les agences doivent souscrire le champ `messages` dans leur application Meta et disposer des permissions `whatsapp_business_messaging` et `whatsapp_business_management` nécessaires.

## Sources

- https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview
- https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/reference/messages/status
- https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview
