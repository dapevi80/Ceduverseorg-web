import type { Express } from "express";
import { requireAuth } from "../auth";
import { storage } from "../storage";
import { db } from "../db";
import multer from "multer";
import {
  employeeInvitations,
  samRequests,
  teamUsers,
  teams,
  accounts,
  users,
  profiles,
  referralCodes,
  monthlyContributions,
  invoices,
  courseUsers,
  achievementUsers,
} from "@shared/schema";
import { eq, and, or, sql, desc } from "drizzle-orm";
import * as facturapi from "../services/facturapi";
import { sendEmployeeInvitationEmail, sendSamPartnerNotificationEmail } from "../email";
import crypto from "crypto";
import { determinePlan, UMA_VALUE_2026 } from "./admin";

/**
 * Variante ESTRICTA para las rutas de evidencia del playbook (fotos del lugar
 * de trabajo de los alumnos).
 *
 * getEmpresaTeam (abajo) tiene una regla heredada: si no hay membresía de
 * admin/empresa_rh, se conforma con que accounts.userRole diga "empresa" y
 * devuelve CUALQUIER equipo del usuario, con el rol que sea. Eso está bien para
 * los paneles administrativos que ya la usan, pero no para material privado de
 * terceros: bastaría ser miembro raso de un equipo para alcanzar las fotos de
 * sus compañeros. Aquí se exige membresía real de admin o empresa_rh.
 *
 * Decisión del dueño del producto (2026-07-18): apretar SÓLO en evidencia, sin
 * cambiar getEmpresaTeam, para no dejar fuera a usuarios de empresa que hoy sí
 * entran a los otros ocho endpoints que dependen de ella.
 *
 * orderBy fija el equipo elegido cuando alguien es admin de varios (antes era
 * el orden que la base quisiera devolver).
 */
export async function getEmpresaAdminTeam(userId: string) {
  const [membership] = await db.select({ teamId: teamUsers.teamId })
    .from(teamUsers)
    .where(and(
      eq(teamUsers.userId, userId),
      or(eq(teamUsers.role, "admin"), eq(teamUsers.role, "empresa_rh"))
    ))
    .orderBy(teamUsers.teamId)
    .limit(1);
  if (!membership) return null;
  const [team] = await db.select().from(teams).where(eq(teams.id, membership.teamId));
  return team || null;
}

export async function getEmpresaTeam(userId: string) {
  const membership = await db.select({ teamId: teamUsers.teamId, role: teamUsers.role })
    .from(teamUsers)
    .where(and(
      eq(teamUsers.userId, userId),
      or(eq(teamUsers.role, "admin"), eq(teamUsers.role, "empresa_rh"))
    ));
  if (membership.length === 0) {
    const [account] = await db.select({ userRole: accounts.userRole })
      .from(accounts).where(eq(accounts.id, userId));
    if (account && (account.userRole === "empresa" || account.userRole === "empresa_rh")) {
      const anyMembership = await db.select({ teamId: teamUsers.teamId })
        .from(teamUsers).where(eq(teamUsers.userId, userId)).limit(1);
      if (anyMembership.length > 0) {
        const team = await db.select().from(teams).where(eq(teams.id, anyMembership[0].teamId));
        return team[0] || null;
      }
    }
    return null;
  }
  const team = await db.select().from(teams).where(eq(teams.id, membership[0].teamId));
  return team[0] || null;
}

export function registerEmpresaRoutes(app: Express) {
  app.get("/api/empresa/invoices", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const userTeams = await db.select({ teamId: teamUsers.teamId })
        .from(teamUsers).where(eq(teamUsers.userId, userId));
      if (!userTeams.length) return res.json([]);

      const teamIds = userTeams.map(t => t.teamId);
      const rows = await db.select().from(invoices)
        .where(sql`${invoices.teamId} = ANY(${teamIds})`)
        .orderBy(desc(invoices.createdAt))
        .limit(100);
      res.json(rows);
    } catch (err) { next(err); }
  });

  app.get("/api/empresa/invoices/:id/download/:format", requireAuth, async (req, res, next) => {
    try {
      const format = (req.params.format as string) as "pdf" | "xml";
      if (!["pdf", "xml"].includes(format)) return res.status(400).json({ message: "Formato inválido" });

      const userId = req.supabaseUserId!;
      const [invoice] = await db.select().from(invoices).where(eq(invoices.id, (req.params.id as string)));
      if (!invoice) return res.status(404).json({ message: "Factura no encontrada" });

      const userTeams = await db.select({ teamId: teamUsers.teamId })
        .from(teamUsers).where(and(eq(teamUsers.userId, userId), eq(teamUsers.teamId, invoice.teamId)));
      if (!userTeams.length) return res.status(403).json({ message: "Sin acceso" });

      if (!invoice.facturapiInvoiceId || !facturapi.isConfigured()) {
        return res.status(400).json({ message: "Factura no disponible para descarga" });
      }

      const buffer = await facturapi.downloadInvoice(invoice.facturapiInvoiceId, format);
      const contentType = format === "pdf" ? "application/pdf" : "application/xml";
      const filename = `CFDI-${invoice.cfdiUuid || invoice.id}.${format}`;
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (err) { next(err); }
  });
  const excelUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

  app.get("/api/empresa/invitations/template", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const team = await getEmpresaTeam(userId);
      if (!team) return res.status(403).json({ message: "No tienes una organización" });

      const ExcelJS = await import("exceljs");
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Empleados");
      const templateRows = [
        ["CEDUVERSE — Carga Masiva de Empleados"],
        [`Empresa: ${team.name}`],
        ["Instrucciones: Complete una fila por empleado. Los campos marcados con * son obligatorios."],
        ["IMPORTANTE: No modifique los encabezados de las columnas."],
        [],
        ["Nombre *", "Apellido", "Email *", "Puesto", "Departamento"],
        ["Juan", "Pérez", "juan@ejemplo.com", "Analista", "Tecnología"],
      ];
      templateRows.forEach(row => ws.addRow(row));
      ws.columns = [{ width: 22 }, { width: 22 }, { width: 32 }, { width: 22 }, { width: 22 }];
      ws.mergeCells(1, 1, 1, 5);
      ws.mergeCells(2, 1, 2, 5);
      ws.mergeCells(3, 1, 3, 5);
      ws.mergeCells(4, 1, 4, 5);
      const buf = await wb.xlsx.writeBuffer();
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="plantilla-empleados-${team.id}.xlsx"`);
      res.send(Buffer.from(buf as ArrayBuffer));
    } catch (err) { next(err); }
  });

  app.post("/api/empresa/invitations/upload", requireAuth, excelUpload.single("file"), async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const team = await getEmpresaTeam(userId);
      if (!team) return res.status(403).json({ message: "No tienes una organización" });

      if (!req.file) return res.status(400).json({ message: "Archivo requerido" });

      const ExcelJS = await import("exceljs");
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(req.file.buffer);
      const ws = wb.worksheets[0];
      const rawData: any[][] = [];
      ws.eachRow({ includeEmpty: false }, (row) => {
        rawData.push((row.values as any[]).slice(1));
      });

      let headerRowIdx = rawData.findIndex(row =>
        row.some((cell: any) => typeof cell === "string" && cell.toLowerCase().includes("email"))
      );
      if (headerRowIdx === -1) return res.status(400).json({ message: "No se encontró la fila de encabezados con 'Email'" });

      const headerRow = rawData[headerRowIdx].map((h: any) => String(h || "").toLowerCase().trim());
      const emailIdx = headerRow.findIndex((h: string) => h.startsWith("email") || h === "correo");
      const nombreIdx = headerRow.findIndex((h: string) => h.startsWith("nombre") || h === "name");
      const apellidoIdx = headerRow.findIndex((h: string) => h.startsWith("apellido") || h === "last name" || h === "apellidos");
      const puestoIdx = headerRow.findIndex((h: string) => h.startsWith("puesto") || h === "position" || h === "cargo");
      const deptoIdx = headerRow.findIndex((h: string) => h.startsWith("departamento") || h === "department" || h === "área");

      if (emailIdx === -1) return res.status(400).json({ message: "La columna 'Email' es requerida" });

      const dataRows = rawData.slice(headerRowIdx + 1).filter(row => row.length > 0 && row.some((cell: any) => cell));

      const existingEmails = new Set(
        (await db.select({ email: employeeInvitations.email })
          .from(employeeInvitations)
          .where(eq(employeeInvitations.teamId, team.id)))
          .map(r => r.email.toLowerCase())
      );

      const existingUsers = new Set(
        (await db.select({ email: users.email }).from(users)).map(r => r.email.toLowerCase())
      );

      const referralCode = (await db.select({ code: referralCodes.code })
        .from(referralCodes)
        .where(eq(referralCodes.ownerId, team.partnerId || userId))
        .limit(1))[0]?.code || null;

      const results: { row: number; nombre: string; email: string; status: string; reason: string }[] = [];
      let successCount = 0;
      const baseUrl = `${req.protocol}://${req.get("host")}`;

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const email = String(row[emailIdx] || "").trim().toLowerCase();
        const nombre = String(row[nombreIdx >= 0 ? nombreIdx : 0] || "").trim();
        const apellido = apellidoIdx >= 0 ? String(row[apellidoIdx] || "").trim() : "";
        const puesto = puestoIdx >= 0 ? String(row[puestoIdx] || "").trim() : "";
        const depto = deptoIdx >= 0 ? String(row[deptoIdx] || "").trim() : "";

        if (!email || !email.includes("@")) {
          results.push({ row: i + 1, nombre, email, status: "error", reason: "Email inválido o vacío" });
          continue;
        }

        if (!nombre) {
          results.push({ row: i + 1, nombre: "", email, status: "error", reason: "Nombre vacío" });
          continue;
        }

        if (existingEmails.has(email)) {
          results.push({ row: i + 1, nombre, email, status: "error", reason: "Ya tiene invitación" });
          continue;
        }

        if (existingUsers.has(email)) {
          results.push({ row: i + 1, nombre, email, status: "error", reason: "Usuario ya registrado" });
          continue;
        }

        const token = crypto.randomBytes(24).toString("hex");
        await db.insert(employeeInvitations).values({
          teamId: team.id,
          email,
          nombre,
          apellido: apellido || null,
          puesto: puesto || null,
          departamento: depto || null,
          token,
          referralCode: referralCode || null,
          status: "pending",
        });

        existingEmails.add(email);

        const inviteUrl = `${baseUrl}/auth?ref=${referralCode || ""}&invite=${token}`;
        sendEmployeeInvitationEmail(email, nombre, team.name, inviteUrl).catch(err =>
          console.error(`[invite] Failed to send email to ${email}:`, err.message)
        );

        results.push({ row: i + 1, nombre, email, status: "ok", reason: "Invitación enviada" });
        successCount++;
      }

      res.json({ total: dataRows.length, success: successCount, errors: dataRows.length - successCount, results });
    } catch (err) { next(err); }
  });

  app.get("/api/empresa/invitations", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const team = await getEmpresaTeam(userId);
      if (!team) return res.status(403).json({ message: "No tienes una organización" });

      const invitations = await db.select().from(employeeInvitations)
        .where(eq(employeeInvitations.teamId, team.id))
        .orderBy(desc(employeeInvitations.createdAt));

      res.json(invitations);
    } catch (err) { next(err); }
  });

  app.post("/api/empresa/invitations/:id/resend", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const team = await getEmpresaTeam(userId);
      if (!team) return res.status(403).json({ message: "No tienes una organización" });

      const [invitation] = await db.select().from(employeeInvitations)
        .where(and(eq(employeeInvitations.id, (req.params.id as string)), eq(employeeInvitations.teamId, team.id)));

      if (!invitation) return res.status(404).json({ message: "Invitación no encontrada" });
      if (invitation.status !== "pending") return res.status(400).json({ message: "Solo se pueden reenviar invitaciones pendientes" });

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const inviteUrl = `${baseUrl}/auth?ref=${invitation.referralCode || ""}&invite=${invitation.token}`;
      await sendEmployeeInvitationEmail(invitation.email, invitation.nombre, team.name, inviteUrl);

      res.json({ message: "Invitación reenviada" });
    } catch (err) { next(err); }
  });

  app.get("/api/empresa/sam/template", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const team = await getEmpresaTeam(userId);
      if (!team) return res.status(403).json({ message: "No tienes una organización" });

      const members = await db.select({
        userId: teamUsers.userId,
        role: teamUsers.role,
      }).from(teamUsers).where(eq(teamUsers.teamId, team.id));

      const memberData: { nombre: string; email: string; progreso: number; cursosCompletados: number; dc3: string }[] = [];

      for (const m of members) {
        const [profile] = await db.select().from(profiles).where(eq(profiles.id, m.userId));
        const [user] = await db.select().from(users).where(eq(users.id, m.userId));
        const userCourses = await db.select().from(courseUsers).where(eq(courseUsers.userId, m.userId));
        const completedCount = userCourses.filter(c => c.completed >= 100).length;
        const avgProgress = userCourses.length > 0 ? Math.round(userCourses.reduce((s, c) => s + c.completed, 0) / userCourses.length) : 0;

        const dc3Certs = await db.select().from(achievementUsers)
          .where(and(eq(achievementUsers.userId, m.userId), eq(achievementUsers.certType, "dc3"), eq(achievementUsers.status, "active")));

        memberData.push({
          nombre: profile?.fullName || user?.email?.split("@")[0] || "Sin nombre",
          email: user?.email || "",
          progreso: avgProgress,
          cursosCompletados: completedCount,
          dc3: dc3Certs.length > 0 ? "Sí" : "No",
        });
      }

      const now = new Date();
      const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

      const ExcelJS = await import("exceljs");
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("SAM");
      const samRows: any[][] = [
        ["CEDUVERSE — Solicitud SAM Mensual"],
        [`Empresa: ${team.name}`],
        [`Periodo: ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`],
        [`Generado: ${now.toLocaleDateString("es-MX")} | Total empleados: ${memberData.length}`],
        ["IMPORTANTE: No modifique los encabezados. Revise y firme antes de subir."],
        [],
        ["Nombre", "Email", "Progreso (%)", "Cursos Completados", "DC-3 Obtenido"],
        ...memberData.map(m => [m.nombre, m.email, m.progreso, m.cursosCompletados, m.dc3]),
      ];
      samRows.forEach(row => ws.addRow(row));
      ws.columns = [{ width: 28 }, { width: 32 }, { width: 15 }, { width: 22 }, { width: 16 }];
      ws.mergeCells(1, 1, 1, 5);
      ws.mergeCells(2, 1, 2, 5);
      ws.mergeCells(3, 1, 3, 5);
      ws.mergeCells(4, 1, 4, 5);
      ws.mergeCells(5, 1, 5, 5);
      const buf = await wb.xlsx.writeBuffer();
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="SAM-${team.id}-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.xlsx"`);
      res.send(Buffer.from(buf as ArrayBuffer));
    } catch (err) { next(err); }
  });

  app.post("/api/empresa/sam/upload", requireAuth, excelUpload.single("file"), async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const team = await getEmpresaTeam(userId);
      if (!team) return res.status(403).json({ message: "No tienes una organización" });

      if (!req.file) return res.status(400).json({ message: "Archivo requerido" });

      const ExcelJS = await import("exceljs");
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(req.file.buffer);
      const ws = wb.worksheets[0];
      const rawData: any[][] = [];
      ws.eachRow({ includeEmpty: false }, (row) => {
        rawData.push((row.values as any[]).slice(1));
      });

      let headerIdx = rawData.findIndex(row =>
        row.some((cell: any) => typeof cell === "string" && (cell.toLowerCase().includes("email") || cell.toLowerCase().includes("nombre")))
      );

      const dataRows = headerIdx >= 0 ? rawData.slice(headerIdx + 1).filter(r => r.length > 0 && r.some((c: any) => c)) : [];
      const dataCount = dataRows.length;

      const teamMembers = await db.select({ email: users.email })
        .from(teamUsers)
        .innerJoin(users, eq(teamUsers.userId, users.id))
        .where(eq(teamUsers.teamId, team.id));
      const teamEmails = new Set(teamMembers.map(m => m.email.toLowerCase()));

      if (headerIdx < 0) {
        return res.status(400).json({ message: "Archivo inválido: no se encontró la fila de encabezados (debe incluir columnas como 'Nombre', 'Email')" });
      }

      const headerRow = rawData[headerIdx];
      const emailColIdx = headerRow.findIndex((cell: any) => typeof cell === "string" && cell.toLowerCase().includes("email"));

      if (emailColIdx < 0) {
        return res.status(400).json({ message: "Archivo inválido: no se encontró la columna 'Email'. Use la plantilla proporcionada." });
      }

      const nonTeamEmails: string[] = [];
      for (const row of dataRows) {
        const email = row[emailColIdx]?.toString()?.trim()?.toLowerCase();
        if (email && !teamEmails.has(email)) {
          nonTeamEmails.push(email);
        }
      }

      if (nonTeamEmails.length > 0) {
        return res.status(400).json({
          message: `Archivo rechazado: ${nonTeamEmails.length} correo(s) no pertenecen al equipo`,
          invalidEmails: nonTeamEmails,
        });
      }

      const now = new Date();
      const periodYear = now.getFullYear();
      const periodMonth = now.getMonth() + 1;

      const originalName = req.file.originalname || `sam_${periodYear}_${periodMonth}.xlsx`;
      const fileDataUri = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;name=${encodeURIComponent(originalName)};base64,${req.file.buffer.toString("base64")}`;

      const [existingReq] = await db.select().from(samRequests)
        .where(and(
          eq(samRequests.teamId, team.id),
          eq(samRequests.periodYear, periodYear),
          eq(samRequests.periodMonth, periodMonth),
        ));

      if (existingReq) {
        await db.update(samRequests)
          .set({
            employeeCount: dataCount,
            fileUrl: fileDataUri,
            status: "pending",
            submittedBy: userId,
            updatedAt: now,
          })
          .where(eq(samRequests.id, existingReq.id));
      } else {
        await db.insert(samRequests).values({
          teamId: team.id,
          periodYear,
          periodMonth,
          employeeCount: dataCount,
          fileUrl: fileDataUri,
          status: "pending",
          submittedBy: userId,
        });
      }

      const [existingContrib] = await db.select().from(monthlyContributions)
        .where(and(
          eq(monthlyContributions.teamId, team.id),
          eq(monthlyContributions.periodYear, periodYear),
          eq(monthlyContributions.periodMonth, periodMonth),
        ));

      if (existingContrib) {
        await db.update(monthlyContributions)
          .set({ activeCollaborators: dataCount, status: "pending" })
          .where(eq(monthlyContributions.id, existingContrib.id));
      } else {
        const UMA_VALUE_2026 = "113.14";
        const { plan, umas, feePercent } = determinePlan(dataCount);
        const umaVal = parseFloat(UMA_VALUE_2026);
        const gross = dataCount * umas * umaVal;
        const fee = gross * (feePercent / 100);
        const net = gross - fee;
        const dueDate = new Date(periodYear, periodMonth - 1, 15);

        await db.insert(monthlyContributions).values({
          teamId: team.id,
          periodYear,
          periodMonth,
          planType: plan,
          umasPerCol: umas,
          umaValue: UMA_VALUE_2026,
          activeCollaborators: dataCount,
          grossAmount: gross.toFixed(2),
          feePercentage: feePercent.toFixed(2),
          feeAmount: fee.toFixed(2),
          netToCooperative: net.toFixed(2),
          status: "pending",
          paymentStatus: "unpaid",
          cfdiStatus: "pending",
          dueDate,
        });
      }

      const adminUsers = await db.select({ email: users.email })
        .from(users)
        .innerJoin(accounts, eq(users.id, accounts.id))
        .where(eq(accounts.userRole, "admin"));

      const MONTH_NAMES_FULL = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      for (const admin of adminUsers) {
        sendSamPartnerNotificationEmail(
          admin.email,
          team.name,
          MONTH_NAMES_FULL[periodMonth - 1],
          periodYear,
          "0",
          0,
        ).catch(err => console.error("[sam-upload] Notification error:", err.message));
      }

      res.json({
        message: "Solicitud SAM registrada",
        employeeCount: dataCount,
        periodYear,
        periodMonth,
      });
    } catch (err) { next(err); }
  });

  app.get("/api/empresa/sam/status", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const team = await getEmpresaTeam(userId);
      if (!team) return res.status(403).json({ message: "No tienes una organización" });

      const now = new Date();
      const [current] = await db.select().from(samRequests)
        .where(and(
          eq(samRequests.teamId, team.id),
          eq(samRequests.periodYear, now.getFullYear()),
          eq(samRequests.periodMonth, now.getMonth() + 1),
        ));

      const [contribution] = await db.select({
        paymentStatus: monthlyContributions.paymentStatus,
        status: monthlyContributions.status,
      }).from(monthlyContributions)
        .where(and(
          eq(monthlyContributions.teamId, team.id),
          eq(monthlyContributions.periodYear, now.getFullYear()),
          eq(monthlyContributions.periodMonth, now.getMonth() + 1),
        ));

      if (!current && !contribution) {
        return res.json(null);
      }

      const displayStatus = contribution?.paymentStatus === "paid"
        ? "pagada"
        : current?.status || "sin_enviar";

      res.json({
        ...(current || {}),
        displayStatus,
        contributionStatus: contribution?.status || null,
        paymentStatus: contribution?.paymentStatus || null,
      });
    } catch (err) { next(err); }
  });

  app.get("/api/invitations/validate/:token", async (req, res, next) => {
    try {
      const [invitation] = await db.select().from(employeeInvitations)
        .where(eq(employeeInvitations.token, (req.params.token as string)));

      if (!invitation) return res.status(404).json({ message: "Invitación no encontrada" });
      if (invitation.status !== "pending") return res.status(400).json({ message: "Invitación ya utilizada o expirada" });

      const [team] = await db.select().from(teams).where(eq(teams.id, invitation.teamId));

      res.json({
        nombre: invitation.nombre,
        apellido: invitation.apellido || "",
        email: invitation.email,
        teamName: team?.name || "",
        referralCode: invitation.referralCode || "",
      });
    } catch (err) { next(err); }
  });

  app.post("/api/invitations/accept/:token", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const [invitation] = await db.select().from(employeeInvitations)
        .where(eq(employeeInvitations.token, (req.params.token as string)));

      if (!invitation) return res.status(404).json({ message: "Invitación no encontrada" });
      if (invitation.status !== "pending") return res.status(400).json({ message: "Invitación ya utilizada" });

      const [authUser] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId));
      if (!authUser || authUser.email.toLowerCase() !== invitation.email.toLowerCase()) {
        return res.status(403).json({ message: "Esta invitación no corresponde a tu correo electrónico" });
      }

      await db.update(employeeInvitations)
        .set({ status: "accepted" })
        .where(eq(employeeInvitations.id, invitation.id));

      const existingMembership = await db.select().from(teamUsers)
        .where(and(eq(teamUsers.teamId, invitation.teamId), eq(teamUsers.userId, userId)));

      if (existingMembership.length === 0) {
        await db.insert(teamUsers).values({
          teamId: invitation.teamId,
          userId,
          role: "member",
        }).onConflictDoNothing();
      }

      if (invitation.referralCode) {
        await db.update(accounts)
          .set({ referredBy: invitation.referralCode })
          .where(eq(accounts.id, userId));
      }

      res.json({ message: "Invitación aceptada", teamId: invitation.teamId });
    } catch (err) { next(err); }
  });
}
