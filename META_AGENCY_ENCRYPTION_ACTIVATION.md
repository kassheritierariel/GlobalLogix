# Activation sécurisée de Meta/WhatsApp par agence

## État validé

La variable serveur `AGENCY_CREDENTIALS_ENCRYPTION_KEY` est désormais **présente dans l’environnement sécurisé et validée par le test dédié**. Sa valeur n’est pas affichée dans l’application, dans les journaux, ni dans ce document. Cette clé permet au serveur de chiffrer les secrets Meta de chaque agence avant leur écriture en base.

> **La présence d’une clé valide n’active pas l’envoi de messages.** Chaque agence doit encore saisir ses propres identifiants Meta et réussir la vérification de son webhook. Le statut de chaque connexion demeure volontairement `draft` tant que ces étapes ne sont pas confirmées.

| Élément | Valeur attendue | Règle de sécurité |
|---|---|---|
| Variable globale | `AGENCY_CREDENTIALS_ENCRYPTION_KEY` | Réservée au serveur GlobalLogix ; ne jamais la transmettre à une agence. |
| Format | 64 caractères hexadécimaux, soit 32 octets | Une autre longueur ou un autre caractère est refusé. |
| Algorithme applicatif | AES-256-GCM | Chaque secret reçoit un IV aléatoire distinct et un tag d’authentification. |
| Données chiffrées | Access Token, App Secret, Verify Token | Les valeurs en clair ne sont jamais renvoyées par les APIs. |
| Données conservées pour l’interface | IDs Meta, modèle utilitaire, quatre derniers chiffres du numéro | Elles servent uniquement à identifier la configuration sans révéler le secret ni le numéro complet. |

## Générer ou remplacer une clé valide

La commande suivante produit 32 octets aléatoires puis les rend en hexadécimal. L’option `-hex` d’OpenSSL représente la sortie sous forme de chaîne hexadécimale ; une sortie de 32 octets fait donc **64 caractères**. [1]

```bash
openssl rand -hex 32
```

Le résultat doit respecter exactement l’expression suivante :

```text
^[a-fA-F0-9]{64}$
```

Copiez ce résultat une seule fois dans le gestionnaire sécurisé des variables d’environnement sous le nom `AGENCY_CREDENTIALS_ENCRYPTION_KEY`. Ne l’envoyez jamais dans une conversation, un e-mail, une capture d’écran ou un dépôt Git.

| Vérification avant enregistrement | Résultat attendu |
|---|---|
| Longueur | 64 caractères, sans espace ni retour à la ligne. |
| Alphabet | Chiffres `0–9` et lettres `a–f` ou `A–F` seulement. |
| Origine | Générée de façon aléatoire, non réutilisée depuis un mot de passe, une clé API ou un numéro de téléphone. |
| Conservation | Coffre-fort de secrets de l’éditeur ; accès limité aux administrateurs d’infrastructure. |

## Rôle de la clé dans GlobalLogix

Le serveur convertit la chaîne hexadécimale en clé de 32 octets, génère un IV aléatoire de 12 octets pour chaque secret et chiffre avec `aes-256-gcm`. Il stocke ensuite une enveloppe `v1.iv.tag.payload` encodée en Base64URL. Le module `node:crypto` fournit les primitives de chiffrement, de déchiffrement et de génération aléatoire utilisées par cette implémentation. [2]

Cette conception garantit que la base de données ne contient pas les secrets Meta en clair. Les routes de lecture renvoient seulement une synthèse sûre : identifiants non sensibles, état du canal, modèle de message, quatre derniers chiffres éventuels et indicateur de configuration.

> **Attention à la rotation.** Ne remplacez pas la clé globale sans plan de migration : les secrets déjà chiffrés avec l’ancienne clé ne pourront plus être déchiffrés. Avant toute rotation, exportez ou reprovisionnez de manière contrôlée les identifiants Meta de chaque agence, puis validez les webhooks à nouveau.

## Activation par agence

Après la validation de la clé globale, l’administrateur de **chaque** agence suit le parcours suivant depuis **Réglages → Marque et WhatsApp de l’agence**. Le super administrateur GlobalLogix ne doit pas lire ni réutiliser les secrets d’une agence pour une autre.

| Étape | Action de l’administrateur d’agence | Contrôle GlobalLogix |
|---|---|---|
| 1. Préparer Meta | Créer ou sélectionner sa propre application Meta, son compte WhatsApp Business et son numéro professionnel. | Vérifier que l’agence est bien le propriétaire de ces ressources. |
| 2. Saisir les références | Renseigner Meta App ID, WhatsApp Business Account ID, Phone Number ID et le nom du modèle utilitaire approuvé. | Les IDs restent distincts par `agencyId`. |
| 3. Saisir les secrets | Renseigner l’Access Token, l’App Secret et le Verify Token de **cette** agence. | Les trois valeurs sont chiffrées côté serveur ; elles ne sont jamais réaffichées. |
| 4. Enregistrer | Cliquer sur **Enregistrer la connexion Meta**. | Le canal reste en brouillon ; aucun message n’est expédié automatiquement. |
| 5. Vérifier le webhook | Déclarer l’URL propre à l’agence : `https://<API_GLOBALLOGIX>/api/webhooks/whatsapp/<AGENCY_ID>`. | Le serveur répond au challenge Meta seulement si le Verify Token correspond au secret chiffré de cette agence. |
| 6. Contrôler les statuts | Envoyer un test Meta approuvé puis consulter le journal de messages. | Les retours Meta sont contrôlés par signature HMAC `x-hub-signature-256`, puis consignés sans secret ni numéro complet. |
| 7. Activer en production | Valider la configuration Meta, les modèles approuvés et les règles de consentement client. | Conserver le canal désactivé en cas d’échec de signature, de modèle ou de vérification. |

## Validation technique effectuée

Le test `tests/agency-credentials.test.ts` a été exécuté avec succès. Il vérifie le chiffrement/déchiffrement local des secrets Meta, le masquage du numéro d’expéditeur et la validité de la configuration de clé sans exposer sa valeur.

Les notifications réelles restent à activer uniquement après la saisie des trois secrets Meta propres à une agence, la vérification du webhook et la validation d’un modèle utilitaire par Meta. Cette séparation maintient l’isolation stricte entre les locataires du SaaS.

## Références

[1] [OpenSSL, `rand`](https://docs.openssl.org/1.0.2/man1/rand/)

[2] [Node.js, documentation `crypto`](https://nodejs.org/api/crypto.html)
