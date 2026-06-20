import { db } from "./db";
import { courses, courseModules, courseQuizzes, quizQuestions, achievements, users, accounts, profiles, blogPosts, empresasProspectos, interaccionesProspectos, globalConfig } from "@shared/schema";
import { sql, eq } from "drizzle-orm";
import { EXTRA_MODULES_DATA, EXTRA_QUIZ_DATA } from "./seed-modules-data";
import { MEDINA_MODULES_DATA, MEDINA_QUIZ_DATA } from "./seed-medina-data";
import { yuridiaModules } from "./data/yuridia-courses";
import { yuridiaQuizzes } from "./data/yuridia-quizzes";
import crypto from "crypto";

const STPS_COURSES = [
  {
    slug: "nom-035-stps-riesgo-psicosocial",
    title: "NOM-035-STPS-2018: Factores de Riesgo Psicosocial en el Trabajo",
    instructor: "Psic. Yuridia Iturriaga",
    instructorId: "YI",
    durationHrs: 10,
    durationVirtualHrs: 5,
    areaTematica: "Normatividad Laboral",
    categoria: ["Salud Ocupacional", "Normatividad", "NOM-035"],
    nivel: "Todos los niveles",
    precioCurso: 0,
    dc3Disponible: true,
    sepCertificatePrice: 1999,
    hasRvoe: true,
    rvoeUrl: "https://ceduverse.org/programas-rvoe",
    temas: [
      "Objetivo de la NOM-035",
      "Campo de aplicación",
      "Referencias normativas",
      "Definiciones clave",
      "Obligaciones del patrón",
      "Obligaciones de los trabajadores",
      "Identificación y análisis de factores de riesgo psicosocial",
      "Medidas de prevención y acciones de control"
    ],
    description: "Curso obligatorio para todos los centros de trabajo en México. Aprende a identificar, analizar y prevenir factores de riesgo psicosocial conforme a la NOM-035-STPS-2018.",
    objetivo: "Conocer los elementos fundamentales de la NOM-035, identificar factores de riesgo psicosocial y aplicar medidas de prevención y control.",
    publico: ["Recursos Humanos", "Seguridad e Higiene", "Líderes", "Trabajadores en general"],
  },
  {
    slug: "diagnostico-prevencion-bullying",
    title: "Diagnóstico, Prevención e Intervención del Bullying",
    instructor: "Psic. Yuridia Iturriaga",
    instructorId: "YI",
    durationHrs: 9,
    durationVirtualHrs: 4,
    areaTematica: "Desarrollo Humano",
    categoria: ["Salud Mental", "Convivencia Laboral"],
    nivel: "Todos los niveles",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "Conceptualización del Bullying",
      "Factores y características del Bullying",
      "Repercusiones psicológicas derivadas del bullying",
      "Apoyo y manejo del Bullying"
    ],
    description: "Identifica, previene e interviene ante situaciones de bullying y mobbing en el entorno laboral y organizacional.",
    objetivo: "Desarrollar competencias para diagnosticar dinámicas de bullying, comprender sus repercusiones y aplicar estrategias de intervención.",
    publico: ["Líderes de equipo", "RH", "Trabajadores", "Comités de convivencia"],
  },
  {
    slug: "camino-autodependencia",
    title: "Camino a la Autodependencia",
    instructor: "Psic. Yuridia Iturriaga",
    instructorId: "YI",
    durationHrs: 9,
    durationVirtualHrs: 4,
    areaTematica: "Desarrollo Humano",
    categoria: ["Desarrollo Personal", "Inteligencia Emocional"],
    nivel: "Todos los niveles",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "Encuentro con uno mismo",
      "Encuentro con el otro",
      "Pérdidas y duelos",
      "Completitud y búsqueda del sentido"
    ],
    description: "Un viaje de autoconocimiento para construir relaciones más sanas, procesar pérdidas y encontrar propósito personal y profesional.",
    objetivo: "Desarrollar la capacidad de autodependencia emocional como base para relaciones laborales y personales saludables.",
    publico: ["Todos los trabajadores", "Personas en transición laboral"],
  },
  {
    slug: "valores-humanos-organizacion",
    title: "Valores Humanos en la Organización",
    instructor: "Psic. Yuridia Iturriaga",
    instructorId: "YI",
    durationHrs: 6,
    durationVirtualHrs: 3,
    areaTematica: "Desarrollo Humano",
    categoria: ["Cultura Organizacional", "Ética"],
    nivel: "Todos los niveles",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "Los valores: ¿Qué son? ¿Cómo los identifico?",
      "Clarificación de valores",
      "Mis prioridades, mis valores y mi comportamiento",
      "El valor del trabajo y la trascendencia a través de él"
    ],
    description: "Identifica tus valores personales, alinéalos con los de tu organización, y descubre cómo el trabajo puede ser un vehículo de trascendencia.",
    objetivo: "Identificar y clarificar valores personales y organizacionales para fortalecer la cultura de trabajo.",
    publico: ["Todos los colaboradores", "Líderes", "Equipos nuevos"],
  },
  {
    slug: "como-es-mi-comunicacion",
    title: "Cómo Es Mi Comunicación",
    instructor: "Psic. Yuridia Iturriaga",
    instructorId: "YI",
    durationHrs: 10,
    durationVirtualHrs: 5,
    areaTematica: "Desarrollo Humano",
    categoria: ["Comunicación", "Habilidades Blandas"],
    nivel: "Todos los niveles",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "Estrategias de comunicación efectiva",
      "La comunicación interior y los vínculos en los que te relacionas",
      "El lenguaje interior y los estados de ánimo",
      "Comunicación y calidad de vida"
    ],
    description: "Mejora tu comunicación desde adentro hacia afuera: comprende tu diálogo interior, transforma tus vínculos y eleva tu calidad de vida.",
    objetivo: "Desarrollar estrategias de comunicación efectiva intrapersonal e interpersonal para mejorar relaciones y calidad de vida.",
    publico: ["Todos los colaboradores", "Líderes", "Servicio al cliente"],
  },
  {
    slug: "relaciones-humanas",
    title: "Relaciones Humanas",
    instructor: "Psic. Yuridia Iturriaga",
    instructorId: "YI",
    durationHrs: 6,
    durationVirtualHrs: 3,
    areaTematica: "Desarrollo Humano",
    categoria: ["Relaciones Interpersonales", "Trabajo en Equipo"],
    nivel: "Todos los niveles",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "El hombre: un ser social",
      "La personalidad en las relaciones humanas",
      "Apertura de sí mismo y proceso de comunicación"
    ],
    description: "Comprende la naturaleza social del ser humano, cómo la personalidad influye en las relaciones y cómo abrirte a una comunicación más auténtica.",
    objetivo: "Comprender los fundamentos de las relaciones humanas y desarrollar habilidades para construir vínculos laborales saludables.",
    publico: ["Todos los colaboradores"],
  },
  {
    slug: "autoestima",
    title: "Autoestima",
    instructor: "Psic. Yuridia Iturriaga",
    instructorId: "YI",
    durationHrs: 6,
    durationVirtualHrs: 3,
    areaTematica: "Desarrollo Humano",
    categoria: ["Desarrollo Personal", "Salud Mental"],
    nivel: "Todos los niveles",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "Autoestima como marco de referencia desde el cual el hombre se proyecta",
      "Autoestima alta y baja",
      "Concepto de sí mismo"
    ],
    description: "Comprende cómo la autoestima influye en tu desempeño laboral, tus relaciones y tu bienestar. Aprende a construir un autoconcepto saludable.",
    objetivo: "Fortalecer la autoestima como herramienta para el desarrollo personal y profesional.",
    publico: ["Todos los colaboradores"],
  },
  {
    slug: "manejo-conflictos-toma-decisiones",
    title: "Manejo de Conflictos y Toma de Decisiones",
    instructor: "Psic. Yuridia Iturriaga",
    instructorId: "YI",
    durationHrs: 10,
    durationVirtualHrs: 5,
    areaTematica: "Dirección y Gestión",
    categoria: ["Liderazgo", "Resolución de Conflictos"],
    nivel: "Intermedio",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "Trascendencia de las decisiones",
      "El proceso decisional: sus fases y etapas",
      "Las decisiones en el contexto institucional"
    ],
    description: "Domina el arte de resolver conflictos y tomar decisiones efectivas en el contexto organizacional con herramientas prácticas.",
    objetivo: "Desarrollar habilidades para manejar conflictos constructivamente y aplicar un proceso decisional estructurado.",
    publico: ["Líderes", "Supervisores", "Mandos medios", "Gerentes"],
  },
  {
    slug: "integracion-grupos-equipo",
    title: "Integración de Grupos y el Equipo",
    instructor: "Psic. Yuridia Iturriaga",
    instructorId: "YI",
    durationHrs: 10,
    durationVirtualHrs: 5,
    areaTematica: "Dirección y Gestión",
    categoria: ["Trabajo en Equipo", "Liderazgo"],
    nivel: "Todos los niveles",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "Tipos de grupos y el equipo",
      "Dinámica grupal",
      "Manejo de grupos"
    ],
    description: "Aprende a construir equipos de alto rendimiento: entiende la dinámica grupal, los tipos de equipos y cómo facilitar su integración.",
    objetivo: "Desarrollar competencias para integrar y manejar grupos de trabajo efectivos.",
    publico: ["Líderes de equipo", "Supervisores", "Coordinadores", "RH"],
  },
  {
    slug: "planeacion-vida-trabajo",
    title: "Planeación de Vida y Trabajo",
    instructor: "Psic. Yuridia Iturriaga",
    instructorId: "YI",
    durationHrs: 9,
    durationVirtualHrs: 4,
    areaTematica: "Desarrollo Humano",
    categoria: ["Desarrollo Personal", "Planeación"],
    nivel: "Todos los niveles",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "Necesidad de una planeación significativa de vida y trabajo",
      "Fortalezas y debilidades",
      "Discriminación de necesidades y valores"
    ],
    description: "Diseña un plan integral de vida y carrera: identifica tus fortalezas, aclara tus necesidades y construye un camino con propósito.",
    objetivo: "Desarrollar un plan de vida y trabajo significativo alineando fortalezas personales con metas profesionales.",
    publico: ["Todos los colaboradores", "Personas en transición laboral"],
  },
  {
    slug: "capacidad-analitica-resolucion-problemas",
    title: "Capacidad Analítica y Resolución de Problemas en el Ámbito Laboral",
    instructor: "Lic. Jorge Armando Medina Castillo",
    instructorId: "MC",
    durationHrs: 4,
    areaTematica: "Dirección y Gestión",
    categoria: ["Gestión", "Resolución de Problemas", "Pensamiento Analítico"],
    nivel: "Intermedio",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "Pensamiento analítico y crítico",
      "Metodologías de resolución de problemas (Ishikawa, 5 Porqués, 8D)",
      "Análisis de causa raíz",
      "Toma de decisiones basada en datos",
      "Casos prácticos del ámbito laboral"
    ],
    description: "Desarrolla tu capacidad para analizar problemas laborales de manera estructurada y encontrar soluciones efectivas con metodologías probadas.",
    objetivo: "Aplicar metodologías de análisis y resolución de problemas en el entorno laboral.",
    publico: ["Supervisores", "Mandos medios", "Gerentes"],
  },
  {
    slug: "liderazgo-trabajo-colaborativo",
    title: "Liderazgo y Trabajo Colaborativo",
    instructor: "Lic. Jorge Armando Medina Castillo",
    instructorId: "MC",
    durationHrs: 4,
    areaTematica: "Dirección y Gestión",
    categoria: ["Liderazgo", "Trabajo en Equipo"],
    nivel: "Todos los niveles",
    precioCurso: 0,
    dc3Disponible: true,
    sepCertificatePrice: 1999,
    hasRvoe: true,
    rvoeUrl: "https://ceduverse.org/programas-rvoe",
    temas: [
      "Estilos de liderazgo",
      "Liderazgo situacional",
      "Principios del trabajo colaborativo",
      "Comunicación efectiva en equipos",
      "Gestión de conflictos en equipos"
    ],
    description: "Fortalece tus habilidades de liderazgo y aprende a construir dinámicas de colaboración efectivas en tu equipo de trabajo.",
    objetivo: "Desarrollar competencias de liderazgo y trabajo colaborativo efectivo.",
    publico: ["Todos los colaboradores", "Líderes", "Supervisores"],
  },
  {
    slug: "prevencion-riesgos-laborales",
    title: "Prevención de Riesgos Laborales",
    instructor: "Lic. Jorge Armando Medina Castillo",
    instructorId: "MC",
    durationHrs: 6,
    areaTematica: "Higiene y Seguridad en el Trabajo",
    categoria: ["Seguridad Industrial", "Prevención"],
    nivel: "Todos los niveles",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "Marco legal de la seguridad laboral en México",
      "Identificación de peligros y evaluación de riesgos",
      "Actos y condiciones inseguras",
      "Metodologías de análisis de riesgos",
      "Plan de prevención de riesgos",
      "Investigación de accidentes e incidentes"
    ],
    description: "Aprende a identificar, evaluar y controlar los riesgos laborales en tu centro de trabajo para prevenir accidentes y enfermedades.",
    objetivo: "Identificar, evaluar y controlar riesgos laborales para prevenir accidentes.",
    publico: ["Todos los colaboradores", "Seguridad e Higiene"],
  },
  {
    slug: "equipo-proteccion-personal",
    title: "Equipo de Protección Personal (EPP)",
    instructor: "Lic. Jorge Armando Medina Castillo",
    instructorId: "MC",
    durationHrs: 6,
    areaTematica: "Higiene y Seguridad en el Trabajo",
    categoria: ["Seguridad Industrial", "EPP"],
    nivel: "Básico",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "Normatividad aplicable (NOM-017-STPS)",
      "Tipos de EPP: cabeza, ojos, oídos, respiratorio, manos, pies, cuerpo",
      "Selección adecuada del EPP según el riesgo",
      "Uso correcto, mantenimiento y reemplazo",
      "Responsabilidades del patrón y del trabajador",
      "Inspección y registro de EPP"
    ],
    description: "Conoce los tipos de equipo de protección personal, su selección según el riesgo, uso correcto y normatividad aplicable.",
    objetivo: "Conocer y aplicar correctamente el equipo de protección personal según la normatividad.",
    publico: ["Trabajadores operativos", "Supervisores", "Seguridad e Higiene"],
  },
  {
    slug: "operario-limpieza",
    title: "Operario de Limpieza",
    instructor: "Lic. Jorge Armando Medina Castillo",
    instructorId: "MC",
    durationHrs: 6,
    areaTematica: "Limpieza Industrial y Doméstica",
    categoria: ["Operaciones", "Limpieza"],
    nivel: "Básico",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "Técnicas de limpieza industrial y doméstica",
      "Manejo seguro de productos químicos de limpieza",
      "Hojas de seguridad (HDS) de productos",
      "Equipo de protección para limpieza",
      "Procedimientos de limpieza en áreas especiales",
      "Gestión de residuos"
    ],
    description: "Capacitación técnica para operarios de limpieza: técnicas, manejo seguro de químicos, EPP y procedimientos estandarizados.",
    objetivo: "Capacitar al personal de limpieza en técnicas seguras y procedimientos estandarizados.",
    publico: ["Operarios de limpieza", "Supervisores de servicios"],
  },
  {
    slug: "seguridad-energia-electrica",
    title: "Condiciones de Seguridad en Trabajos con Energía Eléctrica",
    instructor: "Lic. Jorge Armando Medina Castillo",
    instructorId: "MC",
    durationHrs: 8,
    areaTematica: "Higiene y Seguridad en el Trabajo",
    categoria: ["Seguridad Industrial", "Electricidad"],
    nivel: "Intermedio",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "Conceptos básicos de electricidad y sus riesgos",
      "NOM-029-STPS Mantenimiento de instalaciones eléctricas",
      "Efectos de la corriente eléctrica en el cuerpo humano",
      "Procedimientos de trabajo seguro con energía eléctrica",
      "Bloqueo y etiquetado (LOTO) aplicado a energía eléctrica",
      "Equipo de protección dieléctrico",
      "Distancias de seguridad",
      "Respuesta a emergencias eléctricas"
    ],
    description: "Conoce los riesgos eléctricos, las normas aplicables y los procedimientos de trabajo seguro para prevenir accidentes con energía eléctrica.",
    objetivo: "Aplicar procedimientos de trabajo seguro con energía eléctrica conforme a la normatividad.",
    publico: ["Electricistas", "Técnicos de mantenimiento", "Supervisores"],
  },
  {
    slug: "brigada-contra-incendios",
    title: "Brigada Contra Incendios",
    instructor: "Lic. Jorge Armando Medina Castillo",
    instructorId: "MC",
    durationHrs: 8,
    areaTematica: "Seguridad",
    categoria: ["Protección Civil", "Brigadas", "Incendios"],
    nivel: "Intermedio",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "Teoría del fuego: triángulo y tetraedro del fuego",
      "Clasificación de incendios (A, B, C, D, K)",
      "Tipos de extintores y su uso correcto",
      "Sistemas fijos contra incendio",
      "Organización de la brigada contra incendios",
      "Técnicas de combate de incendios",
      "Planes de evacuación",
      "Simulacros y prácticas con fuego real"
    ],
    description: "Forma y capacita a los integrantes de la brigada contra incendios con conocimientos teóricos y prácticos para responder ante emergencias.",
    objetivo: "Formar brigadistas capaces de prevenir y responder ante emergencias por incendio.",
    publico: ["Brigadistas", "Protección Civil", "Todos los colaboradores"],
  },
  {
    slug: "brigada-primeros-auxilios",
    title: "Brigada de Primeros Auxilios",
    instructor: "Lic. Jorge Armando Medina Castillo",
    instructorId: "MC",
    durationHrs: 8,
    areaTematica: "Seguridad",
    categoria: ["Protección Civil", "Brigadas", "Primeros Auxilios"],
    nivel: "Intermedio",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "Principios de primeros auxilios (PAS: Proteger, Alertar, Socorrer)",
      "Evaluación primaria y secundaria de la víctima",
      "RCP (Reanimación Cardiopulmonar) y uso de DEA",
      "Control de hemorragias",
      "Manejo de fracturas, luxaciones y esguinces",
      "Quemaduras y lesiones por calor/frío",
      "Botiquín de primeros auxilios",
      "Traslado de lesionados"
    ],
    description: "Capacitación esencial para brigadistas de primeros auxilios: evaluación de víctimas, RCP, control de hemorragias y manejo de lesiones.",
    objetivo: "Capacitar brigadistas en técnicas de primeros auxilios para responder ante emergencias.",
    publico: ["Brigadistas", "Protección Civil", "Todos los colaboradores"],
  },
  {
    slug: "sistema-globalmente-armonizado-sga",
    title: "Comunicación de los Peligros — Sistema Globalmente Armonizado (SGA)",
    instructor: "Lic. Jorge Armando Medina Castillo",
    instructorId: "MC",
    durationHrs: 4,
    areaTematica: "Higiene y Seguridad en el Trabajo",
    categoria: ["Seguridad Industrial", "Químicos", "SGA"],
    nivel: "Intermedio",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "¿Qué es el Sistema Globalmente Armonizado (SGA/GHS)?",
      "NOM-018-STPS: Comunicación de peligros y riesgos por sustancias químicas",
      "Clasificación de peligros: salud, físicos, ambientales",
      "Pictogramas SGA: los 9 símbolos y su significado",
      "Lectura e interpretación de Hojas de Datos de Seguridad (HDS)",
      "Etiquetado conforme al SGA",
      "Palabras de advertencia: Peligro vs. Atención",
      "Indicaciones de peligro (frases H) y consejos de prudencia (frases P)"
    ],
    description: "Aprende a leer, interpretar y aplicar el sistema de comunicación de peligros químicos (SGA) conforme a la NOM-018-STPS.",
    objetivo: "Interpretar y aplicar el Sistema Globalmente Armonizado de comunicación de peligros químicos.",
    publico: ["Trabajadores expuestos a químicos", "Seguridad e Higiene", "Supervisores"],
  },
  {
    slug: "nom-035-stps-medina",
    title: "NOM-035-STPS-2018: Identificación, Análisis y Prevención de Riesgos Psicosociales",
    instructor: "Lic. Jorge Armando Medina Castillo",
    instructorId: "MC",
    durationHrs: 4,
    areaTematica: "Higiene y Seguridad en el Trabajo",
    categoria: ["Normatividad", "NOM-035", "Salud Ocupacional"],
    nivel: "Todos los niveles",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "Objetivo y campo de aplicación",
      "Factores de riesgo psicosocial en el trabajo",
      "Obligaciones de patrones y trabajadores",
      "Cuestionarios de identificación (Guías de Referencia)",
      "Medidas de prevención y control",
      "Entorno organizacional favorable"
    ],
    description: "Cumple con la NOM-035: identifica factores de riesgo psicosocial, aplica los cuestionarios oficiales e implementa medidas de prevención.",
    objetivo: "Cumplir con la NOM-035-STPS mediante la identificación y prevención de riesgos psicosociales.",
    publico: ["Recursos Humanos", "Seguridad e Higiene", "Comités", "Todos los colaboradores"],
  },
  {
    slug: "formacion-instructores",
    title: "Formación de Instructores",
    instructor: "Lic. Jorge Armando Medina Castillo",
    instructorId: "MC",
    durationHrs: 20,
    areaTematica: "Formación y Actualización de Instructores",
    categoria: ["Capacitación", "Formación", "Didáctica"],
    nivel: "Avanzado",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "El rol del instructor en la capacitación",
      "Detección de necesidades de capacitación (DNC)",
      "Diseño de programas de capacitación",
      "Técnicas y estrategias didácticas",
      "Manejo de grupos y dinámicas",
      "Evaluación del aprendizaje",
      "Elaboración de materiales didácticos",
      "Marco legal de la capacitación en México (LFT, STPS)",
      "Comunicación efectiva para instructores",
      "Práctica docente supervisada"
    ],
    description: "Curso integral de 20 horas para formar instructores internos capaces de diseñar, impartir y evaluar capacitación conforme a la LFT y STPS.",
    objetivo: "Formar instructores internos competentes en diseño, impartición y evaluación de capacitación.",
    publico: ["Instructores internos", "Formadores", "RH", "Coordinadores de capacitación"],
  },
  {
    slug: "bloqueo-etiquetado-loto",
    title: "Bloqueo y Etiquetado de Energías Peligrosas (LOTO)",
    instructor: "Lic. Jorge Armando Medina Castillo",
    instructorId: "MC",
    durationHrs: 8,
    areaTematica: "Seguridad",
    categoria: ["Seguridad Industrial", "LOTO", "Energías Peligrosas"],
    nivel: "Intermedio",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "¿Qué es el bloqueo y etiquetado (LOTO)?",
      "Tipos de energía peligrosa: eléctrica, mecánica, hidráulica, neumática, térmica, química",
      "Procedimiento de bloqueo/etiquetado paso a paso",
      "Dispositivos de bloqueo y candados",
      "Verificación de energía cero",
      "Responsabilidades: empleado autorizado, afectado, supervisor",
      "Remoción del bloqueo y reinicio",
      "Casos de accidentes por falta de LOTO"
    ],
    description: "Protege vidas: aprende el procedimiento de bloqueo y etiquetado (LOTO) para controlar energías peligrosas durante mantenimiento.",
    objetivo: "Aplicar el procedimiento de bloqueo y etiquetado para controlar energías peligrosas.",
    publico: ["Técnicos de mantenimiento", "Supervisores", "Seguridad Industrial"],
  },
  {
    slug: "nom-026-colores-senales-seguridad",
    title: "NOM-026-STPS-2008: Colores y Señales de Seguridad e Higiene",
    instructor: "Lic. Jorge Armando Medina Castillo",
    instructorId: "MC",
    durationHrs: 8,
    areaTematica: "Seguridad",
    categoria: ["Normatividad", "Señalización", "Seguridad Industrial"],
    nivel: "Básico",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "Objetivo y campo de aplicación de la NOM-026",
      "Colores de seguridad: rojo, amarillo, verde, azul y sus significados",
      "Colores contrastantes",
      "Tipos de señales: prohibición, obligación, precaución, información, condición segura",
      "Señalización de tuberías",
      "Señalización de áreas y equipos",
      "Diseño, ubicación y mantenimiento de señales",
      "Evaluación de la señalización en centros de trabajo"
    ],
    description: "Domina la NOM-026: aprende el uso correcto de colores y señales de seguridad para prevenir accidentes en el centro de trabajo.",
    objetivo: "Aplicar correctamente los colores y señales de seguridad conforme a la NOM-026.",
    publico: ["Seguridad e Higiene", "Supervisores", "Mantenimiento", "Todos los colaboradores"],
  },
  {
    slug: "herramientas-manuales-poder",
    title: "Uso y Manejo de Herramientas Manuales y de Poder",
    instructor: "Lic. Jorge Armando Medina Castillo",
    instructorId: "MC",
    durationHrs: 8,
    areaTematica: "Operación de Máquinas Herramienta",
    categoria: ["Seguridad Industrial", "Herramientas", "Operaciones"],
    nivel: "Básico",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "Clasificación de herramientas manuales y de poder",
      "Inspección previa al uso",
      "Uso correcto de herramientas manuales (llaves, desarmadores, pinzas, martillos)",
      "Uso seguro de herramientas de poder (taladros, esmeriladoras, sierras)",
      "Riesgos comunes y cómo prevenirlos",
      "EPP requerido según la herramienta",
      "Almacenamiento y mantenimiento",
      "Permisos de trabajo y procedimientos seguros"
    ],
    description: "Aprende el uso seguro de herramientas manuales y de poder: inspección, operación correcta, EPP y prevención de accidentes.",
    objetivo: "Utilizar correctamente herramientas manuales y de poder con seguridad.",
    publico: ["Trabajadores operativos", "Técnicos", "Supervisores"],
  },
  {
    slug: "ergonomia-trastornos-musculoesqueleticos",
    title: "Ergonomía en el Trabajo: Prevención de Trastornos Musculoesqueléticos",
    instructor: "Lic. Jorge Armando Medina Castillo",
    instructorId: "MC",
    durationHrs: 8,
    areaTematica: "Higiene y Seguridad en el Trabajo",
    categoria: ["Ergonomía", "Salud Ocupacional"],
    nivel: "Todos los niveles",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "Fundamentos de ergonomía laboral",
      "Trastornos musculoesqueléticos más comunes (TME)",
      "Factores de riesgo ergonómico: posturas, repetición, fuerza, vibración",
      "Evaluación de riesgos ergonómicos (método REBA/RULA)",
      "Ergonomía en oficina: estación de trabajo, pantalla, silla",
      "Ergonomía en trabajo físico: levantamiento de cargas, posiciones",
      "Ejercicios de pausa activa",
      "Diseño ergonómico del puesto de trabajo"
    ],
    description: "Previene lesiones musculoesqueléticas: aprende principios de ergonomía, evalúa tu puesto de trabajo y aplica correcciones efectivas.",
    objetivo: "Prevenir trastornos musculoesqueléticos mediante principios de ergonomía aplicada.",
    publico: ["Todos los colaboradores", "Seguridad e Higiene", "RH"],
  },
  {
    slug: "soldadura-corte-seguridad",
    title: "Actividades de Soldadura y Corte: Condiciones de Seguridad e Higiene",
    instructor: "Lic. Jorge Armando Medina Castillo",
    instructorId: "MC",
    durationHrs: 8,
    areaTematica: "Higiene y Seguridad en el Trabajo",
    categoria: ["Seguridad Industrial", "Soldadura", "Trabajos en Caliente"],
    nivel: "Intermedio",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "Tipos de soldadura y corte (arco eléctrico, oxiacetileno, MIG/MAG, TIG)",
      "NOM-027-STPS: Actividades de soldadura y corte",
      "Riesgos: quemaduras, radiación, humos, incendio, explosión",
      "Permiso de trabajo en caliente",
      "EPP para soldadura y corte",
      "Ventilación y extracción de humos",
      "Inspección de equipos y cilindros",
      "Prevención de incendios en trabajos en caliente",
      "Primeros auxilios para lesiones por soldadura"
    ],
    description: "Condiciones de seguridad e higiene para actividades de soldadura y corte conforme a la NOM-027-STPS.",
    objetivo: "Aplicar condiciones de seguridad e higiene en actividades de soldadura y corte.",
    publico: ["Soldadores", "Técnicos", "Supervisores", "Seguridad Industrial"],
  },
  {
    slug: "operacion-segura-montacargas",
    title: "Operación Segura de Montacargas",
    instructor: "Lic. Jorge Armando Medina Castillo",
    instructorId: "MC",
    durationHrs: 20,
    areaTematica: "Seguridad",
    categoria: ["Operaciones", "Montacargas", "Seguridad Industrial"],
    nivel: "Intermedio",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "Tipos de montacargas y sus componentes",
      "Principios de estabilidad y centro de gravedad",
      "Tabla de capacidad de carga",
      "Inspección diaria pre-operación (checklist)",
      "Técnicas de manejo: avance, retroceso, giros, rampas",
      "Apilamiento y desapilamiento seguro",
      "Manejo de cargas largas, pesadas e irregulares",
      "Circulación en áreas de trabajo: velocidades, distancias, señalización",
      "Carga de baterías / llenado de combustible",
      "Reglamento interno de circulación",
      "Práctica de manejo supervisada",
      "Evaluación teórica y práctica"
    ],
    description: "Curso completo de 20 horas para la operación segura de montacargas: teoría, técnicas de manejo, inspección y práctica supervisada.",
    objetivo: "Operar montacargas de manera segura cumpliendo con la normatividad aplicable.",
    publico: ["Operadores de montacargas", "Supervisores de almacén", "Logística"],
  },
  {
    slug: "actualizacion-montacargas",
    title: "Actualización en Operación Segura de Montacargas",
    instructor: "Lic. Jorge Armando Medina Castillo",
    instructorId: "MC",
    durationHrs: 8,
    areaTematica: "Seguridad",
    categoria: ["Operaciones", "Montacargas", "Actualización"],
    nivel: "Intermedio",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "Repaso de principios de operación segura",
      "Actualización normativa",
      "Análisis de incidentes y lecciones aprendidas",
      "Reforzamiento de técnicas de manejo",
      "Evaluación de competencias",
      "Práctica de manejo (reforzamiento)"
    ],
    description: "Actualización para operadores de montacargas certificados: refuerza conocimientos, actualiza normatividad y recertifica tu competencia.",
    objetivo: "Actualizar y recertificar competencias de operación segura de montacargas.",
    publico: ["Operadores certificados de montacargas", "Supervisores"],
  },
  {
    slug: "nom-019-comisiones-seguridad-higiene",
    title: "NOM-019-STPS-2011: Comisiones de Seguridad e Higiene",
    instructor: "Lic. Jorge Armando Medina Castillo",
    instructorId: "MC",
    durationHrs: 8,
    areaTematica: "Higiene y Seguridad en el Trabajo",
    categoria: ["Normatividad", "Comisiones", "NOM-019"],
    nivel: "Intermedio",
    precioCurso: 0,
    dc3Disponible: true,
    temas: [
      "Objetivo y campo de aplicación de la NOM-019",
      "¿Qué es una Comisión de Seguridad e Higiene?",
      "Integración de la comisión: representantes del patrón y de los trabajadores",
      "Funciones y responsabilidades de la comisión",
      "Recorridos de verificación: cómo realizarlos",
      "Actas de verificación: formato y contenido",
      "Identificación de condiciones peligrosas y actos inseguros",
      "Seguimiento a medidas correctivas",
      "Programa anual de recorridos",
      "Relación con otras normas (NOM-030-STPS)"
    ],
    description: "Aprende a integrar y operar la Comisión de Seguridad e Higiene conforme a la NOM-019-STPS: recorridos, actas y seguimiento.",
    objetivo: "Integrar y operar comisiones de seguridad e higiene conforme a la NOM-019.",
    publico: ["Miembros de comisiones", "RH", "Seguridad e Higiene", "Supervisores"],
  },
];

export async function seedCourses() {
  const existing = await db.select({ slug: courses.slug }).from(courses);
  const existingSlugs = new Set(existing.map((c) => c.slug));

  const stpsSlugs = new Set(STPS_COURSES.map((c) => c.slug));
  const toDelete = existing.filter((c) => !stpsSlugs.has(c.slug));

  if (toDelete.length > 0) {
    for (const c of toDelete) {
      await db.delete(courses).where(sql`${courses.slug} = ${c.slug}`);
    }
    console.log(`[seed] Removed ${toDelete.length} old courses`);
  }

  let inserted = 0;
  let updated = 0;
  for (const course of STPS_COURSES) {
    if (!existingSlugs.has(course.slug)) {
      await db.insert(courses).values(course);
      inserted++;
    } else {
      const { slug, ...updateData } = course;
      await db.update(courses).set({ ...updateData, updatedAt: new Date() }).where(sql`${courses.slug} = ${slug}`);
      updated++;
    }
  }

  const parts = [];
  if (inserted > 0) parts.push(`inserted ${inserted}`);
  if (updated > 0) parts.push(`updated ${updated}`);
  console.log(`[seed] ${parts.length > 0 ? parts.join(", ") : `All ${STPS_COURSES.length} STPS courses synced`}`);
}

const COURSE_MODULES_DATA: Record<string, { title: string; description: string; contentHtml: string; videoUrl?: string; audioUrl?: string; references?: string[]; durationMinutes: number }[]> = {
  "brigada-primeros-auxilios": [
    {
      title: "Fundamentos de Primeros Auxilios en el Trabajo",
      description: "Principios básicos de atención de emergencias en el centro de trabajo.",
      contentHtml: `<h2>¿Qué son los Primeros Auxilios?</h2><p>Los primeros auxilios son las <strong>acciones inmediatas y temporales</strong> que se aplican a una persona que ha sufrido un accidente o enfermedad repentina, antes de recibir atención médica profesional.</p><h3>Principios de Acción</h3><ol><li><strong>Proteger:</strong> Asegurar que la escena sea segura para ti y para la víctima</li><li><strong>Alertar:</strong> Llamar a los servicios de emergencia (911)</li><li><strong>Socorrer:</strong> Brindar los primeros auxilios según tu capacitación</li></ol><h3>Marco Legal</h3><p>La <strong>Ley General de Salud</strong> y la <strong>NOM-005-STPS</strong> establecen la obligación de los centros de trabajo de contar con personal capacitado y equipo de primeros auxilios.</p><h3>Contenido del Botiquín</h3><ul><li>Gasas estériles, vendas elásticas, cinta adhesiva</li><li>Antisépticos (isodine, alcohol)</li><li>Tijeras, pinzas, guantes de latex</li><li>Férulas y collarín cervical</li><li>Manual de primeros auxilios</li></ul>`,
      references: ["NOM-005-STPS-1998", "NOM-030-STPS-2009", "Ley General de Salud"],
      durationMinutes: 30,
    },
    {
      title: "Evaluación Primaria y Triage",
      description: "Cómo evaluar el estado de una víctima y priorizar la atención.",
      contentHtml: `<h2>Evaluación Primaria (ABC)</h2><p>La evaluación primaria sigue el protocolo <strong>CAB</strong> (Circulation, Airway, Breathing):</p><h3>C - Circulación</h3><p>Verificar si hay pulso y si existe hemorragia grave que requiera control inmediato.</p><h3>A - Vía Aérea</h3><p>Asegurar que la vía aérea esté despejada. Usar la maniobra de <strong>inclinación de cabeza-elevación del mentón</strong>.</p><h3>B - Respiración</h3><p>Verificar si la persona respira: <strong>Ver, Escuchar, Sentir</strong> durante 10 segundos.</p><h2>Sistema de Triage</h2><p>El triage clasifica a las víctimas por prioridad:</p><ul><li><strong>Rojo (Inmediato):</strong> Peligro de muerte, requiere atención inmediata</li><li><strong>Amarillo (Urgente):</strong> Lesiones serias pero estables</li><li><strong>Verde (No urgente):</strong> Lesiones menores, pueden esperar</li><li><strong>Negro (Fallecido):</strong> Sin signos vitales</li></ul>`,
      references: ["Manual de Primeros Auxilios de la Cruz Roja Mexicana", "NOM-237-SSA1-2004"],
      durationMinutes: 35,
    },
    {
      title: "RCP y Uso del DEA",
      description: "Reanimación cardiopulmonar y uso del desfibrilador externo automático.",
      contentHtml: `<h2>Reanimación Cardiopulmonar (RCP)</h2><p>La RCP se aplica cuando la víctima <strong>no respira y no tiene pulso</strong>.</p><h3>Pasos para RCP en Adultos</h3><ol><li>Colocar a la víctima boca arriba sobre superficie firme</li><li>Colocar el talón de la mano en el centro del pecho (esternón)</li><li>Realizar <strong>30 compresiones</strong> a una profundidad de 5-6 cm</li><li>Dar <strong>2 ventilaciones</strong> de rescate</li><li>Repetir ciclos 30:2 hasta que llegue ayuda</li></ol><p>Frecuencia: <strong>100-120 compresiones por minuto</strong></p><h2>Uso del DEA (Desfibrilador Externo Automático)</h2><ol><li>Encender el DEA y seguir las instrucciones de voz</li><li>Colocar los parches en el pecho desnudo de la víctima</li><li>Alejarse mientras el DEA analiza el ritmo</li><li>Si se indica descarga, asegurar que nadie toque a la víctima</li><li>Presionar el botón de descarga</li><li>Continuar con RCP inmediatamente después</li></ol>`,
      references: ["Guía AHA 2020 para RCP", "NOM-034-SSA3-2013"],
      durationMinutes: 40,
    },
    {
      title: "Manejo de Heridas, Fracturas y Quemaduras",
      description: "Técnicas de atención para lesiones comunes en el trabajo.",
      contentHtml: `<h2>Manejo de Heridas</h2><h3>Control de Hemorragias</h3><ol><li><strong>Presión directa:</strong> Aplicar presión con gasa estéril sobre la herida</li><li><strong>Elevación:</strong> Elevar la extremidad afectada por encima del corazón</li><li><strong>Torniquete:</strong> Solo en casos de hemorragia que amenaza la vida, aplicar a 5-7 cm por encima de la herida</li></ol><h2>Fracturas</h2><p>Signos: dolor, deformidad, hinchazón, incapacidad funcional.</p><ul><li><strong>No mover</strong> la extremidad lesionada</li><li>Inmovilizar con férula en la posición encontrada</li><li>Aplicar hielo envuelto en tela</li><li>Verificar circulación distal (color, temperatura, sensibilidad)</li></ul><h2>Quemaduras</h2><ul><li><strong>1er grado:</strong> Enrojecimiento — enfriar con agua corriente 10-20 min</li><li><strong>2do grado:</strong> Ampollas — no reventarlas, cubrir con gasa húmeda</li><li><strong>3er grado:</strong> Tejido carbonizado — cubrir con gasa seca, trasladar urgente</li></ul>`,
      references: ["NOM-005-STPS-1998", "Manual de urgencias médicas IMSS"],
      durationMinutes: 35,
    },
  ],
  "liderazgo-trabajo-colaborativo": [
    {
      title: "Fundamentos del Liderazgo Efectivo",
      description: "Estilos de liderazgo y su impacto en el equipo de trabajo.",
      contentHtml: `<h2>¿Qué es el Liderazgo?</h2><p>El liderazgo es la capacidad de <strong>influir positivamente</strong> en un grupo de personas para alcanzar objetivos comunes.</p><h3>Estilos de Liderazgo</h3><ul><li><strong>Autocrático:</strong> El líder toma todas las decisiones. Útil en emergencias, pero limita la participación.</li><li><strong>Democrático:</strong> Fomenta la participación del equipo. Genera mayor compromiso y creatividad.</li><li><strong>Laissez-faire:</strong> Mínima intervención del líder. Funciona con equipos muy maduros y autónomos.</li><li><strong>Transformacional:</strong> Inspira y motiva al equipo hacia una visión compartida. El más efectivo para el cambio organizacional.</li><li><strong>Situacional:</strong> Adapta el estilo según la madurez y competencia del equipo.</li></ul><h3>El Líder vs. El Jefe</h3><p>El <strong>jefe</strong> manda, el <strong>líder</strong> inspira. El jefe busca culpables, el líder busca soluciones. El jefe dice "yo", el líder dice "nosotros".</p>`,
      references: ["Daniel Goleman - Inteligencia Emocional", "NOM-035-STPS-2018 (liderazgo positivo)"],
      durationMinutes: 30,
    },
    {
      title: "Comunicación y Escucha Activa",
      description: "Herramientas de comunicación efectiva para líderes.",
      contentHtml: `<h2>Comunicación Efectiva</h2><p>La comunicación es la herramienta más importante del líder. Se estima que los líderes dedican el <strong>80% de su tiempo</strong> a comunicarse.</p><h3>Elementos de la Comunicación</h3><ul><li><strong>Verbal (7%):</strong> Las palabras que elegimos</li><li><strong>Paraverbal (38%):</strong> Tono, volumen, velocidad</li><li><strong>No verbal (55%):</strong> Gestos, postura, contacto visual</li></ul><h3>Escucha Activa</h3><p>La escucha activa implica:</p><ol><li><strong>Atender:</strong> Mantener contacto visual, postura abierta</li><li><strong>Comprender:</strong> Parafrasear lo que dice el otro</li><li><strong>Responder:</strong> Dar retroalimentación constructiva</li><li><strong>Recordar:</strong> Retener los puntos clave de la conversación</li></ol><h3>Barreras de la Comunicación</h3><ul><li>Prejuicios y suposiciones</li><li>Distracciones (celular, ruido)</li><li>Emociones negativas</li><li>Falta de retroalimentación</li></ul>`,
      references: ["Albert Mehrabian - Comunicación no verbal", "Stephen Covey - Los 7 hábitos"],
      durationMinutes: 25,
    },
    {
      title: "Trabajo en Equipo y Sinergia",
      description: "Cómo construir equipos de alto desempeño.",
      contentHtml: `<h2>Trabajo en Equipo</h2><p>Un equipo efectivo es más que un grupo de personas. Se caracteriza por:</p><ul><li><strong>Objetivo común:</strong> Todos trabajan hacia la misma meta</li><li><strong>Roles definidos:</strong> Cada miembro sabe su responsabilidad</li><li><strong>Confianza:</strong> Los miembros confían entre sí</li><li><strong>Comunicación abierta:</strong> Se comparte información libremente</li></ul><h3>Etapas de Formación del Equipo (Tuckman)</h3><ol><li><strong>Formación:</strong> El grupo se conoce, hay cortesía e incertidumbre</li><li><strong>Tormenta:</strong> Surgen conflictos y competencia por roles</li><li><strong>Normalización:</strong> Se establecen normas y se genera cohesión</li><li><strong>Desempeño:</strong> El equipo funciona de manera eficiente</li><li><strong>Disolución:</strong> El equipo cumple su objetivo y se disuelve</li></ol><h3>Sinergia</h3><p>La sinergia ocurre cuando el resultado del equipo es <strong>mayor que la suma de sus partes individuales</strong>. Se logra cuando hay diversidad de pensamiento, respeto mutuo y un propósito compartido.</p>`,
      references: ["Bruce Tuckman - Stages of Group Development", "Patrick Lencioni - Las cinco disfunciones de un equipo"],
      durationMinutes: 30,
    },
    {
      title: "Resolución de Conflictos y Negociación",
      description: "Manejo constructivo de conflictos en el entorno laboral.",
      contentHtml: `<h2>Tipos de Conflicto</h2><ul><li><strong>Funcional:</strong> Genera debate constructivo y mejora la toma de decisiones</li><li><strong>Disfuncional:</strong> Deteriora las relaciones y la productividad</li></ul><h3>Estilos de Manejo de Conflictos (Thomas-Kilmann)</h3><ul><li><strong>Competir:</strong> Ganar a costa del otro. Útil en decisiones urgentes.</li><li><strong>Colaborar:</strong> Buscar una solución que satisfaga a ambas partes. Ideal cuando el tema es importante para todos.</li><li><strong>Comprometer:</strong> Cada parte cede algo. Útil cuando el tiempo es limitado.</li><li><strong>Evitar:</strong> Retirarse del conflicto. Apropiado cuando el tema es trivial.</li><li><strong>Acomodar:</strong> Ceder ante el otro. Útil para mantener la armonía.</li></ul><h3>Proceso de Negociación</h3><ol><li>Preparación: conocer intereses propios y del otro</li><li>Apertura: establecer el tono y las reglas</li><li>Exploración: identificar necesidades reales</li><li>Propuesta: generar opciones de solución</li><li>Acuerdo: formalizar compromisos</li></ol>`,
      references: ["Thomas-Kilmann Conflict Mode Instrument", "Roger Fisher - Getting to Yes"],
      durationMinutes: 35,
    },
  ],
};

const QUIZ_DATA: Record<string, { title: string; passingScore: number; questions: { question: string; options: string[]; correctIndex: number; explanation: string }[] }> = {
  "nom-035-stps-riesgo-psicosocial": {
    title: "Evaluación: NOM-035-STPS-2018",
    passingScore: 70,
    questions: [
      { question: "¿Cuál es el objetivo principal de la NOM-035-STPS-2018?", options: ["Regular los salarios mínimos", "Identificar, analizar y prevenir factores de riesgo psicosocial", "Establecer horarios de trabajo", "Regular las prestaciones de seguridad social"], correctIndex: 1, explanation: "La NOM-035 establece los elementos para identificar, analizar y prevenir los factores de riesgo psicosocial en los centros de trabajo." },
      { question: "¿A qué tipo de centros de trabajo aplica la NOM-035?", options: ["Solo a empresas con más de 100 trabajadores", "Solo a empresas del sector industrial", "A todos los centros de trabajo en territorio nacional", "Solo a empresas del gobierno"], correctIndex: 2, explanation: "La NOM-035 aplica a todos los centros de trabajo en el territorio nacional, clasificados según su número de trabajadores." },
      { question: "¿Cuántos niveles de centros de trabajo define la NOM-035?", options: ["2 niveles", "3 niveles", "4 niveles", "5 niveles"], correctIndex: 1, explanation: "La norma clasifica a los centros de trabajo en 3 niveles: hasta 15, de 16 a 50, y más de 50 trabajadores." },
      { question: "¿Cuál de las siguientes NO es una obligación del patrón según la NOM-035?", options: ["Establecer una política de prevención", "Pagar bonos por productividad", "Identificar factores de riesgo psicosocial", "Practicar exámenes médicos a trabajadores expuestos"], correctIndex: 1, explanation: "Pagar bonos por productividad no es una obligación establecida en la NOM-035. Las obligaciones del patrón incluyen prevención, identificación y evaluación de riesgos." },
      { question: "¿Qué es un 'entorno organizacional favorable' según la NOM-035?", options: ["Un espacio con aire acondicionado", "Un entorno que promueve el sentido de pertenencia, formación y comunicación", "Una oficina con diseño moderno", "Un lugar con acceso a internet de alta velocidad"], correctIndex: 1, explanation: "Un entorno organizacional favorable promueve sentido de pertenencia, formación adecuada, definición de responsabilidades, participación y evaluación del desempeño." },
      { question: "¿En cuántos niveles se clasifican los resultados de la identificación de riesgos psicosociales?", options: ["3 niveles", "4 niveles", "5 niveles", "6 niveles"], correctIndex: 2, explanation: "Los resultados se clasifican en 5 niveles: Nulo, Bajo, Medio, Alto y Muy alto." },
      { question: "¿Cuál de las siguientes es una obligación de los trabajadores?", options: ["Contratar personal de seguridad", "Participar en la identificación de factores de riesgo", "Realizar auditorías externas", "Crear la política de prevención"], correctIndex: 1, explanation: "Los trabajadores deben participar en la identificación de factores de riesgo psicosocial y colaborar con las medidas de prevención." },
      { question: "¿Qué factor NO es considerado un riesgo psicosocial por la NOM-035?", options: ["Cargas de trabajo excesivas", "Violencia laboral", "Color de las paredes de la oficina", "Jornadas laborales superiores a lo previsto en la LFT"], correctIndex: 2, explanation: "El color de las paredes no es un factor de riesgo psicosocial. Los factores incluyen cargas excesivas, violencia, jornadas extensas y falta de control sobre el trabajo." },
    ],
  },
};

const STPS_ACHIEVEMENTS = STPS_COURSES.map(course => ({
  slug: `logro-${course.slug}`,
  name: `Certificado: ${course.title}`,
  shortDescription: `Aprobó la evaluación del curso "${course.title}"`,
  description: `Logro coleccionable obtenido al aprobar exitosamente la evaluación del curso ${course.title}. Demuestra competencia verificable en ${course.areaTematica}.`,
  category: course.areaTematica,
  value: course.categoria.some(c => c.includes("NOM")) ? 2000 : 1000,
  icon: course.areaTematica === "Seguridad Industrial" ? "shield-check" : course.areaTematica === "Desarrollo Humano" ? "heart" : "award",
}));

export async function seedModulesAndQuizzes() {
  const allModules = { ...COURSE_MODULES_DATA, ...EXTRA_MODULES_DATA, ...MEDINA_MODULES_DATA, ...yuridiaModules };
  const allQuizzes = { ...QUIZ_DATA, ...EXTRA_QUIZ_DATA, ...MEDINA_QUIZ_DATA, ...yuridiaQuizzes };
  const consolidatedSlugs = new Set([...Object.keys(MEDINA_MODULES_DATA), ...Object.keys(yuridiaModules)]);

  for (const [slug, modules] of Object.entries(allModules)) {
    const [course] = await db.select().from(courses).where(eq(courses.slug, slug));
    if (!course) continue;

    const existingModules = await db.select().from(courseModules).where(eq(courseModules.courseId, course.id));
    if (existingModules.length > 0) {
      const hasStaleTedTitle = existingModules.some(m => m.title?.includes("Plática TED"));
      if (consolidatedSlugs.has(slug) && (hasStaleTedTitle || existingModules.length !== modules.length || !existingModules[0].audioUrl?.includes("_ted_talk.mp3"))) {
        await db.delete(courseModules).where(eq(courseModules.courseId, course.id));
        console.log(`[seed] Migrating "${slug}" to consolidated STPS session module${hasStaleTedTitle ? " (fixing Plática TED title)" : ""}`);
      } else {
        continue;
      }
    }

    for (let i = 0; i < modules.length; i++) {
      const mod = modules[i];
      await db.insert(courseModules).values({
        courseId: course.id,
        order: i + 1,
        title: mod.title,
        description: mod.description,
        contentHtml: mod.contentHtml,
        videoUrl: mod.videoUrl || null,
        audioUrl: mod.audioUrl || null,
        references: mod.references || null,
        durationMinutes: mod.durationMinutes,
      });
    }
    console.log(`[seed] Seeded ${modules.length} modules for "${slug}"`);
  }

  for (const [slug, quizData] of Object.entries(allQuizzes)) {
    const [course] = await db.select().from(courses).where(eq(courses.slug, slug));
    if (!course) continue;

    const existingQuiz = await db.select().from(courseQuizzes).where(eq(courseQuizzes.courseId, course.id));
    if (existingQuiz.length > 0) continue;

    if (!quizData.title || !quizData.questions?.length) {
      console.log(`[seed] Skipping quiz for "${slug}" — missing title or questions`);
      continue;
    }

    const [quiz] = await db.insert(courseQuizzes).values({
      courseId: course.id,
      title: quizData.title,
      description: `Evaluación del curso "${course.title}". Mínimo ${quizData.passingScore}% para aprobar.`,
      passingScore: quizData.passingScore,
    }).returning();

    for (let i = 0; i < quizData.questions.length; i++) {
      const q = quizData.questions[i];
      await db.insert(quizQuestions).values({
        quizId: quiz.id,
        order: i + 1,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      });
    }
    console.log(`[seed] Seeded quiz with ${quizData.questions.length} questions for "${slug}"`);
  }

  for (const ach of STPS_ACHIEVEMENTS) {
    const existing = await db.select().from(achievements).where(eq(achievements.slug, ach.slug));
    if (existing.length > 0) continue;
    await db.insert(achievements).values(ach);
  }
  console.log(`[seed] Synced ${STPS_ACHIEVEMENTS.length} STPS achievements`);

  const ONBOARDING_ACHIEVEMENTS = [
    { slug: "logro-bienvenido-ceduverse", name: "Bienvenido a Ceduverse", shortDescription: "Completó el curso de bienvenida a Ceduverse", description: "Logro obtenido al completar el curso introductorio de Ceduverse. Conoce la plataforma, sus sistemas de aprendizaje y certificaciones.", category: "Onboarding", value: 1000, icon: "rocket" },
    { slug: "logro-guia-empresas", name: "Guía para Empresas", shortDescription: "Completó la guía para empresas patrocinadoras", description: "Logro obtenido al completar el curso de guía para empresas. Domina planes, aportaciones, gestión de equipos y cumplimiento.", category: "Onboarding", value: 1000, icon: "building" },
    { slug: "logro-guia-socios", name: "Guía para Socios", shortDescription: "Completó la guía para socios comerciales", description: "Logro obtenido al completar el curso de guía para socios. Entiende el programa de comisiones, ventas y panel de socio.", category: "Onboarding", value: 1000, icon: "handshake" },
    { slug: "logro-modelo-cooperativo", name: "Modelo Cooperativo", shortDescription: "Completó el curso del modelo cooperativo", description: "Logro obtenido al completar el curso sobre el modelo cooperativo de Ceduverse. Comprende la estructura, beneficios y operación.", category: "Onboarding", value: 1000, icon: "users" },
    { slug: "logro-programa-elite", name: "Programa Élite", shortDescription: "Completó el curso del Programa Élite", description: "Logro obtenido al completar el curso del Programa Élite. Conoce los beneficios exclusivos y cómo acceder a ellos.", category: "Onboarding", value: 1000, icon: "star" },
    { slug: "logro-como-ganar-ceduverse", name: "Modelo de Ingresos Dominado", shortDescription: "Completó el curso Cómo Ganar con Ceduverse", description: "Logro obtenido al completar el curso 'Cómo Ganar con Ceduverse — Tu Modelo de Ingresos'. Demuestra comprensión completa del modelo de comisiones, proyecciones de ingreso, programa Elite y estrategia de 90 días.", category: "Onboarding", value: 2000, icon: "dollar-sign" },
    { slug: "logro-cripto-blockchain-vaultcard", name: "Diploma: Cripto, Blockchain y Vault Card", shortDescription: "Completó el curso de Cripto, Blockchain y Vault Card", description: "Logro obtenido al completar el curso 'Cripto, Blockchain y Vault Card — Tu Entrada al Mundo Web3'. Domina criptomonedas, blockchain, billeteras y el marco fintech.", category: "Onboarding", value: 1000, icon: "trophy" },
  ];

  for (const ach of ONBOARDING_ACHIEVEMENTS) {
    const existing = await db.select().from(achievements).where(eq(achievements.slug, ach.slug));
    if (existing.length > 0) continue;
    await db.insert(achievements).values(ach);
  }
  console.log(`[seed] Synced ${ONBOARDING_ACHIEVEMENTS.length} onboarding individual achievements`);

  const GRADUATION_ACHIEVEMENTS = [
    { slug: "onboarding-estudiante-completo", name: "Onboarding Estudiante Completo", shortDescription: "Completó todo el onboarding de estudiante/instructor", description: "Logro especial obtenido al completar todos los cursos de onboarding asignados al rol de socio estudiante o instructor.", category: "Onboarding", value: 3000, icon: "graduation-cap" },
    { slug: "onboarding-socio-completo", name: "Onboarding Socio Completo", shortDescription: "Completó todo el onboarding de socio comercial", description: "Logro especial obtenido al completar todos los cursos de onboarding asignados al rol de socio comercial.", category: "Onboarding", value: 3000, icon: "briefcase" },
    { slug: "onboarding-director-completo", name: "Onboarding Director Completo", shortDescription: "Completó todo el onboarding de director", description: "Logro especial obtenido al completar todos los cursos de onboarding asignados al rol de director.", category: "Onboarding", value: 3000, icon: "shield" },
    { slug: "onboarding-empresa-completo", name: "Onboarding Empresa Completo", shortDescription: "Completó todo el onboarding de empresa", description: "Logro especial obtenido al completar todos los cursos de onboarding asignados al rol de empresa.", category: "Onboarding", value: 3000, icon: "building-2" },
  ];

  for (const ach of GRADUATION_ACHIEVEMENTS) {
    const existing = await db.select().from(achievements).where(eq(achievements.slug, ach.slug));
    if (existing.length > 0) continue;
    await db.insert(achievements).values(ach);
  }
  console.log(`[seed] Synced ${GRADUATION_ACHIEVEMENTS.length} onboarding graduation achievements`);

  const expertoAch = {
    slug: "experto-ceduverse",
    name: "Experto Ceduverse",
    shortDescription: "Completó los 6 cursos de onboarding",
    description: "Logro especial obtenido al completar los 6 cursos de onboarding de Ceduverse. Demuestra dominio completo de la plataforma, el modelo cooperativo, el modelo de ingresos y las herramientas disponibles.",
    category: "Onboarding",
    value: 5000,
    icon: "crown",
  };
  const existingExperto = await db.select().from(achievements).where(eq(achievements.slug, expertoAch.slug));
  if (existingExperto.length === 0) {
    await db.insert(achievements).values(expertoAch);
    console.log(`[seed] Created "Experto Ceduverse" achievement`);
  }
}

export async function migrateRoles() {
  try {
    const VALID_ROLES = ['socio_estudiante', 'socio_instructor', 'socio_comercial', 'director', 'empresa', 'empresa_rh'] as const;
    for (const role of VALID_ROLES) {
      const safeRole = role.replace(/[^a-z_]/g, '');
      await db.execute(sql`
        DO $$ BEGIN
          ALTER TYPE user_role ADD VALUE IF NOT EXISTS ${sql.raw(`'${safeRole}'`)};
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
      `);
    }

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS role_definitions (
        role_key TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        description TEXT,
        lgsc_type TEXT,
        badge_color TEXT,
        badge_icon TEXT,
        can_view_courses BOOLEAN NOT NULL DEFAULT TRUE,
        can_create_courses BOOLEAN NOT NULL DEFAULT FALSE,
        can_view_admin BOOLEAN NOT NULL DEFAULT FALSE,
        can_view_partner BOOLEAN NOT NULL DEFAULT FALSE,
        can_view_director BOOLEAN NOT NULL DEFAULT FALSE,
        can_view_empresa BOOLEAN NOT NULL DEFAULT FALSE,
        is_cooperative_member BOOLEAN NOT NULL DEFAULT TRUE,
        sidebar_config JSONB
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS role_change_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        changed_by UUID NOT NULL REFERENCES users(id),
        previous_role TEXT NOT NULL,
        new_role TEXT NOT NULL,
        reason TEXT NOT NULL,
        ip_address TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_role_change_log_user ON role_change_log(user_id)`);

    await db.execute(sql`UPDATE accounts SET user_role = 'socio_estudiante' WHERE user_role IN ('user', 'moderator')`);
    await db.execute(sql`UPDATE accounts SET user_role = 'socio_instructor' WHERE user_role = 'instructor'`);
    await db.execute(sql`UPDATE accounts SET user_role = 'socio_comercial' WHERE user_role = 'partner'`);

    await db.execute(sql`UPDATE accounts SET user_role = 'socio_instructor' WHERE is_instructor = true AND user_role = 'socio_estudiante'`);

    const roleDefsData = [
      { key: 'socio_estudiante', name: 'Socio Estudiante', desc: 'Persona que toma cursos de capacitación', lgsc: 'consumo', color: '#3B82F6', icon: 'GraduationCap', courses: true, create: false, admin: false, partner: false, director: false, empresa: false, coop: true, sidebar: '["resumen","mis_cursos","aula_virtual","tutor_ia","academy","logros","wallet","certificados","perfil"]' },
      { key: 'socio_instructor', name: 'Socio Instructor', desc: 'Persona acreditada para crear e impartir cursos', lgsc: 'produccion', color: '#F59E0B', icon: 'BookOpen', courses: true, create: true, admin: false, partner: false, director: false, empresa: false, coop: true, sidebar: '["resumen","mis_cursos","aula_virtual","tutor_ia","academy","crear_curso","mis_alumnos","comisiones_instructor","logros","wallet","certificados","perfil"]' },
      { key: 'socio_comercial', name: 'Socio Comercial', desc: 'Persona que vende Ceduverse a empresas', lgsc: 'consumo', color: '#10B981', icon: 'Briefcase', courses: true, create: false, admin: false, partner: true, director: false, empresa: false, coop: true, sidebar: '["resumen","mis_cursos","aula_virtual","tutor_ia","academy","logros","wallet","certificados","resumen_socio","perfil"]' },
      { key: 'director', name: 'Director Regional', desc: 'Socio comercial con override y equipo', lgsc: 'produccion', color: '#8B5CF6', icon: 'Crown', courses: true, create: false, admin: false, partner: true, director: true, empresa: false, coop: true, sidebar: '["resumen","mis_cursos","aula_virtual","tutor_ia","academy","logros","wallet","certificados","resumen_director","perfil"]' },
      { key: 'empresa', name: 'Empresa Patrocinadora', desc: 'Persona moral que paga aportaciones', lgsc: 'no_aplica', color: '#EF4444', icon: 'Building2', courses: false, create: false, admin: false, partner: false, director: false, empresa: true, coop: false, sidebar: '["resumen_empresa","colaboradores","aportaciones","certificados_equipo","facturacion","perfil_empresa"]' },
      { key: 'empresa_rh', name: 'Representante RH', desc: 'Usuario de empresa que gestiona colaboradores', lgsc: 'no_aplica', color: '#EC4899', icon: 'Users', courses: false, create: false, admin: false, partner: false, director: false, empresa: true, coop: false, sidebar: '["resumen_empresa","colaboradores","certificados_equipo","perfil"]' },
      { key: 'admin', name: 'Administrador', desc: 'Equipo interno de Ceduverse', lgsc: 'produccion', color: '#F97316', icon: 'Shield', courses: true, create: false, admin: true, partner: false, director: false, empresa: false, coop: true, sidebar: '{"items":["dashboard_admin","usuarios","empresas","cursos_admin","certificados_admin","pagos","comisiones_crm","prospectos_denue","soporte","perfil"],"adminTabs":["overview","usuarios","empresas","cursos","certificados","instructores","pagos","facturacion","dispersion","comisiones-crm","denue","blog","newsletter","seguros","memberships","documentos-legales","soporte","configuracion"]}' },
      { key: 'superadmin', name: 'Superadministrador', desc: 'Control total de la plataforma', lgsc: 'produccion', color: '#DC2626', icon: 'KeyRound', courses: true, create: true, admin: true, partner: true, director: true, empresa: true, coop: true, sidebar: '{"items":["dashboard_admin","usuarios","empresas","roles","cursos_admin","certificados_admin","pagos","dispersiones","comisiones_crm","prospectos_denue","documentos_legales","configuracion","logs","soporte","perfil"],"adminTabs":["overview","usuarios","empresas","cursos","certificados","instructores","pagos","facturacion","dispersion","comisiones-crm","denue","blog","newsletter","api-externa","roles","logs","seguros","memberships","documentos-legales","soporte","configuracion"]}' },
    ];

    for (const r of roleDefsData) {
      await db.execute(sql`
        INSERT INTO role_definitions (role_key, display_name, description, lgsc_type, badge_color, badge_icon, can_view_courses, can_create_courses, can_view_admin, can_view_partner, can_view_director, can_view_empresa, is_cooperative_member, sidebar_config)
        VALUES (${r.key}, ${r.name}, ${r.desc}, ${r.lgsc}, ${r.color}, ${r.icon}, ${r.courses}, ${r.create}, ${r.admin}, ${r.partner}, ${r.director}, ${r.empresa}, ${r.coop}, ${r.sidebar}::jsonb)
        ON CONFLICT (role_key) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          description = EXCLUDED.description,
          lgsc_type = EXCLUDED.lgsc_type,
          badge_color = EXCLUDED.badge_color,
          badge_icon = EXCLUDED.badge_icon,
          can_view_courses = EXCLUDED.can_view_courses,
          can_create_courses = EXCLUDED.can_create_courses,
          can_view_admin = EXCLUDED.can_view_admin,
          can_view_partner = EXCLUDED.can_view_partner,
          can_view_director = EXCLUDED.can_view_director,
          can_view_empresa = EXCLUDED.can_view_empresa,
          is_cooperative_member = EXCLUDED.is_cooperative_member,
          sidebar_config = EXCLUDED.sidebar_config
      `);
    }

    const { rows: updated } = await db.execute(sql`SELECT count(*) as c FROM accounts WHERE user_role IN ('socio_estudiante','socio_instructor','socio_comercial','admin','superadmin')`);
    console.log(`[seed] Role migration complete — ${(updated[0] as any)?.c || 0} accounts on new roles`);
  } catch (err: any) {
    console.error("[seed] Role migration error:", err.message);
  }
}

export async function seedSuperadmin() {
  const SUPERADMIN_EMAIL = "coordinador@ceduverse.org";
  const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD;
  if (!SUPERADMIN_PASSWORD) {
    console.log(`[seed] SUPERADMIN_PASSWORD not set — skipping superadmin creation`);
    return;
  }

  const existing = await db.select().from(users).where(eq(users.email, SUPERADMIN_EMAIL));
  if (existing.length > 0) {
    await db.update(accounts)
      .set({ userRole: "superadmin", accountType: "admin", accountSetup: 4, updatedAt: new Date() })
      .where(eq(accounts.id, existing[0].id));
    console.log(`[seed] Superadmin already exists, role confirmed`);
    return;
  }

  const superadminId = crypto.randomUUID();
  const bcrypt = await import("bcryptjs");
  const hashedPassword = await bcrypt.default.hash(SUPERADMIN_PASSWORD, 10);

  await db.insert(users).values({
    id: superadminId,
    email: SUPERADMIN_EMAIL,
    password: hashedPassword,
  });

  await db.insert(accounts).values({
    id: superadminId,
    accountType: "admin",
    userRole: "superadmin",
    accountSetup: 4,
    referralCode: `SA-${Date.now().toString(36).toUpperCase()}`,
  });

  await db.insert(profiles).values({
    id: superadminId,
    fullName: "Coordinador Ceduverse",
  });

  console.log(`[seed] Superadmin created: ${SUPERADMIN_EMAIL}`);
}

const INSTRUCTOR_ACCOUNTS: { email: string; code: string; fullName: string }[] = [
  { email: "yuridiaiturriaga@ceduverse.org", code: "YI", fullName: "Psic. Yuridia Iturriaga" },
  { email: "jorgemedina@ceduverse.org", code: "MC", fullName: "Lic. Jorge Armando Medina Castillo" },
];

export async function seedInstructorCourses() {
  for (const { email, code, fullName } of INSTRUCTOR_ACCOUNTS) {
    let [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      const id = crypto.randomUUID();
      [user] = await db.insert(users).values({ id, email }).returning();
      await db.insert(accounts).values({
        id,
        accountType: "free",
        userRole: "socio_instructor",
        isInstructor: true,
        accountSetup: 4,
        referralCode: `INS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      });
      await db.insert(profiles).values({ id, fullName });
      console.log(`[seed] Created instructor account: ${email}`);
    }

    await db.update(accounts)
      .set({ userRole: "socio_instructor", isInstructor: true })
      .where(eq(accounts.id, user.id));

    await db.update(courses)
      .set({ instructorId: user.id })
      .where(eq(courses.instructorId, code));

    const linked = await db.select({ count: sql<number>`count(*)` })
      .from(courses).where(eq(courses.instructorId, user.id));

    console.log(`[seed] Instructor ${email}: ${linked[0].count} courses linked (instructorId = users.id)`);
  }
}

export async function seedBlogPosts() {
  const existing = await db.select({ count: sql<number>`count(*)` }).from(blogPosts);
  if (Number(existing[0].count) > 0) {
    console.log("[seed] Blog posts already exist, skipping");
    return;
  }

  const posts = [
    {
      title: "NOM-035 en 2026: Lo que toda empresa debe saber",
      slug: "nom-035-2026-guia-empresas",
      contentHtml: `<h2>¿Qué es la NOM-035-STPS-2018?</h2><p>La Norma Oficial Mexicana 035 establece los elementos para identificar, analizar y prevenir los factores de riesgo psicosocial en el trabajo. En 2026 las multas por incumplimiento pueden superar los $500,000 MXN.</p><h2>Obligaciones del patrón</h2><p>Toda empresa con más de 15 trabajadores debe aplicar cuestionarios, implementar políticas de prevención, y capacitar a sus colaboradores. Con Ceduverse, tus equipos completan la capacitación obligatoria 100% en línea con constancia DC-3.</p><h2>¿Cómo cumplir fácilmente?</h2><p>Nuestra plataforma de Aula Virtual incluye el curso completo de NOM-035 con audio profesional, evaluación automática y constancia digital válida ante la STPS.</p>`,
      contentText: "La NOM-035 establece los elementos para identificar y prevenir factores de riesgo psicosocial. En 2026 las multas superan $500,000 MXN. Toda empresa con más de 15 trabajadores debe capacitar a sus colaboradores.",
      excerpt: "Guía actualizada sobre la NOM-035-STPS-2018: obligaciones, multas y cómo capacitar a tu equipo con constancias DC-3 válidas.",
      category: "stps",
      status: "published",
      blogViews: 342,
      targetSectors: ["Manufactura", "Servicios", "Comercio"],
      seoKeywords: ["nom-035", "stps", "riesgo psicosocial", "multas", "capacitación"],
      publishedAt: new Date("2026-02-15"),
    },
    {
      title: "Deducción fiscal al 100% por capacitación: Guía completa",
      slug: "deduccion-fiscal-capacitacion-empresas",
      contentHtml: `<h2>Beneficio fiscal por capacitar</h2><p>La Ley del ISR permite a las empresas deducir al 100% los gastos en capacitación de sus trabajadores. Esto incluye cursos en línea, constancias DC-3 y programas de formación continua.</p><h2>Requisitos para deducir</h2><p>Para que el gasto sea deducible necesitas: factura CFDI con complemento de educación, constancia de participación del trabajador, y que la capacitación esté relacionada con las actividades de la empresa.</p><h2>Ceduverse te factura</h2><p>Todos nuestros planes empresariales incluyen factura CFDI automática. Además, cada curso genera constancias DC-3 válidas que respaldan tu deducción ante el SAT.</p>`,
      contentText: "La Ley del ISR permite deducir al 100% gastos en capacitación. Necesitas factura CFDI y constancias DC-3. Ceduverse genera ambos automáticamente.",
      excerpt: "Aprende cómo deducir al 100% la inversión en capacitación de tu empresa con factura CFDI y constancias DC-3.",
      category: "fiscal",
      status: "published",
      blogViews: 218,
      targetSectors: ["Todas"],
      seoKeywords: ["deducción fiscal", "capacitación", "ISR", "CFDI", "DC-3"],
      publishedAt: new Date("2026-01-20"),
    },
    {
      title: "Cómo la IA está transformando la capacitación empresarial",
      slug: "ia-transformando-capacitacion-empresarial",
      contentHtml: `<h2>El futuro de la formación</h2><p>La inteligencia artificial permite crear experiencias de aprendizaje personalizadas que se adaptan al ritmo y nivel de cada colaborador.</p><h2>Tutor IA de Ceduverse</h2><p>Nuestro módulo Tutor IA utiliza modelos de lenguaje avanzados para generar cursos personalizados, resolver dudas en tiempo real y crear evaluaciones adaptativas.</p><h2>Resultados medibles</h2><p>Las empresas que implementan IA en sus programas de capacitación reportan un 40% más de retención de conocimiento y un 60% de reducción en tiempo de formación.</p>`,
      contentText: "La IA permite capacitación personalizada. El Tutor IA de Ceduverse genera cursos, resuelve dudas y crea evaluaciones adaptativas con resultados medibles.",
      excerpt: "Descubre cómo la inteligencia artificial está revolucionando la formación empresarial con cursos personalizados y evaluaciones adaptativas.",
      category: "ia",
      status: "published",
      blogViews: 156,
      targetSectors: ["Tecnología", "Servicios", "Manufactura"],
      seoKeywords: ["inteligencia artificial", "capacitación", "tutor IA", "e-learning"],
      publishedAt: new Date("2026-03-01"),
    },
    {
      title: "5 cursos gratuitos que tu empresa necesita en 2026",
      slug: "cursos-gratuitos-empresa-2026",
      contentHtml: `<h2>Capacitación obligatoria sin costo</h2><p>Ceduverse ofrece cursos 100% gratuitos en temas obligatorios de la STPS que toda empresa debe cubrir.</p><h2>Los 5 cursos esenciales</h2><ol><li><strong>NOM-035:</strong> Riesgo psicosocial en el trabajo</li><li><strong>NOM-019:</strong> Comisiones de seguridad e higiene</li><li><strong>NOM-030:</strong> Servicios preventivos de seguridad</li><li><strong>Igualdad laboral:</strong> NMX-R-025 y perspectiva de género</li><li><strong>Protección civil:</strong> Brigadas y planes de emergencia</li></ol><h2>Constancias DC-3 incluidas</h2><p>Cada curso completado genera una constancia DC-3 digital válida ante la STPS, sin costo adicional para planes empresariales.</p>`,
      contentText: "Ceduverse ofrece cursos gratuitos obligatorios STPS: NOM-035, NOM-019, NOM-030, igualdad laboral y protección civil. Todos con constancia DC-3.",
      excerpt: "Conoce los 5 cursos gratuitos obligatorios que toda empresa mexicana debe ofrecer a sus trabajadores en 2026.",
      category: "cursos",
      status: "published",
      blogViews: 89,
      targetSectors: ["Todas"],
      seoKeywords: ["cursos gratuitos", "STPS", "capacitación obligatoria", "DC-3", "NOM"],
      publishedAt: new Date("2026-03-10"),
    },
    {
      title: "Caso de éxito: Grupo Industrial Monterrey redujo multas un 95%",
      slug: "caso-exito-grupo-industrial-monterrey",
      contentHtml: `<h2>El reto</h2><p>Grupo Industrial Monterrey, con 450 empleados en 3 plantas, enfrentaba multas recurrentes por incumplimiento de normas STPS superiores a $1.2 millones anuales.</p><h2>La solución</h2><p>Implementaron Ceduverse para capacitar al 100% de su plantilla en las normas obligatorias. En 60 días, todos los trabajadores completaron los cursos de NOM-035, NOM-019 y protección civil.</p><h2>Resultados</h2><ul><li>95% de reducción en multas STPS</li><li>100% de cumplimiento en auditorías</li><li>ROI de 8x sobre la inversión en capacitación</li><li>Deducción fiscal completa de la inversión</li></ul>`,
      contentText: "Grupo Industrial Monterrey capacitó a 450 empleados con Ceduverse. Redujeron multas STPS un 95% y lograron 100% cumplimiento en auditorías.",
      excerpt: "Cómo una empresa de manufactura con 450 empleados eliminó casi todas sus multas STPS capacitando con Ceduverse.",
      category: "casos",
      status: "published",
      blogViews: 275,
      targetSectors: ["Manufactura", "Industrial"],
      seoKeywords: ["caso de éxito", "multas STPS", "cumplimiento", "capacitación industrial"],
      publishedAt: new Date("2026-02-28"),
    },
    {
      title: "Guía 2026: Constancias DC-3 digitales y su validez legal",
      slug: "guia-constancias-dc3-digitales-2026",
      contentHtml: `<h2>¿Qué es la constancia DC-3?</h2><p>La constancia DC-3 es el documento oficial que acredita que un trabajador recibió capacitación. Es obligatoria para cumplir con la Ley Federal del Trabajo y las normas de la STPS.</p><h2>Formato digital en 2026</h2><p>A partir de las reformas recientes, la STPS acepta constancias DC-3 en formato digital siempre que cumplan con los requisitos de identificación del trabajador, contenido temático y firma del instructor.</p><h2>Ventajas de la constancia digital</h2><ul><li>Almacenamiento seguro en la nube</li><li>Verificación instantánea ante auditorías</li><li>Integración con sistemas de nómina</li><li>Reducción de papel y archivo físico</li></ul>`,
      contentText: "La constancia DC-3 digital es válida ante la STPS. Ceduverse genera constancias automáticas con todos los requisitos legales.",
      excerpt: "Todo sobre las constancias DC-3 digitales: validez legal, requisitos y cómo generarlas automáticamente con Ceduverse.",
      category: "stps",
      status: "draft",
      blogViews: 0,
      targetSectors: ["Todas"],
      seoKeywords: ["DC-3", "constancia digital", "STPS", "capacitación", "validez legal"],
      publishedAt: null,
    },
  ];

  for (const post of posts) {
    await db.insert(blogPosts).values(post as any);
  }
  console.log(`[seed] Inserted ${posts.length} blog posts`);
}

export async function seedSocioProfile() {
  const [socioUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "demosocio@ceduverse.org"));
  if (!socioUser) return;

  const [acct] = await db
    .select({ userRole: accounts.userRole })
    .from(accounts)
    .where(eq(accounts.id, socioUser.id));
  if (acct && acct.userRole !== "socio_comercial" && acct.userRole !== "partner") {
    await db.update(accounts).set({ userRole: "socio_comercial" }).where(eq(accounts.id, socioUser.id));
    console.log("[seed] Demo socio role set to socio_comercial");
  } else if (!acct) {
    await db.insert(accounts).values({ id: socioUser.id, userRole: "socio_comercial" });
    console.log("[seed] Demo socio account created with socio_comercial role");
  }

  const existingProfile = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.id, socioUser.id))
    .limit(1);

  if (existingProfile.length > 0) {
    await db
      .update(profiles)
      .set({ socioZone: "Norte", socioType: "consultor" })
      .where(eq(profiles.id, socioUser.id));
  } else {
    await db.insert(profiles).values({
      id: socioUser.id,
      fullName: "Demo Socio",
      socioZone: "Norte",
      socioType: "consultor",
    });
  }
  console.log("[seed] Demo socio profile updated: zone=Norte, type=consultor");

  const existing = await db
    .select({ id: empresasProspectos.id })
    .from(empresasProspectos)
    .where(eq(empresasProspectos.partnerId, socioUser.id))
    .limit(1);

  if (existing.length > 0) {
    console.log("[seed] Demo socio pipeline prospects already exist, skipping");
    return;
  }

  const seedProspects = [
    { nombreComercial: "Aceros del Norte SA de CV", razonSocial: "Aceros del Norte SA de CV", actividadEconomica: "Fabricación de productos metálicos", grupoSector: "Manufactura", municipio: "Monterrey", estado: "Nuevo León", empleadosEstimados: 85, potencialAportacionMensual: 96122, leadScore: 82, prioridad: "alta", nivelRiesgo: "bajo", planRecomendado: "Transforma", stage: "cliente" as const, telefono: "8112345678", correoElectronico: "rh@aceronorte.mx" },
    { nombreComercial: "Logística Tamaulipas Express", razonSocial: "Logística Tamaulipas Express SA de CV", actividadEconomica: "Transporte de carga", grupoSector: "Transporte y logística", municipio: "Reynosa", estado: "Tamaulipas", empleadosEstimados: 42, potencialAportacionMensual: 47520, leadScore: 75, prioridad: "alta", nivelRiesgo: "medio", planRecomendado: "Transforma", stage: "cliente" as const, telefono: "8991234567" },
    { nombreComercial: "Plásticos Industriales Coahuila", razonSocial: "Plásticos Industriales Coahuila SA de CV", actividadEconomica: "Fabricación de productos plásticos", grupoSector: "Manufactura", municipio: "Saltillo", estado: "Coahuila de Zaragoza", empleadosEstimados: 60, potencialAportacionMensual: 67884, leadScore: 70, prioridad: "media", nivelRiesgo: "bajo", planRecomendado: "Transforma", stage: "negociacion" as const },
    { nombreComercial: "Alimentos Regios del Norte", razonSocial: "Alimentos Regios del Norte SA de CV", actividadEconomica: "Elaboración de alimentos", grupoSector: "Alimentos y bebidas", municipio: "San Nicolás de los Garza", estado: "Nuevo León", empleadosEstimados: 35, potencialAportacionMensual: 39599, leadScore: 65, prioridad: "media", nivelRiesgo: "bajo", planRecomendado: "Transforma", stage: "demo" as const, correoElectronico: "contacto@alimentosregios.mx" },
    { nombreComercial: "Servicios Eléctricos Durango", razonSocial: "Servicios Eléctricos Durango SA de CV", actividadEconomica: "Instalaciones eléctricas", grupoSector: "Construcción", municipio: "Durango", estado: "Durango", empleadosEstimados: 28, potencialAportacionMensual: 31671, leadScore: 60, prioridad: "media", nivelRiesgo: "medio", planRecomendado: "Transforma", stage: "contactado" as const, telefono: "6181234567" },
  ];

  for (const prospect of seedProspects) {
    const [inserted] = await db.insert(empresasProspectos).values({
      ...prospect,
      partnerId: socioUser.id,
      zonaComercial: "Norte",
    }).returning({ id: empresasProspectos.id });

    if (inserted) {
      const interactions = [];
      if (prospect.stage === "cliente") {
        interactions.push({ tipo: "cambio_etapa", notas: "Contrato firmado, bienvenido al programa Ceduverse" });
        interactions.push({ tipo: "llamada", notas: "Kickoff con RH, agendar diagnóstico inicial" });
      } else if (prospect.stage === "negociacion") {
        interactions.push({ tipo: "propuesta", notas: "Propuesta Plan Transforma enviada por correo" });
        interactions.push({ tipo: "reunion", notas: "Presentación presencial con Director de RH" });
      } else if (prospect.stage === "demo") {
        interactions.push({ tipo: "reunion", notas: "Demo de plataforma Ceduverse completada" });
      } else if (prospect.stage === "contactado") {
        interactions.push({ tipo: "llamada", notas: "Primer contacto, interesados en capacitación NOM-035" });
      }
      for (const interaction of interactions) {
        await db.insert(interaccionesProspectos).values({
          empresaId: inserted.id,
          userId: socioUser.id,
          ...interaction,
        });
      }
    }
  }
  console.log("[seed] Inserted 5 demo pipeline prospects with interactions");
}

export async function seedGlobalConfig() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS global_config (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      label TEXT NOT NULL,
      description TEXT,
      value_type TEXT NOT NULL DEFAULT 'string',
      updated_by UUID REFERENCES users(id),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const configs = [
    { key: "feature_digital_twin", value: true, category: "features", label: "Gemelo Digital (HeyGen)", description: "Habilitar el módulo de Gemelo Digital con HeyGen", valueType: "boolean" },
    { key: "feature_live_avatar", value: true, category: "features", label: "LiveAvatar & Sesiones Privadas", description: "Habilitar sesiones de LiveAvatar y sesiones privadas", valueType: "boolean" },
    { key: "feature_firma_digital", value: true, category: "features", label: "Firma Digital / vCard", description: "Habilitar firma digital y tarjetas de contacto", valueType: "boolean" },
    { key: "feature_kit_cooperativo", value: true, category: "features", label: "Kit Cooperativo", description: "Habilitar el módulo de Kit Cooperativo", valueType: "boolean" },
    { key: "feature_cfdi", value: true, category: "features", label: "Facturación CFDI", description: "Habilitar el módulo de facturación CFDI", valueType: "boolean" },
    { key: "feature_crm", value: true, category: "features", label: "CRM Comercial", description: "Habilitar el CRM para socios comerciales", valueType: "boolean" },
    { key: "feature_sam", value: false, category: "features", label: "Sistema SAM", description: "Habilitar el Sistema de Alertas y Monitoreo", valueType: "boolean" },
    { key: "feature_wallet_web3", value: true, category: "features", label: "Wallet Web3", description: "Habilitar wallet Web3 y funcionalidades blockchain", valueType: "boolean" },
    { key: "feature_denue", value: true, category: "features", label: "Directorio DENUE", description: "Habilitar consulta de directorio DENUE/INEGI", valueType: "boolean" },
    { key: "feature_api_externa", value: true, category: "features", label: "API Externa", description: "Habilitar la API externa (MeCorrieron.mx)", valueType: "boolean" },
    { key: "feature_tutor_ia", value: true, category: "features", label: "Tutor IA", description: "Habilitar el Tutor IA para estudiantes", valueType: "boolean" },
    { key: "feature_academy", value: true, category: "features", label: "Academy (cursos externos)", description: "Habilitar integración con Academy/cursos externos", valueType: "boolean" },
    { key: "feature_nft_certs", value: true, category: "features", label: "Certificados NFT", description: "Habilitar emisión de certificados como NFT en blockchain", valueType: "boolean" },
    { key: "feature_qr_stickers", value: true, category: "features", label: "QR / Stickers", description: "Habilitar generación de códigos QR y stickers", valueType: "boolean" },
    { key: "feature_cfdi_auto", value: false, category: "features", label: "CFDI Automático", description: "Generar CFDI automáticamente al confirmar pago", valueType: "boolean" },
    { key: "feature_open_registration", value: true, category: "features", label: "Registro abierto", description: "Permitir registro público de nuevos usuarios", valueType: "boolean" },
    { key: "platform_name", value: "Ceduverse", category: "platform", label: "Nombre de la plataforma", description: "Nombre visible de la plataforma", valueType: "string" },
    { key: "platform_uma_value", value: 113.14, category: "platform", label: "Valor UMA (MXN)", description: "Valor actual de la Unidad de Medida y Actualización", valueType: "number" },
    { key: "platform_max_team_members", value: 50, category: "platform", label: "Máximo miembros por equipo", description: "Límite de miembros por organización", valueType: "number" },
    { key: "platform_cert_fee", value: 350, category: "platform", label: "Costo certificación (MXN)", description: "Costo base por certificado DC-3/STPS", valueType: "number" },
    { key: "platform_default_plan", value: "impulsa", category: "platform", label: "Plan por defecto", description: "Plan asignado a nuevas organizaciones", valueType: "string" },
    { key: "platform_support_email", value: "soporte@ceduverse.org", category: "platform", label: "Email de soporte", description: "Correo electrónico de contacto para soporte", valueType: "string" },
    { key: "platform_maintenance_mode", value: false, category: "platform", label: "Modo mantenimiento", description: "Activar modo mantenimiento en la plataforma", valueType: "boolean" },
    { key: "platform_fee_instructor_pct", value: 70, category: "platform", label: "% Instructor", description: "Porcentaje de ingresos para el instructor", valueType: "number" },
    { key: "platform_fee_platform_pct", value: 20, category: "platform", label: "% Plataforma", description: "Porcentaje de ingresos para la plataforma", valueType: "number" },
    { key: "platform_fee_cooperative_pct", value: 10, category: "platform", label: "% Cooperativa", description: "Porcentaje de ingresos para el fondo cooperativo", valueType: "number" },
    { key: "platform_cooperative_legal_name", value: "Cooperativa Ceduverse S.C. de R.L.", category: "platform", label: "Razón social cooperativa", description: "Razón social legal de la cooperativa", valueType: "string" },
    { key: "platform_cooperative_rfc", value: "", category: "platform", label: "RFC Cooperativa", description: "RFC de la cooperativa", valueType: "string" },
    { key: "notification_new_user", value: true, category: "notifications", label: "Notificar registro nuevo", description: "Enviar notificación cuando se registra un nuevo usuario", valueType: "boolean" },
    { key: "notification_cert_request", value: true, category: "notifications", label: "Notificar solicitud de certificado", description: "Notificar al admin cuando se solicita un certificado", valueType: "boolean" },
    { key: "notification_payment_overdue", value: true, category: "notifications", label: "Alerta pago vencido", description: "Alertar cuando un pago se marca como vencido", valueType: "boolean" },
  ];

  let inserted = 0;
  for (const c of configs) {
    const result = await db.insert(globalConfig).values(c).onConflictDoNothing().returning();
    if (result.length > 0) inserted++;
  }
  if (inserted > 0) {
    console.log(`[seed] Global config: ${inserted} new entries added`);
  } else {
    console.log("[seed] Global config already seeded, skipping");
  }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS sat_oficinas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      estado TEXT NOT NULL,
      municipio TEXT,
      nombre TEXT NOT NULL,
      latitud DOUBLE PRECISION NOT NULL,
      longitud DOUBLE PRECISION NOT NULL
    )
  `);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_sat_oficinas_estado ON sat_oficinas (estado)`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_sat_oficinas_municipio ON sat_oficinas (municipio)`);

  const satOficinaCountResult = await db.execute(sql`SELECT COUNT(*) as c FROM sat_oficinas`);
  const satOficinaRows = (satOficinaCountResult as any).rows || [];
  if (satOficinaRows.length === 0 || parseInt(satOficinaRows[0].c) === 0) {
    const oficinas = [
      { estado: "Aguascalientes", municipio: "Aguascalientes", nombre: "SAT Aguascalientes", lat: 21.8818, lng: -102.2916 },
      { estado: "Baja California", municipio: "Tijuana", nombre: "SAT Tijuana", lat: 32.5149, lng: -117.0382 },
      { estado: "Baja California", municipio: "Mexicali", nombre: "SAT Mexicali", lat: 32.6245, lng: -115.4523 },
      { estado: "Baja California Sur", municipio: "La Paz", nombre: "SAT La Paz", lat: 24.1426, lng: -110.3128 },
      { estado: "Campeche", municipio: "Campeche", nombre: "SAT Campeche", lat: 19.8301, lng: -90.5349 },
      { estado: "Chiapas", municipio: "Tuxtla Gutiérrez", nombre: "SAT Tuxtla Gutiérrez", lat: 16.7516, lng: -93.1152 },
      { estado: "Chihuahua", municipio: "Chihuahua", nombre: "SAT Chihuahua", lat: 28.6353, lng: -106.0889 },
      { estado: "Chihuahua", municipio: "Ciudad Juárez", nombre: "SAT Ciudad Juárez", lat: 31.6904, lng: -106.4245 },
      { estado: "Ciudad de México", municipio: "Ciudad de México", nombre: "SAT CDMX Centro", lat: 19.4326, lng: -99.1332 },
      { estado: "Coahuila de Zaragoza", municipio: "Saltillo", nombre: "SAT Saltillo", lat: 25.4232, lng: -100.9924 },
      { estado: "Coahuila de Zaragoza", municipio: "Torreón", nombre: "SAT Torreón", lat: 25.5428, lng: -103.4068 },
      { estado: "Colima", municipio: "Colima", nombre: "SAT Colima", lat: 19.2433, lng: -103.7250 },
      { estado: "Durango", municipio: "Durango", nombre: "SAT Durango", lat: 24.0277, lng: -104.6532 },
      { estado: "Guanajuato", municipio: "León", nombre: "SAT León", lat: 21.1250, lng: -101.6859 },
      { estado: "Guerrero", municipio: "Chilpancingo de los Bravo", nombre: "SAT Chilpancingo", lat: 17.5506, lng: -99.5024 },
      { estado: "Hidalgo", municipio: "Pachuca de Soto", nombre: "SAT Pachuca", lat: 20.1011, lng: -98.7591 },
      { estado: "Jalisco", municipio: "Guadalajara", nombre: "SAT Guadalajara", lat: 20.6597, lng: -103.3496 },
      { estado: "México", municipio: "Toluca", nombre: "SAT Toluca", lat: 19.2826, lng: -99.6557 },
      { estado: "Michoacán de Ocampo", municipio: "Morelia", nombre: "SAT Morelia", lat: 19.7060, lng: -101.1950 },
      { estado: "Morelos", municipio: "Cuernavaca", nombre: "SAT Cuernavaca", lat: 18.9242, lng: -99.2216 },
      { estado: "Nayarit", municipio: "Tepic", nombre: "SAT Tepic", lat: 21.5069, lng: -104.8946 },
      { estado: "Nuevo León", municipio: "Monterrey", nombre: "SAT Monterrey", lat: 25.6866, lng: -100.3161 },
      { estado: "Oaxaca", municipio: "Oaxaca de Juárez", nombre: "SAT Oaxaca", lat: 17.0732, lng: -96.7266 },
      { estado: "Puebla", municipio: "Puebla", nombre: "SAT Puebla", lat: 19.0414, lng: -98.2063 },
      { estado: "Querétaro", municipio: "Querétaro", nombre: "SAT Querétaro", lat: 20.5888, lng: -100.3899 },
      { estado: "Quintana Roo", municipio: "Cancún", nombre: "SAT Cancún", lat: 21.1619, lng: -86.8515 },
      { estado: "San Luis Potosí", municipio: "San Luis Potosí", nombre: "SAT San Luis Potosí", lat: 22.1565, lng: -100.9855 },
      { estado: "Sinaloa", municipio: "Culiacán", nombre: "SAT Culiacán", lat: 24.8049, lng: -107.3940 },
      { estado: "Sonora", municipio: "Hermosillo", nombre: "SAT Hermosillo", lat: 29.0729, lng: -110.9559 },
      { estado: "Tabasco", municipio: "Villahermosa", nombre: "SAT Villahermosa", lat: 17.9892, lng: -92.9475 },
      { estado: "Tamaulipas", municipio: "Ciudad Victoria", nombre: "SAT Ciudad Victoria", lat: 23.7369, lng: -99.1411 },
      { estado: "Tamaulipas", municipio: "Reynosa", nombre: "SAT Reynosa", lat: 26.0922, lng: -98.2778 },
      { estado: "Tlaxcala", municipio: "Tlaxcala", nombre: "SAT Tlaxcala", lat: 19.3182, lng: -98.2375 },
      { estado: "Veracruz de Ignacio de la Llave", municipio: "Xalapa", nombre: "SAT Xalapa", lat: 19.5438, lng: -96.9102 },
      { estado: "Veracruz de Ignacio de la Llave", municipio: "Veracruz", nombre: "SAT Veracruz", lat: 19.1738, lng: -96.1342 },
      { estado: "Yucatán", municipio: "Mérida", nombre: "SAT Mérida", lat: 20.9674, lng: -89.5926 },
      { estado: "Zacatecas", municipio: "Zacatecas", nombre: "SAT Zacatecas", lat: 22.7709, lng: -102.5832 },
    ];
    for (const o of oficinas) {
      await db.execute(sql`INSERT INTO sat_oficinas (estado, municipio, nombre, latitud, longitud) VALUES (${o.estado}, ${o.municipio}, ${o.nombre}, ${o.lat}, ${o.lng})`);
    }
    console.log(`[seed] SAT oficinas: ${oficinas.length} offices seeded`);
  } else {
    console.log("[seed] SAT oficinas already seeded, skipping");
  }
}
