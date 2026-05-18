import type { Express } from "express";
import { requireAuth, requireAdmin } from "../auth";
import { db } from "../db";
import {
  cooperativeMemberships,
  accounts,
  users,
  profiles,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { createOrUpdateContactCard } from "./helpers";

export function registerMembershipRoutes(app: Express) {
  app.get("/api/membership/me", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const [membership] = await db.select().from(cooperativeMemberships).where(eq(cooperativeMemberships.userId, userId));
      if (!membership) return res.json(null);
      const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId));
      res.json({ ...membership, country: profile?.country || null, phone: profile?.phoneNumber || null });
    } catch (err) { next(err); }
  });

  app.post("/api/membership/join", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const [existing] = await db.select().from(cooperativeMemberships).where(eq(cooperativeMemberships.userId, userId));
      if (existing) return res.json(existing);

      const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId));
      const [user] = await db.select().from(users).where(eq(users.id, userId));

      const { generateMembershipCode } = await import("../seed-terms");
      const membershipNumber = await generateMembershipCode();

      const acceptanceData = `${user.email}|${profile?.fullName || ''}|${new Date().toISOString()}|accepted_statutes`;
      const crypto = await import("crypto");
      const acceptanceHash = crypto.createHash('sha256').update(acceptanceData).digest('hex');

      const [membership] = await db.insert(cooperativeMemberships).values({
        userId,
        fullName: profile?.fullName || user.email.split('@')[0],
        email: user.email,
        membershipNumber,
        membershipType: "consumo",
        status: "activo",
        acceptedStatutes: true,
        acceptanceHash,
        acceptanceIp: (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown'),
        acceptanceUserAgent: req.headers['user-agent'] || 'unknown',
      }).returning();

      await db.update(accounts)
        .set({ referralCode: membershipNumber })
        .where(eq(accounts.id, userId));

      createOrUpdateContactCard(userId, { title: "Socio Cooperativo" }).catch(() => {});

      res.json(membership);
    } catch (err) { next(err); }
  });

  app.get("/api/verify/socio/:numero", async (req, res, next) => {
    try {
      const { numero } = req.params as Record<string, string>;
      const [membership] = await db.select().from(cooperativeMemberships).where(eq(cooperativeMemberships.membershipNumber, numero.toUpperCase()));
      if (!membership) return res.status(404).json({ valid: false, message: "Número de membresía no encontrado" });
      res.json({
        valid: true,
        membershipNumber: membership.membershipNumber,
        fullName: membership.fullName,
        status: membership.status,
        membershipType: membership.membershipType,
        acceptedAt: membership.acceptedAt,
        certificateIssuedAt: membership.certificateIssuedAt,
      });
    } catch (err) { next(err); }
  });

  app.get("/api/admin/memberships", requireAdmin, async (req, res, next) => {
    try {
      const memberships = await db.select().from(cooperativeMemberships).orderBy(desc(cooperativeMemberships.createdAt));
      res.json(memberships);
    } catch (err) { next(err); }
  });

  app.patch("/api/admin/memberships/:id/status", requireAdmin, async (req, res, next) => {
    try {
      const { id } = req.params as Record<string, string>;
      const { status, separationReason } = req.body;
      const validStatuses = ["activo", "suspendido", "separado", "excluido"];
      if (!validStatuses.includes(status)) return res.status(400).json({ message: "Estado inválido" });
      const updates: any = { status, updatedAt: new Date() };
      if (status === "separado" || status === "excluido") {
        updates.separationDate = new Date();
        updates.separationReason = separationReason || null;
      }
      const [updated] = await db.update(cooperativeMemberships).set(updates).where(eq(cooperativeMemberships.id, id)).returning();
      if (!updated) return res.status(404).json({ message: "Membresía no encontrada" });
      res.json(updated);
    } catch (err) { next(err); }
  });
}
