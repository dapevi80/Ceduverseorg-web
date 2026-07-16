import type { Express } from "express";
import { requireAuth, requireAdmin } from "../auth";
import { storage } from "../storage";
import { db } from "../db";
import multer from "multer";
import path from "path";
import fs from "fs";
import { r2Storage } from "../services/r2-storage";
import { isPaidCertType, resolveCertPriceMxn } from "@shared/cert-pricing";
import { isBlockingDuplicateStatus } from "@shared/cert-duplicate";
import { stripe, BASE_URL } from "../lib/stripe-client";
import { decideCertTransition } from "../lib/cert-webhook-logic";

export function registerCertificateRoutes(app: Express) {
  // ==================== STRIPE WEBHOOK (CERTIFICATES) ====================

  app.post("/api/certificates/webhook", async (req, res) => {
    try {
      if (!stripe) return res.sendStatus(200); // sin Stripe, nada que hacer
      const secret = process.env.STRIPE_WEBHOOK_SECRET_CERTS;
      if (!secret) return res.status(403).json({ message: "Webhook de certificados no configurado" });
      const sig = req.headers["stripe-signature"] as string;
      if (!sig) return res.status(400).json({ message: "Missing signature" });

      const event = stripe.webhooks.constructEvent((req as any).rawBody as string, sig, secret);
      if (event.type !== "checkout.session.completed") return res.sendStatus(200);

      const session = event.data.object as any;
      if (session.metadata?.kind !== "certificate") return res.sendStatus(200);

      const id = session.metadata?.certRequestId;
      const request = id ? await storage.getCertificateRequest(id) : null;
      if (!request) return res.sendStatus(200);

      if (decideCertTransition(request.status, session.payment_status) === "confirm") {
        await storage.updateCertificateRequest(request.id, {
          status: "solicitado",
          stripeSessionId: session.id,
          paidAt: new Date(),
        });
      }
      return res.sendStatus(200);
    } catch (e: any) {
      console.error("[certs] webhook error:", e.message);
      return res.sendStatus(400);
    }
  });

  // ==================== CERTIFICATE REQUESTS (STUDENT) ====================

  app.post("/api/me/certificates", requireAuth, async (req, res, next) => {
    try {
      const userId = req.supabaseUserId!;
      const { courseId, certType } = req.body;
      if (!courseId || !certType) {
        return res.status(400).json({ message: "courseId y certType son requeridos" });
      }
      if (!["dc3", "sep"].includes(certType)) {
        return res.status(400).json({ message: "certType debe ser dc3 o sep" });
      }
      const course = await storage.getCourse(courseId);
      if (!course) {
        return res.status(404).json({ message: "Curso no encontrado" });
      }
      if (certType === "dc3" && !course.dc3Disponible) {
        return res.status(400).json({ message: "Este curso no ofrece constancia DC-3" });
      }
      const quiz = await storage.getQuizByCourse(courseId);
      if (quiz) {
        const attempts = await storage.getQuizAttempts(userId, quiz.id);
        const passed = attempts.some((a: any) => a.score >= (quiz.passingScore || 70));
        if (!passed) {
          return res.status(400).json({ message: "Debes aprobar la evaluación antes de solicitar un certificado" });
        }
      }
      const existing = await storage.getCertificateRequestsByUser(userId);
      const duplicate = existing.find(r => r.courseId === courseId && r.certType === certType);
      if (duplicate && isBlockingDuplicateStatus(duplicate.status)) {
        return res.status(409).json({ message: "Ya tienes una solicitud para este certificado", request: duplicate });
      }

      // Diploma es gratis: comportamiento actual (incluye reuso de un rechazado).
      if (!isPaidCertType(certType)) {
        if (duplicate) {
          const updated = await storage.updateCertificateRequest(duplicate.id, { status: "solicitado", rejectReason: null });
          return res.status(200).json(updated);
        }
        const request = await storage.createCertificateRequest({
          userId,
          courseId,
          certType,
          status: "solicitado",
        });
        return res.status(201).json(request);
      }

      // dc3 / sep: pay-first. El monto se resuelve SIEMPRE en el servidor, nunca desde el body.
      if (!stripe) {
        return res.status(503).json({ message: "Pagos no disponibles: STRIPE_SECRET_KEY no configurada." });
      }
      const amount = resolveCertPriceMxn(certType);
      const request = duplicate
        ? await storage.updateCertificateRequest(duplicate.id, { status: "pending_payment", amountMxn: amount, rejectReason: null })
        : await storage.createCertificateRequest({ userId, courseId, certType, status: "pending_payment", amountMxn: amount });
      if (!request) {
        return res.status(500).json({ message: "No se pudo crear la solicitud de certificado" });
      }
      const label = certType === "dc3" ? "Servicio de certificación DC-3 STPS" : "Constancia SEP";
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: (await storage.getUser(userId))?.email || undefined,
        line_items: [{
          price_data: {
            currency: "mxn",
            product_data: { name: `${label} — ${course.title}` },
            unit_amount: amount * 100,
          },
          quantity: 1,
        }],
        metadata: { kind: "certificate", certRequestId: String(request.id) },
        success_url: `${BASE_URL}/?cert=paid&view=certificates`,
        cancel_url: `${BASE_URL}/?cert=cancelled&view=certificates`,
      });
      await storage.updateCertificateRequest(request.id, { stripeSessionId: session.id });
      return res.status(200).json({ checkout_url: session.url });
    } catch (err) { next(err); }
  });

  app.get("/api/me/certificates", requireAuth, async (req, res, next) => {
    try {
      const requests = await storage.getCertificateRequestsByUser(req.supabaseUserId!);
      res.json(requests);
    } catch (err) { next(err); }
  });

  // ==================== ADMIN CERTIFICATE MANAGEMENT ====================

  app.get("/api/admin/certificates", requireAuth, requireAdmin, async (_req, res, next) => {
    try {
      const allRequests = await storage.listCertificateRequests();
      const enriched = await Promise.all(allRequests.map(async (r) => {
        const profile = await storage.getProfile(r.userId);
        const course = await storage.getCourse(r.courseId);
        return {
          ...r,
          studentName: profile?.fullName || "Sin nombre",
          studentEmail: (await storage.getUser(r.userId))?.email || "",
          courseTitle: course?.title || "Curso no encontrado",
          courseSlug: course?.slug || "",
        };
      }));
      res.json(enriched);
    } catch (err) { next(err); }
  });

  app.patch("/api/admin/certificates/:id", requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const id = (req.params.id as string) as string;
      const { status, rejectReason, pdfUrl } = req.body;
      const request = await storage.getCertificateRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Solicitud no encontrada" });
      }

      const validStatuses = ["solicitado", "en_proceso", "emitido", "rechazado"];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ message: `Status inválido. Opciones: ${validStatuses.join(", ")}` });
      }

      const allowedTransitions: Record<string, string[]> = {
        solicitado: ["en_proceso", "emitido", "rechazado"],
        en_proceso: ["emitido", "rechazado"],
        emitido: [],
        rechazado: ["solicitado"],
      };
      if (status && status !== request.status) {
        const allowed = allowedTransitions[request.status] || [];
        if (!allowed.includes(status)) {
          return res.status(400).json({ message: `No se puede cambiar de "${request.status}" a "${status}"` });
        }
      }

      if (status === "rechazado" && (!rejectReason || !rejectReason.trim())) {
        return res.status(400).json({ message: "Se requiere un motivo de rechazo" });
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (rejectReason !== undefined) updateData.rejectReason = rejectReason;
      if (pdfUrl !== undefined) updateData.pdfUrl = pdfUrl;

      if (status === "emitido") {
        if (request.achievementUserId) {
          const finalPdf = pdfUrl || request.pdfUrl || null;
          if (finalPdf) {
            await storage.updateAchievementUser(request.achievementUserId, { pdfUrl: finalPdf });
          }
        } else {
          const finalPdf = pdfUrl || request.pdfUrl || null;
          if (!finalPdf) {
            return res.status(400).json({ message: "Se requiere subir un PDF antes de emitir" });
          }
          const course = await storage.getCourse(request.courseId);
          if (!course) {
            return res.status(404).json({ message: "Curso no encontrado" });
          }
          const achievementSlug = `logro-${course.slug}`;
          let achievement = await storage.getAchievementBySlug(achievementSlug);
          if (!achievement) {
            achievement = await storage.createAchievement({
              slug: achievementSlug,
              name: `Diploma: ${course.title}`,
              shortDescription: `Aprobó la evaluación del curso "${course.title}"`,
              description: `Diploma Digital de Participación obtenido al aprobar con éxito la evaluación del curso ${course.title}. Verificable en blockchain.`,
              category: course.areaTematica || "STPS",
              value: 1000,
              icon: "award",
            });
          }
          const profile = await storage.getProfile(request.userId);
          const simAddress = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
          const simTokenId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
          const certAchievement = await storage.awardAchievement({
            userId: request.userId,
            achievementId: achievement.id,
            isActive: true,
            status: "active",
            certType: request.certType,
            contractAddress: profile?.walletAddress || simAddress,
            tokenId: simTokenId,
            pdfUrl: finalPdf,
          });
          updateData.achievementUserId = certAchievement.id;
        }
      }

      const updated = await storage.updateCertificateRequest(id as string, updateData);
      res.json(updated);
    } catch (err) { next(err); }
  });

  const certUploadDir = path.join(process.cwd(), "uploads", "certificates");
  if (!fs.existsSync(certUploadDir)) {
    fs.mkdirSync(certUploadDir, { recursive: true });
  }
  const certUpload = multer({
    storage: multer.diskStorage({
      destination: certUploadDir,
      filename: (_req: any, file: Express.Multer.File, cb: any) => {
        cb(null, `cert-${_req.params.id}-${Date.now()}.pdf`);
      },
    }),
    fileFilter: (_req: any, file: Express.Multer.File, cb: any) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (file.mimetype === "application/pdf" && ext === ".pdf") {
        cb(null, true);
      } else {
        cb(new Error("Solo se aceptan archivos PDF"));
      }
    },
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  app.post("/api/admin/certificates/:id/upload", requireAuth, requireAdmin, certUpload.single("pdf"), async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No se recibió archivo PDF" });
      }

      let pdfUrl: string;

      if (r2Storage.isConfigured) {
        const localPath = req.file.path;
        const buffer = fs.readFileSync(localPath);
        const r2Key = `certificates/cert-${(req.params.id as string)}-${Date.now()}.pdf`;
        pdfUrl = await r2Storage.uploadBuffer(buffer, r2Key, "application/pdf");
        fs.unlinkSync(localPath);
      } else {
        pdfUrl = `/uploads/certificates/${req.file.filename}`;
      }

      const updated = await storage.updateCertificateRequest((req.params.id as string) as string, { pdfUrl });
      res.json({ pdfUrl, request: updated });
    } catch (err) { next(err); }
  });
}
