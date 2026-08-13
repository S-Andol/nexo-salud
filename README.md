# NEXO Salud

**Tu salud, organizada.**

Sistema web de gestión de turnos médicos desarrollado como Proyecto Integrador de Testing de Aplicaciones – UADE.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL / Neon
- JWT + bcrypt

## V1

- ✓ Registro e inicio de sesión
- ✓ Profesionales y especialidades
- ✓ Disponibilidad real
- ✓ Reserva de turnos
- ✓ Cancelación
- ✓ Reglas RN-01 a RN-10
- ✓ Prevención de double-booking
- ✓ Persistencia PostgreSQL
- ✓ Suite de integración 30/30
- ✓ Baseline v1.0.0

Documentación técnica completa: [`docs/V1_TECHNICAL_BASELINE.md`](docs/V1_TECHNICAL_BASELINE.md).

## Quick start

```bash
npm install
cp .env.example .env   # completar DATABASE_URL, DIRECT_URL, JWT_SECRET

npx prisma generate
npx prisma migrate deploy
npm run db:seed

npm run dev             # http://localhost:3000
```

Verificaciones:

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run test:integration   # requiere `npm run dev` corriendo en otra terminal
```
