# GlobalLogix Mobile — Lancement Android et iOS

## Portée de la version mobile

Cette application Expo transpose les parcours essentiels de GlobalLogix SaaS dans une interface mobile portrait : connexion administrateur de démonstration, tableau de bord, portefeuille d’expéditions, suivi de route et commandes du flux de télémétrie. Les données de suivi sont simulées localement et évoluent toutes les cinq secondes lorsque le canal est actif.

> La session de démonstration est stockée localement sur l’appareil. Elle n’est pas encore reliée à Firebase Authentication, aux Custom Claims ni à un WebSocket de production.

## Exécution locale

Depuis le dossier du projet :

```bash
pnpm install
pnpm dev
```

Le terminal et l’interface du projet affichent un QR code Expo. Installer **Expo Go** sur un appareil Android ou iOS compatible, puis scanner ce QR code. Sur iOS, le scan s’effectue habituellement depuis l’appareil photo ; sur Android, il peut s’effectuer depuis Expo Go.

Pour démarrer la cible souhaitée depuis un environnement local compatible :

```bash
pnpm android
pnpm ios
```

## Parcours de validation sur appareil

Saisir deux valeurs non vides sur l’écran de connexion. Vérifier que le tableau de bord s’ouvre et que la session est toujours présente après un redémarrage. Dans l’onglet **Suivi**, attendre un pulse puis noter l’évolution de la progression, de la distance restante et de l’heure. Utiliser **Pause live**, attendre cinq secondes pour confirmer que le compteur reste stable, puis utiliser **Reprendre** et **Réinitialiser**.

Ouvrir ensuite l’onglet **Expéditions**, appliquer chaque filtre et sélectionner une expédition. Le suivi doit se focaliser sur cette expédition. Enfin, utiliser **Se déconnecter** depuis Réglages et vérifier le retour à l’accès agence.

## Passage en production

Avant la publication, remplacer le mode local par Firebase Auth, l’actualisation des Custom Claims et les règles Firestore déjà documentées dans le projet SaaS. Remplacer ensuite la simulation par une source `TelemetrySource` WebSocket ou SSE authentifiée. Vérifier les refus d’accès inter-agences dans les émulateurs Firebase avant d’utiliser des données réelles.

Après le checkpoint final, utiliser le bouton **Publish** de l’interface du projet pour lancer le processus de publication et générer la distribution Android. Cette étape doit être réalisée depuis l’interface, plutôt que par une construction manuelle de l’APK dans le sandbox.
