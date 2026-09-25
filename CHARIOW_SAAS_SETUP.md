# Préparer les licences SaaS Chariow pour GlobalLogix

GlobalLogix est prêt à ouvrir un checkout Chariow par agence, mais le module reste volontairement inactif jusqu’à la configuration de votre boutique. Cette protection empêche toute transaction ou activation involontaire.

Créez dans Chariow six produits de type **Licence**, sans publier de clé ni de secret dans l’application mobile. Préparez une licence pour chaque plan et chaque périodicité : Starter mensuel, Starter annuel, Operations mensuel, Operations annuel, Enterprise mensuel et Enterprise annuel. Copiez les identifiants de produits dans les variables de configuration sécurisées correspondantes.

| Offre GlobalLogix | Licence Chariow à créer | Variable serveur |
|---|---|---|
| Starter | Mensuelle | `CHARIOW_PRODUCT_STARTER_MONTHLY_ID` |
| Starter | Annuelle | `CHARIOW_PRODUCT_STARTER_ANNUAL_ID` |
| Operations | Mensuelle | `CHARIOW_PRODUCT_OPERATIONS_MONTHLY_ID` |
| Operations | Annuelle | `CHARIOW_PRODUCT_OPERATIONS_ANNUAL_ID` |
| Enterprise | Mensuelle | `CHARIOW_PRODUCT_ENTERPRISE_MONTHLY_ID` |
| Enterprise | Annuelle | `CHARIOW_PRODUCT_ENTERPRISE_ANNUAL_ID` |

Ajoutez ensuite la clé de boutique dans `CHARIOW_API_KEY`. Pour le webhook, créez un Pulse HTTPS pointant vers `https://globallogix-j5jxfyba.manus.space/api/webhooks/chariow`, sélectionnez au minimum les événements `successful.sale`, `failed.sale` et `abandoned.sale`, puis saisissez son Signing secret `whsec_...` dans `CHARIOW_PULSE_SECRET`.

L’accès d’une agence n’est activé qu’après un événement `successful.sale` signé. Une redirection de navigateur ou une notification non vérifiée ne suffit jamais.

## Références

Les règles de checkout et de produit sont décrites dans la [documentation Chariow Checkout](https://chariow.dev/fr/guides/checkout). La configuration Pulse, les signatures HMAC et les événements de vente sont documentés dans le [guide Chariow Pulse Security](https://chariow.dev/en/guides/pulse-security).
