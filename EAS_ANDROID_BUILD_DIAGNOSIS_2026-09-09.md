# Diagnostic du build Android EAS — correction après deux échecs

Les deux tentatives Android précédentes ont échoué avant la compilation Gradle avec le même message : `google-services.json is missing`. Le profil `production-apk` ciblait pourtant l’environnement EAS `production`, et la variable `GOOGLE_SERVICES_JSON` y avait été créée comme secret de type fichier. Le problème ne venait donc ni du package Android ni du contenu Firebase, mais du moment et du chemin auxquels Expo cherchait le fichier pendant la préparation distante.

La correction garde `google-services.json` hors Git et combine deux mécanismes compatibles avec le cycle EAS officiel. Lors de la résolution de `app.config.ts`, le chemin éphémère de `GOOGLE_SERVICES_JSON` est utilisé directement s’il est disponible. Le hook `eas-build-pre-install`, exécuté avant l’installation des dépendances et avant Expo Prebuild, valide ensuite le `project_id` et le package Android sans afficher le contenu, puis copie le fichier vers `./google-services.json` avec des permissions `0600`. Si la configuration a été évaluée avant que le secret soit accessible, le chemin stable est donc présent au moment de Prebuild.

## Validation reproductible

Une simulation locale isolée a reproduit le cycle attendu : création d’une archive source sans `google-services.json`, extraction dans un espace propre, exposition d’une copie externe comme `GOOGLE_SERVICES_JSON`, exécution du hook puis résolution de `npx expo config --type public --json`. La simulation confirme successivement que le secret n’est pas embarqué dans l’archive, qu’il est matérialisé avant Prebuild, que ses permissions sont restrictives et qu’Expo référence le chemin attendu. Un second contrôle confirme qu’Expo accepte directement le chemin absolu d’un secret fichier lorsqu’il est déjà disponible.

Le test automatisé `tests/android-build-push.test.ts` exécute désormais réellement le script dans un répertoire temporaire avec une fixture minimale valide, au lieu de vérifier uniquement la présence de chaînes de configuration.

> Cette validation démontre le fonctionnement du code et du cycle simulé. Le succès définitif doit encore être confirmé par une nouvelle build distante EAS `production-apk`, car seule l’infrastructure distante peut prouver que le secret de l’environnement de production est effectivement attaché à ce nouveau job.

## Références

[1] [Expo — Build lifecycle hooks](https://docs.expo.dev/build-reference/npm-hooks/)

[2] [Expo — Android build process](https://docs.expo.dev/build-reference/android-builds/)

[3] [Expo — Create and manage environment variables in EAS](https://docs.expo.dev/eas/environment-variables/manage/)

[4] [Expo — Environment variables FAQ](https://docs.expo.dev/eas/environment-variables/faq/)
