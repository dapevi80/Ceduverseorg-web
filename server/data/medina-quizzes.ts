// ═══════════════════════════════════════════════════════════
// QUIZZES — CURSOS LIC. JORGE ARMANDO MEDINA CASTILLO (16)
// Formato TypeScript para Replit / Ceduverse
// ═══════════════════════════════════════════════════════════

export const medinaQuizzes: Record<string, any> = {

"prevencion-riesgos-laborales": {
  title: "Evaluación: Prevención de Riesgos Laborales",
  passingScore: 70,
  questions: [
    { question: "¿Qué artículo de la Constitución establece el derecho a condiciones seguras de trabajo?", options: ["Artículo 3", "Artículo 27", "Artículo 123", "Artículo 130"], correctIndex: 2, explanation: "El Art. 123 constitucional establece que todo trabajador tiene derecho a condiciones dignas y seguras de trabajo." },
    { question: "La diferencia entre 'peligro' y 'riesgo' es:", options: ["Son lo mismo", "El peligro es la fuente potencial de daño; el riesgo es la probabilidad de que cause daño", "El riesgo es más grave que el peligro", "El peligro solo aplica a máquinas"], correctIndex: 1, explanation: "Peligro es la fuente/situación con potencial de causar daño. Riesgo combina la probabilidad de que ocurra con la severidad del daño." },
    { question: "En la jerarquía de controles, ¿cuál es el MÁS efectivo?", options: ["EPP", "Controles administrativos", "Eliminación del peligro", "Señalización"], correctIndex: 2, explanation: "La eliminación es el control más efectivo. El EPP es el último recurso, no el primero." },
    { question: "La pirámide de Bird establece que por cada accidente grave hay aproximadamente:", options: ["10 casi-accidentes", "100 casi-accidentes", "600 casi-accidentes", "1,000 casi-accidentes"], correctIndex: 2, explanation: "Bird encontró que por cada accidente grave hay 10 leves, 30 daños materiales y 600 casi-accidentes. Atender los casi-accidentes previene lo grave." },
    { question: "Un 'acto inseguro' es:", options: ["Una condición del ambiente que genera riesgo", "Una conducta del trabajador que lo pone en peligro", "Un defecto de la maquinaria", "Una falla del sistema eléctrico"], correctIndex: 1, explanation: "El acto inseguro es la conducta del trabajador (ej: no usar EPP, operar equipo sin autorización). La condición insegura es del ambiente." },
    { question: "El objetivo de investigar un accidente es:", options: ["Sancionar al culpable", "Encontrar las causas para evitar que se repita", "Llenar el formato de la STPS", "Reducir los costos del seguro"], correctIndex: 1, explanation: "Investigar para prevenir, no para culpar. Buscar causas raíz genera prevención; buscar culpables genera ocultamiento." },
    { question: "Los indicadores proactivos de seguridad incluyen:", options: ["Tasa de accidentes y días perdidos", "Inspecciones realizadas, capacitaciones y casi-accidentes reportados", "Costo de indemnizaciones", "Número de demandas laborales"], correctIndex: 1, explanation: "Los indicadores proactivos miden las acciones de prevención (inspecciones, capacitaciones, reportes), no las consecuencias." }
  ]
},

"equipo-proteccion-personal": {
  title: "Evaluación: Equipo de Protección Personal",
  passingScore: 70,
  questions: [
    { question: "Según la NOM-017-STPS, ¿quién debe pagar el EPP?", options: ["El trabajador", "El sindicato", "El patrón, sin costo para el trabajador", "Se comparte 50/50"], correctIndex: 2, explanation: "La NOM-017 establece que el patrón debe proporcionar EPP sin costo para el trabajador." },
    { question: "El EPP se selecciona basándose en:", options: ["Lo que sea más barato", "Un análisis de riesgos por puesto de trabajo", "Lo que usan otras empresas", "La opinión del trabajador"], correctIndex: 1, explanation: "La selección debe basarse en un análisis de riesgos específico por puesto — cada riesgo requiere su protección particular." },
    { question: "¿Qué tipo de guantes se usa para riesgo eléctrico?", options: ["Guantes de látex", "Guantes de cuero", "Guantes dieléctricos clasificados por voltaje", "Guantes de nitrilo"], correctIndex: 2, explanation: "Los guantes dieléctricos se clasifican por clase (00 a 4) según el voltaje máximo que soportan. Deben probarse antes de cada uso." },
    { question: "Un casco de seguridad debe reemplazarse:", options: ["Solo si se rompe", "Al primer golpe fuerte, grieta o según vida útil del fabricante", "Cada 10 años", "Nunca, son permanentes"], correctIndex: 1, explanation: "Reemplazar al primer golpe significativo, grieta visible o según la vida útil indicada por el fabricante (generalmente 2-5 años)." },
    { question: "¿Por qué una selección incorrecta de EPP puede ser más peligrosa que no usar nada?", options: ["Porque cuesta dinero", "Porque da una falsa sensación de seguridad", "Porque incomoda al trabajador", "No es cierto, cualquier EPP es mejor que nada"], correctIndex: 1, explanation: "EPP inadecuado da falsa sensación de protección: el trabajador actúa como si estuviera protegido cuando no lo está." },
    { question: "El EPP es la _____ línea de defensa en la jerarquía de controles:", options: ["Primera", "Segunda", "Tercera", "Última"], correctIndex: 3, explanation: "El EPP es la última línea de defensa. Primero se debe intentar eliminar, sustituir, controles de ingeniería y administrativos." },
    { question: "¿Cuándo debe el trabajador inspeccionar su EPP?", options: ["Solo al recibirlo nuevo", "Una vez por semana", "Antes de cada uso", "Solo si nota algo raro"], correctIndex: 2, explanation: "La inspección debe realizarse antes de cada uso para detectar daños, desgaste o vencimiento que comprometan la protección." }
  ]
},

"operario-limpieza": {
  title: "Evaluación: Operario de Limpieza",
  passingScore: 70,
  questions: [
    { question: "El principio correcto de limpieza es:", options: ["De abajo hacia arriba", "De arriba hacia abajo, de adentro hacia afuera", "De afuera hacia adentro", "No hay un orden específico"], correctIndex: 1, explanation: "Siempre de arriba hacia abajo (la suciedad cae) y de adentro hacia afuera (empiezas al fondo, terminas en la entrada)." },
    { question: "¿Qué NUNCA se debe mezclar con cloro?", options: ["Agua", "Jabón neutro", "Amoniaco", "Detergente suave"], correctIndex: 2, explanation: "Cloro + amoniaco produce gases de cloramina tóxicos. Cloro + ácido produce gas cloro letal. NUNCA mezclar cloro con otros productos." },
    { question: "El sistema de colores en utensilios de limpieza sirve para:", options: ["Decoración", "Evitar contaminación cruzada entre áreas", "Identificar al operario responsable", "Cumplir con la moda"], correctIndex: 1, explanation: "Los códigos de color previenen contaminación cruzada: rojo (sanitarios), azul (oficinas), verde (cocina), amarillo (producción)." },
    { question: "Las Hojas de Datos de Seguridad (HDS) tienen:", options: ["4 secciones", "10 secciones", "16 secciones", "No tienen secciones"], correctIndex: 2, explanation: "Las HDS tienen 16 secciones estandarizadas que cubren toda la información de seguridad del producto químico." },
    { question: "Al limpiar un derrame químico, lo PRIMERO que debes hacer es:", options: ["Limpiarlo rápidamente con un trapo", "Alertar a las personas del área y consultar la HDS del producto", "Echar agua encima", "Ignorarlo si es pequeño"], correctIndex: 1, explanation: "Primero alertar y consultar la HDS para saber qué EPP usar y cómo manejar el producto específico derramado." },
    { question: "La señal de 'Piso mojado' debe retirarse:", options: ["Después de 5 minutos", "Solo cuando el piso esté completamente seco", "Nunca, es permanente", "Al terminar de trapear"], correctIndex: 1, explanation: "Los resbalones son la segunda causa de accidentes laborales. La señal permanece hasta que el piso está completamente seco." },
    { question: "¿Por qué nunca se deben usar envases de alimentos para almacenar químicos?", options: ["Porque es ilegal", "Porque alguien puede confundirlo y beber el producto", "Porque daña el envase", "Está permitido si se etiqueta"], correctIndex: 1, explanation: "El riesgo de ingestión accidental es real y puede ser fatal. Nunca usar envases de alimentos o bebidas para químicos." }
  ]
},

"seguridad-energia-electrica": {
  title: "Evaluación: Seguridad con Energía Eléctrica",
  passingScore: 70,
  questions: [
    { question: "Lo que mata en un shock eléctrico es:", options: ["El voltaje alto", "El amperaje (intensidad de corriente)", "La resistencia", "La frecuencia"], correctIndex: 1, explanation: "El amperaje es lo que causa daño al cuerpo. Solo 50-100 mA pueden causar fibrilación ventricular y muerte." },
    { question: "Las '5 reglas de oro' de seguridad eléctrica comienzan con:", options: ["Verificar ausencia de tensión", "Cortar todas las fuentes de tensión", "Señalizar la zona", "Poner a tierra"], correctIndex: 1, explanation: "Las 5 reglas en orden: 1) Cortar, 2) Bloquear, 3) Verificar ausencia de tensión, 4) Poner a tierra, 5) Señalizar." },
    { question: "Si una persona está siendo electrocutada, lo primero que debes hacer es:", options: ["Tocar a la persona para alejarla", "Cortar la energía desde el interruptor", "Echarle agua", "Llamar a una ambulancia y esperar"], correctIndex: 1, explanation: "NO tocar a la víctima mientras esté en contacto con la fuente. Cortar la energía primero. Si no es posible, usar material aislante." },
    { question: "¿Qué tipo de extintor se usa para incendios eléctricos (Clase C)?", options: ["Agua", "Espuma", "CO2 o PQS", "Agente húmedo"], correctIndex: 2, explanation: "CO2 y PQS no conducen electricidad. NUNCA usar agua en equipos eléctricos energizados por riesgo de electrocución." },
    { question: "La verificación de ausencia de tensión debe hacerse:", options: ["Solo con un destornillador probador", "Con un multímetro calibrado, verificando su funcionamiento antes y después de la prueba", "A simple vista", "No es necesaria si se cortó el interruptor"], correctIndex: 1, explanation: "Se debe usar equipo de medición calibrado. Verificar que el instrumento funciona ANTES y DESPUÉS de la prueba en un circuito conocido." },
    { question: "La piel húmeda es más peligrosa ante la electricidad porque:", options: ["Atrae la corriente", "Tiene menor resistencia eléctrica, permitiendo mayor flujo de corriente", "Genera más voltaje", "No hay diferencia"], correctIndex: 1, explanation: "La piel seca ofrece resistencia de ~100,000 ohms; la piel húmeda baja a ~1,000 ohms, permitiendo mucho más flujo de corriente." },
    { question: "Los guantes dieléctricos deben:", options: ["Usarse sin verificación previa", "Probarse con inflado antes de cada uso para verificar que no tienen perforaciones", "Reemplazarse cada año sin importar su estado", "Compartirse entre compañeros"], correctIndex: 1, explanation: "Antes de cada uso, inflar el guante para verificar que no tenga micro-perforaciones que permitan el paso de corriente." }
  ]
},

"brigada-contra-incendios": {
  title: "Evaluación: Brigada Contra Incendios",
  passingScore: 70,
  questions: [
    { question: "Los tres elementos del triángulo del fuego son:", options: ["Agua, aire y calor", "Combustible, oxígeno y calor", "Gasolina, chispa y viento", "Material, temperatura y presión"], correctIndex: 1, explanation: "Combustible (lo que arde), oxígeno (comburente) y calor (energía de activación) son los tres elementos necesarios para el fuego." },
    { question: "Un incendio en un tablero eléctrico energizado es Clase:", options: ["A", "B", "C", "K"], correctIndex: 2, explanation: "Clase C: equipos eléctricos energizados. Se usa CO2 o PQS. NUNCA agua mientras esté energizado." },
    { question: "En la técnica PARE, la 'A' significa:", options: ["Activa la alarma", "Apunta a la base del fuego", "Avanza rápido", "Abre el extintor"], correctIndex: 1, explanation: "A = Apunta la boquilla a la BASE del fuego, no a las llamas. Es el error más común de los principiantes." },
    { question: "¿Cuánto dura aproximadamente la descarga de un extintor portátil?", options: ["2 a 5 segundos", "8 a 25 segundos", "1 a 3 minutos", "5 a 10 minutos"], correctIndex: 1, explanation: "Entre 8 y 25 segundos según el tamaño. No hay tiempo que perder — se debe actuar con precisión y rapidez." },
    { question: "Si no puedes controlar un incendio en 60 segundos con un extintor, debes:", options: ["Buscar otro extintor", "Seguir intentando", "EVACUAR y llamar a bomberos", "Esperar a que se apague solo"], correctIndex: 2, explanation: "Si un extintor portátil no controla el fuego en 60 segundos, el incendio superó la capacidad del equipo. Evacúa y llama al 911." },
    { question: "¿Con qué frecuencia mínima deben realizarse simulacros?", options: ["Cada mes", "Al menos 2 veces al año", "Una vez al año", "Solo cuando la STPS lo pida"], correctIndex: 1, explanation: "La norma recomienda al menos 2 simulacros al año, alternando entre con aviso y sin aviso conforme madura el programa." },
    { question: "¿Por qué NUNCA se debe usar agua en un incendio de aceite de cocina (Clase K)?", options: ["El agua se evapora muy rápido", "Produce una explosión de vapor que esparce el aceite ardiendo", "El agua es muy cara", "Sí se puede usar agua"], correctIndex: 1, explanation: "El agua al contacto con aceite a alta temperatura se convierte en vapor instantáneamente, creando una explosión que esparce aceite hirviendo." }
  ]
},

"sistema-globalmente-armonizado-sga": {
  title: "Evaluación: Sistema Globalmente Armonizado (SGA)",
  passingScore: 70,
  questions: [
    { question: "El SGA fue creado para:", options: ["Vender más productos químicos", "Establecer criterios uniformes mundiales para comunicar peligros químicos", "Prohibir sustancias peligrosas", "Reemplazar las Hojas de Seguridad"], correctIndex: 1, explanation: "El SGA unifica los criterios de clasificación y comunicación de peligros químicos a nivel mundial." },
    { question: "En México, la NOM que adopta el SGA es:", options: ["NOM-017-STPS", "NOM-018-STPS-2015", "NOM-026-STPS", "NOM-035-STPS"], correctIndex: 1, explanation: "La NOM-018-STPS-2015 adopta el Sistema Globalmente Armonizado para la comunicación de peligros por sustancias químicas." },
    { question: "La palabra 'PELIGRO' en una etiqueta SGA indica:", options: ["Un producto de baja peligrosidad", "Un producto de alta peligrosidad (más severo que 'ATENCIÓN')", "Que el producto está vencido", "Que requiere refrigeración"], correctIndex: 1, explanation: "'PELIGRO' indica mayor severidad que 'ATENCIÓN'. Es la palabra de advertencia para las categorías más graves." },
    { question: "Las frases H en el SGA son:", options: ["Indicaciones de peligro que describen la naturaleza del riesgo", "Consejos de prudencia sobre cómo manejar el producto", "Nombres comerciales del producto", "Instrucciones de reciclaje"], correctIndex: 0, explanation: "Las frases H (Hazard) describen el peligro. Las frases P (Precaution) indican las medidas de precaución." },
    { question: "¿Cuántas secciones tiene una Hoja de Datos de Seguridad (HDS)?", options: ["8", "12", "16", "20"], correctIndex: 2, explanation: "La HDS tiene 16 secciones estandarizadas que cubren desde identificación hasta información de transporte y regulación." },
    { question: "En el SGA, la Categoría 1 siempre indica:", options: ["El peligro más leve", "El peligro más severo", "Un peligro moderado", "Que no hay peligro"], correctIndex: 1, explanation: "A diferencia de otros sistemas, en el SGA la Categoría 1 siempre es la más severa y va disminuyendo." },
    { question: "Al transvasar un producto químico a otro recipiente, se debe:", options: ["Solo escribir el nombre con marcador", "Etiquetar con al menos: nombre, pictogramas y palabra de advertencia", "No es necesario etiquetar si se usa el mismo día", "Pegar la etiqueta del recipiente original"], correctIndex: 1, explanation: "Todo recipiente secundario debe etiquetarse con al menos: nombre del producto, pictogramas de peligro y palabra de advertencia." }
  ]
},

"nom-035-stps-medina": {
  title: "Evaluación: NOM-035-STPS (Perspectiva Seguridad Industrial)",
  passingScore: 70,
  questions: [
    { question: "La NOM-035 es obligatoria para:", options: ["Solo empresas con más de 50 trabajadores", "Solo empresas del sector industrial", "Todos los centros de trabajo en México", "Solo empresas que hayan tenido accidentes"], correctIndex: 2, explanation: "La NOM-035 aplica a TODOS los centros de trabajo. Las obligaciones varían según el número de trabajadores." },
    { question: "¿A partir de cuántos trabajadores se debe aplicar el cuestionario de la Guía de Referencia II?", options: ["5", "16", "50", "100"], correctIndex: 1, explanation: "A partir de 16 trabajadores se debe aplicar la Guía II para identificar factores de riesgo psicosocial." },
    { question: "¿Cuántos elementos conforman el 'entorno organizacional favorable'?", options: ["4", "6", "8", "10"], correctIndex: 2, explanation: "8 elementos: sentido de pertenencia, formación, definición de responsabilidades, participación, comunicación, distribución de cargas, evaluación y reconocimiento." },
    { question: "Los resultados de los cuestionarios NOM-035 deben manejarse:", options: ["De forma pública para transparencia", "De forma agregada y confidencial", "Solo por el sindicato", "Individual y con nombre"], correctIndex: 1, explanation: "Los cuestionarios son anónimos y confidenciales. Los resultados se presentan de forma agregada, nunca individual." },
    { question: "Un nivel de riesgo 'Muy alto' (>90 puntos) requiere:", options: ["Solo monitoreo", "Acciones preventivas mínimas", "Intervención urgente y análisis profundo", "No requiere acción"], correctIndex: 2, explanation: "El nivel 'Muy alto' requiere intervención urgente, análisis profundo por categoría y acciones correctivas inmediatas." },
    { question: "Las multas por incumplimiento de la NOM-035 pueden alcanzar:", options: ["$5,000 MXN", "$50,000 MXN", "$540,000 MXN por falta", "No hay multas"], correctIndex: 2, explanation: "De 250 a 5,000 UMAs por obligación incumplida, lo que en 2026 representa hasta aproximadamente $540,000 MXN por falta." },
    { question: "Los factores de riesgo psicosocial pueden aumentar el riesgo de accidentes porque:", options: ["No tienen relación con accidentes", "Afectan la concentración, juicio y toma de decisiones del trabajador", "Solo afectan el ánimo, no la seguridad", "Solo aplican en oficinas"], correctIndex: 1, explanation: "Un trabajador estresado, acosado o con carga excesiva tiene menor concentración y peor juicio, incrementando el riesgo de accidentes." }
  ]
},

"formacion-instructores": {
  title: "Evaluación: Formación de Instructores",
  passingScore: 70,
  questions: [
    { question: "La andragogía es:", options: ["El estudio de los niños", "La ciencia de la educación de adultos", "Un método de evaluación", "Una técnica de oratoria"], correctIndex: 1, explanation: "La andragogía (Knowles) estudia cómo aprenden los adultos, que difiere significativamente de cómo aprenden los niños." },
    { question: "Según los principios andragógicos, los adultos aprenden mejor cuando:", options: ["Se les dice exactamente qué hacer", "El contenido es inmediatamente aplicable a su realidad", "Se les evalúa constantemente", "Reciben premios y castigos"], correctIndex: 1, explanation: "Los adultos aprenden mejor cuando ven la aplicación inmediata, participan activamente y se respeta su experiencia." },
    { question: "Un objetivo de aprendizaje bien escrito incluye:", options: ["Solo el tema a cubrir", "Verbo de acción + contenido + condición + criterio", "El nombre del instructor", "La duración de la sesión"], correctIndex: 1, explanation: "Ejemplo: 'El participante identificará (verbo) los pictogramas SGA (contenido) al observar etiquetas (condición) con 100% de aciertos (criterio).'" },
    { question: "El modelo de Kirkpatrick tiene 4 niveles de evaluación. El Nivel 3 mide:", options: ["Si les gustó el curso (reacción)", "Si aprendieron los objetivos", "Si aplican lo aprendido en el trabajo (comportamiento)", "Si impactó los indicadores del negocio"], correctIndex: 2, explanation: "Nivel 1: Reacción, Nivel 2: Aprendizaje, Nivel 3: Comportamiento (aplicación), Nivel 4: Resultados (impacto en el negocio)." },
    { question: "El formato DC-3 de la STPS es:", options: ["El plan de capacitación", "La constancia de competencias laborales del trabajador", "La lista de asistencia", "El programa anual"], correctIndex: 1, explanation: "El DC-3 es la constancia de competencias/habilidades laborales que se emite al trabajador como evidencia de capacitación." },
    { question: "La regla 10-20-30 para instructores recomienda:", options: ["10 horas, 20 temas, 30 participantes", "Cambiar actividad cada 10 min, no hablar más de 20 min seguidos, máximo 30 diapositivas", "10 objetivos, 20 ejercicios, 30 preguntas", "Capacitar 10 personas 20 veces en 30 días"], correctIndex: 1, explanation: "Cada 10 min cambia algo, máximo 20 min sin interacción, y no más de 30 slides. Mantiene la atención y el aprendizaje activo." },
    { question: "Ante un participante escéptico, la mejor estrategia es:", options: ["Ignorarlo", "Confrontarlo directamente", "Validar su experiencia y usar datos/evidencias", "Pedirle que se retire"], correctIndex: 2, explanation: "El escéptico tiene experiencia que valora. Reconocer esa experiencia y complementar con datos y evidencias genera credibilidad." }
  ]
},

"bloqueo-etiquetado-loto": {
  title: "Evaluación: Bloqueo y Etiquetado (LOTO)",
  passingScore: 70,
  questions: [
    { question: "LOTO significa:", options: ["Lock Out / Tag Out (Bloqueo y Etiquetado)", "Low Tension / Tag Operation", "Local Operation / Total Overhaul", "Lock On / Turn Off"], correctIndex: 0, explanation: "LOTO = Lockout/Tagout, el procedimiento de bloqueo y etiquetado para aislar fuentes de energía peligrosa." },
    { question: "¿Cuántos tipos de energía peligrosa existen?", options: ["Solo eléctrica", "Eléctrica y mecánica", "7 tipos: eléctrica, mecánica, hidráulica, neumática, térmica, química y gravitacional", "3 tipos"], correctIndex: 2, explanation: "Existen al menos 7 tipos de energía que pueden causar daño: eléctrica, mecánica, hidráulica, neumática, térmica, química y gravitacional." },
    { question: "La 'regla de oro' del LOTO es:", options: ["El supervisor decide quién retira los candados", "Solo quien colocó el candado puede retirarlo", "Los candados se retiran al final del turno", "Cualquiera puede retirar un candado en emergencia"], correctIndex: 1, explanation: "Solo la persona que colocó el candado puede retirarlo. Sin excepciones, salvo un procedimiento de emergencia con autorización especial." },
    { question: "¿Qué se hace después de aislar todas las fuentes de energía y colocar candados?", options: ["Iniciar el trabajo inmediatamente", "Verificar ausencia de energía intentando arrancar el equipo", "Llamar al supervisor", "Tomar una foto"], correctIndex: 1, explanation: "Después de aislar y bloquear, se debe verificar intentando arrancar el equipo. Si no arranca, se confirma el aislamiento correcto." },
    { question: "La 'energía residual' se refiere a:", options: ["La energía eléctrica del edificio", "Energía almacenada que persiste después de aislar la fuente (capacitores, resortes, presión)", "La energía del siguiente turno", "No existe tal cosa"], correctIndex: 1, explanation: "Incluso después de cortar la fuente, puede quedar energía almacenada en capacitores, resortes, líneas presurizadas o cargas suspendidas." },
    { question: "En un LOTO grupal, el equipo se puede reactivar cuando:", options: ["El supervisor lo autoriza", "La mayoría de los trabajadores retiran su candado", "TODOS los trabajadores han retirado su candado personal", "Pasan 8 horas"], correctIndex: 2, explanation: "Con pinza de bloqueo múltiple, cada trabajador pone su candado. El equipo solo se reactiva cuando absolutamente TODOS lo retiran." },
    { question: "¿Con qué frecuencia se debe auditar el programa LOTO?", options: ["Cada 5 años", "Al menos una vez al año", "Solo después de un accidente", "No requiere auditoría"], correctIndex: 1, explanation: "La auditoría anual verifica que los procedimientos estén actualizados, el personal capacitado y que se aplique correctamente en la práctica." }
  ]
},

"nom-026-colores-senales-seguridad": {
  title: "Evaluación: NOM-026 Colores y Señales de Seguridad",
  passingScore: 70,
  questions: [
    { question: "El color ROJO en seguridad significa:", options: ["Precaución", "Obligación", "Prohibición, peligro y equipo contra incendio", "Condición segura"], correctIndex: 2, explanation: "Rojo = prohibición, peligro y ubicación de equipo contra incendio. Su color contrastante es el blanco." },
    { question: "Las señales de OBLIGACIÓN tienen forma de:", options: ["Triángulo amarillo", "Círculo azul con símbolo blanco", "Círculo rojo con barra diagonal", "Rectángulo verde"], correctIndex: 1, explanation: "Círculo azul con símbolo blanco: indican acciones obligatorias como usar casco, guantes, lentes, etc." },
    { question: "Las señales de seguridad deben colocarse a una altura de:", options: ["A nivel del piso", "Entre 2 y 2.5 metros del piso", "A 5 metros de altura", "No importa la altura"], correctIndex: 1, explanation: "Entre 2 y 2.5 metros del piso para ser visibles sin obstrucciones a la distancia adecuada." },
    { question: "El color VERDE en tuberías indica que contienen:", options: ["Gas", "Aceite", "Agua", "Ácido"], correctIndex: 2, explanation: "Verde = agua. Cada sustancia tiene su color: gris (vapor), café (aceites), amarillo (gases), naranja (ácidos), violeta (álcalis)." },
    { question: "Las franjas amarillas y negras en el piso indican:", options: ["Ruta de evacuación", "Zona de peligro o precaución", "Estacionamiento", "Área de descanso"], correctIndex: 1, explanation: "Las franjas amarillo-negro señalan precaución: bordes de escalones, obstáculos, áreas de maniobra de maquinaria." },
    { question: "¿Con qué frecuencia se debe auditar la señalización completa?", options: ["Cada mes", "Al menos 2 veces al año (semestral)", "Cada 5 años", "Solo cuando lo pida la STPS"], correctIndex: 1, explanation: "Auditoría semestral completa, con inspecciones mensuales en áreas críticas y reemplazo inmediato de señales dañadas." },
    { question: "Una señal fotoluminiscente sirve para:", options: ["Decoración", "Ser visible en oscuridad o corte de energía eléctrica", "Ahorrar energía", "Identificar productos químicos"], correctIndex: 1, explanation: "Las señales fotoluminiscentes absorben luz y brillan en oscuridad, siendo cruciales durante cortes de energía o incendios con humo." }
  ]
},

"herramientas-manuales-poder": {
  title: "Evaluación: Herramientas Manuales y de Poder",
  passingScore: 70,
  questions: [
    { question: "Antes de usar cualquier herramienta, lo primero es:", options: ["Conectarla a la corriente", "Inspeccionarla visualmente para verificar su estado", "Preguntar al compañero si funciona", "Leer la marca"], correctIndex: 1, explanation: "La inspección visual antes de cada uso detecta daños, desgaste o defectos que podrían causar un accidente." },
    { question: "¿Cuál es un error común y peligroso con herramientas manuales?", options: ["Usar la herramienta correcta para cada tarea", "Usar un desarmador como cincel o una llave como martillo", "Mantenerlas afiladas", "Almacenarlas en su lugar"], correctIndex: 1, explanation: "Usar herramientas para fines distintos a su diseño causa roturas, proyección de fragmentos y lesiones." },
    { question: "Al usar una esmeriladora, ¿qué NUNCA debe retirarse?", options: ["El disco", "La guarda de seguridad", "El cable", "El mango"], correctIndex: 1, explanation: "La guarda de seguridad protege al operador de fragmentos del disco si se rompe. Retirarla es una de las causas principales de lesiones graves." },
    { question: "El sistema de etiquetas de colores para herramientas indica:", options: ["El dueño de la herramienta", "Verde (aprobada), Amarillo (precaución), Rojo (fuera de servicio)", "El precio de la herramienta", "La fecha de compra"], correctIndex: 1, explanation: "Sistema de control visual: verde (OK para uso), amarillo (usar con precaución, necesita atención), rojo (fuera de servicio, no usar)." },
    { question: "Al usar un taladro, la pieza debe sujetarse con:", options: ["La mano libre", "Prensa o soporte mecánico", "Los pies", "No necesita sujetarse"], correctIndex: 1, explanation: "NUNCA sostener la pieza con la mano. La broca puede atascarse y hacer girar la pieza violentamente. Siempre usar prensa o soporte." },
    { question: "Las herramientas cortantes deben almacenarse:", options: ["Sueltas en una caja", "Con protección en el filo", "En el piso", "Junto a los productos químicos"], correctIndex: 1, explanation: "Las herramientas cortantes necesitan protección en el filo para evitar accidentes al buscar herramientas y para mantener el filo." },
    { question: "¿Qué EPP mínimo se requiere al usar herramientas manuales?", options: ["Ninguno", "Solo casco", "Guantes y lentes de seguridad como mínimo", "Solo botas"], correctIndex: 2, explanation: "Como mínimo: guantes (protección de manos) y lentes de seguridad (protección ocular contra partículas proyectadas)." }
  ]
},

"ergonomia-trastornos-musculoesqueleticos": {
  title: "Evaluación: Ergonomía y Prevención de TME",
  passingScore: 70,
  questions: [
    { question: "La ergonomía busca:", options: ["Que el trabajador se adapte al trabajo", "Adaptar el trabajo a las capacidades del trabajador", "Eliminar todo esfuerzo físico", "Solo mejorar las sillas de oficina"], correctIndex: 1, explanation: "La ergonomía diseña el trabajo para adaptarse al cuerpo humano, no al revés. Cuando el trabajo no se adapta, aparecen los TME." },
    { question: "El TME más común y principal causa de incapacidad laboral en México es:", options: ["Túnel carpiano", "Tendinitis", "Lumbalgia (dolor de espalda baja)", "Cervicalgia"], correctIndex: 2, explanation: "La lumbalgia es el TME #1 en incapacidades laborales en México, asociada a levantamiento de cargas y posturas forzadas." },
    { question: "Al levantar una carga del piso, la técnica correcta es:", options: ["Doblar la espalda y levantar con los brazos", "Flexionar rodillas, espalda recta, levantar con las piernas", "Pedir siempre a alguien más que lo haga", "No importa la técnica si el peso es ligero"], correctIndex: 1, explanation: "Flexionar rodillas (no la espalda), agarre firme, espalda recta, levantar con la fuerza de las piernas, carga pegada al cuerpo." },
    { question: "La NOM que regula factores de riesgo ergonómico en México es:", options: ["NOM-017-STPS", "NOM-035-STPS", "NOM-036-1-STPS-2018", "NOM-019-STPS"], correctIndex: 2, explanation: "La NOM-036-1-STPS-2018 establece las condiciones de seguridad e higiene para prevenir factores de riesgo ergonómico." },
    { question: "La regla 20-20-20 para trabajo en pantalla dice:", options: ["20 minutos de trabajo, 20 de descanso, 20 de ejercicio", "Cada 20 min, mira algo a 20 pies (6m) por 20 segundos", "Usar pantalla de 20 pulgadas a 20 cm con brillo al 20%", "Trabajar 20 horas semanales en pantalla máximo"], correctIndex: 1, explanation: "Reduce la fatiga visual: cada 20 minutos, enfoca algo a 6 metros de distancia durante 20 segundos para relajar la musculatura ocular." },
    { question: "El método REBA evalúa:", options: ["Solo las manos y muñecas", "Posturas de cuerpo completo (tronco, cuello, piernas, brazos, muñecas)", "Solo la capacidad de levantamiento", "Solo el diseño de la silla"], correctIndex: 1, explanation: "REBA (Rapid Entire Body Assessment) evalúa posturas del cuerpo completo, ideal para trabajo dinámico con posturas variadas." },
    { question: "Por cada $1 invertido en ergonomía, el retorno aproximado es:", options: ["$0.50 (pérdida)", "$1 (sin beneficio)", "$3 a $6 en reducción de costos", "$100+"], correctIndex: 2, explanation: "Estudios muestran ROI de $3-$6 por cada dólar invertido en ergonomía, por reducción de incapacidades, ausentismo y pérdida de productividad." }
  ]
},

"soldadura-corte-seguridad": {
  title: "Evaluación: Soldadura y Corte — Seguridad",
  passingScore: 70,
  questions: [
    { question: "El 'permiso de trabajo en caliente' debe verificar un radio mínimo de:", options: ["1 metro", "5 metros", "11 metros (35 pies)", "20 metros"], correctIndex: 2, explanation: "Se debe inspeccionar un radio de 11 metros (35 pies) alrededor del punto de soldadura para retirar o proteger materiales combustibles." },
    { question: "El 'vigía de fuego' (fire watch) debe permanecer en el área:", options: ["Solo durante la soldadura", "Durante la soldadura y 30 minutos después", "Solo 5 minutos después", "No se requiere vigía"], correctIndex: 1, explanation: "El vigía permanece durante el trabajo y al menos 30 minutos después, porque las chispas pueden generar fuego latente que se manifiesta después." },
    { question: "El 'ojo de soldador' (queratitis) es causado por:", options: ["El calor", "La radiación UV del arco eléctrico", "Los humos metálicos", "El ruido"], correctIndex: 1, explanation: "La intensa radiación ultravioleta del arco eléctrico quema la córnea, causando dolor intenso, lagrimeo y sensibilidad a la luz." },
    { question: "Los cilindros de oxígeno y acetileno deben almacenarse:", options: ["Juntos para ahorrar espacio", "Separados al menos 6 metros o con muro cortafuego", "Acostados en el piso", "Sin tapa protectora"], correctIndex: 1, explanation: "El oxígeno es un comburente potente. Si se mezcla con acetileno (inflamable) y hay una fuga, el riesgo de explosión es extremo." },
    { question: "¿Qué NUNCA se debe usar en conexiones de oxígeno?", options: ["Cinta teflón", "Grasa o aceite", "Abrazaderas", "Reguladores"], correctIndex: 1, explanation: "La grasa y el aceite en contacto con oxígeno a alta presión pueden auto-inflamarse explosivamente." },
    { question: "El filtro de la careta de soldador se selecciona según:", options: ["El color preferido", "El proceso de soldadura y la corriente/grosor (sombra 10-13 para arco)", "El precio", "La marca del equipo"], correctIndex: 1, explanation: "La sombra del filtro se selecciona según el proceso y los parámetros: arco eléctrico típicamente sombra 10-13, oxiacetileno sombra 4-8." },
    { question: "Ante una quemadura por soldadura, el primer auxilio correcto es:", options: ["Aplicar hielo directamente", "Enfriar con agua corriente 10-20 minutos, cubrir con apósito estéril", "Aplicar crema o mantequilla", "Reventar las ampollas"], correctIndex: 1, explanation: "Agua corriente para enfriar (no hielo), no aplicar cremas ni remedios caseros, cubrir con apósito estéril y buscar atención médica." }
  ]
},

"operacion-segura-montacargas": {
  title: "Evaluación: Operación Segura de Montacargas",
  passingScore: 70,
  questions: [
    { question: "El 'triángulo de estabilidad' del montacargas se forma entre:", options: ["Las 4 ruedas", "Las 2 ruedas delanteras y el centro del eje trasero", "Las horquillas y el mástil", "El contrapeso y las horquillas"], correctIndex: 1, explanation: "El triángulo se forma entre las 2 ruedas delanteras y el punto central del eje trasero. Si el centro de gravedad sale de este triángulo, el montacargas vuelca." },
    { question: "¿Cuál es la causa #1 de muertes con montacargas?", options: ["Atropellamiento", "Volcadura", "Caída de carga", "Incendio"], correctIndex: 1, explanation: "Las volcaduras son la causa principal de fatalidades con montacargas. El cinturón de seguridad y la velocidad adecuada son las mejores prevenciones." },
    { question: "En una rampa con carga, el montacargas debe:", options: ["Subir en reversa", "Subir de frente (carga cuesta arriba)", "Subir de lado", "No debe subir rampas con carga"], correctIndex: 1, explanation: "Con carga: subir de frente (carga cuesta arriba para estabilidad), bajar en reversa. Sin carga: lo contrario." },
    { question: "La inspección pre-operación debe realizarse:", options: ["Una vez por semana", "Cada turno, antes de usar el montacargas", "Solo al inicio de cada mes", "Solo si se nota algo raro"], correctIndex: 1, explanation: "Cada turno, sin excepción. Es la primera línea de detección de problemas mecánicos que podrían causar accidentes." },
    { question: "Si la carga bloquea la visibilidad frontal, debes:", options: ["Avanzar lentamente con precaución", "Circular en reversa", "Pedir a alguien que camine adelante", "Elevar la carga más para ver por debajo"], correctIndex: 1, explanation: "Si la carga impide la visión, circular en reversa. Si es necesario avanzar, usar un señalero que guíe el camino." },
    { question: "¿Se pueden transportar pasajeros en un montacargas?", options: ["Sí, si van sentados", "Sí, en las horquillas si están bajadas", "NUNCA, bajo ninguna circunstancia", "Solo en distancias cortas"], correctIndex: 2, explanation: "NUNCA transportar pasajeros en montacargas — ni en la cabina, ni en las horquillas, ni en el contrapeso. Sin excepciones." },
    { question: "Si el montacargas comienza a volcarse, el operador debe:", options: ["Saltar fuera inmediatamente", "Inclinarse hacia el lado contrario, agarrarse del volante y mantenerse dentro", "Acelerar para estabilizar", "Soltar el volante"], correctIndex: 1, explanation: "NUNCA saltar — el montacargas puede caer sobre ti. Inclinarse al lado contrario, agarrarse del volante, cinturón puesto, mantenerse en el compartimento." }
  ]
},

"actualizacion-montacargas": {
  title: "Evaluación: Actualización de Montacargas",
  passingScore: 70,
  questions: [
    { question: "¿Por qué es necesaria la actualización para operadores experimentados?", options: ["No es necesaria si tienen experiencia", "La confianza excesiva genera descuidos y malos hábitos", "Solo por requisito legal", "Para aprender a manejar modelos nuevos"], correctIndex: 1, explanation: "La experiencia genera confianza, pero también rutina y descuidos. La actualización refresca conocimientos y corrige hábitos peligrosos." },
    { question: "¿Cuál es el error más común de operadores experimentados?", options: ["No saber manejar", "Omitir la inspección pre-operación por rutina", "Manejar muy lento", "Pedir ayuda"], correctIndex: 1, explanation: "'Ya la conozco, no necesito revisarla' es la frase más peligrosa. La inspección detecta problemas mecánicos que cambian día a día." },
    { question: "El cinturón de seguridad del montacargas protege principalmente contra:", options: ["Robos", "Ser expulsado del compartimento durante una volcadura", "Multas", "El frío"], correctIndex: 1, explanation: "En una volcadura, el mayor peligro es ser expulsado y quedar atrapado bajo la máquina de +2 toneladas. El cinturón te mantiene dentro." },
    { question: "En el área de carga de baterías de montacargas eléctricos se debe:", options: ["Fumar con precaución", "Mantener ventilación porque la carga genera hidrógeno (gas explosivo)", "No hay precauciones especiales", "Solo cargar de noche"], correctIndex: 1, explanation: "La carga de baterías produce hidrógeno, un gas altamente explosivo. El área debe ser ventilada y libre de chispas o llamas." },
    { question: "La evaluación para recertificación incluye:", options: ["Solo examen teórico", "Solo práctica de manejo", "Examen teórico + evaluación práctica supervisada", "Solo firmar un documento"], correctIndex: 2, explanation: "La recertificación requiere demostrar competencia tanto teórica (conocimiento) como práctica (habilidad de manejo seguro)." },
    { question: "Ante un casi-accidente con montacargas, lo correcto es:", options: ["Ignorarlo porque no pasó nada", "Reportarlo porque cada casi-accidente es un accidente que se previene", "Solo comentarlo con los compañeros", "Reportarlo solo si hay testigos"], correctIndex: 1, explanation: "Cada casi-accidente reportado permite identificar riesgos y corregirlos ANTES de que alguien resulte lesionado." },
    { question: "La velocidad máxima recomendada en interiores es:", options: ["5 km/h", "10 km/h", "20 km/h", "No hay límite"], correctIndex: 1, explanation: "Máximo 10 km/h en interiores y 5 km/h en cruces y áreas peatonales. La velocidad es el factor más controlable de seguridad." }
  ]
},

"nom-019-comisiones-seguridad-higiene": {
  title: "Evaluación: NOM-019 Comisiones de Seguridad e Higiene",
  passingScore: 70,
  questions: [
    { question: "La Comisión de Seguridad e Higiene es obligatoria para:", options: ["Solo empresas con más de 50 trabajadores", "Solo empresas industriales", "TODOS los centros de trabajo en México", "Solo empresas de alto riesgo"], correctIndex: 2, explanation: "Todos los centros de trabajo, sin importar tamaño ni giro, están obligados a constituir su CSH." },
    { question: "La CSH se integra con:", options: ["Solo representantes del patrón", "Solo representantes de los trabajadores", "Igual número de representantes del patrón y de los trabajadores", "Solo el responsable de seguridad"], correctIndex: 2, explanation: "Es un organismo bipartito: igual número de representantes del patrón y de los trabajadores, estos últimos elegidos democráticamente." },
    { question: "¿Con qué frecuencia mínima debe la CSH realizar recorridos de verificación?", options: ["Mensual", "Al menos cada 3 meses (trimestral)", "Semestral", "Anual"], correctIndex: 1, explanation: "Mínimo trimestrales, o mensuales en actividades de alto riesgo. Deben ser planificados, documentados y con seguimiento." },
    { question: "El acta de verificación debe incluir:", options: ["Solo la fecha del recorrido", "Hallazgos, acciones recomendadas, responsables, fechas compromiso y firmas", "Solo las firmas de los participantes", "Solo fotografías"], correctIndex: 1, explanation: "El acta debe documentar completamente: hallazgos, clasificación de riesgo, acciones correctivas, responsables, fechas y firmas de todos." },
    { question: "Los representantes de los trabajadores en la CSH son:", options: ["Designados por el patrón", "Elegidos democráticamente por los trabajadores", "Los más antiguos automáticamente", "Los del sindicato obligatoriamente"], correctIndex: 1, explanation: "Los representantes de los trabajadores deben ser elegidos de forma democrática, libre y directa." },
    { question: "La CSH tiene relación con la NOM-035 porque:", options: ["No tienen relación", "La CSH puede identificar factores de riesgo psicosocial durante sus recorridos", "La NOM-035 reemplaza a la NOM-019", "Solo aplica una u otra"], correctIndex: 1, explanation: "La CSH puede detectar indicadores de riesgo psicosocial (violencia, acoso, condiciones de estrés) durante sus recorridos de verificación." },
    { question: "Si un hallazgo no se corrige en la fecha comprometida, la CSH debe:", options: ["Ignorarlo y seguir adelante", "Documentar el incumplimiento y escalar al siguiente nivel de autoridad", "Cerrarlo como atendido", "Esperar al siguiente recorrido"], correctIndex: 1, explanation: "La CSH documenta el incumplimiento y lo escala. El seguimiento a las acciones correctivas es una de sus funciones más importantes." }
  ]
}

};