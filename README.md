# Chat Bat — Microservice de messagerie privée 1-to-1

Ce microservice fournit un système de chat instantané entre deux utilisateurs uniquement, avec une architecture simple en Node.js, Express.js, MongoDB, Mongoose et Socket.IO.

## Stack

- Node.js
- Express.js
- JavaScript
- MongoDB
- Mongoose
- Socket.IO

## Architecture

```text
src/
├── config/
│   ├── database.js
│   └── env.js
├── common/
│   ├── errors/
│   ├── middlewares/
│   └── utils/
├── modules/
│   └── chat/
│       ├── models/
│       │   ├── Conversation.js
│       │   ├── Message.js
│       │   └── ConversationMember.js
│       ├── repositories/
│       │   ├── conversation.repository.js
│       │   └── message.repository.js
│       ├── services/
│       │   ├── conversation.service.js
│       │   └── message.service.js
│       ├── controllers/
│       │   ├── conversation.controller.js
│       │   └── message.controller.js
│       ├── validators/
│       │   ├── conversation.validator.js
│       │   └── message.validator.js
│       └── routes/
│           ├── conversation.routes.js
│           └── message.routes.js
├── sockets/
│   ├── socket.server.js
│   ├── socket.handlers.js
│   └── socket.presence.js
├── app.js
└── server.js
```

## Sécurité / Authentification

Le service ne gère pas l’authentification complète. Il attend simplement un identifiant utilisateur déjà validé par un autre microservice.

Le flux attendu est :

- l’API Gateway ou un autre microservice valide le JWT
- le service de chat reçoit l’identifiant de l’utilisateur authentifié
- la clé de l’utilisateur est envoyée dans le header `x-user-id`

Exemple :

```http
x-user-id: user-123
```

Alternative :

```json
{ "user_id": "user-123" }
```

## Variables d’environnement

Copier le fichier `.env.example` vers `.env` puis ajuster les valeurs selon votre environnement :

```bash
cp .env.example .env
```

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/chat_service
NODE_ENV=development
CORS_ORIGIN=*
```

Description :

- `PORT` : port HTTP du microservice
- `MONGO_URI` : chaîne de connexion MongoDB
- `NODE_ENV` : mode d’exécution (`development`, `production`)
- `CORS_ORIGIN` : origine autorisée pour le cross-origin

## Documentation pour les intégrateurs

- [Documentation frontend intégrateur](./docs/FRONTEND_INTEGRATION.md) : exemples REST avec `fetch`, Socket.IO, événements et parcours conseillé.
- [Swagger UI](http://localhost:3000/api-docs) : interface interactive après démarrage du service.
- [Spécification OpenAPI JSON](http://localhost:3000/api-docs.json) : contrat REST machine-readable.
- [Fichier OpenAPI source](./docs/openapi.json)
- [Collection Postman](./docs/postman_collection.json)
- [Environnement Postman local](./docs/postman_environment.json)

## Démarrage

```bash
npm install
npm run dev
```

Swagger UI est disponible sur `http://localhost:3000/api-docs` et le document OpenAPI sur `http://localhost:3000/api-docs.json`.

## API REST

Toutes les routes REST utilisent l’authentification implicite via le header `x-user-id`.

### 1. Créer ou récupérer une conversation privée

```http
POST /api/conversations/find-or-create
```

#### Headers

```http
x-user-id: user-123
```

#### Body

```json
{
  "participant_id": "user-456"
}
```

#### Réponse

```json
{
  "success": true,
  "data": {
    "_id": "64d4f2fb1a8d8e2be3cde44f",
    "participant_one": "user-123",
    "participant_two": "user-456",
    "participants_key": "user-123:user-456",
    "last_message_id": null,
    "last_message_at": null,
    "created_at": "2026-10-05T12:00:00.000Z",
    "updated_at": "2026-10-05T12:00:00.000Z",
    "is_deleted": false
  }
}
```

### 2. Lister les conversations d’un utilisateur

```http
GET /api/conversations
```

#### Headers

```http
x-user-id: user-123
```

#### Réponse

```json
{
  "success": true,
  "data": [
    {
      "_id": "64d4f2fb1a8d8e2be3cde44f",
      "participant_one": "user-123",
      "participant_two": "user-456",
      "participants_key": "user-123:user-456",
      "unread_count": 2,
      "other_participant": "user-456",
      "last_message_at": "2026-10-05T14:15:00.000Z"
    }
  ]
}
```

### 3. Récupérer l’historique d’une conversation

```http
GET /api/conversations/:conversationId/messages?page=1&limit=20
```

#### Headers

```http
x-user-id: user-123
```

#### Réponse

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "_id": "64d4f2fb1a8d8e2be3cde44f",
        "conversation": "64d4f2fb1a8d8e2be3cde44f",
        "sender": "user-123",
        "recipient": "user-456",
        "content": "Bonjour",
        "status": "read",
        "reply_to": null,
        "edited": false,
        "created_at": "2026-10-05T12:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### 4. Envoyer un message

```http
POST /api/messages
```

#### Headers

```http
x-user-id: user-123
```

#### Body

```json
{
  "conversation_id": "64d4f2fb1a8d8e2be3cde44f",
  "content": "Salut, ça va ?",
  "reply_to": "64d4f2fb1a8d8e2be3cde44e"
}
```

#### Réponse

```json
{
  "success": true,
  "data": {
    "_id": "64d4f303a758b5f5d7f637a1",
    "conversation": "64d4f2fb1a8d8e2be3cde44f",
    "sender": "user-123",
    "recipient": "user-456",
    "content": "Salut, ça va ?",
    "status": "sent",
    "reply_to": "64d4f2fb1a8d8e2be3cde44e",
    "created_at": "2026-10-05T12:05:00.000Z"
  }
}
```

### 5. Modifier un message

```http
PATCH /api/messages/:messageId
```

#### Body

```json
{
  "content": "Salut, tu vas bien ?"
}
```

### 6. Supprimer un message

```http
DELETE /api/messages/:messageId
```

### 7. Marquer un message comme livré

```http
POST /api/messages/:messageId/delivered
```

### 8. Marquer un message comme lu

```http
POST /api/messages/:messageId/read
```

### 9. Compter les messages non lus globaux

```http
GET /api/messages/unread-count
```

#### Réponse

```json
{
  "success": true,
  "data": {
    "total_unread": 7
  }
}
```

## Socket.IO

### Événements Socket.IO

Le service expose aussi un canal temps réel pour les événements suivants.

### Connexion

Le client doit envoyer `user_id` dans `socket.handshake.auth` ou dans la query `user_id`.

### Événements émis par le serveur

- `presence:update`
- `presence:connected`
- `conversation:joined`
- `message:new`
- `message:status`
- `typing`

### Événements reçus par le serveur

#### Rejoindre une conversation

```js
socket.emit('join_conversation', { conversationId: 'conv-123' });
```

#### Démarrer/arrêter le typing

```js
socket.emit('typing', { conversationId: 'conv-123', isTyping: true });
```

#### Envoyer un message temps réel

```js
socket.emit('send_message', {
  conversationId: 'conv-123',
  content: 'Bonjour',
  replyTo: null
});
```

#### Marquer un message comme livré

```js
socket.emit('message_delivered', { messageId: 'msg-123' });
```

#### Marquer un message comme lu

```js
socket.emit('message_read', { messageId: 'msg-123' });
```

## Gestion des erreurs

Le service retourne une structure uniforme de réponse :

```json
{
  "success": false,
  "message": "Message content cannot be empty"
}
```

Statuts HTTP les plus courants :

- `200` : requête réussie
- `201` : message créé
- `400` : mauvais payload ou validation
- `401` : utilisateur non identifié
- `403` : accès interdit
- `404` : ressource introuvable
- `500` : erreur serveur

## Exemples d’utilisation

### Exemple de requête REST

```bash
curl -X POST http://localhost:3000/api/conversations/find-or-create \
  -H "x-user-id: user-123" \
  -H "Content-Type: application/json" \
  -d '{"participant_id":"user-456"}'
```

### Exemple de message Socket.IO

```js
const socket = io('http://localhost:3000', {
  auth: { user_id: 'user-123' }
});

socket.emit('join_conversation', { conversationId: '64d4f2fb1a8d8e2be3cde44f' });
socket.emit('typing', { conversationId: '64d4f2fb1a8d8e2be3cde44f', isTyping: true });
socket.emit('send_message', {
  conversationId: '64d4f2fb1a8d8e2be3cde44f',
  content: 'Bonjour',
  replyTo: null,
});
```

## Tests

Le projet contient des tests unitaires basés sur le runner natif de Node.js.

```bash
npm test
```

## Points d’évolution

Les fonctionnalités suivantes ne sont pas encore incluses dans cette première version :

- groupes
- appels audio / vidéo
- messages vocaux
- fichiers complexes
- réactions emoji
- communautés
- notifications avancées
