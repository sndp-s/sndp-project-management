# sndp-project-management

> ⚠️ This repository contains a technical screening project for [VoiceAIWrapper](https://voiceaiwrapper.com).  
> It is a demo project and not intended for production use.

---

## Table of Contents

- [Specification](./SPEC.md)
- [Setup & Deployment](#setup--deployment)
<!-- - [License](#license) -->

### Setup & Deployment

1. clone this repo
2. add these env files to the root

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
DB_PASS=STRONG_DB_PASSWORD

SECRET_KEY=STRONG_SECRET_KEY

DEBUG=False

ALLOWED_HOSTS=localhost

CORS_ALLOWED_ORIGINS=http://localhost:3000

JWT_ACCESS_TOKEN_EXPIRES_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRES_DAYS=7
```

3. add this env file `frontend/frontend.prod.env`

```
VITE_API_URL=http://localhost:8000/graphql/
```

4. build and run the containers (from the repo root): `docker compose up -d`

5. access admin dashboard at `http://localhost:8000/admin` and create a superuser to manage app users and other data.

```bash
docker compose exec \
  -e DJANGO_SUPERUSER_USERNAME=admin \
  -e DJANGO_SUPERUSER_EMAIL=admin@example.com \
  -e DJANGO_SUPERUSER_PASSWORD=StrongPassword123 \
  project-management-backend \
  uv run python manage.py createsuperuser --noinput
```

6. create a new org from the dashboard

7. create a new user from the dashboard

8. login to the app dashboard at `http://localhost:3000`
