# Medusa Training Store

A **Medusa v2** commerce backend for selling online compliance and professional training courses (OSHA, HIPAA, food safety, ...).

Customers buy a course like any other product. When the order is placed, they are automatically enrolled. They then progress through lessons, and when they finish the course they get a certificate that expires after a set period.

The project covers the main Medusa v2 extension points: a custom module, module links, workflows with compensation, subscribers, scheduled jobs, custom API routes with validation and auth middleware, and Admin UI extensions.

## Tech stack

- **Medusa v2** (`@medusajs/framework`, `@medusajs/medusa` 2.21)
- TypeScript, Node 20+
- PostgreSQL (MikroORM, via Medusa's Data Model Language)
- Redis (optional in development)
- React + `@medusajs/ui` for Admin extensions
- Jest + SWC for unit tests, GitHub Actions for CI

## Architecture

```
                 order.placed
 Storefront ──► Medusa core ──────────────► subscribers/order-placed.ts
                                                   │
                                                   ▼
                              workflows/enroll-customer-from-order.ts
                               ├─ useQueryGraphStep (order → items)
                               ├─ useQueryGraphStep (product → course, via link)
                               └─ createEnrollmentsStep (idempotent, with compensation)
                                                   │
                                                   ▼
                                      modules/training (Course, Lesson, Enrollment)
                                                   ▲
 POST /store/customers/me/enrollments/:id/complete-lesson
        └─ workflows/complete-lesson.ts
             ├─ completeLessonStep (progress, certificate, rollback on failure)
             └─ emitEventStep("enrollment.completed") ──► subscribers/enrollment-completed.ts

 jobs/expire-certificates.ts (daily 02:00) ── marks expired certificates
```

### Project structure

| Path | What it does |
| --- | --- |
| `src/modules/training` | Custom module with the `Course`, `Lesson` and `Enrollment` data models. `MedusaService` generates the CRUD methods. Includes the generated migration. |
| `src/links/product-course.ts` | Module link: a catalog **product** sells a **course**. |
| `src/links/enrollment-customer.ts` | **Read-only link** so Query can resolve `enrollment.customer` from `customer_id` without a pivot table. |
| `src/workflows` | `create-course`, `enroll-customer-from-order` and `complete-lesson` workflows. Every step that writes data has a compensation function. |
| `src/subscribers` | `order.placed` → enrolls the customer; `enrollment.completed` → issues the certificate (hook point for the Notification Module). |
| `src/jobs/expire-certificates.ts` | Scheduled job that expires compliance certificates. |
| `src/api` | Store and Admin API routes, Zod validators and middlewares. |
| `src/admin` | Admin **widget** on the product details page, plus a **Courses** page in the sidebar. |
| `src/utils/progress.ts` | Pure business logic (progress, expiry, certificate code), unit tested. |
| `src/scripts/seed.ts` | Seeds a region, a sales channel and 3 courses with linked, purchasable products. |

## API

### Store (requires `x-publishable-api-key`)

| Method | Route | Description |
| --- | --- | --- |
| GET | `/store/courses?level=&limit=&offset=` | Published course catalog. Lesson content URLs are hidden. |
| GET | `/store/courses/:idOrHandle` | Course detail by id or handle. |
| GET | `/store/customers/me/enrollments` | 🔒 The logged-in customer's enrollments, including lesson content. |
| POST | `/store/customers/me/enrollments/:id/complete-lesson` | 🔒 `{ "lesson_id": "..." }`. Updates progress and issues the certificate at 100%. |

### Admin (requires an admin session or token)

| Method | Route | Description |
| --- | --- | --- |
| GET | `/admin/courses` | List courses with lessons, linked product and enrollments. |
| POST | `/admin/courses` | Create a course with lessons. Pass `product_id` to link it to a product. |
| GET | `/admin/courses/:id` | Course detail. |
| DELETE | `/admin/courses/:id` | Soft-delete a course. |
| GET | `/admin/products/:id/course` | Course linked to a product (used by the admin widget). |

Example:

```bash
curl -X POST http://localhost:9000/admin/courses \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{
    "handle": "forklift-safety",
    "title": "Forklift Operator Safety",
    "level": "advanced",
    "certificate_validity_days": 1095,
    "lessons": [{ "title": "Pre-shift inspection", "duration_minutes": 20 }]
  }'
```

## Getting started

Prerequisites: Node 20+, and Docker (or a local PostgreSQL and Redis).

```bash
git clone https://github.com/<your-user>/medusa-training-store.git
cd medusa-training-store
npm install
cp .env.template .env

docker compose up -d          # PostgreSQL + Redis
npx medusa db:migrate         # core + training module + links
npm run seed                  # sample courses and products
npx medusa user -e admin@example.com -p supersecret

npm run dev                   # http://localhost:9000/app
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Medusa in development mode (API + Admin). |
| `npm run build` | Production build (backend + admin). |
| `npm run db:generate` | Generate migrations after changing the training data models. |
| `npm run test:unit` | Unit tests. |
| `npm run typecheck` | TypeScript check. |

## Design decisions

- **Enrollments are idempotent.** `order.placed` can be delivered more than once, so the enrollment step skips courses the customer already has access to.
- **Business logic lives in pure functions** (`src/utils/progress.ts`). Steps stay thin and the logic is easy to unit test.
- **Ownership checks return 404, not 403**, so the API doesn't reveal that another customer's enrollment exists.
- **Paid content is not public.** The catalog endpoint never returns `content_url`; only the customer's own enrollments do.
- **Certificate expiry is modeled explicitly** (`certificate_validity_days`, `expires_at`, plus the nightly job), because recurring certification is central to compliance training.

## Roadmap

- Certificate email through the Notification Module (SendGrid/Resend provider)
- Next.js storefront "My learning" page
- B2B: bulk seat purchases for companies, with seat assignment to employees
- HTTP integration tests with `@medusajs/test-utils`

## License

MIT
