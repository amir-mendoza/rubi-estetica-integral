import {
  Cita, Especialista, EstadoCita, EstadoPago, Habitacion, Local, MetodoPago,
  MovimientoPago, Paciente, Pedido, PlanSesiones, Producto, Promocion,
  Tratamiento, Usuario
} from './modelos';

/* ============================================================== LOCALES === */

export const LOCALES: Local[] = [
  {
    id: 1,
    uuidGlobal: 'loc-8f21c0a4',
    nombre: 'Sede Las Flores 1522',
    direccion: 'Av. Las Flores de Primavera 1522, 051',
    referencia: 'San Juan de Lurigancho 15404',
    distrito: 'San Juan de Lurigancho, Lima',
    telefono: '945 189 720',
    horario: [
      { dias: 'Todos los días', apertura: '09:00', cierre: '19:00' }
    ],
    imagen: 'img/local-1.jpg',
    mapa: 'https://www.google.com/maps/search/?api=1&query=-12.00423259951209,-77.01189597596573',
    latitud: -12.00423259951209,
    longitud: -77.01189597596573,
    activo: true
  },
  {
    id: 2,
    uuidGlobal: 'loc-31bd7e92',
    nombre: 'Sede Las Flores 1544',
    direccion: 'Av. Las Flores de Primavera 1544',
    referencia: 'San Juan de Lurigancho 15408',
    distrito: 'San Juan de Lurigancho, Lima',
    telefono: '945 189 721',
    horario: [
      { dias: 'Todos los días', apertura: '09:00', cierre: '19:00' }
    ],
    imagen: 'img/local-2.jpg',
    mapa: 'https://www.google.com/maps/search/?api=1&query=-12.003582220477465,-77.01212351240744',
    latitud: -12.003582220477465,
    longitud: -77.01212351240744,
    activo: true
  }
];

export const HABITACIONES: Habitacion[] = [
  // Sede Las Flores 1522: 5 cabinas
  { id: 1, nombre: 'Cabina 1', localId: 1, equipamiento: 'HIFU 25D · Camilla eléctrica', activa: true },
  { id: 2, nombre: 'Cabina 2', localId: 1, equipamiento: 'Vapor ozono · Alta frecuencia', activa: true },
  { id: 3, nombre: 'Cabina 3', localId: 1, equipamiento: 'Radiofrecuencia · Dermapen', activa: true },
  { id: 4, nombre: 'Cabina 4', localId: 1, equipamiento: 'Camilla facial · Lámpara lupa', activa: true },
  { id: 5, nombre: 'Cabina 5', localId: 1, equipamiento: 'Sala médica · Botox y PRP', activa: true },
  // Sede Las Flores 1544: 10 cabinas
  { id: 6, nombre: 'Cabina 1', localId: 2, equipamiento: 'HIFU 25D · Camilla eléctrica', activa: true },
  { id: 7, nombre: 'Cabina 2', localId: 2, equipamiento: 'Cavitación · Drenaje linfático', activa: true },
  { id: 8, nombre: 'Cabina 3', localId: 2, equipamiento: 'Tens Booster · Camilla facial', activa: true },
  { id: 9, nombre: 'Cabina 4', localId: 2, equipamiento: 'Vapor ozono · Alta frecuencia', activa: true },
  { id: 10, nombre: 'Cabina 5', localId: 2, equipamiento: 'Radiofrecuencia corporal', activa: true },
  { id: 11, nombre: 'Cabina 6', localId: 2, equipamiento: 'Dermapen · Microneedling', activa: true },
  { id: 12, nombre: 'Cabina 7', localId: 2, equipamiento: 'Camilla facial · Lámpara lupa', activa: true },
  { id: 13, nombre: 'Cabina 8', localId: 2, equipamiento: 'Presoterapia · Manta térmica', activa: true },
  { id: 14, nombre: 'Cabina 9', localId: 2, equipamiento: 'Sala médica · Botox y PRP', activa: true },
  { id: 15, nombre: 'Cabina 10', localId: 2, equipamiento: 'Camilla multifuncional', activa: true }
];

/* ================================================= REGLAS DE LA AGENDA === */

/**
 * La paciente reserva un bloque horario (la hora a la que piensa llegar), no una
 * cabina ni una especialista. Las dos sedes atienden las 24 horas y cada bloque
 * de una hora acepta hasta 10 pacientes; la especialista y la cabina se asignan
 * en el local segun el orden de llegada.
 */
export const AGENDA = {
  bloqueMin: 60,
  /** Citas que se aceptan por bloque horario en cada sede. */
  cupoPorBloque: { 1: 10, 2: 10 } as Record<number, number>
};

export function cupoDeSede(localId: number): number {
  return AGENDA.cupoPorBloque[localId] ?? 10;
}

export function cabinasDeSede(localId: number): Habitacion[] {
  return HABITACIONES.filter(h => h.localId === localId && h.activa);
}

export function formatoHora12(hora?: string): string {
  if (!hora) { return '—'; }
  const [h = 0, m = 0] = hora.split(':').map(Number);
  if (h === 24) { return `12:${String(m).padStart(2, '0')} AM`; }
  const periodo = h >= 12 ? 'PM' : 'AM';
  const hora12 = h % 12 || 12;
  return `${hora12}:${String(m).padStart(2, '0')} ${periodo}`;
}

export const HORAS_SELECTOR = Array.from({ length: 24 }, (_, h) => {
  const valor = `${String(h).padStart(2, '0')}:00`;
  return { valor, etiqueta: formatoHora12(valor) };
});

/* ========================================================= TRATAMIENTOS === */

export const TRATAMIENTOS: Tratamiento[] = [
  {
    id: 1,
    nombre: 'Limpieza facial profunda',
    categoria: 'Facial',
    etiquetas: ['Limpieza', 'Hidratación', 'Mantenimiento'],
    resumen: 'Purifica, ilumina y revitaliza la piel eliminando impurezas y comedones.',
    descripcion:
      'Protocolo de higiene facial completo: desmaquillado, exfoliación enzimática, vapor de ozono, extracción manual asistida, alta frecuencia, mascarilla calmante y protector solar. Ideal como mantenimiento mensual y como preparación de la piel antes de tratamientos de aparatología.',
    beneficios: [
      'Elimina comedones e impurezas acumuladas',
      'Reduce la apariencia del poro dilatado',
      'Devuelve luminosidad e hidratación inmediata',
      'Prepara la piel para otros tratamientos'
    ],
    recomendaciones: [
      'No exponerse al sol directo las primeras 24 horas',
      'Usar protector solar SPF 50 a diario',
      'Evitar maquillaje durante las 12 horas posteriores'
    ],
    duracionMin: 60,
    limpiezaMin: 15,
    precio: 120,
    imagen: 'img/trat-limpieza.jpg',
    video: 'video/trat-limpieza.mp4',
    videoPoster: 'video/trat-limpieza-poster.jpg',
    tiktokUrl: 'https://www.tiktok.com/@rubiesteticaintegral',
    galeria: ['img/trat-peeling.jpg', 'img/trat-hidro.jpg'],
    destacado: true,
    activo: true
  },
  {
    id: 2,
    nombre: 'HIFU 25D facial',
    categoria: 'Aparatología',
    etiquetas: ['Reafirmante', 'Lifting', 'Antiedad'],
    resumen: 'Lifting sin cirugía que reafirma y redefine el contorno facial.',
    descripcion:
      'Ultrasonido microfocalizado de alta intensidad que actúa sobre el SMAS estimulando la producción natural de colágeno. Se realiza una sesión cada 6 meses y los resultados se aprecian de forma progresiva durante los 90 días siguientes.',
    beneficios: [
      'Efecto lifting progresivo sin cirugía',
      'Redefine óvalo facial y línea mandibular',
      'Estimula colágeno propio',
      'Sin tiempo de recuperación'
    ],
    recomendaciones: [
      'Una sesión cada 6 meses',
      'Mantener buena hidratación las semanas siguientes',
      'No aplicar en zonas con inflamación activa'
    ],
    duracionMin: 90,
    limpiezaMin: 20,
    precio: 350,
    precioAntes: 550,
    imagen: 'img/trat-hifu.jpg',
    video: 'video/trat-hifu.mp4',
    videoPoster: 'video/trat-hifu-poster.jpg',
    tiktokUrl: 'https://www.tiktok.com/@rubiesteticaintegral',
    galeria: ['img/trat-radio.jpg'],
    destacado: true,
    activo: true
  },
  {
    id: 3,
    nombre: 'Botox full face',
    categoria: 'Medicina estética',
    etiquetas: ['Antiedad', 'Arrugas', 'Procedimiento médico'],
    resumen: 'Suaviza líneas de expresión y otorga una apariencia descansada.',
    descripcion:
      'Aplicación de toxina botulínica por médico especialista en tercio superior (frente, entrecejo y patas de gallo). Procedimiento ambulatorio con evaluación previa obligatoria.',
    beneficios: [
      'Suaviza arrugas dinámicas',
      'Rostro descansado y natural',
      'Procedimiento ambulatorio de corta duración',
      'Resultados visibles entre el día 4 y 7'
    ],
    recomendaciones: [
      'No recostarse durante las 4 horas posteriores',
      'Evitar ejercicio intenso por 24 horas',
      'No masajear la zona tratada'
    ],
    duracionMin: 45,
    limpiezaMin: 15,
    precio: 700,
    precioAntes: 900,
    imagen: 'img/trat-botox.jpg',
    destacado: true,
    activo: true
  },
  {
    id: 4,
    nombre: 'Plasma rico en plaquetas',
    categoria: 'Medicina estética',
    etiquetas: ['Antiedad', 'Regenerativo', 'Procedimiento médico'],
    resumen: 'Regenera la piel desde el interior con tu propio plasma.',
    descripcion:
      'Se extrae una pequeña muestra de sangre de la paciente, se centrifuga y se obtiene el plasma rico en factores de crecimiento, que luego se infiltra en el rostro para estimular la regeneración celular y la producción de colágeno.',
    beneficios: [
      'Estimula la producción natural de colágeno',
      'Mejora textura, firmeza y luminosidad',
      'Tratamiento 100 % biocompatible',
      'Complementa otros tratamientos faciales'
    ],
    recomendaciones: [
      'Acudir hidratada y habiendo desayunado',
      'Protocolo sugerido de 3 sesiones',
      'Evitar antiinflamatorios 48 horas antes'
    ],
    duracionMin: 60,
    limpiezaMin: 20,
    precio: 150,
    imagen: 'img/trat-plasma.jpg',
    destacado: true,
    activo: true
  },
  {
    id: 5,
    nombre: 'Hidrolipoclasia',
    categoria: 'Corporal',
    etiquetas: ['Reducción de medidas', 'Localizado'],
    resumen: 'Trabaja la grasa localizada y mejora el contorno corporal.',
    descripcion:
      'Infiltración de solución hipotónica en la zona de grasa localizada, potenciada con ultrasonido. Se recomienda combinar con drenaje linfático para favorecer la eliminación de líquidos.',
    beneficios: [
      'Reduce medidas en zonas localizadas',
      'Mejora el contorno corporal',
      'Complementa el drenaje linfático',
      'Resultados progresivos por sesión'
    ],
    recomendaciones: [
      'Beber al menos 2 litros de agua al día',
      'Combinar con 2 sesiones de drenaje linfático',
      'Mantener alimentación balanceada'
    ],
    duracionMin: 75,
    limpiezaMin: 20,
    precio: 300,
    precioAntes: 450,
    imagen: 'img/trat-hidro.jpg',
    destacado: true,
    activo: true
  },
  {
    id: 6,
    nombre: 'Drenaje linfático',
    categoria: 'Corporal',
    etiquetas: ['Relajante', 'Circulación', 'Post tratamiento'],
    resumen: 'Favorece la eliminación de líquidos y desinflama el cuerpo.',
    descripcion:
      'Masaje manual de presión suave y rítmica que estimula el sistema linfático, ideal como complemento de tratamientos reductores y en postoperatorios estéticos.',
    beneficios: [
      'Reduce retención de líquidos',
      'Desinflama y alivia la pesadez',
      'Complemento ideal de tratamientos reductores',
      'Sensación de bienestar inmediata'
    ],
    recomendaciones: [
      'Hidratarse antes y después de la sesión',
      'Evitar comidas pesadas antes de la cita',
      'Protocolo sugerido de 6 a 10 sesiones'
    ],
    duracionMin: 50,
    limpiezaMin: 10,
    precio: 90,
    imagen: 'img/trat-drenaje.jpg',
    destacado: false,
    activo: true
  },
  {
    id: 7,
    nombre: 'Peeling facial',
    categoria: 'Facial',
    etiquetas: ['Exfoliación', 'Manchas', 'Luminosidad'],
    resumen: 'Renueva la piel, unifica el tono y atenúa manchas.',
    descripcion:
      'Exfoliación química controlada con activos seleccionados según el tipo de piel. Indicado para manchas, marcas de acné y textura irregular.',
    beneficios: [
      'Unifica el tono de la piel',
      'Atenúa manchas y marcas',
      'Mejora la textura y el brillo',
      'Estimula la renovación celular'
    ],
    recomendaciones: [
      'Uso obligatorio de protector solar SPF 50',
      'No exfoliar la piel en casa durante 7 días',
      'Puede presentarse descamación leve'
    ],
    duracionMin: 45,
    limpiezaMin: 15,
    precio: 180,
    imagen: 'img/trat-peeling.jpg',
    destacado: false,
    activo: true
  },
  {
    id: 8,
    nombre: 'Dermapen',
    categoria: 'Aparatología',
    etiquetas: ['Cicatrices', 'Textura', 'Regenerativo'],
    resumen: 'Microneedling que mejora cicatrices, poros y firmeza.',
    descripcion:
      'Microperforaciones controladas que inducen la regeneración natural del colágeno y permiten una mejor penetración de activos regeneradores.',
    beneficios: [
      'Atenúa cicatrices de acné',
      'Reduce el tamaño aparente del poro',
      'Mejora firmeza y elasticidad',
      'Potencia la absorción de activos'
    ],
    recomendaciones: [
      'Evitar sol directo por 72 horas',
      'No usar ácidos durante 5 días',
      'Protocolo sugerido de 3 a 4 sesiones'
    ],
    duracionMin: 90,
    limpiezaMin: 20,
    precio: 250,
    imagen: 'img/trat-dermapen.jpg',
    destacado: false,
    activo: true
  },
  {
    id: 9,
    nombre: 'Radiofrecuencia facial',
    categoria: 'Aparatología',
    etiquetas: ['Reafirmante', 'Antiedad', 'Sin cirugía'],
    resumen: 'Reafirma y tensa la piel con calor controlado.',
    descripcion:
      'Aplicación de energía electromagnética que eleva la temperatura de la dermis, contrae las fibras de colágeno existentes y estimula la síntesis de colágeno nuevo.',
    beneficios: [
      'Efecto tensor inmediato',
      'Mejora la flacidez leve a moderada',
      'Indoloro y sin recuperación',
      'Combinable con otros tratamientos'
    ],
    recomendaciones: [
      'Protocolo sugerido de 6 sesiones',
      'Mantener la piel hidratada',
      'No apto para portadoras de marcapasos'
    ],
    duracionMin: 60,
    limpiezaMin: 15,
    precio: 160,
    imagen: 'img/trat-radio.jpg',
    destacado: false,
    activo: true
  },
  {
    id: 10,
    nombre: 'Lifting 360° Tens Booster',
    categoria: 'Aparatología',
    etiquetas: ['Reafirmante', 'Lifting', 'Sin cirugía'],
    resumen: 'Firmeza, elasticidad y luminosidad desde la primera sesión.',
    descripcion:
      'Combinación de HIFU 25D con Tens Booster para un efecto tensor inmediato y una piel visiblemente más luminosa y redefinida.',
    beneficios: [
      'Efecto tensor desde la primera sesión',
      'Recupera firmeza y elasticidad',
      'Ilumina y redefine el rostro',
      'Sin tiempo de recuperación'
    ],
    recomendaciones: [
      'Evaluación previa del tipo de piel',
      'Mantener hidratación diaria',
      'Refuerzo sugerido cada 3 meses'
    ],
    duracionMin: 80,
    limpiezaMin: 20,
    precio: 499,
    precioAntes: 900,
    imagen: 'img/trat-tens.jpg',
    video: 'video/trat-tens.mp4',
    videoPoster: 'video/trat-tens-poster.jpg',
    tiktokUrl: 'https://www.tiktok.com/@rubiesteticaintegral',
    galeria: ['img/trat-drenaje.jpg'],
    destacado: false,
    activo: true
  }
];

/* ======================================================== ESPECIALISTAS === */

export const ESPECIALISTAS: Especialista[] = [
  {
    id: 1, nombre: 'Rubí', apellido: 'Salazar', especialidad: 'Cosmiatra · Directora',
    colegiatura: 'CCT 18402',
    bio: 'Fundadora de Rubí Estética Integral. Especialista en protocolos faciales no invasivos y aparatología de última generación.',
    foto: 'img/esp-1.jpg', locales: [1, 2], tratamientos: [1, 2, 4, 7, 9, 10],
    horario: 'Lunes a sábado · 09:00 a 18:00', activa: true
  },
  {
    id: 2, nombre: 'Ana', apellido: 'Torres', especialidad: 'Cosmiatra facial',
    colegiatura: 'CCT 21755',
    bio: 'Diez años de experiencia en higiene facial profunda, peelings y protocolos para piel con acné.',
    foto: 'img/esp-2.jpg', locales: [1], tratamientos: [1, 7, 8, 9],
    horario: 'Lunes a sábado · 08:00 a 16:00', activa: true
  },
  {
    id: 3, nombre: 'Carla', apellido: 'Ríos', especialidad: 'Técnica en aparatología',
    colegiatura: 'CCT 23110',
    bio: 'Especialista en HIFU 25D, radiofrecuencia y tratamientos de firmeza facial y corporal.',
    foto: 'img/esp-3.jpg', locales: [1, 2], tratamientos: [2, 9, 10, 5],
    horario: 'Martes a domingo · 11:00 a 20:00', activa: true
  },
  {
    id: 4, nombre: 'Lucía', apellido: 'Vega', especialidad: 'Terapeuta corporal',
    colegiatura: 'CCT 19988',
    bio: 'Enfocada en drenaje linfático, hidrolipoclasia y protocolos de modelamiento corporal.',
    foto: 'img/esp-4.jpg', locales: [2], tratamientos: [5, 6],
    horario: 'Lunes a sábado · 10:00 a 19:00', activa: true
  },
  {
    id: 5, nombre: 'Dra. Paola', apellido: 'Mendoza', especialidad: 'Médico estético',
    colegiatura: 'CMP 74521',
    bio: 'Médico cirujano con especialidad en medicina estética. Responsable de botox, plasma rico en plaquetas y evaluaciones médicas.',
    foto: 'img/esp-5.jpg', locales: [1, 2], tratamientos: [3, 4],
    horario: 'Jueves y sábado · 10:00 a 17:00', activa: true
  },
  {
    id: 6, nombre: 'Milagros', apellido: 'Quispe', especialidad: 'Cosmiatra facial',
    colegiatura: 'CCT 24390',
    bio: 'Especialista en limpieza facial profunda y protocolos de hidratación para piel sensible.',
    foto: 'img/esp-6.jpg', locales: [2], tratamientos: [1, 6, 7],
    horario: 'Lunes a viernes · 12:00 a 20:00', activa: true
  }
];

/* ============================================================ PRODUCTOS === */

export const PRODUCTOS: Producto[] = [
  {
    id: 1, nombre: 'Sérum vitamina C 20 %', marca: 'Rubí Skin', categoria: 'Sérums',
    descripcion: 'Antioxidante de uso diario que ilumina, unifica el tono y protege del daño ambiental.',
    precio: 89, precioAntes: 120, stock: 24, imagen: 'img/prod-1.jpg',
    beneficios: ['Ayuda a iluminar la piel opaca', 'Apoya la uniformidad del tono', 'Refuerza la rutina antioxidante diaria'],
    modoUso: ['Aplicar de 2 a 3 gotas sobre piel limpia por la mañana', 'Sellar con hidratante y protector solar'],
    recomendaciones: ['Evitar contacto directo con los ojos', 'Suspender si aparece irritación persistente'],
    activo: true
  },
  {
    id: 2, nombre: 'Protector solar SPF 50 toque seco', marca: 'Rubí Skin', categoria: 'Protección solar',
    descripcion: 'Alta protección UVA/UVB con acabado mate, indispensable después de cualquier tratamiento.',
    precio: 75, stock: 40, imagen: 'img/prod-2.jpg',
    beneficios: ['Protege la piel luego de limpiezas, peeling o aparatología', 'Acabado mate para uso diario', 'Ayuda a prevenir manchas por exposición solar'],
    modoUso: ['Aplicar como último paso de la rutina de día', 'Reaplicar cada 2 o 3 horas si hay exposición solar'],
    recomendaciones: ['Usar todos los días, incluso con cielo nublado', 'No aplicar sobre piel irritada sin evaluación previa'],
    activo: true
  },
  {
    id: 3, nombre: 'Crema regeneradora nocturna', marca: 'Dermalux', categoria: 'Cremas',
    descripcion: 'Reparación nocturna con péptidos y ácido hialurónico para pieles maduras.',
    precio: 135, stock: 12, imagen: 'img/prod-3.jpg',
    beneficios: ['Aporta hidratación durante la noche', 'Ayuda a mejorar textura y suavidad', 'Complementa protocolos de rejuvenecimiento facial'],
    modoUso: ['Aplicar una capa fina por la noche sobre piel limpia', 'Masajear suavemente hasta su absorción'],
    recomendaciones: ['Usar protector solar al día siguiente', 'Evitar mezclar con ácidos sin indicación profesional'],
    activo: true
  },
  {
    id: 4, nombre: 'Limpiador facial en gel', marca: 'Rubí Skin', categoria: 'Limpieza',
    descripcion: 'Gel de limpieza suave con pH balanceado, apto para piel mixta y grasa.',
    precio: 55, stock: 33, imagen: 'img/prod-4.jpg',
    beneficios: ['Retira impurezas sin resecar en exceso', 'Prepara la piel para sérums o cremas', 'Ideal para rutina diaria de mañana y noche'],
    modoUso: ['Aplicar sobre rostro húmedo y masajear por 30 segundos', 'Enjuagar con agua y secar sin friccionar'],
    recomendaciones: ['Evitar el contacto con los ojos', 'Si hay ardor, retirar con abundante agua'],
    activo: true
  },
  {
    id: 5, nombre: 'Ampolla de ácido hialurónico', marca: 'Biocare', categoria: 'Sérums',
    descripcion: 'Hidratación intensiva en formato ampolla, ideal para tratamientos de 15 días.',
    precio: 45, stock: 6, imagen: 'img/prod-5.jpg',
    beneficios: ['Hidratación intensiva de rápida absorción', 'Ayuda a mejorar elasticidad superficial', 'Acompaña tratamientos faciales de luminosidad'],
    modoUso: ['Aplicar sobre piel limpia antes de la crema', 'Usar de noche o según indicación de la especialista'],
    recomendaciones: ['Conservar en lugar fresco', 'No compartir el aplicador para evitar contaminación'],
    activo: true
  },
  {
    id: 6, nombre: 'Kit post tratamiento corporal', marca: 'Rubí Body', categoria: 'Kits',
    descripcion: 'Incluye gel reductor, aceite de masaje y venda fría para uso en casa.',
    precio: 160, precioAntes: 200, stock: 0, imagen: 'img/prod-6.jpg',
    beneficios: ['Apoya el cuidado en casa luego de protocolos corporales', 'Ayuda a mantener sensación de firmeza y frescura', 'Incluye productos complementarios para rutina corporal'],
    modoUso: ['Aplicar el gel según indicación y masajear la zona', 'Usar la venda fría solo por el tiempo recomendado'],
    recomendaciones: ['No aplicar sobre heridas o irritación', 'Consultar si hay embarazo, lactancia o condición médica activa'],
    activo: true
  }
];

/* ============================================================ PACIENTES === */

export const PACIENTES: Paciente[] = [
  { id: 1, nombre: 'María', apellido: 'López Rivera', dni: '74859632', celular: '987 654 321', correo: 'maria.lopez@gmail.com', fechaRegistro: '2025-11-14', observaciones: 'Piel sensible. Evitar ácidos fuertes.', citasTotales: 12, ultimaVisita: '2026-07-28', totalGastado: 1840 },
  { id: 2, nombre: 'Carla', apellido: 'Ruiz Medina', dni: '70541289', celular: '956 220 118', correo: 'carla.ruiz@hotmail.com', fechaRegistro: '2026-01-08', observaciones: 'Prefiere horarios de tarde.', citasTotales: 6, ultimaVisita: '2026-08-02', totalGastado: 980 },
  { id: 3, nombre: 'Ana', apellido: 'Torres Palacios', dni: '46718230', celular: '921 445 907', correo: 'ana.torres@gmail.com', fechaRegistro: '2025-09-22', observaciones: '', citasTotales: 9, ultimaVisita: '2026-07-19', totalGastado: 1520 },
  { id: 4, nombre: 'Gabriela', apellido: 'Sánchez Cruz', dni: '73920145', celular: '900 331 762', correo: 'gaby.sanchez@gmail.com', fechaRegistro: '2026-03-02', observaciones: 'Alergia a la lidocaína.', citasTotales: 4, ultimaVisita: '2026-08-05', totalGastado: 640 },
  { id: 5, nombre: 'Rosa', apellido: 'Huamán Ríos', dni: '09823471', celular: '975 118 430', correo: 'rosa.huaman@gmail.com', fechaRegistro: '2025-06-11', observaciones: 'Cliente frecuente de HIFU.', citasTotales: 15, ultimaVisita: '2026-08-08', totalGastado: 3260 },
  { id: 6, nombre: 'Jimena', apellido: 'Paredes Soto', dni: '71230984', celular: '933 907 221', correo: 'jimena.paredes@gmail.com', fechaRegistro: '2026-05-19', observaciones: '', citasTotales: 3, ultimaVisita: '2026-07-30', totalGastado: 410 },
  { id: 7, nombre: 'Fiorella', apellido: 'Castro Vera', dni: '75612390', celular: '918 662 054', correo: 'fiorella.castro@gmail.com', fechaRegistro: '2026-02-27', observaciones: 'Solicita boleta electrónica.', citasTotales: 7, ultimaVisita: '2026-08-01', totalGastado: 1130 },
  { id: 8, nombre: 'Diana', apellido: 'Quiroz Alva', dni: '44982017', celular: '964 773 508', correo: 'diana.quiroz@gmail.com', fechaRegistro: '2025-12-05', observaciones: '', citasTotales: 8, ultimaVisita: '2026-07-25', totalGastado: 1690 },
  { id: 9, nombre: 'Sandra', apellido: 'Delgado Pinto', dni: '72004518', celular: '981 230 664', correo: 'sandra.delgado@gmail.com', fechaRegistro: '2026-06-30', observaciones: 'Primera vez en aparatología.', citasTotales: 2, ultimaVisita: '2026-08-06', totalGastado: 300 },
  { id: 10, nombre: 'Verónica', apellido: 'Aliaga Núñez', dni: '43127865', celular: '947 880 213', correo: 'veronica.aliaga@gmail.com', fechaRegistro: '2025-10-17', observaciones: 'Deriva pacientes con frecuencia.', citasTotales: 11, ultimaVisita: '2026-08-09', totalGastado: 2410 }
];

/* ============================================================= USUARIOS === */

/** Cuentas de demostración del prototipo. No representan credenciales reales. */
export const USUARIOS: Usuario[] = [
  {
    id: 1, nombre: 'Rubí', apellido: 'Salazar', dni: '41250983', celular: '945 189 720',
    correo: 'admin@rubiestetica.pe', clave: 'rubi2026', rol: 'Administrador', localId: 1
  },
  {
    id: 2, nombre: 'María', apellido: 'López Rivera', dni: '74859632', celular: '987 654 321',
    correo: 'maria.lopez@gmail.com', clave: 'maria123', rol: 'Paciente', pacienteId: 1
  },
  {
    id: 3, nombre: 'Rosa', apellido: 'Huamán Ríos', dni: '09823471', celular: '975 118 430',
    correo: 'rosa.huaman@gmail.com', clave: 'rosa123', rol: 'Paciente', pacienteId: 5
  }
];

/* ================================================================ CITAS === */

const HOY = new Date();

export function aISO(d: Date): string {
  const mes = `${d.getMonth() + 1}`.padStart(2, '0');
  const dia = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function conDias(dias: number): string {
  const d = new Date(HOY);
  d.setDate(d.getDate() + dias);
  return aISO(d);
}

function sumarMinutos(hora: string, minutos: number): string {
  const [h, m] = hora.split(':').map(Number);
  const total = h * 60 + m + minutos;
  return `${`${Math.floor(total / 60)}`.padStart(2, '0')}:${`${total % 60}`.padStart(2, '0')}`;
}

interface SemillaCita {
  d: number; hora: string; pac: number; trat: number; loc: number;
  /** Solo las citas ya atendidas o en proceso tienen especialista y cabina. */
  esp?: number; hab?: number;
  estado: EstadoCita; pago: EstadoPago; metodo?: MetodoPago; pagadoParcial?: number;
  origen: 'Web' | 'Recepción' | 'WhatsApp'; por: string; notas?: string;
}

/**
 * Las citas se agendan por bloque horario. El bloque de 09:00 de la sede 1 llega
 * al cupo para mostrar como el sistema cierra esa hora y ofrece la siguiente.
 */
const SEMILLAS: SemillaCita[] = [];

function nombreTratamiento(id: number): Tratamiento {
  return TRATAMIENTOS.find(t => t.id === id)!;
}

export const CITAS: Cita[] = SEMILLAS.map((s, i) => {
  const trat = nombreTratamiento(s.trat);
  const bloqueo = trat.duracionMin + trat.limpiezaMin;
  const pagado = s.pago === 'Pagado' ? trat.precio
    : s.pagadoParcial ?? 0;
  return {
    id: i + 1,
    codigo: `CT-${(1000 + i + 1)}`,
    fecha: conDias(s.d),
    horaInicio: s.hora,
    horaFin: sumarMinutos(s.hora, bloqueo),
    pacienteId: s.pac,
    tratamientoId: s.trat,
    especialistaId: s.esp,
    localId: s.loc,
    habitacionId: s.hab,
    estado: s.estado,
    estadoPago: s.pago,
    metodoPago: s.metodo,
    montoTotal: trat.precio,
    montoPagado: pagado,
    registradaPor: s.por,
    registradaEl: `${conDias(s.d - 3)} 18:42`,
    confirmadaPor: s.pago === 'Pagado' ? (s.metodo === 'Izipay' ? 'Izipay (automático)' : s.por) : undefined,
    codigoOperacion: s.pago === 'Pagado' ? `OP-${480000 + i * 137}` : undefined,
    pagadaEl: s.pago === 'Pagado' ? `${conDias(s.d)} ${s.hora}` : undefined,
    origen: s.origen,
    notas: s.notas
  };
});

/* ============================================================== PEDIDOS === */

export const PEDIDOS: Pedido[] = [
  { id: 1, codigo: 'PD-2041', fecha: conDias(0), dni: '74859632', nombre: 'María', apellido: 'López Rivera', cliente: 'María López Rivera', celular: '987 654 321', items: [{ productoId: 1, cantidad: 1 }, { productoId: 2, cantidad: 1 }], entrega: 'Recojo en Sede Las Flores 1522', estado: 'Nuevo pedido', estadoPago: 'Pagado', metodoPago: 'Izipay', total: 164, pagado: 164, codigoOperacion: 'OP-512340' },
  { id: 2, codigo: 'PD-2040', fecha: conDias(0), dni: '70231458', nombre: 'Sandra', apellido: 'Delgado Pinto', cliente: 'Sandra Delgado Pinto', celular: '981 230 664', items: [{ productoId: 5, cantidad: 3 }], entrega: 'Recojo en Sede Las Flores 1544', estado: 'En preparación', estadoPago: 'Pagado', metodoPago: 'Izipay', total: 135, pagado: 135, codigoOperacion: 'OP-512299', responsableEntrega: 'Recepción · Milagros' },
  { id: 3, codigo: 'PD-2039', fecha: conDias(-1), dni: '45190672', nombre: 'Fiorella', apellido: 'Castro Vera', cliente: 'Fiorella Castro Vera', celular: '918 662 054', items: [{ productoId: 3, cantidad: 1 }], entrega: 'Recojo en Sede Las Flores 1544', estado: 'Listo para entregar', estadoPago: 'Pagado', metodoPago: 'Efectivo', total: 135, pagado: 135, codigoOperacion: 'OP-512210', responsableEntrega: 'Recepción · Jazmín' },
  { id: 4, codigo: 'PD-2038', fecha: conDias(-1), dni: '74810022', nombre: 'Rosa', apellido: 'Huamán Ríos', cliente: 'Rosa Huamán Ríos', celular: '975 118 430', items: [{ productoId: 4, cantidad: 2 }, { productoId: 2, cantidad: 1 }], entrega: 'Recojo en Sede Las Flores 1522', estado: 'Entregado', estadoPago: 'Pagado', metodoPago: 'Efectivo', total: 185, pagado: 185, codigoOperacion: 'OP-512188', responsableEntrega: 'Recepción · Milagros', entregadoEl: `${conDias(-1)} 17:40` },
  { id: 5, codigo: 'PD-2037', fecha: conDias(-2), dni: '70551129', nombre: 'Jimena', apellido: 'Paredes Soto', cliente: 'Jimena Paredes Soto', celular: '933 907 221', items: [{ productoId: 6, cantidad: 1 }], entrega: 'Recojo en Sede Las Flores 1522', estado: 'Cancelado', estadoPago: 'Reembolsado', metodoPago: 'Izipay', total: 160, pagado: 0 },
  { id: 6, codigo: 'PD-2036', fecha: conDias(-3), dni: '69045021', nombre: 'Diana', apellido: 'Quiroz Alva', cliente: 'Diana Quiroz Alva', celular: '964 773 508', items: [{ productoId: 1, cantidad: 2 }], entrega: 'Recojo en Sede Las Flores 1522', estado: 'Entregado', estadoPago: 'Pagado', metodoPago: 'Izipay', total: 178, pagado: 178, codigoOperacion: 'OP-512041', responsableEntrega: 'Recepción · Jazmín', entregadoEl: `${conDias(-3)} 12:10` }
];

/* ================================================================ PAGOS === */

export const PAGOS: MovimientoPago[] = [
  { id: 1, fecha: conDias(0), hora: '09:58', concepto: 'Limpieza facial profunda · María López', referencia: 'CT-1001', origen: 'Cita', metodo: 'Izipay', canal: 'Online', estado: 'Pagado', monto: 120, localId: 1, registradoPor: 'Izipay (automático)', codigoOperacion: 'OP-480137' },
  { id: 2, fecha: conDias(0), hora: '10:04', concepto: 'HIFU 25D facial · Rosa Huamán', referencia: 'CT-1002', origen: 'Cita', metodo: 'Izipay', canal: 'Online', estado: 'Pagado', monto: 350, localId: 1, registradoPor: 'Izipay (automático)', codigoOperacion: 'OP-480274' },
  { id: 3, fecha: conDias(0), hora: '11:12', concepto: 'Pedido PD-2041 · 2 productos', referencia: 'PD-2041', origen: 'Producto', metodo: 'Izipay', canal: 'Online', estado: 'Pagado', monto: 164, localId: 1, registradoPor: 'Izipay (automático)', codigoOperacion: 'OP-512340' },
  { id: 4, fecha: conDias(0), hora: '15:20', concepto: 'Botox full face · Verónica Aliaga', referencia: 'CT-1006', origen: 'Cita', metodo: 'Izipay', canal: 'Online', estado: 'Pagado', monto: 700, localId: 1, registradoPor: 'Izipay (automático)', codigoOperacion: 'OP-480822' },
  { id: 5, fecha: conDias(0), hora: '17:35', concepto: 'Radiofrecuencia facial · Fiorella Castro', referencia: 'CT-1008', origen: 'Cita', metodo: 'Efectivo', canal: 'Recepción', estado: 'Pagado', monto: 160, localId: 2, registradoPor: 'Recepción · Jazmín', codigoOperacion: 'EF-88214' },
  { id: 6, fecha: conDias(0), hora: '11:45', concepto: 'Peeling facial · Carla Ruiz', referencia: 'CT-1003', origen: 'Cita', metodo: 'Efectivo', canal: 'Recepción', estado: 'Pendiente', monto: 180, localId: 1, registradoPor: 'Recepción · Milagros', codigoOperacion: '—' },
  { id: 7, fecha: conDias(0), hora: '18:10', concepto: 'Reembolso limpieza facial · Jimena Paredes', referencia: 'CT-1009', origen: 'Cita', metodo: 'Izipay', canal: 'Online', estado: 'Reembolsado', monto: -120, localId: 2, registradoPor: 'Administración', codigoOperacion: 'RB-480901' },
  { id: 8, fecha: conDias(-1), hora: '09:40', concepto: 'Limpieza facial profunda · Diana Quiroz', referencia: 'CT-1010', origen: 'Cita', metodo: 'Izipay', canal: 'Online', estado: 'Pagado', monto: 120, localId: 1, registradoPor: 'Izipay (automático)', codigoOperacion: 'OP-481038' },
  { id: 9, fecha: conDias(-1), hora: '11:20', concepto: 'Lifting 360° Tens Booster · Ana Torres', referencia: 'CT-1011', origen: 'Cita', metodo: 'Efectivo', canal: 'Recepción', estado: 'Pagado', monto: 499, localId: 1, registradoPor: 'Recepción · Milagros', codigoOperacion: 'EF-77120' },
  { id: 10, fecha: conDias(-1), hora: '15:05', concepto: 'Drenaje linfático · Rosa Huamán', referencia: 'CT-1012', origen: 'Cita', metodo: 'Efectivo', canal: 'Recepción', estado: 'Pagado', monto: 90, localId: 2, registradoPor: 'Recepción · Jazmín', codigoOperacion: 'EF-00912' }
];

/* ========================================================= PROMOCIONES === */

/**
 * Promociones de ejemplo. En el panel se crean, editan y eliminan; las marcadas
 * como destacadas alimentan el carrusel de la pagina de inicio.
 */
export const PROMOCIONES: Promocion[] = [
  {
    id: 1,
    titulo: 'Combo lifting facial Botox + HIFU 25D',
    subtitulo: 'Reafirmacion facial y suavizado de lineas de expresion',
    descripcion: 'Incluye HIFU 25D para redefinir el contorno facial y Botox full face aplicado por medico estetico. Ideal para un efecto lifting sin cirugia con seguimiento profesional.',
    categoria: 'Facial',
    precioAntes: 1500,
    precio: 850,
    sesiones: 2,
    sesionesDetalle: [
      { titulo: 'Sesion 1 · HIFU 25D facial', descripcion: 'Reafirma y redefine el contorno facial.', tratamientoId: 2 },
      { titulo: 'Sesion 2 · Botox full face', descripcion: 'Suaviza lineas de expresion y brinda una apariencia mas descansada.', tratamientoId: 3 }
    ],
    vigenciaDesde: conDias(-10),
    vigenciaHasta: conDias(35),
    imagen: 'img/promo-botox-hifu.jpg',
    etiqueta: 'Combo lifting',
    destacada: true,
    activa: true
  },
  {
    id: 2,
    titulo: 'Reduce medidas y redefine tu silueta',
    subtitulo: 'Hidrolipoclasia + 2 sesiones de drenaje linfatico',
    descripcion: 'Promo corporal inspirada en el catalogo de Instagram: trabaja grasa localizada, favorece la eliminacion de liquidos y mejora el contorno corporal.',
    categoria: 'Corporal',
    precioAntes: 450,
    precio: 300,
    sesiones: 3,
    sesionesDetalle: [
      { titulo: 'Sesion 1 · Hidrolipoclasia', descripcion: 'Ayuda a trabajar grasa localizada y mejorar el contorno corporal.', tratamientoId: 5 },
      { titulo: 'Sesion 2 · Drenaje linfatico', descripcion: 'Favorece la eliminacion de liquidos y complementa el tratamiento.', tratamientoId: 6 },
      { titulo: 'Sesion 3 · Drenaje linfatico', descripcion: 'Refuerza la desinflamacion y el modelamiento corporal.', tratamientoId: 6 }
    ],
    vigenciaDesde: conDias(-5),
    vigenciaHasta: conDias(25),
    imagen: 'img/promo-reduce-medidas.jpg',
    etiqueta: 'Corporal',
    destacada: true,
    activa: true
  },
  {
    id: 3,
    titulo: 'HIFU 25D + PDRN de salmon',
    subtitulo: 'Lifting + regeneracion en un solo tratamiento',
    descripcion: 'Combinacion facial para reafirmar, revitalizar y favorecer una piel mas luminosa. Inspirada en las promociones publicadas en Instagram.',
    categoria: 'Aparatología',
    precioAntes: 700,
    precio: 399,
    sesiones: 1,
    sesionesDetalle: [
      { titulo: 'Sesion unica · HIFU 25D + PDRN', descripcion: 'Reafirmacion facial con protocolo regenerativo para mejorar firmeza y luminosidad.', tratamientoId: 2 }
    ],
    vigenciaDesde: conDias(-2),
    vigenciaHasta: conDias(20),
    imagen: 'img/promo-hifu-pdrn.jpg',
    etiqueta: 'Facial premium',
    destacada: true,
    activa: true
  },
  {
    id: 4,
    titulo: 'Lifting 360 HIFU 25D + Tens Booster',
    subtitulo: 'Reafirma, redefine e ilumina tu piel',
    descripcion: 'La combinacion perfecta para mejorar firmeza y elasticidad con efecto tensor. Ideal para pieles que buscan luminosidad y definicion.',
    categoria: 'Aparatología',
    precioAntes: 800,
    precio: 499,
    sesiones: 1,
    sesionesDetalle: [
      { titulo: 'Sesion unica · Lifting 360', descripcion: 'HIFU 25D combinado con Tens Booster para un efecto tensor y reafirmante.', tratamientoId: 10 }
    ],
    vigenciaDesde: conDias(-20),
    vigenciaHasta: conDias(10),
    imagen: 'img/promo-lifting-360.jpg',
    etiqueta: 'Promocion facial',
    destacada: true,
    activa: true
  },
  {
    id: 5,
    titulo: 'HIFU 25D + coctel reafirmante',
    subtitulo: 'Reafirma y redefine el contorno facial',
    descripcion: 'Protocolo facial para mejorar firmeza, definir el rostro y favorecer una piel mas renovada.',
    categoria: 'Aparatología',
    precioAntes: 550,
    precio: 350,
    sesiones: 1,
    sesionesDetalle: [
      { titulo: 'Sesion unica · HIFU 25D + coctel', descripcion: 'Reafirma, redefine y revitaliza la piel en un solo protocolo.', tratamientoId: 2 }
    ],
    vigenciaDesde: conDias(-8),
    vigenciaHasta: conDias(18),
    imagen: 'img/promo-hifu-coctel.jpg',
    etiqueta: 'Reafirmante',
    destacada: true,
    activa: true
  },
  {
    id: 6,
    titulo: 'Tens Booster efecto lifting',
    subtitulo: 'Firmeza, elasticidad y luminosidad desde la primera sesion',
    descripcion: 'Tratamiento reafirmante de efecto tensor inmediato para recuperar firmeza y luminosidad.',
    categoria: 'Aparatología',
    precioAntes: 450,
    precio: 299,
    sesiones: 1,
    sesionesDetalle: [
      { titulo: 'Sesion unica · Tens Booster', descripcion: 'Solucion tensora reafirmante facial para un efecto lifting visible.', tratamientoId: 10 }
    ],
    vigenciaDesde: conDias(-8),
    vigenciaHasta: conDias(18),
    imagen: 'img/promo-tens-booster.jpg',
    etiqueta: 'Efecto lifting',
    destacada: true,
    activa: true
  },
  {
    id: 7,
    titulo: 'Limpieza facial profunda',
    subtitulo: 'Purifica, ilumina e hidrata tu piel',
    descripcion: 'Promo facial para renovar la piel, retirar impurezas y devolver luminosidad con protocolo profesional.',
    categoria: 'Facial',
    precioAntes: 120,
    precio: 90,
    sesiones: 1,
    sesionesDetalle: [
      { titulo: 'Sesion unica · Limpieza profunda', descripcion: 'Purificacion, hidratacion y proteccion para una piel mas luminosa.', tratamientoId: 1 }
    ],
    vigenciaDesde: conDias(-8),
    vigenciaHasta: conDias(18),
    imagen: 'img/promo-limpieza-profunda.jpg',
    etiqueta: 'Facial',
    destacada: true,
    activa: true
  },
  {
    id: 8,
    titulo: 'Plasma rico en plaquetas + colageno',
    subtitulo: 'Regeneracion facial y luminosidad',
    descripcion: 'Promo regenerativa para estimular colageno, mejorar textura y devolver luminosidad a la piel.',
    categoria: 'Medicina estética',
    precioAntes: 200,
    precio: 100,
    sesiones: 1,
    sesionesDetalle: [
      { titulo: 'Sesion unica · Plasma + colageno', descripcion: 'Aplicacion regenerativa para firmeza, textura y luminosidad facial.', tratamientoId: 4 }
    ],
    vigenciaDesde: conDias(-8),
    vigenciaHasta: conDias(18),
    imagen: 'img/promo-plasma-colageno.jpg',
    etiqueta: 'Regenerativo',
    destacada: true,
    activa: true
  }
];

/* =================================================== PLANES MULTISESION === */

/**
 * Planes de sesiones personalizadas. Cada plan pertenece a una paciente
 * identificada por DNI y avanza sesion por sesion con el intervalo de dias que
 * indique la especialista.
 */
export const PLANES: PlanSesiones[] = [];

/* ============================================================= AYUDANTES == */

export const CATEGORIAS_PRODUCTO = ['Todos', ...Array.from(new Set(PRODUCTOS.map(p => p.categoria)))];
export const CATEGORIAS_TRATAMIENTO = ['Todos', ...Array.from(new Set(TRATAMIENTOS.map(t => t.categoria)))];
export const ETIQUETAS_TRATAMIENTO = Array.from(
  new Set(TRATAMIENTOS.flatMap(t => t.etiquetas))
).sort((a, b) => a.localeCompare(b));

export function tratamientoPorId(id: number): Tratamiento | undefined {
  return TRATAMIENTOS.find(t => t.id === id);
}
export function productoPorId(id: number): Producto | undefined {
  return PRODUCTOS.find(p => p.id === id);
}
export function especialistaPorId(id?: number): Especialista | undefined {
  return ESPECIALISTAS.find(e => e.id === id);
}
export function localPorId(id: number): Local | undefined {
  return LOCALES.find(l => l.id === id);
}
export function habitacionPorId(id?: number): Habitacion | undefined {
  return HABITACIONES.find(h => h.id === id);
}
export function pacientePorId(id: number): Paciente | undefined {
  return PACIENTES.find(p => p.id === id);
}
export function nombrePaciente(id: number): string {
  const p = pacientePorId(id);
  return p ? `${p.nombre} ${p.apellido}` : '—';
}
/** Las citas sin especialista se asignan en el local al momento de atender. */
export function nombreEspecialista(id?: number): string {
  const e = especialistaPorId(id);
  return e ? `${e.nombre} ${e.apellido}` : 'Se asigna al llegar';
}

export function nombreCabina(id?: number): string {
  const h = habitacionPorId(id);
  return h ? h.nombre : 'Se asigna al llegar';
}

export const HOY_ISO = aISO(HOY);
export const FECHA_HOY = HOY;

export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
export const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function formatoFechaLarga(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  const fecha = new Date(a, m - 1, d);
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return `${dias[fecha.getDay()]} ${d} de ${MESES[m - 1]} de ${a}`;
}

export function soles(monto: number): string {
  const signo = monto < 0 ? '-' : '';
  return `${signo}S/ ${Math.abs(monto).toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
