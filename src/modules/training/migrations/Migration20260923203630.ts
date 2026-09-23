import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260923203630 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "course" drop constraint if exists "course_handle_unique";`);
    this.addSql(`create table if not exists "course" ("id" text not null, "handle" text not null, "title" text not null, "description" text null, "level" text check ("level" in ('beginner', 'intermediate', 'advanced')) not null default 'beginner', "certificate_validity_days" integer null, "is_published" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "course_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_course_handle_unique" ON "course" ("handle") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_course_deleted_at" ON "course" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "enrollment" ("id" text not null, "customer_id" text not null, "order_id" text null, "status" text check ("status" in ('active', 'completed', 'expired')) not null default 'active', "progress_percent" integer not null default 0, "completed_lesson_ids" jsonb null, "completed_at" timestamptz null, "expires_at" timestamptz null, "certificate_code" text null, "course_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "enrollment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_enrollment_customer_id" ON "enrollment" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_enrollment_course_id" ON "enrollment" ("course_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_enrollment_deleted_at" ON "enrollment" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "lesson" ("id" text not null, "title" text not null, "position" integer not null, "duration_minutes" integer not null default 0, "content_url" text null, "course_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "lesson_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_lesson_course_id" ON "lesson" ("course_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_lesson_deleted_at" ON "lesson" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "enrollment" add constraint "enrollment_course_id_foreign" foreign key ("course_id") references "course" ("id") on update cascade;`);

    this.addSql(`alter table if exists "lesson" add constraint "lesson_course_id_foreign" foreign key ("course_id") references "course" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "enrollment" drop constraint if exists "enrollment_course_id_foreign";`);

    this.addSql(`alter table if exists "lesson" drop constraint if exists "lesson_course_id_foreign";`);

    this.addSql(`drop table if exists "course" cascade;`);

    this.addSql(`drop table if exists "enrollment" cascade;`);

    this.addSql(`drop table if exists "lesson" cascade;`);
  }

}
