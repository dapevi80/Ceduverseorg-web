import type { Express } from "express";
import { requireAuth, requireAdmin, requireSuperadmin } from "../auth";
import { getAdminApiKey } from "../env";
import { ZONA_POR_ESTADO } from "./crm";
import { storage } from "../storage";
import { db } from "../db";
import path from "path";
import fs from "fs";
import {
  users,
  accounts,
  profiles,
  teams,
  teamUsers,
  courseUsers,
  orgObjectives,
  referralCodes,
  courses,
  certificateRequests,
  achievementUsers,
  achievements,
  companyPayments,
  partnerCommissions,
  monthlyContributions,
  contributionAuditLog,
  instructorApplications,
  instructorProfiles,
  instructorCourses,
  courseModules,
  blogPosts,
  newsletterSubscribers,
  insurancePlans,
  insuranceEnrollments,
  insertInsuranceEnrollmentSchema,
  cooperativeMemberships,
  invoices,
  empresasProspectos,
  roleChangeLog,
  termsVersions,
  userTermsAcceptances,
} from "@shared/schema";
import { eq, and, sql, count, desc, asc, gte, lte, inArray, ilike, type SQL } from "drizzle-orm";
import * as facturapi from "../services/facturapi";
import { sendSamConfirmationEmail, sendSamReminderEmail, sendSamPartnerNotificationEmail } from "../email";
import { z } from "zod";
import crypto from "crypto";
import sanitizeHtml from "sanitize-html";
import { getBankInfo } from "../env";
import rateLimit from "express-rate-limit";
import { createOrUpdateContactCard } from "./helpers";

// Rate limiter for resource-intensive admin endpoints (5 requests per 15 minutes)
const adminRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Demasiadas solicitudes. Intenta de nuevo en 15 minutos." },
});

export const UMA_VALUE_2026 = "113.14";

export function determinePlan(cols: number) {
  if (cols <= 10) return { plan: "impulsa", umas: 6, feePercent: 15 };
  if (cols <= 99) return { plan: "transforma", umas: 10, feePercent: 8 };
  return { plan: "lidera", umas: 20, feePercent: 5 };
}

export function registerAdminRoutes(app: Express) {
  // ==================== ADMIN OVERVIEW ====================

  app.get("/api/admin/overview", requireAuth, requireAdmin, async (_req, res, next) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [userCount] = await db.select({ count: count() }).from(users);
      const [teamCount] = await db.select({ count: count() }).from(teams).where(eq(teams.status, "active"));
      const [partnerCount] = await db.select({ count: count() }).from(accounts).where(inArray(accounts.userRole, ["socio_comercial", "partner", "director"]));
      const [instructorCount] = await db.select({ count: count() }).from(accounts).where(inArray(accounts.userRole, ["socio_instructor", "instructor"]));
      const [courseCompletions] = await db.select({ count: count() }).from(courseUsers).where(eq(courseUsers.completed, 100));
      const [orgObjCount] = await db.select({ count: count() }).from(orgObjectives);
      const [completionsThisMonth] = await db.select({ count: count() }).from(courseUsers)
        .where(and(eq(courseUsers.completed, 100), gte(courseUsers.updatedAt, startOfMonth)));
      const [certsTotal] = await db.select({ count: count() }).from(certificateRequests)
        .where(sql`${certificateRequests.status} = 'emitido'`);

      const [revRow] = await db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
        .from(companyPayments)
        .where(and(
          eq(companyPayments.status, "confirmed"),
          sql`${companyPayments.periodMonth} = ${now.getMonth() + 1}`,
          sql`${companyPayments.periodYear} = ${now.getFullYear()}`
        ));
      const monthlyRevenue = Number(revRow?.total || 0);

      const allThreads = await storage.getAllSupportThreads();
      let unansweredSupportThreads = 0;
      for (const thread of allThreads) {
        if (thread.status !== "open") continue;
        const msgs = await storage.getSupportMessages(thread.id);
        const lastMsg = msgs[msgs.length - 1];
        const staffRoles = ["admin", "advisor", "superadmin"];
        if (!lastMsg || !staffRoles.includes(lastMsg.senderRole)) unansweredSupportThreads++;
      }

      const [odRow] = await db.select({ count: count() })
        .from(companyPayments).where(eq(companyPayments.status, "overdue"));
      const overduePayments = Number(odRow?.count || 0);

      const recentUsersRows = await db.select({ id: users.id, email: users.email, createdAt: users.createdAt, fullName: profiles.fullName })
        .from(users).leftJoin(profiles, eq(users.id, profiles.id)).orderBy(desc(users.createdAt)).limit(8);

      const userGrowth: { week: string; count: number }[] = [];
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const [wk] = await db.select({ count: count() }).from(users)
          .where(and(gte(users.createdAt, weekStart), sql`${users.createdAt} < ${weekEnd}`));
        userGrowth.push({
          week: weekStart.toLocaleDateString("es-MX", { day: "numeric", month: "short" }),
          count: Number(wk?.count || 0),
        });
      }

      const revenueByMonth: { month: string; amount: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const [rev] = await db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
          .from(companyPayments)
          .where(and(
            eq(companyPayments.status, "confirmed"),
            sql`${companyPayments.periodMonth} = ${m.getMonth() + 1}`,
            sql`${companyPayments.periodYear} = ${m.getFullYear()}`
          ));
        revenueByMonth.push({
          month: m.toLocaleDateString("es-MX", { month: "short", year: "2-digit" }),
          amount: Number(rev?.total || 0),
        });
      }

      const recentCerts = await db.select({ id: certificateRequests.id, status: certificateRequests.status, createdAt: certificateRequests.createdAt })
        .from(certificateRequests).orderBy(desc(certificateRequests.createdAt)).limit(10);
      const recentPayments = await db.select({ id: companyPayments.id, amount: companyPayments.amount, status: companyPayments.status, createdAt: companyPayments.createdAt })
        .from(companyPayments).orderBy(desc(companyPayments.createdAt)).limit(10);

      const [pendingInstructorApps] = await db.select({ count: count() })
        .from(instructorApplications)
        .where(eq(instructorApplications.status, "pending_review"));

      const recentActivity: { type: string; description: string; time: string; _ts: number }[] = [];
      for (const c of recentCerts) {
        const statusLabel = c.status === "solicitado" ? "Solicitud" : c.status === "emitido" ? "Emitido" : c.status === "en_proceso" ? "En proceso" : c.status;
        recentActivity.push({ type: "cert", description: `Certificado: ${statusLabel}`,
          time: new Date(c.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }), _ts: new Date(c.createdAt).getTime() });
      }
      for (const p of recentPayments) {
        recentActivity.push({ type: "payment", description: `Pago: $${Number(p.amount).toLocaleString("es-MX")} (${p.status === "confirmed" ? "Confirmado" : p.status === "pending" ? "Pendiente" : p.status})`,
          time: new Date(p.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }), _ts: new Date(p.createdAt).getTime() });
      }
      recentActivity.sort((a, b) => b._ts - a._ts);

      res.json({
        totalUsers: userCount.count, totalOrgs: teamCount.count, totalPartners: partnerCount.count,
        totalInstructors: instructorCount.count,
        coursesCompleted: courseCompletions.count, completionsThisMonth: completionsThisMonth?.count || 0,
        totalObjectives: orgObjCount.count, certsEmitted: certsTotal?.count || 0, monthlyRevenue,
        unansweredSupportThreads, overduePayments, pendingInstructorApps: pendingInstructorApps?.count || 0,
        recentUsers: recentUsersRows,
        recentActivity: recentActivity.slice(0, 20), userGrowth, revenueByMonth,
      });
    } catch (err) { next(err); }
  });

  // ==================== SUPERADMIN ROUTES ====================

  app.get("/api/admin/stats", requireAuth, requireAdmin, async (_req, res, next) => {
    try {
      const [userCount] = await db.select({ count: count() }).from(users);
      const [teamCount] = await db.select({ count: count() }).from(teams);
      const [partnerCount] = await db.select({ count: count() }).from(accounts).where(inArray(accounts.userRole, ["socio_comercial", "partner", "director"]));
      const [courseCompletions] = await db.select({ count: count() }).from(courseUsers).where(eq(courseUsers.completed, 100));
      const [orgObjCount] = await db.select({ count: count() }).from(orgObjectives);
      res.json({
        totalUsers: userCount.count,
        totalOrgs: teamCount.count,
        totalPartners: partnerCount.count,
        coursesCompleted: courseCompletions.count,
        totalObjectives: orgObjCount.count,
      });
    } catch (err) { next(err); }
  });

  app.get("/api/admin/orgs", requireAuth, requireAdmin, async (_req, res, next) => {
    try {
      const allTeams = await db.select().from(teams);
      const result = [];
      for (const team of allTeams) {
        const members = await db.select({ count: count() }).from(teamUsers).where(eq(teamUsers.teamId, team.id));
        let partnerName = null;
        if (team.partnerId) {
          const p = await storage.getProfile(team.partnerId);
          partnerName = p?.fullName || null;
        }
        const objectives = await db.select().from(orgObjectives).where(eq(orgObjectives.teamId, team.id));
        result.push({
          ...team,
          memberCount: members[0].count,
          partnerName,
          objectiveCount: objectives.length,
        });
      }
      res.json(result);
    } catch (err) { next(err); }
  });

  app.get("/api/admin/orgs/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const team = await storage.getTeam(String((req.params.id as string)));
      if (!team) return res.status(404).json({ message: "Organización no encontrada" });

      const members = await db.select({ teamUser: teamUsers, profile: profiles, account: accounts })
        .from(teamUsers)
        .innerJoin(profiles, eq(teamUsers.userId, profiles.id))
        .innerJoin(accounts, eq(teamUsers.userId, accounts.id))
        .where(eq(teamUsers.teamId, team.id));

      const memberData = [];
      for (const m of members) {
        const userCourses = await db.select().from(courseUsers).where(eq(courseUsers.userId, m.teamUser.userId));
        memberData.push({
          userId: m.teamUser.userId,
          fullName: m.profile.fullName,
          role: m.teamUser.role,
          coursesEnrolled: userCourses.length,
          coursesCompleted: userCourses.filter(c => c.completed === 100).length,
          avgProgress: userCourses.length > 0 ? Math.round(userCourses.reduce((sum, c) => sum + (c.completed || 0), 0) / userCourses.length) : 0,
        });
      }

      const objectives = await db.select({ objective: orgObjectives, course: courses })
        .from(orgObjectives)
        .innerJoin(courses, eq(orgObjectives.courseId, courses.id))
        .where(eq(orgObjectives.teamId, team.id));

      let partnerName = null;
      if (team.partnerId) {
        const p = await storage.getProfile(team.partnerId);
        partnerName = p?.fullName || null;
      }

      const memberIds = members.map(m => m.teamUser.userId);

      const contributions = memberIds.length > 0
        ? await db.select().from(monthlyContributions).where(eq(monthlyContributions.teamId, team.id)).orderBy(desc(monthlyContributions.generatedAt)).limit(12)
        : [];

      const certificates = memberIds.length > 0
        ? await db.select().from(certificateRequests).where(
            sql`${certificateRequests.userId} = ANY(${memberIds})`
          ).orderBy(desc(certificateRequests.createdAt)).limit(20)
        : [];

      res.json({
        ...team,
        partnerName,
        members: memberData,
        objectives: objectives.map(o => ({ ...o.objective, courseTitle: o.course.title, courseSlug: o.course.slug })),
        contributions: contributions.map(c => ({
          id: c.id,
          month: c.periodMonth,
          year: c.periodYear,
          totalAmount: Number(c.grossAmount),
          cfdiStatus: c.cfdiStatus,
          generatedAt: c.generatedAt,
        })),
        certificateCount: certificates.length,
      });
    } catch (err) { next(err); }
  });

  app.patch("/api/admin/orgs/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const teamId = String((req.params.id as string));
      const team = await storage.getTeam(teamId);
      if (!team) return res.status(404).json({ message: "Organización no encontrada" });
      const { rfc, feePercent, contractUrl, plan, status } = req.body;
      const updateFields: Record<string, unknown> = { updatedAt: new Date() };
      if (rfc !== undefined) updateFields.rfc = rfc;
      if (feePercent !== undefined) updateFields.feePercent = String(feePercent);
      if (contractUrl !== undefined) updateFields.contractUrl = contractUrl;
      if (plan !== undefined) updateFields.plan = plan;
      if (status !== undefined) updateFields.status = status;
      await db.update(teams).set(updateFields).where(eq(teams.id, teamId));
      const updated = await storage.getTeam(teamId);
      res.json(updated);
    } catch (err) { next(err); }
  });

  app.post("/api/admin/orgs/:id/objectives", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const teamId = String((req.params.id as string));
      const team = await storage.getTeam(teamId);
      if (!team) return res.status(404).json({ message: "Organización no encontrada" });

      const { courseId } = req.body;
      if (!courseId) return res.status(400).json({ message: "courseId requerido" });

      const course = await storage.getCourse(courseId);
      if (!course) return res.status(404).json({ message: "Curso no encontrado" });

      const existing = await db.select().from(orgObjectives)
        .where(and(eq(orgObjectives.teamId, teamId), eq(orgObjectives.courseId, courseId)));
      if (existing.length > 0) return res.status(409).json({ message: "Este objetivo ya está asignado a la organización" });

      const [obj] = await db.insert(orgObjectives).values({
        teamId,
        courseId,
        assignedBy: req.supabaseUserId!,
        status: "active",
      }).returning();

      res.status(201).json(obj);
    } catch (err) { next(err); }
  });

  app.delete("/api/admin/orgs/:id/objectives/:objId", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const result = await db.delete(orgObjectives)
        .where(and(eq(orgObjectives.id, String((req.params.objId as string))), eq(orgObjectives.teamId, String((req.params.id as string)))))
        .returning();
      if (result.length === 0) return res.status(404).json({ message: "Objetivo no encontrado" });
      res.json({ message: "Objetivo eliminado" });
    } catch (err) { next(err); }
  });

  app.get("/api/admin/partners", requireAuth, requireAdmin, async (_req, res, next) => {
    try {
      const partnersRaw = await db.select()
        .from(accounts)
        .innerJoin(users, eq(accounts.id, users.id))
        .innerJoin(profiles, eq(accounts.id, profiles.id))
        .where(inArray(accounts.userRole, ["socio_comercial", "partner", "director"]));
      const partners = partnersRaw.map(r => ({ user: r.users, account: r.accounts, profile: r.profiles }));

      const result = [];
      for (const p of partners) {
        const codes = await db.select().from(referralCodes).where(eq(referralCodes.ownerId, p.user.id));
        const referredOrgs = await db.select({ count: count() }).from(teams).where(eq(teams.partnerId, p.user.id));
        result.push({
          userId: p.user.id,
          email: p.user.email,
          fullName: p.profile.fullName,
          referralCodes: codes.length,
          totalUsage: codes.reduce((sum, c) => sum + c.usageCount, 0),
          referredOrgs: referredOrgs[0].count,
        });
      }
      res.json(result);
    } catch (err) { next(err); }
  });

  app.post("/api/admin/partners", requireAuth, requireSuperadmin, async (req, res, next) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email requerido" });

      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

      await storage.updateAccount(user.id, { userRole: "socio_comercial" });
      const account = await storage.getAccount(user.id);
      res.json({ message: "Usuario promovido a socio comercial", account });
    } catch (err) { next(err); }
  });

  app.patch("/api/admin/users/:id/role", requireAuth, requireSuperadmin, async (req, res, next) => {
    try {
      const { role, reason } = req.body;
      if (!reason || typeof reason !== "string" || reason.trim().length < 3) {
        return res.status(400).json({ message: "Se requiere una razón para el cambio de rol (mínimo 3 caracteres)" });
      }
      const ROLE_MAP: Record<string, string> = { user: "socio_estudiante", partner: "socio_comercial", instructor: "socio_instructor", moderator: "socio_estudiante" };
      const mappedRole = ROLE_MAP[role] || role;
      const validRoles = ["socio_estudiante", "socio_instructor", "socio_comercial", "director", "empresa", "empresa_rh", "admin", "superadmin"];
      if (!mappedRole || !validRoles.includes(mappedRole)) {
        return res.status(400).json({ message: "Rol inválido" });
      }
      const targetUserId = String((req.params.id as string));
      const user = await storage.getUser(targetUserId);
      if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

      const previousAccount = await storage.getAccount(targetUserId);
      const previousRole = previousAccount?.userRole || "socio_estudiante";

      await storage.updateAccount(targetUserId, { userRole: mappedRole });

      const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "";
      await db.insert(roleChangeLog).values({
        userId: targetUserId,
        changedBy: req.supabaseUserId!,
        previousRole,
        newRole: mappedRole,
        reason: req.body.reason,
        ipAddress: ip,
      });

      res.json({ message: "Rol actualizado", userId: targetUserId, newRole: mappedRole });
    } catch (err) { next(err); }
  });

  // Convierte un estudiante en socio comercial en UN solo paso atómico y auditado:
  // 1) rol -> socio_comercial, 2) asegura su código personal de cuenta,
  // 3) crea su código comercial (referralCodes) con comisión del tier "agente"
  //    (15% por defecto, ajustable) para referir EMPRESAS, 4) registra en roleChangeLog.
  // Nota de negocio: la comisión y el bono de $500 por referido se pagan sobre la
  // primera aportación de la EMPRESA referida; no hay bono por referir estudiantes.
  app.post("/api/admin/users/:id/convert-partner", requireAuth, requireSuperadmin, async (req, res, next) => {
    try {
      const targetUserId = String(req.params.id as string);
      const reason = req.body?.reason;
      if (!reason || typeof reason !== "string" || reason.trim().length < 3) {
        return res.status(400).json({ message: "Se requiere una razón para la conversión (mínimo 3 caracteres)" });
      }
      // Comisión por defecto 15% = tier "agente", el más bajo de socio comercial.
      let commission = 15;
      if (req.body?.commission !== undefined && req.body?.commission !== null) {
        const n = Number(req.body.commission);
        if (!Number.isInteger(n) || n < 0 || n > 100) {
          return res.status(400).json({ message: "La comisión debe ser un entero entre 0 y 100" });
        }
        commission = n;
      }

      const user = await storage.getUser(targetUserId);
      if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

      const account = await storage.getAccount(targetUserId);
      const previousRole = account?.userRole || "socio_estudiante";
      // Evita degradar por accidente a un rol administrativo/superior desde esta acción.
      if (["director", "admin", "superadmin"].includes(previousRole)) {
        return res.status(400).json({ message: `No se puede convertir a socio comercial desde el rol "${previousRole}". Usa el cambio de rol general.` });
      }

      // 1) Rol -> socio_comercial (+ código personal de cuenta si no tiene).
      const accountUpdates: Record<string, unknown> = { userRole: "socio_comercial" };
      if (!account?.referralCode) {
        accountUpdates.referralCode = `SC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      }
      await storage.updateAccount(targetUserId, accountUpdates);

      // 2) Código comercial para referir empresas — solo si no tiene uno activo.
      const existingCodes = await db.select().from(referralCodes)
        .where(and(eq(referralCodes.ownerId, targetUserId), eq(referralCodes.isActive, true)));
      let commercialCode = existingCodes[0] || null;
      if (!commercialCode) {
        const code = `P-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const [created] = await db.insert(referralCodes).values({
          code,
          ownerId: targetUserId,
          ownerType: "socio_comercial",
          label: "Socio Agente",
          commission,
          isActive: true,
        }).returning();
        commercialCode = created;
      }

      // 3) Auditoría del cambio de rol.
      const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "";
      await db.insert(roleChangeLog).values({
        userId: targetUserId,
        changedBy: req.supabaseUserId!,
        previousRole,
        newRole: "socio_comercial",
        reason: reason.trim(),
        ipAddress: ip,
      });

      res.json({
        message: "Usuario convertido a socio comercial",
        userId: targetUserId,
        newRole: "socio_comercial",
        commission,
        referralCode: commercialCode?.code,
        commercialCodeCreated: existingCodes.length === 0,
      });
    } catch (err) { next(err); }
  });

  app.get("/api/admin/users", requireAuth, requireAdmin, async (_req, res, next) => {
    try {
      const allUsersRaw = await db.select()
        .from(users)
        .leftJoin(accounts, eq(users.id, accounts.id))
        .leftJoin(profiles, eq(users.id, profiles.id));
      const allUsers = allUsersRaw.map(r => ({ user: r.users, account: r.accounts, profile: r.profiles }));

      const allTeamUsers = await db.select({ userId: teamUsers.userId, teamName: teams.name })
        .from(teamUsers)
        .innerJoin(teams, eq(teamUsers.teamId, teams.id));

      const userTeamMap = new Map<string, string>();
      for (const tu of allTeamUsers) {
        if (!userTeamMap.has(tu.userId)) userTeamMap.set(tu.userId, tu.teamName);
      }

      const lastAccessRows = await db.select({
        userId: courseUsers.userId,
        lastAccess: sql<string>`MAX(${courseUsers.updatedAt})`,
      }).from(courseUsers).groupBy(courseUsers.userId);

      const lastAccessMap = new Map<string, string>();
      for (const row of lastAccessRows) {
        if (row.lastAccess) lastAccessMap.set(row.userId, row.lastAccess);
      }

      res.json(allUsers.map(u => ({
        id: u.user.id,
        email: u.user.email,
        fullName: u.profile?.fullName || null,
        role: u.account?.userRole || "socio_estudiante",
        accountType: u.account?.accountType || null,
        accountSetup: u.account?.accountSetup || 0,
        country: u.profile?.country || null,
        city: u.profile?.city || null,
        phoneNumber: u.profile?.phoneNumber || null,
        walletAddress: u.profile?.walletAddress || null,
        interest: u.profile?.interest || [],
        genre: u.profile?.genre || null,
        createdAt: u.user.createdAt,
        teamName: userTeamMap.get(u.user.id) || null,
        lastAccessAt: lastAccessMap.get(u.user.id) || null,
      })));
    } catch (err) { next(err); }
  });

  app.get("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const userId = String((req.params.id as string));
      const [row] = await db.select()
        .from(users)
        .leftJoin(accounts, eq(users.id, accounts.id))
        .leftJoin(profiles, eq(users.id, profiles.id))
        .where(eq(users.id, userId));

      if (!row) return res.status(404).json({ message: "Usuario no encontrado" });

      const userData = { user: row.users, account: row.accounts, profile: row.profiles };

      const userEnrollments = await db.select()
        .from(courseUsers)
        .where(eq(courseUsers.userId, userId));

      const userAchievements = await db.select()
        .from(achievementUsers)
        .where(eq(achievementUsers.userId, userId));

      const userTeamsList = await db.select({ team: teams, membership: teamUsers })
        .from(teamUsers)
        .leftJoin(teams, eq(teamUsers.teamId, teams.id))
        .where(eq(teamUsers.userId, userId));

      const roleHistory = await db.select()
        .from(roleChangeLog)
        .where(eq(roleChangeLog.userId, userId))
        .orderBy(desc(roleChangeLog.createdAt))
        .limit(10);

      const userCerts = await db.select({
        id: certificateRequests.id,
        certType: certificateRequests.certType,
        status: certificateRequests.status,
        createdAt: certificateRequests.createdAt,
      }).from(certificateRequests)
        .where(eq(certificateRequests.userId, userId))
        .orderBy(desc(certificateRequests.createdAt))
        .limit(10);

      const enrolledCourses = await db.select({
        courseId: courseUsers.courseId,
        courseSlug: courseUsers.courseSlug,
        completed: courseUsers.completed,
        enrolledAt: courseUsers.createdAt,
        courseTitle: courses.title,
      }).from(courseUsers)
        .leftJoin(courses, eq(courseUsers.courseId, courses.id))
        .where(eq(courseUsers.userId, userId))
        .orderBy(desc(courseUsers.createdAt))
        .limit(20);

      const instructorCourses = await db.select({
        id: courses.id,
        slug: courses.slug,
        title: courses.title,
      }).from(courses)
        .where(eq(courses.instructorId, userId))
        .limit(20);

      const termsHistory = await db.select({
        id: userTermsAcceptances.id,
        acceptedAt: userTermsAcceptances.acceptedAt,
        versionTitle: termsVersions.title,
        versionType: termsVersions.docType,
      }).from(userTermsAcceptances)
        .leftJoin(termsVersions, eq(userTermsAcceptances.termsVersionId, termsVersions.id))
        .where(eq(userTermsAcceptances.userId, userId))
        .orderBy(desc(userTermsAcceptances.acceptedAt))
        .limit(10);

      const isCoopMember = (userData.account as any)?.isCooperativeMember ?? false;

      res.json({
        id: userData.user.id,
        email: userData.user.email,
        fullName: userData.profile?.fullName || null,
        role: userData.account?.userRole || "socio_estudiante",
        accountType: userData.account?.accountType || null,
        accountSetup: userData.account?.accountSetup || 0,
        country: userData.profile?.country || null,
        city: userData.profile?.city || null,
        phoneNumber: userData.profile?.phoneNumber || null,
        walletAddress: userData.profile?.walletAddress || null,
        interest: userData.profile?.interest || [],
        genre: userData.profile?.genre || null,
        referralCode: userData.account?.referralCode || null,
        referredBy: userData.account?.referredBy || null,
        isCooperativeMember: isCoopMember,
        createdAt: userData.user.createdAt,
        enrollments: userEnrollments.length,
        completedCourses: userEnrollments.filter(e => e.completed >= 100).length,
        achievements: userAchievements.length,
        teams: userTeamsList.map(t => ({
          id: t.team?.id,
          name: t.team?.name,
          role: t.membership.role,
        })),
        roleHistory: roleHistory.map(r => ({
          previousRole: r.previousRole,
          newRole: r.newRole,
          reason: r.reason,
          changedAt: r.createdAt,
        })),
        certificates: userCerts,
        enrolledCourses,
        instructorCourses,
        termsHistory,
      });
    } catch (err) { next(err); }
  });

  app.patch("/api/admin/users/:id/account-type", requireAuth, requireSuperadmin, async (req, res, next) => {
    try {
      const { accountType } = req.body;
      const validTypes = ["free", "premium", "admin"];
      if (!accountType || !validTypes.includes(accountType)) {
        return res.status(400).json({ message: "Tipo de cuenta inválido" });
      }
      const user = await storage.getUser(String((req.params.id as string)));
      if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

      await storage.updateAccount(String((req.params.id as string)), { accountType });
      res.json({ message: "Tipo de cuenta actualizado", userId: String((req.params.id as string)), newAccountType: accountType });
    } catch (err) { next(err); }
  });

  app.patch("/api/admin/users/:id/profile", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const userId = String((req.params.id as string));
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

      const { fullName, country, city, phoneNumber } = req.body;
      const updateData: Record<string, any> = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (country !== undefined) updateData.country = country;
      if (city !== undefined) updateData.city = city;
      if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

      await storage.updateProfile(userId, updateData);
      res.json({ message: "Perfil actualizado" });
    } catch (err) { next(err); }
  });
  app.get("/api/admin/support/threads", requireAuth, requireAdmin, async (_req, res, next) => {
    try {
      const threads = await storage.getAllSupportThreads();
      res.json(threads);
    } catch (err) { next(err); }
  });

  // ==================== MONTHLY CONTRIBUTIONS (SAM) ====================

  app.post("/api/admin/contributions/generate", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const user = await storage.getUser(userId);
      const now = new Date();
      const year = req.body.year || now.getFullYear();
      const month = req.body.month || (now.getMonth() + 1);

      const activeTeams = await db.select().from(teams).where(eq(teams.status, "active"));
      let generated = 0;
      const errors: string[] = [];

      for (const team of activeTeams) {
        const existing = await db.select().from(monthlyContributions)
          .where(and(
            eq(monthlyContributions.teamId, team.id),
            eq(monthlyContributions.periodYear, year),
            eq(monthlyContributions.periodMonth, month),
          ));
        if (existing.length > 0) continue;

        const memberCount = await db.select({ cnt: count() }).from(teamUsers)
          .where(eq(teamUsers.teamId, team.id));
        const cols = memberCount[0]?.cnt || 0;
        if (cols === 0) continue;

        const { plan, umas, feePercent } = determinePlan(cols);
        const umaVal = parseFloat(UMA_VALUE_2026);
        const gross = cols * umas * umaVal;
        const fee = gross * (feePercent / 100);
        const net = gross - fee;
        const dueDate = new Date(year, month - 1, 15);

        try {
          const [created] = await db.insert(monthlyContributions).values({
            teamId: team.id,
            periodYear: year,
            periodMonth: month,
            planType: plan,
            umasPerCol: umas,
            umaValue: UMA_VALUE_2026,
            activeCollaborators: cols,
            grossAmount: gross.toFixed(2),
            feePercentage: feePercent.toFixed(2),
            feeAmount: fee.toFixed(2),
            netToCooperative: net.toFixed(2),
            status: "pending",
            paymentStatus: "unpaid",
            cfdiStatus: "pending",
            dueDate,
          }).returning();

          await db.insert(contributionAuditLog).values({
            contributionId: created.id,
            action: "generated",
            actorEmail: user?.email || "system",
            metadata: { plan, cols, gross: gross.toFixed(2) },
          });

          generated++;
        } catch (err: any) {
          errors.push(`${team.name}: ${err.message}`);
        }
      }

      res.json({ generated, total: activeTeams.length, errors });
    } catch (err) { next(err); }
  });

  app.get("/api/admin/contributions", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);

      const sams = await db.select({
        contribution: monthlyContributions,
        teamName: teams.name,
      })
        .from(monthlyContributions)
        .leftJoin(teams, eq(monthlyContributions.teamId, teams.id))
        .where(and(
          eq(monthlyContributions.periodYear, year),
          eq(monthlyContributions.periodMonth, month),
        ))
        .orderBy(desc(monthlyContributions.generatedAt));

      res.json(sams.map(s => ({ ...s.contribution, teamName: s.teamName })));
    } catch (err) { next(err); }
  });

  app.get("/api/admin/contributions/pending", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const sams = await db.select({
        contribution: monthlyContributions,
        teamName: teams.name,
      })
        .from(monthlyContributions)
        .leftJoin(teams, eq(monthlyContributions.teamId, teams.id))
        .where(eq(monthlyContributions.status, "pending"))
        .orderBy(asc(monthlyContributions.dueDate));

      res.json(sams.map(s => ({ ...s.contribution, teamName: s.teamName })));
    } catch (err) { next(err); }
  });

  app.get("/api/admin/contributions/overdue", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const sams = await db.select({
        contribution: monthlyContributions,
        teamName: teams.name,
      })
        .from(monthlyContributions)
        .leftJoin(teams, eq(monthlyContributions.teamId, teams.id))
        .where(eq(monthlyContributions.paymentStatus, "overdue"))
        .orderBy(asc(monthlyContributions.dueDate));

      res.json(sams.map(s => ({ ...s.contribution, teamName: s.teamName })));
    } catch (err) { next(err); }
  });

  app.get(["/api/teams/:teamId/contributions", "/api/companies/:teamId/contributions"], requireAuth, async (req, res, next) => {
    try {
      const { teamId } = req.params as Record<string, string>;
      const userId = req.supabaseUserId!;

      const membership = await db.select().from(teamUsers)
        .where(and(eq(teamUsers.teamId, teamId), eq(teamUsers.userId, userId)));
      const acct = await storage.getAccount(userId);
      const isAdminUser = acct && ["admin", "superadmin"].includes(acct.userRole);
      if (membership.length === 0 && !isAdminUser) {
        return res.status(403).json({ message: "Sin acceso a esta organización" });
      }

      const sams = await db.select().from(monthlyContributions)
        .where(eq(monthlyContributions.teamId, teamId))
        .orderBy(desc(monthlyContributions.periodYear), desc(monthlyContributions.periodMonth));

      checkSamAlertsForTeam(teamId).catch(() => {});

      res.json(sams);
    } catch (err) { next(err); }
  });

  app.get(["/api/teams/:teamId/contributions/current", "/api/companies/:teamId/contributions/current"], requireAuth, async (req, res, next) => {
    try {
      const { teamId } = req.params as Record<string, string>;
      const userId = req.supabaseUserId!;

      const membership = await db.select().from(teamUsers)
        .where(and(eq(teamUsers.teamId, teamId), eq(teamUsers.userId, userId)));
      const acct = await storage.getAccount(userId);
      const isAdminUser = acct && ["admin", "superadmin"].includes(acct.userRole);
      if (membership.length === 0 && !isAdminUser) {
        return res.status(403).json({ message: "Sin acceso" });
      }

      const now = new Date();
      const [current] = await db.select().from(monthlyContributions)
        .where(and(
          eq(monthlyContributions.teamId, teamId),
          eq(monthlyContributions.periodYear, now.getFullYear()),
          eq(monthlyContributions.periodMonth, now.getMonth() + 1),
        ));

      if (!current) return res.json(null);
      res.json(current);
    } catch (err) { next(err); }
  });

  app.post(["/api/teams/:teamId/contributions/:cid/confirm", "/api/companies/:teamId/contributions/:cid/confirm"], requireAuth, async (req, res, next) => {
    try {
      const { teamId, cid } = req.params as Record<string, string>;
      const userId = req.supabaseUserId!;
      const user = await storage.getUser(userId);

      const membership = await db.select().from(teamUsers)
        .where(and(eq(teamUsers.teamId, teamId), eq(teamUsers.userId, userId)));
      const isOrgAdmin = membership.some(m => m.role === "admin");
      const acct = await storage.getAccount(userId);
      const isSysAdmin = acct && ["admin", "superadmin"].includes(acct.userRole);
      if (!isOrgAdmin && !isSysAdmin) {
        return res.status(403).json({ message: "Solo el administrador puede confirmar" });
      }

      const [contribution] = await db.select().from(monthlyContributions)
        .where(and(
          eq(monthlyContributions.id, cid),
          eq(monthlyContributions.teamId, teamId),
        ));

      if (!contribution || (contribution.status !== "pending" && contribution.status !== "adjusted")) {
        return res.status(400).json({ message: "No se puede confirmar esta solicitud" });
      }

      const crypto = await import("crypto");
      const confirmDoc = JSON.stringify({
        contributionId: cid,
        companyId: teamId,
        period: `${contribution.periodYear}-${contribution.periodMonth}`,
        plan: contribution.planType,
        collaborators: contribution.adjustedCollaborators || contribution.activeCollaborators,
        amount: contribution.adjustedAmount || contribution.grossAmount,
        confirmedAt: new Date().toISOString(),
        confirmedBy: user?.email,
      });
      const hash = crypto.createHash("sha256").update(confirmDoc).digest("hex");

      const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
      const ua = req.headers["user-agent"] || "unknown";

      await db.update(monthlyContributions)
        .set({
          status: "confirmed",
          confirmedAt: new Date(),
          confirmedBy: userId,
          confirmationIp: clientIp,
          confirmationUserAgent: ua,
          confirmationHash: hash,
        })
        .where(eq(monthlyContributions.id, cid));

      await db.insert(contributionAuditLog).values({
        contributionId: cid,
        action: "confirmed",
        actorEmail: user?.email || "unknown",
        actorIp: clientIp,
        actorUserAgent: ua,
        documentHash: hash,
        metadata: {
          amount: contribution.adjustedAmount || contribution.grossAmount,
          collaborators: contribution.adjustedCollaborators || contribution.activeCollaborators,
        },
      });

      const confirmEmailData = {
        periodYear: contribution.periodYear,
        periodMonth: contribution.periodMonth || 1,
        planType: contribution.planType,
        collaborators: contribution.adjustedCollaborators || contribution.activeCollaborators,
        grossAmount: contribution.adjustedAmount || contribution.grossAmount,
        feeAmount: contribution.feeAmount,
        feePercentage: contribution.feePercentage,
        netToCooperative: contribution.netToCooperative,
        hash,
        confirmedAt: new Date().toISOString(),
        confirmedByName: (user as any)?.fullName || user?.email || "Usuario",
      };

      const orgAdmins = await db.select().from(teamUsers)
        .where(and(eq(teamUsers.teamId, teamId), eq(teamUsers.role, "admin")));
      const recipientEmails = new Set<string>();
      for (const admin of orgAdmins) {
        const adminUser = await storage.getUser(admin.userId);
        if (adminUser?.email) recipientEmails.add(adminUser.email);
      }
      if (user?.email) recipientEmails.add(user.email);

      for (const email of recipientEmails) {
        sendSamConfirmationEmail(email, confirmEmailData)
          .catch(err => console.error("[SAM] Confirmation email error:", err.message));
      }


      res.json({ success: true, hash, message: "Aportación confirmada exitosamente" });
    } catch (err) { next(err); }
  });

  app.put(["/api/teams/:teamId/contributions/:cid/adjust", "/api/companies/:teamId/contributions/:cid/adjust"], requireAuth, async (req, res, next) => {
    try {
      const { teamId, cid } = req.params as Record<string, string>;
      const userId = req.supabaseUserId!;
      const user = await storage.getUser(userId);
      const { collaborators, reason } = req.body;

      if (!collaborators || collaborators < 1) {
        return res.status(400).json({ message: "Número de colaboradores inválido" });
      }

      const membership = await db.select().from(teamUsers)
        .where(and(eq(teamUsers.teamId, teamId), eq(teamUsers.userId, userId)));
      const isOrgAdmin = membership.some(m => m.role === "admin");
      const acct = await storage.getAccount(userId);
      const isSysAdmin = acct && ["admin", "superadmin"].includes(acct.userRole);
      if (!isOrgAdmin && !isSysAdmin) {
        return res.status(403).json({ message: "Sin permisos" });
      }

      const [contribution] = await db.select().from(monthlyContributions)
        .where(and(
          eq(monthlyContributions.id, cid),
          eq(monthlyContributions.teamId, teamId),
        ));

      if (!contribution || contribution.status !== "pending") {
        return res.status(400).json({ message: "Solo se pueden ajustar solicitudes pendientes" });
      }

      const { plan, umas, feePercent } = determinePlan(collaborators);
      const umaVal = parseFloat(contribution.umaValue);
      const newGross = collaborators * umas * umaVal;
      const newFee = newGross * (feePercent / 100);
      const newNet = newGross - newFee;

      await db.update(monthlyContributions)
        .set({
          adjustedCollaborators: collaborators,
          adjustedAmount: newGross.toFixed(2),
          adjustmentReason: reason || "Ajuste de colaboradores",
          planType: plan,
          umasPerCol: umas,
          feePercentage: feePercent.toFixed(2),
          feeAmount: newFee.toFixed(2),
          netToCooperative: newNet.toFixed(2),
          grossAmount: newGross.toFixed(2),
          status: "adjusted",
        })
        .where(eq(monthlyContributions.id, cid));

      await db.insert(contributionAuditLog).values({
        contributionId: cid,
        action: "adjusted",
        actorEmail: user?.email || "unknown",
        metadata: {
          previousCollaborators: contribution.activeCollaborators,
          newCollaborators: collaborators,
          previousAmount: contribution.grossAmount,
          newAmount: newGross.toFixed(2),
          reason: reason || "Ajuste de colaboradores",
        },
      });

      res.json({
        success: true,
        newAmount: newGross.toFixed(2),
        plan,
        message: "Ajuste aplicado. Ahora puedes confirmar la aportación.",
      });
    } catch (err) { next(err); }
  });

  const SAM_MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  async function checkSamAlertsForTeam(teamId: string): Promise<void> {
    try {
      const pendingContributions = await db.select().from(monthlyContributions)
        .where(and(
          eq(monthlyContributions.teamId, teamId),
          sql`${monthlyContributions.status} IN ('pending', 'adjusted')`
        ));

      const now = new Date();

      for (const contrib of pendingContributions) {
        if (!contrib.generatedAt) continue;
        const generated = new Date(contrib.generatedAt);
        const daysSince = Math.floor((now.getTime() - generated.getTime()) / (1000 * 60 * 60 * 24));
        const monthName = SAM_MONTH_NAMES[(contrib.periodMonth || 1) - 1];
        const amount = contrib.adjustedAmount || contrib.grossAmount;

        if (daysSince >= 10 && !contrib.secondReminderSentAt) {
          const adminMembers = await db.select().from(teamUsers)
            .where(and(eq(teamUsers.teamId, contrib.teamId), eq(teamUsers.role, "admin")));
          let reminderSent = false;
          for (const member of adminMembers) {
            const adminUser = await storage.getUser(member.userId);
            if (adminUser?.email) {
              try {
                await sendSamReminderEmail(adminUser.email, monthName, contrib.periodYear, amount, daysSince, true);
                reminderSent = true;
              } catch (err: any) {
                console.error("[SAM alerts] 2nd reminder error:", err.message);
              }
            }
          }

          if (reminderSent) {
            await db.update(monthlyContributions)
              .set({ secondReminderSentAt: now })
              .where(eq(monthlyContributions.id, contrib.id));
          }

          if (!contrib.partnerNotifiedAt) {
            const team = await storage.getTeam(contrib.teamId);
            if (team) {
              let partnerNotified = false;
              for (const admin of adminMembers) {
                const adminAcct = await storage.getAccount(admin.userId);
                if (adminAcct?.referredBy) {
                  const [refCode] = await db.select().from(referralCodes)
                    .where(eq(referralCodes.code, adminAcct.referredBy));
                  if (refCode) {
                    const partnerUser = await storage.getUser(refCode.ownerId);
                    if (partnerUser?.email) {
                      try {
                        await sendSamPartnerNotificationEmail(partnerUser.email, team.name, monthName, contrib.periodYear, amount, daysSince);
                        partnerNotified = true;
                      } catch (err: any) {
                        console.error("[SAM alerts] Partner notification error:", err.message);
                      }
                    }
                  }
                  break;
                }
              }

              if (partnerNotified) {
                await db.update(monthlyContributions)
                  .set({ partnerNotifiedAt: now })
                  .where(eq(monthlyContributions.id, contrib.id));
              }
            }
          }
        } else if (daysSince >= 5 && !contrib.firstReminderSentAt) {
          const adminMembers = await db.select().from(teamUsers)
            .where(and(eq(teamUsers.teamId, contrib.teamId), eq(teamUsers.role, "admin")));
          let reminderSent = false;
          for (const member of adminMembers) {
            const adminUser = await storage.getUser(member.userId);
            if (adminUser?.email) {
              try {
                await sendSamReminderEmail(adminUser.email, monthName, contrib.periodYear, amount, daysSince, false);
                reminderSent = true;
              } catch (err: any) {
                console.error("[SAM alerts] 1st reminder error:", err.message);
              }
            }
          }

          if (reminderSent) {
            await db.update(monthlyContributions)
              .set({ firstReminderSentAt: now })
              .where(eq(monthlyContributions.id, contrib.id));
          }
        }
      }
    } catch (err) {
      console.error("[SAM alerts] Error checking alerts for team", teamId, err);
    }
  }

  app.get("/api/teams/:teamId/contributions/alerts", requireAuth, async (req, res, next) => {
    try {
      const { teamId } = req.params as Record<string, string>;
      const userId = req.supabaseUserId!;

      const membership = await db.select().from(teamUsers)
        .where(and(eq(teamUsers.teamId, teamId), eq(teamUsers.userId, userId)));
      if (membership.length === 0) {
        const acct = await storage.getAccount(userId);
        if (!acct || !["admin", "superadmin"].includes(acct.userRole)) {
          return res.status(403).json({ message: "Sin permisos" });
        }
      }

      const contributions = await db.select().from(monthlyContributions)
        .where(and(
          eq(monthlyContributions.teamId, teamId),
          sql`${monthlyContributions.status} IN ('pending', 'adjusted')`
        ));

      const now = new Date();
      const alertItems = contributions.map(c => {
        if (!c.generatedAt) return null;
        const generated = new Date(c.generatedAt);
        const daysSince = Math.floor((now.getTime() - generated.getTime()) / (1000 * 60 * 60 * 24));
        let level: "normal" | "warning" | "urgent" | "overdue" = "normal";
        if (daysSince >= 16) level = "overdue";
        else if (daysSince >= 10) level = "urgent";
        else if (daysSince >= 5) level = "warning";
        return { contributionId: c.id, periodYear: c.periodYear, periodMonth: c.periodMonth, daysSince, level, amount: c.adjustedAmount || c.grossAmount };
      }).filter(Boolean);

      res.json(alertItems);
    } catch (err) { next(err); }
  });

  app.post("/api/admin/contributions/:cid/payment", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const { cid } = req.params as Record<string, string>;
      const userId = req.supabaseUserId!;
      const user = await storage.getUser(userId);
      const { method, reference, receiptUrl } = req.body;

      const [contribution] = await db.select().from(monthlyContributions)
        .where(eq(monthlyContributions.id, cid));

      if (!contribution) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }

      if (contribution.status !== "confirmed") {
        return res.status(400).json({ message: "La solicitud debe estar confirmada antes de registrar pago" });
      }

      await db.update(monthlyContributions)
        .set({
          paymentStatus: "paid",
          paymentDate: new Date(),
          paymentMethod: method || "spei",
          paymentReference: reference,
          paymentReceiptUrl: receiptUrl,
          status: "paid",
        })
        .where(eq(monthlyContributions.id, cid));

      await db.insert(contributionAuditLog).values({
        contributionId: cid,
        action: "payment_registered",
        actorEmail: user?.email || "admin",
        metadata: { method, reference, amount: contribution.adjustedAmount || contribution.grossAmount },
      });

      res.json({ success: true, message: "Pago registrado exitosamente" });
    } catch (err) { next(err); }
  });

  app.get(["/api/teams/:teamId/contributions/:cid/audit", "/api/companies/:teamId/contributions/:cid/audit"], requireAuth, async (req, res, next) => {
    try {
      const { teamId, cid } = req.params as Record<string, string>;
      const userId = req.supabaseUserId!;

      const acct = await storage.getAccount(userId);
      const isSysAdmin = acct && ["admin", "superadmin"].includes(acct.userRole);
      const membership = await db.select().from(teamUsers)
        .where(and(eq(teamUsers.teamId, teamId), eq(teamUsers.userId, userId)));
      if (membership.length === 0 && !isSysAdmin) {
        return res.status(403).json({ message: "Sin acceso" });
      }

      const [contribution] = await db.select().from(monthlyContributions)
        .where(and(
          eq(monthlyContributions.id, cid),
          eq(monthlyContributions.teamId, teamId),
        ));
      if (!contribution) {
        return res.status(404).json({ message: "Solicitud no encontrada para esta organización" });
      }

      const logs = await db.select().from(contributionAuditLog)
        .where(eq(contributionAuditLog.contributionId, cid))
        .orderBy(asc(contributionAuditLog.createdAt));

      res.json(logs);
    } catch (err) { next(err); }
  });
  app.get("/api/facturapi/status", requireAdmin, (_req, res) => {
    res.json({ configured: facturapi.isConfigured(), sandbox: facturapi.isConfigured() ? facturapi.isSandboxMode() : null });
  });

  app.patch("/api/admin/orgs/:id/fiscal", requireAdmin, async (req, res, next) => {
    try {
      const { id } = req.params as Record<string, string>;
      const schema = z.object({
        rfc: z.string().min(12).max(13).regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i, "RFC con formato inválido"),
        razonSocial: z.string().min(1),
        regimenFiscal: z.string().regex(/^\d{3}$/, "Régimen fiscal debe ser código de 3 dígitos"),
        codigoPostalFiscal: z.string().regex(/^\d{5}$/, "Código postal debe ser 5 dígitos"),
      });
      const parsed = schema.parse(req.body);

      const [team] = await db.select().from(teams).where(eq(teams.id, id));
      if (!team) return res.status(404).json({ message: "Empresa no encontrada" });

      let facturapiCustomerId = team.facturapiCustomerId;

      if (facturapi.isConfigured()) {
        if (facturapiCustomerId) {
          await facturapi.updateCustomer(facturapiCustomerId, {
            legalName: parsed.razonSocial,
            taxId: parsed.rfc,
            taxSystem: parsed.regimenFiscal,
            zip: parsed.codigoPostalFiscal,
          });
        } else {
          const customer = await facturapi.createCustomer({
            legalName: parsed.razonSocial,
            taxId: parsed.rfc,
            taxSystem: parsed.regimenFiscal,
            zip: parsed.codigoPostalFiscal,
          });
          facturapiCustomerId = customer.id;
        }
      }

      await db.update(teams).set({
        rfc: parsed.rfc,
        razonSocial: parsed.razonSocial,
        regimenFiscal: parsed.regimenFiscal,
        codigoPostalFiscal: parsed.codigoPostalFiscal,
        facturapiCustomerId,
        updatedAt: new Date(),
      }).where(eq(teams.id, id));

      const [updated] = await db.select().from(teams).where(eq(teams.id, id));
      res.json(updated);
    } catch (err) { next(err); }
  });

  app.post("/api/admin/invoices", requireAdmin, async (req, res, next) => {
    try {
      const schema = z.object({
        teamId: z.string(),
        contributionId: z.string().uuid().optional(),
        invoiceType: z.enum(["contribution", "certification"]),
        concept: z.string().min(1),
        subtotal: z.number().positive(),
        paymentForm: z.string().default("03"),
        productKey: z.string().default("86101700"),
      });
      const parsed = schema.parse(req.body);

      const [team] = await db.select().from(teams).where(eq(teams.id, parsed.teamId));
      if (!team) return res.status(404).json({ message: "Empresa no encontrada" });
      if (!team.rfc || !team.razonSocial) return res.status(400).json({ message: "Empresa sin datos fiscales completos (RFC / Razón Social)" });

      if (parsed.contributionId) {
        const [contrib] = await db.select().from(monthlyContributions)
          .where(and(eq(monthlyContributions.id, parsed.contributionId), eq(monthlyContributions.teamId, parsed.teamId)));
        if (!contrib) return res.status(400).json({ message: "La aportación no pertenece a esta empresa" });

        const existingInvoices = await db.select().from(invoices)
          .where(and(eq(invoices.contributionId, parsed.contributionId), sql`${invoices.status} != 'cancelled'`));
        if (existingInvoices.length > 0) return res.status(400).json({ message: "Ya existe una factura activa para esta aportación" });
      }

      const tax = Math.round(parsed.subtotal * 0.16 * 100) / 100;
      const total = Math.round((parsed.subtotal + tax) * 100) / 100;

      let facturapiInvoiceId: string | null = null;
      let cfdiUuid: string | null = null;
      let series: string | null = null;
      let folioNumber: number | null = null;
      let pdfUrl: string | null = null;
      let xmlUrl: string | null = null;
      let invoiceStatus: "draft" | "active" | "cancelled" = "draft";

      let resolvedCustomerId = team.facturapiCustomerId;
      if (facturapi.isConfigured() && !resolvedCustomerId && team.rfc && team.razonSocial && team.regimenFiscal && team.codigoPostalFiscal) {
        const customer = await facturapi.createCustomer({
          legalName: team.razonSocial,
          taxId: team.rfc,
          taxSystem: team.regimenFiscal,
          zip: team.codigoPostalFiscal,
        });
        resolvedCustomerId = customer.id;
        await db.update(teams).set({ facturapiCustomerId: resolvedCustomerId, updatedAt: new Date() }).where(eq(teams.id, parsed.teamId));
      }

      if (facturapi.isConfigured() && resolvedCustomerId) {
        const inv = await facturapi.createInvoice({
          customerId: resolvedCustomerId,
          items: [{
            description: parsed.concept,
            quantity: 1,
            price: parsed.subtotal,
            product_key: parsed.productKey,
          }],
          paymentForm: parsed.paymentForm,
        });
        facturapiInvoiceId = inv.id;
        cfdiUuid = inv.uuid;
        series = inv.series;
        folioNumber = inv.folio_number;
        pdfUrl = `https://www.facturapi.io/v2/invoices/${inv.id}/pdf`;
        xmlUrl = `https://www.facturapi.io/v2/invoices/${inv.id}/xml`;
        invoiceStatus = "active";
      }

      const [invoice] = await db.insert(invoices).values({
        teamId: parsed.teamId,
        contributionId: parsed.contributionId || null,
        invoiceType: parsed.invoiceType,
        facturapiInvoiceId,
        cfdiUuid,
        series,
        folioNumber,
        status: invoiceStatus,
        total: total.toString(),
        subtotal: parsed.subtotal.toString(),
        tax: tax.toString(),
        concept: parsed.concept,
        pdfUrl,
        xmlUrl,
        createdBy: req.supabaseUserId!,
      }).returning();

      if (parsed.contributionId && cfdiUuid) {
        await db.update(monthlyContributions).set({
          cfdiUuid,
          cfdiStatus: "emitido",
        }).where(eq(monthlyContributions.id, parsed.contributionId));
      }

      res.json(invoice);
    } catch (err) { next(err); }
  });

  app.get("/api/admin/invoices", requireAdmin, async (req, res, next) => {
    try {
      const teamId = req.query.teamId as string | undefined;
      let query = db.select().from(invoices).orderBy(desc(invoices.createdAt));
      if (teamId) {
        query = query.where(eq(invoices.teamId, teamId)) as typeof query;
      }
      const rows = await query.limit(200);
      res.json(rows);
    } catch (err) { next(err); }
  });

  app.get("/api/admin/invoices/:id", requireAdmin, async (req, res, next) => {
    try {
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, (req.params.id as string)));
      if (!invoice) return res.status(404).json({ message: "Factura no encontrada" });
      res.json(invoice);
    } catch (err) { next(err); }
  });

  app.post("/api/admin/invoices/:id/cancel", requireAdmin, async (req, res, next) => {
    try {
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, (req.params.id as string)));
      if (!invoice) return res.status(404).json({ message: "Factura no encontrada" });
      if (invoice.status === "cancelled") return res.status(400).json({ message: "Ya está cancelada" });

      const reason = (req.body.reason as string) || "02";

      if (invoice.facturapiInvoiceId && facturapi.isConfigured()) {
        await facturapi.cancelInvoice(invoice.facturapiInvoiceId, reason);
      }

      await db.update(invoices).set({
        status: "cancelled",
        cancelledAt: new Date(),
        cancellationReason: reason,
      }).where(eq(invoices.id, (req.params.id as string)));

      if (invoice.contributionId) {
        await db.update(monthlyContributions).set({
          cfdiStatus: "cancelado",
        }).where(eq(monthlyContributions.id, invoice.contributionId));
      }

      const [updated] = await db.select().from(invoices).where(eq(invoices.id, (req.params.id as string)));
      res.json(updated);
    } catch (err) { next(err); }
  });

  app.get("/api/admin/invoices/:id/download/:format", requireAdmin, async (req, res, next) => {
    try {
      const format = (req.params.format as string) as "pdf" | "xml";
      if (!["pdf", "xml"].includes(format)) return res.status(400).json({ message: "Formato inválido" });

      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, (req.params.id as string)));
      if (!invoice) return res.status(404).json({ message: "Factura no encontrada" });
      if (!invoice.facturapiInvoiceId) return res.status(400).json({ message: "Factura sin ID de Facturapi" });

      if (!facturapi.isConfigured()) return res.status(503).json({ message: "Facturapi no configurado" });

      const buffer = await facturapi.downloadInvoice(invoice.facturapiInvoiceId, format);
      const contentType = format === "pdf" ? "application/pdf" : "application/xml";
      const filename = `CFDI-${invoice.cfdiUuid || invoice.id}.${format}`;
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (err) { next(err); }
  });
  // ═══════════════════════════════════════════
  // BLOG — PUBLIC
  // ═══════════════════════════════════════════

  const BLOG_CATEGORIES: Record<string, string> = {
    stps: "STPS y NOMs",
    fiscal: "Beneficios Fiscales",
    ia: "IA y Capacitación",
    cursos: "Cursos Gratuitos",
    casos: "Casos de Éxito",
  };

  app.get("/api/blog/posts", async (req, res, next) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 9));
      const category = req.query.category as string | undefined;
      const search = req.query.search as string | undefined;
      const offset = (page - 1) * limit;

      const conditions: SQL[] = [eq(blogPosts.status, "published")];
      if (category && BLOG_CATEGORIES[category]) conditions.push(eq(blogPosts.category, category));
      if (search) conditions.push(ilike(blogPosts.title, `%${search}%`));

      const whereClause = and(...conditions);
      const [totalRow] = await db.select({ count: count() }).from(blogPosts).where(whereClause);
      const total = totalRow?.count || 0;

      const rows = await db.select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        category: blogPosts.category,
        featuredImageUrl: blogPosts.featuredImageUrl,
        authorName: blogPosts.authorName,
        blogViews: blogPosts.blogViews,
        publishedAt: blogPosts.publishedAt,
      }).from(blogPosts).where(whereClause).orderBy(desc(blogPosts.publishedAt)).limit(limit).offset(offset);

      res.json({ data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (err) { next(err); }
  });

  app.get("/api/blog/posts/:slug", async (req, res, next) => {
    try {
      const [post] = await db.select().from(blogPosts).where(and(eq(blogPosts.slug, (req.params.slug as string)), eq(blogPosts.status, "published"))).limit(1);
      if (!post) return res.status(404).json({ message: "Artículo no encontrado" });
      db.update(blogPosts).set({ blogViews: sql`${blogPosts.blogViews} + 1` }).where(eq(blogPosts.id, post.id)).catch(() => {});
      res.json(post);
    } catch (err) { next(err); }
  });

  app.get("/api/blog/categories", async (_req, res, next) => {
    try {
      const rows = await db.select({ category: blogPosts.category, count: count() }).from(blogPosts).where(eq(blogPosts.status, "published")).groupBy(blogPosts.category);
      const result = rows.map(r => ({ category: r.category, label: BLOG_CATEGORIES[r.category] || r.category, count: r.count }));
      res.json(result);
    } catch (err) { next(err); }
  });

  app.get("/api/blog/related/:slug", async (req, res, next) => {
    try {
      const [post] = await db.select({ category: blogPosts.category, id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.slug, (req.params.slug as string))).limit(1);
      if (!post) return res.json([]);
      const related = await db.select({
        id: blogPosts.id, title: blogPosts.title, slug: blogPosts.slug, excerpt: blogPosts.excerpt,
        category: blogPosts.category, featuredImageUrl: blogPosts.featuredImageUrl, publishedAt: blogPosts.publishedAt,
      }).from(blogPosts).where(and(eq(blogPosts.status, "published"), eq(blogPosts.category, post.category), sql`${blogPosts.id} != ${post.id}`)).orderBy(desc(blogPosts.publishedAt)).limit(3);
      res.json(related);
    } catch (err) { next(err); }
  });

  // ═══════════════════════════════════════════
  // NEWSLETTER — PUBLIC
  // ═══════════════════════════════════════════

  app.post("/api/newsletter/subscribe", async (req, res, next) => {
    try {
      const { email, company_name, sector, municipio } = req.body;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: "Email inválido" });

      const [existing] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, email.toLowerCase())).limit(1);
      if (existing) {
        if (existing.status === "active") return res.status(409).json({ message: "Ya estás suscrito" });
        await db.update(newsletterSubscribers).set({ status: "active", unsubscribedAt: null, companyName: company_name || existing.companyName, sector: sector || existing.sector, municipio: municipio || existing.municipio }).where(eq(newsletterSubscribers.id, existing.id));
        return res.json({ success: true, message: "¡Suscripción reactivada!" });
      }

      await db.insert(newsletterSubscribers).values({ email: email.toLowerCase(), companyName: company_name, sector, municipio, source: "blog" });
      res.json({ success: true, message: "¡Suscripción exitosa!" });
    } catch (err) { next(err); }
  });

  app.get("/api/newsletter/unsubscribe", async (req, res, next) => {
    try {
      const emailB64 = req.query.email as string;
      if (!emailB64) return res.redirect("/blog?unsubscribed=false");
      const email = Buffer.from(emailB64, "base64").toString("utf-8");
      await db.update(newsletterSubscribers).set({ status: "unsubscribed", unsubscribedAt: new Date() }).where(eq(newsletterSubscribers.email, email));
      res.redirect("/blog?unsubscribed=true");
    } catch (err) { next(err); }
  });

  // ═══════════════════════════════════════════
  // BLOG — ADMIN
  // ═══════════════════════════════════════════

  app.get("/api/admin/blog/posts", requireAdmin, async (req, res, next) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
      const status = req.query.status as string | undefined;
      const category = req.query.category as string | undefined;
      const offset = (page - 1) * limit;

      const conditions: SQL[] = [];
      if (status) conditions.push(eq(blogPosts.status, status));
      if (category) conditions.push(eq(blogPosts.category, category));
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [totalRow] = await db.select({ count: count() }).from(blogPosts).where(whereClause);
      const total = totalRow?.count || 0;
      const rows = await db.select().from(blogPosts).where(whereClause).orderBy(desc(blogPosts.createdAt)).limit(limit).offset(offset);
      res.json({ data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (err) { next(err); }
  });

  app.post("/api/admin/blog/posts", requireAdmin, async (req, res, next) => {
    try {
      const { title, slug, content_html, content_text, excerpt, category, target_sectors, seo_keywords, featured_image_url, status } = req.body;
      if (!title || !slug || !content_html || !category) return res.status(400).json({ message: "Faltan campos requeridos" });

      const publishedAt = status === "published" ? new Date() : null;
      const [post] = await db.insert(blogPosts).values({
        title, slug, contentHtml: content_html, contentText: content_text || "", excerpt, category,
        targetSectors: target_sectors || [], seoKeywords: seo_keywords || [],
        featuredImageUrl: featured_image_url, status: status || "draft", publishedAt,
      }).returning();
      res.json(post);
    } catch (err) { next(err); }
  });

  app.patch("/api/admin/blog/posts/:id", requireAdmin, async (req, res, next) => {
    try {
      const id = parseInt((req.params.id as string));
      const updates: any = {};
      const { title, slug, content_html, content_text, excerpt, category, target_sectors, seo_keywords, featured_image_url, status, newsletter_subject } = req.body;
      if (title !== undefined) updates.title = title;
      if (slug !== undefined) updates.slug = slug;
      if (content_html !== undefined) updates.contentHtml = content_html;
      if (content_text !== undefined) updates.contentText = content_text;
      if (excerpt !== undefined) updates.excerpt = excerpt;
      if (category !== undefined) updates.category = category;
      if (target_sectors !== undefined) updates.targetSectors = target_sectors;
      if (seo_keywords !== undefined) updates.seoKeywords = seo_keywords;
      if (featured_image_url !== undefined) updates.featuredImageUrl = featured_image_url;
      if (newsletter_subject !== undefined) updates.newsletterSubject = newsletter_subject;
      if (status !== undefined) {
        updates.status = status;
        if (status === "published") {
          const [existing] = await db.select({ publishedAt: blogPosts.publishedAt }).from(blogPosts).where(eq(blogPosts.id, id));
          if (!existing?.publishedAt) updates.publishedAt = new Date();
        }
      }
      updates.updatedAt = new Date();
      const [updated] = await db.update(blogPosts).set(updates).where(eq(blogPosts.id, id)).returning();
      if (!updated) return res.status(404).json({ message: "Post no encontrado" });
      res.json(updated);
    } catch (err) { next(err); }
  });

  app.delete("/api/admin/blog/posts/:id", requireAdmin, async (req, res, next) => {
    try {
      const id = parseInt((req.params.id as string));
      await db.update(blogPosts).set({ status: "archived", updatedAt: new Date() }).where(eq(blogPosts.id, id));
      res.json({ archived: true });
    } catch (err) { next(err); }
  });

  // ═══════════════════════════════════════════
  // NEWSLETTER — ADMIN
  // ═══════════════════════════════════════════

  app.get("/api/admin/newsletter/subscribers", requireAdmin, async (req, res, next) => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
      const status = req.query.status as string | undefined;
      const source = req.query.source as string | undefined;
      const search = req.query.search as string | undefined;
      const offset = (page - 1) * limit;

      const conditions: SQL[] = [];
      if (status) conditions.push(eq(newsletterSubscribers.status, status));
      if (source) conditions.push(eq(newsletterSubscribers.source, source));
      if (search) conditions.push(ilike(newsletterSubscribers.email, `%${search}%`));
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [totalRow] = await db.select({ count: count() }).from(newsletterSubscribers).where(whereClause);
      const total = totalRow?.count || 0;
      const rows = await db.select().from(newsletterSubscribers).where(whereClause).orderBy(desc(newsletterSubscribers.subscribedAt)).limit(limit).offset(offset);
      res.json({ data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (err) { next(err); }
  });

  app.get("/api/admin/newsletter/stats", requireAdmin, async (_req, res, next) => {
    try {
      const result = await db.execute(sql`
        SELECT
          count(*) FILTER (WHERE status = 'active') as total_active,
          count(*) FILTER (WHERE status = 'unsubscribed') as total_unsubscribed,
          count(*) FILTER (WHERE status = 'active' AND subscribed_at > now() - interval '7 days') as new_last_week,
          jsonb_object_agg(COALESCE(source, 'unknown'), cnt) as by_source,
          jsonb_object_agg(COALESCE(sector_name, 'Sin sector'), sector_cnt) as by_sector
        FROM newsletter_subscribers,
        LATERAL (SELECT count(*) as cnt FROM newsletter_subscribers ns WHERE ns.source = newsletter_subscribers.source) sub1,
        LATERAL (SELECT COALESCE(newsletter_subscribers.sector, 'Sin sector') as sector_name, count(*) as sector_cnt FROM newsletter_subscribers ns WHERE COALESCE(ns.sector, 'Sin sector') = COALESCE(newsletter_subscribers.sector, 'Sin sector')) sub2
        LIMIT 1
      `);
      const statsSimple = await db.execute(sql`
        SELECT
          count(*) FILTER (WHERE status = 'active') as total_active,
          count(*) FILTER (WHERE status = 'unsubscribed') as total_unsubscribed,
          count(*) FILTER (WHERE status = 'active' AND subscribed_at > now() - interval '7 days') as new_last_week
        FROM newsletter_subscribers
      `);
      const bySource = await db.execute(sql`SELECT COALESCE(source, 'unknown') as source, count(*) as cnt FROM newsletter_subscribers WHERE status = 'active' GROUP BY source`);
      const bySector = await db.execute(sql`SELECT COALESCE(sector, 'Sin sector') as sector, count(*) as cnt FROM newsletter_subscribers WHERE status = 'active' GROUP BY sector`);

      const row = statsSimple.rows[0] || {};
      res.json({
        total_active: Number(row.total_active) || 0,
        total_unsubscribed: Number(row.total_unsubscribed) || 0,
        new_last_week: Number(row.new_last_week) || 0,
        by_source: Object.fromEntries(bySource.rows.map((r: any) => [r.source, Number(r.cnt)])),
        by_sector: Object.fromEntries(bySector.rows.map((r: any) => [r.sector, Number(r.cnt)])),
      });
    } catch (err) { next(err); }
  });

  let propuestaMercadoCache: { data: unknown; ts: number; v?: number } | null = null;
  const PROPUESTA_CACHE_TTL = 6 * 60 * 60 * 1000;
  const PROPUESTA_CACHE_FILE = path.join(process.cwd(), ".propuesta-cache.json");
  // Se sube cuando cambia la FORMA o el SIGNIFICADO del payload, para que un
  // cache en disco escrito por la versión anterior no siga sirviéndose. La v2
  // corresponde a las zonas derivadas de ZONA_POR_ESTADO (@shared/zonas).
  const PROPUESTA_CACHE_VERSION = 2;

  try {
    if (fs.existsSync(PROPUESTA_CACHE_FILE)) {
      const cached = JSON.parse(fs.readFileSync(PROPUESTA_CACHE_FILE, "utf-8"));
      if (cached.ts && cached.v === PROPUESTA_CACHE_VERSION && Date.now() - cached.ts < PROPUESTA_CACHE_TTL) {
        propuestaMercadoCache = cached;
        console.log("[propuesta] Loaded file cache (age:", Math.round((Date.now() - cached.ts) / 1000), "s)");
      }
    }
  } catch {}

  // Agrupación estado -> zona derivada de ZONA_POR_ESTADO (@shared/zonas), la
  // ÚNICA definición de zonas del sistema (la misma que usa el CRM).
  //
  // Antes esta expresión llevaba su propia lista de estados escrita a mano y se
  // había desincronizado de @shared/zonas: Querétaro caía en Bajío (es Centro);
  // San Luis Potosí, Zacatecas y Nayarit en Bajío (son Norte); y Michoacán en
  // Sur-Sureste (es Bajío). Como /socios re-agrega desde `estados[]` con
  // ZONA_POR_ESTADO y /propuesta leía este `zonas[]`, las dos páginas públicas
  // publicaban cifras distintas para la misma zona. Derivarla elimina la
  // segunda definición en vez de sincronizar dos listas a mano.
  const estadosPorZona = new Map<string, string[]>();
  for (const [estado, zona] of Object.entries(ZONA_POR_ESTADO)) {
    const lista = estadosPorZona.get(zona) ?? [];
    lista.push(estado);
    estadosPorZona.set(zona, lista);
  }
  const zoneCase = sql.join(
    [
      sql.raw("CASE"),
      ...Array.from(estadosPorZona.entries()).map(([zona, estados]) =>
        // El nombre de zona se inyecta como literal (no como parámetro) para no
        // dejar a Postgres sin tipo en `GROUP BY 1`. Viene de una constante
        // nuestra, pero se escapa igual por higiene.
        sql`WHEN ${inArray(empresasProspectos.estado, estados)} THEN ${sql.raw(`'${zona.replace(/'/g, "''")}'`)}`
      ),
      sql.raw("ELSE 'Otra' END"),
    ],
    sql` `
  );

  app.get("/api/propuesta/mercado", async (_req, res, next) => {
    try {
      if (propuestaMercadoCache && Date.now() - propuestaMercadoCache.ts < PROPUESTA_CACHE_TTL) {
        return res.json(propuestaMercadoCache.data);
      }

      const zonesResult = await db.execute(sql`
        SELECT ${zoneCase} as zona,
          count(*)::int as empresas,
          count(*) FILTER (WHERE ${empresasProspectos.planRecomendado} IS NOT NULL)::int as con_plan,
          coalesce(sum(${empresasProspectos.empleadosEstimados}),0)::int as empleados
        FROM ${empresasProspectos}
        WHERE ${empresasProspectos.estado} IS NOT NULL AND ${empresasProspectos.estado} != ''
        GROUP BY 1 ORDER BY 2 DESC
      `);

      const sectorsResult = await db.execute(sql`
        SELECT ${empresasProspectos.grupoSector} as sector,
          count(*)::int as empresas,
          coalesce(sum(${empresasProspectos.empleadosEstimados}),0)::int as empleados
        FROM ${empresasProspectos}
        WHERE ${empresasProspectos.grupoSector} IS NOT NULL AND ${empresasProspectos.grupoSector} != ''
        GROUP BY 1 ORDER BY 2 DESC LIMIT 8
      `);

      const plansResult = await db.execute(sql`
        SELECT ${empresasProspectos.planRecomendado} as plan, count(*)::int as empresas
        FROM ${empresasProspectos}
        WHERE ${empresasProspectos.planRecomendado} IS NOT NULL
        GROUP BY 1 ORDER BY 2 DESC
      `);

      const [totals] = await db.select({
        total: sql<number>`count(*)::int`,
        estados: sql<number>`count(DISTINCT ${empresasProspectos.estado})::int`,
        municipios: sql<number>`count(DISTINCT ${empresasProspectos.municipio})::int`,
        sectores: sql<number>`count(DISTINCT ${empresasProspectos.grupoSector})::int`,
        conPlan: sql<number>`count(*) FILTER (WHERE ${empresasProspectos.planRecomendado} IS NOT NULL)::int`,
        altaProbabilidad: sql<number>`count(*) FILTER (WHERE ${empresasProspectos.leadScore} >= 60)::int`,
      }).from(empresasProspectos);

      const estadosResult = await db.execute(sql`
        SELECT ${empresasProspectos.estado} as estado,
          ${zoneCase} as zona,
          count(*)::int as empresas,
          count(*) FILTER (WHERE ${empresasProspectos.planRecomendado} IS NOT NULL)::int as con_plan,
          coalesce(sum(${empresasProspectos.empleadosEstimados}),0)::int as empleados
        FROM ${empresasProspectos}
        WHERE ${empresasProspectos.estado} IS NOT NULL AND ${empresasProspectos.estado} != ''
        GROUP BY 1, 2 ORDER BY 3 DESC
      `);

      const zonesArr = Array.isArray(zonesResult) ? zonesResult : (zonesResult as { rows: Record<string, unknown>[] }).rows;
      const sectorsArr = Array.isArray(sectorsResult) ? sectorsResult : (sectorsResult as { rows: Record<string, unknown>[] }).rows;
      const plansArr = Array.isArray(plansResult) ? plansResult : (plansResult as { rows: Record<string, unknown>[] }).rows;
      const estadosArr = Array.isArray(estadosResult) ? estadosResult : (estadosResult as { rows: Record<string, unknown>[] }).rows;

      const payload = {
        totals,
        zonas: zonesArr,
        sectores: sectorsArr,
        planes: plansArr,
        estados: estadosArr,
      };
      propuestaMercadoCache = { data: payload, ts: Date.now(), v: PROPUESTA_CACHE_VERSION };
      try { fs.writeFileSync(PROPUESTA_CACHE_FILE, JSON.stringify(propuestaMercadoCache)); } catch {}
      res.json(payload);
    } catch (err) { next(err); }
  });

  app.post("/api/empresas-prospectos/perfilar-masivo", requireAuth, requireSuperadmin, async (_req, res, next) => {
    let totalUpdated = 0;
    try {
      const estados = await db.execute(sql`
        SELECT DISTINCT ${empresasProspectos.estado} as estado
        FROM ${empresasProspectos}
        WHERE ${empresasProspectos.planRecomendado} IS NULL
        AND ${empresasProspectos.estado} IS NOT NULL
        AND ${empresasProspectos.estado} != ''
      `);

      const estadosList = ((estados as any).rows ?? []).map((r: any) => r.estado);

      const nullEstadoCount = await db.execute(sql`
        SELECT count(*)::int as cnt FROM ${empresasProspectos}
        WHERE ${empresasProspectos.planRecomendado} IS NULL
        AND (${empresasProspectos.estado} IS NULL OR ${empresasProspectos.estado} = '')
      `);
      const hasNullEstados = ((nullEstadoCount as any).rows?.[0]?.cnt ?? (nullEstadoCount as any)[0]?.cnt ?? 0) > 0;
      if (hasNullEstados) {
        estadosList.push(null);
      }

      for (const estado of estadosList) {
        const estadoFilter = estado === null
          ? sql`(${empresasProspectos.estado} IS NULL OR ${empresasProspectos.estado} = '')`
          : sql`${empresasProspectos.estado} = ${estado}`;

        const result = await db.execute(sql`
          UPDATE empresas_prospectos SET
            grupo_sector = CASE
              WHEN left(codigo_scian, 2) IN ('11','21','22') THEN 'Otros'
              WHEN left(codigo_scian, 2) = '23' THEN 'Construcción'
              WHEN left(codigo_scian, 2) IN ('31','32','33') THEN 'Manufactura'
              WHEN left(codigo_scian, 2) = '43' THEN 'Comercio Mayoreo'
              WHEN left(codigo_scian, 2) = '46' THEN 'Comercio Menudeo'
              WHEN left(codigo_scian, 2) IN ('48','49') THEN 'Transporte'
              WHEN left(codigo_scian, 2) = '51' THEN 'Información'
              WHEN left(codigo_scian, 2) = '52' THEN 'Finanzas/Seguros'
              WHEN left(codigo_scian, 2) = '53' THEN 'Inmobiliario'
              WHEN left(codigo_scian, 2) = '54' THEN 'Servicios Profesionales'
              WHEN left(codigo_scian, 2) = '55' THEN 'Corporativos'
              WHEN left(codigo_scian, 2) = '56' THEN 'Servicios Apoyo'
              WHEN left(codigo_scian, 2) = '61' THEN 'Educación'
              WHEN left(codigo_scian, 2) = '62' THEN 'Salud'
              WHEN left(codigo_scian, 2) = '71' THEN 'Entretenimiento'
              WHEN left(codigo_scian, 2) = '72' THEN 'Alojamiento/Alimentos'
              WHEN left(codigo_scian, 2) = '81' THEN 'Otros Servicios'
              WHEN left(codigo_scian, 2) = '93' THEN 'Gobierno'
              ELSE 'Otros'
            END,
            nivel_riesgo = CASE
              WHEN left(codigo_scian, 2) IN ('31','32','33','23') THEN 'Alto'
              WHEN left(codigo_scian, 2) IN ('48','49') THEN 'Alto'
              WHEN left(codigo_scian, 2) = '62' THEN 'Alto'
              WHEN left(codigo_scian, 2) IN ('11','21','22') THEN 'Alto'
              WHEN left(codigo_scian, 2) = '72' THEN 'Medio'
              WHEN left(codigo_scian, 2) = '43' THEN 'Medio'
              WHEN left(codigo_scian, 2) = '46' THEN 'Medio'
              WHEN left(codigo_scian, 2) = '71' THEN 'Medio'
              WHEN left(codigo_scian, 2) = '81' THEN 'Medio'
              WHEN left(codigo_scian, 2) = '56' THEN 'Medio'
              WHEN left(codigo_scian, 2) = '61' THEN 'Bajo'
              WHEN left(codigo_scian, 2) = '52' THEN 'Bajo'
              WHEN left(codigo_scian, 2) = '53' THEN 'Bajo'
              WHEN left(codigo_scian, 2) = '54' THEN 'Bajo'
              WHEN left(codigo_scian, 2) = '55' THEN 'Bajo'
              WHEN left(codigo_scian, 2) = '93' THEN 'Bajo'
              WHEN left(codigo_scian, 2) = '51' THEN 'Bajo'
              ELSE 'Alto'
            END,
            empleados_estimados = CASE
              WHEN estrato_personal = '0 a 5 personas' THEN 3
              WHEN estrato_personal = '6 a 10 personas' THEN 8
              WHEN estrato_personal = '11 a 30 personas' THEN 20
              WHEN estrato_personal = '31 a 50 personas' THEN 40
              WHEN estrato_personal = '51 a 100 personas' THEN 75
              WHEN estrato_personal = '101 a 250 personas' THEN 175
              WHEN estrato_personal = '251 y más personas' THEN 350
              ELSE empleados_estimados
            END,
            plan_recomendado = CASE
              WHEN estrato_personal IN ('0 a 5 personas','6 a 10 personas','11 a 30 personas') THEN 'Impulsa'
              WHEN estrato_personal IN ('31 a 50 personas','51 a 100 personas') THEN 'Transforma'
              WHEN estrato_personal IN ('101 a 250 personas','251 y más personas') THEN 'Lidera'
              ELSE 'Impulsa'
            END,
            updated_at = now()
          WHERE plan_recomendado IS NULL AND ${estadoFilter}
        `);

        const rowCount = (result as any).rowCount ?? (result as any).length ?? 0;
        totalUpdated += rowCount;
        console.log(`[perfilar-masivo] Estado: ${estado ?? '(sin estado)'} → ${rowCount} empresas actualizadas`);
      }

      propuestaMercadoCache = null;
      try { fs.unlinkSync(PROPUESTA_CACHE_FILE); } catch {}

      res.json({ ok: true, totalUpdated });
    } catch (err) {
      if (totalUpdated > 0) { propuestaMercadoCache = null; try { fs.unlinkSync(PROPUESTA_CACHE_FILE); } catch {} }
      next(err);
    }
  });

  app.post("/api/empresas-prospectos/asignar-zonas", requireAuth, requireSuperadmin, async (_req, res) => {
    res.json({ ok: true, message: "Asignación de zonas iniciada en segundo plano" });
    (async () => {
      let totalUpdated = 0;
      for (const [estado, zona] of Object.entries(ZONA_POR_ESTADO)) {
        try {
          const result = await db.execute(sql`
            UPDATE empresas_prospectos SET zona_comercial = ${zona}
            WHERE estado = ${estado} AND plan_recomendado IS NOT NULL AND (zona_comercial IS NULL OR zona_comercial NOT IN ('Centro','Norte','Bajío','Sur-Sureste'))
          `);
          const rowCount = typeof result === "object" && "rowCount" in result ? (result as any).rowCount : 0;
          totalUpdated += rowCount;
          console.log(`[asignar-zonas] ${estado} → ${zona}: ${rowCount} actualizados`);
        } catch (e) {
          console.error(`[asignar-zonas] Error en ${estado}:`, e);
        }
      }
      console.log(`[asignar-zonas] Completado: ${totalUpdated} prospectos actualizados`);
      propuestaMercadoCache = null;
      try { fs.unlinkSync(PROPUESTA_CACHE_FILE); } catch {}
    })();
  });
  // ═══════ Insurance / Seguros ═══════
  app.get("/api/insurance/plans", async (_req, res, next) => {
    try {
      const plans = await db.select().from(insurancePlans).where(eq(insurancePlans.isActive, true));
      res.json(plans);
    } catch (err) { next(err); }
  });

  app.get("/api/insurance/my-enrollment", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId;
      if (!userId) return res.status(401).json({ message: "No autenticado" });
      const results = await db.select().from(insuranceEnrollments)
        .where(and(eq(insuranceEnrollments.userId, userId), inArray(insuranceEnrollments.status, ["active", "pending"])));
      if (!results.length) return res.json(null);
      const enrollment = results.find(e => e.status === "active") || results[0];
      const [plan] = await db.select().from(insurancePlans).where(eq(insurancePlans.id, enrollment.planId));
      res.json({ enrollment, plan });
    } catch (err) { next(err); }
  });

  app.post("/api/insurance/enroll", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId;
      if (!userId) return res.status(401).json({ message: "No autenticado" });
      const existing = await db.select().from(insuranceEnrollments)
        .where(and(eq(insuranceEnrollments.userId, userId), inArray(insuranceEnrollments.status, ["active", "pending"])));
      if (existing.length > 0) return res.status(400).json({ message: "Ya tienes un seguro activo o pendiente. Cancélalo primero." });

      const parsed = insertInsuranceEnrollmentSchema.parse({ ...req.body, userId });
      const [enrollment] = await db.insert(insuranceEnrollments).values(parsed).returning();
      res.json(enrollment);
    } catch (err) { next(err); }
  });

  app.patch("/api/insurance/enrollment/:id/cancel", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId;
      if (!userId) return res.status(401).json({ message: "No autenticado" });
      const [enrollment] = await db.select().from(insuranceEnrollments)
        .where(and(eq(insuranceEnrollments.id, (req.params.id as string)), eq(insuranceEnrollments.userId, userId)));
      if (!enrollment) return res.status(404).json({ message: "Enrollment no encontrado" });
      const [updated] = await db.update(insuranceEnrollments)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(insuranceEnrollments.id, (req.params.id as string))).returning();
      res.json(updated);
    } catch (err) { next(err); }
  });

  app.get("/api/admin/insurance/enrollments", requireAdmin, async (_req, res, next) => {
    try {
      const enrollments = await db.select({
        enrollment: insuranceEnrollments,
        plan: insurancePlans,
        user: { id: users.id, email: users.email },
        profile: { fullName: profiles.fullName },
      }).from(insuranceEnrollments)
        .innerJoin(insurancePlans, eq(insuranceEnrollments.planId, insurancePlans.id))
        .innerJoin(users, eq(insuranceEnrollments.userId, users.id))
        .leftJoin(profiles, eq(insuranceEnrollments.userId, profiles.id))
        .orderBy(desc(insuranceEnrollments.createdAt));
      const mapped = enrollments.map(e => ({
        enrollment: e.enrollment,
        plan: e.plan,
        user: { id: e.user.id, email: e.user.email, fullName: e.profile?.fullName || e.user.email },
      }));
      res.json(mapped);
    } catch (err) { next(err); }
  });

  app.patch("/api/admin/insurance/enrollment/:id", requireAdmin, async (req, res, next) => {
    try {
      const { status, policyNumber, certificateUrl } = req.body;
      const updates: any = { updatedAt: new Date() };
      if (status) updates.status = status;
      if (policyNumber !== undefined) updates.policyNumber = policyNumber;
      if (certificateUrl !== undefined) updates.certificateUrl = certificateUrl;
      const [updated] = await db.update(insuranceEnrollments)
        .set(updates).where(eq(insuranceEnrollments.id, (req.params.id as string))).returning();
      res.json(updated);
    } catch (err) { next(err); }
  });

  app.get("/api/bank-info", requireAuth, (_req, res) => {
    res.json(getBankInfo());
  });
  app.get("/api/admin/export-prospectos-csv", adminRateLimit, async (req, res, next) => {
    try {
      const authKey = req.headers["x-migrate-key"] || req.query.key;
      if (!authKey || authKey !== getAdminApiKey()) return res.status(403).json({ message: "No autorizado" });
      const fs = await import("fs");
      const csvPath = "/tmp/prospectos_perfilados.csv.gz";
      if (!fs.existsSync(csvPath)) {
        return res.status(404).json({ message: "CSV file not found" });
      }

      const { logAudit } = await import("../audit-log");
      await logAudit({
        req,
        action: "prospectos.export",
        targetType: "prospectos_csv",
        metadata: { path: csvPath },
      });

      res.setHeader("Content-Type", "application/gzip");
      res.setHeader("Content-Disposition", "attachment; filename=prospectos.csv.gz");
      fs.createReadStream(csvPath).pipe(res);
    } catch (err) { next(err); }
  });

  app.post("/api/admin/import-prospectos-from-url", adminRateLimit, async (req, res, next) => {
    try {
      const authKey = req.headers["x-migrate-key"];
      if (!authKey || authKey !== getAdminApiKey()) return res.status(403).json({ message: "No autorizado" });
      const { url } = req.body;
      if (!url || typeof url !== "string") return res.status(400).json({ message: "URL requerida" });

      // Validate URL is HTTPS only
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:") return res.status(400).json({ message: "Solo se permiten URLs HTTPS" });
      } catch { return res.status(400).json({ message: "URL inválida" }); }

      const { logAudit } = await import("../audit-log");
      await logAudit({
        req,
        action: "prospectos.import",
        targetType: "prospectos_csv",
        metadata: { sourceUrl: url },
      });

      res.json({ status: "started", message: "Descargando e importando CSV en background..." });

      (async () => {
        try {
          console.log("[import] Downloading CSV from source...");
          const response = await fetch(url, { signal: AbortSignal.timeout(600000) });
          if (!response.ok) throw new Error(`Download failed: ${response.status}`);
          const buffer = Buffer.from(await response.arrayBuffer());
          console.log(`[import] Downloaded ${(buffer.length / 1024 / 1024).toFixed(1)} MB`);

          // Decompress if gzipped
          const zlib = await import("zlib");
          const { promisify } = await import("util");
          let csvText: string;
          try {
            csvText = (await promisify(zlib.gunzip)(buffer)).toString("utf-8");
            console.log("[import] Decompressed CSV");
          } catch {
            csvText = buffer.toString("utf-8");
            console.log("[import] CSV was not gzipped, using raw text");
          }

          // Parse CSV and insert via Drizzle (safe parameterized queries)
          const lines = csvText.split("\n").filter(l => l.trim());
          if (lines.length < 2) throw new Error("CSV vacío o sin datos");
          const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
          console.log(`[import] Parsing ${lines.length - 1} rows...`);

          const BATCH_SIZE = 100;
          let insertedCount = 0;
          for (let i = 1; i < lines.length; i += BATCH_SIZE) {
            const batch = lines.slice(i, i + BATCH_SIZE);
            const valuesToInsert = batch.map(line => {
              const vals = line.split(",");
              const row: Record<string, any> = {};
              headers.forEach((h, idx) => { row[h] = vals[idx]?.trim() || null; });
              return {
                id: row.id || undefined,
                denueId: row.denue_id || null,
                nombreComercial: row.nombre_comercial || "Sin nombre",
                razonSocial: row.razon_social || null,
                actividadEconomica: row.actividad_economica || null,
                codigoScian: row.codigo_scian || null,
                tipoEstablecimiento: row.tipo_establecimiento || null,
                estratoPersonal: row.estrato_personal || null,
                empleadosMin: row.empleados_min ? Number(row.empleados_min) : null,
                empleadosMax: row.empleados_max ? Number(row.empleados_max) : null,
                telefono: row.telefono || null,
                correoElectronico: row.correo_electronico || null,
                sitioWeb: row.sitio_web || null,
                tipoVialidad: row.tipo_vialidad || null,
                calle: row.calle || null,
                numExterior: row.num_exterior || null,
                numInterior: row.num_interior || null,
                colonia: row.colonia || null,
                codigoPostal: row.codigo_postal || null,
                municipio: row.municipio || null,
                estado: row.estado || null,
                latitud: row.latitud || null,
                longitud: row.longitud || null,
                leadScore: row.lead_score ? Number(row.lead_score) : null,
                scoreDesglose: row.score_desglose || null,
                stage: row.stage || "contact",
                nomsAplicables: row.noms_aplicables || null,
                importBatchId: row.import_batch_id || null,
                zonaComercial: row.zona_comercial || null,
                prioridad: row.prioridad || null,
                empleadosEstimados: row.empleados_estimados ? Number(row.empleados_estimados) : null,
                potencialAportacionMensual: row.potencial_aportacion_mensual || null,
                nivelRiesgo: row.nivel_riesgo || null,
                grupoSector: row.grupo_sector || null,
                planRecomendado: row.plan_recomendado || null,
                direccionCompleta: row.direccion_completa || null,
              };
            }).filter(v => v.nombreComercial !== "Sin nombre" || v.razonSocial);

            if (valuesToInsert.length > 0) {
              await db.insert(empresasProspectos).values(valuesToInsert as any).onConflictDoNothing();
              insertedCount += valuesToInsert.length;
            }
            if (insertedCount % 5000 === 0) console.log(`[import] Inserted ${insertedCount} rows...`);
          }

          const countResult = await db.execute(sql`SELECT COUNT(*) as c FROM empresas_prospectos`);
          console.log(`[import] Done! Inserted ${insertedCount} rows. Total: ${(countResult as any).rows[0].c}`);
        } catch (err: any) {
          console.error(`[import] Error: ${err.message}`);
        }
      })();
    } catch (err) { next(err); }
  });

  app.post("/api/admin/bulk-migrate-prospectos", adminRateLimit, async (req, res, next) => {
    try {
      const authKey = req.headers["x-migrate-key"];
      if (!authKey || authKey !== getAdminApiKey()) return res.status(403).json({ message: "No autorizado" });
      const { rows } = req.body;
      if (!rows || !Array.isArray(rows) || rows.length === 0) return res.status(400).json({ message: "Sin datos" });
      if (rows.length > 50000) return res.status(400).json({ message: "Máximo 50,000 registros por lote" });

      // Sanitize string fields: truncate to max length, strip control characters
      const sanitizeStr = (val: any, maxLen: number): string | null => {
        if (val == null || val === "") return null;
        return String(val).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim().slice(0, maxLen) || null;
      };
      const sanitizeNum = (val: any): number | null => {
        if (val == null || val === "") return null;
        const n = Number(val);
        return isFinite(n) ? n : null;
      };

      let insertedCount = 0;
      const BATCH_SIZE = 100;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const valuesToInsert = batch.map((r: any) => ({
          id: r.id && /^[0-9a-f-]{36}$/i.test(r.id) ? r.id : undefined,
          denueId: sanitizeStr(r.denue_id, 50),
          nombreComercial: sanitizeStr(r.nombre_comercial, 500) || "Sin nombre",
          razonSocial: sanitizeStr(r.razon_social, 500),
          actividadEconomica: sanitizeStr(r.actividad_economica, 500),
          codigoScian: sanitizeStr(r.codigo_scian, 20),
          tipoEstablecimiento: sanitizeStr(r.tipo_establecimiento, 100),
          estratoPersonal: sanitizeStr(r.estrato_personal, 100),
          empleadosMin: sanitizeNum(r.empleados_min),
          empleadosMax: sanitizeNum(r.empleados_max),
          telefono: sanitizeStr(r.telefono, 20),
          correoElectronico: sanitizeStr(r.correo_electronico, 255),
          sitioWeb: sanitizeStr(r.sitio_web, 500),
          tipoVialidad: sanitizeStr(r.tipo_vialidad, 100),
          calle: sanitizeStr(r.calle, 300),
          numExterior: sanitizeStr(r.num_exterior, 50),
          numInterior: sanitizeStr(r.num_interior, 50),
          colonia: sanitizeStr(r.colonia, 200),
          codigoPostal: sanitizeStr(r.codigo_postal, 10),
          municipio: sanitizeStr(r.municipio, 200),
          estado: sanitizeStr(r.estado, 100),
          latitud: sanitizeStr(r.latitud, 20),
          longitud: sanitizeStr(r.longitud, 20),
          leadScore: sanitizeNum(r.lead_score) ?? 0,
          scoreDesglose: sanitizeStr(r.score_desglose, 1000),
          stage: sanitizeStr(r.stage, 50) || "nuevo",
          partnerId: sanitizeStr(r.partner_id, 100),
          nomsAplicables: sanitizeStr(r.noms_aplicables, 1000),
          fechaAlta: r.fecha_alta ? new Date(r.fecha_alta) : null,
          importBatchId: sanitizeStr(r.import_batch_id, 100),
          zonaComercial: sanitizeStr(r.zona_comercial, 200),
          prioridad: sanitizeStr(r.prioridad, 50),
          empleadosEstimados: sanitizeNum(r.empleados_estimados),
          potencialAportacionMensual: sanitizeNum(r.potencial_aportacion_mensual),
          nivelRiesgo: sanitizeStr(r.nivel_riesgo, 50),
          grupoSector: sanitizeStr(r.grupo_sector, 200),
          planRecomendado: sanitizeStr(r.plan_recomendado, 100),
          direccionCompleta: sanitizeStr(r.direccion_completa, 500),
        }));
        await db.insert(empresasProspectos).values(valuesToInsert as any).onConflictDoNothing();
        insertedCount += batch.length;
      }
      res.json({ ok: true, inserted: insertedCount });
    } catch (err) { next(err); }
  });
  app.get("/api/instructor-application/mine", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const [app] = await db.select().from(instructorApplications).where(eq(instructorApplications.userId, userId));
      if (!app) return res.json(null);
      res.json(app);
    } catch (err) { next(err); }
  });

  app.post("/api/instructor-application", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const [existing] = await db.select().from(instructorApplications).where(eq(instructorApplications.userId, userId));
      if (existing) return res.status(400).json({ message: "Ya tienes una solicitud activa" });

      const { type } = req.body;
      if (!["dc5", "internal"].includes(type)) return res.status(400).json({ message: "Tipo inválido" });

      const profile = await storage.getProfile(userId);
      const user = await storage.getUser(userId);

      const [application] = await db.insert(instructorApplications).values({
        userId,
        type,
        status: "draft",
        currentStep: 1,
        fullName: profile?.fullName || null,
        email: user?.email || null,
        quizMaxAttempts: type === "dc5" ? 3 : 3,
        quizPassingScore: type === "dc5" ? 70 : 60,
      }).returning();
      res.json(application);
    } catch (err) { next(err); }
  });

  app.patch("/api/instructor-application", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const [existing] = await db.select().from(instructorApplications).where(eq(instructorApplications.userId, userId));
      if (!existing) return res.status(404).json({ message: "Solicitud no encontrada" });
      if (existing.status === "active" || existing.status === "rejected") {
        return res.status(400).json({ message: "No se puede modificar esta solicitud" });
      }

      const allowedFields = [
        "currentStep", "fullName", "email", "phone", "specialty", "bio", "profileImageUrl", "linkedinUrl",
        "yearsExperience", "education", "certifications", "cvUrl", "areasExpertise", "teachingExperience",
        "bankName", "bankClabe", "rfc", "fiscalName", "fiscalRegime",
        "dc5PaymentMethod", "dc5PaymentReference", "dc5PaymentStatus",
      ];
      const updateData: Record<string, any> = { updatedAt: new Date() };
      for (const key of allowedFields) {
        if (req.body[key] !== undefined) updateData[key] = req.body[key];
      }

      const [updated] = await db.update(instructorApplications).set(updateData).where(eq(instructorApplications.id, existing.id)).returning();
      res.json(updated);
    } catch (err) { next(err); }
  });

  const INSTRUCTOR_QUIZ_DC5 = [
    { question: "¿Cuál es el objetivo principal de la NOM-035-STPS-2018?", options: ["Prevenir accidentes laborales", "Identificar y prevenir factores de riesgo psicosocial", "Regular el uso de EPP", "Establecer salarios mínimos"], correct: 1 },
    { question: "¿Qué documento acredita a un agente capacitador externo ante la STPS?", options: ["DC-1", "DC-3", "DC-5", "DC-4"], correct: 2 },
    { question: "¿Cuántas horas mínimas debe tener un curso para emitir DC-3?", options: ["10 horas", "20 horas", "No hay mínimo establecido", "40 horas"], correct: 2 },
    { question: "¿Qué es una competencia laboral según la STPS?", options: ["Un título universitario", "La capacidad productiva medida en términos de desempeño", "Una certificación internacional", "Un diploma de posgrado"], correct: 1 },
    { question: "¿Cuál es el formato oficial para constancias de competencias laborales?", options: ["DC-1", "DC-2", "DC-3", "DC-4"], correct: 2 },
    { question: "¿Qué ley regula la capacitación y adiestramiento en México?", options: ["Ley del ISR", "Ley Federal del Trabajo", "Ley General de Educación", "Ley de Comercio"], correct: 1 },
    { question: "¿Cada cuánto tiempo debe actualizarse el programa de capacitación de una empresa?", options: ["Cada 6 meses", "Cada año", "Cada 2 años", "Cada 5 años"], correct: 2 },
    { question: "¿Qué evalúa una Detección de Necesidades de Capacitación (DNC)?", options: ["El presupuesto disponible", "Las brechas entre competencias actuales y requeridas", "Los salarios del personal", "La productividad general"], correct: 1 },
    { question: "¿Cuál es la función del Comité Mixto de Capacitación?", options: ["Contratar instructores", "Vigilar la aplicación de los programas de capacitación", "Establecer horarios", "Administrar nómina"], correct: 1 },
    { question: "¿Qué NOM establece las condiciones de seguridad para el manejo de sustancias químicas?", options: ["NOM-005", "NOM-010", "NOM-017", "NOM-025"], correct: 1 },
    { question: "¿Cuál es el enfoque principal del modelo de competencias laborales?", options: ["Memorización de contenidos", "Desempeño demostrable en situaciones reales", "Acumulación de horas de capacitación", "Asistencia a cursos"], correct: 1 },
    { question: "¿Qué debe incluir una carta descriptiva para un curso de capacitación?", options: ["Solo el temario", "Objetivos, contenidos, técnicas didácticas y evaluación", "Solo la lista de asistencia", "El currículum del instructor"], correct: 1 },
    { question: "¿Cuál es la diferencia entre capacitación y adiestramiento?", options: ["No hay diferencia", "Capacitación es teórica, adiestramiento es práctico", "Adiestramiento es más costoso", "Capacitación solo es para gerentes"], correct: 1 },
    { question: "¿Qué técnica didáctica es más efectiva para habilidades manuales?", options: ["Conferencia magistral", "Lectura individual", "Demostración-ejecución", "Debate grupal"], correct: 2 },
    { question: "¿Qué porcentaje mínimo de asistencia se requiere normalmente para emitir un DC-3?", options: ["50%", "60%", "80%", "100%"], correct: 2 },
    { question: "¿Qué es la andragogía?", options: ["Enseñanza para niños", "Ciencia de la educación de adultos", "Método de evaluación", "Sistema de calificación"], correct: 1 },
    { question: "¿Cuál es el primer paso en el diseño instruccional ADDIE?", options: ["Diseño", "Implementación", "Análisis", "Evaluación"], correct: 2 },
    { question: "¿Qué tipo de evaluación mide el aprendizaje durante el proceso?", options: ["Evaluación diagnóstica", "Evaluación formativa", "Evaluación sumativa", "Evaluación externa"], correct: 1 },
    { question: "¿Qué NOM regula las condiciones de iluminación en centros de trabajo?", options: ["NOM-010", "NOM-017", "NOM-025", "NOM-030"], correct: 2 },
    { question: "¿Cuál es la responsabilidad principal del instructor durante la evaluación?", options: ["Reprobar al mayor número posible", "Verificar objetivamente el logro de competencias", "Facilitar todas las respuestas", "Solo registrar asistencia"], correct: 1 },
  ];

  const INSTRUCTOR_QUIZ_INTERNAL = [
    { question: "¿Cuál es el objetivo de un curso de inducción?", options: ["Evaluar conocimientos previos", "Integrar al nuevo trabajador a la empresa", "Certificar competencias", "Generar reportes"], correct: 1 },
    { question: "¿Qué elemento es esencial en un plan de capacitación?", options: ["Logo de la empresa", "Objetivos de aprendizaje claros", "Fotografías del instructor", "Lista de precios"], correct: 1 },
    { question: "¿Qué es el aprendizaje significativo?", options: ["Memorizar datos", "Relacionar nuevos conocimientos con experiencias previas", "Repetir conceptos", "Copiar información"], correct: 1 },
    { question: "¿Cuál es una buena práctica al iniciar una sesión de capacitación?", options: ["Ir directo al contenido", "Realizar una actividad de integración o diagnóstico", "Repartir el examen final", "Hablar del instructor"], correct: 1 },
    { question: "¿Qué recurso es más efectivo para capacitación técnica?", options: ["Solo presentaciones de texto", "Videos demostrativos y práctica guiada", "Lectura de manuales", "Conferencias largas"], correct: 1 },
    { question: "¿Cómo se mide la efectividad de una capacitación?", options: ["Por la cantidad de horas", "Por la mejora en el desempeño laboral", "Por el costo invertido", "Por el número de asistentes"], correct: 1 },
    { question: "¿Qué debe hacer un instructor ante una pregunta que no sabe responder?", options: ["Inventar una respuesta", "Ignorar la pregunta", "Reconocerlo y comprometerse a investigar", "Cambiar de tema"], correct: 2 },
    { question: "¿Cuál es la importancia del feedback en la capacitación?", options: ["No es importante", "Permite al participante conocer su progreso", "Solo sirve para calificar", "Es opcional"], correct: 1 },
    { question: "¿Qué característica debe tener un objetivo de aprendizaje?", options: ["Ser vago y general", "Ser medible, observable y alcanzable", "Ser largo y detallado", "Solo incluir el tema"], correct: 1 },
    { question: "¿Por qué es importante conocer a la audiencia antes de diseñar un curso?", options: ["No es necesario", "Para adaptar contenido, nivel y metodología", "Para decidir el horario", "Para elegir el salón"], correct: 1 },
  ];

  app.get("/api/instructor-application/quiz", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const [app] = await db.select().from(instructorApplications).where(eq(instructorApplications.userId, userId));
      if (!app) return res.status(404).json({ message: "Solicitud no encontrada" });

      const questions = app.type === "dc5" ? INSTRUCTOR_QUIZ_DC5 : INSTRUCTOR_QUIZ_INTERNAL;
      const sanitized = questions.map((q, i) => ({ index: i, question: q.question, options: q.options }));
      res.json({
        questions: sanitized,
        totalQuestions: questions.length,
        passingScore: app.quizPassingScore,
        attemptsUsed: app.quizAttempts || 0,
        maxAttempts: app.quizMaxAttempts,
        passed: app.quizPassed,
        lastScore: app.quizScore,
        lastAttemptAt: app.quizLastAttemptAt,
      });
    } catch (err) { next(err); }
  });

  app.post("/api/instructor-application/quiz", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const [app] = await db.select().from(instructorApplications).where(eq(instructorApplications.userId, userId));
      if (!app) return res.status(404).json({ message: "Solicitud no encontrada" });
      if (app.quizPassed) return res.status(400).json({ message: "Ya aprobaste la evaluación" });
      if ((app.quizAttempts || 0) >= (app.quizMaxAttempts || 3)) {
        return res.status(400).json({ message: "Has agotado tus intentos" });
      }

      if (app.quizLastAttemptAt) {
        const cooldownMs = 24 * 60 * 60 * 1000;
        const timeSince = Date.now() - new Date(app.quizLastAttemptAt).getTime();
        if (timeSince < cooldownMs && (app.quizAttempts || 0) > 0) {
          const remainingHours = Math.ceil((cooldownMs - timeSince) / (60 * 60 * 1000));
          return res.status(400).json({ message: `Debes esperar ${remainingHours} horas antes de intentar de nuevo` });
        }
      }

      const { answers } = req.body;
      const questions = app.type === "dc5" ? INSTRUCTOR_QUIZ_DC5 : INSTRUCTOR_QUIZ_INTERNAL;
      if (!Array.isArray(answers) || answers.length !== questions.length) {
        return res.status(400).json({ message: "Respuestas inválidas" });
      }

      let correctCount = 0;
      for (let i = 0; i < questions.length; i++) {
        if (answers[i] === questions[i].correct) correctCount++;
      }
      const score = Math.round((correctCount / questions.length) * 100);
      const passed = score >= (app.quizPassingScore || 70);

      const [updated] = await db.update(instructorApplications).set({
        quizScore: score,
        quizAttempts: (app.quizAttempts || 0) + 1,
        quizLastAttemptAt: new Date(),
        quizPassed: passed,
        quizAnswers: answers,
        updatedAt: new Date(),
      }).where(eq(instructorApplications.id, app.id)).returning();

      res.json({
        score,
        passed,
        correctCount,
        totalQuestions: questions.length,
        attemptsUsed: updated.quizAttempts,
        maxAttempts: updated.quizMaxAttempts,
      });
    } catch (err) { next(err); }
  });

  app.post("/api/instructor-application/accept-terms", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const [app] = await db.select().from(instructorApplications).where(eq(instructorApplications.userId, userId));
      if (!app) return res.status(404).json({ message: "Solicitud no encontrada" });

      const { codeOfConduct, contentPolicy, revenueShare } = req.body;
      if (!codeOfConduct || !contentPolicy || !revenueShare) {
        return res.status(400).json({ message: "Debes aceptar todos los términos" });
      }

      const crypto = await import("crypto");
      const termsText = `terms_accepted:${userId}:${new Date().toISOString()}:code_of_conduct:content_policy:revenue_share`;
      const hash = crypto.createHash("sha256").update(termsText).digest("hex");

      const [updated] = await db.update(instructorApplications).set({
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        termsAcceptanceHash: hash,
        termsCodeOfConduct: true,
        termsContentPolicy: true,
        termsRevenueShare: true,
        updatedAt: new Date(),
      }).where(eq(instructorApplications.id, app.id)).returning();

      res.json(updated);
    } catch (err) { next(err); }
  });

  app.post("/api/instructor-application/submit", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const [app] = await db.select().from(instructorApplications).where(eq(instructorApplications.userId, userId));
      if (!app) return res.status(404).json({ message: "Solicitud no encontrada" });

      if (!app.quizPassed) return res.status(400).json({ message: "Debes aprobar la evaluación primero" });
      if (!app.termsAccepted) return res.status(400).json({ message: "Debes aceptar los términos" });

      let newStatus: string;
      if (app.type === "internal") {
        newStatus = "active";
        const [membership] = await db.select().from(cooperativeMemberships).where(eq(cooperativeMemberships.userId, userId));
        const instructorNumber = membership?.membershipNumber || null;
        const [existing] = await db.select().from(instructorProfiles).where(eq(instructorProfiles.id, userId));
        if (!existing) {
          await db.insert(instructorProfiles).values({
            id: userId,
            bio: app.bio,
            specialty: app.specialty,
            profileImageUrl: app.profileImageUrl,
            verified: true,
            verifiedAt: new Date(),
            instructorBadgeType: "interno",
          });
        } else {
          await db.update(instructorProfiles).set({
            instructorBadgeType: "interno",
          }).where(eq(instructorProfiles.id, userId));
        }
        await db.update(accounts).set({ isInstructor: true, userRole: "socio_instructor", updatedAt: new Date() }).where(eq(accounts.id, userId));
        await db.update(instructorApplications).set({
          status: "active",
          instructorNumber,
          activatedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(instructorApplications.id, app.id));
        createOrUpdateContactCard(userId, { title: "Instructor Interno", avatarUrl: app.profileImageUrl || undefined }).catch(() => {});
        const [result] = await db.select().from(instructorApplications).where(eq(instructorApplications.id, app.id));
        return res.json(result);
      } else {
        newStatus = "pending_dc5";
        const [updated] = await db.update(instructorApplications).set({
          status: newStatus as any,
          updatedAt: new Date(),
        }).where(eq(instructorApplications.id, app.id)).returning();
        return res.json(updated);
      }
    } catch (err) { next(err); }
  });

  app.patch("/api/instructor-onboarding/step", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const { step } = req.body;
      if (typeof step !== "number" || step < 0 || step > 5) {
        return res.status(400).json({ message: "Paso inválido" });
      }
      await db.update(accounts).set({
        instructorOnboardingStep: step,
        updatedAt: new Date(),
      }).where(eq(accounts.id, userId));
      return res.json({ step });
    } catch (err) { next(err); }
  });

  app.get("/api/instructor-onboarding/step", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const [account] = await db.select({ step: accounts.instructorOnboardingStep }).from(accounts).where(eq(accounts.id, userId));
      return res.json({ step: account?.step ?? 0 });
    } catch (err) { next(err); }
  });

  app.get("/api/admin/instructor-applications", requireAdmin, async (req, res, next) => {
    try {
      const { status, type } = req.query;
      let query = db.select({
        application: instructorApplications,
        userEmail: users.email,
      }).from(instructorApplications)
        .innerJoin(users, eq(instructorApplications.userId, users.id))
        .orderBy(desc(instructorApplications.createdAt));

      const conditions: SQL[] = [];
      if (status && typeof status === "string") {
        conditions.push(eq(instructorApplications.status, status as any));
      }
      if (type && typeof type === "string") {
        conditions.push(eq(instructorApplications.type, type as any));
      }

      let results;
      if (conditions.length > 0) {
        results = await query.where(and(...conditions));
      } else {
        results = await query;
      }

      res.json(results.map(r => ({ ...r.application, userEmail: r.userEmail })));
    } catch (err) { next(err); }
  });

  app.patch("/api/admin/instructor-applications/:id", requireAdmin, async (req, res, next) => {
    try {
      const { id } = req.params as Record<string, string>;
      const { action, notes } = req.body;
      const adminUserId = req.supabaseUserId!;

      const [app] = await db.select().from(instructorApplications).where(eq(instructorApplications.id, id));
      if (!app) return res.status(404).json({ message: "Solicitud no encontrada" });

      const reviewableStatuses = ["pending_review", "pending_dc5"];
      if (!reviewableStatuses.includes(app.status)) {
        return res.status(400).json({ message: `No se puede ${action === "approve" ? "aprobar" : "rechazar"} una solicitud con estado "${app.status}"` });
      }

      if (action === "approve") {
        if (!app.quizPassed) return res.status(400).json({ message: "El solicitante no ha aprobado la evaluación" });
        if (!app.termsAccepted) return res.status(400).json({ message: "El solicitante no ha aceptado los términos" });
        const [membership] = await db.select().from(cooperativeMemberships).where(eq(cooperativeMemberships.userId, app.userId));
        const instructorNumber = membership?.membershipNumber || null;
        const badgeType = app.type === "dc5" ? "acreditado_dc5" as const : "interno" as const;

        const [existing] = await db.select().from(instructorProfiles).where(eq(instructorProfiles.id, app.userId));
        if (!existing) {
          await db.insert(instructorProfiles).values({
            id: app.userId,
            bio: app.bio,
            specialty: app.specialty,
            profileImageUrl: app.profileImageUrl,
            bankName: app.bankName,
            bankClabe: app.bankClabe,
            verified: true,
            verifiedAt: new Date(),
            instructorBadgeType: badgeType,
          });
        } else {
          await db.update(instructorProfiles).set({
            verified: true,
            verifiedAt: new Date(),
            bio: app.bio || existing.bio,
            specialty: app.specialty || existing.specialty,
            instructorBadgeType: badgeType,
          }).where(eq(instructorProfiles.id, app.userId));
        }

        await db.update(accounts).set({ isInstructor: true, userRole: "socio_instructor", updatedAt: new Date() }).where(eq(accounts.id, app.userId));

        const [updated] = await db.update(instructorApplications).set({
          status: "active",
          adminNotes: notes || null,
          reviewedBy: adminUserId,
          reviewedAt: new Date(),
          instructorNumber,
          activatedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(instructorApplications.id, id)).returning();
        const instructorTitle = app.type === "dc5" ? "Instructor Acreditado STPS (DC-5)" : "Instructor Interno";
        createOrUpdateContactCard(app.userId, { title: instructorTitle, avatarUrl: app.profileImageUrl || undefined }).catch(() => {});
        res.json(updated);
      } else if (action === "reject") {
        const [updated] = await db.update(instructorApplications).set({
          status: "rejected",
          adminNotes: notes || null,
          reviewedBy: adminUserId,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(instructorApplications.id, id)).returning();
        res.json(updated);
      } else {
        res.status(400).json({ message: "Acción inválida" });
      }
    } catch (err) { next(err); }
  });
}
