<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# Northsend Server

A secure file transfer backend built with NestJS, similar to WeTransfer but with client-side encryption.

## Features

- ✅ Transfer creation with metadata
- ✅ Chunked file uploads with encryption support
- ✅ Supabase Storage integration
- ✅ TypeScript with full type safety
- ✅ Validation with class-validator
- ✅ Modular architecture

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the root directory:

   ```env
   SUPABASE_URL=your_supabase_url_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Start the development server:**
   ```bash
   npm run start:dev
   ```

The server will run on `http://localhost:3000`

## API Endpoints

### POST /transfers

Create a new transfer with metadata.

**Request body:**

```json
{
  "senderEmail": "sender@example.com",
  "recipientEmails": ["recipient@example.com"],
  "title": "My Transfer",
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

**Response:**

```json
{
  "transferId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### GET /transfers/:id

Retrieve transfer metadata by ID.

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "senderEmail": "sender@example.com",
  "recipientEmails": ["recipient@example.com"],
  "title": "My Transfer",
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### POST /files/upload

Upload an encrypted file chunk.

**Request (multipart/form-data):**

- `chunk`: File chunk (binary data)
- `transferId`: UUID of the transfer
- `fileId`: UUID of the file
- `chunkIndex`: Index of the chunk (0-based)
- `totalChunks`: Total number of chunks
- `iv`: Initialization vector for encryption

**Response:**

```json
{
  "success": true,
  "chunkPath": "transfers/550e8400-e29b-41d4-a716-446655440000/file-id/chunk-0"
}
```

## Architecture

```
src/
├── app.module.ts          # Main application module
├── main.ts               # Application entry point
├── transfers/            # Transfer management
│   ├── transfers.controller.ts
│   ├── transfers.service.ts
│   ├── transfers.module.ts
│   ├── dto/
│   │   └── create-transfer.dto.ts
│   └── entities/
│       └── transfer.entity.ts
├── files/                # File upload handling
│   ├── files.controller.ts
│   ├── files.service.ts
│   └── files.module.ts
├── storage/              # Supabase integration
│   ├── supabase.service.ts
│   └── storage.module.ts
├── mail/                 # Email notifications (stub)
└── common/               # Shared utilities (guards, interceptors)
```

## Supabase Setup

1. Create a new Supabase project
2. Create a `transfers` table with the following schema:

   ```sql
   CREATE TABLE transfers (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     sender_email VARCHAR NOT NULL,
     recipient_emails TEXT[] NOT NULL,
     title VARCHAR NOT NULL,
     expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. Create a storage bucket named `file-chunks` for storing encrypted file chunks

4. Get your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the project settings

## Development

- `npm run start:dev` - Development server with hot reload
- `npm run build` - Build for production
- `npm run start:prod` - Run production build
- `npm run test` - Run tests
- `npm run lint` - Run linter

## Next Steps

- [ ] Add email notifications
- [ ] Implement rate limiting
- [ ] Add authentication/authorization
- [ ] Add file download endpoints
- [ ] Add transfer expiration cleanup
- [ ] Add comprehensive error handling
- [ ] Add request logging
- [ ] Add API documentation with Swagger
