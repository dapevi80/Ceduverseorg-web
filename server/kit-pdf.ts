import PDFDocument from "pdfkit";

const CEDU_BLUE = "#1b5adf";
const CEDU_ORANGE = "#f28023";
const CEDU_VIOLET = "#7c3aed";
const CEDU_GREEN = "#00b87a";
const INK = "#1a1a2e";
const INK_MUTED = "#6b7280";
const INK_SOFT = "#9ca3af";
const WHITE = "#ffffff";
const LIGHT_BG = "#f8fafc";
const BORDER = "#e2e8f0";

const ML = 72;
const MR = 72;
const MT = 80;
const MB = 72;

const AUTHOR = "Dr. Daniel Zavala Estrada";
const AUTHOR_PHONE = "998 491 9697";

const CH_HEADER_H = 46;
const CH_MIN_BODY = 110;
const CH_NEED = CH_HEADER_H + CH_MIN_BODY;

interface DocCtx {
  doc: PDFKit.PDFDocument;
  PW: number;
  PH: number;
  CW: number;
}

function bottomLimit(ctx: DocCtx): number {
  return ctx.PH - MB - 30;
}

function ensureSpace(ctx: DocCtx, needed: number) {
  if (ctx.doc.y + needed > bottomLimit(ctx)) {
    ctx.doc.addPage();
    ctx.doc.y = MT;
  }
}

function startChapter(ctx: DocCtx) {
  const remaining = bottomLimit(ctx) - ctx.doc.y;
  if (remaining < CH_NEED) {
    ctx.doc.addPage();
  } else if (ctx.doc.y > MT + 10) {
    ctx.doc.moveDown(0.6);
    ctx.doc.moveTo(ML, ctx.doc.y).lineTo(ML + ctx.CW, ctx.doc.y).strokeColor(BORDER).lineWidth(0.5).stroke();
    ctx.doc.moveDown(0.6);
  }
}

export function generateKitPdf(leadName: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "LETTER",
      margins: { top: MT, bottom: MB, left: ML, right: MR },
      bufferPages: true,
      autoFirstPage: true,
      info: {
        Title: "Kit Cooperativista + Reforma Fiscal 2026",
        Author: AUTHOR,
        Subject: "Modelo Cooperativista Educativo — Ceduverse",
        Creator: "Ceduverse (ceduverse.org)",
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const PW = doc.page.width;
    const PH = doc.page.height;
    const CW = PW - ML - MR;
    const ctx: DocCtx = { doc, PW, PH, CW };
    const dateStr = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });

    coverPage(ctx, leadName, dateStr);

    doc.addPage();
    legalPage(ctx);

    doc.addPage();
    const tocPageIdx = doc.bufferedPageRange().count - 1;
    tocPlaceholder(ctx);
    doc.y = bottomLimit(ctx) + 1;

    const chapterStartPages: number[] = [];

    const chapters = [
      chapter01, chapter02, chapter03, chapter04, chapter05,
      chapter06, chapter07, chapter08, chapter09, chapter10,
    ];
    chapters.forEach((fn) => {
      startChapter(ctx);
      chapterStartPages.push(doc.bufferedPageRange().count - 1);
      fn(ctx);
    });

    startChapter(ctx);
    chapterStartPages.push(doc.bufferedPageRange().count - 1);
    flowDiagrams(ctx);

    startChapter(ctx);
    chapterStartPages.push(doc.bufferedPageRange().count - 1);
    referencesPage(ctx);

    doc.addPage();
    backCover(ctx);

    const total = doc.bufferedPageRange().count;
    const footerY = PH - 40;
    const lineY = footerY - 6;
    for (let i = 2; i < total - 1; i++) {
      doc.switchToPage(i);
      doc.page.margins.bottom = 0;
      doc.y = footerY;
      doc.save();
      doc.moveTo(ML, lineY).lineTo(PW - MR, lineY).strokeColor(BORDER).lineWidth(0.4).stroke();
      doc.fontSize(7.5).font("Helvetica").fillColor(INK_SOFT);
      doc.text("Ceduverse — Kit Cooperativista + Reforma Fiscal 2026", ML, footerY, { width: CW * 0.75, align: "left", lineBreak: false });
      doc.text(`Página ${i}`, ML, footerY, { width: CW, align: "right", lineBreak: false });
      doc.restore();
      doc.page.margins.bottom = MB;
    }

    doc.switchToPage(tocPageIdx);
    doc.page.margins.bottom = 0;
    fillToc(ctx, chapterStartPages);
    doc.page.margins.bottom = MB;

    doc.end();
  });
}


function coverPage(ctx: DocCtx, leadName: string, dateStr: string) {
  const { doc, PW, PH, CW } = ctx;
  doc.rect(0, 0, PW, PH).fill(CEDU_BLUE);
  doc.rect(0, 0, PW, 6).fill(CEDU_ORANGE);
  doc.rect(ML - 20, PH * 0.13, CW + 40, 0.5).fill("rgba(255,255,255,0.12)");

  doc.save();
  doc.roundedRect(ML, PH * 0.07, 42, 42, 10).fill("rgba(255,255,255,0.18)");
  doc.fontSize(26).font("Helvetica-Bold").fillColor(WHITE).text("C", ML + 10, PH * 0.07 + 8, { lineBreak: false });
  doc.restore();
  doc.fontSize(20).font("Helvetica-Bold").fillColor(WHITE).text("Ceduverse", ML + 52, PH * 0.07 + 12, { lineBreak: false });

  doc.y = PH * 0.24;
  doc.fontSize(9).font("Helvetica").fillColor("rgba(255,255,255,0.55)").text("DOCUMENTO EJECUTIVO", ML, doc.y, { characterSpacing: 4 });
  doc.moveDown(1.2);
  doc.fontSize(34).font("Helvetica-Bold").fillColor(WHITE).text("Kit Cooperativista", ML, doc.y, { width: CW });
  doc.fontSize(34).font("Helvetica-Bold").fillColor(CEDU_ORANGE).text("+ Reforma Fiscal 2026", ML, doc.y, { width: CW });
  doc.moveDown(1);
  doc.fontSize(13).font("Helvetica").fillColor("rgba(255,255,255,0.82)").text(
    "Guía completa del modelo cooperativista educativo: deducibilidad fiscal, certificaciones STPS, tecnología blockchain e inteligencia artificial para la capacitación laboral.",
    ML, doc.y, { width: CW * 0.78, lineGap: 4 }
  );

  doc.moveDown(2.5);
  doc.rect(ML, doc.y, CW * 0.3, 1).fill(CEDU_ORANGE);
  doc.moveDown(1.2);
  labelCover(doc, "AUTOR");
  doc.fontSize(13).font("Helvetica-Bold").fillColor(WHITE).text(AUTHOR);
  doc.fontSize(10).font("Helvetica").fillColor("rgba(255,255,255,0.65)").text(`Tel. ${AUTHOR_PHONE}`);
  doc.moveDown(1.2);
  labelCover(doc, "PREPARADO PARA");
  doc.fontSize(13).font("Helvetica-Bold").fillColor(WHITE).text(leadName);
  doc.moveDown(1.2);
  labelCover(doc, "FECHA");
  doc.fontSize(11).font("Helvetica").fillColor("rgba(255,255,255,0.75)").text(dateStr);

  doc.fontSize(8).font("Helvetica").fillColor("rgba(255,255,255,0.35)").text("ceduverse.org", ML, PH - MB - 8, { width: CW, align: "right", lineBreak: false });
}

function labelCover(doc: PDFKit.PDFDocument, t: string) {
  doc.fontSize(8).font("Helvetica-Bold").fillColor("rgba(255,255,255,0.45)").text(t, ML, doc.y, { characterSpacing: 2 });
  doc.moveDown(0.2);
}

function legalPage(ctx: DocCtx) {
  const { doc, CW } = ctx;
  doc.y = MT + 60;
  doc.font("Helvetica-Bold").fontSize(14).fillColor(INK).text("Aviso Legal", ML, doc.y, { width: CW });
  doc.moveDown(1);
  const paras = [
    "Este documento ha sido elaborado por Ceduverse con fines estrictamente informativos y educativos. No constituye asesoría legal, fiscal ni financiera. La información está basada en legislación vigente al momento de su publicación.",
    "Se recomienda consultar con un contador público certificado y/o abogado especializado antes de implementar el modelo cooperativista. Ceduverse no se responsabiliza por decisiones tomadas sin asesoría profesional.",
    "Precios en pesos mexicanos (MXN), IVA no incluido salvo indicación contraria. Valor UMA conforme al publicado por INEGI para 2026.",
  ];
  paras.forEach(p => {
    doc.font("Helvetica").fontSize(9.5).fillColor(INK_MUTED).text(p, ML, doc.y, { width: CW, lineGap: 3 });
    doc.moveDown(0.8);
  });
  doc.moveDown(1);
  doc.fontSize(9).fillColor(INK_MUTED).text(`© ${new Date().getFullYear()} Ceduverse. Todos los derechos reservados.`, ML, doc.y, { width: CW });
  doc.moveDown(1.5);
  doc.moveTo(ML, doc.y).lineTo(ML + CW * 0.25, doc.y).strokeColor(BORDER).lineWidth(0.5).stroke();
  doc.moveDown(0.8);
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(INK).text(AUTHOR);
  doc.font("Helvetica").fontSize(9).fillColor(INK_MUTED).text("Director General — Ceduverse");
  doc.text(`Contacto: ${AUTHOR_PHONE}`);
}

function tocPlaceholder(ctx: DocCtx) {
  const { doc, CW } = ctx;
  doc.y = MT;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(CEDU_ORANGE).text("CONTENIDO", ML, doc.y, { characterSpacing: 3 });
  doc.moveDown(0.3);
  doc.moveTo(ML, doc.y).lineTo(ML + CW, doc.y).strokeColor(CEDU_ORANGE).lineWidth(0.8).stroke();
  doc.moveDown(1.2);
  doc.font("Helvetica-Bold").fontSize(22).fillColor(INK).text("Índice", ML, doc.y, { width: CW });
  doc.moveDown(1.5);
}

function fillToc(ctx: DocCtx, pages: number[]) {
  const { doc, CW } = ctx;
  const entries = [
    { n: "01", t: "El Modelo Cooperativista Educativo", c: CEDU_BLUE },
    { n: "02", t: "Marco Legal: LGSC, LISR y LFT", c: CEDU_BLUE },
    { n: "03", t: "Reforma Fiscal 2026", c: CEDU_ORANGE },
    { n: "04", t: "Beneficios Fiscales: Deducibilidad 100%", c: CEDU_GREEN },
    { n: "05", t: "Los 3 Niveles de Certificación", c: CEDU_VIOLET },
    { n: "06", t: "Tutor IA: Capacitación Personalizada", c: CEDU_VIOLET },
    { n: "07", t: "Catálogo de 78 Cursos", c: CEDU_BLUE },
    { n: "08", t: "Planes y Precios por Trabajador", c: CEDU_ORANGE },
    { n: "09", t: "Comparativa: Tradicional vs. Ceduverse", c: CEDU_BLUE },
    { n: "10", t: "Próximos Pasos y Contacto", c: CEDU_GREEN },
    { n: "A", t: "Diagramas de Flujo Operativo", c: INK },
    { n: "B", t: "Referencias Bibliográficas", c: INK },
  ];
  let y = MT + 72;
  entries.forEach((e, i) => {
    const pg = pages[i] !== undefined ? pages[i] + 1 : 0;
    doc.save();
    doc.font("Helvetica-Bold").fontSize(13).fillColor(e.c).text(e.n, ML, y, { lineBreak: false });
    doc.font("Helvetica").fontSize(11).fillColor(INK).text(e.t, ML + 36, y + 1, { lineBreak: false });
    doc.font("Helvetica").fontSize(11).fillColor(INK_MUTED).text(`${pg}`, ML + CW - 28, y + 1, { width: 28, align: "right", lineBreak: false });
    const tw = doc.widthOfString(e.t, { font: "Helvetica", fontSize: 11 } as any);
    const dotStart = ML + 36 + tw + 8;
    const dotEnd = ML + CW - 36;
    if (dotEnd > dotStart) {
      doc.save();
      doc.moveTo(dotStart, y + 9).lineTo(dotEnd, y + 9)
        .dash(1.5, { space: 3 })
        .strokeColor(INK_SOFT)
        .lineWidth(0.5)
        .stroke();
      doc.undash();
      doc.restore();
    }
    doc.restore();
    y += 28;
  });
}


function chHead(ctx: DocCtx, num: string, title: string, subtitle: string, color: string) {
  const { doc, CW } = ctx;
  const headY = doc.y;
  doc.rect(ML, headY, 4, CH_HEADER_H).fill(color);
  doc.rect(ML, headY, CW, CH_HEADER_H).fillOpacity(0.06).fill(color);
  doc.fillOpacity(1);
  doc.font("Helvetica").fontSize(8).fillColor(color).text(`CAPÍTULO ${num}`, ML + 14, headY + 8, { characterSpacing: 2, lineBreak: false });
  doc.font("Helvetica-Bold").fontSize(16).fillColor(INK).text(title, ML + 14, headY + 22, { width: CW - 20 });
  doc.y = headY + CH_HEADER_H + 6;
  if (subtitle) {
    doc.font("Helvetica").fontSize(10).fillColor(INK_MUTED).text(subtitle, ML, doc.y, { width: CW, lineGap: 2 });
    doc.moveDown(0.4);
  }
  doc.moveDown(0.2);
}

function body(ctx: DocCtx, text: string) {
  ensureSpace(ctx, 30);
  ctx.doc.font("Helvetica").fontSize(10).fillColor(INK).text(text, ML, ctx.doc.y, { width: ctx.CW, lineGap: 3 });
  ctx.doc.moveDown(0.5);
}

function sub(ctx: DocCtx, text: string, color: string) {
  ensureSpace(ctx, 30);
  ctx.doc.moveDown(0.2);
  ctx.doc.font("Helvetica-Bold").fontSize(11.5).fillColor(color).text(text, ML, ctx.doc.y, { width: ctx.CW });
  ctx.doc.moveDown(0.3);
}

function bullets(ctx: DocCtx, items: string[], color: string = CEDU_BLUE) {
  items.forEach(item => {
    ensureSpace(ctx, 16);
    const startY = ctx.doc.y;
    ctx.doc.circle(ML + 4, startY + 5, 2.2).fill(color);
    ctx.doc.font("Helvetica").fontSize(10).fillColor(INK).text(item, ML + 16, startY, { width: ctx.CW - 16, lineGap: 2 });
    ctx.doc.moveDown(0.15);
  });
  ctx.doc.moveDown(0.15);
}

function hbox(ctx: DocCtx, text: string, bg: string, accent: string) {
  const th = ctx.doc.font("Helvetica").fontSize(9.5).heightOfString(text, { width: ctx.CW - 40 });
  const bh = th + 22;
  ensureSpace(ctx, bh + 8);
  const y0 = ctx.doc.y;
  ctx.doc.save();
  ctx.doc.roundedRect(ML, y0, ctx.CW, bh, 5).fill(bg);
  ctx.doc.rect(ML, y0, 3.5, bh).fill(accent);
  ctx.doc.fillColor(INK).fontSize(9.5).text(text, ML + 20, y0 + 11, { width: ctx.CW - 40, lineGap: 2.5 });
  ctx.doc.restore();
  ctx.doc.y = y0 + bh + 8;
}

function numList(ctx: DocCtx, items: string[], color: string = CEDU_BLUE) {
  items.forEach((item, i) => {
    ensureSpace(ctx, 16);
    const startY = ctx.doc.y;
    ctx.doc.font("Helvetica-Bold").fontSize(10).fillColor(color).text(`${i + 1}.`, ML, startY, { width: 18, lineBreak: false });
    ctx.doc.font("Helvetica").fontSize(10).fillColor(INK).text(item, ML + 22, startY, { width: ctx.CW - 22, lineGap: 2 });
    ctx.doc.moveDown(0.15);
  });
  ctx.doc.moveDown(0.15);
}


function chapter01(ctx: DocCtx) {
  chHead(ctx, "01", "El Modelo Cooperativista Educativo", "Qué es, cómo funciona y por qué es legal.", CEDU_BLUE);
  body(ctx, "El modelo cooperativista educativo de Ceduverse permite a las empresas mexicanas cumplir con sus obligaciones de capacitación laboral (LFT Art. 132 y 153) a través de una cooperativa de consumo legalmente constituida bajo la Ley General de Sociedades Cooperativas (LGSC).");
  body(ctx, "A diferencia de esquemas fiscales agresivos, el modelo cooperativista tiene fundamento legal explícito y décadas de jurisprudencia a su favor. No es elusión ni simulación — es ley vigente aplicada correctamente.");
  sub(ctx, "¿Qué genera cada peso invertido?", CEDU_BLUE);
  bullets(ctx, [
    "CFDI válido y deducible al 100% ante el SAT",
    "Evidencia de capacitación verificable con constancias STPS",
    "Registro blockchain inmutable de cada certificación emitida",
    "Cumplimiento automático de NOM-035 sobre factores de riesgo psicosocial",
    "Bonos cooperativistas como incentivo para los trabajadores",
    "Acceso a plataforma de capacitación con inteligencia artificial",
  ]);
  hbox(ctx, "El modelo cooperativista no es un esquema de optimización fiscal agresiva. Es un derecho constitucional (Art. 25 CPEUM) que promueve la economía social y solidaria, reconocido por la LGSC y avalado por la LISR.", "#eff6ff", CEDU_BLUE);
  sub(ctx, "¿Cómo funciona en la práctica?", CEDU_BLUE);
  body(ctx, "La empresa se integra como consumidora de servicios educativos a través de la cooperativa Ceduverse. Los trabajadores se inscriben en los cursos y la empresa recibe CFDI por los servicios contratados. Todo el proceso es digital, automatizado y genera evidencia verificable en cada paso.");
}

function chapter02(ctx: DocCtx) {
  chHead(ctx, "02", "Marco Legal", "Tres pilares jurídicos que sustentan el modelo.", CEDU_BLUE);
  sub(ctx, "Ley General de Sociedades Cooperativas (LGSC)", CEDU_BLUE);
  body(ctx, "Permite la creación de cooperativas de consumo para servicios educativos con beneficios fiscales especiales. Establece el marco para que los socios cooperativistas accedan a servicios de formación profesional en condiciones preferenciales.");
  sub(ctx, "Ley del Impuesto sobre la Renta (LISR)", CEDU_BLUE);
  body(ctx, "Artículo 27, Fracción I: Las aportaciones a cooperativas de consumo para capacitación son 100% deducibles cuando cumplen los requisitos de comprobación fiscal. Artículo 194: Las cooperativas tributan bajo régimen especial con fondos de previsión social y educación.");
  sub(ctx, "Ley Federal del Trabajo (LFT)", CEDU_BLUE);
  body(ctx, "Artículos 132 y 153: Establecen la obligación patronal de proporcionar capacitación y adiestramiento a los trabajadores, validada por la STPS. El incumplimiento resulta en multas de 250 a 5,000 UMAs.");
  hbox(ctx, "Art. 25 CPEUM: «La ley establecerá los mecanismos que faciliten la organización y la expansión de la actividad económica del sector social: ejidos, organizaciones de trabajadores, cooperativas, comunidades...»", "#f0fdf4", CEDU_GREEN);
}

function chapter03(ctx: DocCtx) {
  chHead(ctx, "03", "Reforma Fiscal 2026", "Impacto, riesgos y oportunidades para tu empresa.", CEDU_ORANGE);
  body(ctx, "La reforma fiscal 2026 introduce cambios significativos. El SAT ha implementado inteligencia artificial para detectar patrones de evasión y elusión fiscal con precisión sin precedentes.");
  sub(ctx, "Principales cambios", CEDU_ORANGE);
  bullets(ctx, [
    "IA del SAT detecta operaciones simuladas y elusión fiscal en tiempo real",
    "Incremento de sanciones por esquemas sin sustancia económica",
    "Obligatoriedad reforzada de evidencia documental para deducciones de capacitación",
    "Mayor intercambio de información SAT–IMSS–INFONAVIT",
    "Cancelación expedita de sellos digitales ante irregularidades",
  ], CEDU_ORANGE);
  sub(ctx, "¿Por qué Ceduverse resiste cualquier auditoría?", CEDU_ORANGE);
  bullets(ctx, [
    "Cursos completados con registro de horas, módulos y evaluaciones",
    "Constancias STPS con número de registro del agente capacitador",
    "Evidencia blockchain inmutable con marca de tiempo",
    "CFDIs emitidos conforme a requisitos vigentes del SAT",
  ], CEDU_ORANGE);
  hbox(ctx, "Tu inversión en capacitación a través de Ceduverse genera evidencia probatoria sólida. Cada curso, constancia y CFDI tienen sustancia económica real — exactamente lo que la reforma fiscal 2026 exige.", "#fff7ed", CEDU_ORANGE);
}

function chapter04(ctx: DocCtx) {
  chHead(ctx, "04", "Beneficios Fiscales", "Deducibilidad al 100% y retorno inmediato.", CEDU_GREEN);
  sub(ctx, "Beneficios directos", CEDU_GREEN);
  bullets(ctx, [
    "100% deducible de ISR con CFDI válido emitido por la cooperativa",
    "Cumplimiento automático de obligaciones LFT de capacitación",
    "Evidencia probatoria completa para auditorías del SAT",
    "Sin riesgo de cancelación de sellos digitales",
    "Bonos cooperativistas para trabajadores",
    "Reducción de rotación laboral al ofrecer desarrollo profesional certificado",
  ], CEDU_GREEN);
  sub(ctx, "Retorno de inversión", CEDU_GREEN);
  body(ctx, "Inversión promedio: 6-20 UMAs por trabajador ($678 – $2,262 MXN). Al deducir el 100%, el retorno fiscal es inmediato. Adicionalmente:");
  bullets(ctx, [
    "Incremento en productividad de hasta 23% (STPS, 2025)",
    "Reducción de accidentes laborales y cumplimiento de NOMs",
    "Mejora en clima organizacional y NOM-035",
    "Certificaciones que fortalecen licitaciones y contratos",
  ], CEDU_GREEN);
  hbox(ctx, "Ejemplo: 50 trabajadores en Plan Transforma (10 UMAs) = $56,570 MXN. El 100% es deducible de ISR, cada trabajador accede a 78 cursos, y la empresa genera evidencia de cumplimiento LFT, NOM-035 y STPS.", "#f0fdf4", CEDU_GREEN);
}

function chapter05(ctx: DocCtx) {
  chHead(ctx, "05", "Los 3 Niveles de Certificación", "Diploma NFT, DC-3 STPS y Certificado SEP.", CEDU_VIOLET);
  const certs = [
    { lvl: "NIVEL 1", name: "Diploma Digital NFT", price: "Gratis — incluido", c: CEDU_GREEN, items: [
      "Emisión automática al completar curso y aprobar evaluación",
      "Verificable en blockchain con código QR único",
      "Registro inmutable con marca de tiempo y calificación",
      "Descargable y compartible en redes profesionales",
    ]},
    { lvl: "NIVEL 2", name: "Constancia DC-3 STPS", price: "$499 MXN", c: CEDU_ORANGE, items: [
      "Formato DC-3 oficial para cumplimiento ante la STPS",
      "Válida para auditorías laborales e inspecciones",
      "Incluye número de registro del agente capacitador",
      "Emisión digital con firma electrónica",
    ]},
    { lvl: "NIVEL 3", name: "Certificado SEP (RVOE)", price: "$1,999 MXN", c: CEDU_BLUE, items: [
      "Validez oficial de la Secretaría de Educación Pública",
      "Reconocimiento de Validez Oficial de Estudios",
      "Evaluación adicional supervisada",
      "Emitido por institución educativa autorizada (INEC)",
    ]},
  ];
  certs.forEach(cert => {
    sub(ctx, `${cert.lvl} — ${cert.name}`, cert.c);
    ctx.doc.font("Helvetica-Bold").fontSize(10).fillColor(cert.c).text(cert.price, ML, ctx.doc.y, { width: ctx.CW });
    ctx.doc.moveDown(0.2);
    bullets(ctx, cert.items, cert.c);
  });
}

function chapter06(ctx: DocCtx) {
  chHead(ctx, "06", "Tutor IA", "Capacitación personalizada con inteligencia artificial.", CEDU_VIOLET);
  body(ctx, "El Tutor IA de Ceduverse es un motor de inteligencia artificial avanzada que personaliza cada curso según el perfil específico de cada trabajador. No es un chatbot genérico — es un sistema pedagógico completo.");
  sub(ctx, "Variables de personalización", CEDU_VIOLET);
  bullets(ctx, [
    "Puesto del trabajador y nivel de responsabilidad",
    "Industria y sector de la empresa",
    "Nivel de experiencia y conocimientos previos",
    "Estilo de aprendizaje preferido",
    "Ritmo de estudio y disponibilidad",
  ], CEDU_VIOLET);
  sub(ctx, "¿Qué genera el Tutor IA?", CEDU_VIOLET);
  bullets(ctx, [
    "Lecciones de 3,000 a 5,000 palabras adaptadas al contexto laboral",
    "Mapas mentales interactivos para visualizar conceptos",
    "Evaluaciones de 7 preguntas adaptativas con retroalimentación",
    "Reflexiones personalizadas y ejercicios prácticos",
    "Chat en tiempo real para dudas del contexto laboral",
  ], CEDU_VIOLET);
  body(ctx, "49 cursos disponibles con IA, 3 instructores certificados. Cada módulo se genera dinámicamente según el perfil del estudiante.");
}

function chapter07(ctx: DocCtx) {
  chHead(ctx, "07", "Catálogo de 78 Cursos", "29 cursos STPS + 49 cursos con Tutor IA.", CEDU_BLUE);
  sub(ctx, "Aula Virtual STPS — 29 cursos", CEDU_BLUE);
  body(ctx, "Cursos con registro oficial ante la STPS. Cumplen requisitos para constancias DC-3 y certificados SEP.");
  bullets(ctx, [
    "Seguridad e higiene industrial", "Prevención de riesgos laborales",
    "NOM-035: Factores de riesgo psicosocial", "NOM-002: Prevención contra incendios",
    "NOM-006: Manejo y almacenamiento", "NOM-009: Trabajos en altura",
    "NOM-017/019: EPP y comisiones de seguridad", "NOM-025/026: Iluminación, colores y señales",
    "NOM-030: Servicios preventivos", "Operación segura de montacargas",
    "Bloqueo y etiquetado (LOTO)", "Brigada contra incendios",
    "Sistema Globalmente Armonizado (SGA)", "Ergonomía y trastornos musculoesqueléticos",
    "Soldadura y corte: seguridad", "Control sanitario de alimentos",
  ]);
  sub(ctx, "Tutor IA — 49 cursos personalizados", CEDU_VIOLET);
  bullets(ctx, [
    "Habilidades directivas y liderazgo", "Comunicación efectiva en el trabajo",
    "Trabajo en equipo y relaciones humanas", "Administración del tiempo y productividad",
    "Autoestima y desarrollo personal", "Manejo de conflictos y toma de decisiones",
    "Planeación de vida y trabajo", "IA aplicada al trabajo",
    "Derechos laborales y reforma", "Formación de instructores internos",
    "Hábitos saludables en el trabajo", "Servicio y atención al cliente",
  ], CEDU_VIOLET);
}

function chapter08(ctx: DocCtx) {
  chHead(ctx, "08", "Planes y Precios", "Inversión por trabajador basada en UMAs.", CEDU_ORANGE);
  body(ctx, "Precios basados en UMAs. Valor UMA 2026: $113.14 MXN.");
  const plans = [
    { name: "Plan Impulsa", tag: "", umas: "6 UMAs", price: "$678.84 MXN", c: CEDU_BLUE, feats: [
      "Todos los cursos Academy sin límite (sin RVOE)", "Diploma NFT gratis por curso",
      "DC-3 STPS no incluidas (10% dto.)", "Certificado SEP disponible ($1,999)", "Plataforma IA + Chat",
    ]},
    { name: "Plan Transforma", tag: " — RECOMENDADO", umas: "10 UMAs", price: "$1,131.40 MXN", c: CEDU_ORANGE, feats: [
      "Todo de Impulsa + cursos especializados", "DC-3 STPS no incluidas (20% dto.)",
      "Mentorías con instructores", "Dashboard empresarial", "Reportes de cumplimiento",
    ]},
    { name: "Plan Lidera", tag: "", umas: "20 UMAs", price: "$2,262.80 MXN", c: CEDU_BLUE, feats: [
      "Todo de Transforma + programas RVOE", "DC-3 STPS no incluidas (30% dto.)",
      "NFT premium personalizado", "Asesoría jurídica incluida", "Consejo de capacitación", "Soporte prioritario",
    ]},
  ];
  plans.forEach(p => {
    sub(ctx, p.name + p.tag, p.c);
    ctx.doc.font("Helvetica-Bold").fontSize(16).fillColor(INK).text(p.price, ML, ctx.doc.y, { continued: true });
    ctx.doc.font("Helvetica").fontSize(10).fillColor(INK_MUTED).text(`  (${p.umas} / trabajador)`);
    ctx.doc.moveDown(0.2);
    bullets(ctx, p.feats, p.c);
  });
  hbox(ctx, "Precios por trabajador, IVA no incluido. Constancias DC-3 no están incluidas — se adquieren por separado con descuento según plan. Certificados SEP opcionales ($1,999). Sin cobros ocultos ni compromisos de permanencia.", "#fff7ed", CEDU_ORANGE);
}

function chapter09(ctx: DocCtx) {
  chHead(ctx, "09", "Comparativa", "Modelo tradicional vs. Ceduverse.", CEDU_BLUE);
  const rows = [
    ["Deducibilidad fiscal", "Limitada o nula", "100% con CFDI"],
    ["Cursos STPS", "$3,000–$8,000/curso", "29 incluidos"],
    ["Cursos con IA", "No disponible", "49 con Tutor IA"],
    ["Certificación", "Diplomas genéricos", "NFT blockchain gratis"],
    ["Constancia DC-3", "$1,500–$3,000", "$499 MXN"],
    ["Certificado SEP", "$5,000–$10,000", "$1,999 MXN"],
    ["NOM-035", "Consultoría $15,000+", "Incluido"],
    ["Plataforma IA", "$5,000–$20,000/mes", "Incluida"],
    ["Incentivos", "No disponible", "Becas + bonos"],
    ["Auditorías", "Docs físicos dispersos", "Digital + blockchain"],
  ];
  const c1 = ctx.CW * 0.3, c2 = ctx.CW * 0.32, c3 = ctx.CW * 0.38;

  ensureSpace(ctx, 30);
  const hy = ctx.doc.y;
  ctx.doc.rect(ML, hy - 3, ctx.CW, 20).fill(CEDU_BLUE);
  ctx.doc.font("Helvetica-Bold").fontSize(8.5).fillColor(WHITE);
  ctx.doc.text("Concepto", ML + 6, hy + 2, { width: c1, lineBreak: false });
  ctx.doc.text("Tradicional", ML + c1 + 6, hy + 2, { width: c2, lineBreak: false });
  ctx.doc.text("Ceduverse", ML + c1 + c2 + 6, hy + 2, { width: c3, lineBreak: false });
  ctx.doc.y = hy + 22;

  rows.forEach((r, i) => {
    ensureSpace(ctx, 20);
    const ry = ctx.doc.y;
    if (i % 2 === 0) ctx.doc.rect(ML, ry - 1, ctx.CW, 18).fill(LIGHT_BG);
    ctx.doc.font("Helvetica-Bold").fontSize(8.5).fillColor(INK).text(r[0], ML + 6, ry + 3, { width: c1 - 12, lineBreak: false });
    ctx.doc.font("Helvetica").fontSize(8.5).fillColor(INK_MUTED).text(r[1], ML + c1 + 6, ry + 3, { width: c2 - 12, lineBreak: false });
    ctx.doc.font("Helvetica-Bold").fontSize(8.5).fillColor(CEDU_BLUE).text(r[2], ML + c1 + c2 + 6, ry + 3, { width: c3 - 12, lineBreak: false });
    ctx.doc.y = ry + 20;
  });
  ctx.doc.moveDown(0.8);
  hbox(ctx, "Con 50 trabajadores en Plan Transforma, el ahorro estimado supera $150,000 MXN anuales vs. capacitación tradicional, sin considerar la deducibilidad al 100%.", "#eff6ff", CEDU_BLUE);
}

function chapter10(ctx: DocCtx) {
  chHead(ctx, "10", "Próximos Pasos", "Cómo implementar el modelo en tu empresa.", CEDU_GREEN);
  numList(ctx, [
    "Agenda una demo personalizada en ceduverse.org/empresas",
    "Recibe tu propuesta a medida según número de trabajadores e industria",
    "Firma el convenio de cooperativa educativa",
    "Inscribe a tus trabajadores en la plataforma",
    "Comienza la capacitación con Tutor IA desde el día 1",
    "Recibe CFDIs, constancias DC-3 y evidencia blockchain",
  ], CEDU_GREEN);
  ctx.doc.moveDown(0.3);
  sub(ctx, "Contacto directo", CEDU_GREEN);
  const info = [
    ["Autor / Director General", AUTHOR],
    ["Teléfono / WhatsApp", AUTHOR_PHONE],
    ["Web", "ceduverse.org"],
    ["Email", "contacto@ceduverse.org"],
    ["Planes empresariales", "ceduverse.org/empresas"],
  ];
  info.forEach(([l, v]) => {
    const startY = ctx.doc.y;
    ctx.doc.font("Helvetica").fontSize(9).fillColor(INK_MUTED).text(`${l}: `, ML, startY, { continued: true });
    ctx.doc.font("Helvetica-Bold").fontSize(10).fillColor(INK).text(v);
    ctx.doc.moveDown(0.1);
  });
  ctx.doc.moveDown(0.5);
  hbox(ctx, `Nuestro equipo está listo para ayudarte. Agenda una demo en ceduverse.org/empresas o llama al ${AUTHOR_PHONE}. Sin compromiso.`, "#f0fdf4", CEDU_GREEN);
}


function flowDiagrams(ctx: DocCtx) {
  chHead(ctx, "A", "Diagramas de Flujo Operativo", "Procesos clave del modelo cooperativista Ceduverse.", INK);

  sub(ctx, "Flujo 1 — Integración de la empresa", CEDU_BLUE);
  drawFlow(ctx, [
    { text: "Contacto\ninicial", color: CEDU_BLUE },
    { text: "Demo\npersonalizada", color: CEDU_BLUE },
    { text: "Propuesta\na medida", color: CEDU_BLUE },
    { text: "Firma de\nconvenio", color: CEDU_ORANGE },
    { text: "Alta en\nplataforma", color: CEDU_GREEN },
  ]);

  ctx.doc.moveDown(1);
  sub(ctx, "Flujo 2 — Capacitación del trabajador", CEDU_VIOLET);
  drawFlow(ctx, [
    { text: "Inscripción\ny perfil", color: CEDU_VIOLET },
    { text: "Onboarding\nTutor IA", color: CEDU_VIOLET },
    { text: "Cursos\npersonalizados", color: CEDU_BLUE },
    { text: "Evaluación\ny aprobación", color: CEDU_ORANGE },
    { text: "Certificación\n(3 niveles)", color: CEDU_GREEN },
  ]);

  ctx.doc.moveDown(1);
  sub(ctx, "Flujo 3 — Ciclo fiscal y evidencia", CEDU_GREEN);
  drawFlow(ctx, [
    { text: "Inversión\nen UMAs", color: CEDU_ORANGE },
    { text: "Emisión\nde CFDI", color: CEDU_BLUE },
    { text: "Capacitación\ncompletada", color: CEDU_VIOLET },
    { text: "Constancias\nSTPS + NFT", color: CEDU_GREEN },
    { text: "Deducción\n100% ISR", color: CEDU_GREEN },
  ]);

  ctx.doc.moveDown(1);
  sub(ctx, "Flujo 4 — Certificación DC-3 / SEP", CEDU_ORANGE);
  drawFlow(ctx, [
    { text: "Curso\naprobado", color: CEDU_BLUE },
    { text: "Solicitud\ndesde plataforma", color: CEDU_ORANGE },
    { text: "Verificación\ny emisión", color: CEDU_ORANGE },
    { text: "PDF con\nfirma digital", color: CEDU_GREEN },
    { text: "Registro\nblockchain", color: CEDU_GREEN },
  ]);
}

function drawFlow(ctx: DocCtx, steps: { text: string; color: string }[]) {
  ensureSpace(ctx, 65);
  const { doc, CW } = ctx;
  const n = steps.length;
  const boxW = 80;
  const boxH = 42;
  const gap = (CW - n * boxW) / (n - 1);
  const startY = doc.y;

  steps.forEach((step, i) => {
    const x = ML + i * (boxW + gap);
    const y = startY;

    doc.save();
    doc.roundedRect(x, y, boxW, boxH, 6).fill(step.color);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(WHITE);
    doc.text(step.text, x + 4, y + 7, { width: boxW - 8, align: "center", lineGap: 1 });
    doc.restore();

    if (i < n - 1) {
      const ax1 = x + boxW + 4;
      const ax2 = x + boxW + gap - 4;
      const ay = y + boxH / 2;
      doc.save();
      doc.moveTo(ax1, ay).lineTo(ax2, ay).strokeColor(INK_MUTED).lineWidth(1.2).stroke();
      doc.moveTo(ax2, ay).lineTo(ax2 - 5, ay - 3).lineTo(ax2 - 5, ay + 3).closePath().fill(INK_MUTED);
      doc.restore();
    }
  });

  doc.y = startY + boxH + 6;
}


function referencesPage(ctx: DocCtx) {
  chHead(ctx, "B", "Referencias Bibliográficas", "Marco normativo y fuentes consultadas.", INK);

  const refs = [
    { cat: "Legislación federal", items: [
      "Constitución Política de los Estados Unidos Mexicanos. Art. 25 (Economía social y cooperativas). Diario Oficial de la Federación.",
      "Ley General de Sociedades Cooperativas (LGSC). Última reforma DOF 19-01-2018.",
      "Ley del Impuesto sobre la Renta (LISR). Art. 27, Frac. I (Deducciones de capacitación); Art. 194 (Régimen fiscal de cooperativas). DOF 2025.",
      "Ley Federal del Trabajo (LFT). Art. 132, Frac. XV (Obligación de capacitación); Art. 153-A a 153-X (Sistema de capacitación). DOF reforma 2024.",
      "Código Fiscal de la Federación (CFF). Requisitos de comprobantes fiscales digitales (CFDI). DOF 2025.",
    ]},
    { cat: "Normas Oficiales Mexicanas", items: [
      "NOM-035-STPS-2018. Factores de riesgo psicosocial en el trabajo — Identificación, análisis y prevención.",
      "NOM-002-STPS-2010. Condiciones de seguridad — Prevención y protección contra incendios.",
      "NOM-006-STPS-2014. Manejo y almacenamiento de materiales.",
      "NOM-009-STPS-2011. Condiciones de seguridad para realizar trabajos en altura.",
      "NOM-017-STPS-2008. Equipo de protección personal.",
      "NOM-019-STPS-2011. Constitución, integración, organización y funcionamiento de las comisiones de seguridad e higiene.",
      "NOM-025-STPS-2008. Condiciones de iluminación en los centros de trabajo.",
      "NOM-026-STPS-2008. Colores y señales de seguridad e higiene.",
      "NOM-030-STPS-2009. Servicios preventivos de seguridad y salud en el trabajo.",
    ]},
    { cat: "Instituciones y organismos", items: [
      "Secretaría del Trabajo y Previsión Social (STPS). Registro de agentes capacitadores y formato DC-3.",
      "Secretaría de Educación Pública (SEP). Reconocimiento de Validez Oficial de Estudios (RVOE).",
      "Servicio de Administración Tributaria (SAT). Reglas de Resolución Miscelánea Fiscal 2026.",
      "Instituto Nacional de Estadística y Geografía (INEGI). Valor de la Unidad de Medida y Actualización (UMA) 2026: $113.14 MXN.",
      "Procuraduría Federal de la Defensa del Trabajo (PROFEDET). Guía de obligaciones patronales de capacitación.",
    ]},
    { cat: "Estudios y publicaciones", items: [
      "STPS (2025). \"Impacto de la capacitación laboral en la productividad empresarial\". Boletín estadístico.",
      "CONEVAL (2024). \"Evaluación de la política de capacitación y adiestramiento en México\".",
      "OIT — Organización Internacional del Trabajo (2024). \"Cooperativas y trabajo decente en América Latina\".",
      "INAES — Instituto Nacional de la Economía Social (2024). \"Panorama del cooperativismo en México\".",
    ]},
  ];

  refs.forEach(section => {
    sub(ctx, section.cat, CEDU_BLUE);
    section.items.forEach((item, i) => {
      ensureSpace(ctx, 18);
      const startY = ctx.doc.y;
      ctx.doc.font("Helvetica").fontSize(8.5).fillColor(INK_MUTED).text(`[${i + 1}]`, ML, startY, { width: 20, lineBreak: false });
      ctx.doc.font("Helvetica").fontSize(8.5).fillColor(INK).text(item, ML + 24, startY, { width: ctx.CW - 24, lineGap: 2 });
      ctx.doc.moveDown(0.15);
    });
    ctx.doc.moveDown(0.2);
  });
}


function backCover(ctx: DocCtx) {
  const { doc, PW, PH, CW } = ctx;
  doc.rect(0, 0, PW, PH).fill(INK);
  doc.rect(0, 0, PW, 5).fill(CEDU_ORANGE);

  const cy = PH * 0.35;
  doc.save();
  doc.roundedRect(PW / 2 - 26, cy - 55, 52, 52, 13).fill("rgba(255,255,255,0.08)");
  doc.fontSize(32).font("Helvetica-Bold").fillColor(WHITE).text("C", PW / 2 - 12, cy - 43, { lineBreak: false });
  doc.restore();

  doc.fontSize(26).font("Helvetica-Bold").fillColor(WHITE).text("Ceduverse", ML, cy + 10, { width: CW, align: "center" });
  doc.moveDown(0.4);
  doc.fontSize(11).font("Helvetica").fillColor("rgba(255,255,255,0.45)").text("Capacitación laboral inteligente para América Latina", ML, doc.y, { width: CW, align: "center" });

  doc.moveDown(2.5);
  doc.moveTo(PW * 0.38, doc.y).lineTo(PW * 0.62, doc.y).strokeColor("rgba(255,255,255,0.12)").lineWidth(0.5).stroke();
  doc.moveDown(1.5);

  doc.fontSize(10).font("Helvetica").fillColor("rgba(255,255,255,0.55)").text("ceduverse.org", ML, doc.y, { width: CW, align: "center" });
  doc.moveDown(0.4);
  doc.text(`${AUTHOR}  ·  ${AUTHOR_PHONE}`, ML, doc.y, { width: CW, align: "center" });
  doc.moveDown(0.4);
  doc.text("contacto@ceduverse.org", ML, doc.y, { width: CW, align: "center" });

  doc.moveDown(3);
  doc.fontSize(7.5).fillColor("rgba(255,255,255,0.25)").text(`© ${new Date().getFullYear()} Ceduverse. Todos los derechos reservados.`, ML, doc.y, { width: CW, align: "center" });
}
