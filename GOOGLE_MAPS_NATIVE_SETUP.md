# Carte native GlobalLogix — prérequis en attente

La fiche détaillée de colis affiche déjà la dernière position réellement fournie par les événements de transit et un mode de repli lorsque des coordonnées GPS ne sont pas présentes. La carte native interactive est volontairement reportée : la clé Google Maps fournie a été refusée par l’API de validation.

Avant d’activer la carte dans une build Android ou iOS, il faut activer la facturation du projet Google Cloud ainsi que **Maps SDK for Android**, **Maps SDK for iOS** et **Geocoding API**. Une fois la clé valide, activer ponctuellement `RUN_LIVE_GOOGLE_MAPS_KEY_VALIDATION=true` pour contrôler l’accès, puis restreindre la clé au package Android `com.app.globallogixmobile` et à l’identifiant iOS de GlobalLogix.

> Ne pas inventer de coordonnées : les marqueurs ne doivent provenir que des payloads JSON d’événements `location_update` comportant `latitude`/`longitude` ou `lat`/`lng`.
