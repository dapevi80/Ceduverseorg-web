import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { referralCodes } from "@shared/schema";

// Garantiza que el código que un socio comparte EXISTA como código de referido
// activo.
//
// El bug que arregla: al hacerse socio cooperativo se hacía
// `accounts.referralCode = membershipNumber` (el folio) sin crear la fila
// correspondiente en `referral_codes`. Pero TANTO la validación del invitado
// (`GET /api/referral/:code`) COMO la atribución al guardar la cuenta
// (`PATCH /api/me/account`) buscan el código en `referral_codes`. Resultado: la
// app entregaba a compartir un folio que ella misma rechazaba — el invitado veía
// "link incorrecto" y el referido NO se acreditaba, en silencio, para todos los
// socios cooperativos.
//
// Nunca lanza: corre en rutas de login y de alta, y una falla aquí jamás debe
// tumbar el acceso de nadie. Devuelve la fila vigente o null si no se pudo.

export interface EnsuredReferralCode {
  code: string;
  usageCount: number;
  isActive: boolean;
}

export async function ensureReferralCode(
  userId: string,
  code: string,
): Promise<EnsuredReferralCode | null> {
  const trimmed = (code || "").trim();
  if (!userId || !trimmed) return null;

  try {
    // Se busca SIN filtrar por isActive a propósito: si existe pero está
    // desactivado, es una decisión administrativa que no se debe revertir sola.
    const [existing] = await db.select().from(referralCodes)
      .where(eq(referralCodes.code, trimmed)).limit(1);

    if (existing) {
      if (existing.ownerId !== userId) {
        // El folio ya pertenece a otra persona: no se toca ni se reasigna.
        console.error(
          `[referral] El código "${trimmed}" está asignado en accounts al usuario ${userId} ` +
          `pero en referral_codes pertenece a ${existing.ownerId}. No se reasigna; revisar a mano.`,
        );
      } else if (!existing.isActive) {
        console.warn(
          `[referral] El código "${trimmed}" (usuario ${userId}) existe pero está DESACTIVADO: ` +
          `sus links de invitación seguirán marcando "link incorrecto" hasta reactivarlo.`,
        );
      }
      return { code: existing.code, usageCount: existing.usageCount, isActive: existing.isActive };
    }

    const [created] = await db.insert(referralCodes).values({
      code: trimmed,
      ownerId: userId,
      ownerType: "user",
      label: "Folio de socio",
      commission: 0,
    }).returning();

    if (created) {
      console.log(`[referral] Código "${trimmed}" regularizado en referral_codes (usuario ${userId}).`);
      return { code: created.code, usageCount: created.usageCount, isActive: created.isActive };
    }
    return null;
  } catch (err: any) {
    // Carrera: dos peticiones simultáneas intentando crear el mismo código. El
    // unique de `code` deja pasar sólo a una; el perdedor relee y sigue.
    try {
      const [row] = await db.select().from(referralCodes)
        .where(and(eq(referralCodes.code, trimmed), eq(referralCodes.ownerId, userId))).limit(1);
      if (row) return { code: row.code, usageCount: row.usageCount, isActive: row.isActive };
    } catch { /* cae al log de abajo */ }
    console.error(
      `[referral] No se pudo asegurar el código "${trimmed}" del usuario ${userId}: ${err?.message}`,
    );
    return null;
  }
}
