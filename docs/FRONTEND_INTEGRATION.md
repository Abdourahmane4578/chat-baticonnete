# Guide d'intégration frontend

Ce guide décrit comment un client web/mobile appelle l'API REST et se connecte au canal Socket.IO.

## Prérequis et identité utilisateur

Le service Chat ne valide pas de jeton et ne crée pas d'identité. En production, le frontend présente son jeton à l'API Gateway ou au service d'authentification. Ce composant valide le jeton puis transmet au service Chat un `x-user-id` de confiance. Ne laissez pas un client non fiable choisir directement cet en-tête.

Les exemples locaux utilisent `x-user-id` et `socket.handshake.auth.user_id` pour simuler l'identité fournie par cette couche externe.

## Références de documentation

- Interface Swagger : `http://localhost:3000/api-docs`
- Spécification OpenAPI JSON : `http://localhost:3000/api-docs.json`
- Collection Postman : [`postman_collection.json`](./postman_collection.json)
- Environnement Postman local : [`postman_environment.json`](./postman_environment.json)

## Parcours conseillé

1. Appeler `POST /api/conversations/find-or-create` avec l'identifiant du correspondant.
2. Enregistrer l'`_id` de conversation reçu.
3. Charger l'historique via `GET /api/conversations/{conversationId}/messages?page=1&limit=20`.
4. Ouvrir Socket.IO en passant l'identifiant fourni par la couche d'authentification.
5. Écouter les événements avant de rejoindre la conversation pour ne pas manquer les événements suivants.
6. Rejoindre le salon, envoyer/recevoir les messages et notifier les états delivered/read.

## Exemple REST avec fetch

Le `userId` ci-dessous est une valeur de démonstration. Dans une application réelle, le client envoie son jeton à la Gateway et ne forge pas `x-user-id`.

```js
const API_URL = 'http://localhost:3000';
const userId = 'user-123';

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
      ...options.headers,
    },
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message || `HTTP ${response.status}`);
  }
  return body.data;
}

const conversation = await api('/api/conversations/find-or-create', {
  method: 'POST',
  body: JSON.stringify({ participant_id: 'user-456' }),
});

const history = await api(
  `/api/conversations/${conversation._id}/messages?page=1&limit=20`
);

const sentMessage = await api('/api/messages', {
  method: 'POST',
  body: JSON.stringify({
    conversation_id: conversation._id,
    content: 'Bonjour !',
    reply_to: null,
  }),
});
```

`api()` lève une erreur sur les réponses HTTP non réussies. Le format d'erreur est `{ "success": false, "message": "..." }`.

## Exemple Socket.IO côté navigateur

Installer le client dans le frontend avec `npm install socket.io-client`.

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { user_id: 'user-123' },
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 5000,
});

socket.on('connect', () => {
  socket.emit('join_conversation', { conversationId: 'CONVERSATION_ID' });
});

socket.on('conversation:joined', ({ conversationId }) => {
  console.log('Salon rejoint', conversationId);
});

socket.on('message:new', (message) => {
  console.log('Nouveau message', message);
  // Ajouter le message à l'interface, en évitant les doublons avec son _id.
});

socket.on('message:status', ({ messageId, status, user_id }) => {
  console.log('Statut du message', { messageId, status, user_id });
});

socket.on('typing', ({ conversationId, user_id, isTyping }) => {
  console.log('Indicateur de saisie', { conversationId, user_id, isTyping });
});

socket.on('presence:update', ({ user_id, online, last_seen }) => {
  console.log('Présence', { user_id, online, last_seen });
});

socket.on('disconnect', (reason) => {
  console.log('Socket déconnecté', reason);
});
```

### Émettre les événements

```js
socket.emit('send_message', {
  conversationId: 'CONVERSATION_ID',
  content: 'Bonjour en temps réel',
  replyTo: null,
}, (result) => {
  if (!result.success) {
    console.error(result.message);
    return;
  }
  // L'ACK confirme l'enregistrement MongoDB. Le message:new est diffusé au salon.
  console.log('Message enregistré', result.data);
});

socket.emit('typing', {
  conversationId: 'CONVERSATION_ID',
  isTyping: true,
});

socket.emit('message_delivered', { messageId: 'MESSAGE_ID' }, (result) => {
  if (!result.success) console.error(result.message);
});

socket.emit('message_read', { messageId: 'MESSAGE_ID' }, (result) => {
  if (!result.success) console.error(result.message);
});
```

Les événements `send_message`, `message_delivered` et `message_read` acceptent un callback d'acquittement `{ success, data }` ou `{ success, message }`. `message:new` et `message:status` sont les événements à utiliser pour synchroniser l'interface.

## Événements et payloads

| Direction | Événement | Payload |
| --- | --- | --- |
| Client → serveur | `join_conversation` | `{ conversationId }` |
| Client → serveur | `leave_conversation` | `{ conversationId }` |
| Client → serveur | `typing` | `{ conversationId, isTyping }` |
| Client → serveur | `send_message` | `{ conversationId, content, replyTo }` + ACK |
| Client → serveur | `message_delivered` | `{ messageId }` + ACK |
| Client → serveur | `message_read` | `{ messageId }` + ACK |
| Serveur → client | `presence:connected` | `{ user_id, online, connected_socket_ids }` |
| Serveur → client | `presence:update` | `{ user_id, online, last_seen }` |
| Serveur → client | `conversation:joined` | `{ conversationId }` |
| Serveur → salon | `message:new` | Objet Message créé |
| Serveur → salon | `message:status` | `{ messageId, status, user_id }` |
| Serveur → salon | `typing` | `{ conversationId, user_id, isTyping }` |

## Notes d'implémentation frontend

- Utiliser l'API REST pour retrouver/charger les données après une reconnexion ; ne pas considérer la socket comme un stockage durable.
- Utiliser `_id` comme clé stable pour éviter les doublons entre l'ACK d'envoi et l'événement `message:new`.
- Un statut `sent` signifie enregistré par le service ; `delivered` et `read` sont signalés par le destinataire.
- La pagination utilise `page` commençant à 1 et `limit` (20 par défaut). Les messages de la page sont renvoyés du plus ancien au plus récent.
- Déconnecter proprement la socket lorsque l'utilisateur quitte la session et rejoindre de nouveau les salons nécessaires après reconnexion.
- Le statut de présence est en mémoire locale au processus : avec plusieurs instances de service, un adaptateur partagé (par exemple Redis) sera nécessaire.

## Limites actuelles à prendre en compte

- Les rooms Socket.IO ne sont pas actuellement vérifiées contre l'appartenance à la conversation. N'exposez pas directement le serveur socket à des clients non fiables avant d'ajouter une vérification d'autorisation à `join_conversation` et `leave_conversation`.
- Le `user_id` Socket.IO est lu depuis le handshake ; il doit être injecté par un mécanisme de confiance (Gateway/auth middleware) en production.
- La présence n'est pas persistée en base ; `last_seen` envoyé à la déconnexion est une valeur émise par socket et n'est pas une API de statut persistante.
