import { db } from "./db";
import { termsVersions, userTermsAcceptances, accounts, users, insurancePlans } from "@shared/schema";
import { eq, gt, sql, count } from "drizzle-orm";

const INITIAL_VERSIONS = [
  {
    docType: "terminos_condiciones" as const,
    version: "1.0",
    title: "Términos y Condiciones",
    summary: "Términos y condiciones de uso de la plataforma Ceduverse.",
    contentUrl: "/terminos",
    isBlocking: true,
    isActive: true,
    requiredForRoles: ["user", "moderator", "admin", "partner", "superadmin", "instructor"],
  },
  {
    docType: "aviso_privacidad" as const,
    version: "1.0",
    title: "Aviso de Privacidad",
    summary: "Aviso de privacidad conforme a la LFPDPPP.",
    contentUrl: "/privacidad",
    isBlocking: true,
    isActive: true,
    requiredForRoles: ["user", "moderator", "admin", "partner", "superadmin", "instructor"],
  },
  {
    docType: "politica_cookies" as const,
    version: "1.0",
    title: "Política de Cookies",
    summary: "Política sobre el uso de cookies en la plataforma.",
    contentUrl: "/cookies",
    isBlocking: false,
    isActive: true,
    requiredForRoles: ["user", "moderator", "admin", "partner", "superadmin", "instructor"],
  },
  {
    docType: "adhesion_cooperativa" as const,
    version: "1.0",
    title: "Adhesión Cooperativa",
    summary: "Solicitud de adhesión como socio cooperativista de Ceduverse S. C de C de Rl de CV conforme a la LGSC.",
    contentUrl: "/terminos",
    isBlocking: true,
    isActive: true,
    requiredForRoles: ["user", "moderator", "admin", "partner", "superadmin", "instructor"],
  },
];

export async function seedTermsVersions(): Promise<void> {
  const existing = await db.select().from(termsVersions);
  if (existing.length > 0) {
    console.log(`[seed] Terms versions already exist (${existing.length}), skipping`);
    return;
  }

  await db.insert(termsVersions).values(INITIAL_VERSIONS as any);
  console.log("[seed] Inserted 4 initial terms versions (T&C, Privacy, Cookies, Adhesion)");

  await ensureMembershipSeq();
}

export async function ensureMembershipSeq(): Promise<void> {
  await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS membership_seq START WITH 1`);
}

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export async function generateMembershipCode(): Promise<string> {
  const { cooperativeMemberships } = await import("@shared/schema");
  for (let attempt = 0; attempt < 20; attempt++) {
    let code = "CEDU-";
    for (let i = 0; i < 4; i++) {
      code += ALPHA[Math.floor(Math.random() * ALPHA.length)];
    }
    const [existing] = await db.select().from(cooperativeMemberships)
      .where(eq(cooperativeMemberships.membershipNumber, code));
    if (!existing) return code;
  }
  const seqResult = await db.execute(sql`SELECT nextval('membership_seq') as seq`);
  const seq = Number((seqResult as any).rows?.[0]?.seq ?? 1);
  return `CEDU-${String(seq).padStart(4, '0')}`;
}

/**
 * Migrates existing users who accepted terms during registration.
 * 
 * The auth page (client/src/pages/auth.tsx) has a required "acceptedTerms" checkbox
 * that disables the registration button until checked. This acceptance was NOT persisted
 * to a separate DB column — it was client-side only. Therefore, the consent signal for
 * existing users is: they have an account record (meaning they completed registration,
 * which required checking the terms checkbox) AND accountSetup > 0 (meaning they
 * completed at least the first onboarding step, confirming active platform usage).
 *
 * Users with accountSetup = 0 are excluded because they may have started but never
 * completed registration — their consent is not confirmed.
 */
export async function migrateExistingUsersTerms(): Promise<void> {
  const versions = await db.select().from(termsVersions);
  const tcVersion = versions.find(v => v.docType === "terminos_condiciones" && v.version === "1.0");
  const privVersion = versions.find(v => v.docType === "aviso_privacidad" && v.version === "1.0");

  if (!tcVersion || !privVersion) {
    console.log("[seed] Terms versions not found, skipping user migration");
    return;
  }

  const existingAcceptances = await db.select({ userId: userTermsAcceptances.userId }).from(userTermsAcceptances);
  const usersWithAcceptances = new Set(existingAcceptances.map(a => a.userId));

  const completedAccounts = await db.select({ id: accounts.id, accountSetup: accounts.accountSetup })
    .from(accounts)
    .where(gt(accounts.accountSetup, 0));
  const eligibleAccounts = completedAccounts.filter(a => !usersWithAcceptances.has(a.id));

  if (eligibleAccounts.length === 0) {
    console.log("[seed] All eligible users already have terms acceptances, skipping migration");
    return;
  }

  const totalAccounts = await db.select({ id: accounts.id }).from(accounts);
  const skippedNoSetup = totalAccounts.filter(a => !completedAccounts.find(c => c.id === a.id)).length;

  let migrated = 0;
  for (const acc of eligibleAccounts) {
    const [userRow] = await db.select({ createdAt: users.createdAt }).from(users).where(eq(users.id, acc.id));
    const acceptedAt = userRow?.createdAt || new Date();

    await db.insert(userTermsAcceptances).values([
      {
        userId: acc.id,
        termsVersionId: tcVersion.id,
        acceptedAt,
        acceptanceHash: "migrated-from-legacy-registration-checkbox",
      },
      {
        userId: acc.id,
        termsVersionId: privVersion.id,
        acceptedAt,
        acceptanceHash: "migrated-from-legacy-registration-checkbox",
      },
    ]).onConflictDoNothing();
    migrated++;
  }

  console.log(`[seed] Migrated ${migrated} users with T&C + Privacy (legacy registration checkbox). ${skippedNoSetup} users with accountSetup=0 excluded (unconfirmed consent).`);
}

const INSURANCE_PLANS_SEED = [
  { name: "Administrativo Básico", profile: "administrativo", profileLabel: "Administrativo", tier: "basico", pricePerEmployee: "225.00", coberturaDental: "30000.00", coberturaVidaMin: "100000.00", coberturaVidaMax: "200000.00", coberturaAccidentes: "50000.00", coberturaGmm: null, gmmDeducible: null, gmmCoaseguro: null, hasApp: true, hasTelemedicine: true, provider: "Betterfly", isActive: true, features: { asistencia: "Mawdy", vida_provider: "MetLife", dental_provider: "Odontoprev" } },
  { name: "Administrativo Medio", profile: "administrativo", profileLabel: "Administrativo", tier: "medio", pricePerEmployee: "273.75", coberturaDental: "50000.00", coberturaVidaMin: "150000.00", coberturaVidaMax: "300000.00", coberturaAccidentes: "75000.00", coberturaGmm: null, gmmDeducible: null, gmmCoaseguro: null, hasApp: true, hasTelemedicine: true, provider: "Betterfly", isActive: true, features: { asistencia: "Mawdy Plus", vida_provider: "MetLife", dental_provider: "Odontoprev" } },
  { name: "Administrativo Premium", profile: "administrativo", profileLabel: "Administrativo", tier: "premium", pricePerEmployee: "978.75", coberturaDental: null, coberturaVidaMin: "100000.00", coberturaVidaMax: "200000.00", coberturaAccidentes: null, coberturaGmm: "1031838.00", gmmDeducible: "10318.00", gmmCoaseguro: "10.00", hasApp: true, hasTelemedicine: true, provider: "Betterfly", isActive: true, features: { asistencia: "Integral MetLife", gmm_provider: "MetLife", vida_provider: "MetLife" } },
  { name: "Logística Básico", profile: "logistica", profileLabel: "Operativo Moderado", tier: "basico", pricePerEmployee: "250.00", coberturaDental: "30000.00", coberturaVidaMin: "100000.00", coberturaVidaMax: "200000.00", coberturaAccidentes: "50000.00", coberturaGmm: null, gmmDeducible: null, gmmCoaseguro: null, hasApp: true, hasTelemedicine: true, provider: "Betterfly", isActive: true, features: { asistencia: "Mawdy", vida_provider: "MetLife", dental_provider: "Odontoprev" } },
  { name: "Logística Medio", profile: "logistica", profileLabel: "Operativo Moderado", tier: "medio", pricePerEmployee: "295.00", coberturaDental: "50000.00", coberturaVidaMin: "150000.00", coberturaVidaMax: "300000.00", coberturaAccidentes: "75000.00", coberturaGmm: null, gmmDeducible: null, gmmCoaseguro: null, hasApp: true, hasTelemedicine: true, provider: "Betterfly", isActive: true, features: { asistencia: "Mawdy Plus", vida_provider: "MetLife", dental_provider: "Odontoprev" } },
  { name: "Logística Premium", profile: "logistica", profileLabel: "Operativo Moderado", tier: "premium", pricePerEmployee: "1000.00", coberturaDental: null, coberturaVidaMin: "100000.00", coberturaVidaMax: "200000.00", coberturaAccidentes: null, coberturaGmm: "1031838.00", gmmDeducible: "10318.00", gmmCoaseguro: "10.00", hasApp: true, hasTelemedicine: true, provider: "Betterfly", isActive: true, features: { asistencia: "Integral MetLife", gmm_provider: "MetLife", vida_provider: "MetLife" } },
  { name: "Pirotecnia Básico", profile: "pirotecnia", profileLabel: "Operativo Alto", tier: "basico", pricePerEmployee: "262.50", coberturaDental: "30000.00", coberturaVidaMin: "100000.00", coberturaVidaMax: "200000.00", coberturaAccidentes: "50000.00", coberturaGmm: null, gmmDeducible: null, gmmCoaseguro: null, hasApp: true, hasTelemedicine: true, provider: "Betterfly", isActive: true, features: { asistencia: "Mawdy", vida_provider: "MetLife", dental_provider: "Odontoprev" } },
  { name: "Pirotecnia Medio", profile: "pirotecnia", profileLabel: "Operativo Alto", tier: "medio", pricePerEmployee: "303.75", coberturaDental: "50000.00", coberturaVidaMin: "150000.00", coberturaVidaMax: "300000.00", coberturaAccidentes: "75000.00", coberturaGmm: null, gmmDeducible: null, gmmCoaseguro: null, hasApp: true, hasTelemedicine: true, provider: "Betterfly", isActive: true, features: { asistencia: "Mawdy Plus", vida_provider: "MetLife", dental_provider: "Odontoprev" } },
  { name: "Pirotecnia Premium", profile: "pirotecnia", profileLabel: "Operativo Alto", tier: "premium", pricePerEmployee: "993.75", coberturaDental: null, coberturaVidaMin: "100000.00", coberturaVidaMax: "200000.00", coberturaAccidentes: null, coberturaGmm: "1031838.00", gmmDeducible: "10318.00", gmmCoaseguro: "10.00", hasApp: true, hasTelemedicine: true, provider: "Betterfly", isActive: true, features: { asistencia: "Integral MetLife", gmm_provider: "MetLife", vida_provider: "MetLife" } },
];

export async function seedInsurancePlans() {
  const [{ count: existing }] = await db.select({ count: count() }).from(insurancePlans);
  if (Number(existing) > 0) {
    console.log(`[seed] Insurance plans already exist (${existing}), skipping`);
    return;
  }
  await db.insert(insurancePlans).values(INSURANCE_PLANS_SEED as any);
  console.log(`[seed] Inserted ${INSURANCE_PLANS_SEED.length} insurance plans`);
}
