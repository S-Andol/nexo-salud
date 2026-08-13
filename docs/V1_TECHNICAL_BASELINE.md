# NEXO Salud V1 — Technical Baseline

**Version:** v1.0.0
**Status:** Frozen stable baseline (2026-08-13)
**Scope:** Núcleo funcional de gestión de turnos, rol único PACIENTE. No incluye V2/V3.

---

## 1. Nombre y objetivo

**NEXO Salud** — plataforma web de gestión de turnos médicos para un centro médico privado.

**Slogan:** *Tu salud, organizada.*

**Objetivo de V1:** permitir que un paciente se registre, consulte especialidades y profesionales, reserve un turno respetando reglas de negocio reales (no solo validación visual), gestione sus turnos (consulta, cancelación) y mantenga sus datos persistidos en una base de datos relacional real. V1 existe para servir de base a un proceso posterior de Testing de Software (manual y automatizado), por lo que prioriza lógica de negocio determinística y verificable sobre cantidad de features.

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión / nota |
|---|---|---|
| Framework | Next.js (App Router) | 16.3.0 |
| Lenguaje | TypeScript | ^5 |
| Estilos | Tailwind CSS | v4 (config vía `@theme` en `globals.css`, sin `tailwind.config.js`) |
| ORM | Prisma | 6.19.3 (pinneado deliberadamente — no actualizar a 7.x sin re-verificar) |
| Base de datos | PostgreSQL (Neon, serverless) | `DATABASE_URL` pooled (runtime) + `DIRECT_URL` unpooled (migraciones) |
| Hashing de contraseñas | bcryptjs | costo 12 |
| Sesión | JWT (librería `jose`, HS256) en cookie httpOnly | expiración 7 días |
| Validación | zod | esquemas compartidos cliente/servidor |
| Control de versiones | Git | baseline `v1.0.0` |

No se usa NextAuth/Auth.js: la autenticación es 100% código propio (ver sección 7).

---

## 3. Arquitectura general

```
UI (app/, components/)
   │
   ▼
API Routes (app/api/**/route.ts)      — controladores delgados: auth, parseo, delegar a service
   │
   ▼
Services (lib/services/*.service.ts)  — TODA la lógica de negocio y reglas RN-01..RN-10
   │
   ▼
Prisma (lib/db/prisma.ts)             — acceso a datos, un único PrismaClient reusado
   │
   ▼
PostgreSQL (Neon)
```

Capas transversales:
- `lib/validation/*.schema.ts` — esquemas zod, reutilizados en formularios cliente y en las API routes.
- `lib/auth/*` — hashing, JWT, sesión (cookie), guards de autorización.
- `lib/time/timezone.ts` — única fuente de verdad para conversión de fechas/horas Buenos Aires ↔ UTC.
- `lib/errors/app-error.ts` — taxonomía de errores de dominio, nunca se filtra un error técnico al usuario.

Esta separación es la que permite agregar roles/features de V2 sin reescribir la capa de negocio: un nuevo rol solo necesita nuevas rutas + `requireRole()` reutilizando los mismos services.

---

## 4. Modelo de datos principal

Definido en `prisma/schema.prisma`.

- **User** — `id, email (unique), passwordHash, role (enum, default PACIENTE), status, createdAt, updatedAt`. Relación 1:1 con `Patient`.
- **Patient** — `id, userId (unique FK → User), firstName, lastName, dni (unique), birthDate, phone, createdAt, updatedAt`. Relación 1:N con `Appointment`.
- **Specialty** — `id, name (unique), description, appointmentDuration (minutos), active, createdAt, updatedAt`. Relación 1:N con `Professional` y con `Appointment`.
- **Professional** — `id, firstName, lastName, licenseNumber (unique), specialtyId (FK), description, photoUrl, active, createdAt, updatedAt`. Relación 1:N con `ProfessionalSchedule` y con `Appointment`.
- **ProfessionalSchedule** — `id, professionalId (FK), dayOfWeek (enum), startTime ("HH:mm"), endTime ("HH:mm")`. Un profesional puede tener múltiples franjas por día (ej. mañana + tarde).
- **Appointment** — `id, appointmentCode (unique, formato NX-YYYY-XXXXXX), patientId (FK), professionalId (FK), specialtyId (FK), startDatetime (timestamptz), endDatetime (timestamptz), status (enum), createdAt, updatedAt`. Además, a nivel SQL (no en `schema.prisma`, ver sección 8) tiene una columna `range tstzrange` mantenida por trigger.
- **AppointmentCodeCounter** — `year (PK), lastSeq`. Contador atómico para generar `appointmentCode`.

Relaciones clave: `User 1—1 Patient`, `Specialty 1—N Professional`, `Professional 1—N ProfessionalSchedule`, y `Patient / Professional / Specialty` cada uno `1—N Appointment`.

Índices relevantes: `Appointment(professionalId, startDatetime)`, `Appointment(patientId, startDatetime)`, `Appointment(status)`, `Professional(specialtyId)`, `ProfessionalSchedule(professionalId, dayOfWeek)`.

---

## 5. Reglas de negocio (RN-01 a RN-10)

Todas implementadas en `src/lib/services/appointment.service.ts::createAppointment`, dentro de una única transacción Prisma (`Serializable`), en el orden listado. Cada una tiene su propio `AppErrorCode` — nunca se combinan dos reglas bajo un mismo código.

| ID | Descripción | Comportamiento esperado | Error code | HTTP |
|---|---|---|---|---|
| RN-01 | No reservar fecha pasada | Se rechaza si `date < hoy` (calendario Buenos Aires) | `PAST_DATE` | 400 |
| RN-02 | Turno dentro del horario de atención | Se rechaza si el horario/día no cae dentro de una franja de `ProfessionalSchedule` del profesional | `OUTSIDE_AVAILABILITY` | 400 |
| RN-03 | Profesional sin turnos superpuestos | Se rechaza si el rango `[start,end)` se superpone con otro turno CONFIRMADO del mismo profesional | `SLOT_UNAVAILABLE` | 409 |
| RN-04 | Paciente sin turnos superpuestos | Se rechaza si el rango se superpone con otro turno CONFIRMADO del mismo paciente (con cualquier profesional) | `PATIENT_OVERLAP` | 409 |
| RN-05 | Duración según especialidad | `endDatetime = startDatetime + specialty.appointmentDuration`; esa duración es la que se usa para RN-03/RN-04 | — (no es una validación con error propio, es la base de cálculo de las anteriores) | — |
| RN-06 | Anticipación mínima 2 horas | Se rechaza si `startDatetime < ahora + 2h` | `LEAD_TIME_TOO_SHORT` | 400 |
| RN-07 | Anticipación máxima 90 días | Se rechaza si `startDatetime > ahora + 90d` | `LEAD_TIME_TOO_LONG` | 400 |
| RN-08 | Máximo 5 turnos futuros activos | Se rechaza si el paciente ya tiene 5 turnos CONFIRMADO con `startDatetime > ahora`. Mensaje exacto: *"Alcanzaste el límite máximo de 5 turnos futuros."* | `MAX_ACTIVE_APPOINTMENTS_REACHED` | 409 |
| RN-09 | No reserva duplicada idéntica | Se rechaza si ya existe un turno CONFIRMADO con mismo paciente+profesional+`startDatetime` | `DUPLICATE_BOOKING` | 409 |
| RN-10 | Protección contra doble click | El botón "Confirmar turno" se deshabilita + muestra loading en el primer click; estructuralmente respaldado por RN-09 y el exclusion constraint (sección 8), por lo que un doble POST real tampoco puede crear un duplicado | (reutiliza `DUPLICATE_BOOKING` o `SLOT_UNAVAILABLE` según el caso) | 409 |

`MIN_LEAD_TIME_HOURS`, `MAX_LEAD_TIME_DAYS`, `MAX_ACTIVE_FUTURE_APPOINTMENTS` están centralizados en `src/lib/constants.ts`.

---

## 6. Estados de Appointment

Enum `AppointmentStatus`: `CONFIRMADO | CANCELADO | FINALIZADO`.

- Todo turno nuevo nace en **CONFIRMADO**.
- **Transición permitida interactivamente por el paciente en V1:** `CONFIRMADO → CANCELADO` (única transición ejecutable desde la UI/API en V1).
- **FINALIZADO** existe como valor de estado (usado en datos históricos/seed) pero **no hay ninguna acción del paciente que lo dispare en V1** — esa transición (marcar un turno como atendido) pertenece al rol Profesional, que se incorpora en V2.
- **Explícitamente bloqueadas** por el service, sin importar qué envíe el cliente: `CANCELADO → FINALIZADO` y `FINALIZADO → CANCELADO`. Cualquier intento de cancelar un turno que no esté en CONFIRMADO devuelve `INVALID_STATUS_TRANSITION` (400).
- Cancelar nunca borra la fila: solo cambia `status` (soft state change), preservando `createdAt`/`updatedAt` para historial.

---

## 7. Autenticación y protección de rutas

- **Hashing:** `bcryptjs`, costo 12 (`lib/auth/password.ts`).
- **Sesión:** JWT firmado (HS256, `jose`) con payload `{ sub: userId, patientId, role, email }`, expiración 7 días (`lib/auth/jwt.ts`).
- **Cookie:** `nexo_session`, `httpOnly: true`, `sameSite: "lax"`, `secure` solo en producción, `path: "/"` (`lib/auth/session.ts`).
- **Registro:** crea `User` + `Patient` en una única transacción; email se normaliza a minúsculas/trim; unicidad de email y DNI verificada antes de crear.
- **Login:** devuelve el mismo mensaje genérico ("Email o contraseña incorrectos") tanto si el email no existe como si la contraseña es incorrecta, para evitar enumeración de usuarios.
- **Protección de rutas:** `src/middleware.ts` (Edge runtime, verifica el JWT con `jose` directamente) protege `/turnos/*` y `/perfil/*`, redirigiendo a `/login?redirect=<path>` si no hay sesión válida.
- **Defensa adicional:** los Server Components de esas páginas llaman a `requireSessionOrRedirect()` como segunda capa (por si el middleware no corriera).
- **API routes protegidas:** usan `requireAuth()` (lanza `UNAUTHENTICATED`, 401) + `requireRole(session, ["PACIENTE"])` — este último es el único punto de control de rol en todo el código, ya listo para que V2 agregue `PROFESIONAL`/`RECEPCIONISTA`/`ADMIN` sin reestructurar nada.

---

## 8. Concurrencia y prevención de double-booking

La garantía **no depende únicamente del código de aplicación** — está reforzada en tres capas independientes:

1. **Pre-check de aplicación** (dentro de la transacción, antes del INSERT): consultas `findFirst` que buscan solapamiento existente para el profesional (RN-03) y para el paciente (RN-04). Da un mensaje amigable rápido en el caso común (sin condición de carrera real).
2. **Transacción `Serializable`:** todo `createAppointment` corre dentro de `prisma.$transaction(..., { isolationLevel: Serializable })`, protegiendo también el conteo de RN-08 y el incremento atómico del contador de código de turno. Si Postgres detecta un conflicto de escritura real (`40001`), el service **reintenta la transacción una vez** automáticamente.
3. **Exclusion constraint de PostgreSQL** (la garantía estructural real, no expresable en `schema.prisma`): en `prisma/exclusion-constraints.sql`, aplicada como migración separada —
   - columna `range tstzrange`, mantenida por un trigger `BEFORE INSERT OR UPDATE` (no por `GENERATED ALWAYS AS`, porque `tstzrange()` es `STABLE` no `IMMUTABLE` en Postgres y una columna generada lo rechaza);
   - `CONSTRAINT no_overlap_per_professional EXCLUDE USING gist (professional_id WITH =, range WITH &&) WHERE (status = 'CONFIRMADO')`;
   - `CONSTRAINT no_overlap_per_patient EXCLUDE USING gist (patient_id WITH =, range WITH &&) WHERE (status = 'CONFIRMADO')`.

   Estos constraints hacen que dos transacciones concurrentes insertando rangos solapados **no puedan ambas confirmar**, sin importar qué chequeo previo haya hecho la aplicación.

**Comportamiento esperado ante dos reservas simultáneas del mismo horario:**
- Exactamente una de las dos requests obtiene 201 (turno creado).
- La otra obtiene 409 con código `SLOT_UNAVAILABLE`, con uno de dos mensajes posibles según el timing exacto de la carrera (ambos son resultados correctos de la misma garantía, no dos comportamientos distintos):
  - *"Ese horario ya no está disponible. Elegí otro horario."* (atrapado por el pre-check, si la transacción ganadora ya había confirmado).
  - *"Este horario acaba de ser reservado por otra persona. Seleccioná otro horario disponible."* (atrapado directamente por el exclusion constraint / su reintento, si ambas pasaron el pre-check antes de que cualquiera confirmara).
- En ningún caso quedan dos filas CONFIRMADO solapadas en la base — verificado en la baseline con una consulta SQL directa (ver sección 11).

---

## 9. Datos seed

Generados por `prisma/seed.ts` (`npm run db:seed`), con un PRNG determinístico (mulberry32, semilla fija) para reproducibilidad. El script vacía las tablas relevantes antes de volver a poblarlas, por lo que es seguro re-ejecutarlo.

- **8 especialidades:** Clínica Médica (30 min), Cardiología (30), Dermatología (20), Traumatología (30), Pediatría (25), Oftalmología (20), Psicología (60), Nutrición (45).
- **12 profesionales**, distribuidos entre las 8 especialidades (algunas con 2), cada uno con matrícula única (`MN NNNNN`) y una de 7 plantillas de horario semanal variadas (incluye un caso con dos franjas en el mismo día, para ejercitar la generación de slots con múltiples rangos).
- **20 pacientes** ficticios (+ cuenta demo), con DNI/email/teléfono únicos generados determinísticamente.
- **~40 turnos históricos** (`FINALIZADO`), en los últimos 180 días.
- **~20 turnos futuros** (`CONFIRMADO`), dentro de la ventana de 90 días (RN-07), respetando RN-08 (máx. 5 por paciente).
- **~8 turnos cancelados** (`CANCELADO`), mezclados en el rango histórico/futuro.
- Los conteos exactos generados en la corrida de baseline: **40 históricos, 20 futuros, 8 cancelados**.
- Todos los turnos se generan sin solapamientos reales (el generador consume slots reales calculados con la misma lógica de disponibilidad que usa la app, no horarios inventados).
- El contador local de códigos de turno usado durante el seed se persiste al final en `AppointmentCodeCounter`, para que los primeros turnos reales creados después del seed no colisionen con un código ya usado.

**Cuenta demo:** `paciente@nexosalud.demo` / `DemoPaciente2026!`, con una mezcla propia de turnos próximos, históricos y cancelados. El banner con estas credenciales en `/login` solo se muestra si `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=true`.

---

## 10. Testabilidad

- **`data-testid` estables** en todos los elementos interactivos clave: `login-email`, `login-password`, `login-submit`, `register-dni` (+ el resto de campos de registro), `specialty-select`, `professional-select`, `appointment-date` (+ subelementos `appointment-date-YYYY-MM-DD` por día), `appointment-time` (+ `appointment-time-HH:mm` por slot), `appointment-confirm`, `appointment-cancel` / `appointment-cancel-confirm` / `appointment-cancel-dismiss`, `profile-save`, entre otros. Ninguno usa un índice dinámico como identificador — los sub-ids son determinísticos a partir del dato (fecha/hora), no de la posición.
- **`integration_test.mjs`** — suite de integración escrita durante la construcción de V1 (vive fuera del repo, en el scratchpad de la sesión de build; no está commiteada). Golpea la API HTTP real (no llama a los services directamente), cubre: registro, guard de autenticación, RN-01/06/07/08/09, máquina de estados de cancelación, actualización de perfil, login de cuenta demo, y la prueba de concurrencia (incluye una verificación SQL directa de cero solapamientos). Recomendado migrarla a un archivo versionado del repo si el proyecto avanza hacia la fase V3 de testing automatizado.
- **Reglas determinísticas:** toda la lógica de fecha/hora pasa por `lib/time/timezone.ts` (offset fijo `-03:00`, sin dependencia de la zona horaria del servidor ni de `Date#getDay()`/`getHours()` directos), por lo que los casos límite (exactamente 2h, 1h59m, exactamente 90 días, 90d+1, etc.) son reproducibles.
- **Códigos de error estables:** cada regla de negocio devuelve un `AppErrorCode` propio (ver tabla en sección 5) en `{ error: { code, message, fields? } }` — el frontend y cualquier test deben usar `code`, nunca parsear el texto de `message`.

---

## 11. Resultado de la baseline v1.0.0

Todas las verificaciones fueron ejecutadas contra la base de datos real (Neon), no simuladas:

| Verificación | Resultado |
|---|---|
| `tsc --noEmit` (typecheck) | ✅ PASS |
| `eslint` (lint) | ✅ PASS |
| `next build` (producción) | ✅ PASS — 19 rutas, todas dinámicas (`ƒ`) |
| Conexión a Neon (`prisma migrate status`) | ✅ PASS — esquema al día |
| `npm run db:seed` | ✅ PASS — 40 históricos / 20 futuros / 8 cancelados |
| Suite de integración (`integration_test.mjs`) | ✅ **30/30 PASS** |
| Prueba de concurrencia | ✅ PASS — exactamente un ganador, cero solapamientos verificados directamente en Postgres |
| Persistencia | ✅ PASS — datos verificados idénticos tras un reinicio completo del proceso `next dev` |

---

## 12. Instrucciones de instalación y ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno — copiar el template y completar con valores reales
cp .env.example .env
# Editar .env: DATABASE_URL, DIRECT_URL (Neon), JWT_SECRET (openssl rand -base64 48)

# 3. Generar el cliente de Prisma y aplicar migraciones
npx prisma generate
npx prisma migrate deploy
# (la migración de exclusion constraints ya está incluida en prisma/migrations/)

# 4. Poblar datos de prueba
npm run db:seed

# 5. Levantar entorno de desarrollo
npm run dev
# http://localhost:3000

# 6. Verificaciones
npx tsc --noEmit          # typecheck
npm run lint               # lint
npm run build               # build de producción
npx prisma migrate status  # confirma conexión y estado de migraciones
```

**Importante:** existe un único archivo de entorno, `.env` (no `.env.local`) — es el que Next.js, la CLI de Prisma, Prisma Migrate y Prisma Client (usado por `prisma/seed.ts`) leen automáticamente. Editar solo ese archivo al rotar credenciales.

---

## 13. Seguridad

Este documento **no contiene ni debe contener nunca**:
- `DATABASE_URL` real;
- `DIRECT_URL` real;
- `JWT_SECRET` real;
- contraseñas de infraestructura (Neon, hosting, etc.);
- ningún secreto o credencial.

Los únicos valores de credenciales que aparecen en el proyecto son las de la **cuenta demo de aplicación** (`paciente@nexosalud.demo` / `DemoPaciente2026!`), que son intencionalmente públicas/ficticias y están gateadas para no mostrarse fuera de entornos de desarrollo/demo (`NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS`).

Todas las contraseñas de usuario se almacenan con `bcrypt` (hash, costo 12) — nunca en texto plano.

---

## 14. Roadmap (fuera de alcance de v1.0.0)

Lo siguiente **no está implementado** en esta baseline. La arquitectura fue diseñada para incorporarlo sin reescrituras mayores, pero nada de esto existe todavía en v1.0.0:

**V2:**
- Roles adicionales: Profesional, Recepcionista, Administrador.
- Múltiples sedes y consultorios.
- Reprogramación de turnos.
- Lista de espera.
- Bloqueo de agendas, feriados, ausencias.
- Notificaciones y recordatorios.
- Historial detallado de cambios de estado (auditoría de transiciones).
- Dashboards y estadísticas.
- Mejoras de accesibilidad y modo oscuro.

**V3:**
- Suite de automatización de pruebas (Playwright/Cypress/Selenium) sobre los `data-testid` ya presentes.
- Regresión automatizada repetible.

No avanzar sobre estos puntos modificando código de v1.0.0 sin una decisión explícita de iniciar V2.
