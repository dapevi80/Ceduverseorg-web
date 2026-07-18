import { db } from "./db";
import { studioCourses, studioModules, studioQuizzes } from "@shared/schema";
import { sql } from "drizzle-orm";

interface OnboardingCourse {
  slug: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  durationMinutes: number;
  level: string;
  tags: string[];
  dc3Available: boolean;
  icon: string;
  color: string;
  source: string;
  instructor: string;
  modules: {
    title: string;
    description: string;
    contentHtml: string;
    durationMinutes: number;
    references?: string[];
  }[];
  quiz: {
    title: string;
    passingScore: number;
    questions: { question: string; options: string[]; correctIndex: number; explanation: string }[];
  };
}

const ONBOARDING_COURSES: OnboardingCourse[] = [
  {
    slug: "bienvenido-ceduverse",
    title: "Bienvenido a Ceduverse — Tu Plataforma de Capacitación Inteligente",
    description: "Conoce Ceduverse, aprende a usar el dashboard, diferencia los 3 sistemas de aprendizaje y obtén tus primeras certificaciones.",
    category: "Onboarding",
    subcategory: "Para Todos",
    durationMinutes: 30,
    level: "basico",
    tags: ["onboarding", "plataforma", "inicio"],
    dc3Available: false,
    icon: "🚀",
    color: "#1b5adf",
    source: "studio",
    instructor: "Psic. Yuridia Iturriaga",
    modules: [
      {
        title: "¿Qué es Ceduverse?",
        description: "Conoce la plataforma #1 en EdTech + IA para capacitación laboral en México.",
        contentHtml: `<h2>Bienvenido a Ceduverse</h2><p>Ceduverse es la <strong>plataforma #1 en EdTech + Inteligencia Artificial</strong> para capacitación laboral en México y Latinoamérica.</p><h3>¿Qué nos hace diferentes?</h3><ul><li><strong>Cursos diseñados por expertos</strong> en normatividad laboral, seguridad industrial y desarrollo humano</li><li><strong>Potenciados por IA:</strong> El contenido se personaliza a tu perfil, puesto e industria</li><li><strong>Diplomas blockchain:</strong> Certificados NFT verificables e infalsificables</li><li><strong>3 certificaciones oficiales:</strong> Diploma NFT, Constancia DC-3 STPS y Certificado SEP</li></ul><h3>3 Sistemas de Aprendizaje</h3><ol><li><strong>Aula Virtual STPS:</strong> 29 cursos con instructores reales (audio + infografías). Escucha la sesión completa y obtén tu diploma NFT automático.</li><li><strong>Tutor IA:</strong> 49+ cursos generados por inteligencia artificial, personalizados a tu perfil. Incluye lectura, mapa mental, quiz adaptativo y fuentes.</li><li><strong>Academy:</strong> +988 cursos del catálogo completo de capacitación profesional.</li></ol><h3>Respaldo Institucional</h3><p>Ceduverse está respaldada por:</p><ul><li><strong>Brainshield S.C.:</strong> Titular de toda la propiedad intelectual y tecnología</li><li><strong>Ceduverse S. C de C de Rl de CV:</strong> Cooperativa educativa que opera la plataforma</li></ul><p>A diferencia de los cursos tradicionales de capacitación, Ceduverse usa IA para adaptar el contenido a cada trabajador, mide resultados reales y genera evidencia para el SAT y la STPS.</p>`,
        durationMinutes: 8,
        references: ["ceduverse.org", "Ley Federal del Trabajo Arts. 132, 153"],
      },
      {
        title: "Cómo usar el Dashboard",
        description: "Tu panel principal: resumen, navegación y progreso.",
        contentHtml: `<h2>Tu Panel Principal</h2><p>Al iniciar sesión llegarás a tu <strong>Dashboard</strong>, el centro de control de tu experiencia en Ceduverse.</p><h3>¿Qué encontrarás?</h3><ul><li><strong>Resumen:</strong> Estadísticas de cursos completados, horas de estudio, logros desbloqueados y certificados obtenidos</li><li><strong>Progreso:</strong> Barra de avance de tus cursos activos</li><li><strong>Actividad reciente:</strong> Últimos cursos visitados y logros ganados</li></ul><h3>Sidebar — Tu Menú de Navegación</h3><p>En el menú lateral encontrarás:</p><ul><li><strong>📊 Dashboard:</strong> Tu panel principal con resumen y stats</li><li><strong>📚 Mis Cursos:</strong> Cursos en los que estás inscrito</li><li><strong>🎓 Aula Virtual:</strong> Los 29 cursos STPS con audio de instructores reales</li><li><strong>🤖 Tutor IA:</strong> Catálogo de 49+ cursos personalizados por IA</li><li><strong>📖 Academy:</strong> +988 cursos del catálogo completo</li><li><strong>🏆 Logros:</strong> Tus badges y reconocimientos</li><li><strong>💰 Wallet:</strong> Tu billetera Web3 con diplomas NFT</li><li><strong>📜 Certificados:</strong> Solicitar DC-3 STPS o Certificado SEP</li><li><strong>👤 Perfil:</strong> Tu información personal</li></ul><h3>Cómo inscribirte a un curso</h3><ol><li>Ve a <strong>Tutor IA</strong> o <strong>Aula Virtual</strong></li><li>Elige un curso que te interese</li><li>Haz clic en <strong>"Comenzar"</strong></li><li>Completa tu perfil de estudiante (solo la primera vez)</li><li>¡Listo! El contenido se genera personalizado para ti</li></ol>`,
        durationMinutes: 7,
      },
      {
        title: "Aula Virtual STPS vs Tutor IA",
        description: "Diferencias entre los sistemas de aprendizaje y cuál elegir.",
        contentHtml: `<h2>¿Cuál sistema elegir?</h2><p>Ceduverse tiene 3 sistemas de aprendizaje. Cada uno tiene un propósito diferente:</p><h3>🎓 Aula Virtual STPS</h3><ul><li><strong>29 cursos</strong> grabados por instructores certificados</li><li>Formato: <strong>Audio + infografía</strong> visual</li><li>Escuchas la sesión completa del instructor</li><li>Al terminar: <strong>Diploma NFT automático</strong> (gratuito)</li><li>Para obtener la <strong>DC-3</strong>: debes completar también el mismo curso en el Tutor IA</li><li><strong>Ideal para:</strong> aprendizaje guiado con voz de un experto</li></ul><h3>🤖 Tutor IA</h3><ul><li><strong>49+ cursos</strong> generados por inteligencia artificial</li><li>Antes de empezar: <strong>onboarding de perfil</strong> (puesto, industria, experiencia, metas)</li><li>El contenido se personaliza a TU contexto profesional</li><li>Cada módulo tiene 4 secciones:<ol><li><strong>📖 Lectura:</strong> Contenido adaptado a tu perfil</li><li><strong>🧠 Mapa Mental:</strong> Resumen visual interactivo</li><li><strong>❓ Quiz:</strong> Evaluación adaptativa</li><li><strong>📚 Fuentes:</strong> Referencias y material adicional</li></ol></li><li>Al aprobar la evaluación: puedes <strong>solicitar DC-3 o SEP</strong></li><li><strong>Ideal para:</strong> aprendizaje profundo y personalizado</li></ul><h3>📖 Academy</h3><ul><li><strong>+988 cursos</strong> del catálogo completo</li><li>Contenido extenso de capacitación profesional</li><li><strong>Ideal para:</strong> explorar temas adicionales más allá de la normatividad STPS</li></ul><h3>¿Cuál elegir?</h3><p>Si quieres <strong>cumplimiento STPS rápido</strong> → Aula Virtual. Si quieres <strong>aprendizaje profundo personalizado</strong> → Tutor IA. Si quieres <strong>explorar libremente</strong> → Academy.</p>`,
        durationMinutes: 8,
      },
      {
        title: "Tus Certificaciones",
        description: "Diploma NFT, Constancia DC-3 STPS y Certificado SEP.",
        contentHtml: `<h2>3 Niveles de Certificación</h2><p>Ceduverse ofrece 3 tipos de certificación, cada una con diferente nivel de validez:</p><h3>🏅 Diploma Digital (NFT)</h3><ul><li><strong>Costo:</strong> Gratis</li><li><strong>Cómo obtenerlo:</strong> Automático al completar un curso en el Aula Virtual o aprobar la evaluación en el Tutor IA</li><li><strong>Verificación:</strong> Blockchain — cualquier persona puede verificar su autenticidad escaneando el QR</li><li><strong>Tecnología:</strong> Se almacena en tu Wallet Web3 dentro de Ceduverse</li><li><strong>Validez:</strong> Constancia de participación digital verificable</li></ul><h3>📋 Constancia DC-3 STPS</h3><ul><li><strong>Costo:</strong> $499 MXN</li><li><strong>Requisito:</strong> Completar el curso tanto en Aula Virtual como en Tutor IA</li><li><strong>Trámite:</strong> A través de un Agente Capacitador Externo registrado ante la STPS</li><li><strong>Validez:</strong> Oficial ante la Secretaría del Trabajo y Previsión Social</li><li><strong>Uso:</strong> Acreditar capacitación obligatoria ante inspecciones STPS</li></ul><h3>🎓 Certificado SEP</h3><ul><li><strong>Costo:</strong> $1,999 MXN</li><li><strong>Requisito:</strong> Completar el curso y aprobar evaluación con calificación mínima</li><li><strong>Trámite:</strong> A través del Instituto Nacional de Educación para la Competitividad (INEC)</li><li><strong>Validez:</strong> Federal, emitido por la Secretaría de Educación Pública</li><li><strong>Uso:</strong> Equivalente a certificación educativa federal</li></ul><h3>Cómo solicitar</h3><ol><li>Ve a la sección <strong>Certificados</strong> en tu sidebar</li><li>Selecciona el curso y tipo de certificación</li><li>Realiza el pago (DC-3 o SEP)</li><li>Ceduverse gestiona el trámite con el emisor correspondiente</li><li>Recibirás notificación cuando tu certificado esté listo</li></ol><p><em>Nota: Ceduverse facilita el proceso pero no es el emisor directo de DC-3 ni SEP. Los tiempos dependen de terceros.</em></p>`,
        durationMinutes: 7,
        references: ["STPS - Sistema de Constancias DC-3", "SEP - INEC", "EIP-155 NFT Standard"],
      },
    ],
    quiz: {
      title: "Evaluación — Bienvenido a Ceduverse",
      passingScore: 70,
      questions: [
        { question: "¿Cuántos sistemas de aprendizaje tiene Ceduverse?", options: ["1", "2", "3", "5"], correctIndex: 2, explanation: "Ceduverse tiene 3 sistemas: Aula Virtual STPS, Tutor IA y Academy." },
        { question: "¿Qué certificación es gratuita y automática?", options: ["DC-3 STPS", "Certificado SEP", "Diploma NFT", "Todas"], correctIndex: 2, explanation: "El Diploma NFT se emite automáticamente al completar un curso y es gratuito." },
        { question: "¿Cuánto cuesta la Constancia DC-3 STPS?", options: ["Gratis", "$499 MXN", "$999 MXN", "$1,999 MXN"], correctIndex: 1, explanation: "La Constancia DC-3 STPS tiene un costo de $499 MXN." },
        { question: "¿Qué hace diferente al Tutor IA de los cursos tradicionales?", options: ["Es más barato", "Personaliza el contenido con IA según tu perfil", "Solo tiene videos", "No tiene evaluaciones"], correctIndex: 1, explanation: "El Tutor IA genera contenido personalizado según tu puesto, industria y experiencia." },
      ],
    },
  },

  {
    slug: "guia-empresas",
    title: "Guía para Empresas Patrocinadoras",
    description: "Todo lo que necesitas saber para capacitar a tu equipo con Ceduverse: planes, aportaciones, gestión de colaboradores y cumplimiento.",
    category: "Onboarding",
    subcategory: "Empresas",
    durationMinutes: 45,
    level: "basico",
    tags: ["onboarding", "empresas", "planes", "SAM"],
    dc3Available: false,
    icon: "🏢",
    color: "#f28023",
    source: "studio",
    instructor: "Psic. Yuridia Iturriaga",
    modules: [
      {
        title: "¿Por qué capacitar con Ceduverse?",
        description: "Obligaciones legales, multas STPS y beneficios fiscales.",
        contentHtml: `<h2>La Capacitación es Obligatoria</h2><p>La <strong>Ley Federal del Trabajo</strong> establece en sus artículos 132 y 153 que todo patrón tiene la obligación de proporcionar capacitación y adiestramiento a sus trabajadores.</p><h3>Consecuencias de No Capacitar</h3><ul><li><strong>Multas STPS:</strong> De 250 a 5,000 UMAs por infracción (de $28,285 a $565,700 MXN en 2026)</li><li><strong>Inspecciones:</strong> La STPS realiza más de 43,000 inspecciones al año</li><li><strong>Sanciones adicionales:</strong> Clausura temporal o definitiva del centro de trabajo en casos graves</li></ul><h3>NOMs Obligatorias por Sector</h3><p>Dependiendo de tu actividad económica, debes cumplir con normas específicas:</p><ul><li><strong>NOM-035-STPS:</strong> Factores de riesgo psicosocial (TODOS los centros de trabajo)</li><li><strong>NOM-036-STPS:</strong> Factores de riesgo ergonómico</li><li><strong>NOM-009-STPS:</strong> Trabajos en altura</li><li><strong>NOM-002-STPS:</strong> Prevención de incendios</li><li><strong>NOM-019-STPS:</strong> Comisiones de seguridad e higiene</li></ul><h3>Beneficio Fiscal</h3><p>Las aportaciones de capacitación son <strong>100% deducibles de impuestos</strong> conforme al Art. 25 de la Ley del ISR. Ceduverse genera CFDI automático para cada aportación.</p><h3>¿Por qué Ceduverse?</h3><ul><li>Cumples con la STPS sin contratar instructores externos</li><li>Todo digital: tus colaboradores aprenden desde cualquier dispositivo</li><li>Evidencia automática para inspecciones y el SAT</li><li>Un solo proveedor para todas las NOMs obligatorias</li></ul>`,
        durationMinutes: 12,
        references: ["LFT Arts. 132, 153", "LISR Art. 25", "STPS - Inspecciones 2025"],
      },
      {
        title: "Los Planes de Ceduverse",
        description: "Impulsa, Transforma y Lidera: elige el plan correcto para tu empresa.",
        contentHtml: `<h2>3 Planes para Cada Tamaño de Empresa</h2><p>Las aportaciones se calculan en <strong>UMAs</strong> (Unidad de Medida y Actualización) por colaborador por mes.</p><p><strong>UMA 2026: $113.14 MXN/día = $3,394.20 MXN/mes</strong></p><h3>📦 Plan Impulsa</h3><ul><li><strong>Aportación:</strong> 6 UMAs/colaborador/mes ≈ $678.84 MXN</li><li><strong>Fee administración:</strong> 15%</li><li><strong>Ideal para:</strong> Microempresas (1-10 colaboradores)</li><li><strong>Incluye:</strong> Acceso completo a Aula Virtual + Tutor IA + Academy</li></ul><h3>🚀 Plan Transforma</h3><ul><li><strong>Aportación:</strong> 10 UMAs/colaborador/mes ≈ $1,131.40 MXN</li><li><strong>Fee administración:</strong> 8%</li><li><strong>Ideal para:</strong> PyMEs (11-99 colaboradores)</li><li><strong>Incluye:</strong> Todo Impulsa + soporte prioritario + reportes avanzados</li></ul><h3>👑 Plan Lidera</h3><ul><li><strong>Aportación:</strong> 20 UMAs/colaborador/mes ≈ $2,262.80 MXN</li><li><strong>Fee administración:</strong> 5%</li><li><strong>Ideal para:</strong> Empresas grandes (100-500 colaboradores)</li><li><strong>Incluye:</strong> Todo Transforma + dashboard ejecutivo + atención personalizada</li></ul><h3>¿Qué incluye el Fee de Administración?</h3><p>El fee cubre la operación de la plataforma, tecnología, soporte, generación de contenido IA, certificaciones y cumplimiento normativo. Es el costo de mantener Ceduverse funcionando para tu empresa.</p>`,
        durationMinutes: 10,
        references: ["INEGI - UMA 2026", "Ceduverse - Tabla de planes"],
      },
      {
        title: "Aportaciones Mensuales (SAM)",
        description: "Cómo funciona la Solicitud de Aportación Mensual.",
        contentHtml: `<h2>¿Qué es la SAM?</h2><p>La <strong>Solicitud de Aportación Mensual</strong> es el documento digital que Ceduverse genera cada mes con el cálculo de tu aportación cooperativista.</p><h3>Proceso Mensual</h3><ol><li><strong>Generación automática:</strong> El 1° de cada mes, Ceduverse calcula tu SAM con base en el número de colaboradores activos y tu plan</li><li><strong>Revisión:</strong> Puedes revisar y ajustar el número de colaboradores desde tu panel de administración</li><li><strong>Confirmación digital:</strong> Confirmas la SAM con un clic. Esta confirmación genera un hash SHA-256 como evidencia legal</li><li><strong>Pago:</strong> Transferencia bancaria a BanRegio con la referencia proporcionada</li><li><strong>CFDI:</strong> Al registrar tu pago, Ceduverse genera automáticamente tu factura CFDI deducible</li></ol><h3>Fechas Importantes</h3><ul><li><strong>Día 1-5:</strong> Generación y revisión de SAM</li><li><strong>Día 5-10:</strong> Confirmación digital</li><li><strong>Día 10-15:</strong> Pago por transferencia</li><li><strong>Día 15-20:</strong> Emisión de CFDI</li></ul><h3>Ajustes</h3><ul><li>Puedes cambiar de plan mes a mes</li><li>Puedes agregar o quitar colaboradores en cualquier momento</li><li>Las aportaciones son <strong>voluntarias</strong> — no hay penalización por cancelar</li><li>No hay contratos de permanencia ni letra chiquita</li></ul>`,
        durationMinutes: 12,
        references: ["Art. 89 Bis del Código de Comercio", "SAT - CFDI 4.0"],
      },
      {
        title: "Gestión de tu Equipo",
        description: "Invita colaboradores, monitorea progreso y solicita certificaciones masivas.",
        contentHtml: `<h2>Administra tu Equipo desde Ceduverse</h2><h3>Invitar Colaboradores</h3><ul><li><strong>Individual:</strong> Ingresa el correo electrónico del colaborador desde tu panel</li><li><strong>Masivo:</strong> Sube un archivo Excel (.xlsx) con los datos de tus colaboradores</li><li>Cada colaborador recibe un correo de invitación con su acceso automático</li></ul><h3>Monitoreo de Progreso</h3><p>Desde la sección <strong>"Mi Organización"</strong> puedes ver:</p><ul><li>Cursos completados por cada colaborador</li><li>Horas de estudio acumuladas</li><li>Calificaciones en evaluaciones</li><li>Certificaciones obtenidas</li><li>Progreso general del equipo</li></ul><h3>Solicitud Masiva de DC-3</h3><p>Si varios colaboradores han completado un mismo curso, puedes solicitar las constancias DC-3 de todos en un solo trámite:</p><ol><li>Ve a <strong>Certificados</strong></li><li>Selecciona los colaboradores que aplican</li><li>Confirma el pago ($499 × número de DC-3)</li><li>Ceduverse gestiona todas las constancias con el Agente Capacitador Externo</li></ol><h3>Expediente de Materialidad Educativa</h3><p>Para el SAT y la STPS, Ceduverse genera automáticamente:</p><ul><li>Logs de actividad (inicio y fin de sesión de cada curso)</li><li>Capturas de evidencia de cada módulo completado</li><li>Registros de asistencia digital</li><li>Certificados emitidos con fecha y hora</li></ul><p>Este expediente protege a tu empresa ante requerimientos del SAT por deducción de gastos de capacitación (Art. 69-B CFF).</p>`,
        durationMinutes: 11,
        references: ["Art. 69-B CFF", "STPS - Formato DC-3", "LFT Art. 153-A"],
      },
    ],
    quiz: {
      title: "Evaluación — Guía para Empresas",
      passingScore: 70,
      questions: [
        { question: "¿Cuántas UMAs por colaborador/mes tiene el Plan Transforma?", options: ["6 UMAs", "10 UMAs", "15 UMAs", "20 UMAs"], correctIndex: 1, explanation: "El Plan Transforma tiene una aportación de 10 UMAs por colaborador por mes." },
        { question: "¿Las aportaciones son deducibles de impuestos?", options: ["No", "Sí, al 50%", "Sí, al 100%", "Solo el Plan Lidera"], correctIndex: 2, explanation: "Las aportaciones son 100% deducibles conforme al Art. 25 de la LISR." },
        { question: "¿Qué es la SAM?", options: ["Un examen", "La Solicitud de Aportación Mensual", "Un tipo de certificado", "El nombre del Tutor IA"], correctIndex: 1, explanation: "La SAM es la Solicitud de Aportación Mensual que se genera automáticamente cada mes." },
        { question: "¿Qué genera Ceduverse automáticamente como evidencia para el SAT?", options: ["Solo facturas", "Expediente de Materialidad Educativa", "Nada, es responsabilidad de la empresa", "Solo certificados"], correctIndex: 1, explanation: "Ceduverse genera el Expediente de Materialidad Educativa con logs, asistencia, capturas y certificados." },
      ],
    },
  },

  {
    slug: "guia-socios",
    title: "Guía para Socios Comerciales",
    description: "Entiende el programa de socios, modelo de comisiones, cómo vender Ceduverse y usa tu panel de socio.",
    category: "Onboarding",
    subcategory: "Socios",
    durationMinutes: 45,
    level: "basico",
    tags: ["onboarding", "socios", "comisiones", "ventas"],
    dc3Available: false,
    icon: "🤝",
    color: "#7c3aed",
    source: "studio",
    instructor: "Psic. Yuridia Iturriaga",
    modules: [
      {
        title: "El Programa de Socios Ceduverse",
        description: "Qué es, cómo funciona y por qué NO es MLM.",
        contentHtml: `<h2>Programa de Socios Comerciales</h2><p>El programa de socios de Ceduverse es un sistema de <strong>comisiones directas</strong> por referir empresas a la plataforma.</p><h3>¿Por qué NO es MLM?</h3><ul><li><strong>Solo 2 niveles:</strong> Consultor (vende) y Director (supervisa consultores). No hay cadenas infinitas.</li><li><strong>Ingresos reales:</strong> Ganas por vender un servicio real a empresas reales, no por reclutar personas</li><li><strong>Sin inversión inicial:</strong> No compras inventario ni "kits de inicio"</li><li><strong>Sin cuotas mensuales:</strong> No pagas nada para ser socio</li><li><strong>El producto tiene demanda real:</strong> La capacitación es obligatoria por ley (LFT)</li></ul><h3>4 Perfiles de Socio</h3><ol><li><strong>👷 Trabajador:</strong> Colaborador de empresa patrocinadora que refiere otras empresas</li><li><strong>👨‍🏫 Instructor:</strong> Profesional de capacitación que usa Ceduverse como herramienta</li><li><strong>💼 Consultor:</strong> Vendedor dedicado de planes Ceduverse</li><li><strong>👔 Director:</strong> Líder de equipo de consultores con override sobre ventas</li></ol><h3>¿De dónde salen tus comisiones?</h3><p>Del <strong>fee de administración</strong> que cobra Ceduverse sobre cada aportación. Es decir, cuando una empresa paga su aportación mensual, el fee se distribuye entre operaciones, consultores, directores y reservas.</p>`,
        durationMinutes: 10,
      },
      {
        title: "Modelo de Comisiones",
        description: "Cuánto ganas según tu perfil y nivel.",
        contentHtml: `<h2>Tabla de Comisiones</h2><h3>👷 Trabajador</h3><ul><li><strong>Comisión sobre fee:</strong> 10% mensual (por 12 meses)</li><li><strong>Comisión DC-3:</strong> $30 MXN por certificación</li><li><strong>Comisión SEP:</strong> $100 MXN por certificación</li></ul><h3>👨‍🏫 Instructor</h3><ul><li><strong>Comisión sobre fee:</strong> 15% mensual (por 24 meses)</li><li><strong>Comisión DC-3:</strong> $50 MXN por certificación</li><li><strong>Comisión SEP:</strong> $150 MXN por certificación</li></ul><h3>💼 Consultor</h3><ul><li><strong>Comisión sobre fee:</strong> 25% a 35% mensual (vitalicio)</li><li><strong>Tiers:</strong> 25% (1-3 empresas) → 30% (4-7 empresas) → 35% (8+ empresas)</li><li><strong>Comisión DC-3:</strong> $60 MXN por certificación</li><li><strong>Comisión SEP:</strong> $200 MXN por certificación</li></ul><h3>👔 Director</h3><ul><li><strong>Comisión sobre fee:</strong> 25-35% de su cartera propia (vitalicio)</li><li><strong>Override:</strong> 5% sobre las ventas de sus consultores</li><li><strong>Bonos:</strong> Por alcanzar metas de equipo</li></ul><h3>Regla 60/25/5/10</h3><p>Así se distribuye el fee de administración:</p><ul><li><strong>60%</strong> → Operaciones de Ceduverse (tecnología, soporte, contenido)</li><li><strong>25%</strong> → Consultor que vendió</li><li><strong>5%</strong> → Director del equipo</li><li><strong>10%</strong> → Fondo de reserva cooperativo</li></ul><h3>Ejemplo Real</h3><p>Si refieres <strong>3 empresas Plan Transforma con 30 colaboradores cada una</strong>:</p><ul><li>Aportación/empresa/mes: 30 cols × 10 UMAs × $113.14 = $33,942</li><li>Fee 8%: $2,715/empresa/mes</li><li>Tu comisión 25%: <strong>$679/empresa/mes × 3 = $2,037/mes</strong></li><li>Más comisiones DC-3 y SEP adicionales</li></ul>`,
        durationMinutes: 12,
      },
      {
        title: "Cómo Vender Ceduverse",
        description: "Tu código QR, los 5 pasos de venta y cómo manejar objeciones.",
        contentHtml: `<h2>Herramientas de Venta</h2><h3>Tu Código QR y URL Personalizada</h3><p>Al activarte como socio recibes:</p><ul><li><strong>Código QR único:</strong> La empresa lo escanea y queda vinculada a ti</li><li><strong>URL personalizada:</strong> Compártela por WhatsApp, email o redes</li><li><strong>Material descargable:</strong> Presentaciones, folletos y videos listos para enviar</li></ul><h3>5 Pasos para Vender</h3><ol><li><strong>Identificar:</strong> Encuentra empresas que necesiten capacitar (casi todas la necesitan por ley)</li><li><strong>Presentar:</strong> Usa el Kit Cooperativo — una presentación ejecutiva con datos del mercado</li><li><strong>Demostrar:</strong> Muestra el Tutor IA en vivo — la IA impresiona al prospecto</li><li><strong>Registrar:</strong> La empresa se registra con tu código QR</li><li><strong>Cobrar:</strong> Tu comisión se deposita mensualmente</li></ol><h3>Las 5 Objeciones Más Comunes</h3><ol><li><strong>"Ya capacitamos internamente"</strong> → "¿Tienen evidencia digital para el SAT? ¿Constancias DC-3? Ceduverse lo genera automáticamente."</li><li><strong>"Es muy caro"</strong> → "$679/mes por colaborador es menos que una multa de $565,000 MXN. Además es 100% deducible."</li><li><strong>"No tenemos tiempo"</strong> → "Los cursos son 100% en línea, cada trabajador aprende a su ritmo, desde su celular."</li><li><strong>"¿Y si no les gusta?"</strong> → "No hay contrato de permanencia. Pueden cancelar cuando quieran, sin penalización."</li><li><strong>"¿Es confiable?"</strong> → "Tenemos +988 cursos, certificaciones oficiales STPS y SEP, y tecnología blockchain para diplomas."</li></ol>`,
        durationMinutes: 12,
      },
      {
        title: "Tu Panel de Socio",
        description: "Dashboard, estadísticas, seguimiento y dispersión de comisiones.",
        contentHtml: `<h2>Tu Centro de Control como Socio</h2><h3>Dashboard de Socio</h3><p>Al iniciar sesión como socio, tu dashboard muestra:</p><ul><li><strong>Empresas referidas:</strong> Número y estado de cada empresa vinculada a tu código</li><li><strong>Colaboradores activos:</strong> Total de trabajadores capacitándose por tus referidos</li><li><strong>Comisiones del mes:</strong> Monto acumulado del mes actual</li><li><strong>Comisiones históricas:</strong> Total ganado desde que te activaste</li><li><strong>Tu código QR:</strong> Siempre visible para compartir rápidamente</li></ul><h3>Material de Ventas</h3><p>Desde tu panel puedes descargar:</p><ul><li>Presentación ejecutiva (Kit Cooperativo)</li><li>Folleto digital en PDF</li><li>Videos explicativos</li><li>Calculadora de ahorro para empresas</li></ul><h3>Seguimiento de Empresas</h3><p>Para cada empresa referida puedes ver:</p><ul><li>Estado: prospecto → registrada → activa → pagando</li><li>Plan contratado</li><li>Número de colaboradores</li><li>Aportaciones pagadas</li><li>Tu comisión generada</li></ul><h3>Dispersión de Comisiones</h3><p>Las comisiones se dispersan mensualmente vía <strong>Tokapay</strong> (plataforma de pagos). Recibes:</p><ul><li>Notificación cuando tu comisión está lista</li><li>Comprobante de pago digital</li><li>Historial completo de pagos</li></ul>`,
        durationMinutes: 11,
      },
    ],
    quiz: {
      title: "Evaluación — Guía para Socios",
      passingScore: 70,
      questions: [
        { question: "¿Cuántos niveles tiene el sistema de comisiones de Ceduverse?", options: ["1 nivel", "2 niveles", "5 niveles", "Infinitos (MLM)"], correctIndex: 1, explanation: "Solo hay 2 niveles: Consultor (vende) y Director (supervisa). No es MLM." },
        { question: "¿Qué porcentaje de comisión recibe un Consultor con 8+ empresas?", options: ["10%", "25%", "30%", "35%"], correctIndex: 3, explanation: "Con 8 o más empresas, el consultor alcanza el tier máximo de 35% sobre el fee." },
        { question: "¿Cuál es la distribución del fee según la Regla 60/25/5/10?", options: ["60% socio, 25% ops, 5% director, 10% reserva", "60% ops, 25% consultor, 5% director, 10% reserva", "60% empresa, 25% socio, 5% STPS, 10% SAT", "60% Ceduverse, 25% Brainshield, 5% director, 10% reserva"], correctIndex: 1, explanation: "60% operaciones, 25% consultor, 5% director, 10% fondo de reserva cooperativo." },
        { question: "¿Cómo se dispersan las comisiones?", options: ["En efectivo", "Vía Tokapay mensualmente", "En Bitcoin", "Con cheque"], correctIndex: 1, explanation: "Las comisiones se dispersan mensualmente vía Tokapay." },
      ],
    },
  },

  {
    slug: "modelo-cooperativo",
    title: "Modelo Cooperativo y Marco Legal",
    description: "Entiende qué es una cooperativa de educación, propiedad intelectual, cumplimiento fiscal y privacidad de datos.",
    category: "Onboarding",
    subcategory: "Para Todos",
    durationMinutes: 30,
    level: "basico",
    tags: ["onboarding", "legal", "cooperativa", "fiscal"],
    dc3Available: false,
    icon: "⚖️",
    color: "#00b87a",
    source: "studio",
    instructor: "Daniel Zavala",
    modules: [
      {
        title: "¿Qué es una Cooperativa de Educación?",
        description: "Ceduverse S. C de C de Rl de CV y su modelo cooperativo.",
        contentHtml: `<h2>Cooperativa de Educación</h2><h3>¿Qué es Ceduverse S. C de C de Rl de CV?</h3><p>Ceduverse es una <strong>Sociedad Cooperativa de Consumo de Responsabilidad Limitada de Capital Variable</strong>. Su objeto social es la educación y capacitación profesional.</p><h3>Diferencia Cooperativa vs Empresa Tradicional</h3><ul><li><strong>Empresa tradicional:</strong> Los accionistas buscan maximizar utilidades; los clientes son compradores</li><li><strong>Cooperativa:</strong> Los socios son dueños y usuarios al mismo tiempo; el objetivo es el beneficio colectivo</li></ul><h3>Fondos Cooperativos</h3><p>Por ley (Ley General de Sociedades Cooperativas), las cooperativas mantienen 3 fondos:</p><ol><li><strong>Fondo de Reserva:</strong> Para contingencias y estabilidad financiera</li><li><strong>Fondo de Previsión Social:</strong> Para beneficios de los socios y sus familias</li><li><strong>Fondo de Educación:</strong> Para programas educativos y capacitación continua</li></ol><h3>Aportaciones Voluntarias</h3><p>Las aportaciones de las empresas patrocinadoras a la cooperativa son <strong>completamente voluntarias</strong>:</p><ul><li>No generan obligación contractual perpetua</li><li>No hay penalización moratoria</li><li>No hay penalidades por cancelación</li><li>Los planes pueden ajustarse mes a mes</li><li>La cooperativa retiene un fee de administración para operar la plataforma</li></ul>`,
        durationMinutes: 8,
        references: ["Ley General de Sociedades Cooperativas", "Constitución Política Art. 25"],
      },
      {
        title: "Propiedad Intelectual y Tecnología",
        description: "Brainshield S.C. como titular de la PI y la licencia de uso.",
        contentHtml: `<h2>Propiedad Intelectual</h2><h3>¿Quién es Brainshield S.C.?</h3><p>Brainshield S.C. es la <strong>sociedad civil titular de toda la propiedad intelectual</strong> de Ceduverse. Esto incluye:</p><ul><li>Software y código fuente</li><li>Algoritmos e inteligencia artificial</li><li>Bases de datos y modelos de datos</li><li>Diseño visual, UX/UI y marca</li><li>Logotipos y elementos gráficos</li><li>Contenido generado por IA</li><li>Bots y asistentes virtuales</li></ul><h3>Licencia de Uso</h3><p>Ceduverse S. C de C de Rl de CV opera la plataforma bajo una <strong>licencia de uso otorgada por Brainshield S.C.</strong> Esto significa que:</p><ul><li>La cooperativa tiene derecho a usar la tecnología para su objeto social (educación)</li><li>La propiedad intelectual siempre pertenece a Brainshield</li><li>La licencia puede ser revocada si se viola los términos de uso</li></ul><h3>Lo que está Prohibido</h3><p>Como usuario de la plataforma, queda <strong>estrictamente prohibido</strong>:</p><ul><li>Copiar o reproducir el software</li><li>Modificar o alterar el código</li><li>Realizar ingeniería inversa o descompilar</li><li>Distribuir o sublicenciar a terceros</li><li>Crear obras derivadas</li></ul><p>Las violaciones se persiguen conforme a la <strong>Ley Federal del Derecho de Autor</strong> y la <strong>Ley de la Propiedad Industrial</strong>.</p>`,
        durationMinutes: 7,
        references: ["Ley Federal del Derecho de Autor", "Ley de la Propiedad Industrial"],
      },
      {
        title: "Cumplimiento Fiscal y Materialidad",
        description: "CFDI deducible, expediente de materialidad y defensa ante el SAT.",
        contentHtml: `<h2>Cumplimiento Fiscal</h2><h3>Deducibilidad 100%</h3><p>Las aportaciones de capacitación a la cooperativa son <strong>100% deducibles</strong> para efectos del Impuesto Sobre la Renta, conforme al Art. 25 de la LISR.</p><h3>CFDI Automático</h3><p>Ceduverse genera automáticamente el <strong>CFDI 4.0</strong> (Comprobante Fiscal Digital por Internet) cada vez que se registra un pago de aportación. No necesitas solicitarlo manualmente.</p><h3>Expediente de Materialidad Educativa</h3><p>El <strong>Art. 69-B del CFF</strong> establece que las deducciones deben ser comprobables con evidencia de materialidad. Ceduverse genera automáticamente:</p><ul><li><strong>Logs de actividad:</strong> Registros de inicio y fin de sesión de cada curso, con IP y dispositivo</li><li><strong>Capturas de evidencia:</strong> Registro de cada módulo completado</li><li><strong>Asistencia digital:</strong> Horas de estudio por colaborador</li><li><strong>Certificados:</strong> Diplomas NFT, DC-3 y SEP emitidos con fecha y hora</li><li><strong>Evaluaciones:</strong> Resultados de quizzes y exámenes</li></ul><h3>Defensa ante Requerimientos del SAT</h3><p>Si el SAT requiere evidencia de que la capacitación fue real (no solo "factureros"), el Expediente de Materialidad Educativa de Ceduverse demuestra que:</p><ol><li>Los colaboradores realmente tomaron los cursos</li><li>Dedicaron tiempo real de estudio (con logs verificables)</li><li>Aprobaron evaluaciones</li><li>Obtuvieron certificaciones oficiales</li></ol>`,
        durationMinutes: 8,
        references: ["Art. 25 LISR", "Art. 69-B CFF", "SAT - CFDI 4.0", "SAT - Materialidad de operaciones"],
      },
      {
        title: "Privacidad y Datos",
        description: "Aviso de privacidad, uso de IA, derechos ARCO y confidencialidad.",
        contentHtml: `<h2>Protección de Datos Personales</h2><h3>Aviso de Privacidad</h3><p>Ceduverse cumple con la <strong>Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong>. Nuestro aviso de privacidad detalla:</p><ul><li>Qué datos recopilamos</li><li>Para qué los usamos</li><li>Con quién los compartimos</li><li>Cómo los protegemos</li></ul><h3>Uso de Inteligencia Artificial</h3><p>Como usuario, reconoces que:</p><ul><li>Un motor de IA procesa y personaliza el contenido educativo</li><li>Las evaluaciones y recomendaciones son generadas por sistemas automatizados</li><li>El contenido de IA es revisado periódicamente pero puede contener imprecisiones</li><li>Las decisiones sobre certificados requieren intervención humana</li></ul><h3>Derechos ARCO</h3><p>Tienes derecho a:</p><ul><li><strong>A</strong>cceso: Conocer qué datos tenemos sobre ti</li><li><strong>R</strong>ectificación: Corregir datos inexactos</li><li><strong>C</strong>ancelación: Solicitar la eliminación de tus datos</li><li><strong>O</strong>posición: Oponerte al tratamiento de tus datos</li></ul><p>Envía tu solicitud ARCO a: <strong>privacidad@ceduverse.org</strong></p><h3>Confidencialidad Perpetua</h3><p>Como usuario, te comprometes a mantener en secreto cualquier información técnica, comercial, financiera o estratégica a la que tengas acceso. Esta obligación <strong>subsiste de manera indefinida</strong> tras la terminación de la relación.</p>`,
        durationMinutes: 7,
        references: ["LFPDPPP", "Aviso de Privacidad Ceduverse", "INAI - Derechos ARCO"],
      },
    ],
    quiz: {
      title: "Evaluación — Modelo Cooperativo y Marco Legal",
      passingScore: 70,
      questions: [
        { question: "¿Qué tipo de sociedad es Ceduverse?", options: ["S.A. de C.V.", "Sociedad Cooperativa de Consumo", "LLC americana", "Asociación Civil"], correctIndex: 1, explanation: "Ceduverse es una Sociedad Cooperativa de Consumo de Responsabilidad Limitada de Capital Variable." },
        { question: "¿Quién es titular de la propiedad intelectual de Ceduverse?", options: ["Ceduverse", "Los usuarios", "Brainshield S.C.", "La STPS"], correctIndex: 2, explanation: "Brainshield S.C. es el titular de toda la propiedad intelectual." },
        { question: "¿Qué genera Ceduverse para defender la deducibilidad fiscal?", options: ["Solo facturas CFDI", "Expediente de Materialidad Educativa", "Carta del SAT", "Nada, es responsabilidad del contador"], correctIndex: 1, explanation: "El Expediente de Materialidad Educativa incluye logs, asistencia, evaluaciones y certificados." },
        { question: "¿Qué son los derechos ARCO?", options: ["Un tipo de certificación", "Acceso, Rectificación, Cancelación y Oposición sobre datos personales", "Los 4 planes de Ceduverse", "Los niveles de socio"], correctIndex: 1, explanation: "ARCO = Acceso, Rectificación, Cancelación y Oposición de datos personales." },
      ],
    },
  },

  {
    slug: "como-ganar-ceduverse",
    title: "Cómo Ganar con Ceduverse — Tu Modelo de Ingresos",
    description: "Domina el modelo de ingresos de Ceduverse: tabla de comisiones por perfil, proyecciones reales mes a mes, programa Elite y tu plan de acción para los primeros 90 días.",
    category: "Onboarding",
    subcategory: "Socios",
    durationMinutes: 40,
    level: "basico",
    tags: ["onboarding", "socios", "ingresos", "comisiones", "elite", "estrategia"],
    dc3Available: false,
    icon: "💰",
    color: "#16a34a",
    source: "studio",
    instructor: "Psic. Yuridia Iturriaga",
    modules: [
      {
        title: "Tabla de Comisiones por Perfil",
        description: "Cuánto ganas según tu perfil, con ejemplos concretos y cálculos reales.",
        contentHtml: `<h2>Tu Ingreso Depende de tu Perfil</h2><p>Ceduverse tiene <strong>4 perfiles de socio</strong>, cada uno con su propia estructura de comisiones. Lo importante es que <strong>ganas comisiones recurrentes</strong> — mientras tus empresas referidas sigan activas, tú sigues ganando.</p><h3>Datos Base para los Cálculos</h3><ul><li><strong>UMA 2026:</strong> $113.14 MXN/día</li><li><strong>Plan Impulsa:</strong> 6 UMAs/col/mes = $678.84 — Fee 15% = $101.83</li><li><strong>Plan Transforma:</strong> 10 UMAs/col/mes = $1,131.40 — Fee 8% = $90.51</li><li><strong>Plan Lidera:</strong> 20 UMAs/col/mes = $2,262.80 — Fee 5% = $113.14</li></ul><h3>👷 Trabajador</h3><table><tr><th>Concepto</th><th>Valor</th></tr><tr><td>Comisión sobre fee</td><td>10% mensual</td></tr><tr><td>Duración</td><td>12 meses desde la primera aportación</td></tr><tr><td>DC-3</td><td>$30 MXN por certificación</td></tr><tr><td>SEP</td><td>$100 MXN por certificación</td></tr></table><p><strong>Ejemplo:</strong> Refieres 1 empresa Plan Transforma con 20 colaboradores.</p><ul><li>Fee mensual: 20 × $90.51 = $1,810.20</li><li>Tu comisión (10%): <strong>$181.02/mes durante 12 meses = $2,172.24 total</strong></li><li>Si 10 colaboradores sacan DC-3: 10 × $30 = $300 extra</li></ul><h3>👨‍🏫 Instructor</h3><table><tr><th>Concepto</th><th>Valor</th></tr><tr><td>Comisión sobre fee</td><td>15% mensual</td></tr><tr><td>Duración</td><td>24 meses</td></tr><tr><td>DC-3</td><td>$50 MXN por certificación</td></tr><tr><td>SEP</td><td>$150 MXN por certificación</td></tr></table><p><strong>Ejemplo:</strong> Refieres 2 empresas Plan Transforma con 25 colaboradores cada una.</p><ul><li>Fee mensual por empresa: 25 × $90.51 = $2,262.75</li><li>Tu comisión por empresa (15%): $339.41</li><li><strong>Total: $678.82/mes durante 24 meses = $16,291.68</strong></li></ul><h3>💼 Consultor</h3><table><tr><th>Concepto</th><th>Valor</th></tr><tr><td>Comisión sobre fee</td><td>25%-35% mensual (según tier)</td></tr><tr><td>Tier 1 (1-3 empresas)</td><td>25%</td></tr><tr><td>Tier 2 (4-7 empresas)</td><td>30%</td></tr><tr><td>Tier 3 (8+ empresas)</td><td>35%</td></tr><tr><td>Duración</td><td>Vitalicia (mientras la empresa siga activa)</td></tr><tr><td>DC-3</td><td>$60 MXN por certificación</td></tr><tr><td>SEP</td><td>$200 MXN por certificación</td></tr></table><p><strong>Ejemplo:</strong> Tienes 5 empresas Plan Transforma con 30 cols promedio (Tier 2).</p><ul><li>Fee por empresa: 30 × $90.51 = $2,715.30</li><li>Tu comisión por empresa (30%): $814.59</li><li><strong>Total: $4,072.95/mes — ¡de por vida!</strong></li></ul><h3>👔 Director</h3><table><tr><th>Concepto</th><th>Valor</th></tr><tr><td>Comisión propia</td><td>25%-35% (igual que Consultor)</td></tr><tr><td>Override sobre consultores</td><td>5% del fee de ventas de su equipo</td></tr><tr><td>Duración</td><td>Vitalicia</td></tr></table><p><strong>Ejemplo:</strong> Cartera propia de 3 empresas + equipo de 4 consultores con 5 empresas cada uno.</p><ul><li>Comisión propia: 3 × $814.59 = $2,443.77/mes</li><li>Override: 20 empresas × $2,715.30 fee × 5% = $2,715.30/mes</li><li><strong>Total: $5,159.07/mes</strong></li></ul>`,
        durationMinutes: 12,
        references: ["INEGI - UMA 2026", "Ceduverse - Tabla de comisiones"],
      },
      {
        title: "Calculadora de Ingresos — Proyecciones Reales",
        description: "Proyecciones mes a mes para tu primer año como socio comercial.",
        contentHtml: `<h2>Proyecciones de Ingreso: Primer Año como Consultor</h2><p>Estas proyecciones usan datos conservadores: empresas Plan Transforma con 25 colaboradores promedio y comisiones de Consultor.</p><h3>Supuestos</h3><ul><li><strong>Plan:</strong> Transforma (10 UMAs, fee 8%)</li><li><strong>Colaboradores promedio:</strong> 25 por empresa</li><li><strong>Fee por empresa:</strong> 25 × $90.51 = $2,262.75/mes</li><li><strong>Ritmo de cierre:</strong> 1 empresa nueva cada mes (conservador)</li><li><strong>Retención:</strong> 90% (pierdes ~1 de cada 10 empresas)</li></ul><h3>Proyección Mes a Mes</h3><table><tr><th>Mes</th><th>Empresas Acum.</th><th>Tier</th><th>Comisión %</th><th>Ingreso Mensual</th></tr><tr><td>Mes 1</td><td>1</td><td>Tier 1</td><td>25%</td><td>$565.69</td></tr><tr><td>Mes 2</td><td>2</td><td>Tier 1</td><td>25%</td><td>$1,131.38</td></tr><tr><td>Mes 3</td><td>3</td><td>Tier 1</td><td>25%</td><td>$1,697.06</td></tr><tr><td>Mes 4</td><td>4</td><td>Tier 2</td><td>30%</td><td>$2,715.30</td></tr><tr><td>Mes 5</td><td>5</td><td>Tier 2</td><td>30%</td><td>$3,394.13</td></tr><tr><td>Mes 6</td><td>6</td><td>Tier 2</td><td>30%</td><td>$4,072.95</td></tr><tr><td>Mes 7</td><td>7</td><td>Tier 2</td><td>30%</td><td>$4,751.78</td></tr><tr><td>Mes 8</td><td>8</td><td>Tier 3</td><td>35%</td><td>$6,335.70</td></tr><tr><td>Mes 9</td><td>9</td><td>Tier 3</td><td>35%</td><td>$7,127.66</td></tr><tr><td>Mes 10</td><td>10</td><td>Tier 3</td><td>35%</td><td>$7,919.63</td></tr><tr><td>Mes 11</td><td>10</td><td>Tier 3</td><td>35%</td><td>$7,919.63</td></tr><tr><td>Mes 12</td><td>11</td><td>Tier 3</td><td>35%</td><td>$8,711.59</td></tr></table><p><em>Nota: Mes 11 refleja la pérdida de 1 empresa por retención del 90%.</em></p><h3>Ingreso Acumulado Año 1</h3><ul><li><strong>Total año 1:</strong> ~$56,342 MXN en comisiones sobre fee</li><li><strong>Más certificaciones:</strong> Si 50% de colaboradores sacan DC-3 → ~$8,250 extra</li><li><strong>Total estimado año 1:</strong> ~$64,592 MXN</li></ul><h3>Año 2: El Efecto Compuesto</h3><p>En el año 2 ya tienes ~11 empresas base + sigues cerrando:</p><ul><li>Si llegas a 18 empresas (Tier 3): <strong>~$14,248/mes = $170,978/año</strong></li><li>Si llegas a 26 empresas (Leyenda): <strong>~$20,604/mes = $247,245/año</strong></li></ul><h3>Comparación con Empleo Tradicional</h3><table><tr><th>Concepto</th><th>Empleo promedio MX</th><th>Consultor Ceduverse (Año 2)</th></tr><tr><td>Ingreso mensual</td><td>$8,500 MXN</td><td>$14,248 - $20,604 MXN</td></tr><tr><td>Horario</td><td>8-6 L-V</td><td>Flexible</td></tr><tr><td>Techo de ingreso</td><td>Fijo (salario)</td><td>Sin tope</td></tr><tr><td>Ingresos pasivos</td><td>No</td><td>Sí (comisiones recurrentes)</td></tr></table><p><strong>Importante:</strong> Estos son estimados conservadores. Tu ingreso real depende de tu esfuerzo, el tamaño de las empresas que cierres y tu capacidad de retención.</p>`,
        durationMinutes: 10,
        references: ["INEGI - Salario promedio 2026", "Ceduverse - Modelo de comisiones"],
      },
      {
        title: "Programa Elite — Cómo Subir de Nivel y Bonos",
        description: "Los 5 niveles Elite, bonos adicionales y cómo maximizar tus ingresos.",
        contentHtml: `<h2>Programa Elite: Tu Acelerador de Ingresos</h2><p>El programa Elite es un <strong>bono adicional</strong> que se suma a tus comisiones base. Mientras más empresas activas tengas, más ganas.</p><h3>Los 5 Niveles y sus Bonos</h3><table><tr><th>Nivel</th><th>Empresas</th><th>Bono sobre Fee</th><th>Ingreso Extra (ejemplo 25 cols/empresa)</th></tr><tr><td>🌱 Semilla</td><td>0-2</td><td>0%</td><td>$0</td></tr><tr><td>🌿 Brote</td><td>3-5</td><td>+5%</td><td>+$339 a $565/mes</td></tr><tr><td>🌳 Árbol</td><td>6-10</td><td>+8%</td><td>+$1,086 a $1,810/mes</td></tr><tr><td>🌲 Bosque</td><td>11-25</td><td>+12%</td><td>+$2,987 a $6,789/mes</td></tr><tr><td>🏆 Leyenda</td><td>26+</td><td>+15%</td><td>+$8,825+/mes</td></tr></table><h3>¿Cómo se Calcula el Bono?</h3><p>El bono Elite se aplica sobre el <strong>fee total acumulado</strong> de todas tus empresas activas:</p><ol><li>Se suman los fees de todas tus empresas del mes</li><li>Se multiplica por tu porcentaje de bono Elite</li><li>Se deposita junto con tu comisión regular</li></ol><p><strong>Ejemplo Nivel Árbol (8 empresas, 25 cols promedio):</strong></p><ul><li>Fee total: 8 × $2,262.75 = $18,102</li><li>Comisión base (35%): $6,335.70</li><li>Bono Elite (8%): $1,448.16</li><li><strong>Total: $7,783.86/mes</strong></li></ul><h3>Requisitos para Subir de Nivel</h3><ul><li><strong>Empresas activas:</strong> Con aportaciones al corriente (no atrasadas más de 30 días)</li><li><strong>Antigüedad mínima:</strong> Cada empresa debe tener al menos 3 meses de aportaciones consecutivas</li><li><strong>Sin incidentes:</strong> No tener quejas formales de empresas referidas</li><li><strong>Verificación automática:</strong> El sistema revisa tu cartera el día 1 de cada mes</li></ul><h3>¿Puedo Bajar de Nivel?</h3><p>Sí. Si pierdes empresas y bajas del umbral, tu nivel se ajusta al mes siguiente. Los bonos ya pagados no se devuelven.</p><h3>Beneficios No Monetarios por Nivel</h3><ul><li><strong>Brote:</strong> Capacitación avanzada de ventas + webinars mensuales</li><li><strong>Árbol:</strong> Eventos trimestrales + mentoría 1:1 con directores top</li><li><strong>Bosque:</strong> Acceso anticipado a nuevas funciones + material premium personalizado</li><li><strong>Leyenda:</strong> Membresía VIP + participación en decisiones de producto + reconocimiento público</li></ul><h3>Ingreso Máximo Teórico</h3><p>Un Consultor nivel Leyenda con 30 empresas Plan Lidera (100 cols cada una):</p><ul><li>Fee total: 30 × 100 × $113.14 = $339,420</li><li>Comisión (35%): $118,797</li><li>Bono Elite (15%): $50,913</li><li><strong>Total: $169,710/mes</strong></li></ul><p><em>Aunque este escenario es ambicioso, ilustra que no hay techo en el modelo de Ceduverse.</em></p>`,
        durationMinutes: 10,
        references: ["Ceduverse - Programa Elite", "Ceduverse - Tabla de bonos"],
      },
      {
        title: "Estrategia Práctica — Los Primeros 90 Días",
        description: "Tu plan de acción paso a paso para empezar a generar ingresos desde el primer mes.",
        contentHtml: `<h2>Tu Plan de Acción: Primeros 90 Días</h2><p>Los primeros 90 días son críticos. Aquí tienes un plan concreto, semana a semana, para empezar a generar ingresos.</p><h3>Semana 1-2: Preparación</h3><ul><li><strong>Día 1-3:</strong> Completa TODOS los cursos de onboarding de Ceduverse (incluyendo este)</li><li><strong>Día 4-5:</strong> Descarga tu Kit Cooperativo y material de ventas desde tu panel de socio</li><li><strong>Día 6-7:</strong> Haz una demo del Tutor IA tú mismo — toma un curso completo para poder mostrar la experiencia en vivo</li><li><strong>Día 8-10:</strong> Identifica tu mercado meta geográfico (empresas a 30 min de ti)</li><li><strong>Día 11-14:</strong> Construye una lista de 30 prospectos (empresas con 10+ empleados en tu zona)</li></ul><h3>Semana 3-4: Primeros Contactos</h3><ul><li><strong>Meta:</strong> Contactar 15-20 prospectos</li><li><strong>Canales:</strong><ul><li>WhatsApp directo al dueño/RH (el más efectivo)</li><li>Visita presencial con folleto</li><li>LinkedIn para empresas medianas-grandes</li></ul></li><li><strong>Script de contacto:</strong> "Hola [nombre], soy [tu nombre] de Ceduverse. ¿Sabías que la capacitación laboral es obligatoria por ley y las multas llegan hasta $565,000? Ceduverse te ayuda a cumplir 100% en línea, con evidencia fiscal automática. ¿Tienes 15 min para una demo?"</li><li><strong>Objetivo:</strong> Agendar 5-8 demos</li></ul><h3>Semana 5-6: Demos y Cierres</h3><ul><li><strong>Meta:</strong> Cerrar tu primera empresa</li><li><strong>En la demo, muestra:</strong><ol><li>El problema: multas STPS, evidencia SAT</li><li>La solución: cursos STPS + Tutor IA + certificaciones</li><li>La experiencia: abre el Tutor IA en vivo y muestra la personalización con IA</li><li>El precio: "Desde $679/colaborador/mes, 100% deducible"</li><li>El cierre: "¿Cuántos colaboradores tienes? Escanea este QR y en 5 min está listo"</li></ol></li><li><strong>Manejo de objeciones:</strong> Usa las 5 objeciones del curso "Guía para Socios"</li></ul><h3>Semana 7-8: Escala</h3><ul><li><strong>Meta:</strong> 2-3 empresas activas</li><li><strong>Acciones:</strong><ul><li>Pide referidos a tu primera empresa: "¿Conoces a alguien que también necesite capacitar?"</li><li>Contacta a los prospectos que no cerraron — el seguimiento cierra más ventas que el primer contacto</li><li>Amplía tu lista de prospectos a 50</li></ul></li></ul><h3>Semana 9-12: Consolida</h3><ul><li><strong>Meta:</strong> 3-5 empresas activas (nivel Brote)</li><li><strong>Acciones:</strong><ul><li>Da seguimiento mensual a tus empresas activas — asegúrate de que usen la plataforma</li><li>Envía reportes de progreso a tus empresas: "Tus colaboradores completaron X cursos este mes"</li><li>Diversifica sectores: si empezaste con comercio, prueba manufactura o servicios</li><li>Comparte tu enlace de referido en redes sociales y grupos de WhatsApp</li></ul></li></ul><h3>Métricas que Debes Rastrear</h3><table><tr><th>Métrica</th><th>Meta Semanal</th><th>Meta Mensual</th></tr><tr><td>Prospectos contactados</td><td>5-10</td><td>20-40</td></tr><tr><td>Demos agendadas</td><td>2-3</td><td>8-12</td></tr><tr><td>Demos realizadas</td><td>2</td><td>6-8</td></tr><tr><td>Empresas cerradas</td><td>0-1</td><td>1-2</td></tr><tr><td>Tasa de cierre objetivo</td><td colspan="2">20-30% de demos</td></tr></table><h3>Errores Comunes a Evitar</h3><ol><li><strong>No hacer demos en vivo:</strong> Mostrar el Tutor IA en acción es tu mejor herramienta de venta</li><li><strong>Abandonar prospectos:</strong> El 80% de las ventas se cierran entre el 3° y 5° seguimiento</li><li><strong>Ignorar a clientes actuales:</strong> Un cliente satisfecho te refiere 2-3 empresas más</li><li><strong>No capacitarte:</strong> Conoce la plataforma mejor que nadie para transmitir confianza</li><li><strong>Esperar resultados inmediatos:</strong> El modelo es de ingreso recurrente — la magia está en acumular empresas mes a mes</li></ol><h3>Tu Ingreso Proyectado a 90 Días</h3><p>Con 3 empresas Plan Transforma de 25 colaboradores:</p><ul><li>Fee mensual total: 3 × $2,262.75 = $6,788.25</li><li>Tu comisión (25%, Tier 1): <strong>$1,697.06/mes</strong></li><li>Bono Brote (+5%): <strong>$339.41/mes</strong></li><li><strong>Total: $2,036.47/mes recurrente</strong></li></ul><p>Y apenas estás empezando. En 6 meses podrías estar en $4,000-5,000/mes. En 12 meses, $8,000-10,000/mes.</p>`,
        durationMinutes: 8,
        references: ["Ceduverse - Kit Cooperativo", "Ceduverse - Guía de ventas"],
      },
    ],
    quiz: {
      title: "Evaluación — Cómo Ganar con Ceduverse",
      passingScore: 70,
      questions: [
        { question: "¿Cuánto gana un Consultor Tier 2 (4-7 empresas) sobre el fee?", options: ["10%", "25%", "30%", "35%"], correctIndex: 2, explanation: "Un Consultor con 4-7 empresas está en Tier 2 y gana el 30% sobre el fee de administración." },
        { question: "¿Cuál es el bono adicional del nivel Árbol en el programa Elite?", options: ["+5%", "+8%", "+12%", "+15%"], correctIndex: 1, explanation: "El nivel Árbol (6-10 empresas) otorga un bono adicional de +8% sobre el fee acumulado." },
        { question: "¿Cuántas empresas necesitas para alcanzar el nivel Leyenda?", options: ["10+", "15+", "20+", "26+"], correctIndex: 3, explanation: "El nivel Leyenda requiere 26 o más empresas activas con al menos 3 meses de aportaciones." },
        { question: "¿Cuántos prospectos debes tener en tu lista inicial según el plan de 90 días?", options: ["10", "20", "30", "50"], correctIndex: 2, explanation: "El plan recomienda construir una lista inicial de 30 prospectos en las primeras 2 semanas." },
        { question: "¿Por cuánto tiempo gana comisiones un Consultor sobre sus empresas referidas?", options: ["12 meses", "24 meses", "36 meses", "De por vida (mientras la empresa esté activa)"], correctIndex: 3, explanation: "Las comisiones del Consultor son vitalicias — ganas mientras la empresa siga activa y pagando." },
      ],
    },
  },

  {
    slug: "programa-elite",
    title: "Programa Ceduverse Elite — Bonos y Reconocimientos",
    description: "Conoce los 5 niveles del programa Elite, cómo subir de nivel, beneficios exclusivos y estrategia para llegar a Leyenda.",
    category: "Onboarding",
    subcategory: "Socios",
    durationMinutes: 20,
    level: "intermedio",
    tags: ["onboarding", "elite", "bonos", "niveles"],
    dc3Available: false,
    icon: "👑",
    color: "#f59e0b",
    source: "studio",
    instructor: "Psic. Yuridia Iturriaga",
    modules: [
      {
        title: "Los 5 Niveles del Programa Elite",
        description: "De Semilla a Leyenda: tu camino como socio top.",
        contentHtml: `<h2>Programa Elite</h2><p>El programa Elite reconoce y premia a los socios que construyen una cartera sólida de empresas.</p><h3>Los 5 Niveles</h3><ol><li><strong>🌱 Semilla</strong> (0-2 empresas)<ul><li>Nivel inicial — estás comenzando tu cartera</li><li>Sin bono adicional sobre fee</li><li>Acceso a material básico de ventas</li></ul></li><li><strong>🌿 Brote</strong> (3-5 empresas)<ul><li>Bono adicional: <strong>+5%</strong> sobre fee acumulado</li><li>Acceso a capacitación avanzada de ventas</li><li>Badge "Brote" en tu perfil</li></ul></li><li><strong>🌳 Árbol</strong> (6-10 empresas)<ul><li>Bono adicional: <strong>+8%</strong> sobre fee acumulado</li><li>Invitación a eventos trimestrales</li><li>Mentoría con directores top</li><li>Badge "Árbol" dorado</li></ul></li><li><strong>🌲 Bosque</strong> (11-25 empresas)<ul><li>Bono adicional: <strong>+12%</strong> sobre fee acumulado</li><li>Acceso anticipado a nuevas funciones</li><li>Material premium y exclusivo</li><li>Badge "Bosque" platino</li></ul></li><li><strong>🏆 Leyenda</strong> (26+ empresas)<ul><li>Bono adicional: <strong>+15%</strong> sobre fee acumulado</li><li>Membresía VIP con beneficios exclusivos</li><li>Participación en decisiones de producto</li><li>Badge "Leyenda" diamante</li></ul></li></ol>`,
        durationMinutes: 5,
      },
      {
        title: "Cómo Subir de Nivel",
        description: "Requisitos y verificación automática.",
        contentHtml: `<h2>Requisitos por Nivel</h2><p>Los niveles se verifican <strong>automáticamente cada mes</strong> con base en tu cartera activa de empresas.</p><h3>Criterios de Evaluación</h3><ul><li><strong>Empresas activas:</strong> Empresas que tienen aportación al corriente (no atrasada más de 30 días)</li><li><strong>Retención:</strong> Para subir de nivel, las empresas deben tener al menos 3 meses de aportaciones consecutivas</li><li><strong>Sin incidentes:</strong> No tener quejas formales de empresas referidas</li></ul><h3>Verificación Mensual</h3><p>El sistema verifica automáticamente tu cartera el día 1 de cada mes:</p><ol><li>Cuenta tus empresas activas con aportaciones al corriente</li><li>Verifica que cumplan el mínimo de 3 meses</li><li>Calcula tu nivel correspondiente</li><li>Aplica el bono adicional sobre tu fee del mes</li></ol><h3>¿Puedo bajar de nivel?</h3><p>Sí. Si pierdes empresas (cancelan o dejan de pagar) y bajas del umbral de tu nivel actual, tu nivel se ajusta al mes siguiente. Sin embargo, los bonos ya pagados no se recuperan.</p><h3>Ejemplo</h3><p>Si eres nivel Árbol con 8 empresas y 2 cancelan, bajarías a 6 empresas (sigue siendo Árbol). Si otra cancela y bajas a 5, pasarías a Brote al mes siguiente.</p>`,
        durationMinutes: 5,
      },
      {
        title: "Beneficios Exclusivos",
        description: "Acceso anticipado, eventos VIP, mentoría y material premium.",
        contentHtml: `<h2>Beneficios por Nivel</h2><h3>Para todos los niveles:</h3><ul><li>Dashboard personalizado con métricas en tiempo real</li><li>Material de ventas digital descargable</li><li>Soporte por chat dentro de la plataforma</li><li>Acceso completo a todos los cursos de capacitación</li></ul><h3>Brote y superiores:</h3><ul><li><strong>Capacitación avanzada de ventas:</strong> Módulos exclusivos sobre técnicas de cierre, manejo de objeciones y prospección</li><li><strong>Webinars mensuales:</strong> Con directivos de Ceduverse sobre novedades y estrategias</li></ul><h3>Árbol y superiores:</h3><ul><li><strong>Eventos trimestrales:</strong> Networking con otros socios y presentaciones de nuevos productos</li><li><strong>Mentoría 1:1:</strong> Sesiones con directores top para mejorar tu estrategia de ventas</li><li><strong>Acceso a datos de mercado:</strong> Reportes sectoriales y geográficos para prospección</li></ul><h3>Bosque y superiores:</h3><ul><li><strong>Acceso anticipado:</strong> Prueba nuevas funciones antes que nadie</li><li><strong>Material premium:</strong> Presentaciones ejecutivas personalizadas con tu marca</li><li><strong>Línea directa:</strong> Canal de comunicación prioritario con el equipo Ceduverse</li></ul><h3>Leyenda:</h3><ul><li><strong>Membresía VIP:</strong> Beneficios exclusivos que se negocian individualmente</li><li><strong>Participación en roadmap:</strong> Tu opinión influye en las decisiones de producto</li><li><strong>Reconocimiento público:</strong> Apareces como socio destacado en eventos y material</li></ul>`,
        durationMinutes: 5,
      },
      {
        title: "Tu Camino a Leyenda",
        description: "Estrategia de planificación, retención y crecimiento.",
        contentHtml: `<h2>De Semilla a Leyenda en 12 Meses</h2><p>Es posible llegar al nivel más alto en un año con una estrategia disciplinada.</p><h3>Plan Trimestral</h3><ul><li><strong>Meses 1-3 (Semilla → Brote):</strong> Cierra 3-5 empresas enfocándote en PyMEs de tu zona geográfica. Usa el Kit Cooperativo y demos del Tutor IA.</li><li><strong>Meses 4-6 (Brote → Árbol):</strong> Expande a 6-10 empresas. Pide referidos a tus clientes actuales — una empresa satisfecha te recomienda 2-3 más.</li><li><strong>Meses 7-9 (Árbol → Bosque):</strong> Llega a 11-15 empresas. Diversifica sectores: manufactura, comercio, servicios.</li><li><strong>Meses 10-12 (Bosque → camino a Leyenda):</strong> Apunta a 20+ empresas. Formaliza tu operación con un Director.</li></ul><h3>Estrategia de Retención</h3><p>Cerrar empresas es importante, pero <strong>retenerlas es más importante</strong>:</p><ul><li><strong>Seguimiento mensual:</strong> Llama a cada empresa una vez al mes para revisar su progreso</li><li><strong>Reportes de valor:</strong> Muéstrales cuántos cursos han completado sus colaboradores</li><li><strong>Alertas de vencimiento:</strong> Avísales cuando sus DC-3 estén por vencer</li><li><strong>Eventos de capacitación:</strong> Invítalos a webinars y talleres</li></ul><h3>Planificación de Cartera</h3><p>Diversifica tu cartera para reducir riesgo:</p><ul><li>No dependas de un solo sector o zona</li><li>Mezcla empresas de diferentes tamaños (Impulsa + Transforma + Lidera)</li><li>Mantén un pipeline activo de al menos 10 prospectos</li><li>Reserva tiempo cada semana para prospección nueva</li></ul><h3>La Meta: 26+ Empresas</h3><p>Con 26 empresas Plan Transforma de 30 cols promedio:</p><ul><li>Fee mensual: 26 × $2,715 = $70,590</li><li>Tu comisión (35%): <strong>$24,707/mes</strong></li><li>Bono Elite (15%): <strong>$10,589/mes</strong></li><li><strong>Total: ~$35,296/mes</strong></li></ul>`,
        durationMinutes: 5,
      },
    ],
    quiz: {
      title: "Evaluación — Programa Elite",
      passingScore: 70,
      questions: [
        { question: "¿Cuántas empresas necesitas para alcanzar el nivel Leyenda?", options: ["10+", "15+", "20+", "26+"], correctIndex: 3, explanation: "El nivel Leyenda requiere 26 o más empresas activas." },
        { question: "¿Cada cuánto se verifica tu nivel Elite?", options: ["Diariamente", "Semanalmente", "Mensualmente", "Anualmente"], correctIndex: 2, explanation: "El sistema verifica automáticamente tu nivel el día 1 de cada mes." },
        { question: "¿Cuál es el bono adicional del nivel Bosque?", options: ["+5%", "+8%", "+12%", "+15%"], correctIndex: 2, explanation: "El nivel Bosque otorga un bono adicional de +12% sobre el fee acumulado." },
        { question: "¿Qué es más importante para subir de nivel: cerrar empresas o retenerlas?", options: ["Solo cerrar", "Solo retener", "Ambas son igualmente importantes", "Ninguna, es automático"], correctIndex: 2, explanation: "Ambas son importantes: necesitas cerrar nuevas empresas Y retener las actuales con aportaciones al corriente." },
      ],
    },
  },

  {
    slug: "cripto-blockchain-vaultcard",
    title: "Cripto, Blockchain y Vault Card — Tu Entrada al Mundo Web3",
    description: "Aprende desde cero qué son las criptomonedas, cómo funciona blockchain, tipos de billeteras, el marco legal fintech en México, cooperativismo digital y cómo Vault Card conecta todo esto con CeduVerse.",
    category: "Onboarding",
    subcategory: "Para Todos",
    durationMinutes: 55,
    level: "basico",
    tags: ["onboarding", "cripto", "blockchain", "vaultcard", "web3", "fintech", "wallet"],
    dc3Available: false,
    icon: "🔗",
    color: "#8b5cf6",
    source: "studio",
    instructor: "David Pérez",
    modules: [
      {
        title: "¿Qué son las criptomonedas?",
        description: "Origen, funcionamiento básico, diferencia con dinero fiat y principales criptos.",
        contentHtml: `<h2>El Dinero del Futuro</h2><p>Las criptomonedas son <strong>monedas digitales</strong> que funcionan sin bancos ni gobiernos. Usan matemáticas y tecnología para garantizar transacciones seguras, transparentes e inmutables.</p><h3>El Origen: Bitcoin y Satoshi Nakamoto</h3><p>En 2008, una persona (o grupo) bajo el seudónimo <strong>Satoshi Nakamoto</strong> publicó un documento llamado <em>"Bitcoin: A Peer-to-Peer Electronic Cash System"</em>. La idea era simple pero revolucionaria:</p><ul><li>Crear dinero digital que no dependa de ningún banco central</li><li>Que las transacciones sean directas entre personas (<strong>peer-to-peer</strong>)</li><li>Que nadie pueda falsificar, duplicar o censurar las transacciones</li></ul><p>El 3 de enero de 2009 se minó el primer bloque de Bitcoin (el <strong>"bloque génesis"</strong>) y nació una nueva era financiera.</p><h3>¿Qué problema resuelven?</h3><ul><li><strong>Intermediarios:</strong> En el sistema tradicional, cada transferencia pasa por bancos que cobran comisiones y pueden bloquear tu dinero. Las criptos eliminan al intermediario.</li><li><strong>Inflación:</strong> Los gobiernos pueden imprimir dinero sin límite. Bitcoin tiene un máximo de <strong>21 millones de unidades</strong> — es matemáticamente escaso.</li><li><strong>Acceso financiero:</strong> Más de 1,400 millones de personas en el mundo no tienen cuenta bancaria. Solo necesitas un celular para usar criptomonedas.</li><li><strong>Censura:</strong> Nadie puede congelar tu cuenta cripto ni impedirte enviar dinero a otra persona.</li></ul><h3>¿Cómo funcionan (nivel básico)?</h3><ol><li>Cada cripto tiene una <strong>red de computadoras</strong> (nodos) distribuidas por el mundo</li><li>Cuando envías una transacción, los nodos la verifican usando reglas matemáticas</li><li>Una vez verificada, se registra en un <strong>libro contable público</strong> llamado blockchain</li><li>El registro es permanente — nadie puede borrarlo o modificarlo</li></ol><h3>Dinero Fiat vs Criptomonedas</h3><table><tr><th>Característica</th><th>Dinero Fiat (pesos, dólares)</th><th>Criptomonedas</th></tr><tr><td>Emisor</td><td>Banco central (Banxico, Fed)</td><td>Protocolo matemático</td></tr><tr><td>Suministro</td><td>Ilimitado</td><td>Fijo o programado</td></tr><tr><td>Intermediario</td><td>Bancos obligatorios</td><td>Directo (P2P)</td></tr><tr><td>Censura</td><td>Pueden congelar cuentas</td><td>No censurable</td></tr><tr><td>Horario</td><td>Horario bancario</td><td>24/7/365</td></tr></table><h3>Las 3 Criptos que Debes Conocer</h3><ul><li><strong>Bitcoin (BTC):</strong> La primera y más conocida. "Oro digital". Reserva de valor con máximo 21 millones de unidades.</li><li><strong>Ethereum (ETH):</strong> No solo es dinero — es una plataforma para crear aplicaciones descentralizadas (dApps) y contratos inteligentes. CeduVerse emite sus diplomas NFT sobre redes compatibles con Ethereum.</li><li><strong>Polygon/POL (antes MATIC):</strong> Una red construida sobre Ethereum que hace las transacciones más rápidas y baratas. Ideal para NFTs educativos como los de CeduVerse.</li></ul><h3>¿Cómo conecta con CeduVerse?</h3><p>CeduVerse utiliza la tecnología cripto para emitir <strong>diplomas NFT verificables</strong>. Cuando completas un curso, tu certificado se registra en blockchain — nadie puede falsificarlo y cualquier persona puede verificarlo escaneando un QR.</p>`,
        durationMinutes: 10,
        references: ["Bitcoin Whitepaper (2008)", "CoinMarketCap", "Banco de México - Activos Virtuales"],
      },
      {
        title: "Blockchain: La tecnología detrás",
        description: "Bloques, cadenas, consenso, hashes SHA-256 y cómo CeduVerse usa hashes para la confirmación digital SAM.",
        contentHtml: `<h2>Blockchain: El Libro Contable Indestructible</h2><p>Blockchain es la <strong>tecnología que hace posible las criptomonedas</strong>, pero su uso va mucho más allá del dinero. Es un registro digital distribuido, inmutable y transparente.</p><h3>¿Qué es una Blockchain?</h3><p>Imagina un libro contable que:</p><ul><li>Tiene copias idénticas en <strong>miles de computadoras</strong> alrededor del mundo</li><li>Cada vez que alguien escribe algo, <strong>todos los demás lo verifican</strong></li><li>Una vez escrito, <strong>no se puede borrar ni modificar</strong></li><li>Cualquier persona puede leerlo y verificar que todo es correcto</li></ul><p>Eso es blockchain: un <strong>registro distribuido, inmutable y transparente</strong>.</p><h3>Bloques y Cadenas</h3><p>La información se agrupa en <strong>bloques</strong>. Cada bloque contiene:</p><ol><li>Un grupo de transacciones verificadas</li><li>Una marca de tiempo</li><li>Un <strong>hash</strong> (huella digital única) del bloque anterior</li><li>Su propio hash</li></ol><p>Al incluir el hash del bloque anterior, cada bloque está encadenado al anterior. Si alguien modifica un bloque antiguo, su hash cambia, rompiendo la cadena entera. Por eso es <strong>inmutable</strong>.</p><h3>¿Qué son los Hashes? (SHA-256)</h3><p>Un <strong>hash</strong> es como una huella digital de cualquier dato. El algoritmo más usado es <strong>SHA-256</strong> (Secure Hash Algorithm de 256 bits):</p><ul><li>Toma cualquier texto, archivo o dato de cualquier tamaño</li><li>Produce una cadena de <strong>64 caracteres hexadecimales</strong> única</li><li>Si cambias una sola letra del original, el hash cambia completamente</li><li>Es imposible reconstruir el dato original a partir del hash</li></ul><p><strong>Ejemplo:</strong></p><ul><li>"Hola" → <code>3d5f2c...</code></li><li>"hola" (minúscula) → <code>b221d9...</code> (completamente diferente)</li></ul><h3>Consenso: ¿Quién decide qué es válido?</h3><p>Como no hay un jefe central, las blockchains usan <strong>mecanismos de consenso</strong>:</p><ul><li><strong>Proof of Work (PoW):</strong> Los nodos compiten resolviendo problemas matemáticos complejos. El ganador agrega el nuevo bloque y recibe una recompensa. Así funciona Bitcoin. Requiere mucha energía.</li><li><strong>Proof of Stake (PoS):</strong> Los nodos depositan ("apuestan") sus criptomonedas como garantía. A mayor apuesta, más probabilidad de ser elegido para validar. Así funciona Ethereum desde 2022. Consume 99.95% menos energía que PoW.</li></ul><h3>¿Por qué es inmutable?</h3><p>Para alterar una transacción en blockchain necesitarías:</p><ol><li>Modificar el bloque donde está la transacción</li><li>Recalcular el hash de ese bloque y todos los siguientes</li><li>Hacer todo esto más rápido que el resto de la red mundial</li></ol><p>Esto es <strong>computacionalmente imposible</strong> en una red grande como Bitcoin o Ethereum.</p><h3>¿Cómo usa CeduVerse los Hashes?</h3><p>CeduVerse aplica SHA-256 en dos momentos clave:</p><ul><li><strong>Diplomas NFT:</strong> Cada certificado tiene un hash único que lo identifica en blockchain. Nadie puede falsificar tu diploma porque su hash es verificable públicamente.</li><li><strong>Confirmación digital SAM:</strong> Cuando una empresa confirma su Solicitud de Aportación Mensual, CeduVerse genera un <strong>hash SHA-256</strong> de esa confirmación. Este hash sirve como evidencia legal inmutable de que la empresa aprobó la aportación en esa fecha y hora exacta.</li></ul>`,
        durationMinutes: 10,
        references: ["SHA-256 - NIST FIPS 180-4", "Ethereum.org - Proof of Stake", "Bitcoin.org - How it Works"],
      },
      {
        title: "Billeteras cripto: frías, calientes, centralizadas y descentralizadas",
        description: "Qué es una wallet, seed phrase, tipos de billeteras y por qué 'not your keys, not your coins'.",
        contentHtml: `<h2>Tu Billetera Cripto: Donde Viven tus Activos Digitales</h2><p>Una <strong>billetera cripto (wallet)</strong> no "guarda" tus criptomonedas como una cartera física. En realidad, tus criptos siempre están en la blockchain. La wallet guarda las <strong>llaves privadas</strong> que te permiten acceder a ellas y enviarlas.</p><h3>Llaves Públicas y Privadas</h3><ul><li><strong>Llave pública:</strong> Es como tu número de cuenta bancaria. La compartes para recibir criptos. Ejemplo: <code>0x742d35Cc6634C0532925a3b844Bc9e7595f...</code></li><li><strong>Llave privada:</strong> Es como tu contraseña del banco. NUNCA la compartas. Quien tenga tu llave privada tiene acceso total a tus fondos.</li></ul><h3>Seed Phrase: Tu Respaldo Maestro</h3><p>La <strong>seed phrase</strong> (frase semilla) es un conjunto de <strong>12 o 24 palabras en inglés</strong> generadas aleatoriamente. Esta frase puede reconstruir TODAS tus llaves privadas:</p><ul><li>Es el respaldo definitivo de tu billetera</li><li>Si pierdes tu celular o computadora, con la seed phrase puedes recuperar todo</li><li>Si alguien obtiene tu seed phrase, puede robar todos tus fondos</li><li><strong>Regla de oro:</strong> Nunca la escribas en digital (no fotos, no notas del celular, no email)</li></ul><h3>Tipos de Billeteras</h3><h4>🔥 Hot Wallets (Calientes)</h4><p>Están conectadas a internet todo el tiempo.</p><ul><li><strong>Ejemplos:</strong> MetaMask, Trust Wallet, Coinbase Wallet</li><li><strong>Ventaja:</strong> Fáciles de usar, ideales para transacciones frecuentes</li><li><strong>Riesgo:</strong> Vulnerables a hackeos porque están en línea</li><li><strong>Ideal para:</strong> Montos pequeños de uso diario</li></ul><h4>❄️ Cold Wallets (Frías)</h4><p>Están desconectadas de internet.</p><ul><li><strong>Ejemplos:</strong> Ledger, Trezor, <strong>Tangem</strong> (compatible con Vault Card)</li><li><strong>Ventaja:</strong> Máxima seguridad — no pueden ser hackeadas remotamente</li><li><strong>Riesgo:</strong> Si pierdes el dispositivo Y la seed phrase, pierdes todo</li><li><strong>Ideal para:</strong> Montos grandes, ahorro a largo plazo</li></ul><h4>🏦 Centralizadas (Exchange)</h4><p>Un tercero (empresa) custodia tus llaves por ti.</p><ul><li><strong>Ejemplos:</strong> Binance, Bitso, Coinbase</li><li><strong>Ventaja:</strong> Interfaz familiar (similar a un banco), soporte al cliente</li><li><strong>Riesgo:</strong> La empresa puede quebrar, ser hackeada o congelar tus fondos (ejemplo: FTX en 2022 perdió $8 mil millones de usuarios)</li><li><strong>Tú no controlas tus llaves</strong></li></ul><h4>🔓 Descentralizadas (Self-Custody)</h4><p>Tú controlas tus llaves directamente.</p><ul><li><strong>Ejemplos:</strong> MetaMask, Tangem, Vault Card</li><li><strong>Ventaja:</strong> Nadie puede congelar ni confiscar tus fondos</li><li><strong>Riesgo:</strong> Si pierdes tus llaves, nadie puede ayudarte a recuperarlas</li><li><strong>Máxima responsabilidad = máxima libertad</strong></li></ul><h3>"Not Your Keys, Not Your Coins"</h3><p>Esta frase es el principio más importante del mundo cripto:</p><blockquote><strong>"Si no controlas tus llaves privadas, no son tus monedas."</strong></blockquote><p>Cuando dejas tus criptos en un exchange centralizado (como Binance o Bitso), técnicamente le estás prestando tu dinero a esa empresa. Si la empresa quiebra, es hackeada o decide congelar tu cuenta, puedes perder todo.</p><p><strong>CeduVerse y Vault Card</strong> promueven la <strong>autocustodia</strong>: que tú seas el único dueño de tus llaves y tus activos digitales.</p>`,
        durationMinutes: 10,
        references: ["BIP-39 Mnemonic Phrases", "Tangem.com", "Ethereum.org - Wallets"],
      },
      {
        title: "Fintechs y marco legal en México",
        description: "Qué es una fintech, Ley Fintech México, regulación de activos virtuales y organismos reguladores.",
        contentHtml: `<h2>Fintechs: La Revolución Financiera</h2><p>Una <strong>fintech</strong> (financial technology) es una empresa que usa tecnología para ofrecer servicios financieros de forma más eficiente, accesible y económica que los bancos tradicionales.</p><h3>Tipos de Fintechs</h3><ul><li><strong>Pagos electrónicos:</strong> Mercado Pago, Clip, STP — facilitan pagos y transferencias digitales</li><li><strong>Préstamos (lending):</strong> Kueski, Credijusto — otorgan créditos en línea con IA</li><li><strong>Crowdfunding:</strong> Playbusiness, Briq.mx — financiamiento colectivo para proyectos</li><li><strong>Cripto/activos virtuales:</strong> Bitso, Volabit — compraventa de criptomonedas</li><li><strong>Insurtech:</strong> Clupp, GNP Digital — seguros digitales</li><li><strong>Neobancos:</strong> Albo, Klar — cuentas bancarias 100% digitales</li></ul><h3>Ley Fintech de México (2018)</h3><p>México fue el <strong>primer país en Latinoamérica</strong> en crear una ley específica para fintechs. La <strong>Ley para Regular las Instituciones de Tecnología Financiera</strong> (marzo 2018) establece:</p><ul><li><strong>Dos tipos de ITF:</strong> Instituciones de Financiamiento Colectivo (crowdfunding) e Instituciones de Fondos de Pago Electrónico (pagos)</li><li><strong>Regulación de activos virtuales:</strong> Reconoce las criptomonedas como "activos virtuales" (no como moneda de curso legal)</li><li><strong>Sandbox regulatorio:</strong> Un entorno controlado donde las fintechs pueden probar innovaciones con supervisión reducida antes de operar a escala completa</li><li><strong>Protección al usuario:</strong> Requisitos de transparencia, seguridad de datos y manejo de quejas</li></ul><h3>Organismos Reguladores</h3><ul><li><strong>CNBV (Comisión Nacional Bancaria y de Valores):</strong> Supervisa y autoriza a las ITF. Toda fintech regulada necesita autorización de la CNBV.</li><li><strong>Banxico (Banco de México):</strong> Determina qué activos virtuales pueden operar las ITF. Hasta ahora, solo ha autorizado Bitcoin y Ethereum para operaciones internas de las ITF (no para ofrecer al público directamente).</li><li><strong>CONDUSEF:</strong> Protección al usuario de servicios financieros, incluyendo fintechs.</li><li><strong>SAT:</strong> Las ganancias por criptomonedas son gravables como enajenación de bienes (Art. 14 CFF).</li></ul><h3>Activos Virtuales según la Ley</h3><p>La Ley Fintech define los activos virtuales como:</p><blockquote>"Representaciones de valor registradas electrónicamente y utilizadas por el público como medio de pago o inversión, que pueden ser transferidas y almacenadas electrónicamente."</blockquote><p>Importante: <strong>No son moneda de curso legal</strong> — el peso mexicano sigue siendo la única moneda oficial en México.</p><h3>¿Dónde entra CeduVerse?</h3><p>CeduVerse no es una fintech regulada (no maneja fondos de clientes ni opera como exchange). Sin embargo, utiliza tecnología blockchain para:</p><ul><li>Emitir <strong>diplomas NFT</strong> como certificados educativos verificables</li><li>Generar <strong>hashes de confirmación</strong> para evidencia legal de aportaciones (SAM)</li><li>Operar la <strong>Wallet Web3</strong> dentro de la plataforma para almacenar certificados</li></ul><p>CeduVerse opera como <strong>cooperativa de educación</strong>, no como institución financiera.</p>`,
        durationMinutes: 9,
        references: ["Ley Fintech México (2018)", "CNBV - Instituciones de Tecnología Financiera", "Banxico - Activos Virtuales", "DOF 09/03/2018"],
      },
      {
        title: "Cooperativismo digital y Web3",
        description: "Cooperativas digitales, el modelo CeduVerse, tokens, gobernanza y NFTs como certificados educativos.",
        contentHtml: `<h2>Web3 + Cooperativismo: El Modelo CeduVerse</h2><p>Web3 es la visión de un internet donde los usuarios son <strong>dueños de sus datos y activos digitales</strong>, en lugar de que los controlen grandes empresas (Google, Facebook, Amazon). El cooperativismo digital aplica este mismo principio: <strong>los usuarios son dueños de la plataforma</strong>.</p><h3>¿Qué es una Cooperativa Digital?</h3><p>Una cooperativa digital es una organización que:</p><ul><li>Usa tecnología como base de sus operaciones</li><li>Sus miembros (socios) son usuarios Y propietarios al mismo tiempo</li><li>Las decisiones se toman de forma democrática (un socio = un voto)</li><li>Los beneficios se distribuyen entre los socios, no se concentran en accionistas externos</li></ul><h3>CeduVerse como Cooperativa</h3><p><strong>Ceduverse S. C de C de Rl de CV</strong> (Sociedad Cooperativa de Consumo de Responsabilidad Limitada de Capital Variable) opera bajo este modelo:</p><ul><li><strong>Objeto social:</strong> Educación y capacitación profesional</li><li><strong>Socios:</strong> Los usuarios (empresas y trabajadores) que participan en la plataforma</li><li><strong>Fondos cooperativos:</strong> Reserva, previsión social y educación (conforme a la Ley General de Sociedades Cooperativas)</li><li><strong>Sin accionistas externos:</strong> Los beneficios se reinvierten en la plataforma y sus socios</li></ul><h3>Modelo Cooperativo vs Corporativo</h3><table><tr><th>Aspecto</th><th>Empresa Corporativa (S.A.)</th><th>Cooperativa (CeduVerse)</th></tr><tr><td>Dueños</td><td>Accionistas que buscan utilidades</td><td>Socios que usan la plataforma</td></tr><tr><td>Decisiones</td><td>Por cantidad de acciones (quien más tiene, más decide)</td><td>Un socio = un voto</td></tr><tr><td>Beneficios</td><td>Dividendos para accionistas</td><td>Se reinvierten o distribuyen entre socios</td></tr><tr><td>Objetivo</td><td>Maximizar utilidades</td><td>Beneficio colectivo</td></tr><tr><td>Precio</td><td>Lo que el mercado aguante</td><td>Aportaciones voluntarias sin penalización</td></tr></table><h3>Tokens y Gobernanza</h3><p>En el mundo Web3, los <strong>tokens</strong> son activos digitales que representan derechos dentro de una plataforma:</p><ul><li><strong>Tokens de gobernanza:</strong> Permiten votar sobre decisiones de la plataforma (ej: qué cursos agregar, cómo distribuir fondos)</li><li><strong>Tokens de utilidad:</strong> Dan acceso a funciones o servicios dentro de la plataforma</li><li><strong>NFTs (Non-Fungible Tokens):</strong> Activos digitales únicos e irrepetibles — perfectos para certificados</li></ul><h3>NFTs como Certificados Educativos</h3><p>CeduVerse emite tus diplomas como <strong>NFTs en blockchain</strong>:</p><ul><li>Cada diploma es <strong>único</strong> — tiene un identificador irrepetible</li><li>Es <strong>verificable</strong> — cualquier empleador puede confirmar su autenticidad escaneando el QR</li><li>Es <strong>inmutable</strong> — nadie puede borrar, alterar o falsificar tu certificado</li><li>Es <strong>tuyo</strong> — vive en tu wallet, no depende de que CeduVerse exista</li><li>Es <strong>portable</strong> — puedes llevarlo a cualquier otra plataforma compatible</li></ul><h3>¿Por qué importa el modelo cooperativo + Web3?</h3><p>La combinación de cooperativismo y Web3 significa que:</p><ol><li>Tus certificados son tuyos (no de CeduVerse ni de ninguna empresa)</li><li>Tu participación como socio te da voz en la plataforma</li><li>No hay un "dueño" que pueda cambiar las reglas unilateralmente</li><li>La tecnología garantiza transparencia y verificabilidad</li></ol>`,
        durationMinutes: 8,
        references: ["Ley General de Sociedades Cooperativas", "Ethereum.org - NFTs", "Web3 Foundation", "ERC-721 Standard"],
      },
      {
        title: "Vault Card: Tu bóveda personal",
        description: "Qué es Vault Card, filosofía de custodia, seed phrase en acero, QR→NFT y compatibilidad con Tangem.",
        contentHtml: `<h2>Vault Card: Seguridad Física para tus Activos Digitales</h2><p>Vault Card es la <strong>tarjeta de respaldo físico</strong> diseñada por CeduVerse para que protejas lo más importante: tus llaves cripto y tus certificados educativos.</p><h3>¿Qué es Vault Card?</h3><p>Vault Card es una tarjeta de <strong>acero inoxidable</strong> del tamaño de una tarjeta de crédito que:</p><ul><li>Almacena tu <strong>seed phrase</strong> (12 o 24 palabras) grabada físicamente en el metal</li><li>Incluye un <strong>código QR</strong> que enlaza a tu perfil de certificados NFT</li><li><strong>No tiene chip bancario</strong> — no es una tarjeta de débito ni crédito</li><li><strong>No se conecta a internet</strong> — es 100% offline (cold storage)</li><li>Resiste fuego, agua, corrosión y golpes</li></ul><h3>Filosofía: Separar Pago y Custodia</h3><p>Vault Card se basa en un principio fundamental:</p><blockquote><strong>"El pago y la custodia deben estar separados."</strong></blockquote><p>¿Qué significa esto?</p><ul><li><strong>Pago:</strong> Lo haces desde tu wallet digital (app) conectada a internet — rápido y conveniente</li><li><strong>Custodia:</strong> Tus llaves maestras (seed phrase) están en Vault Card — offline, en acero, imposibles de hackear remotamente</li></ul><p>Es como tener una caja fuerte en casa (Vault Card) y una cartera en el bolsillo (wallet app). No caminas por la calle con toda tu fortuna encima.</p><h3>¿Por qué No Tiene Chip Bancario?</h3><p>A diferencia de tarjetas como Binance Card o Bitso Card que son tarjetas de <em>gasto</em>, Vault Card es una tarjeta de <em>respaldo</em>:</p><ul><li>No la usas para pagar en tiendas</li><li>No está conectada a ningún banco</li><li>No tiene un saldo que se pueda gastar</li><li>Su único propósito es <strong>proteger tu seed phrase y tus certificados</strong></li></ul><h3>Seed Phrase en Acero Inoxidable</h3><p>Las seed phrases normalmente se anotan en papel. El problema:</p><ul><li>El papel se moja, se quema, se rompe</li><li>Las fotos se hackean, las notas digitales se filtran</li></ul><p>Vault Card resuelve esto grabando tu seed phrase directamente en <strong>acero inoxidable de grado 316</strong>:</p><ul><li>Resiste temperaturas de hasta 1,400°C</li><li>No se corroe con agua ni productos químicos</li><li>No se puede borrar accidentalmente</li><li>Cabe en tu cartera como cualquier otra tarjeta</li></ul><h3>QR → NFT: Tus Diplomas en tu Bolsillo</h3><p>Vault Card incluye un <strong>código QR grabado</strong> que enlaza directamente a tu perfil de certificados:</p><ol><li>Un empleador, auditor o inspector escanea el QR con cualquier celular</li><li>Ve la lista de tus certificados NFT verificados en blockchain</li><li>Puede confirmar que cada diploma es auténtico, con fecha, curso e institución</li><li>No necesitas llevar papeles ni abrir la computadora</li></ol><p>Imagina estar en una inspección STPS y simplemente mostrar tu Vault Card: <strong>todos tus certificados verificables al instante</strong>.</p><h3>Compatibilidad con Tangem</h3><p><strong>Tangem</strong> es una marca reconocida de cold wallets tipo tarjeta NFC. Vault Card es <strong>compatible con el ecosistema Tangem</strong>:</p><ul><li>Puedes usar la app de Tangem para gestionar los activos asociados a tu Vault Card</li><li>La tecnología NFC permite interactuar sin necesidad de cables ni lectores especiales</li><li>Tangem tiene certificación de seguridad EAL6+ (la misma que pasaportes internacionales)</li></ul><h3>Cómo Conecta con tu Wallet CeduVerse</h3><p>Tu experiencia completa funciona así:</p><ol><li><strong>Completas un curso</strong> en CeduVerse (Aula Virtual o Tutor IA)</li><li><strong>Se emite tu diploma NFT</strong> automáticamente en blockchain</li><li><strong>El NFT aparece en tu Wallet CeduVerse</strong> dentro de la plataforma</li><li><strong>Tu Vault Card</strong> almacena la seed phrase que da acceso a esa wallet</li><li><strong>El QR de tu Vault Card</strong> permite a cualquiera verificar tus certificados</li></ol><p>Es un sistema completo: <strong>educación → certificación → verificación → protección</strong>, todo conectado por blockchain.</p>`,
        durationMinutes: 8,
        references: ["Tangem.com - Security", "ERC-721 NFT Standard", "Acero 316 - Propiedades", "CeduVerse - Vault Card"],
      },
    ],
    quiz: {
      title: "Evaluación — Cripto, Blockchain y Vault Card",
      passingScore: 70,
      questions: [
        {
          question: "¿Quién creó Bitcoin y en qué año se publicó el whitepaper?",
          options: ["Elon Musk en 2015", "Vitalik Buterin en 2013", "Satoshi Nakamoto en 2008", "Mark Zuckerberg en 2010"],
          correctIndex: 2,
          explanation: "Bitcoin fue creado por Satoshi Nakamoto, quien publicó el whitepaper en 2008. El primer bloque se minó el 3 de enero de 2009.",
        },
        {
          question: "¿Qué es un hash SHA-256?",
          options: ["Una contraseña encriptada", "Una huella digital única e irreversible de cualquier dato", "Un tipo de criptomoneda", "Un código de acceso bancario"],
          correctIndex: 1,
          explanation: "SHA-256 genera una huella digital única de 64 caracteres hexadecimales. Es irreversible: no se puede reconstruir el dato original a partir del hash.",
        },
        {
          question: "¿Qué significa 'Not your keys, not your coins'?",
          options: ["Que necesitas llaves físicas para abrir tu wallet", "Que si no controlas tus llaves privadas, no controlas tus criptomonedas", "Que los bancos protegen mejor tus monedas", "Que las criptomonedas no existen realmente"],
          correctIndex: 1,
          explanation: "Si dejas tus criptos en un exchange centralizado, la empresa controla tus llaves. Si quiebra o es hackeada, puedes perder todo.",
        },
        {
          question: "¿Qué diferencia hay entre una hot wallet y una cold wallet?",
          options: ["La hot wallet es más segura", "La cold wallet está conectada a internet", "La hot wallet está conectada a internet y la cold wallet no", "No hay diferencia, solo el color"],
          correctIndex: 2,
          explanation: "Hot wallet = conectada a internet (cómoda pero más vulnerable). Cold wallet = desconectada (más segura para montos grandes).",
        },
        {
          question: "¿Cuándo se promulgó la Ley Fintech en México?",
          options: ["2015", "2018", "2020", "2023"],
          correctIndex: 1,
          explanation: "La Ley para Regular las Instituciones de Tecnología Financiera se promulgó en marzo de 2018. México fue el primer país en Latinoamérica con una ley así.",
        },
        {
          question: "¿Qué tipo de sociedad es CeduVerse?",
          options: ["Sociedad Anónima (S.A.)", "LLC americana", "Sociedad Cooperativa de Consumo (S.C. de C. de R.L. de C.V.)", "Asociación Civil (A.C.)"],
          correctIndex: 2,
          explanation: "CeduVerse es una Sociedad Cooperativa de Consumo de Responsabilidad Limitada de Capital Variable.",
        },
        {
          question: "¿Por qué Vault Card NO tiene chip bancario?",
          options: ["Porque es un error de diseño", "Porque su propósito es custodiar llaves y certificados, no hacer pagos", "Porque los chips son muy caros", "Porque no está terminada"],
          correctIndex: 1,
          explanation: "Vault Card separa pago y custodia. Es una tarjeta de respaldo (seed phrase + QR de certificados), no una tarjeta de gasto.",
        },
        {
          question: "¿Cómo se verifican los diplomas NFT de CeduVerse?",
          options: ["Llamando por teléfono a CeduVerse", "Escaneando el código QR de Vault Card con cualquier celular", "Enviando un correo al SAT", "No se pueden verificar"],
          correctIndex: 1,
          explanation: "El QR de Vault Card enlaza al perfil de certificados NFT verificados en blockchain. Cualquier persona puede escanear y confirmar la autenticidad.",
        },
        {
          question: "¿Qué mecanismo de consenso usa Ethereum desde 2022?",
          options: ["Proof of Work", "Proof of Stake", "Proof of Authority", "Proof of History"],
          correctIndex: 1,
          explanation: "Ethereum migró de Proof of Work a Proof of Stake en septiembre de 2022 (The Merge), reduciendo su consumo energético en 99.95%.",
        },
        {
          question: "¿Qué organismo en México autoriza a las Instituciones de Tecnología Financiera?",
          options: ["SAT", "STPS", "CNBV", "INEGI"],
          correctIndex: 2,
          explanation: "La CNBV (Comisión Nacional Bancaria y de Valores) supervisa y autoriza a las ITF conforme a la Ley Fintech.",
        },
      ],
    },
  },
];

export async function seedOnboardingCourses() {
  let coursesCreated = 0;
  let modulesCreated = 0;
  let quizzesCreated = 0;

  for (const courseData of ONBOARDING_COURSES) {
    const existing = await db.select({ id: studioCourses.id, instructor: studioCourses.instructor }).from(studioCourses).where(sql`${studioCourses.slug} = ${courseData.slug}`);

    if (existing.length > 0) {
      console.log(`  ↳ Onboarding course "${courseData.slug}" already exists, skipping`);
      if (!existing[0].instructor && courseData.instructor) {
        await db.update(studioCourses)
          .set({ instructor: courseData.instructor })
          .where(sql`${studioCourses.slug} = ${courseData.slug}`);
        console.log(`  ✓ Backfilled instructor for "${courseData.slug}": ${courseData.instructor}`);
      }
      continue;
    }

    const [course] = await db.insert(studioCourses).values({
      slug: courseData.slug,
      title: courseData.title,
      description: courseData.description,
      category: courseData.category,
      subcategory: courseData.subcategory,
      durationMinutes: courseData.durationMinutes,
      level: courseData.level,
      tags: courseData.tags,
      dc3Available: courseData.dc3Available,
      icon: courseData.icon,
      color: courseData.color,
      source: courseData.source,
      instructor: courseData.instructor,
    }).returning();
    coursesCreated++;

    for (let i = 0; i < courseData.modules.length; i++) {
      const mod = courseData.modules[i];
      await db.insert(studioModules).values({
        courseId: course.id,
        moduleIndex: i,
        title: mod.title,
        description: mod.description,
        contentHtml: mod.contentHtml,
        references: mod.references || [],
        durationMinutes: mod.durationMinutes,
      });
      modulesCreated++;
    }

    await db.insert(studioQuizzes).values({
      courseId: course.id,
      title: courseData.quiz.title,
      passingScore: courseData.quiz.passingScore,
      questions: courseData.quiz.questions,
    });
    quizzesCreated++;
  }

  console.log(`[seed] Onboarding: ${coursesCreated} courses, ${modulesCreated} modules, ${quizzesCreated} quizzes created.`);
}
