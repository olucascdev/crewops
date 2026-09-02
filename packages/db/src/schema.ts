import {
  boolean,
  foreignKey,
  geometry,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// ----------------------------------------------------------------------------
// Enums (Grupo 3 / Grupos 5.1–5.8). Valores nominais refletem docs/GLOSSARY.md,
// docs/STATE_MATRICES.md e docs/EVIDENCE_POLICY.md.
// ----------------------------------------------------------------------------

export const userRole = pgEnum("user_role", [
  "admin",
  "gestor_operacional",
  "atendente",
  "despachante",
  "tecnico",
]);

export const userStatus = pgEnum("user_status", ["active", "inactive", "blocked"]);

export const technicianStatus = pgEnum("technician_status", ["active", "inactive"]);

export const technicianAvailability = pgEnum("technician_availability", [
  "available",
  "busy",
  "off",
]);

export const customerStatus = pgEnum("customer_status", ["active", "inactive"]);

export const ticketStatus = pgEnum("ticket_status", [
  "open",
  "in_progress",
  "waiting",
  "resolved",
  "closed",
  "cancelled",
]);

export const workOrderStatus = pgEnum("work_order_status", [
  "pending",
  "scheduled",
  "dispatched",
  "in_progress",
  "waiting_evidence",
  "in_validation",
  "waiting_parts",
  "completed",
  "cancelled",
  "rework",
]);

export const workOrderType = pgEnum("work_order_type", [
  "corrective",
  "preventive",
  "installation",
  "survey",
]);

export const priority = pgEnum("priority", ["low", "normal", "high", "critical"]);

export const workOrderEventType = pgEnum("work_order_event_type", [
  "dispatch_created",
  "technician_assigned",
  "technician_reassigned",
  "schedule_changed",
  "unassigned",
  "check_in",
  "service_started",
  "service_finished",
  "status_changed",
  "note_added",
  "evidence_uploaded",
  "waiting_parts",
  "waiting_evidence",
  "in_validation",
  "cancelled",
  "completed",
  "rework_opened",
  "rework_resolved",
  "correction_applied",
  "manual_location_ping",
  "foreground_sync",
]);

export const dispatchEventType = pgEnum("dispatch_event_type", [
  "dispatch_created",
  "technician_assigned",
  "technician_reassigned",
  "schedule_changed",
  "unassigned",
]);

export const locationEventSource = pgEnum("location_event_source", [
  "pwa_foreground",
  "pwa_manual_ping",
  "web",
  "api",
  "unknown",
]);

export const evidenceType = pgEnum("evidence_type", ["photo", "signature", "attachment"]);

export const evidenceStatus = pgEnum("evidence_status", ["pending_upload", "uploaded", "failed"]);

export const syncResult = pgEnum("sync_result", [
  "applied",
  "already_done",
  "rejected",
  "conflict",
  "retry_later",
]);

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

// ----------------------------------------------------------------------------
// Empresas
// ----------------------------------------------------------------------------

export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  document: varchar("document", { length: 32 }),
  active: boolean("active").default(true).notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  ...timestamps,
});

// ----------------------------------------------------------------------------
// Filiais
// ----------------------------------------------------------------------------

export const branches = pgTable(
  "branches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    code: varchar("code", { length: 40 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    city: varchar("city", { length: 120 }).notNull(),
    state: varchar("state", { length: 2 }).notNull(),
    timezone: varchar("timezone", { length: 60 }).default("America/Sao_Paulo").notNull(),
    street: varchar("street", { length: 180 }),
    number: varchar("number", { length: 32 }),
    district: varchar("district", { length: 120 }),
    postalCode: varchar("postal_code", { length: 16 }),
    active: boolean("active").default(true).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique("branches_company_id_code_unique").on(table.companyId, table.code),
    unique("branches_company_id_id_unique").on(table.companyId, table.id),
    index("branches_company_idx").on(table.companyId),
    index("branches_company_active_idx").on(table.companyId, table.active),
  ],
);

// ----------------------------------------------------------------------------
// Usuários e sessões
// ----------------------------------------------------------------------------

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    branchId: uuid("branch_id"),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 190 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").default("atendente").notNull(),
    status: userStatus("status").default("active").notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique("users_company_id_email_unique").on(table.companyId, table.email),
    unique("users_company_id_id_unique").on(table.companyId, table.id),
    index("users_company_idx").on(table.companyId),
    index("users_company_status_idx").on(table.companyId, table.status),
    foreignKey({
      name: "users_company_id_branch_id_branches_fk",
      columns: [table.companyId, table.branchId],
      foreignColumns: [branches.companyId, branches.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    branchId: uuid("branch_id"),
    role: userRole("role").notNull(),
    refreshTokenHash: text("refresh_token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    deviceId: varchar("device_id", { length: 120 }),
    ipHash: varchar("ip_hash", { length: 64 }),
    userAgent: text("user_agent"),
    ...timestamps,
  },
  (table) => [
    index("sessions_user_idx").on(table.userId),
    index("sessions_company_idx").on(table.companyId),
    index("sessions_refresh_token_hash_idx").on(table.refreshTokenHash),
    index("sessions_expires_at_idx").on(table.expiresAt),
    index("sessions_revoked_at_idx").on(table.revokedAt),
    foreignKey({
      name: "sessions_company_id_user_id_users_fk",
      columns: [table.companyId, table.userId],
      foreignColumns: [users.companyId, users.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "sessions_company_id_branch_id_branches_fk",
      columns: [table.companyId, table.branchId],
      foreignColumns: [branches.companyId, branches.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
  ],
);

// ----------------------------------------------------------------------------
// Técnicos (sem People Core completo do legado)
// ----------------------------------------------------------------------------

export const technicians = pgTable(
  "technicians",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    branchId: uuid("branch_id"),
    userId: uuid("user_id"),
    phone: varchar("phone", { length: 32 }),
    employeeId: varchar("employee_id", { length: 40 }),
    status: technicianStatus("status").default("active").notNull(),
    availabilityStatus: technicianAvailability("availability_status")
      .default("available")
      .notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique("technicians_company_id_user_id_unique").on(table.companyId, table.userId),
    unique("technicians_company_id_id_unique").on(table.companyId, table.id),
    index("technicians_company_idx").on(table.companyId),
    index("technicians_branch_idx").on(table.branchId),
    index("technicians_company_status_idx").on(table.companyId, table.status),
    index("technicians_company_availability_idx").on(table.companyId, table.availabilityStatus),
    index("technicians_user_idx").on(table.userId),
    foreignKey({
      name: "technicians_company_id_user_id_users_fk",
      columns: [table.companyId, table.userId],
      foreignColumns: [users.companyId, users.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "technicians_company_id_branch_id_branches_fk",
      columns: [table.companyId, table.branchId],
      foreignColumns: [branches.companyId, branches.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
  ],
);

// ----------------------------------------------------------------------------
// Clientes
// ----------------------------------------------------------------------------

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    branchId: uuid("branch_id"),
    name: varchar("name", { length: 180 }).notNull(),
    document: varchar("document", { length: 32 }),
    email: varchar("email", { length: 190 }),
    phone: varchar("phone", { length: 32 }),
    status: customerStatus("status").default("active").notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique("customers_company_id_document_unique").on(table.companyId, table.document),
    unique("customers_company_id_id_unique").on(table.companyId, table.id),
    index("customers_company_idx").on(table.companyId),
    index("customers_branch_idx").on(table.branchId),
    index("customers_company_status_idx").on(table.companyId, table.status),
    index("customers_company_document_idx").on(table.companyId, table.document),
    foreignKey({
      name: "customers_company_id_branch_id_branches_fk",
      columns: [table.companyId, table.branchId],
      foreignColumns: [branches.companyId, branches.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
  ],
);

// ----------------------------------------------------------------------------
// Endereços de atendimento (renomeado de customer_addresses)
// ----------------------------------------------------------------------------

export const serviceAddresses = pgTable(
  "service_addresses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    customerId: uuid("customer_id"),
    label: varchar("label", { length: 120 }).default("Principal").notNull(),
    street: varchar("street", { length: 180 }).notNull(),
    number: varchar("number", { length: 32 }),
    district: varchar("district", { length: 120 }),
    city: varchar("city", { length: 120 }).notNull(),
    state: varchar("state", { length: 2 }).notNull(),
    postalCode: varchar("postal_code", { length: 16 }),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    // NOTE: drizzle-orm@0.45 geometry() emits `geometry(point)` in generated SQL
    // regardless of `srid`. The migration is hand-patched to `geometry(Point,4326)`;
    // keep this config and re-check the generated SQL for SRID 4326 on regen.
    geometry: geometry("geometry", { type: "point", srid: 4326 }),
    contactName: varchar("contact_name", { length: 160 }),
    contactPhone: varchar("contact_phone", { length: 32 }),
    instructions: text("instructions"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique("service_addresses_company_id_id_unique").on(table.companyId, table.id),
    index("service_addresses_company_idx").on(table.companyId),
    index("service_addresses_customer_idx").on(table.customerId),
    index("service_addresses_company_city_state_idx").on(table.companyId, table.city, table.state),
    index("service_addresses_geometry_gist_idx").using("gist", table.geometry),
    foreignKey({
      name: "service_addresses_company_id_customer_id_customers_fk",
      columns: [table.companyId, table.customerId],
      foreignColumns: [customers.companyId, customers.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
  ],
);

// ----------------------------------------------------------------------------
// Tickets
// ----------------------------------------------------------------------------

export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    branchId: uuid("branch_id"),
    customerId: uuid("customer_id"),
    addressId: uuid("address_id"),
    number: varchar("number", { length: 32 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description"),
    priority: priority("priority").default("normal").notNull(),
    status: ticketStatus("status").default("open").notNull(),
    assignedToUserId: uuid("assigned_to_user_id"),
    createdByUserId: uuid("created_by_user_id").notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique("tickets_company_id_number_unique").on(table.companyId, table.number),
    unique("tickets_company_id_id_unique").on(table.companyId, table.id),
    index("tickets_company_idx").on(table.companyId),
    index("tickets_branch_idx").on(table.branchId),
    index("tickets_company_status_idx").on(table.companyId, table.status),
    index("tickets_company_priority_idx").on(table.companyId, table.priority),
    index("tickets_company_created_at_idx").on(table.companyId, table.createdAt),
    foreignKey({
      name: "tickets_company_id_branch_id_branches_fk",
      columns: [table.companyId, table.branchId],
      foreignColumns: [branches.companyId, branches.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "tickets_company_id_customer_id_customers_fk",
      columns: [table.companyId, table.customerId],
      foreignColumns: [customers.companyId, customers.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "tickets_company_id_address_id_service_addresses_fk",
      columns: [table.companyId, table.addressId],
      foreignColumns: [serviceAddresses.companyId, serviceAddresses.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "tickets_company_id_assigned_to_user_id_users_fk",
      columns: [table.companyId, table.assignedToUserId],
      foreignColumns: [users.companyId, users.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "tickets_company_id_created_by_user_id_users_fk",
      columns: [table.companyId, table.createdByUserId],
      foreignColumns: [users.companyId, users.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
  ],
);

// ----------------------------------------------------------------------------
// Ordens de serviço (work_orders) — declarada antes de dispatches para quebrar
// a referência circular work_orders.current_dispatch_id ↔ dispatches.work_order_id
// com uma FK lazy em current_dispatch_id (ON DELETE SET NULL).
// ----------------------------------------------------------------------------

export const workOrders = pgTable(
  "work_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    branchId: uuid("branch_id"),
    ticketId: uuid("ticket_id"),
    customerId: uuid("customer_id"),
    addressId: uuid("address_id"),
    technicianId: uuid("technician_id"),
    currentDispatchId: uuid("current_dispatch_id"),
    number: varchar("number", { length: 32 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description"),
    status: workOrderStatus("status").default("pending").notNull(),
    type: workOrderType("type").default("corrective").notNull(),
    priority: priority("priority").default("normal").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    validatedAt: timestamp("validated_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cancellationReason: text("cancellation_reason"),
    addressSnapshot: jsonb("address_snapshot"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique("work_orders_company_id_number_unique").on(table.companyId, table.number),
    unique("work_orders_company_id_id_unique").on(table.companyId, table.id),
    index("work_orders_company_idx").on(table.companyId),
    index("work_orders_branch_idx").on(table.branchId),
    index("work_orders_company_status_idx").on(table.companyId, table.status),
    index("work_orders_company_technician_status_idx").on(
      table.companyId,
      table.technicianId,
      table.status,
    ),
    index("work_orders_company_due_status_idx").on(table.companyId, table.dueAt, table.status),
    index("work_orders_company_branch_status_idx").on(
      table.companyId,
      table.branchId,
      table.status,
    ),
    index("work_orders_company_scheduled_at_idx").on(table.companyId, table.scheduledAt),
    foreignKey({
      name: "work_orders_company_id_branch_id_branches_fk",
      columns: [table.companyId, table.branchId],
      foreignColumns: [branches.companyId, branches.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "work_orders_company_id_ticket_id_tickets_fk",
      columns: [table.companyId, table.ticketId],
      foreignColumns: [tickets.companyId, tickets.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "work_orders_company_id_customer_id_customers_fk",
      columns: [table.companyId, table.customerId],
      foreignColumns: [customers.companyId, customers.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "work_orders_company_id_address_id_service_addresses_fk",
      columns: [table.companyId, table.addressId],
      foreignColumns: [serviceAddresses.companyId, serviceAddresses.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "work_orders_company_id_technician_id_technicians_fk",
      columns: [table.companyId, table.technicianId],
      foreignColumns: [technicians.companyId, technicians.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
  ],
);

// ----------------------------------------------------------------------------
// Despachos — declarada após work_orders para poder referenciá-la de forma eager
// (composite FK) enquanto work_orders usa FK lazy para current_dispatch_id.
// ----------------------------------------------------------------------------

export const dispatches = pgTable(
  "dispatches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    branchId: uuid("branch_id"),
    workOrderId: uuid("work_order_id"),
    technicianId: uuid("technician_id"),
    previousTechnicianId: uuid("previous_technician_id"),
    authorUserId: uuid("author_user_id").notNull(),
    eventType: dispatchEventType("event_type").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("dispatches_company_id_id_unique").on(table.companyId, table.id),
    index("dispatches_company_work_order_idx").on(table.companyId, table.workOrderId),
    index("dispatches_company_technician_idx").on(table.companyId, table.technicianId),
    index("dispatches_work_order_created_at_idx").on(table.workOrderId, table.createdAt),
    foreignKey({
      name: "dispatches_company_id_work_order_id_work_orders_fk",
      columns: [table.companyId, table.workOrderId],
      foreignColumns: [workOrders.companyId, workOrders.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "dispatches_company_id_branch_id_branches_fk",
      columns: [table.companyId, table.branchId],
      foreignColumns: [branches.companyId, branches.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "dispatches_company_id_technician_id_technicians_fk",
      columns: [table.companyId, table.technicianId],
      foreignColumns: [technicians.companyId, technicians.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "dispatches_company_id_previous_technician_id_technicians_fk",
      columns: [table.companyId, table.previousTechnicianId],
      foreignColumns: [technicians.companyId, technicians.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "dispatches_company_id_author_user_id_users_fk",
      columns: [table.companyId, table.authorUserId],
      foreignColumns: [users.companyId, users.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
  ],
);

// ----------------------------------------------------------------------------
// Arquivos
// ----------------------------------------------------------------------------

export const files = pgTable(
  "files",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    bucket: varchar("bucket", { length: 80 }).notNull(),
    objectKey: text("object_key").notNull(),
    mimeType: varchar("mime_type", { length: 120 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("files_company_id_id_unique").on(table.companyId, table.id),
    index("files_company_object_key_idx").on(table.companyId, table.objectKey),
  ],
);

// ----------------------------------------------------------------------------
// Localizações do técnico (renomeado de technician_location_events)
// ----------------------------------------------------------------------------

export const technicianLocations = pgTable(
  "technician_locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    branchId: uuid("branch_id"),
    technicianId: uuid("technician_id"),
    workOrderId: uuid("work_order_id"),
    eventId: uuid("event_id"),
    latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
    accuracyMeters: integer("accuracy_meters"),
    // NOTE: drizzle-orm@0.45 geometry() emits `geometry(point)` in generated SQL
    // regardless of `srid`. The migration is hand-patched to `geometry(Point,4326)`;
    // keep this config and re-check the generated SQL for SRID 4326 on regen.
    geometry: geometry("geometry", { type: "point", srid: 4326 }).notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
    source: locationEventSource("source").default("pwa_foreground").notNull(),
    metadata: jsonb("metadata"),
    ...timestamps,
  },
  (table) => [
    unique("technician_locations_company_id_id_unique").on(table.companyId, table.id),
    index("technician_locations_company_idx").on(table.companyId),
    index("technician_locations_technician_idx").on(table.technicianId),
    index("technician_locations_technician_captured_idx").on(
      table.technicianId,
      table.capturedAt.desc(),
    ),
    index("technician_locations_company_captured_idx").on(table.companyId, table.capturedAt),
    index("technician_locations_geometry_gist_idx").using("gist", table.geometry),
    foreignKey({
      name: "technician_locations_company_id_technician_id_technicians_fk",
      columns: [table.companyId, table.technicianId],
      foreignColumns: [technicians.companyId, technicians.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "technician_locations_company_id_work_order_id_work_orders_fk",
      columns: [table.companyId, table.workOrderId],
      foreignColumns: [workOrders.companyId, workOrders.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "technician_locations_company_id_branch_id_branches_fk",
      columns: [table.companyId, table.branchId],
      foreignColumns: [branches.companyId, branches.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
  ],
);

// ----------------------------------------------------------------------------
// Evidências (renomeado de work_order_evidences)
// ----------------------------------------------------------------------------

export const evidences = pgTable(
  "evidences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    workOrderId: uuid("work_order_id"),
    technicianId: uuid("technician_id"),
    fileId: uuid("file_id"),
    eventId: uuid("event_id"),
    evidenceType: evidenceType("evidence_type").default("photo").notNull(),
    status: evidenceStatus("status").default("pending_upload").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    signerName: varchar("signer_name", { length: 160 }),
    signerRole: varchar("signer_role", { length: 80 }),
    caption: text("caption"),
    uploadError: text("upload_error"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    unique("evidences_company_id_idempotency_key_unique").on(table.companyId, table.idempotencyKey),
    unique("evidences_company_id_id_unique").on(table.companyId, table.id),
    index("evidences_company_work_order_idx").on(table.companyId, table.workOrderId),
    index("evidences_work_order_status_idx").on(table.workOrderId, table.status),
    index("evidences_company_idempotency_key_idx").on(table.companyId, table.idempotencyKey),
    index("evidences_technician_idx").on(table.technicianId),
    foreignKey({
      name: "evidences_company_id_work_order_id_work_orders_fk",
      columns: [table.companyId, table.workOrderId],
      foreignColumns: [workOrders.companyId, workOrders.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "evidences_company_id_technician_id_technicians_fk",
      columns: [table.companyId, table.technicianId],
      foreignColumns: [technicians.companyId, technicians.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "evidences_company_id_file_id_files_fk",
      columns: [table.companyId, table.fileId],
      foreignColumns: [files.companyId, files.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
  ],
);

// ----------------------------------------------------------------------------
// Eventos de work order (imutáveis — sem updatedAt/deletedAt)
// ----------------------------------------------------------------------------

export const workOrderEvents = pgTable(
  "work_order_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    branchId: uuid("branch_id"),
    workOrderId: uuid("work_order_id"),
    technicianId: uuid("technician_id"),
    actorUserId: uuid("actor_user_id"),
    actorRole: userRole("actor_role"),
    eventType: workOrderEventType("event_type").notNull(),
    payload: jsonb("payload").default({}).notNull(),
    metadata: jsonb("metadata"),
    idempotencyKey: text("idempotency_key").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
    createdOffline: boolean("created_offline").default(false).notNull(),
    deviceId: varchar("device_id", { length: 120 }),
    lat: numeric("lat", { precision: 10, scale: 7 }),
    lng: numeric("lng", { precision: 10, scale: 7 }),
    accuracyMeters: integer("accuracy_meters"),
    locationEventId: uuid("location_event_id"),
    dispatchId: uuid("dispatch_id"),
    evidenceId: uuid("evidence_id"),
    correctionForEventId: uuid("correction_for_event_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("work_order_events_company_device_idempotency_unique").on(
      table.companyId,
      table.deviceId,
      table.idempotencyKey,
    ),
    unique("work_order_events_company_id_id_unique").on(table.companyId, table.id),
    index("work_order_events_company_work_order_received_idx").on(
      table.companyId,
      table.workOrderId,
      table.receivedAt,
    ),
    index("work_order_events_work_order_occurred_idx").on(table.workOrderId, table.occurredAt),
    index("work_order_events_company_idempotency_idx").on(table.companyId, table.idempotencyKey),
    index("work_order_events_company_device_idempotency_idx").on(
      table.companyId,
      table.deviceId,
      table.idempotencyKey,
    ),
    index("work_order_events_technician_received_idx").on(table.technicianId, table.receivedAt),
    index("work_order_events_correction_for_event_idx").on(table.correctionForEventId),
    foreignKey({
      name: "work_order_events_company_id_work_order_id_work_orders_fk",
      columns: [table.companyId, table.workOrderId],
      foreignColumns: [workOrders.companyId, workOrders.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "work_order_events_company_id_technician_id_technicians_fk",
      columns: [table.companyId, table.technicianId],
      foreignColumns: [technicians.companyId, technicians.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "work_order_events_company_id_actor_user_id_users_fk",
      columns: [table.companyId, table.actorUserId],
      foreignColumns: [users.companyId, users.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "work_order_events_company_id_dispatch_id_dispatches_fk",
      columns: [table.companyId, table.dispatchId],
      foreignColumns: [dispatches.companyId, dispatches.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "work_order_events_company_id_location_event_id_technician_locations_fk",
      columns: [table.companyId, table.locationEventId],
      foreignColumns: [technicianLocations.companyId, technicianLocations.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "work_order_events_company_id_evidence_id_evidences_fk",
      columns: [table.companyId, table.evidenceId],
      foreignColumns: [evidences.companyId, evidences.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "work_order_events_company_id_correction_for_event_id_fk",
      columns: [table.companyId, table.correctionForEventId],
      foreignColumns: [table.companyId, table.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "work_order_events_company_id_branch_id_branches_fk",
      columns: [table.companyId, table.branchId],
      foreignColumns: [branches.companyId, branches.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
  ],
);

// ----------------------------------------------------------------------------
// Recibos de sync (idempotência)
// ----------------------------------------------------------------------------

export const syncReceipts = pgTable(
  "sync_receipts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    deviceId: varchar("device_id", { length: 120 }).notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    workOrderEventId: uuid("work_order_event_id"),
    evidenceId: uuid("evidence_id"),
    status: syncResult("status").notNull(),
    payloadHash: text("payload_hash"),
    processedAt: timestamp("processed_at", { withTimezone: true }).defaultNow().notNull(),
    errorCode: varchar("error_code", { length: 40 }),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("sync_receipts_company_device_idempotency_unique").on(
      table.companyId,
      table.deviceId,
      table.idempotencyKey,
    ),
    unique("sync_receipts_company_id_id_unique").on(table.companyId, table.id),
    index("sync_receipts_company_work_order_event_idx").on(table.companyId, table.workOrderEventId),
    index("sync_receipts_company_processed_at_idx").on(table.companyId, table.processedAt),
    foreignKey({
      name: "sync_receipts_company_id_work_order_event_id_fk",
      columns: [table.companyId, table.workOrderEventId],
      foreignColumns: [workOrderEvents.companyId, workOrderEvents.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "sync_receipts_company_id_evidence_id_evidences_fk",
      columns: [table.companyId, table.evidenceId],
      foreignColumns: [evidences.companyId, evidences.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
  ],
);

// ----------------------------------------------------------------------------
// Logs de auditoria administrativa/segurança
// ----------------------------------------------------------------------------

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    actorUserId: uuid("actor_user_id"),
    targetUserId: uuid("target_user_id"),
    resource: varchar("resource", { length: 60 }).notNull(),
    action: varchar("action", { length: 60 }).notNull(),
    resourceId: uuid("resource_id"),
    payload: jsonb("payload"),
    ipHash: varchar("ip_hash", { length: 64 }),
    userAgent: text("user_agent"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_company_occurred_at_idx").on(table.companyId, table.occurredAt),
    index("audit_logs_resource_action_idx").on(table.resource, table.action),
    index("audit_logs_actor_user_idx").on(table.actorUserId),
    index("audit_logs_resource_id_idx").on(table.resourceId),
    foreignKey({
      name: "audit_logs_company_id_actor_user_id_users_fk",
      columns: [table.companyId, table.actorUserId],
      foreignColumns: [users.companyId, users.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
    foreignKey({
      name: "audit_logs_company_id_target_user_id_users_fk",
      columns: [table.companyId, table.targetUserId],
      foreignColumns: [users.companyId, users.id],
    })
      .onDelete("no action")
      .onUpdate("no action"),
  ],
);
