import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["owner", "dispatcher", "technician", "viewer"]);
export const workOrderStatus = pgEnum("work_order_status", [
  "draft",
  "open",
  "assigned",
  "en_route",
  "arrived",
  "in_progress",
  "blocked",
  "done",
  "cancelled",
]);
export const technicianEventType = pgEnum("technician_event_type", [
  "check_in",
  "assigned",
  "en_route",
  "arrived",
  "service_started",
  "evidence_uploaded",
  "service_finished",
  "manual_location_ping",
  "foreground_sync",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  document: varchar("document", { length: 32 }),
  active: boolean("active").default(true).notNull(),
  ...timestamps,
});

export const branches = pgTable(
  "branches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    city: varchar("city", { length: 120 }).notNull(),
    state: varchar("state", { length: 2 }).notNull(),
    active: boolean("active").default(true).notNull(),
    ...timestamps,
  },
  (table) => ({
    companyIdx: index("branches_company_idx").on(table.companyId),
  }),
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    branchId: uuid("branch_id").references(() => branches.id),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 190 }).notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").default("viewer").notNull(),
    active: boolean("active").default(true).notNull(),
    ...timestamps,
  },
  (table) => ({
    companyIdx: index("users_company_idx").on(table.companyId),
    branchIdx: index("users_branch_idx").on(table.branchId),
  }),
);

export const technicians = pgTable(
  "technicians",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    branchId: uuid("branch_id").references(() => branches.id),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    phone: varchar("phone", { length: 32 }),
    active: boolean("active").default(true).notNull(),
    ...timestamps,
  },
  (table) => ({
    companyIdx: index("technicians_company_idx").on(table.companyId),
    branchIdx: index("technicians_branch_idx").on(table.branchId),
  }),
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    branchId: uuid("branch_id").references(() => branches.id),
    name: varchar("name", { length: 180 }).notNull(),
    document: varchar("document", { length: 32 }),
    phone: varchar("phone", { length: 32 }),
    ...timestamps,
  },
  (table) => ({
    companyIdx: index("customers_company_idx").on(table.companyId),
    branchIdx: index("customers_branch_idx").on(table.branchId),
  }),
);

export const customerAddresses = pgTable("customer_addresses", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .references(() => customers.id)
    .notNull(),
  label: varchar("label", { length: 120 }).default("Principal").notNull(),
  street: varchar("street", { length: 180 }).notNull(),
  number: varchar("number", { length: 32 }),
  district: varchar("district", { length: 120 }),
  city: varchar("city", { length: 120 }).notNull(),
  state: varchar("state", { length: 2 }).notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  ...timestamps,
});

export const tickets = pgTable(
  "tickets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    branchId: uuid("branch_id").references(() => branches.id),
    customerId: uuid("customer_id").references(() => customers.id),
    addressId: uuid("address_id").references(() => customerAddresses.id),
    number: varchar("number", { length: 32 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description"),
    priority: varchar("priority", { length: 24 }).default("normal").notNull(),
    status: varchar("status", { length: 32 }).default("open").notNull(),
    ...timestamps,
  },
  (table) => ({
    companyIdx: index("tickets_company_idx").on(table.companyId),
    branchIdx: index("tickets_branch_idx").on(table.branchId),
  }),
);

export const workOrders = pgTable(
  "work_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    branchId: uuid("branch_id").references(() => branches.id),
    ticketId: uuid("ticket_id").references(() => tickets.id),
    customerId: uuid("customer_id").references(() => customers.id),
    addressId: uuid("address_id").references(() => customerAddresses.id),
    technicianId: uuid("technician_id").references(() => technicians.id),
    number: varchar("number", { length: 32 }).notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description"),
    status: workOrderStatus("status").default("open").notNull(),
    priority: varchar("priority", { length: 24 }).default("normal").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    dueAt: timestamp("due_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => ({
    companyIdx: index("work_orders_company_idx").on(table.companyId),
    branchIdx: index("work_orders_branch_idx").on(table.branchId),
    statusIdx: index("work_orders_status_idx").on(table.status),
    technicianIdx: index("work_orders_technician_idx").on(table.technicianId),
  }),
);

export const technicianLocationEvents = pgTable(
  "technician_location_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    branchId: uuid("branch_id").references(() => branches.id),
    technicianId: uuid("technician_id")
      .references(() => technicians.id)
      .notNull(),
    workOrderId: uuid("work_order_id").references(() => workOrders.id),
    eventType: technicianEventType("event_type").notNull(),
    latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
    accuracyMeters: integer("accuracy_meters"),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull(),
    source: varchar("source", { length: 40 }).default("pwa_foreground").notNull(),
    metadata: jsonb("metadata"),
    ...timestamps,
  },
  (table) => ({
    companyIdx: index("location_events_company_idx").on(table.companyId),
    technicianIdx: index("location_events_technician_idx").on(table.technicianId),
    capturedIdx: index("location_events_captured_idx").on(table.capturedAt),
  }),
);

export const workOrderEvents = pgTable(
  "work_order_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .references(() => companies.id)
      .notNull(),
    workOrderId: uuid("work_order_id")
      .references(() => workOrders.id)
      .notNull(),
    technicianId: uuid("technician_id").references(() => technicians.id),
    actorUserId: uuid("actor_user_id").references(() => users.id),
    eventType: technicianEventType("event_type").notNull(),
    notes: text("notes"),
    locationEventId: uuid("location_event_id").references(() => technicianLocationEvents.id),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    workOrderIdx: index("work_order_events_work_order_idx").on(table.workOrderId),
  }),
);

export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .references(() => companies.id)
    .notNull(),
  bucket: varchar("bucket", { length: 80 }).notNull(),
  objectKey: text("object_key").notNull(),
  mimeType: varchar("mime_type", { length: 120 }).notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const workOrderEvidences = pgTable("work_order_evidences", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id")
    .references(() => companies.id)
    .notNull(),
  workOrderId: uuid("work_order_id")
    .references(() => workOrders.id)
    .notNull(),
  technicianId: uuid("technician_id").references(() => technicians.id),
  fileId: uuid("file_id")
    .references(() => files.id)
    .notNull(),
  kind: varchar("kind", { length: 40 }).default("photo").notNull(),
  caption: text("caption"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
