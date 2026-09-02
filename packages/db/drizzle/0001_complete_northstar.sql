CREATE TYPE "public"."customer_status" AS ENUM('active', 'inactive');
CREATE TYPE "public"."dispatch_event_type" AS ENUM('dispatch_created', 'technician_assigned', 'technician_reassigned', 'schedule_changed', 'unassigned');
CREATE TYPE "public"."evidence_status" AS ENUM('pending_upload', 'uploaded', 'failed');
CREATE TYPE "public"."evidence_type" AS ENUM('photo', 'signature', 'attachment');
CREATE TYPE "public"."location_event_source" AS ENUM('pwa_foreground', 'pwa_manual_ping', 'web', 'api', 'unknown');
CREATE TYPE "public"."priority" AS ENUM('low', 'normal', 'high', 'critical');
CREATE TYPE "public"."sync_result" AS ENUM('applied', 'already_done', 'rejected', 'conflict', 'retry_later');
CREATE TYPE "public"."technician_availability" AS ENUM('available', 'busy', 'off');
CREATE TYPE "public"."technician_status" AS ENUM('active', 'inactive');
CREATE TYPE "public"."ticket_status" AS ENUM('open', 'in_progress', 'waiting', 'resolved', 'closed', 'cancelled');
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'blocked');
CREATE TYPE "public"."work_order_event_type" AS ENUM('dispatch_created', 'technician_assigned', 'technician_reassigned', 'schedule_changed', 'unassigned', 'check_in', 'service_started', 'service_finished', 'status_changed', 'note_added', 'evidence_uploaded', 'waiting_parts', 'waiting_evidence', 'in_validation', 'cancelled', 'completed', 'rework_opened', 'rework_resolved', 'correction_applied', 'manual_location_ping', 'foreground_sync');
CREATE TYPE "public"."work_order_type" AS ENUM('corrective', 'preventive', 'installation', 'survey');
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"target_user_id" uuid,
	"resource" varchar(60) NOT NULL,
	"action" varchar(60) NOT NULL,
	"resource_id" uuid,
	"payload" jsonb,
	"ip_hash" varchar(64),
	"user_agent" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "dispatches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"work_order_id" uuid,
	"technician_id" uuid,
	"previous_technician_id" uuid,
	"author_user_id" uuid NOT NULL,
	"event_type" "dispatch_event_type" NOT NULL,
	"scheduled_at" timestamp with time zone,
	"due_at" timestamp with time zone,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dispatches_company_id_id_unique" UNIQUE("company_id","id")
);

CREATE TABLE "evidences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"work_order_id" uuid,
	"technician_id" uuid,
	"file_id" uuid,
	"event_id" uuid,
	"evidence_type" "evidence_type" DEFAULT 'photo' NOT NULL,
	"status" "evidence_status" DEFAULT 'pending_upload' NOT NULL,
	"idempotency_key" text NOT NULL,
	"signer_name" varchar(160),
	"signer_role" varchar(80),
	"caption" text,
	"upload_error" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "evidences_company_id_idempotency_key_unique" UNIQUE("company_id","idempotency_key"),
	CONSTRAINT "evidences_company_id_id_unique" UNIQUE("company_id","id")
);

CREATE TABLE "service_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"customer_id" uuid,
	"label" varchar(120) DEFAULT 'Principal' NOT NULL,
	"street" varchar(180) NOT NULL,
	"number" varchar(32),
	"district" varchar(120),
	"city" varchar(120) NOT NULL,
	"state" varchar(2) NOT NULL,
	"postal_code" varchar(16),
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"geometry" geometry(Point,4326),
	"contact_name" varchar(160),
	"contact_phone" varchar(32),
	"instructions" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_addresses_company_id_id_unique" UNIQUE("company_id","id")
);

CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"role" "user_role" NOT NULL,
	"refresh_token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"device_id" varchar(120),
	"ip_hash" varchar(64),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "sync_receipts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"device_id" varchar(120) NOT NULL,
	"idempotency_key" text NOT NULL,
	"work_order_event_id" uuid,
	"evidence_id" uuid,
	"status" "sync_result" NOT NULL,
	"payload_hash" text,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"error_code" varchar(40),
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sync_receipts_company_device_idempotency_unique" UNIQUE("company_id","device_id","idempotency_key"),
	CONSTRAINT "sync_receipts_company_id_id_unique" UNIQUE("company_id","id")
);

CREATE TABLE "technician_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"branch_id" uuid,
	"technician_id" uuid,
	"work_order_id" uuid,
	"event_id" uuid,
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"accuracy_meters" integer,
	"geometry" geometry(Point,4326) NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" "location_event_source" DEFAULT 'pwa_foreground' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "technician_locations_company_id_id_unique" UNIQUE("company_id","id")
);

ALTER TABLE "customer_addresses" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "technician_location_events" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "work_order_evidences" DISABLE ROW LEVEL SECURITY;
DROP TABLE "customer_addresses" CASCADE;
DROP TABLE "technician_location_events" CASCADE;
DROP TABLE "work_order_evidences" CASCADE;
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";
ALTER TABLE "customers" DROP CONSTRAINT "customers_branch_id_branches_id_fk";

ALTER TABLE "technicians" DROP CONSTRAINT "technicians_branch_id_branches_id_fk";

ALTER TABLE "technicians" DROP CONSTRAINT "technicians_user_id_users_id_fk";

ALTER TABLE "tickets" DROP CONSTRAINT "tickets_branch_id_branches_id_fk";

ALTER TABLE "tickets" DROP CONSTRAINT "tickets_customer_id_customers_id_fk";

ALTER TABLE "users" DROP CONSTRAINT "users_branch_id_branches_id_fk";

ALTER TABLE "work_order_events" DROP CONSTRAINT "work_order_events_work_order_id_work_orders_id_fk";

ALTER TABLE "work_order_events" DROP CONSTRAINT "work_order_events_technician_id_technicians_id_fk";

ALTER TABLE "work_order_events" DROP CONSTRAINT "work_order_events_actor_user_id_users_id_fk";

ALTER TABLE "work_orders" DROP CONSTRAINT "work_orders_branch_id_branches_id_fk";

ALTER TABLE "work_orders" DROP CONSTRAINT "work_orders_ticket_id_tickets_id_fk";

ALTER TABLE "work_orders" DROP CONSTRAINT "work_orders_customer_id_customers_id_fk";

ALTER TABLE "work_orders" DROP CONSTRAINT "work_orders_technician_id_technicians_id_fk";

ALTER TABLE "sessions" ALTER COLUMN "role" SET DATA TYPE text;
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'atendente'::text;
DROP TYPE "public"."user_role";
CREATE TYPE "public"."user_role" AS ENUM('admin', 'gestor_operacional', 'atendente', 'despachante', 'tecnico');
ALTER TABLE "sessions" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'atendente'::"public"."user_role";
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";
ALTER TABLE "work_orders" ALTER COLUMN "status" SET DATA TYPE text;
ALTER TABLE "work_orders" ALTER COLUMN "status" SET DEFAULT 'pending'::text;
DROP TYPE "public"."work_order_status";
CREATE TYPE "public"."work_order_status" AS ENUM('pending', 'scheduled', 'dispatched', 'in_progress', 'waiting_evidence', 'in_validation', 'waiting_parts', 'completed', 'cancelled', 'rework');
ALTER TABLE "work_orders" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."work_order_status";
ALTER TABLE "work_orders" ALTER COLUMN "status" SET DATA TYPE "public"."work_order_status" USING "status"::"public"."work_order_status";
DROP INDEX "users_branch_idx";
DROP INDEX "work_order_events_work_order_idx";
DROP INDEX "work_orders_status_idx";
DROP INDEX "work_orders_technician_idx";
ALTER TABLE "technicians" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "tickets" ALTER COLUMN "priority" SET DEFAULT 'normal'::"public"."priority";
ALTER TABLE "tickets" ALTER COLUMN "priority" SET DATA TYPE "public"."priority" USING "priority"::"public"."priority";
ALTER TABLE "tickets" ALTER COLUMN "status" SET DEFAULT 'open'::"public"."ticket_status";
ALTER TABLE "tickets" ALTER COLUMN "status" SET DATA TYPE "public"."ticket_status" USING "status"::"public"."ticket_status";
ALTER TABLE "work_order_events" ALTER COLUMN "work_order_id" DROP NOT NULL;
ALTER TABLE "work_order_events" ALTER COLUMN "event_type" SET DATA TYPE "public"."work_order_event_type" USING "event_type"::text::"public"."work_order_event_type";
ALTER TABLE "work_orders" ALTER COLUMN "priority" SET DEFAULT 'normal'::"public"."priority";
ALTER TABLE "work_orders" ALTER COLUMN "priority" SET DATA TYPE "public"."priority" USING "priority"::"public"."priority";
ALTER TABLE "branches" ADD COLUMN "code" varchar(40) NOT NULL;
ALTER TABLE "branches" ADD COLUMN "timezone" varchar(60) DEFAULT 'America/Sao_Paulo' NOT NULL;
ALTER TABLE "branches" ADD COLUMN "street" varchar(180);
ALTER TABLE "branches" ADD COLUMN "number" varchar(32);
ALTER TABLE "branches" ADD COLUMN "district" varchar(120);
ALTER TABLE "branches" ADD COLUMN "postal_code" varchar(16);
ALTER TABLE "branches" ADD COLUMN "deleted_at" timestamp with time zone;
ALTER TABLE "companies" ADD COLUMN "deleted_at" timestamp with time zone;
ALTER TABLE "customers" ADD COLUMN "email" varchar(190);
ALTER TABLE "customers" ADD COLUMN "status" "customer_status" DEFAULT 'active' NOT NULL;
ALTER TABLE "customers" ADD COLUMN "deleted_at" timestamp with time zone;
ALTER TABLE "files" ADD COLUMN "deleted_at" timestamp with time zone;
ALTER TABLE "technicians" ADD COLUMN "employee_id" varchar(40);
ALTER TABLE "technicians" ADD COLUMN "status" "technician_status" DEFAULT 'active' NOT NULL;
ALTER TABLE "technicians" ADD COLUMN "availability_status" "technician_availability" DEFAULT 'available' NOT NULL;
ALTER TABLE "technicians" ADD COLUMN "deleted_at" timestamp with time zone;
ALTER TABLE "tickets" ADD COLUMN "assigned_to_user_id" uuid;
ALTER TABLE "tickets" ADD COLUMN "created_by_user_id" uuid NOT NULL;
ALTER TABLE "tickets" ADD COLUMN "resolved_at" timestamp with time zone;
ALTER TABLE "tickets" ADD COLUMN "closed_at" timestamp with time zone;
ALTER TABLE "tickets" ADD COLUMN "deleted_at" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN "status" "user_status" DEFAULT 'active' NOT NULL;
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp with time zone;
ALTER TABLE "work_order_events" ADD COLUMN "branch_id" uuid;
ALTER TABLE "work_order_events" ADD COLUMN "actor_role" "user_role";
ALTER TABLE "work_order_events" ADD COLUMN "payload" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "work_order_events" ADD COLUMN "idempotency_key" text NOT NULL;
ALTER TABLE "work_order_events" ADD COLUMN "occurred_at" timestamp with time zone NOT NULL;
ALTER TABLE "work_order_events" ADD COLUMN "received_at" timestamp with time zone DEFAULT now() NOT NULL;
ALTER TABLE "work_order_events" ADD COLUMN "created_offline" boolean DEFAULT false NOT NULL;
ALTER TABLE "work_order_events" ADD COLUMN "device_id" varchar(120);
ALTER TABLE "work_order_events" ADD COLUMN "lat" numeric(10, 7);
ALTER TABLE "work_order_events" ADD COLUMN "lng" numeric(10, 7);
ALTER TABLE "work_order_events" ADD COLUMN "accuracy_meters" integer;
ALTER TABLE "work_order_events" ADD COLUMN "dispatch_id" uuid;
ALTER TABLE "work_order_events" ADD COLUMN "evidence_id" uuid;
ALTER TABLE "work_order_events" ADD COLUMN "correction_for_event_id" uuid;
ALTER TABLE "work_orders" ADD COLUMN "current_dispatch_id" uuid;
ALTER TABLE "work_orders" ADD COLUMN "type" "work_order_type" DEFAULT 'corrective' NOT NULL;
ALTER TABLE "work_orders" ADD COLUMN "started_at" timestamp with time zone;
ALTER TABLE "work_orders" ADD COLUMN "validated_at" timestamp with time zone;
ALTER TABLE "work_orders" ADD COLUMN "cancelled_at" timestamp with time zone;
ALTER TABLE "work_orders" ADD COLUMN "cancellation_reason" text;
ALTER TABLE "work_orders" ADD COLUMN "address_snapshot" jsonb;
ALTER TABLE "work_orders" ADD COLUMN "deleted_at" timestamp with time zone;
-- Add the unique constraints backing the composite FKs (referenced tables must
-- expose a unique key over (company_id, id) before the FKs are created.
ALTER TABLE "branches" ADD CONSTRAINT "branches_company_id_code_unique" UNIQUE("company_id","code");
ALTER TABLE "branches" ADD CONSTRAINT "branches_company_id_id_unique" UNIQUE("company_id","id");
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_document_unique" UNIQUE("company_id","document");
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_id_unique" UNIQUE("company_id","id");
ALTER TABLE "files" ADD CONSTRAINT "files_company_id_id_unique" UNIQUE("company_id","id");
ALTER TABLE "technicians" ADD CONSTRAINT "technicians_company_id_user_id_unique" UNIQUE("company_id","user_id");
ALTER TABLE "technicians" ADD CONSTRAINT "technicians_company_id_id_unique" UNIQUE("company_id","id");
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_company_id_number_unique" UNIQUE("company_id","number");
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_company_id_id_unique" UNIQUE("company_id","id");
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_email_unique" UNIQUE("company_id","email");
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_id_unique" UNIQUE("company_id","id");
ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_company_device_idempotency_unique" UNIQUE("company_id","device_id","idempotency_key");
ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_company_id_id_unique" UNIQUE("company_id","id");
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_company_id_number_unique" UNIQUE("company_id","number");
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_company_id_id_unique" UNIQUE("company_id","id");

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_actor_user_id_users_fk" FOREIGN KEY ("company_id","actor_user_id") REFERENCES "public"."users"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_target_user_id_users_fk" FOREIGN KEY ("company_id","target_user_id") REFERENCES "public"."users"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_company_id_work_order_id_work_orders_fk" FOREIGN KEY ("company_id","work_order_id") REFERENCES "public"."work_orders"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_company_id_branch_id_branches_fk" FOREIGN KEY ("company_id","branch_id") REFERENCES "public"."branches"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_company_id_technician_id_technicians_fk" FOREIGN KEY ("company_id","technician_id") REFERENCES "public"."technicians"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_company_id_previous_technician_id_technicians_fk" FOREIGN KEY ("company_id","previous_technician_id") REFERENCES "public"."technicians"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "dispatches" ADD CONSTRAINT "dispatches_company_id_author_user_id_users_fk" FOREIGN KEY ("company_id","author_user_id") REFERENCES "public"."users"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_company_id_work_order_id_work_orders_fk" FOREIGN KEY ("company_id","work_order_id") REFERENCES "public"."work_orders"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_company_id_technician_id_technicians_fk" FOREIGN KEY ("company_id","technician_id") REFERENCES "public"."technicians"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_company_id_file_id_files_fk" FOREIGN KEY ("company_id","file_id") REFERENCES "public"."files"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "service_addresses" ADD CONSTRAINT "service_addresses_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "service_addresses" ADD CONSTRAINT "service_addresses_company_id_customer_id_customers_fk" FOREIGN KEY ("company_id","customer_id") REFERENCES "public"."customers"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_company_id_user_id_users_fk" FOREIGN KEY ("company_id","user_id") REFERENCES "public"."users"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_company_id_branch_id_branches_fk" FOREIGN KEY ("company_id","branch_id") REFERENCES "public"."branches"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "sync_receipts" ADD CONSTRAINT "sync_receipts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "sync_receipts" ADD CONSTRAINT "sync_receipts_company_id_work_order_event_id_fk" FOREIGN KEY ("company_id","work_order_event_id") REFERENCES "public"."work_order_events"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "sync_receipts" ADD CONSTRAINT "sync_receipts_company_id_evidence_id_evidences_fk" FOREIGN KEY ("company_id","evidence_id") REFERENCES "public"."evidences"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "technician_locations" ADD CONSTRAINT "technician_locations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "technician_locations" ADD CONSTRAINT "technician_locations_company_id_technician_id_technicians_fk" FOREIGN KEY ("company_id","technician_id") REFERENCES "public"."technicians"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "technician_locations" ADD CONSTRAINT "technician_locations_company_id_work_order_id_work_orders_fk" FOREIGN KEY ("company_id","work_order_id") REFERENCES "public"."work_orders"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "technician_locations" ADD CONSTRAINT "technician_locations_company_id_branch_id_branches_fk" FOREIGN KEY ("company_id","branch_id") REFERENCES "public"."branches"("company_id","id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "audit_logs_company_occurred_at_idx" ON "audit_logs" USING btree ("company_id","occurred_at");
CREATE INDEX "audit_logs_resource_action_idx" ON "audit_logs" USING btree ("resource","action");
CREATE INDEX "audit_logs_actor_user_idx" ON "audit_logs" USING btree ("actor_user_id");
CREATE INDEX "audit_logs_resource_id_idx" ON "audit_logs" USING btree ("resource_id");
CREATE INDEX "dispatches_company_work_order_idx" ON "dispatches" USING btree ("company_id","work_order_id");
CREATE INDEX "dispatches_company_technician_idx" ON "dispatches" USING btree ("company_id","technician_id");
CREATE INDEX "dispatches_work_order_created_at_idx" ON "dispatches" USING btree ("work_order_id","created_at");
CREATE INDEX "evidences_company_work_order_idx" ON "evidences" USING btree ("company_id","work_order_id");
CREATE INDEX "evidences_work_order_status_idx" ON "evidences" USING btree ("work_order_id","status");
CREATE INDEX "evidences_company_idempotency_key_idx" ON "evidences" USING btree ("company_id","idempotency_key");
CREATE INDEX "evidences_technician_idx" ON "evidences" USING btree ("technician_id");
CREATE INDEX "service_addresses_company_idx" ON "service_addresses" USING btree ("company_id");
CREATE INDEX "service_addresses_customer_idx" ON "service_addresses" USING btree ("customer_id");
CREATE INDEX "service_addresses_company_city_state_idx" ON "service_addresses" USING btree ("company_id","city","state");
CREATE INDEX "service_addresses_geometry_gist_idx" ON "service_addresses" USING gist ("geometry");
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");
CREATE INDEX "sessions_company_idx" ON "sessions" USING btree ("company_id");
CREATE INDEX "sessions_refresh_token_hash_idx" ON "sessions" USING btree ("refresh_token_hash");
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");
CREATE INDEX "sessions_revoked_at_idx" ON "sessions" USING btree ("revoked_at");
CREATE INDEX "sync_receipts_company_work_order_event_idx" ON "sync_receipts" USING btree ("company_id","work_order_event_id");
CREATE INDEX "sync_receipts_company_processed_at_idx" ON "sync_receipts" USING btree ("company_id","processed_at");
CREATE INDEX "technician_locations_company_idx" ON "technician_locations" USING btree ("company_id");
CREATE INDEX "technician_locations_technician_idx" ON "technician_locations" USING btree ("technician_id");
CREATE INDEX "technician_locations_technician_captured_idx" ON "technician_locations" USING btree ("technician_id","captured_at" DESC NULLS LAST);
CREATE INDEX "technician_locations_company_captured_idx" ON "technician_locations" USING btree ("company_id","captured_at");
CREATE INDEX "technician_locations_geometry_gist_idx" ON "technician_locations" USING gist ("geometry");
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_branch_id_branches_fk" FOREIGN KEY ("company_id","branch_id") REFERENCES "public"."branches"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "technicians" ADD CONSTRAINT "technicians_company_id_user_id_users_fk" FOREIGN KEY ("company_id","user_id") REFERENCES "public"."users"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "technicians" ADD CONSTRAINT "technicians_company_id_branch_id_branches_fk" FOREIGN KEY ("company_id","branch_id") REFERENCES "public"."branches"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_company_id_branch_id_branches_fk" FOREIGN KEY ("company_id","branch_id") REFERENCES "public"."branches"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_company_id_customer_id_customers_fk" FOREIGN KEY ("company_id","customer_id") REFERENCES "public"."customers"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_company_id_address_id_service_addresses_fk" FOREIGN KEY ("company_id","address_id") REFERENCES "public"."service_addresses"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_company_id_assigned_to_user_id_users_fk" FOREIGN KEY ("company_id","assigned_to_user_id") REFERENCES "public"."users"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_company_id_created_by_user_id_users_fk" FOREIGN KEY ("company_id","created_by_user_id") REFERENCES "public"."users"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_branch_id_branches_fk" FOREIGN KEY ("company_id","branch_id") REFERENCES "public"."branches"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_company_id_work_order_id_work_orders_fk" FOREIGN KEY ("company_id","work_order_id") REFERENCES "public"."work_orders"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_company_id_technician_id_technicians_fk" FOREIGN KEY ("company_id","technician_id") REFERENCES "public"."technicians"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_company_id_actor_user_id_users_fk" FOREIGN KEY ("company_id","actor_user_id") REFERENCES "public"."users"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_company_id_dispatch_id_dispatches_fk" FOREIGN KEY ("company_id","dispatch_id") REFERENCES "public"."dispatches"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_company_id_location_event_id_technician_locations_fk" FOREIGN KEY ("company_id","location_event_id") REFERENCES "public"."technician_locations"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_company_id_evidence_id_evidences_fk" FOREIGN KEY ("company_id","evidence_id") REFERENCES "public"."evidences"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_company_id_correction_for_event_id_fk" FOREIGN KEY ("company_id","correction_for_event_id") REFERENCES "public"."work_order_events"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_order_events" ADD CONSTRAINT "work_order_events_company_id_branch_id_branches_fk" FOREIGN KEY ("company_id","branch_id") REFERENCES "public"."branches"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_company_id_branch_id_branches_fk" FOREIGN KEY ("company_id","branch_id") REFERENCES "public"."branches"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_company_id_ticket_id_tickets_fk" FOREIGN KEY ("company_id","ticket_id") REFERENCES "public"."tickets"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_company_id_customer_id_customers_fk" FOREIGN KEY ("company_id","customer_id") REFERENCES "public"."customers"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_company_id_address_id_service_addresses_fk" FOREIGN KEY ("company_id","address_id") REFERENCES "public"."service_addresses"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_company_id_technician_id_technicians_fk" FOREIGN KEY ("company_id","technician_id") REFERENCES "public"."technicians"("company_id","id") ON DELETE no action ON UPDATE no action;
-- Forward/circular references (Drizzle only models the reverse side; these FKs
-- are added directly so the constraint exists in the applied schema).
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_company_id_current_dispatch_id_dispatches_fk" FOREIGN KEY ("company_id","current_dispatch_id") REFERENCES "public"."dispatches"("company_id","id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "technician_locations" ADD CONSTRAINT "technician_locations_company_id_event_id_work_order_events_fk" FOREIGN KEY ("company_id","event_id") REFERENCES "public"."work_order_events"("company_id","id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "evidences" ADD CONSTRAINT "evidences_company_id_event_id_work_order_events_fk" FOREIGN KEY ("company_id","event_id") REFERENCES "public"."work_order_events"("company_id","id") ON DELETE no action ON UPDATE no action;
CREATE INDEX "branches_company_active_idx" ON "branches" USING btree ("company_id","active");
CREATE INDEX "customers_company_status_idx" ON "customers" USING btree ("company_id","status");
CREATE INDEX "customers_company_document_idx" ON "customers" USING btree ("company_id","document");
CREATE INDEX "files_company_object_key_idx" ON "files" USING btree ("company_id","object_key");
CREATE INDEX "technicians_company_status_idx" ON "technicians" USING btree ("company_id","status");
CREATE INDEX "technicians_company_availability_idx" ON "technicians" USING btree ("company_id","availability_status");
CREATE INDEX "technicians_user_idx" ON "technicians" USING btree ("user_id");
CREATE INDEX "tickets_company_status_idx" ON "tickets" USING btree ("company_id","status");
CREATE INDEX "tickets_company_priority_idx" ON "tickets" USING btree ("company_id","priority");
CREATE INDEX "tickets_company_created_at_idx" ON "tickets" USING btree ("company_id","created_at");
CREATE INDEX "users_company_status_idx" ON "users" USING btree ("company_id","status");
CREATE INDEX "work_order_events_company_work_order_received_idx" ON "work_order_events" USING btree ("company_id","work_order_id","received_at");
CREATE INDEX "work_order_events_work_order_occurred_idx" ON "work_order_events" USING btree ("work_order_id","occurred_at");
CREATE INDEX "work_order_events_company_idempotency_idx" ON "work_order_events" USING btree ("company_id","idempotency_key");
CREATE INDEX "work_order_events_company_device_idempotency_idx" ON "work_order_events" USING btree ("company_id","device_id","idempotency_key");
CREATE INDEX "work_order_events_technician_received_idx" ON "work_order_events" USING btree ("technician_id","received_at");
CREATE INDEX "work_order_events_correction_for_event_idx" ON "work_order_events" USING btree ("correction_for_event_id");
CREATE INDEX "work_orders_company_status_idx" ON "work_orders" USING btree ("company_id","status");
CREATE INDEX "work_orders_company_technician_status_idx" ON "work_orders" USING btree ("company_id","technician_id","status");
CREATE INDEX "work_orders_company_due_status_idx" ON "work_orders" USING btree ("company_id","due_at","status");
CREATE INDEX "work_orders_company_branch_status_idx" ON "work_orders" USING btree ("company_id","branch_id","status");
CREATE INDEX "work_orders_company_scheduled_at_idx" ON "work_orders" USING btree ("company_id","scheduled_at");
ALTER TABLE "technicians" DROP COLUMN "active";
ALTER TABLE "users" DROP COLUMN "active";
ALTER TABLE "work_order_events" DROP COLUMN "notes";
DROP TYPE "public"."technician_event_type";