# Notifications WhatsApp de suivi GlobalLogix

Les mises à jour client peuvent être envoyées par WhatsApp Cloud API après création d’une application Meta avec le cas d’usage WhatsApp, association d’un compte WhatsApp Business et configuration d’un numéro émetteur. Un jeton de système permanent doit être conservé exclusivement comme secret serveur ; il ne doit jamais être intégré dans l’application mobile.

Hors d’une fenêtre de service client ouverte, les mises à jour de suivi doivent utiliser un modèle approuvé. L’utilisateur doit également avoir donné son accord pour recevoir ces notifications. Le numéro de destination doit conserver l’indicatif pays au format international.

Le journal GlobalLogix doit distinguer l’acceptation par l’API de la livraison effective : Meta transmet les statuts `sent`, `delivered`, `read` ou `failed` par le webhook `messages`. Le webhook doit être vérifié, répondre avec succès et dédupliquer les événements, car Meta peut réessayer une livraison qui n’a pas reçu de réponse HTTP 200.

## Références officielles

- [WhatsApp Cloud API — Get Started](https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started)
- [WhatsApp Business Platform — Webhooks](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview)
- [WhatsApp Business Platform — Service messages](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages)
