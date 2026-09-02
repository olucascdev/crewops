-- Revert 0001_complete_northstar: drop the new (Group 5) tables and enums, then
-- rebuild the exact 0000 group-4 schema so `drizzle-kit migrate` can re-apply
-- 0001 cleanly. There is no production data in these tables; this is a dev
-- rollback helper (see docs/DATABASE_MAP.md). The PostGIS extension is kept.

DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "sync_receipts" CASCADE;
DROP TABLE IF EXISTS "evidences" CASCADE;
DROP TABLE IF EXISTS "technician_locations" CASCADE;
DROP TABLE IF EXISTS "dispatches" CASCADE;
DROP TABLE IF EXISTS "sessions" CASCADE;
DROP TABLE IF EXISTS "service_addresses" CASCADE;
DROP TABLE IF EXISTS "work_order_events" CASCADE;
DROP TABLE IF EXISTS "work_orders" CASCADE;
DROP TABLE IF EXISTS "tickets" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "technicians" CASCADE;
DROP TABLE IF EXISTS "customers" CASCADE;
DROP TABLE IF EXISTS "files" CASCADE;
DROP TABLE IF EXISTS "branches" CASCADE;
DROP TABLE IF EXISTS "companies" CASCADE;

DROP TYPE IF EXISTS "public"."user_status" CASCADE;
DROP TYPE IF EXISTS "public"."technician_status" CASCADE;
DROP TYPE IF EXISTS "public"."technician_availability" CASCADE;
DROP TYPE IF EXISTS "public"."customer_status" CASCADE;
DROP TYPE IF EXISTS "public"."ticket_status" CASCADE;
DROP TYPE IF EXISTS "public"."work_order_type" CASCADE;
DROP TYPE IF EXISTS "public"."priority" CASCADE;
DROP TYPE IF EXISTS "public"."work_order_event_type" CASCADE;
DROP TYPE IF EXISTS "public"."dispatch_event_type" CASCADE;
DROP TYPE IF EXISTS "public"."location_event_source" CASCADE;
DROP TYPE IF EXISTS "public"."evidence_type" CASCADE;
DROP TYPE IF EXISTS "public"."evidence_status" CASCADE;
DROP TYPE IF EXISTS "public"."sync_result" CASCADE;
DROP TYPE IF EXISTS "public"."work_order_status" CASCADE;
DROP TYPE IF EXISTS "public"."user_role" CASCADE;
DROP TYPE IF EXISTS "public"."technician_event_type" CASCADE;

-- Rebuild the group-4 (0000) schema.
CREATE EXTENSION IF NOT EXISTS "postgis";

CREATE TYPE "public"."technician_event_type" AS ENUM('check_in', 'assigned', 'en_route', 'arrived', 'service_started', 'evidence_uploaded', 'service_finished', 'manual_location_ping', 'foreground_sync');
CREATE TYPE "public"."user_role" AS ENUM('owner', 'dispatcher', 'technician', 'viewer');
CREATE TYPE "public"."work_order_status" AS ENUM('draft', 'open', 'assigned', 'en_route', 'arrived', 'in_progress', 'blocked', 'done', 'cancelled');

CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"city" varchar(120) NOT NULL,
	"state" varchar(2) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"document" varchar(32),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "customer_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"label" varchar(120) DEFAULT 'Principal' NOT NULL,
	"street" varchar(180) NOT NULL,
	"number" varchar(32),
	"district" varchar(120),
	"city" varchar(120) NOT NULL,
	"state" varchar(2) NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"name" varchar(180) NOT NULL,
	"document" varchar(32),
	"phone" varchar(32),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"bucket" varchar(80) NOT NULL,
	"object_key" text NOT NULL,
	"mime_type" varchar(120) NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "technician_location_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"technician_id" uuid NOT NULL,
	"work_order_id" uuid,
	"event_type" "technician_event_type" NOT NULL,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"accuracy_meters" integer,
	"captured_at" timestamp with time zone NOT NULL,
	"source" varchar(40) DEFAULT 'pwa_foreground' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "technicians" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"user_id" uuid NOT NULL,
	"phone" varchar(32),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"customer_id" uuid,
	"address_id" uuid,
	"number" varchar(32) NOT NULL,
	"title" varchar(180) NOT NULL,
	"description" text,
	"priority" varchar(24) DEFAULT 'normal' NOT NULL,
	"status" varchar(32) DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"name" varchar(160) NOT NULL,
	"email" varchar(190) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'viewer' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE "work_order_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"work_order_id" uuid NOT NULL,
	"technician_id" uuid,
	"actor_user_id" uuid,
	"event_type" "technician_event_type" NOT NULL,
	"notes" text,
	"location_event_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "work_order_evidences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"work_order_id" uuid NOT NULL,
	"technician_id" uuid,
	"file_id" uuid NOT NULL,
	"kind" varchar(40) DEFAULT 'photo' NOT NULL,
	"caption" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "work_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"ticket_id" uuid,
	"customer_id" uuid,
	"address_id" uuid,
	"technician_id" uuid,
	"number" varchar(32) NOT NULL,
	"title" varchar(180) NOT NULL,
	"description" text,
	"status" "work_order_status" DEFAULT 'open' NOT NULL,
	"priority" varchar(24) DEFAULT 'normal' NOT NULL,
	"scheduled_at" timestamp with time zone,
	"due_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "branches" ADD CONSTRAINT "branches_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "customers" ADD CONSTRAINT "customers_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "files" ADD CONSTRAINT "files_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "technician_location_events" ADD CONSTRAINT "technician_location_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "technician_location_events" ADD CONSTRAINT "technician_location_events_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "technician_location_events" ADD CONSTRAINT "technician_location_events_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "technician_location_events" ADD CONSTRAINT "technician_location_events_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "technicians" ADD CONSTRAINT "technicians_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "technicians" ADD CONSTRAINT "technicians_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "technicians" ADD CONSTRAINT "technicians_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_address_id_customer_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."customer_addresses"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_location_event_id_technician_location_events_id_fk" FOREIGN KEY ("location_event_id") REFERENCES "public"."technician_location_events"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_order_evidences" ADD CONSTRAINT "work_order_evidences_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_order_evidences" ADD CONSTRAINT "work_order_evidences_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_order_evidences" ADD CONSTRAINT "work_order_evidences_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_order_evidences" ADD CONSTRAINT "work_order_evidences_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_address_id_customer_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."customer_addresses"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_technician_id_technicians_id_fk" FOREIGN KEY ("technician_id") REFERENCES "public"."technicians"("id") ON DELETE no action ON UPDATE no action;

CREATE INDEX "branches_company_idx" ON "branches" USING btree ("company_id");
CREATE INDEX "customers_company_idx" ON "customers" USING btree ("company_id");
CREATE INDEX "customers_branch_idx" ON "customers" USING btree ("branch_id");
CREATE INDEX "location_events_company_idx" ON "technician_location_events" USING btree ("company_id");
CREATE INDEX "location_events_technician_idx" ON "technician_location_events" USING btree ("technician_id");
CREATE INDEX "location_events_captured_idx" ON "technician_location_events" USING btree ("captured_at");
CREATE INDEX "technicians_company_idx" ON "technicians" USING btree ("company_id");
CREATE INDEX "technicians_branch_idx" ON "technicians" USING btree ("branch_id");
CREATE INDEX "tickets_company_idx" ON "tickets" USING btree ("company_id");
CREATE INDEX "tickets_branch_idx" ON "tickets" USING btree ("branch_id");
CREATE INDEX "users_company_idx" ON "users" USING btree ("company_id");
CREATE INDEX "users_branch_idx" ON "users" USING btree ("branch_id");
CREATE INDEX "work_order_events_work_order_idx" ON "work_order_events" USING btree ("work_order_id");
CREATE INDEX "work_orders_company_idx" ON "work_orders" USING btree ("company_id");
CREATE INDEX "work_orders_branch_idx" ON "work_orders" USING btree ("branch_id");
CREATE INDEX "work_orders_status_idx" ON "work_orders" USING btree ("status");
CREATE INDEX "work_orders_technician_idx" ON "work_orders" USING btree ("technician_id");
