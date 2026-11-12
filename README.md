# Gestión Control Room

Web para que cada delegación gestione sus Control Room y los preventivos VCO. Next.js, Prisma y Postgres.

## Local

```powershell
npm install
copy .env.example .env
npx prisma migrate dev
$env:SEED_ADMIN_PASSWORD="una-clave-larga"
npx prisma db seed
npm run dev
```

Entra en http://localhost:3000 con el usuario `admin` y `SEED_ADMIN_PASSWORD`. En Centros pon la clave de `sada`, `porrino`, `orense`, `santiago`, `pontevedra` y `lugo`.

## Render

Proyecto nuevo **Control Room** en el espacio Laia, al lado de Call center NPS. Región Frankfurt. Base `control-room-db` (plan `basic_256mb`, Postgres 16) y servicio `control-room-web` (plan `starter`).

Antes del primer arranque define `SEED_ADMIN_PASSWORD`. El arranque aplica las migraciones y crea el administrador si aún no existe. No vuelve a cambiar su clave en los arranques siguientes. `SEED_AGUSTIN_PASSWORD` y `SEED_MAR_PASSWORD` crean las cuentas admin `agustin` y `mar` del mismo modo, solo si aún no existen.

La subida automática desde ICSS-ANS24 no entra en esta versión. El JSON y el Excel se importan a mano desde Importar.
