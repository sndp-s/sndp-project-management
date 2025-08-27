# sndp-project-management

> ⚠️ This repository contains a technical screening project for [VoiceAIWrapper](https://voiceaiwrapper.com).  
> It is a demo project and not intended for production use.

---

## Table of Contents

- [Specification](./SPEC.md)_
- [Setup & Deployment](#setup--deployment)
<!-- - [License](#license) -->

### Setup & Deployment
- Clone this repo
- add these env files to the root

`.db.prod.env`
```
POSTGRES_DB=DB_NAME
POSTGRES_USER=DB_USER
POSTGRES_PASSWORD=STRONG_DB_PASSWORD
```

`.backend.prod.env`
```
DB_HOST=project-management-db
DB_PORT=5432
DB_NAME=DB_NAME
DB_USER=DB_USER
DB_PASS=DB_PASSWORD

SECRET_KEY=STRONG_SECRET_KEY

DEBUG=False

ALLOWED_HOSTS=localhost

CORS_ALLOWED_ORIGINS=http://localhost:3000

JWT_ACCESS_TOKEN_EXPIRES_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRES_DAYS=7
```

- clone this file to `root/frontend`
`frontend.prod.env`
```
VITE_API_URL=http://project-management-backend:8000/graphql/
```

- build and run containers (from the repo root): `docker compose up -d`
