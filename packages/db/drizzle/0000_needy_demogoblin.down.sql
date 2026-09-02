-- Revert 0000_needy_demogoblin: drop the pilot tables in dependency order,
-- then the enums, then the PostGIS extension added by the forward migration.
-- This is a development helper; production rollback uses the cutover/rollback
-- runbook (see docs/) rather than a blind DROP.

DROP TABLE IF EXISTS "work_order_evidences";
DROP TABLE IF EXISTS "work_order_events";
DROP TABLE IF EXISTS "technician_location_events";
DROP TABLE IF EXISTS "work_orders";
DROP TABLE IF EXISTS "tickets";
DROP TABLE IF EXISTS "customer_addresses";
DROP TABLE IF EXISTS "files";
DROP TABLE IF EXISTS "technicians";
DROP TABLE IF EXISTS "users";
DROP TABLE IF EXISTS "customers";
DROP TABLE IF EXISTS "branches";
DROP TABLE IF EXISTS "companies";

DROP TYPE IF EXISTS "public"."work_order_status";
DROP TYPE IF EXISTS "public"."technician_event_type";
DROP TYPE IF EXISTS "public"."user_role";

-- CASCADE is required because the official postgis/postgis image pre-creates
-- `postgis_topology` and `postgis_tiger_geocoder`, which depend on `postgis`.
DROP EXTENSION IF EXISTS "postgis" CASCADE;
