import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { requireAuth, optionalAuth, requireAdmin, requireAdminOrPartner, requireSuperadmin, requirePartner, requireOrgAdmin, requireInstructor, checkPendingTerms } from "./auth";

import { registerFinancieroRoutes } from "./financiero-routes";
import storeRoutes from "./store-routes";
import { registerExternalApiRoutes } from "./external-api";
import { registerHqRoutes } from "./routes/hq";
import { sendKitEmail } from "./email";
import { db } from "./db";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  insertTeamSchema,
  insertCourseUserSchema,
  insertTeamUserSchema,
  insertLeadSchema,
  insertOrgObjectiveSchema,
  insertReferralCodeSchema,
  users,
  accounts,
  profiles,
  teams,
  teamUsers,
  courseUsers,
  orgObjectives,
  userObjectives,
  referralCodes,
  courses,
  certificateRequests,
  achievements,
  achievementUsers,
  instructorProfiles,
  instructorCourses,
  instructorApplications,
  courseModules,
  termsVersions,
  userTermsAcceptances,
  roleDefinitions,
  roleChangeLog,
  globalConfig,
  userContactCards,
  partnerCommissions,
  socioResources,
  insertSocioResourceSchema,
} from "@shared/schema";
import { eq, and, or, sql, count, desc, asc, gte, lte, inArray, ilike, type SQL } from "drizzle-orm";
import { r2Storage } from "./services/r2-storage";
import { z } from "zod";
import sanitizeHtml from "sanitize-html";
import bcrypt from "bcryptjs";

// Route modules
import { registerCourseRoutes } from "./routes/courses";
import { registerPlaybookRoutes } from "./routes/playbook";
import { registerRiesgosRoutes } from "./routes/riesgos";
import { registerAdminRoutes } from "./routes/admin";
import { registerCrmRoutes } from "./routes/crm";
import { ensureReferralCode } from "./lib/ensure-referral-code";
import { acceptTermsForUser } from "./lib/accept-terms";
import { registerGoogleMeetRoutes } from "./routes/google-meet";
import { registerMembershipRoutes } from "./routes/membership";
import { registerCertificateRoutes } from "./routes/certificates";
import { registerVaultRoutes } from "./routes/vault";
import { registerHeygenRoutes } from "./routes/heygen";
import { registerApiKeyRoutes } from "./routes/api-keys";
import { registerEmpresaRoutes } from "./routes/empresa";
import { createOrUpdateContactCard, getInitialsFromName, generateSlug, getUniqueSlug } from "./routes/helpers";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {

  registerExternalApiRoutes(app);
  registerHqRoutes(app); // conector del HQ Kakaw (x-hq-secret, solo agregados)

  app.get("/propuestas/pyrotech", (_req, res) => {
    const proposalFile = "propuestas/pyrotech/index.html";
    const prodPath = path.resolve(process.cwd(), "dist/public", proposalFile);
    const devPath = path.resolve(process.cwd(), "client/public", proposalFile);
    const filePath = fs.existsSync(prodPath) ? prodPath : devPath;
    res.sendFile(filePath, (err) => {
      if (err) res.status(404).send("Página no encontrada");
    });
  });

  app.use(optionalAuth, checkPendingTerms);

  app.get("/api/auth/me", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (err) { next(err); }
  });

  app.get("/api/role-definitions", requireAuth, async (_req, res, next) => {
    try {
      const defs = await db.select().from(roleDefinitions);
      res.json(defs);
    } catch (err) { next(err); }
  });

  app.get("/api/role-definition/:roleKey", requireAuth, async (req, res, next) => {
    try {
      const [def] = await db.select().from(roleDefinitions).where(eq(roleDefinitions.roleKey, (req.params.roleKey as string)));
      if (!def) return res.status(404).json({ message: "Rol no encontrado" });
      res.json(def);
    } catch (err) { next(err); }
  });

  app.get("/api/admin/role-change-log", requireAuth, requireSuperadmin, async (req, res, next) => {
    try {
      const { rows: logs } = await db.execute(sql`
        SELECT rcl.*, u.email as user_email, cb.email as changed_by_email
        FROM role_change_log rcl
        LEFT JOIN users u ON rcl.user_id = u.id
        LEFT JOIN users cb ON rcl.changed_by = cb.id
        ORDER BY rcl.created_at DESC
        LIMIT 200
      `);
      const formatted = (logs as any[]).map(l => ({
        id: l.id,
        userId: l.user_id,
        userEmail: l.user_email,
        changedBy: l.changed_by,
        changedByEmail: l.changed_by_email,
        previousRole: l.previous_role,
        newRole: l.new_role,
        reason: l.reason,
        ipAddress: l.ip_address,
        createdAt: l.created_at,
      }));
      res.json(formatted);
    } catch (err) { next(err); }
  });

  app.get("/api/admin/config", requireAuth, requireSuperadmin, async (_req, res, next) => {
    try {
      const configs = await db.select().from(globalConfig).orderBy(globalConfig.category, globalConfig.key);
      res.json(configs);
    } catch (err) { next(err); }
  });

  app.patch("/api/admin/config/:key", requireAuth, requireSuperadmin, async (req, res, next) => {
    try {
      const configKey = (req.params.key as string);
      const { value } = req.body;
      if (value === undefined) return res.status(400).json({ message: "Valor requerido" });

      const [existing] = await db.select().from(globalConfig).where(eq(globalConfig.key, configKey));
      if (!existing) return res.status(404).json({ message: "Configuración no encontrada" });

      let coerced = value;
      if (existing.valueType === "boolean") {
        if (typeof value !== "boolean") return res.status(400).json({ message: "Se esperaba un valor booleano" });
        coerced = value;
      } else if (existing.valueType === "number") {
        const num = Number(value);
        if (isNaN(num)) return res.status(400).json({ message: "Se esperaba un valor numérico" });
        coerced = num;
      } else if (existing.valueType === "string") {
        if (typeof value !== "string") return res.status(400).json({ message: "Se esperaba un valor de texto" });
        coerced = value;
      }

      const [updated] = await db.update(globalConfig)
        .set({ value: coerced, updatedBy: req.supabaseUserId!, updatedAt: new Date() })
        .where(eq(globalConfig.key, configKey))
        .returning();

      const { logAudit } = await import("./audit-log");
      await logAudit({
        req,
        action: "config.update",
        targetType: "global_config",
        targetId: configKey,
        before: { value: existing.value },
        after: { value: coerced },
      });

      res.json(updated);
    } catch (err) { next(err); }
  });

  app.get("/api/terms/pending", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const account = await storage.getAccount(userId);
      const userRole = account?.userRole || "socio_estudiante";

      const activeVersions = await db.select().from(termsVersions)
        .where(eq(termsVersions.isActive, true));

      const applicableVersions = activeVersions.filter(v =>
        v.requiredForRoles && v.requiredForRoles.includes(userRole)
      );

      const acceptances = await db.select().from(userTermsAcceptances)
        .where(eq(userTermsAcceptances.userId, userId));

      const acceptedVersionIds = new Set(acceptances.map(a => a.termsVersionId));
      const pending = applicableVersions.filter(v => !acceptedVersionIds.has(v.id));

      res.json({ pending, total: applicableVersions.length, accepted: acceptedVersionIds.size });
    } catch (err) { next(err); }
  });

  app.post("/api/user/accept-terms", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const { versionIds } = req.body;

      if (!Array.isArray(versionIds) || versionIds.length === 0) {
        return res.status(400).json({ message: "Se requiere al menos un versionId" });
      }

      const acceptSchema = z.object({ versionIds: z.array(z.string().uuid()).min(1).max(10) });
      const parsed = acceptSchema.safeParse({ versionIds });
      if (!parsed.success) {
        return res.status(400).json({ message: "Formato inválido de versionIds" });
      }

      const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "";
      const userAgent = req.headers["user-agent"] || "";

      // Lógica compartida con el alta nueva (server/auth.ts, verify-code) —
      // ver server/lib/accept-terms.ts. No duplicar: ahí vive el hash de
      // evidencia y el alta de membresía cooperativa.
      const result = await acceptTermsForUser({
        userId,
        versionIds: parsed.data.versionIds,
        ip,
        userAgent,
      });

      res.json({ accepted: result.acceptedVersionIds.length, membershipNumber: result.membershipNumber });
    } catch (err) { next(err); }
  });

  app.get("/api/terms/history", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const acceptances = await db.select({
        id: userTermsAcceptances.id,
        termsVersionId: userTermsAcceptances.termsVersionId,
        acceptedAt: userTermsAcceptances.acceptedAt,
        acceptanceIp: userTermsAcceptances.acceptanceIp,
        acceptanceHash: userTermsAcceptances.acceptanceHash,
        docType: termsVersions.docType,
        version: termsVersions.version,
        title: termsVersions.title,
      })
        .from(userTermsAcceptances)
        .innerJoin(termsVersions, eq(userTermsAcceptances.termsVersionId, termsVersions.id))
        .where(eq(userTermsAcceptances.userId, userId))
        .orderBy(desc(userTermsAcceptances.acceptedAt));

      res.json(acceptances);
    } catch (err) { next(err); }
  });

  app.get("/api/admin/terms", requireAdmin, async (_req, res, next) => {
    try {
      const versions = await db.select().from(termsVersions).orderBy(desc(termsVersions.publishedAt));

      const allAccounts = await db.select({ id: accounts.id, userRole: accounts.userRole }).from(accounts);

      const stats = await Promise.all(versions.map(async (v) => {
        const [acceptedCount] = await db.select({ count: count() }).from(userTermsAcceptances)
          .where(eq(userTermsAcceptances.termsVersionId, v.id));

        const applicableUsers = allAccounts.filter(a =>
          v.requiredForRoles && v.requiredForRoles.includes(a.userRole || "socio_estudiante")
        );
        const totalUsers = applicableUsers.length;

        return {
          ...v,
          acceptedCount: acceptedCount?.count || 0,
          pendingCount: Math.max(0, totalUsers - (acceptedCount?.count || 0)),
          totalUsers,
        };
      }));

      res.json(stats);
    } catch (err) { next(err); }
  });

  app.post("/api/admin/terms/versions", requireAdmin, async (req, res, next) => {
    try {
      const { docType, version, title, summary, contentUrl, isBlocking, requiredForRoles } = req.body;

      if (!docType || !version || !title) {
        return res.status(400).json({ message: "Tipo, versión y título son requeridos" });
      }

      await db.update(termsVersions)
        .set({ isActive: false })
        .where(eq(termsVersions.docType, docType));

      const [newVersion] = await db.insert(termsVersions).values({
        docType,
        version,
        title,
        summary: summary || null,
        contentUrl: contentUrl || null,
        isBlocking: isBlocking !== false,
        isActive: true,
        requiredForRoles: requiredForRoles || ["socio_estudiante", "socio_instructor", "socio_comercial", "director", "empresa", "empresa_rh", "admin", "superadmin"],
        publishedBy: req.supabaseUserId,
      }).returning();

      res.status(201).json(newVersion);
    } catch (err) { next(err); }
  });

  app.get("/api/admin/terms/acceptances", requireAdmin, async (req, res, next) => {
    try {
      const versionId = req.query.versionId as string | undefined;

      const baseQuery = db.select({
        id: userTermsAcceptances.id,
        userId: userTermsAcceptances.userId,
        termsVersionId: userTermsAcceptances.termsVersionId,
        acceptedAt: userTermsAcceptances.acceptedAt,
        acceptanceIp: userTermsAcceptances.acceptanceIp,
        acceptanceHash: userTermsAcceptances.acceptanceHash,
        docType: termsVersions.docType,
        version: termsVersions.version,
        title: termsVersions.title,
      })
        .from(userTermsAcceptances)
        .innerJoin(termsVersions, eq(userTermsAcceptances.termsVersionId, termsVersions.id));

      const conditions = versionId ? eq(userTermsAcceptances.termsVersionId, versionId) : undefined;
      const acceptances = conditions
        ? await baseQuery.where(conditions).orderBy(desc(userTermsAcceptances.acceptedAt)).limit(100)
        : await baseQuery.orderBy(desc(userTermsAcceptances.acceptedAt)).limit(100);

      res.json(acceptances);
    } catch (err) { next(err); }
  });

  // ==================== Route Modules ====================
  registerCourseRoutes(app);
  registerCertificateRoutes(app);
  registerPlaybookRoutes(app);
  registerRiesgosRoutes(app);
  registerVaultRoutes(app);
  registerAdminRoutes(app);

  // ==================== PARTNER ROUTES ====================

  app.get("/api/partner/stats", requireAuth, requirePartner, async (req, res, next) => {
    try {
      const partnerId = req.supabaseUserId!;
      const partnerOrgs = await db.select().from(teams).where(eq(teams.partnerId, partnerId));
      const activeOrgs = partnerOrgs.filter(o => o.status === "active").length;
      const codes = await db.select().from(referralCodes).where(eq(referralCodes.ownerId, partnerId));
      const activeCodes = codes.filter(c => c.isActive).length;
      const totalUsage = codes.reduce((sum, c) => sum + c.usageCount, 0);

      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const [monthlyRow] = await db.select({ total: sql<number>`COALESCE(SUM(${partnerCommissions.amount}), 0)` })
        .from(partnerCommissions).where(and(
          eq(partnerCommissions.partnerId, partnerId),
          eq(partnerCommissions.periodMonth, currentMonth),
          eq(partnerCommissions.periodYear, currentYear),
        ));
      const monthlyCommission = Number(monthlyRow?.total) || 0;

      const [totalRow] = await db.select({ total: sql<number>`COALESCE(SUM(${partnerCommissions.amount}), 0)` })
        .from(partnerCommissions).where(eq(partnerCommissions.partnerId, partnerId));
      const totalCommission = Number(totalRow?.total) || codes.reduce((sum, c) => sum + (c.usageCount * c.commission), 0);

      let trainedCollaborators = 0;
      for (const org of partnerOrgs) {
        const [completedCount] = await db.select({ count: count() })
          .from(courseUsers)
          .innerJoin(teamUsers, eq(courseUsers.userId, teamUsers.userId))
          .where(and(eq(teamUsers.teamId, org.id), eq(courseUsers.completed, 100)));
        trainedCollaborators += completedCount.count;
      }

      let dc3Sold = 0;
      for (const org of partnerOrgs) {
        const [dc3Count] = await db.select({ count: count() })
          .from(certificateRequests)
          .innerJoin(teamUsers, eq(certificateRequests.userId, teamUsers.userId))
          .where(and(eq(teamUsers.teamId, org.id), eq(certificateRequests.certType, "dc3")));
        dc3Sold += dc3Count.count;
      }

      res.json({
        activeCompanies: activeOrgs,
        monthlyCommission,
        trainedCollaborators,
        dc3Sold,
        totalOrgs: partnerOrgs.length,
        totalCodes: activeCodes,
        totalUsage,
        totalCommission,
      });
    } catch (err) { next(err); }
  });

  app.get("/api/partner/orgs", requireAuth, requirePartner, async (req, res, next) => {
    try {
      const partnerId = req.supabaseUserId!;
      const orgs = await db.select().from(teams).where(eq(teams.partnerId, partnerId));
      const result = [];
      for (const org of orgs) {
        const [memberCount] = await db.select({ count: count() }).from(teamUsers).where(eq(teamUsers.teamId, org.id));
        result.push({ ...org, memberCount: memberCount.count });
      }
      res.json(result);
    } catch (err) { next(err); }
  });

  app.get("/api/partner/referrals", requireAuth, requirePartner, async (req, res, next) => {
    try {
      const partnerId = req.supabaseUserId!;
      const codes = await db.select().from(referralCodes).where(eq(referralCodes.ownerId, partnerId));
      res.json(codes);
    } catch (err) { next(err); }
  });

  app.post("/api/partner/referrals", requireAuth, requirePartner, async (req, res, next) => {
    try {
      const partnerId = req.supabaseUserId!;
      const { label, commission } = req.body;
      const code = `P-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const [ref] = await db.insert(referralCodes).values({
        code,
        ownerId: partnerId,
        ownerType: "socio_comercial",
        label: label || null,
        commission: commission || 10,
        isActive: true,
      }).returning();
      res.status(201).json(ref);
    } catch (err) { next(err); }
  });

  app.get("/api/partner/commissions", requireAuth, requirePartner, async (req, res, next) => {
    try {
      const partnerId = req.supabaseUserId!;
      const commissions = await db.select({
        commission: partnerCommissions,
        teamName: teams.name,
      }).from(partnerCommissions)
        .leftJoin(teams, eq(partnerCommissions.teamId, teams.id))
        .where(eq(partnerCommissions.partnerId, partnerId))
        .orderBy(desc(partnerCommissions.periodYear), desc(partnerCommissions.periodMonth));
      res.json(commissions.map(c => ({
        ...c.commission,
        teamName: c.teamName || "Organización",
      })));
    } catch (err) { next(err); }
  });

  // ==================== SOCIO RESOURCE HUB ====================
  // Partner-facing: published resources (compliance rules + downloads).
  app.get("/api/socio/resources", requireAuth, requirePartner, async (_req, res, next) => {
    try {
      const rows = await db.select().from(socioResources)
        .where(eq(socioResources.isPublished, true))
        .orderBy(asc(socioResources.category), asc(socioResources.sortOrder));
      res.json(rows);
    } catch (err) { next(err); }
  });

  // Admin: full CRUD over socio resources (superadmin only).
  app.get("/api/admin/socio-resources", requireAuth, requireSuperadmin, async (_req, res, next) => {
    try {
      const rows = await db.select().from(socioResources)
        .orderBy(asc(socioResources.category), asc(socioResources.sortOrder));
      res.json(rows);
    } catch (err) { next(err); }
  });

  app.post("/api/admin/socio-resources", requireAuth, requireSuperadmin, async (req, res, next) => {
    try {
      const parsed = insertSocioResourceSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
      const [row] = await db.insert(socioResources)
        .values({ ...parsed.data, updatedBy: req.supabaseUserId! })
        .returning();
      res.status(201).json(row);
    } catch (err) { next(err); }
  });

  app.patch("/api/admin/socio-resources/:id", requireAuth, requireSuperadmin, async (req, res, next) => {
    try {
      const parsed = insertSocioResourceSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.issues[0].message });
      const [row] = await db.update(socioResources)
        .set({ ...parsed.data, updatedBy: req.supabaseUserId!, updatedAt: new Date() })
        .where(eq(socioResources.id, req.params.id as string))
        .returning();
      if (!row) return res.status(404).json({ message: "Recurso no encontrado" });
      res.json(row);
    } catch (err) { next(err); }
  });

  app.delete("/api/admin/socio-resources/:id", requireAuth, requireSuperadmin, async (req, res, next) => {
    try {
      const result = await db.delete(socioResources).where(eq(socioResources.id, req.params.id as string)).returning();
      if (!result.length) return res.status(404).json({ message: "Recurso no encontrado" });
      res.json({ success: true });
    } catch (err) { next(err); }
  });

  // ==================== INSTRUCTOR ROUTES ====================

  app.get("/api/instructor/courses", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;

      const instructorCourses = await db.select().from(courses).where(eq(courses.instructorId, userId));

      const result = [];
      for (const course of instructorCourses) {
        const [enrolled] = await db.select({ count: count() }).from(courseUsers).where(eq(courseUsers.courseId, course.id));
        const [completed] = await db.select({ count: count() }).from(courseUsers).where(
          and(eq(courseUsers.courseId, course.id), eq(courseUsers.completed, 100))
        );
        const [avgRow] = await db.select({ avg: sql<number>`COALESCE(AVG(${courseUsers.completed}), 0)` })
          .from(courseUsers).where(eq(courseUsers.courseId, course.id));

        result.push({
          ...course,
          enrolledCount: enrolled?.count || 0,
          completedCount: completed?.count || 0,
          avgProgress: Math.round(avgRow?.avg || 0),
        });
      }
      res.json(result);
    } catch (err) { next(err); }
  });

  app.post("/api/instructor/courses", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const { title, description } = req.body;
      if (!title || typeof title !== "string" || title.trim().length < 3) {
        return res.status(400).json({ message: "El nombre del curso debe tener al menos 3 caracteres" });
      }
      const slug = title.trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
        + "-" + Date.now().toString(36);
      const [profile] = await db.select({ fullName: profiles.fullName }).from(profiles).where(eq(profiles.id, userId));
      const [newCourse] = await db.insert(courses).values({
        slug,
        title: title.trim(),
        description: description?.trim() || null,
        instructorId: userId,
        instructor: profile?.fullName || "Instructor",
      }).returning();
      res.json(newCourse);
    } catch (err) { next(err); }
  });

  app.get("/api/instructor/stats", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;

      const instructorCourses = await db.select().from(courses).where(eq(courses.instructorId, userId));
      const courseIds = instructorCourses.map(c => c.id);
      // certificate_requests ancla en studio_course_slug (Task 8), no en course_id legacy;
      // se resuelve el slug del curso legacy para la comparación.
      const courseSlugById = new Map(instructorCourses.map(c => [c.id, c.slug]));

      let totalEnrolled = 0;
      let totalCompleted = 0;
      let totalProgress = 0;
      let enrollmentCount = 0;
      let totalCertificates = 0;

      for (const cid of courseIds) {
        const [enrolled] = await db.select({ count: count() }).from(courseUsers).where(eq(courseUsers.courseId, cid));
        const [completed] = await db.select({ count: count() }).from(courseUsers).where(
          and(eq(courseUsers.courseId, cid), eq(courseUsers.completed, 100))
        );
        const allEnrollments = await db.select().from(courseUsers).where(eq(courseUsers.courseId, cid));
        totalEnrolled += enrolled.count;
        totalCompleted += completed.count;
        for (const e of allEnrollments) {
          totalProgress += e.completed;
          enrollmentCount++;
        }
        const [certCount] = await db.select({ count: count() }).from(certificateRequests).where(
          and(eq(certificateRequests.studioCourseSlug, courseSlugById.get(cid)!), eq(certificateRequests.status, "emitido"))
        );
        totalCertificates += certCount.count;
      }

      res.json({
        totalCourses: instructorCourses.length,
        totalEnrolled,
        totalCompleted,
        totalCertificates,
        avgProgress: enrollmentCount > 0 ? Math.round(totalProgress / enrollmentCount) : 0,
      });
    } catch (err) { next(err); }
  });

  app.get("/api/instructor/students", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;

      const instructorCourses = await db.select().from(courses).where(eq(courses.instructorId, userId));

      const studentMap = new Map<string, { userId: string; fullName: string | null; email: string; courses: { title: string; progress: number }[] }>();

      for (const course of instructorCourses) {
        const enrollments = await db.select({ cu: courseUsers, u: users, p: profiles })
          .from(courseUsers)
          .innerJoin(users, eq(courseUsers.userId, users.id))
          .leftJoin(profiles, eq(courseUsers.userId, profiles.id))
          .where(eq(courseUsers.courseId, course.id));

        for (const row of enrollments) {
          const existing = studentMap.get(row.cu.userId);
          const courseEntry = { title: course.title, progress: row.cu.completed };
          if (existing) {
            existing.courses.push(courseEntry);
          } else {
            studentMap.set(row.cu.userId, {
              userId: row.cu.userId,
              fullName: row.p?.fullName || null,
              email: row.u.email,
              courses: [courseEntry],
            });
          }
        }
      }

      res.json(Array.from(studentMap.values()));
    } catch (err) { next(err); }
  });

  app.get("/api/instructor/profile", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const [profile] = await db.select().from(instructorProfiles).where(eq(instructorProfiles.id, userId));
      if (!profile) {
        await db.insert(instructorProfiles).values({ id: userId });
        const [newProfile] = await db.select().from(instructorProfiles).where(eq(instructorProfiles.id, userId));
        return res.json(newProfile);
      }
      res.json(profile);
    } catch (err) { next(err); }
  });

  app.put("/api/instructor/profile", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const { bio, specialty, bankName, bankClabe, profileImageUrl } = req.body;
      const [existing] = await db.select().from(instructorProfiles).where(eq(instructorProfiles.id, userId));
      if (!existing) {
        await db.insert(instructorProfiles).values({ id: userId, bio, specialty, bankName, bankClabe, profileImageUrl });
      } else {
        await db.update(instructorProfiles).set({ bio, specialty, bankName, bankClabe, profileImageUrl }).where(eq(instructorProfiles.id, userId));
      }
      const [updated] = await db.select().from(instructorProfiles).where(eq(instructorProfiles.id, userId));
      res.json(updated);
    } catch (err) { next(err); }
  });

  app.get("/api/instructor/my-courses", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const result = await db.select().from(instructorCourses).where(eq(instructorCourses.instructorId, userId)).orderBy(desc(instructorCourses.createdAt));
      res.json(result);
    } catch (err) { next(err); }
  });

  app.post("/api/instructor/my-courses", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const { title, description, category, level, durationHours, certificationType, isFree, price, availableForAll, tags, nomsRelated, modules, quizzes, status } = req.body;
      const [course] = await db.insert(instructorCourses).values({
        instructorId: userId,
        title,
        description,
        category,
        level,
        durationHours: durationHours ? parseInt(durationHours) : null,
        certificationType: certificationType || "nft",
        isFree: isFree !== false,
        price: price || "0",
        availableForAll: availableForAll !== false,
        tags: tags || [],
        nomsRelated: nomsRelated || [],
        modules: modules || [],
        quizzes: quizzes || [],
        status: status || "draft",
        publishedAt: status === "review" ? new Date() : null,
      }).returning();
      res.json(course);
    } catch (err) { next(err); }
  });

  app.get("/api/instructor/my-courses/:id", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const [course] = await db.select().from(instructorCourses).where(and(eq(instructorCourses.id, (req.params.id as string)), eq(instructorCourses.instructorId, userId)));
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });
      res.json(course);
    } catch (err) { next(err); }
  });

  app.patch("/api/instructor/my-courses/:id", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const [existing] = await db.select().from(instructorCourses).where(and(eq(instructorCourses.id, (req.params.id as string)), eq(instructorCourses.instructorId, userId)));
      if (!existing) return res.status(404).json({ message: "Curso no encontrado" });

      const { title, description, category, level, durationHours, certificationType, isFree, price, availableForAll, tags, nomsRelated, modules, quizzes, status } = req.body;
      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (level !== undefined) updateData.level = level;
      if (durationHours !== undefined) updateData.durationHours = durationHours ? parseInt(durationHours) : null;
      if (certificationType !== undefined) updateData.certificationType = certificationType;
      if (isFree !== undefined) updateData.isFree = isFree;
      if (price !== undefined) updateData.price = price;
      if (availableForAll !== undefined) updateData.availableForAll = availableForAll;
      if (tags !== undefined) updateData.tags = tags;
      if (nomsRelated !== undefined) updateData.nomsRelated = nomsRelated;
      if (modules !== undefined) updateData.modules = modules;
      if (quizzes !== undefined) updateData.quizzes = quizzes;
      if (status !== undefined) {
        updateData.status = status;
        if (status === "review" && !existing.publishedAt) updateData.publishedAt = new Date();
      }

      await db.update(instructorCourses).set(updateData).where(eq(instructorCourses.id, (req.params.id as string)));
      const [updated] = await db.select().from(instructorCourses).where(eq(instructorCourses.id, (req.params.id as string)));
      res.json(updated);
    } catch (err) { next(err); }
  });

  app.delete("/api/instructor/my-courses/:id", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const [existing] = await db.select().from(instructorCourses).where(and(eq(instructorCourses.id, (req.params.id as string)), eq(instructorCourses.instructorId, userId)));
      if (!existing) return res.status(404).json({ message: "Curso no encontrado" });
      await db.delete(instructorCourses).where(eq(instructorCourses.id, (req.params.id as string)));
      res.json({ success: true });
    } catch (err) { next(err); }
  });

  app.get("/api/instructor/courses/:courseId/modules", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const [course] = await db.select().from(courses).where(and(eq(courses.id, (req.params.courseId as string)), eq(courses.instructorId, userId)));
      if (!course) return res.status(404).json({ message: "Curso no encontrado o no autorizado" });

      const modules = await db.select().from(courseModules).where(eq(courseModules.courseId, course.id)).orderBy(courseModules.order);
      res.json({ course, modules });
    } catch (err) { next(err); }
  });

  const audioUploadDir = path.join(process.cwd(), "audio-cache");
  if (!fs.existsSync(audioUploadDir)) fs.mkdirSync(audioUploadDir, { recursive: true });
  const audioUpload = multer({
    storage: multer.diskStorage({
      destination: audioUploadDir,
      filename: (_req: any, file: Express.Multer.File, cb: any) => {
        const ext = path.extname(file.originalname);
        const name = `instructor_${Date.now()}${ext}`;
        cb(null, name);
      },
    }),
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
      const allowed = [".mp3", ".wav", ".m4a", ".ogg", ".webm"];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) cb(null, true);
      else cb(new Error("Solo se permiten archivos de audio (mp3, wav, m4a, ogg, webm)"));
    },
  });

  app.post("/api/instructor/courses/:courseId/modules/:moduleId/audio", requireAuth, requireInstructor, audioUpload.single("audio"), async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const { courseId, moduleId } = req.params as Record<string, string>;

      const [course] = await db.select().from(courses).where(and(eq(courses.id, courseId), eq(courses.instructorId, userId)));
      if (!course) return res.status(403).json({ message: "No autorizado para este curso" });

      const [mod] = await db.select().from(courseModules).where(and(eq(courseModules.id, moduleId), eq(courseModules.courseId, courseId)));
      if (!mod) return res.status(404).json({ message: "Módulo no encontrado" });

      if (!req.file) return res.status(400).json({ message: "No se proporcionó archivo de audio" });

      const newAudioUrl = req.file.filename;

      await db.update(courseModules).set({ audioUrl: newAudioUrl }).where(eq(courseModules.id, moduleId));

      res.json({ success: true, audioUrl: newAudioUrl, message: "Audio reemplazado exitosamente" });
    } catch (err) { next(err); }
  });

  app.delete("/api/instructor/courses/:courseId/modules/:moduleId/audio", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const { courseId, moduleId } = req.params as Record<string, string>;

      const [course] = await db.select().from(courses).where(and(eq(courses.id, courseId), eq(courses.instructorId, userId)));
      if (!course) return res.status(403).json({ message: "No autorizado para este curso" });

      const [mod] = await db.select().from(courseModules).where(and(eq(courseModules.id, moduleId), eq(courseModules.courseId, courseId)));
      if (!mod) return res.status(404).json({ message: "Módulo no encontrado" });

      if (mod.audioUrl) {
        const filePath = path.join(audioUploadDir, mod.audioUrl);
        if (fs.existsSync(filePath) && mod.audioUrl.startsWith("instructor_")) {
          fs.unlinkSync(filePath);
        }
      }

      await db.update(courseModules).set({ audioUrl: null }).where(eq(courseModules.id, moduleId));
      res.json({ success: true, message: "Audio eliminado" });
    } catch (err) { next(err); }
  });

  app.patch("/api/instructor/courses/:courseId/modules/:moduleId/content", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const { courseId, moduleId } = req.params as Record<string, string>;
      const { contentHtml } = req.body;

      const [course] = await db.select().from(courses).where(and(eq(courses.id, courseId), eq(courses.instructorId, userId)));
      if (!course) return res.status(403).json({ message: "No autorizado para este curso" });

      const [mod] = await db.select().from(courseModules).where(and(eq(courseModules.id, moduleId), eq(courseModules.courseId, courseId)));
      if (!mod) return res.status(404).json({ message: "Módulo no encontrado" });

      if (typeof contentHtml !== "string") return res.status(400).json({ message: "Contenido inválido" });
      if (contentHtml.length > 500000) return res.status(400).json({ message: "Contenido demasiado largo" });

      const cleanHtml = sanitizeHtml(contentHtml, {
        allowedTags: ["h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "ul", "ol", "li", "strong", "b", "em", "i", "u", "blockquote", "a", "span", "div", "table", "thead", "tbody", "tr", "th", "td", "hr", "sub", "sup"],
        allowedAttributes: { a: ["href", "target", "rel"], span: ["class"], div: ["class"] },
        allowedSchemes: ["http", "https"],
      });

      await db.update(courseModules).set({ contentHtml: cleanHtml }).where(eq(courseModules.id, moduleId));
      res.json({ success: true, message: "Contenido actualizado" });
    } catch (err) { next(err); }
  });

  app.get("/api/instructor/commissions", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const instructorCoursesData = await db.select().from(courses).where(eq(courses.instructorId, userId));
      const courseIds = instructorCoursesData.map(c => c.id);
      // certificate_requests ancla en studio_course_slug (Task 8), no en course_id legacy;
      // se resuelve el slug del curso legacy para la comparación.
      const courseSlugByIdCommissions = new Map(instructorCoursesData.map(c => [c.id, c.slug]));

      let totalDc3 = 0;
      let totalSep = 0;
      for (const cid of courseIds) {
        const slug = courseSlugByIdCommissions.get(cid)!;
        const [dc3Count] = await db.select({ count: count() }).from(certificateRequests).where(
          and(eq(certificateRequests.studioCourseSlug, slug), eq(certificateRequests.certType, "dc3"), eq(certificateRequests.status, "emitido"))
        );
        const [sepCount] = await db.select({ count: count() }).from(certificateRequests).where(
          and(eq(certificateRequests.studioCourseSlug, slug), eq(certificateRequests.certType, "sep"), eq(certificateRequests.status, "emitido"))
        );
        totalDc3 += dc3Count?.count || 0;
        totalSep += sepCount?.count || 0;
      }

      const [profileRow] = await db.select().from(instructorProfiles).where(eq(instructorProfiles.id, userId));
      const commissionRate = parseFloat(profileRow?.commissionRate || "15") / 100;

      let totalEnrolled = 0;
      for (const cid of courseIds) {
        const [enrolled] = await db.select({ count: count() }).from(courseUsers).where(eq(courseUsers.courseId, cid));
        totalEnrolled += enrolled?.count || 0;
      }

      const DC3_PRICE = 399;
      const SEP_PRICE = 1999;
      const DC3_COMMISSION_PCT = 0.40;
      const SEP_COMMISSION_PCT = 0.10;
      const REFERRAL_PER_COMPANY = 500;

      const dc3Commission = Math.round(totalDc3 * DC3_PRICE * DC3_COMMISSION_PCT);
      const sepCommission = Math.round(totalSep * SEP_PRICE * SEP_COMMISSION_PCT);
      const residualBase = totalEnrolled * 200;
      const residualCommission = Math.round(residualBase * commissionRate);
      const referralCommission = 0;

      res.json({
        commissionRate: parseFloat(profileRow?.commissionRate || "15"),
        totalDc3,
        totalSep,
        dc3Commission,
        dc3CommissionPct: DC3_COMMISSION_PCT * 100,
        dc3Price: DC3_PRICE,
        sepCommission,
        sepCommissionPct: SEP_COMMISSION_PCT * 100,
        sepPrice: SEP_PRICE,
        residualCommission,
        referralCommission,
        totalCommission: dc3Commission + sepCommission + residualCommission + referralCommission,
        totalEnrolled,
        courseBreakdown: instructorCoursesData.map(c => ({
          courseId: c.id,
          title: c.title,
        })),
      });
    } catch (err) { next(err); }
  });

  app.get("/api/instructor/certificates", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const instructorCoursesData = await db.select().from(courses).where(eq(courses.instructorId, userId));
      const courseIds = instructorCoursesData.map(c => c.id);
      // certificate_requests ancla en studio_course_slug (Task 8), no en course_id legacy.
      const courseSlugs = instructorCoursesData.map(c => c.slug);

      if (courseIds.length === 0) return res.json([]);

      const certs = await db.select({
        cert: certificateRequests,
        user: users,
        profile: profiles,
      })
        .from(certificateRequests)
        .innerJoin(users, eq(certificateRequests.userId, users.id))
        .leftJoin(profiles, eq(certificateRequests.userId, profiles.id))
        .where(inArray(certificateRequests.studioCourseSlug, courseSlugs))
        .orderBy(desc(certificateRequests.createdAt));

      const courseMap = new Map(instructorCoursesData.map(c => [c.slug, c.title]));

      res.json(certs.map(r => ({
        id: r.cert.id,
        type: r.cert.certType,
        status: r.cert.status,
        studentName: r.profile?.fullName || r.user.email,
        studentEmail: r.user.email,
        courseTitle: courseMap.get(r.cert.studioCourseSlug) || "Curso desconocido",
        createdAt: r.cert.createdAt,
      })));
    } catch (err) { next(err); }
  });

  app.get("/api/instructor/analytics", requireAuth, requireInstructor, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const instructorCoursesData = await db.select().from(courses).where(eq(courses.instructorId, userId));
      const courseIds = instructorCoursesData.map(c => c.id);

      const courseAnalytics = [];
      for (const course of instructorCoursesData) {
        const [enrolled] = await db.select({ count: count() }).from(courseUsers).where(eq(courseUsers.courseId, course.id));
        const [completed] = await db.select({ count: count() }).from(courseUsers).where(
          and(eq(courseUsers.courseId, course.id), eq(courseUsers.completed, 100))
        );
        const [avgRow] = await db.select({ avg: sql<number>`COALESCE(AVG(${courseUsers.completed}), 0)` })
          .from(courseUsers).where(eq(courseUsers.courseId, course.id));
        const [certCount] = await db.select({ count: count() }).from(certificateRequests).where(
          and(eq(certificateRequests.studioCourseSlug, course.slug), eq(certificateRequests.status, "emitido"))
        );

        courseAnalytics.push({
          courseId: course.id,
          title: course.title,
          slug: course.slug,
          enrolledCount: enrolled?.count || 0,
          completedCount: completed?.count || 0,
          completionRate: enrolled?.count ? Math.round(((completed?.count || 0) / enrolled.count) * 100) : 0,
          avgProgress: Math.round(avgRow?.avg || 0),
          certificates: certCount?.count || 0,
        });
      }

      const totalEnrolled = courseAnalytics.reduce((s, c) => s + c.enrolledCount, 0);
      const totalCompleted = courseAnalytics.reduce((s, c) => s + c.completedCount, 0);
      const totalCerts = courseAnalytics.reduce((s, c) => s + c.certificates, 0);
      const overallCompletionRate = totalEnrolled ? Math.round((totalCompleted / totalEnrolled) * 100) : 0;

      res.json({
        summary: {
          totalCourses: instructorCoursesData.length,
          totalEnrolled,
          totalCompleted,
          totalCertificates: totalCerts,
          overallCompletionRate,
        },
        courses: courseAnalytics,
      });
    } catch (err) { next(err); }
  });

  registerHeygenRoutes(app);

  // ==================== ORG ADMIN / TEAM ROUTES ====================

  app.get("/api/teams/:id/objectives", requireAuth, async (req, res, next) => {
    try {
      const teamId = String((req.params.id as string));
      const userId = req.supabaseUserId!;

      const account = await storage.getAccount(userId);
      if (account?.userRole !== "superadmin") {
        const [membership] = await db.select().from(teamUsers)
          .where(and(eq(teamUsers.teamId, teamId), eq(teamUsers.userId, userId)));
        if (!membership) return res.status(403).json({ message: "No eres miembro de este equipo" });
      }

      const objectives = await db.select({ objective: orgObjectives, course: courses })
        .from(orgObjectives)
        .innerJoin(courses, eq(orgObjectives.courseId, courses.id))
        .where(eq(orgObjectives.teamId, teamId));

      const result = [];
      for (const o of objectives) {
        const assignments = await db.select({ userObj: userObjectives, profile: profiles })
          .from(userObjectives)
          .innerJoin(profiles, eq(userObjectives.userId, profiles.id))
          .where(eq(userObjectives.orgObjectiveId, o.objective.id));

        result.push({
          ...o.objective,
          courseTitle: o.course.title,
          courseSlug: o.course.slug,
          assignments: assignments.map(a => ({
            ...a.userObj,
            fullName: a.profile.fullName,
          })),
        });
      }
      res.json(result);
    } catch (err) { next(err); }
  });

  app.post("/api/teams/:id/objectives/:objId/assign", requireAuth, async (req, res, next) => {
    try {
      const teamId = String((req.params.id as string));
      const objId = String((req.params.objId as string));
      const userId = req.supabaseUserId!;

      const account = await storage.getAccount(userId);
      if (account?.userRole !== "superadmin") {
        const [membership] = await db.select().from(teamUsers)
          .where(and(eq(teamUsers.teamId, teamId), eq(teamUsers.userId, userId)));
        if (!membership || membership.role !== "admin") return res.status(403).json({ message: "Se requiere ser admin del equipo" });
      }

      const [objective] = await db.select().from(orgObjectives)
        .where(and(eq(orgObjectives.id, objId), eq(orgObjectives.teamId, teamId)));
      if (!objective) return res.status(404).json({ message: "Objetivo no encontrado en esta organización" });

      const { userIds } = req.body;
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ message: "userIds requerido (array)" });
      }

      const teamMembers = await db.select().from(teamUsers).where(eq(teamUsers.teamId, teamId));
      const memberIdSet = new Set(teamMembers.map(m => m.userId));

      const created = [];
      for (const uid of userIds) {
        if (!memberIdSet.has(uid)) continue;

        const existing = await db.select().from(userObjectives)
          .where(and(eq(userObjectives.orgObjectiveId, objId), eq(userObjectives.userId, uid)));
        if (existing.length > 0) continue;

        const [obj] = await db.insert(userObjectives).values({
          orgObjectiveId: objId,
          userId: uid,
          assignedBy: userId,
          status: "pending",
        }).returning();
        created.push(obj);
      }
      res.status(201).json({ assigned: created.length, records: created });
    } catch (err) { next(err); }
  });

  app.get("/api/teams/:id/progress", requireAuth, async (req, res, next) => {
    try {
      const teamId = String((req.params.id as string));
      const userId = req.supabaseUserId!;

      const account = await storage.getAccount(userId);
      if (account?.userRole !== "superadmin") {
        const [membership] = await db.select().from(teamUsers)
          .where(and(eq(teamUsers.teamId, teamId), eq(teamUsers.userId, userId)));
        if (!membership) return res.status(403).json({ message: "No eres miembro de este equipo" });
      }

      const members = await db.select({ teamUser: teamUsers, profile: profiles })
        .from(teamUsers)
        .innerJoin(profiles, eq(teamUsers.userId, profiles.id))
        .where(eq(teamUsers.teamId, teamId));

      const result = [];
      for (const m of members) {
        const userCourses = await db.select().from(courseUsers).where(eq(courseUsers.userId, m.teamUser.userId));
        const userObjs = await db.select().from(userObjectives).where(eq(userObjectives.userId, m.teamUser.userId));
        result.push({
          userId: m.teamUser.userId,
          fullName: m.profile.fullName,
          role: m.teamUser.role,
          coursesEnrolled: userCourses.length,
          coursesCompleted: userCourses.filter(c => c.completed === 100).length,
          avgProgress: userCourses.length > 0 ? Math.round(userCourses.reduce((sum, c) => sum + (c.completed || 0), 0) / userCourses.length) : 0,
          objectivesAssigned: userObjs.length,
          objectivesCompleted: userObjs.filter(o => o.status === "completed").length,
        });
      }
      res.json(result);
    } catch (err) { next(err); }
  });

  app.post("/api/teams/:id/invite", requireAuth, async (req, res, next) => {
    try {
      const teamId = String((req.params.id as string));
      const userId = req.supabaseUserId!;

      const account = await storage.getAccount(userId);
      if (account?.userRole !== "superadmin") {
        const [membership] = await db.select().from(teamUsers)
          .where(and(eq(teamUsers.teamId, teamId), eq(teamUsers.userId, userId)));
        if (!membership || membership.role !== "admin") return res.status(403).json({ message: "Se requiere ser admin del equipo" });
      }

      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email requerido" });

      const invitedUser = await storage.getUserByEmail(email);
      if (!invitedUser) return res.status(404).json({ message: "Usuario no encontrado — debe registrarse primero" });

      const existing = await db.select().from(teamUsers)
        .where(and(eq(teamUsers.teamId, teamId), eq(teamUsers.userId, invitedUser.id)));
      if (existing.length > 0) return res.status(409).json({ message: "El usuario ya es miembro del equipo" });

      const [member] = await db.insert(teamUsers).values({
        teamId,
        userId: invitedUser.id,
        role: "member",
      }).returning();
      res.status(201).json(member);
    } catch (err) { next(err); }
  });

  // ==================== USER OBJECTIVES ====================

  app.get("/api/user/objectives", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const objs = await db.select({ userObj: userObjectives, orgObj: orgObjectives, course: courses })
        .from(userObjectives)
        .innerJoin(orgObjectives, eq(userObjectives.orgObjectiveId, orgObjectives.id))
        .innerJoin(courses, eq(orgObjectives.courseId, courses.id))
        .where(eq(userObjectives.userId, userId));

      res.json(objs.map(o => ({
        id: o.userObj.id,
        status: o.userObj.status,
        courseId: o.orgObj.courseId,
        courseTitle: o.course.title,
        courseSlug: o.course.slug,
        assignedAt: o.userObj.createdAt,
        completedAt: o.userObj.completedAt,
      })));
    } catch (err) { next(err); }
  });

  // ==================== REFERRAL CODE LOOKUP ====================

  app.get("/api/referral/:code", async (req, res, next) => {
    try {
      const [ref] = await db.select().from(referralCodes).where(eq(referralCodes.code, String((req.params.code as string))));
      if (!ref || !ref.isActive) return res.status(404).json({ message: "Código no válido" });
      const profile = await storage.getProfile(ref.ownerId);
      const account = await storage.getAccount(ref.ownerId);
      let sponsorName: string | null = null;
      if (ref.ownerType === "partner" || ref.ownerType === "socio_comercial") {
        const partnerProfile = await storage.getProfile(ref.ownerId);
        sponsorName = partnerProfile?.fullName || null;
      }
      const teamUser = await db.select().from(teamUsers).where(eq(teamUsers.userId, ref.ownerId)).limit(1);
      let teamName: string | null = null;
      if (teamUser.length > 0) {
        const team = await db.select().from(teams).where(eq(teams.id, teamUser[0].teamId)).limit(1);
        teamName = team.length > 0 ? team[0].name : null;
      }
      res.json({
        valid: true,
        ownerName: profile?.fullName || "Socio Ceduverse",
        ownerType: ref.ownerType,
        sponsorName: teamName || sponsorName,
      });
    } catch (err) { next(err); }
  });

  app.get("/api/me/referral", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;

      const account = await storage.getAccount(userId);
      if (account?.referralCode) {
        // Antes esto devolvía el folio SIN comprobar que existiera como código
        // activo en referral_codes (la consulta sólo servía para el contador).
        // Como los socios cooperativos reciben folio sin fila en esa tabla, la
        // app entregaba a compartir un código que luego rechazaba al validarlo
        // ("link incorrecto") y no acreditaba el referido. ensureReferralCode
        // crea la fila faltante.
        const ensured = await ensureReferralCode(userId, account.referralCode);
        return res.json({
          code: ensured?.code ?? account.referralCode,
          usageCount: ensured?.usageCount ?? 0,
        });
      }

      const existing = await db.select().from(referralCodes).where(
        and(eq(referralCodes.ownerId, userId), eq(referralCodes.isActive, true))
      ).limit(1);

      if (existing.length > 0) {
        return res.json({ code: existing[0].code, usageCount: existing[0].usageCount });
      }

      const profile = await storage.getProfile(userId);
      const nameSlug = (profile?.fullName || "user")
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 8);
      const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
      const code = `${nameSlug}-${randomSuffix}`;

      const [ref] = await db.insert(referralCodes).values({
        code,
        ownerId: userId,
        ownerType: "user",
        label: "Auto-generado",
        commission: 0,
      }).returning();

      res.json({ code: ref.code, usageCount: 0 });
    } catch (err) { next(err); }
  });
  // ─── Support Chat (Gestor Académico) ───

  app.get("/api/support/threads", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const threads = await storage.getSupportThreadsByUser(userId);
      res.json(threads);
    } catch (err) { next(err); }
  });

  app.post("/api/support/threads", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const { subject, academyCourseId, message } = req.body;
      if (!subject || !message) return res.status(400).json({ message: "Asunto y mensaje son requeridos" });

      const thread = await storage.createSupportThread({
        userId,
        subject,
        academyCourseId: academyCourseId || null,
        status: "open",
      });

      await storage.createSupportMessage({
        threadId: thread.id,
        senderId: userId,
        senderRole: "user",
        content: message,
      });

      res.json(thread);
    } catch (err) { next(err); }
  });

  app.get("/api/support/threads/:threadId", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const { threadId } = req.params as Record<string, string>;
      const thread = await storage.getSupportThread(threadId);
      if (!thread) return res.status(404).json({ message: "Conversación no encontrada" });

      const acct = await storage.getAccount(userId);
      const isStaff = acct && (acct.userRole === "admin" || acct.userRole === "superadmin" || acct.userRole === "moderator");
      if (thread.userId !== userId && !isStaff) return res.status(403).json({ message: "Sin permiso" });

      const messages = await storage.getSupportMessages(threadId);
      res.json({ thread, messages });
    } catch (err) { next(err); }
  });

  app.post("/api/support/threads/:threadId/messages", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const { threadId } = req.params as Record<string, string>;
      const { content } = req.body;
      if (!content) return res.status(400).json({ message: "Mensaje requerido" });

      const thread = await storage.getSupportThread(threadId);
      if (!thread) return res.status(404).json({ message: "Conversación no encontrada" });

      const acct = await storage.getAccount(userId);
      const isStaff = acct && (acct.userRole === "admin" || acct.userRole === "superadmin" || acct.userRole === "moderator");
      if (thread.userId !== userId && !isStaff) return res.status(403).json({ message: "Sin permiso" });

      const msg = await storage.createSupportMessage({
        threadId,
        senderId: userId,
        senderRole: isStaff ? "advisor" : "user",
        content,
      });

      res.json(msg);
    } catch (err) { next(err); }
  });

  app.patch("/api/support/threads/:threadId", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const { threadId } = req.params as Record<string, string>;
      const { status } = req.body;
      if (!status || !["open", "closed"].includes(status)) return res.status(400).json({ message: "Estado inválido, debe ser 'open' o 'closed'" });

      const thread = await storage.getSupportThread(threadId);
      if (!thread) return res.status(404).json({ message: "Conversación no encontrada" });

      const updated = await storage.updateSupportThread(threadId, { status });
      res.json(updated);
    } catch (err) { next(err); }
  });

  registerCrmRoutes(app);
  registerGoogleMeetRoutes(app);

  async function seedContactCards() {
    const seedCards = [
      { slug: "danielzavala", displayName: "Dr. Daniel Zavala Estrada", title: "Socio y Director Jurídico y Fiscal", phone: "+529984919697", email: "danielzavala@ceduverse.org" },
      { slug: "leonardoherrera", displayName: "Leonardo Herrera Gasca", title: "Socio y Director Comercial Norte", phone: "+528111848109", email: "leonardoherrera@ceduverse.org" },
      { slug: "davidperez", displayName: "David Pérez Villaseñor", title: "Socio y Director Operativo", phone: "+529985933232", email: "davidperez@ceduverse.org" },
      { slug: "yuridiaiturriaga", displayName: "Psic. Yuridia Iturriaga", title: "Instructor Acreditado STPS (DC-5)", email: "yuridiaiturriaga@ceduverse.org" },
      { slug: "jorgemedina", displayName: "Lic. Jorge Armando Medina Castillo", title: "Instructor Acreditado STPS (DC-5)", email: "jorgemedina@ceduverse.org" },
    ];
    for (const card of seedCards) {
      const existing = await storage.getContactCardBySlug(card.slug);
      if (!existing) {
        await storage.createContactCard({
          slug: card.slug,
          displayName: card.displayName,
          title: card.title,
          organization: "Ceduverse",
          phone: (card as any).phone || null,
          email: card.email,
          website: "https://ceduverse.org",
          isActive: true,
        });
      }
    }
  }
  seedContactCards().catch(err => console.error("Error seeding contact cards:", err));

  function generateSlug(fullName: string): string {
    return fullName
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 50);
  }

  async function getUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 2;
    while (!(await storage.isSlugAvailable(slug, excludeId))) {
      slug = `${baseSlug}${counter}`;
      counter++;
    }
    return slug;
  }

  function getInitialsFromName(name: string): string {
    return name
      .replace(/^(Dr\.|Ing\.|Lic\.|Mtro\.|Mtra\.|Psic\.)\s*/i, "")
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  async function createOrUpdateContactCard(userId: string, overrides?: Partial<{ title: string; avatarUrl: string }>) {
    const existingCard = await storage.getContactCardByUserId(userId);
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId));
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const [instructorProfile] = await db.select().from(instructorProfiles).where(eq(instructorProfiles.id, userId));

    const fullName = profile?.fullName || user?.email?.split("@")[0] || "Usuario";
    const phone = profile?.phoneNumber || null;
    const email = user?.email || null;
    const avatarUrl = overrides?.avatarUrl || instructorProfile?.profileImageUrl || null;
    const title = overrides?.title || existingCard?.title || "Socio Cooperativo";

    if (existingCard) {
      await storage.updateContactCard(existingCard.id, {
        displayName: fullName,
        title,
        phone,
        email,
        avatarUrl,
        avatarInitials: getInitialsFromName(fullName),
      });
    } else {
      const baseSlug = generateSlug(fullName);
      const slug = await getUniqueSlug(baseSlug);
      await storage.createContactCard({
        userId,
        slug,
        displayName: fullName,
        title,
        organization: "Ceduverse",
        phone,
        email,
        website: "https://ceduverse.org",
        avatarUrl,
        avatarInitials: getInitialsFromName(fullName),
        isActive: true,
      });
    }
  }

  app.get("/api/vcard/:slug", async (req, res, next) => {
    try {
      const card = await storage.getContactCardBySlug((req.params.slug as string));
      if (!card || !card.isActive) return res.status(404).json({ message: "Contacto no encontrado" });

      const nameParts = card.displayName.split(" ");
      const lastName = nameParts.slice(1).join(" ");
      const firstName = nameParts[0];

      const vcf = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${card.displayName}`,
        `N:${lastName};${firstName};;;`,
        `ORG:${card.organization || "Ceduverse"}`,
        `TITLE:${card.title}`,
        card.phone ? `TEL;TYPE=CELL:${card.phone}` : "",
        card.email ? `EMAIL:${card.email}` : "",
        `URL:${card.website || "https://ceduverse.org"}`,
        "END:VCARD",
      ].filter(Boolean).join("\r\n");

      res.setHeader("Content-Type", "text/vcard; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${(req.params.slug as string)}.vcf"`);
      res.send(vcf);
    } catch (err) { next(err); }
  });

  app.get("/api/vcard-data/:slug", async (req, res, next) => {
    try {
      const card = await storage.getContactCardBySlug((req.params.slug as string));
      if (!card || !card.isActive) return res.status(404).json({ message: "Contacto no encontrado" });
      res.json({
        fullName: card.displayName,
        title: card.title,
        phone: card.phone || "",
        email: card.email || "",
        website: card.website || "https://ceduverse.org",
        organization: card.organization || "Ceduverse",
        avatarUrl: card.avatarUrl || null,
        avatarInitials: card.avatarInitials || null,
        avatarColor: card.avatarColor || null,
      });
    } catch (err) { next(err); }
  });

  app.get("/api/me/contact-card", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const card = await storage.getContactCardByUserId(userId);
      res.json(card || null);
    } catch (err) { next(err); }
  });

  app.patch("/api/me/contact-card/slug", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const { slug } = req.body;
      if (!slug || typeof slug !== "string") return res.status(400).json({ message: "Slug requerido" });

      const cleanSlug = slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
      if (!cleanSlug || cleanSlug.length < 3) return res.status(400).json({ message: "El slug debe tener al menos 3 caracteres" });

      const card = await storage.getContactCardByUserId(userId);
      if (!card) return res.status(404).json({ message: "No tienes tarjeta de contacto" });

      const available = await storage.isSlugAvailable(cleanSlug, card.id);
      if (!available) return res.status(409).json({ message: "Este slug ya está en uso" });

      const updated = await storage.updateContactCard(card.id, { slug: cleanSlug });
      res.json(updated);
    } catch (err) { next(err); }
  });

  registerFinancieroRoutes(app);
  app.use("/api/store", storeRoutes);

  registerMembershipRoutes(app);
  registerApiKeyRoutes(app);
  registerEmpresaRoutes(app);

  return httpServer;
}
