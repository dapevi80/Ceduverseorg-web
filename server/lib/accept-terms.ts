import { and, eq, inArray } from "drizzle-orm";
import crypto from "crypto";
import { db } from "../db";
import { storage } from "../storage";
import {
  accounts,
  cooperativeMemberships,
  termsVersions,
  userTermsAcceptances,
  users,
} from "@shared/schema";
import { ensureReferralCode } from "./ensure-referral-code";
import { createOrUpdateContactCard } from "../routes/helpers";

// Fuente ÚNICA de "registrar que alguien aceptó un documento legal" — la usan
// TANTO `POST /api/user/accept-terms` (server/routes.ts, usuario ya logueado
// aceptando algo pendiente) COMO el registro nuevo (server/auth.ts,
// verify-code) desde que la adhesión cooperativa se volvió obligatoria en el
// alta. Antes solo routes.ts escribía en `user_terms_acceptances`; el alta
// nueva creaba la membresía pero nunca esa fila, así que un socio recién
// registrado —que ya aceptó todo— quedaba bloqueado por
// `checkPendingTerms` (que compara contra esa tabla, no contra
// `cooperative_memberships`). No duplicar esta lógica: el hash de evidencia
// y el alta de membresía se ajustan aquí una sola vez.
//
// NUNCA fabrica una aceptación: quien llama debe haber verificado ya que la
// persona de verdad marcó la(s) casilla(s) correspondiente(s).

export type TermsDocType =
  | "terminos_condiciones"
  | "aviso_privacidad"
  | "politica_cookies"
  | "adhesion_cooperativa";

export interface AcceptTermsResult {
  /** ids de versión que quedaron aceptadas en esta llamada (no cuenta las que ya existían). */
  acceptedVersionIds: string[];
  /** Folio de la membresía cooperativa, si aplicaba una versión de adhesión (nueva o ya existente). */
  membershipNumber: string | null;
}

export async function acceptTermsForUser(params: {
  userId: string;
  versionIds: string[];
  ip: string;
  userAgent: string;
}): Promise<AcceptTermsResult> {
  const { userId, ip, userAgent } = params;
  const uniqueVersionIds = Array.from(new Set(params.versionIds)).filter(Boolean);

  const result: AcceptTermsResult = { acceptedVersionIds: [], membershipNumber: null };
  if (uniqueVersionIds.length === 0) return result;

  const account = await storage.getAccount(userId);
  const userRole = account?.userRole || "socio_estudiante";

  const [userRow] = await db.select().from(users).where(eq(users.id, userId));
  const profile = await storage.getProfile(userId);

  for (const versionId of uniqueVersionIds) {
    const [version] = await db.select().from(termsVersions)
      .where(and(eq(termsVersions.id, versionId), eq(termsVersions.isActive, true)));
    if (!version) continue;

    if (!version.requiredForRoles || !version.requiredForRoles.includes(userRole)) continue;

    const now = new Date();
    const acceptanceData = `${userId}|${versionId}|${now.toISOString()}|${ip}|${userAgent}`;
    const acceptanceHash = crypto.createHash("sha256").update(acceptanceData).digest("hex");

    const [acceptance] = await db.insert(userTermsAcceptances).values({
      userId,
      termsVersionId: versionId,
      acceptedAt: now,
      acceptanceIp: ip,
      acceptanceUserAgent: userAgent,
      acceptanceHash,
    }).onConflictDoNothing().returning();

    if (acceptance) result.acceptedVersionIds.push(versionId);

    if (version.docType === "adhesion_cooperativa") {
      const [existingMembership] = await db.select().from(cooperativeMemberships)
        .where(eq(cooperativeMemberships.userId, userId));

      if (!existingMembership) {
        const { generateMembershipCode } = await import("../seed-terms");
        const membershipNumber = await generateMembershipCode();

        const memberName = profile?.fullName || userRow?.email?.split("@")[0] || "Usuario";
        const memberEmail = userRow?.email || "";

        await db.insert(cooperativeMemberships).values({
          userId,
          fullName: memberName,
          email: memberEmail,
          membershipNumber,
          membershipType: "consumo",
          status: "activo",
          acceptedStatutes: true,
          acceptanceIp: ip,
          acceptanceUserAgent: userAgent,
          acceptanceHash,
        }).onConflictDoNothing();

        await db.update(accounts)
          .set({ referralCode: membershipNumber })
          .where(eq(accounts.id, userId));
        // El folio tambien debe existir como codigo de referido, o sus links
        // de invitacion salen como "link incorrecto" y no acreditan nada.
        await ensureReferralCode(userId, membershipNumber);

        createOrUpdateContactCard(userId, { title: "Socio Cooperativo" }).catch(() => {});

        result.membershipNumber = membershipNumber;
      } else {
        result.membershipNumber = existingMembership.membershipNumber;
      }
    }
  }

  return result;
}

/**
 * Resuelve los ids de las versiones ACTIVAS de los docTypes dados, sin
 * filtrar por rol todavía (eso lo hace `acceptTermsForUser` por versión,
 * usando el rol real de la cuenta — una sola fuente de verdad para ese
 * filtro). Pensado para quien acepta documentos por docType en vez de por
 * versionId explícito, como el alta nueva.
 */
export async function resolveActiveVersionIds(docTypes: TermsDocType[]): Promise<string[]> {
  if (docTypes.length === 0) return [];
  const versions = await db.select({ id: termsVersions.id }).from(termsVersions)
    .where(and(eq(termsVersions.isActive, true), inArray(termsVersions.docType, docTypes)));
  return versions.map(v => v.id);
}
