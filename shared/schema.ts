import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  text,
  varchar,
  uuid,
  integer,
  smallint,
  bigserial,
  serial,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  check,
  foreignKey,
  numeric,
  decimal,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const achievementStatusEnum = pgEnum("achievement_status", [
  "pending",
  "active",
  "revoked",
]);

export const certTypeEnum = pgEnum("cert_type", [
  "diploma",
  "dc3",
  "sep",
]);

export const certRequestStatusEnum = pgEnum("cert_request_status", [
  "pending_payment",
  "solicitado",
  "en_proceso",
  "emitido",
  "rechazado",
]);

export const accountTypeEnum = pgEnum("account_type", [
  "free",
  "premium",
  "admin",
]);

export const userRoleEnum = pgEnum("user_role", [
  "user",
  "moderator",
  "admin",
  "partner",
  "superadmin",
  "instructor",
  "socio_estudiante",
  "socio_instructor",
  "socio_comercial",
  "director",
  "empresa",
  "empresa_rh",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password: text("password").notNull().default("supabase-managed"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  accountType: accountTypeEnum("account_type").notNull().default("free"),
  accountSetup: smallint("account_setup").notNull().default(0),
  referralCode: text("referral_code").unique(),
  referredBy: text("referred_by"),
  userRole: userRoleEnum("user_role").notNull().default("socio_estudiante"),
  isInstructor: boolean("is_instructor").notNull().default(false),
  instructorOnboardingStep: smallint("instructor_onboarding_step").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("idx_accounts_referred_by").on(table.referredBy),
  foreignKey({
    columns: [table.referredBy],
    foreignColumns: [table.referralCode],
  }).onDelete("set null"),
]);

export const roleDefinitions = pgTable("role_definitions", {
  roleKey: text("role_key").primaryKey(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  lgscType: text("lgsc_type"),
  badgeColor: text("badge_color"),
  badgeIcon: text("badge_icon"),
  canViewCourses: boolean("can_view_courses").notNull().default(true),
  canCreateCourses: boolean("can_create_courses").notNull().default(false),
  canViewAdmin: boolean("can_view_admin").notNull().default(false),
  canViewPartner: boolean("can_view_partner").notNull().default(false),
  canViewDirector: boolean("can_view_director").notNull().default(false),
  canViewEmpresa: boolean("can_view_empresa").notNull().default(false),
  isCooperativeMember: boolean("is_cooperative_member").notNull().default(true),
  sidebarConfig: jsonb("sidebar_config"),
});

export const roleChangeLog = pgTable("role_change_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  changedBy: uuid("changed_by").notNull().references(() => users.id),
  previousRole: text("previous_role").notNull(),
  newRole: text("new_role").notNull(),
  reason: text("reason").notNull(),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_role_change_log_user").on(table.userId),
]);

// General-purpose audit log for admin/sensitive actions. Complements the
// role-specific `role_change_log` table. Append-only — nothing should ever
// UPDATE or DELETE from this table.
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),     // null = system / unauthenticated action
  action: text("action").notNull(),                        // e.g. "config.update", "prospectos.import", "order.refund"
  targetType: text("target_type"),                         // e.g. "user", "order", "product"
  targetId: text("target_id"),                             // string-encoded id of the target entity
  before: jsonb("before"),                                 // optional snapshot of state before the change
  after: jsonb("after"),                                   // optional snapshot of state after the change
  metadata: jsonb("metadata"),                             // extra context (request body, query params, etc.)
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_audit_logs_user").on(table.userId),
  index("idx_audit_logs_action").on(table.action),
  index("idx_audit_logs_created").on(table.createdAt),
]);

export const globalConfig = pgTable("global_config", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  category: text("category").notNull().default("general"),
  label: text("label").notNull(),
  description: text("description"),
  valueType: text("value_type").notNull().default("string"),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGlobalConfigSchema = createInsertSchema(globalConfig);
export type GlobalConfig = typeof globalConfig.$inferSelect;
export type InsertGlobalConfig = z.infer<typeof insertGlobalConfigSchema>;

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  fullName: text("full_name"),
  country: text("country"),
  city: text("city"),
  phoneNumber: text("phone_number"),
  walletAddress: text("wallet_address"),
  interest: jsonb("interest").default([]),
  genre: text("genre"),
  socioZone: text("socio_zone"),
  socioType: text("socio_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("idx_profiles_wallet_address").on(table.walletAddress),
]);

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  coverUrl: text("cover_url"),
  instructor: text("instructor"),
  instructorId: text("instructor_id"),
  durationHrs: integer("duration_hrs"),
  durationVirtualHrs: integer("duration_virtual_hrs"),
  areaTematica: text("area_tematica"),
  categoria: text("categoria").array(),
  nivel: text("nivel"),
  temas: text("temas").array(),
  objetivo: text("objetivo"),
  publico: text("publico").array(),
  dc3Disponible: boolean("dc3_disponible").default(false),
  precioCurso: integer("precio_curso").default(0),
  sepCertificatePrice: integer("sep_certificate_price").default(1999),
  hasRvoe: boolean("has_rvoe").default(false),
  rvoeUrl: text("rvoe_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const academyCoursesCache = pgTable("academy_courses_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  academyId: integer("academy_id").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content"),
  status: text("status").notNull().default("publish"),
  url: text("url"),
  date: timestamp("date", { withTimezone: true }),
  modified: timestamp("modified", { withTimezone: true }),
  authorId: text("author_id"),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_academy_cache_academy_id").on(table.academyId),
  index("idx_academy_cache_status").on(table.status),
]);

export const academyCurriculumCache = pgTable("academy_curriculum_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  academyId: integer("academy_id").notNull().unique(),
  curriculumJson: jsonb("curriculum_json").notNull(),
  totalItems: integer("total_items").default(0),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_academy_curriculum_cache_id").on(table.academyId),
]);

export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  shortDescription: text("short_description"),
  description: text("description"),
  value: integer("value").notNull().default(1000),
  category: text("category"),
  icon: text("icon"),
  coverUrl: text("cover_url"),
  contractAddress: text("contract_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  check("chk_achievement_value", sql`${table.value} > 0`),
]);

export const teams = pgTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  plan: text("plan"),
  partnerId: uuid("partner_id").references(() => users.id, { onDelete: "set null" }),
  status: text("status").notNull().default("active"),
  rfc: text("rfc"),
  feePercent: numeric("fee_percent", { precision: 5, scale: 2 }),
  contractUrl: text("contract_url"),
  razonSocial: text("razon_social"),
  regimenFiscal: text("regimen_fiscal"),
  codigoPostalFiscal: text("codigo_postal_fiscal"),
  facturapiCustomerId: text("facturapi_customer_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const achievementUsers = pgTable("achievement_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: uuid("achievement_id").notNull().references(() => achievements.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").notNull().default(true),
  status: achievementStatusEnum("status").notNull(),
  certType: certTypeEnum("cert_type").notNull().default("diploma"),
  contractAddress: text("contract_address"),
  tokenId: text("token_id"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("uq_achievement_users_cert").on(table.userId, table.achievementId, table.certType),
  index("idx_achievement_users_user_id").on(table.userId),
  index("idx_achievement_users_achievement_id").on(table.achievementId),
]);

export const certificateRequests = pgTable("certificate_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  // Ancla en Studio (spec 2026-07-17, decisión 2). Reemplaza el viejo course_id
  // (FK al catálogo legacy). Cualquier curso del Tutor IA puede anclar solicitud.
  studioCourseSlug: text("studio_course_slug").notNull().references(() => studioCourses.slug, { onDelete: "cascade" }),
  certType: certTypeEnum("cert_type").notNull(),
  status: certRequestStatusEnum("status").notNull().default("solicitado"),
  rejectReason: text("reject_reason"),
  pdfUrl: text("pdf_url"),
  amountMxn: integer("amount_mxn"),
  stripeSessionId: text("stripe_session_id"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  achievementUserId: uuid("achievement_user_id").references(() => achievementUsers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("uq_cert_request").on(table.userId, table.studioCourseSlug, table.certType),
  index("idx_cert_request_user").on(table.userId),
  index("idx_cert_request_status").on(table.status),
]);

export const courseUsers = pgTable("course_users", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  courseSlug: text("course_slug").notNull(),
  completed: smallint("completed").notNull().default(0),
  listeningProgress: smallint("listening_progress").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("uq_course_users").on(table.userId, table.courseId),
  index("idx_course_users_user_id").on(table.userId),
  index("idx_course_users_course_id").on(table.courseId),
  check("chk_completed_range", sql`${table.completed} >= 0 AND ${table.completed} <= 100`),
]);

export const teamUsers = pgTable("team_users", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("uq_team_users").on(table.teamId, table.userId),
  index("idx_team_users_team_id").on(table.teamId),
  index("idx_team_users_user_id").on(table.userId),
]);

export const orgObjectives = pgTable("org_objectives", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  assignedBy: uuid("assigned_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_org_objectives").on(table.teamId, table.courseId),
  index("idx_org_objectives_team_id").on(table.teamId),
]);

export const userObjectives = pgTable("user_objectives", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgObjectiveId: uuid("org_objective_id").notNull().references(() => orgObjectives.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedBy: uuid("assigned_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_user_objectives").on(table.orgObjectiveId, table.userId),
  index("idx_user_objectives_user_id").on(table.userId),
  index("idx_user_objectives_org_obj_id").on(table.orgObjectiveId),
]);

export const referralCodes = pgTable("referral_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  ownerType: text("owner_type").notNull().default("partner"),
  label: text("label"),
  commission: integer("commission").notNull().default(10),
  usageCount: integer("usage_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_referral_codes_owner_id").on(table.ownerId),
]);

export const insertOrgObjectiveSchema = createInsertSchema(orgObjectives).omit({
  id: true,
  createdAt: true,
});

export const insertUserObjectiveSchema = createInsertSchema(userObjectives).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertReferralCodeSchema = createInsertSchema(referralCodes).omit({
  id: true,
  usageCount: true,
  createdAt: true,
});

export type OrgObjective = typeof orgObjectives.$inferSelect;
export type InsertOrgObjective = z.infer<typeof insertOrgObjectiveSchema>;
export type UserObjective = typeof userObjectives.$inferSelect;
export type InsertUserObjective = z.infer<typeof insertUserObjectiveSchema>;
export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;

export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  password: true,
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertCourseSchema = createInsertSchema(courses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertAchievementUserSchema = createInsertSchema(achievementUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCourseUserSchema = createInsertSchema(courseUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTeamUserSchema = createInsertSchema(teamUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const courseModules = pgTable("course_modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull().references(() => courses.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(1),
  title: text("title").notNull(),
  description: text("description"),
  heygenVideoUrl: text("heygen_video_url"),
  heygenVideoId: text("heygen_video_id"),
  videoStatus: text("video_status").default("none"),
  contentHtml: text("content_html"),
  videoUrl: text("video_url"),
  audioUrl: text("audio_url"),
  references: text("references").array(),
  durationMinutes: integer("duration_minutes"),
}, (table) => [
  index("idx_course_modules_course_id").on(table.courseId),
]);

export const courseQuizzes = pgTable("course_quizzes", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").references(() => courses.id, { onDelete: "cascade" }),
  academyCourseId: integer("academy_course_id"),
  title: text("title").notNull(),
  description: text("description"),
  passingScore: integer("passing_score").notNull().default(70),
  timeLimit: integer("time_limit"),
}, (table) => [
  index("idx_course_quizzes_course_id").on(table.courseId),
]);

export const quizQuestions = pgTable("quiz_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  quizId: uuid("quiz_id").notNull().references(() => courseQuizzes.id, { onDelete: "cascade" }),
  order: integer("order").notNull().default(1),
  question: text("question").notNull(),
  options: text("options").array().notNull(),
  correctIndex: integer("correct_index").notNull(),
  explanation: text("explanation"),
}, (table) => [
  index("idx_quiz_questions_quiz_id").on(table.quizId),
]);

export const quizAttempts = pgTable("quiz_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quizId: uuid("quiz_id").notNull().references(() => courseQuizzes.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  passed: boolean("passed").notNull(),
  answers: jsonb("answers"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_quiz_attempts_user_id").on(table.userId),
  index("idx_quiz_attempts_quiz_id").on(table.quizId),
]);

export const leads = pgTable("leads", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  phone: text("phone"),
  city: text("city"),
  source: text("source").notNull().default("kit-cooperativo"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Hand-rolled rather than createInsertSchema — drizzle-zod 0.8's .omit().extend()
// rejects chained string validators. This is the only place this schema is used.
export const insertLeadSchema = z.object({
  fullName: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(120),
  email: z.string().trim().toLowerCase().email("Correo electrónico inválido").max(254),
  phone: z.string().trim().max(40).optional().nullable(),
  company: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  source: z.string().trim().max(60).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof courses.$inferSelect;

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

export type InsertAchievementUser = z.infer<typeof insertAchievementUserSchema>;
export type AchievementUser = typeof achievementUsers.$inferSelect;

export const insertCertificateRequestSchema = createInsertSchema(certificateRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCertificateRequest = z.infer<typeof insertCertificateRequestSchema>;
export type CertificateRequest = typeof certificateRequests.$inferSelect;

export type InsertCourseUser = z.infer<typeof insertCourseUserSchema>;
export type CourseUser = typeof courseUsers.$inferSelect;

export type InsertTeamUser = z.infer<typeof insertTeamUserSchema>;
export type TeamUser = typeof teamUsers.$inferSelect;

export const insertCourseModuleSchema = createInsertSchema(courseModules).omit({
  id: true,
});

export const insertCourseQuizSchema = createInsertSchema(courseQuizzes).omit({
  id: true,
});

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({
  id: true,
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

export type InsertCourseModule = z.infer<typeof insertCourseModuleSchema>;
export type CourseModule = typeof courseModules.$inferSelect;

export type InsertCourseQuiz = z.infer<typeof insertCourseQuizSchema>;
export type CourseQuiz = typeof courseQuizzes.$inferSelect;

export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;

export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;

export const studioCourses = pgTable("studio_courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  durationMinutes: integer("duration_minutes").default(60),
  level: text("level").default("basico"),
  tags: text("tags").array().default([]),
  dc3Available: boolean("dc3_available").default(false),
  sepAvailable: boolean("sep_available").default(false),
  icon: text("icon"),
  color: text("color"),
  source: text("source").default("studio"),
  instructor: text("instructor"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const studioModules = pgTable("studio_modules", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull().references(() => studioCourses.id, { onDelete: "cascade" }),
  moduleIndex: integer("module_index").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  contentHtml: text("content_html").notNull(),
  videoUrl: text("video_url"),
  references: text("references").array().default([]),
  durationMinutes: integer("duration_minutes").default(15),
}, (table) => [
  uniqueIndex("uq_studio_modules_course_index").on(table.courseId, table.moduleIndex),
  index("idx_studio_modules_course_id").on(table.courseId),
]);

export const studioQuizzes = pgTable("studio_quizzes", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id").notNull().references(() => studioCourses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  passingScore: integer("passing_score").notNull().default(70),
  questions: jsonb("questions").notNull(),
}, (table) => [
  uniqueIndex("uq_studio_quizzes_course").on(table.courseId),
]);

// Playbook del curso (spec 2026-07-18): un "libro de jugadas" IA por curso —
// objetivos/resumen/estrategias/preguntas + 3-5 ejercicios de campo. Se genera
// UNA VEZ por curso (pre-generado, cacheado) y se sirve a todos sus alumnos.
// Las referencias son SIEMPRE las verbatim del curso (nunca inventadas por la IA):
// ver server/playbook-generator.ts, que las arma con shared/playbook-assemble.ts,
// no con la respuesta del LLM.
export const coursePlaybooks = pgTable("course_playbooks", {
  courseSlug: text("course_slug").primaryKey().references(() => studioCourses.slug, { onDelete: "cascade" }),
  content: jsonb("content").notNull().$type<{
    objetivos: string[];
    resumen: string[];
    estrategias: string[];
    preguntas: string[];
  }>(),
  exercises: jsonb("exercises").notNull().$type<{ index: number; title: string; instruction: string }[]>(),
  references: jsonb("references").notNull().$type<string[]>(),
  // Procedencia del contenido: 'ai' = generación real de Claude; 'fallback' =
  // playbook mínimo derivado del contenido del curso (server/playbook-generator.ts
  // cayó a fallbackPlaybook() por falta de API key, cero módulos, error de la API,
  // conteo de ejercicios inválido o cuerpo pedagógico vacío). Sin esta columna una
  // fila fallback era indistinguible de una real y quedaba cacheada para siempre
  // (C1 — [[feedback_no_silent_degradation]]). El lector (server/routes/playbook.ts)
  // usa esto para reintentar la generación real tras un cooldown en vez de servir
  // el fallback como si fuera definitivo.
  source: text("source").notNull().default("ai").$type<"ai" | "fallback">(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Detector de riesgos (spec docs/superpowers/specs/2026-07-18-detector-riesgos-design.md).
// Reemplaza playbook_evidence: un trabajador capacitado reporta un incumplimiento
// real (foto + descripción), la empresa lo atiende/descarta, y los puntos se
// acreditan SOLO al validar (nunca al enviar).
//
// user_id SIEMPRE se guarda (hace falta para acreditar puntos y para que el
// trabajador vea sus propios hallazgos), incluso cuando anonymous = true. La
// anonimidad es una regla de SERVIDOR aplicada en la capa de API (el endpoint
// de la empresa omite user_id/nombre/correo cuando anonymous = true), no una
// omisión de columna — ver §6 del spec.
//
// team_id es text (no uuid) porque teams.id es text en todo el resto del
// schema (ver `teams` arriba); el spec dice "uuid" pero eso no coincide con
// la tabla real y una FK con tipos distintos no se puede crear.
export const riskFindings = pgTable("risk_findings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  anonymous: boolean("anonymous").notNull(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  courseSlug: text("course_slug").references(() => studioCourses.slug, { onDelete: "set null" }),
  photoKey: text("photo_key").notNull(),
  description: text("description").notNull(),
  normRef: text("norm_ref"),
  status: text("status").notNull().default("nuevo").$type<"nuevo" | "en_revision" | "atendido" | "descartado">(),
  resolutionPhotoKey: text("resolution_photo_key"),
  resolutionNote: text("resolution_note"),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedBy: uuid("resolved_by").references(() => users.id, { onDelete: "set null" }),
}, (table) => [
  index("idx_risk_findings_team_status").on(table.teamId, table.status),
  index("idx_risk_findings_user").on(table.userId),
]);

export const studentProfiles = pgTable("student_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobTitle: text("job_title"),
  industry: text("industry"),
  companySize: text("company_size"),
  experienceLevel: text("experience_level"),
  learningGoals: text("learning_goals").array().default([]),
  preferredStyle: text("preferred_style").default("reading"),
}, (table) => [
  uniqueIndex("uq_student_profiles_user").on(table.userId),
]);

export const generatedContent = pgTable("generated_content", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseSlug: text("course_slug").notNull(),
  moduleIndex: integer("module_index").notNull(),
  lectureHtml: text("lecture_html"),
  mindMap: jsonb("mind_map"),
  reflections: text("reflections").array().default([]),
  adaptiveQuiz: jsonb("adaptive_quiz"),
  suggestedSources: jsonb("suggested_sources"),
  podcastScript: text("podcast_script"),
  classScript: text("class_script"),
  audioUrl: text("audio_url"),
  audioDurationSeconds: integer("audio_duration_seconds"),
  audioGeneratedAt: timestamp("audio_generated_at", { withTimezone: true }),
  personalizedFor: jsonb("personalized_for"),
  generationStatus: text("generation_status").default("pending"),
  isStub: boolean("is_stub").default(false),
  // Consecutive failed generations in a row for this module/user, reset to 0
  // on any success. Drives the retry backoff/ceiling in
  // server/lib/generation-retry.ts — without it a persistent failure (bad
  // key, sustained 429) regenerated on every client poll with no brake.
  consecutiveFailures: integer("consecutive_failures").notNull().default(0),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_generated_content_user_course_module").on(table.userId, table.courseSlug, table.moduleIndex),
  index("idx_generated_content_user").on(table.userId),
]);

export const studioEnrollments = pgTable("studio_enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  source: text("source").notNull().default("studio"),
  courseIdentifier: text("course_identifier").notNull(),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
  status: text("status").notNull().default("active"),
  progressPercent: integer("progress_percent").default(0),
  lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("uq_studio_enrollments_user_source_course").on(table.userId, table.source, table.courseIdentifier),
  index("idx_studio_enrollments_user").on(table.userId),
]);

export const studioModuleProgress = pgTable("studio_module_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id").notNull().references(() => studioEnrollments.id, { onDelete: "cascade" }),
  moduleIdentifier: text("module_identifier").notNull(),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  quizScore: integer("quiz_score"),
  timeSpentSeconds: integer("time_spent_seconds").default(0),
}, (table) => [
  uniqueIndex("uq_studio_module_progress_enrollment_module").on(table.enrollmentId, table.moduleIdentifier),
  index("idx_studio_module_progress_enrollment").on(table.enrollmentId),
]);

// Historial append-only de intentos de quiz del Tutor IA. NUNCA se actualiza ni
// se borra un renglón: es el rastro auditable detrás de un certificado ("¿con qué
// acreditó esta persona?" → curso, fecha y calificación) y la única forma de
// saber cuándo fue el último intento reprobado (cooldown).
//
// `studio_module_progress.quiz_score` sobrescribe cada intento con el anterior;
// por eso no sirve. `quiz_attempts` tampoco: su FK apunta a course_quizzes (legacy).
export const studioQuizAttempts = pgTable("studio_quiz_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  /** slug del curso de Studio (mismo valor que studio_enrollments.course_identifier). */
  courseIdentifier: text("course_identifier").notNull(),
  moduleIndex: integer("module_index").notNull(),
  /** Calificación en porcentaje 0-100, calculada por el servidor. */
  score: integer("score").notNull(),
  passed: boolean("passed").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_studio_quiz_attempts_user_course").on(table.userId, table.courseIdentifier),
  index("idx_studio_quiz_attempts_user").on(table.userId),
]);

export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseSlug: text("course_slug").notNull(),
  moduleIndex: integer("module_index").notNull(),
  messages: jsonb("messages").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("uq_chat_sessions_user_course_module").on(table.userId, table.courseSlug, table.moduleIndex),
  index("idx_chat_sessions_user").on(table.userId),
]);

export const learningInterests = pgTable("learning_interests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  topics: text("topics").array().notNull(),
  recommendations: jsonb("recommendations"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("idx_learning_interests_user").on(table.userId),
]);

export const supportThreadStatusEnum = pgEnum("support_thread_status", [
  "open",
  "closed",
]);

export const supportThreads = pgTable("support_threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  academyCourseId: integer("academy_course_id"),
  status: supportThreadStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("idx_support_threads_user").on(table.userId),
]);

export const supportMessages = pgTable("support_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  threadId: uuid("thread_id").notNull().references(() => supportThreads.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  senderRole: text("sender_role").notNull().default("user"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_support_messages_thread").on(table.threadId),
]);

export const insertSupportThreadSchema = createInsertSchema(supportThreads).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSupportMessageSchema = createInsertSchema(supportMessages).omit({ id: true, createdAt: true });

export type SupportThread = typeof supportThreads.$inferSelect;
export type InsertSupportThread = z.infer<typeof insertSupportThreadSchema>;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = z.infer<typeof insertSupportMessageSchema>;

export const insertStudioCourseSchema = createInsertSchema(studioCourses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStudioModuleSchema = createInsertSchema(studioModules).omit({ id: true });
export const insertStudioQuizSchema = createInsertSchema(studioQuizzes).omit({ id: true });
export const insertCoursePlaybookSchema = createInsertSchema(coursePlaybooks).omit({ generatedAt: true });
export const insertRiskFindingSchema = createInsertSchema(riskFindings).omit({ id: true, createdAt: true, updatedAt: true, resolvedAt: true });
export const insertStudentProfileSchema = createInsertSchema(studentProfiles).omit({ id: true });
export const insertGeneratedContentSchema = createInsertSchema(generatedContent).omit({ id: true, generatedAt: true });
export const insertStudioEnrollmentSchema = createInsertSchema(studioEnrollments).omit({ id: true, enrolledAt: true });
export const insertStudioModuleProgressSchema = createInsertSchema(studioModuleProgress).omit({ id: true });
export const insertStudioQuizAttemptSchema = createInsertSchema(studioQuizAttempts).omit({ id: true, createdAt: true });
export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({ id: true, createdAt: true, updatedAt: true });

export type StudioCourse = typeof studioCourses.$inferSelect;
export type InsertStudioCourse = z.infer<typeof insertStudioCourseSchema>;
export type StudioModule = typeof studioModules.$inferSelect;
export type InsertStudioModule = z.infer<typeof insertStudioModuleSchema>;
export type StudioQuiz = typeof studioQuizzes.$inferSelect;
export type InsertStudioQuiz = z.infer<typeof insertStudioQuizSchema>;
export type CoursePlaybook = typeof coursePlaybooks.$inferSelect;
export type InsertCoursePlaybook = z.infer<typeof insertCoursePlaybookSchema>;
export type RiskFinding = typeof riskFindings.$inferSelect;
export type InsertRiskFinding = z.infer<typeof insertRiskFindingSchema>;
export type StudentProfile = typeof studentProfiles.$inferSelect;
export type InsertStudentProfile = z.infer<typeof insertStudentProfileSchema>;
export type GeneratedContent = typeof generatedContent.$inferSelect;
export type InsertGeneratedContent = z.infer<typeof insertGeneratedContentSchema>;
export type StudioEnrollment = typeof studioEnrollments.$inferSelect;
export type InsertStudioEnrollment = z.infer<typeof insertStudioEnrollmentSchema>;
export type StudioModuleProgress = typeof studioModuleProgress.$inferSelect;
export type InsertStudioModuleProgress = z.infer<typeof insertStudioModuleProgressSchema>;
export type StudioQuizAttempt = typeof studioQuizAttempts.$inferSelect;
export type InsertStudioQuizAttempt = z.infer<typeof insertStudioQuizAttemptSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "confirmed",
  "overdue",
  "cancelled",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "spei",
  "deposit",
  "domiciliation",
  "card",
  "other",
]);

export const dispersionStatusEnum = pgEnum("dispersion_status", [
  "draft",
  "applied",
  "cancelled",
]);

export const commissionStatusEnum = pgEnum("commission_status", [
  "pending",
  "approved",
  "paid",
  "cancelled",
]);

export const prospectStageEnum = pgEnum("prospect_stage", [
  "contact",
  "demo",
  "proposal",
  "negotiation",
  "closed",
  "active",
  "lost",
]);

export const companyPayments = pgTable("company_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  expectedAmount: integer("expected_amount"),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("spei"),
  reference: text("reference"),
  receiptUrl: text("receipt_url"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  periodMonth: integer("period_month").notNull(),
  periodYear: integer("period_year").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  confirmedBy: uuid("confirmed_by").references(() => users.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_company_payments_team").on(table.teamId),
  index("idx_company_payments_period").on(table.periodYear, table.periodMonth),
]);

export const companyWallets = pgTable("company_wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  walletType: text("wallet_type").notNull(),
  balance: integer("balance").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("uq_company_wallets_team_type").on(table.teamId, table.walletType),
]);

export const walletTransactions = pgTable("wallet_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletId: uuid("wallet_id").notNull().references(() => companyWallets.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  amount: integer("amount").notNull(),
  description: text("description"),
  referenceId: uuid("reference_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_wallet_transactions_wallet").on(table.walletId),
]);

export const dispersions = pgTable("dispersions", {
  id: uuid("id").primaryKey().defaultRandom(),
  periodMonth: integer("period_month").notNull(),
  periodYear: integer("period_year").notNull(),
  totalAmount: integer("total_amount").notNull().default(0),
  companiesIncluded: integer("companies_included").notNull().default(0),
  status: dispersionStatusEnum("status").notNull().default("draft"),
  details: jsonb("details"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  appliedAt: timestamp("applied_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const partnerCommissions = pgTable("partner_commissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  partnerId: uuid("partner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  paymentId: uuid("payment_id").references(() => companyPayments.id, { onDelete: "set null" }),
  amount: integer("amount").notNull(),
  feePercent: integer("fee_percent"),
  commissionPercent: integer("commission_percent"),
  status: commissionStatusEnum("status").notNull().default("pending"),
  periodMonth: integer("period_month").notNull(),
  periodYear: integer("period_year").notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_partner_commissions_partner").on(table.partnerId),
  index("idx_partner_commissions_period").on(table.periodYear, table.periodMonth),
]);

export const prospects = pgTable("prospects", {
  id: uuid("id").primaryKey().defaultRandom(),
  partnerId: uuid("partner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  collaborators: integer("collaborators"),
  plan: text("plan"),
  stage: prospectStageEnum("stage").notNull().default("contact"),
  notes: text("notes"),
  nextFollowUp: timestamp("next_follow_up", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("idx_prospects_partner").on(table.partnerId),
  index("idx_prospects_stage").on(table.stage),
]);

export const samStatusEnum = pgEnum("sam_status", [
  "pending",
  "confirmed",
  "paid",
  "adjusted",
  "cancelled",
]);

export const samPaymentStatusEnum = pgEnum("sam_payment_status", [
  "unpaid",
  "partial",
  "paid",
  "overdue",
]);

export const cfdiStatusEnum = pgEnum("cfdi_status", [
  "pending",
  "emitido",
  "cancelado",
]);

export const monthlyContributions = pgTable("monthly_contributions", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),

  periodYear: integer("period_year").notNull(),
  periodMonth: integer("period_month").notNull(),

  planType: text("plan_type").notNull(),
  umasPerCol: integer("umas_per_col").notNull(),
  umaValue: numeric("uma_value", { precision: 10, scale: 2 }).notNull(),
  activeCollaborators: integer("active_collaborators").notNull(),

  grossAmount: numeric("gross_amount", { precision: 12, scale: 2 }).notNull(),
  feePercentage: numeric("fee_percentage", { precision: 5, scale: 2 }).notNull(),
  feeAmount: numeric("fee_amount", { precision: 12, scale: 2 }).notNull(),
  netToCooperative: numeric("net_to_cooperative", { precision: 12, scale: 2 }).notNull(),

  status: samStatusEnum("status").notNull().default("pending"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  confirmedBy: uuid("confirmed_by").references(() => users.id, { onDelete: "set null" }),
  confirmationIp: text("confirmation_ip"),
  confirmationUserAgent: text("confirmation_user_agent"),
  confirmationHash: text("confirmation_hash"),

  adjustedCollaborators: integer("adjusted_collaborators"),
  adjustedAmount: numeric("adjusted_amount", { precision: 12, scale: 2 }),
  adjustmentReason: text("adjustment_reason"),

  paymentStatus: samPaymentStatusEnum("payment_status").notNull().default("unpaid"),
  paymentDate: timestamp("payment_date", { withTimezone: true }),
  paymentMethod: text("payment_method"),
  paymentReference: text("payment_reference"),
  paymentReceiptUrl: text("payment_receipt_url"),

  cfdiUuid: text("cfdi_uuid"),
  cfdiStatus: cfdiStatusEnum("cfdi_status").notNull().default("pending"),

  firstReminderSentAt: timestamp("first_reminder_sent_at", { withTimezone: true }),
  secondReminderSentAt: timestamp("second_reminder_sent_at", { withTimezone: true }),
  partnerNotifiedAt: timestamp("partner_notified_at", { withTimezone: true }),

  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
  dueDate: timestamp("due_date", { withTimezone: true }),
}, (table) => [
  uniqueIndex("uq_monthly_contributions_period").on(table.teamId, table.periodYear, table.periodMonth),
  index("idx_monthly_contributions_team").on(table.teamId),
  index("idx_monthly_contributions_period").on(table.periodYear, table.periodMonth),
  index("idx_monthly_contributions_status").on(table.status),
]);

export const contributionAuditLog = pgTable("contribution_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  contributionId: uuid("contribution_id").notNull().references(() => monthlyContributions.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  actorEmail: text("actor_email").notNull(),
  actorIp: text("actor_ip"),
  actorUserAgent: text("actor_user_agent"),
  documentHash: text("document_hash"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_contribution_audit_log_contribution").on(table.contributionId),
]);

export const insertMonthlyContributionSchema = createInsertSchema(monthlyContributions).omit({ id: true, generatedAt: true });
export const insertContributionAuditLogSchema = createInsertSchema(contributionAuditLog).omit({ id: true, createdAt: true });

export type MonthlyContribution = typeof monthlyContributions.$inferSelect;
export type InsertMonthlyContribution = z.infer<typeof insertMonthlyContributionSchema>;
export type ContributionAuditLog = typeof contributionAuditLog.$inferSelect;
export type InsertContributionAuditLog = z.infer<typeof insertContributionAuditLogSchema>;

export const insertCompanyPaymentSchema = createInsertSchema(companyPayments).omit({ id: true, createdAt: true });
export const insertCompanyWalletSchema = createInsertSchema(companyWallets).omit({ id: true, updatedAt: true });
export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({ id: true, createdAt: true });
export const insertDispersionSchema = createInsertSchema(dispersions).omit({ id: true, createdAt: true });
export const insertPartnerCommissionSchema = createInsertSchema(partnerCommissions).omit({ id: true, createdAt: true });
export const insertProspectSchema = createInsertSchema(prospects).omit({ id: true, createdAt: true, updatedAt: true });

export type CompanyPayment = typeof companyPayments.$inferSelect;
export type InsertCompanyPayment = z.infer<typeof insertCompanyPaymentSchema>;
export type CompanyWallet = typeof companyWallets.$inferSelect;
export type InsertCompanyWallet = z.infer<typeof insertCompanyWalletSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type Dispersion = typeof dispersions.$inferSelect;
export type InsertDispersion = z.infer<typeof insertDispersionSchema>;
export type PartnerCommission = typeof partnerCommissions.$inferSelect;
export type InsertPartnerCommission = z.infer<typeof insertPartnerCommissionSchema>;
export type Prospect = typeof prospects.$inferSelect;
export type InsertProspect = z.infer<typeof insertProspectSchema>;

export const invoiceTypeEnum = pgEnum("invoice_type", [
  "contribution",
  "certification",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "active",
  "cancelled",
]);

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  contributionId: uuid("contribution_id").references(() => monthlyContributions.id, { onDelete: "set null" }),
  invoiceType: invoiceTypeEnum("invoice_type").notNull(),
  facturapiInvoiceId: text("facturapi_invoice_id"),
  cfdiUuid: text("cfdi_uuid"),
  series: text("series"),
  folioNumber: integer("folio_number"),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  total: numeric("total", { precision: 12, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  tax: numeric("tax", { precision: 12, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("MXN"),
  concept: text("concept").notNull(),
  pdfUrl: text("pdf_url"),
  xmlUrl: text("xml_url"),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  cancellationReason: text("cancellation_reason"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_invoices_team").on(table.teamId),
  index("idx_invoices_contribution").on(table.contributionId),
  index("idx_invoices_status").on(table.status),
]);

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export const denueProspectStageEnum = pgEnum("denue_prospect_stage", [
  "nuevo",
  "contactado",
  "demo",
  "propuesta",
  "negociacion",
  "cliente",
  "perdido",
]);

export const empresasProspectos = pgTable("empresas_prospectos", {
  id: uuid("id").primaryKey().defaultRandom(),
  denueId: text("denue_id"),
  nombreComercial: text("nombre_comercial").notNull(),
  razonSocial: text("razon_social"),
  actividadEconomica: text("actividad_economica"),
  codigoScian: text("codigo_scian"),
  tipoEstablecimiento: text("tipo_establecimiento"),
  estratoPersonal: text("estrato_personal"),
  empleadosMin: integer("empleados_min"),
  empleadosMax: integer("empleados_max"),
  telefono: text("telefono"),
  correoElectronico: text("correo_electronico"),
  sitioWeb: text("sitio_web"),
  tipoVialidad: text("tipo_vialidad"),
  calle: text("calle"),
  numExterior: text("num_exterior"),
  numInterior: text("num_interior"),
  colonia: text("colonia"),
  codigoPostal: text("codigo_postal"),
  municipio: text("municipio"),
  estado: text("estado"),
  latitud: doublePrecision("latitud"),
  longitud: doublePrecision("longitud"),
  leadScore: integer("lead_score").notNull().default(0),
  scoreDesglose: jsonb("score_desglose").default({}),
  stage: denueProspectStageEnum("stage").notNull().default("nuevo"),
  partnerId: uuid("partner_id").references(() => users.id, { onDelete: "set null" }),
  nomsAplicables: text("noms_aplicables").array(),
  zonaComercial: text("zona_comercial"),
  prioridad: text("prioridad"),
  empleadosEstimados: integer("empleados_estimados"),
  potencialAportacionMensual: doublePrecision("potencial_aportacion_mensual"),
  nivelRiesgo: text("nivel_riesgo"),
  grupoSector: text("grupo_sector"),
  planRecomendado: text("plan_recomendado"),
  direccionCompleta: text("direccion_completa"),
  contactGroupId: uuid("contact_group_id"),
  nombreContacto: text("nombre_contacto"),
  rfc: text("rfc"),
  notas: text("notas"),
  lastContactedAt: timestamp("last_contacted_at", { withTimezone: true }),
  fechaAlta: timestamp("fecha_alta", { withTimezone: true }),
  importBatchId: text("import_batch_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("idx_empresas_prospectos_denue").on(table.denueId),
  index("idx_empresas_prospectos_municipio").on(table.municipio),
  index("idx_empresas_prospectos_scian").on(table.codigoScian),
  index("idx_empresas_prospectos_score").on(table.leadScore),
  index("idx_empresas_prospectos_stage").on(table.stage),
  index("idx_empresas_prospectos_partner").on(table.partnerId),
  index("idx_empresas_prospectos_geo").on(table.latitud, table.longitud),
]);

export const sat69bStatusEnum = pgEnum("sat_69b_status", [
  "presunto",
  "definitivo",
  "desvirtuado",
  "sentencia_favorable",
]);

export const sat69b = pgTable("sat_69b", {
  id: uuid("id").primaryKey().defaultRandom(),
  numero: integer("numero"),
  rfc: text("rfc").notNull(),
  nombreContribuyente: text("nombre_contribuyente").notNull(),
  situacion: text("situacion").notNull(),
  fechaPublicacionPresuntos: text("fecha_publicacion_presuntos"),
  fechaPublicacionDesvirtuados: text("fecha_publicacion_desvirtuados"),
  fechaPublicacionDefinitivos: text("fecha_publicacion_definitivos"),
  fechaPublicacionSentencia: text("fecha_publicacion_sentencia"),
  nombreNorm: text("nombre_norm"),
  importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_sat_69b_rfc").on(table.rfc),
  index("idx_sat_69b_nombre").on(table.nombreContribuyente),
  index("idx_sat_69b_situacion").on(table.situacion),
  index("idx_sat_69b_nombre_norm").on(table.nombreNorm),
]);

export type Sat69b = typeof sat69b.$inferSelect;

export const contactosProspectos = pgTable("contactos_prospectos", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").notNull().references(() => empresasProspectos.id, { onDelete: "cascade" }),
  nombre: text("nombre").notNull(),
  puesto: text("puesto"),
  telefono: text("telefono"),
  email: text("email"),
  esPrincipal: boolean("es_principal").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_contactos_empresa").on(table.empresaId),
]);

export const enriquecimiento = pgTable("enriquecimiento", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").notNull().references(() => empresasProspectos.id, { onDelete: "cascade" }),
  fuente: text("fuente").notNull(),
  googleRating: doublePrecision("google_rating"),
  googleReviews: integer("google_reviews"),
  googlePlaceId: text("google_place_id"),
  linkedinUrl: text("linkedin_url"),
  facebookUrl: text("facebook_url"),
  datosExtra: jsonb("datos_extra").default({}),
  consultadoAt: timestamp("consultado_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_enriquecimiento_empresa").on(table.empresaId),
]);

export const interaccionesProspectos = pgTable("interacciones_prospectos", {
  id: uuid("id").primaryKey().defaultRandom(),
  empresaId: uuid("empresa_id").notNull().references(() => empresasProspectos.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  tipo: text("tipo").notNull(),
  notas: text("notas"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_interacciones_empresa").on(table.empresaId),
]);

export const contactGroups = pgTable("contact_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  filterCriteria: jsonb("filter_criteria"),
  assignedSocioId: uuid("assigned_socio_id").references(() => users.id, { onDelete: "set null" }),
  prospectCount: integer("prospect_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const savedFilters = pgTable("saved_filters", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  filterConfig: jsonb("filter_config").notNull(),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const instructorBadgeTypeEnum = pgEnum("instructor_badge_type", ["interno", "acreditado_dc5"]);

export const instructorProfiles = pgTable("instructor_profiles", {
  id: uuid("id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  bio: text("bio"),
  specialty: text("specialty"),
  profileImageUrl: text("profile_image_url"),
  rating: numeric("rating", { precision: 2, scale: 1 }).default("0"),
  totalStudents: integer("total_students").default(0),
  totalCourses: integer("total_courses").default(0),
  commissionRate: numeric("commission_rate", { precision: 4, scale: 2 }).default("15.00"),
  bankName: text("bank_name"),
  bankClabe: text("bank_clabe"),
  verified: boolean("verified").default(false),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  instructorBadgeType: instructorBadgeTypeEnum("instructor_badge_type"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const instructorCourseStatusEnum = pgEnum("instructor_course_status", ["draft", "review", "published", "archived"]);
export const certificationTypeEnum = pgEnum("certification_type", ["nft", "dc3", "sep"]);

export const instructorCourses = pgTable("instructor_courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  instructorId: uuid("instructor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  level: text("level"),
  durationHours: integer("duration_hours"),
  certificationType: text("certification_type").default("nft"),
  status: text("status").default("draft"),
  price: numeric("price", { precision: 10, scale: 2 }).default("0"),
  isFree: boolean("is_free").default(true),
  availableForAll: boolean("available_for_all").default(true),
  tags: jsonb("tags").$type<string[]>(),
  nomsRelated: jsonb("noms_related").$type<string[]>(),
  modules: jsonb("modules").$type<{
    title: string;
    description: string;
    durationMin: number;
    content: string;
    audioUrl?: string;
  }[]>(),
  quizzes: jsonb("quizzes").$type<{
    moduleIndex: number;
    questions: { question: string; options: string[]; correctIndex: number }[];
    passingScore: number;
  }[]>(),
  rating: numeric("rating", { precision: 2, scale: 1 }).default("0"),
  totalStudents: integer("total_students").default(0),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const insertInstructorProfileSchema = createInsertSchema(instructorProfiles).omit({ createdAt: true });
export const insertInstructorCourseSchema = createInsertSchema(instructorCourses).omit({ id: true, createdAt: true, updatedAt: true });
export type InstructorProfile = typeof instructorProfiles.$inferSelect;
export type InsertInstructorProfile = z.infer<typeof insertInstructorProfileSchema>;
export type InstructorCourse = typeof instructorCourses.$inferSelect;
export type InsertInstructorCourse = z.infer<typeof insertInstructorCourseSchema>;

export const insertEmpresaProspectoSchema = createInsertSchema(empresasProspectos).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContactoProspectoSchema = createInsertSchema(contactosProspectos).omit({ id: true, createdAt: true });
export const insertEnriquecimientoSchema = createInsertSchema(enriquecimiento).omit({ id: true, consultadoAt: true });
export const insertInteraccionProspectoSchema = createInsertSchema(interaccionesProspectos).omit({ id: true, createdAt: true });
export const insertContactGroupSchema = createInsertSchema(contactGroups).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSavedFilterSchema = createInsertSchema(savedFilters).omit({ id: true, createdAt: true });

export type EmpresaProspecto = typeof empresasProspectos.$inferSelect;
export type InsertEmpresaProspecto = z.infer<typeof insertEmpresaProspectoSchema>;
export type ContactoProspecto = typeof contactosProspectos.$inferSelect;
export type InsertContactoProspecto = z.infer<typeof insertContactoProspectoSchema>;
export type Enriquecimiento = typeof enriquecimiento.$inferSelect;
export type InsertEnriquecimiento = z.infer<typeof insertEnriquecimientoSchema>;
export type InteraccionProspecto = typeof interaccionesProspectos.$inferSelect;
export type InsertInteraccionProspecto = z.infer<typeof insertInteraccionProspectoSchema>;
export type ContactGroup = typeof contactGroups.$inferSelect;
export type InsertContactGroup = z.infer<typeof insertContactGroupSchema>;
export type SavedFilter = typeof savedFilters.$inferSelect;
export type InsertSavedFilter = z.infer<typeof insertSavedFilterSchema>;

export const blogPosts = pgTable("blog_posts", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  contentHtml: text("content_html").notNull(),
  contentText: text("content_text").notNull(),
  excerpt: varchar("excerpt", { length: 300 }),
  category: varchar("category", { length: 50 }).notNull(),
  targetSectors: jsonb("target_sectors").default([]),
  seoKeywords: jsonb("seo_keywords").default([]),
  featuredImageUrl: varchar("featured_image_url", { length: 500 }),
  authorName: varchar("author_name", { length: 100 }).default("Ceduverse"),
  newsletterSubject: varchar("newsletter_subject", { length: 100 }),
  newsletterSent: boolean("newsletter_sent").default(false),
  blogViews: integer("blog_views").default(0),
  status: varchar("status", { length: 20 }).default("draft"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("blog_posts_category_idx").on(table.category),
  index("blog_posts_status_idx").on(table.status),
  index("blog_posts_published_at_idx").on(table.publishedAt),
]);

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  companyName: varchar("company_name", { length: 200 }),
  sector: varchar("sector", { length: 100 }),
  municipio: varchar("municipio", { length: 100 }),
  source: varchar("source", { length: 50 }).default("blog"),
  status: varchar("status", { length: 20 }).default("active"),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at"),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNewsletterSubscriberSchema = createInsertSchema(newsletterSubscribers).omit({ id: true, subscribedAt: true });

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type InsertNewsletterSubscriber = z.infer<typeof insertNewsletterSubscriberSchema>;

export const insuranceProfileEnum = pgEnum("insurance_profile", ["administrativo", "logistica", "pirotecnia"]);
export const insuranceTierEnum = pgEnum("insurance_tier", ["basico", "medio", "premium"]);
export const insuranceEnrollmentStatusEnum = pgEnum("insurance_enrollment_status", ["pending", "active", "suspended", "cancelled"]);

export const insurancePlans = pgTable("insurance_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  profile: insuranceProfileEnum("profile").notNull(),
  profileLabel: text("profile_label").notNull(),
  tier: insuranceTierEnum("tier").notNull(),
  pricePerEmployee: numeric("price_per_employee", { precision: 10, scale: 2 }).notNull(),
  coberturaDental: numeric("cobertura_dental", { precision: 12, scale: 2 }),
  coberturaVidaMin: numeric("cobertura_vida_min", { precision: 12, scale: 2 }),
  coberturaVidaMax: numeric("cobertura_vida_max", { precision: 12, scale: 2 }),
  coberturaAccidentes: numeric("cobertura_accidentes", { precision: 12, scale: 2 }),
  coberturaGmm: numeric("cobertura_gmm", { precision: 12, scale: 2 }),
  gmmDeducible: numeric("gmm_deducible", { precision: 12, scale: 2 }),
  gmmCoaseguro: numeric("gmm_coaseguro", { precision: 5, scale: 2 }),
  hasApp: boolean("has_app").default(true),
  hasTelemedicine: boolean("has_telemedicine").default(true),
  provider: text("provider").default("Betterfly"),
  isActive: boolean("is_active").default(true),
  features: jsonb("features"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insuranceEnrollments = pgTable("insurance_enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  planId: uuid("plan_id").notNull().references(() => insurancePlans.id),
  companyId: uuid("company_id"),
  status: insuranceEnrollmentStatusEnum("status").default("pending"),
  startDate: timestamp("start_date"),
  flexibleBenefit1: text("flexible_benefit_1"),
  flexibleBenefit2: text("flexible_benefit_2"),
  monthlyAmount: numeric("monthly_amount", { precision: 10, scale: 2 }),
  policyNumber: text("policy_number"),
  certificateUrl: text("certificate_url"),
  personalData: jsonb("personal_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("enrollments_user_idx").on(table.userId),
  index("enrollments_plan_idx").on(table.planId),
  index("enrollments_status_idx").on(table.status),
]);

export const insertInsurancePlanSchema = createInsertSchema(insurancePlans).omit({ id: true, createdAt: true });
export const insertInsuranceEnrollmentSchema = createInsertSchema(insuranceEnrollments).omit({ id: true, createdAt: true, updatedAt: true });

export type InsurancePlan = typeof insurancePlans.$inferSelect;
export type InsertInsurancePlan = z.infer<typeof insertInsurancePlanSchema>;
export type InsuranceEnrollment = typeof insuranceEnrollments.$inferSelect;
export type InsertInsuranceEnrollment = z.infer<typeof insertInsuranceEnrollmentSchema>;

export const membershipStatusEnum = pgEnum("membership_status", [
  "activo",
  "suspendido",
  "separado",
  "excluido",
]);

export const membershipTypeEnum = pgEnum("membership_type", [
  "consumo",
  "produccion",
  "instructor",
]);

export const cooperativeMemberships = pgTable("cooperative_memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  membershipNumber: text("membership_number").notNull().unique(),
  membershipType: membershipTypeEnum("membership_type").notNull().default("consumo"),
  status: membershipStatusEnum("status").notNull().default("activo"),
  acceptedStatutes: boolean("accepted_statutes").notNull().default(true),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }).notNull().defaultNow(),
  acceptanceIp: text("acceptance_ip"),
  acceptanceUserAgent: text("acceptance_user_agent"),
  acceptanceHash: text("acceptance_hash"),
  certificateNftId: uuid("certificate_nft_id"),
  certificateIssuedAt: timestamp("certificate_issued_at", { withTimezone: true }),
  certificateBlockchainTx: text("certificate_blockchain_tx"),
  certificateTokenId: text("certificate_token_id"),
  admissionApprovedBy: uuid("admission_approved_by").references(() => users.id),
  admissionApprovedAt: timestamp("admission_approved_at", { withTimezone: true }).defaultNow(),
  separationDate: timestamp("separation_date", { withTimezone: true }),
  separationReason: text("separation_reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_membership_user").on(table.userId),
  index("idx_membership_number").on(table.membershipNumber),
  index("idx_membership_status").on(table.status),
]);

export const insertCooperativeMembershipSchema = createInsertSchema(cooperativeMemberships).omit({ id: true, createdAt: true, updatedAt: true });
export type CooperativeMembership = typeof cooperativeMemberships.$inferSelect;
export type InsertCooperativeMembership = z.infer<typeof insertCooperativeMembershipSchema>;

export const instructorApplicationStatusEnum = pgEnum("instructor_application_status", [
  "draft",
  "pending_review",
  "pending_dc5",
  "approved",
  "rejected",
  "active",
]);

export const instructorApplicationTypeEnum = pgEnum("instructor_application_type", [
  "dc5",
  "internal",
]);

export const instructorApplications = pgTable("instructor_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  type: instructorApplicationTypeEnum("type").notNull(),
  status: instructorApplicationStatusEnum("status").notNull().default("draft"),
  currentStep: integer("current_step").notNull().default(1),

  fullName: text("full_name"),
  email: text("email"),
  phone: text("phone"),
  specialty: text("specialty"),
  bio: text("bio"),
  profileImageUrl: text("profile_image_url"),
  linkedinUrl: text("linkedin_url"),

  yearsExperience: integer("years_experience"),
  education: text("education"),
  certifications: jsonb("certifications").$type<string[]>(),
  cvUrl: text("cv_url"),
  areasExpertise: jsonb("areas_expertise").$type<string[]>(),
  teachingExperience: text("teaching_experience"),

  quizScore: integer("quiz_score"),
  quizAttempts: integer("quiz_attempts").default(0),
  quizMaxAttempts: integer("quiz_max_attempts").default(3),
  quizPassingScore: integer("quiz_passing_score").default(70),
  quizLastAttemptAt: timestamp("quiz_last_attempt_at", { withTimezone: true }),
  quizPassed: boolean("quiz_passed").default(false),
  quizAnswers: jsonb("quiz_answers").$type<number[]>(),

  termsAccepted: boolean("terms_accepted").default(false),
  termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
  termsAcceptanceHash: text("terms_acceptance_hash"),
  termsCodeOfConduct: boolean("terms_code_of_conduct").default(false),
  termsContentPolicy: boolean("terms_content_policy").default(false),
  termsRevenueShare: boolean("terms_revenue_share").default(false),

  bankName: text("bank_name"),
  bankClabe: text("bank_clabe"),
  rfc: text("rfc"),
  fiscalName: text("fiscal_name"),
  fiscalRegime: text("fiscal_regime"),

  dc5PaymentMethod: text("dc5_payment_method"),
  dc5PaymentReference: text("dc5_payment_reference"),
  dc5PaymentStatus: text("dc5_payment_status"),
  dc5TrackingNumber: text("dc5_tracking_number"),

  adminNotes: text("admin_notes"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),

  instructorNumber: text("instructor_number"),
  activatedAt: timestamp("activated_at", { withTimezone: true }),
  certificateNftId: uuid("certificate_nft_id"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_instructor_app_user").on(table.userId),
  index("idx_instructor_app_status").on(table.status),
  index("idx_instructor_app_type").on(table.type),
]);

export const insertInstructorApplicationSchema = createInsertSchema(instructorApplications).omit({ id: true, createdAt: true, updatedAt: true });
export type InstructorApplication = typeof instructorApplications.$inferSelect;
export type InsertInstructorApplication = z.infer<typeof insertInstructorApplicationSchema>;

export const userContactCards = pgTable("user_contact_cards", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  slug: text("slug").notNull().unique(),
  displayName: text("display_name").notNull(),
  title: text("title").notNull().default("Socio Cooperativo"),
  organization: text("organization").notNull().default("Ceduverse"),
  phone: text("phone"),
  email: text("email"),
  website: text("website").default("https://ceduverse.org"),
  avatarUrl: text("avatar_url"),
  avatarInitials: text("avatar_initials"),
  avatarColor: text("avatar_color"),
  isActive: boolean("is_active").notNull().default(true),
  socialLinks: jsonb("social_links").$type<Record<string, string>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
  index("idx_contact_cards_user").on(table.userId),
  index("idx_contact_cards_slug").on(table.slug),
]);

export const insertUserContactCardSchema = createInsertSchema(userContactCards).omit({ id: true, createdAt: true, updatedAt: true });
export type UserContactCard = typeof userContactCards.$inferSelect;
export type InsertUserContactCard = z.infer<typeof insertUserContactCardSchema>;

export const termsDocTypeEnum = pgEnum("terms_doc_type", [
  "terminos_condiciones",
  "aviso_privacidad",
  "politica_cookies",
  "adhesion_cooperativa",
]);

export const termsVersions = pgTable("terms_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  docType: termsDocTypeEnum("doc_type").notNull(),
  version: text("version").notNull(),
  title: text("title").notNull(),
  summary: text("summary"),
  contentUrl: text("content_url"),
  isBlocking: boolean("is_blocking").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  requiredForRoles: userRoleEnum("required_for_roles").array().notNull().default(sql`ARRAY['user','moderator','admin','partner','superadmin','instructor']::user_role[]`),
  gracePeriodDays: integer("grace_period_days").default(0),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  publishedBy: uuid("published_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_terms_versions_doc_type").on(table.docType),
  index("idx_terms_versions_active").on(table.isActive),
]);

export const insertTermsVersionSchema = createInsertSchema(termsVersions).omit({ id: true, createdAt: true });
export type TermsVersion = typeof termsVersions.$inferSelect;
export type InsertTermsVersion = z.infer<typeof insertTermsVersionSchema>;

export const userTermsAcceptances = pgTable("user_terms_acceptances", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  termsVersionId: uuid("terms_version_id").notNull().references(() => termsVersions.id, { onDelete: "cascade" }),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }).notNull().defaultNow(),
  acceptanceIp: text("acceptance_ip"),
  acceptanceUserAgent: text("acceptance_user_agent"),
  acceptanceHash: text("acceptance_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_user_terms_user").on(table.userId),
  index("idx_user_terms_version").on(table.termsVersionId),
  uniqueIndex("idx_user_terms_unique").on(table.userId, table.termsVersionId),
]);

export const insertUserTermsAcceptanceSchema = createInsertSchema(userTermsAcceptances).omit({ id: true, createdAt: true });
export type UserTermsAcceptance = typeof userTermsAcceptances.$inferSelect;
export type InsertUserTermsAcceptance = z.infer<typeof insertUserTermsAcceptanceSchema>;

export const apiKeys = pgTable("api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  keyHash: text("key_hash").notNull(),
  keyPrefix: text("key_prefix").notNull(),
  owner: text("owner").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  allowedOrigins: text("allowed_origins").array().default([]),
  rateLimitPerMinute: integer("rate_limit_per_minute").notNull().default(60),
  rateLimitPerDay: integer("rate_limit_per_day").notNull().default(10000),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  requestsToday: integer("requests_today").notNull().default(0),
  requestsTodayDate: text("requests_today_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("idx_api_keys_prefix").on(table.keyPrefix),
  index("idx_api_keys_active").on(table.isActive),
]);

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({ id: true, createdAt: true, updatedAt: true });
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

export const apiRequestLogs = pgTable("api_request_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  apiKeyId: uuid("api_key_id").notNull().references(() => apiKeys.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  statusCode: integer("status_code").notNull(),
  responseTimeMs: integer("response_time_ms"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  queryParams: jsonb("query_params"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_api_request_logs_key").on(table.apiKeyId),
  index("idx_api_request_logs_created").on(table.createdAt),
]);

export const avatarStatusEnum = pgEnum("avatar_status", ["pending", "processing", "ready", "failed"]);
export const videoJobStatusEnum = pgEnum("video_job_status", ["pending", "processing", "completed", "failed"]);

export const instructorAvatars = pgTable("instructor_avatars", {
  id: uuid("id").primaryKey().defaultRandom(),
  instructorId: uuid("instructor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  heygenAvatarId: text("heygen_avatar_id"),
  heygenVoiceId: text("heygen_voice_id"),
  avatarStatus: text("avatar_status").notNull().default("pending"),
  voiceStatus: text("voice_status").notNull().default("pending"),
  sourceVideoUrl: text("source_video_url"),
  sourceAudioUrl: text("source_audio_url"),
  avatarPreviewUrl: text("avatar_preview_url"),
  consentAccepted: boolean("consent_accepted").notNull().default(false),
  consentAcceptedAt: timestamp("consent_accepted_at", { withTimezone: true }),
  consentVideoR2Url: text("consent_video_r2_url"),
  trainingVideoR2Url: text("training_video_r2_url"),
  consentVideoR2Key: text("consent_video_r2_key"),
  trainingVideoR2Key: text("training_video_r2_key"),
  heygenCreationRequestId: text("heygen_creation_request_id"),
  processingStartedAt: timestamp("processing_started_at", { withTimezone: true }),
  processingError: text("processing_error"),
  avatarPreferences: jsonb("avatar_preferences").$type<{
    avatarStyle?: "normal" | "circle" | "closeUp";
    backgroundType?: "color" | "image";
    backgroundColor?: string;
    backgroundImageUrl?: string;
    voiceSpeed?: number;
    orientation?: "landscape" | "portrait" | "square";
    selectedVoiceId?: string;
    useClonedVoice?: boolean;
  }>(),
  previewVideoUrl: text("preview_video_url"),
  previewVideoId: text("preview_video_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("idx_instructor_avatars_instructor").on(table.instructorId),
]);

export const heygenVideoJobs = pgTable("heygen_video_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  instructorId: uuid("instructor_id").references(() => users.id, { onDelete: "set null" }),
  courseId: text("course_id"),
  moduleId: text("module_id"),
  heygenVideoId: text("heygen_video_id"),
  jobStatus: text("job_status").notNull().default("pending"),
  videoUrl: text("video_url"),
  videoDurationSeconds: integer("video_duration_seconds"),
  scriptText: text("script_text"),
  creditsConsumed: doublePrecision("credits_consumed").default(0),
  costUsd: doublePrecision("cost_usd").default(0),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (table) => [
  index("idx_heygen_jobs_instructor").on(table.instructorId),
  index("idx_heygen_jobs_status").on(table.jobStatus),
  index("idx_heygen_jobs_video_id").on(table.heygenVideoId),
]);

export const heygenUsageTracking = pgTable("heygen_usage_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  month: text("month").notNull(),
  totalVideosGenerated: integer("total_videos_generated").notNull().default(0),
  totalCreditsConsumed: doublePrecision("total_credits_consumed").default(0),
  totalCostUsd: doublePrecision("total_cost_usd").default(0),
  totalDurationMinutes: doublePrecision("total_duration_minutes").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
});

export const insertInstructorAvatarSchema = createInsertSchema(instructorAvatars).omit({ id: true, createdAt: true, updatedAt: true });
export type InstructorAvatar = typeof instructorAvatars.$inferSelect;
export type InsertInstructorAvatar = z.infer<typeof insertInstructorAvatarSchema>;

export type HeygenVideoJob = typeof heygenVideoJobs.$inferSelect;
export type HeygenUsageTracking = typeof heygenUsageTracking.$inferSelect;

export const liveAvatarSessions = pgTable("liveavatar_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  instructorId: uuid("instructor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: text("course_id").notNull(),
  sessionId: text("session_id"),
  sessionStatus: text("session_status").notNull().default("pending"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  durationSeconds: integer("duration_seconds").default(0),
  creditsConsumed: doublePrecision("credits_consumed").default(0),
  messagesCount: integer("messages_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_liveavatar_sessions_student").on(table.studentId),
  index("idx_liveavatar_sessions_instructor").on(table.instructorId),
]);

export const liveAvatarMessages = pgTable("liveavatar_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => liveAvatarSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_liveavatar_messages_session").on(table.sessionId),
]);

export const instructorAvailability = pgTable("instructor_availability", {
  id: uuid("id").primaryKey().defaultRandom(),
  instructorId: uuid("instructor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  timezone: text("timezone").notNull().default("America/Monterrey"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_instructor_availability_instructor").on(table.instructorId),
]);

export const instructorSessionConfig = pgTable("instructor_session_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  instructorId: uuid("instructor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  acceptsPrivateSessions: boolean("accepts_private_sessions").notNull().default(false),
  sessionTypes: jsonb("session_types").default([]),
  bioForSessions: text("bio_for_sessions"),
  specialties: text("specialties").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("idx_instructor_session_config_instructor").on(table.instructorId),
]);

export const privateSessions = pgTable("private_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  instructorId: uuid("instructor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  courseId: text("course_id"),
  sessionType: text("session_type").notNull(),
  title: text("title"),
  description: text("description"),
  scheduledDate: text("scheduled_date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  timezone: text("timezone").notNull().default("America/Monterrey"),
  durationMinutes: integer("duration_minutes").notNull(),
  priceMxn: numeric("price_mxn", { precision: 10, scale: 2 }).notNull(),
  instructorPayoutMxn: numeric("instructor_payout_mxn", { precision: 10, scale: 2 }).notNull(),
  ceduverseCommissionMxn: numeric("ceduverse_commission_mxn", { precision: 10, scale: 2 }).notNull(),
  maxStudents: integer("max_students").notNull().default(1),
  dailyRoomName: text("daily_room_name"),
  dailyRoomUrl: text("daily_room_url"),
  dailyRoomToken: text("daily_room_token"),
  sessionStatus: text("session_status").notNull().default("pending"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("idx_private_sessions_instructor").on(table.instructorId),
  index("idx_private_sessions_date").on(table.scheduledDate),
  index("idx_private_sessions_status").on(table.sessionStatus),
]);

export const sessionParticipants = pgTable("session_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => privateSessions.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  paymentStatus: text("payment_status").notNull().default("pending"),
  paymentReference: text("payment_reference"),
  paymentAmountMxn: numeric("payment_amount_mxn", { precision: 10, scale: 2 }),
  joinedAt: timestamp("joined_at", { withTimezone: true }),
  leftAt: timestamp("left_at", { withTimezone: true }),
  rating: integer("rating"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_session_participants_session").on(table.sessionId),
  index("idx_session_participants_student").on(table.studentId),
]);

export const instructorReviews = pgTable("instructor_reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  instructorId: uuid("instructor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").references(() => privateSessions.id, { onDelete: "set null" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_instructor_reviews_instructor").on(table.instructorId),
  index("idx_instructor_reviews_student").on(table.studentId),
]);

export const insertInstructorSessionConfigSchema = createInsertSchema(instructorSessionConfig).omit({ id: true, createdAt: true, updatedAt: true });
export type InstructorSessionConfig = typeof instructorSessionConfig.$inferSelect;
export type InsertInstructorSessionConfig = z.infer<typeof insertInstructorSessionConfigSchema>;

export const insertPrivateSessionSchema = createInsertSchema(privateSessions).omit({ id: true, createdAt: true, updatedAt: true });
export type PrivateSession = typeof privateSessions.$inferSelect;
export type InsertPrivateSession = z.infer<typeof insertPrivateSessionSchema>;

export type SessionParticipant = typeof sessionParticipants.$inferSelect;
export type InstructorReview = typeof instructorReviews.$inferSelect;
export type LiveAvatarSession = typeof liveAvatarSessions.$inferSelect;
export type LiveAvatarMessage = typeof liveAvatarMessages.$inferSelect;
export type InstructorAvailability = typeof instructorAvailability.$inferSelect;

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "expired",
]);

export const employeeInvitations = pgTable("employee_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  nombre: text("nombre").notNull(),
  apellido: text("apellido"),
  puesto: text("puesto"),
  departamento: text("departamento"),
  token: text("token").notNull().unique(),
  referralCode: text("referral_code"),
  status: invitationStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_employee_invitations_team").on(table.teamId),
  index("idx_employee_invitations_email").on(table.email),
  index("idx_employee_invitations_token").on(table.token),
]);

export const insertEmployeeInvitationSchema = createInsertSchema(employeeInvitations).omit({
  id: true,
  createdAt: true,
});
export type EmployeeInvitation = typeof employeeInvitations.$inferSelect;
export type InsertEmployeeInvitation = z.infer<typeof insertEmployeeInvitationSchema>;

export const samRequestStatusEnum = pgEnum("sam_request_status", [
  "pending",
  "approved",
  "rejected",
]);

export const samRequests = pgTable("sam_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: text("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  periodYear: integer("period_year").notNull(),
  periodMonth: integer("period_month").notNull(),
  fileUrl: text("file_url"),
  employeeCount: integer("employee_count").notNull().default(0),
  status: samRequestStatusEnum("status").notNull().default("pending"),
  submittedBy: uuid("submitted_by").references(() => users.id, { onDelete: "set null" }),
  reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
  reviewNote: text("review_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  uniqueIndex("uq_sam_requests_period").on(table.teamId, table.periodYear, table.periodMonth),
  index("idx_sam_requests_team").on(table.teamId),
  index("idx_sam_requests_status").on(table.status),
]);

export const insertSamRequestSchema = createInsertSchema(samRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type SamRequest = typeof samRequests.$inferSelect;
export type InsertSamRequest = z.infer<typeof insertSamRequestSchema>;

export const storeProducts = pgTable("store_products", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  priceMxn: integer("price_mxn").notNull(),
  weightKg: decimal("weight_kg", { precision: 5, scale: 2 }).notNull(),
  dimensionsJson: jsonb("dimensions_json"),
  imageUrl: text("image_url"),
  deliveryDays: varchar("delivery_days", { length: 50 }).default("30-45 días"),
  isActive: boolean("is_active").default(true),
  isSoldOut: boolean("is_sold_out").default(false),
  seedPhraseOptions: jsonb("seed_phrase_options"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const storeStock = pgTable("store_stock", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => storeProducts.id).notNull(),
  quantity: integer("quantity").notNull().default(0),
  reserved: integer("reserved").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("uq_store_stock_product").on(table.productId),
]);

export const storeReferralCodes = pgTable("store_referral_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 30 }).notNull().unique(),
  ownerId: integer("owner_id"),
  ownerName: text("owner_name"),
  discountPct: integer("discount_pct").notNull().default(15),
  commissionPct: integer("commission_pct").default(0),
  maxUses: integer("max_uses").default(100),
  currentUses: integer("current_uses").default(0),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const storeOrders = pgTable("store_orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 30 }).notNull().unique(),
  userId: integer("user_id"),
  payerName: text("payer_name").notNull(),
  payerEmail: text("payer_email").notNull(),
  payerPhone: varchar("payer_phone", { length: 20 }),
  shipStreet: text("ship_street"),
  shipColony: text("ship_colony"),
  shipCity: text("ship_city"),
  shipState: varchar("ship_state", { length: 5 }),
  shipZip: varchar("ship_zip", { length: 10 }),
  shipCountry: varchar("ship_country", { length: 3 }).default("MX"),
  shipNotes: text("ship_notes"),
  subtotalMxn: integer("subtotal_mxn").notNull(),
  discountPct: integer("discount_pct").default(0),
  discountAmountMxn: integer("discount_amount_mxn").default(0),
  shippingMxn: integer("shipping_mxn").default(0),
  totalMxn: integer("total_mxn").notNull(),
  referralCodeId: integer("referral_code_id").references(() => storeReferralCodes.id),
  seedPhraseWords: integer("seed_phrase_words").default(12),
  mpPreferenceId: text("mp_preference_id"),
  mpPaymentId: text("mp_payment_id"),
  mpStatus: varchar("mp_status", { length: 30 }).default("pending"),
  status: varchar("status", { length: 30 }).default("pending_payment"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  paidAt: timestamp("paid_at"),
  shippedAt: timestamp("shipped_at"),
});

export const storeOrderItems = pgTable("store_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => storeOrders.id).notNull(),
  productId: integer("product_id").references(() => storeProducts.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPriceMxn: integer("unit_price_mxn").notNull(),
  totalPriceMxn: integer("total_price_mxn").notNull(),
});

export const storeShipments = pgTable("store_shipments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => storeOrders.id).notNull(),
  carrier: varchar("carrier", { length: 50 }),
  service: varchar("service", { length: 100 }),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  labelUrl: text("label_url"),
  shippingCostMxn: integer("shipping_cost_mxn"),
  estimatedDays: varchar("estimated_days", { length: 30 }),
  status: varchar("status", { length: 30 }).default("pending"),
  enviaShipmentId: text("envia_shipment_id"),
  enviaResponseJson: jsonb("envia_response_json"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const storeReferralUses = pgTable("store_referral_uses", {
  id: serial("id").primaryKey(),
  referralCodeId: integer("referral_code_id").references(() => storeReferralCodes.id).notNull(),
  orderId: integer("order_id").references(() => storeOrders.id).notNull(),
  discountAppliedMxn: integer("discount_applied_mxn").notNull(),
  usedAt: timestamp("used_at").defaultNow(),
});

export const insertStoreProductSchema = createInsertSchema(storeProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type StoreProduct = typeof storeProducts.$inferSelect;
export type InsertStoreProduct = z.infer<typeof insertStoreProductSchema>;

export const insertStoreStockSchema = createInsertSchema(storeStock).omit({
  id: true,
  updatedAt: true,
});
export type StoreStock = typeof storeStock.$inferSelect;
export type InsertStoreStock = z.infer<typeof insertStoreStockSchema>;

export const insertStoreOrderSchema = createInsertSchema(storeOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  paidAt: true,
  shippedAt: true,
});
export type StoreOrder = typeof storeOrders.$inferSelect;
export type InsertStoreOrder = z.infer<typeof insertStoreOrderSchema>;

export const insertStoreOrderItemSchema = createInsertSchema(storeOrderItems).omit({
  id: true,
});
export type StoreOrderItem = typeof storeOrderItems.$inferSelect;
export type InsertStoreOrderItem = z.infer<typeof insertStoreOrderItemSchema>;

export const insertStoreShipmentSchema = createInsertSchema(storeShipments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type StoreShipment = typeof storeShipments.$inferSelect;
export type InsertStoreShipment = z.infer<typeof insertStoreShipmentSchema>;

export const insertStoreReferralCodeSchema = createInsertSchema(storeReferralCodes).omit({
  id: true,
  currentUses: true,
  createdAt: true,
});
export type StoreReferralCode = typeof storeReferralCodes.$inferSelect;
export type InsertStoreReferralCode = z.infer<typeof insertStoreReferralCodeSchema>;

export const insertStoreReferralUseSchema = createInsertSchema(storeReferralUses).omit({
  id: true,
  usedAt: true,
});
export type StoreReferralUse = typeof storeReferralUses.$inferSelect;
export type InsertStoreReferralUse = z.infer<typeof insertStoreReferralUseSchema>;

// Socio comercial resource hub — hybrid: compliance rules and downloadable
// resources are admin-managed here; sales scripts/FAQs live in the client.
// category: "compliance" | "download"
// kind (compliance): "approved" | "prohibited" | "conditional" | "disclaimer"
// kind (download):   "pdf" | "deck" | "brand" | "link"
export const socioResources = pgTable("socio_resources", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: text("category").notNull(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url"),
  sortOrder: integer("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  updatedBy: uuid("updated_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("idx_socio_resources_category").on(table.category),
]);

export const insertSocioResourceSchema = createInsertSchema(socioResources).omit({ id: true, createdAt: true, updatedAt: true });
export type SocioResource = typeof socioResources.$inferSelect;
export type InsertSocioResource = z.infer<typeof insertSocioResourceSchema>;

// OTP codes — persisted to DB for multi-instance support and server restart resilience
export const otpCodes = pgTable("otp_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  attempts: integer("attempts").notNull().default(0),
  fullName: text("full_name"),
  joinCoop: boolean("join_coop").notNull().default(false),
  phone: text("phone"),
  curp: text("curp"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("idx_otp_codes_email").on(table.email),
  index("idx_otp_codes_expires").on(table.expiresAt),
]);

// ==================== CRYPTOVAULT 24k (Kakaw) ====================
// Pedidos del CryptoVault 24k vendido en /ceduverse. Precio dinámico basado en
// spot de oro (ver server/services/*). El NFT título 1:1 del lingote se RESERVA
// al pagar y se acuña cuando los contratos Kakaw estén desplegados (sin mock on-chain).
export const cryptoVaultOrderStatusEnum = pgEnum("crypto_vault_order_status", [
  "pending_payment", // esperando pago (transferencia) o checkout Stripe abierto
  "paid",            // pago confirmado
  "title_reserved",  // título 1:1 reservado, acuñación pendiente
  "minted",          // NFT acuñado on-chain (fase futura)
  "cancelled",
]);
export const cryptoVaultRailEnum = pgEnum("crypto_vault_rail", [
  "stripe",       // tarjeta fiat
  "transfer_us",  // transferencia USD (MeCorrieron LLC)
  "transfer_mx",  // transferencia MXN (Ceduverse) — pendiente de cuenta
  "crypto",       // pago cripto — fase futura
]);

export const cryptoVaultOrders = pgTable("crypto_vault_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderNumber: varchar("order_number", { length: 30 }).notNull().unique(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  buyerEmail: text("buyer_email").notNull(),
  buyerName: text("buyer_name"),
  editionKey: varchar("edition_key", { length: 8 }).notNull(), // "100" | "200"
  grams: integer("grams").notNull(),
  currency: varchar("currency", { length: 3 }).notNull(),      // "MXN" | "USD"
  // Spot 24k por gramo lockeado al cotizar (registro histórico exacto).
  spotPerGram: numeric("spot_per_gram", { precision: 14, scale: 4 }).notNull(),
  operationalFeePct: numeric("operational_fee_pct", { precision: 5, scale: 4 }).notNull(),
  // Montos en unidades MENORES (centavos) de `currency`, compatibles con Stripe.
  goldValueMinor: integer("gold_value_minor").notNull(),
  operationalFeeMinor: integer("operational_fee_minor").notNull(),
  subtotalMinor: integer("subtotal_minor").notNull(),
  gasFeeMinor: integer("gas_fee_minor").notNull().default(0),
  shippingFeeMinor: integer("shipping_fee_minor").notNull().default(0),
  totalMinor: integer("total_minor").notNull(),
  rail: cryptoVaultRailEnum("rail").notNull(),
  status: cryptoVaultOrderStatusEnum("status").notNull().default("pending_payment"),
  // Modo de entrega: "vault" (bóveda asignada + título, único disponible),
  // "experience" (viaje Web3Travel — próximamente) o "import" (físico a MX — próximamente).
  deliveryMode: varchar("delivery_mode", { length: 16 }).notNull().default("vault"),
  stripeSessionId: text("stripe_session_id"),
  paymentRef: text("payment_ref"),          // referencia de transferencia / tx cripto
  titleStatus: text("title_status").notNull().default("pendiente_acunacion"),
  barSerial: text("bar_serial"),            // serie del lingote asignado al reservar
  assayCertHash: text("assay_cert_hash"),   // hash del certificado de ensaye (placeholder)
  shippingAddress: jsonb("shipping_address"),
  quoteLockedUntil: timestamp("quote_locked_until", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }),
}, (table) => [
  index("idx_crypto_vault_orders_user").on(table.userId),
  index("idx_crypto_vault_orders_status").on(table.status),
]);
