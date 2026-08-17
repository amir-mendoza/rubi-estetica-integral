/**
 * Modelos del prototipo. Reflejan la estructura pensada para la base de datos
 * MySQL de la primera etapa (y dejan espacio para la sincronizacion offline
 * de la segunda etapa: uuidGlobal, localId, timestamps).
 */

/**
 * La cita se agenda por bloque horario: la paciente reserva la hora en la que
 * piensa llegar y en recepcion se controla su avance con estos estados.
 */
export type EstadoCita =
  | 'Programada'
  | 'En proceso'
  | 'Atendida'
  | 'No asistió'
  | 'Cancelada'
  | 'Reprogramada';

export const ESTADOS_CITA: EstadoCita[] = [
  'Programada', 'En proceso', 'Atendida', 'No asistió', 'Cancelada', 'Reprogramada'
];

export type EstadoPago =
  | 'Pendiente'
  | 'Pagado'
  | 'Pago en local'
  | 'Fallido'
  | 'Reembolsado';

export type MetodoPago = 'Izipay' | 'Efectivo' | 'Yape' | 'Tarjeta POS' | 'Transferencia';

export type EstadoPedido =
  | 'Pendiente'
  | 'Pagado'
  | 'Preparando'
  | 'Listo para recojo'
  | 'Entregado'
  | 'Cancelado';

export type EstadoSlot =
  | 'Disponible'
  | 'Bloqueado temporalmente'
  | 'Confirmado'
  | 'Pagado'
  | 'Cancelado'
  | 'Liberado';

export type EntregaPedido =
  | 'Recojo en Sede Las Flores 1522'
  | 'Recojo en Sede Las Flores 1544';

export interface Local {
  id: number;
  uuidGlobal: string;
  nombre: string;
  direccion: string;
  referencia: string;
  distrito: string;
  telefono: string;
  horario: { dias: string; apertura: string; cierre: string }[];
  imagen: string;
  mapa: string;
  latitud: number;
  longitud: number;
  activo: boolean;
}

/** Familias de tratamiento que se usan como filtros rapidos en la web. */
export type CategoriaTratamiento =
  | 'Facial'
  | 'Corporal'
  | 'Aparatología'
  | 'Medicina estética';

export interface Habitacion {
  id: number;
  nombre: string;
  localId: number;
  equipamiento: string;
  activa: boolean;
}

export interface Especialista {
  id: number;
  nombre: string;
  apellido: string;
  especialidad: string;
  colegiatura: string;
  bio: string;
  foto: string;
  locales: number[];
  tratamientos: number[];
  horario: string;
  activa: boolean;
}

export interface Tratamiento {
  id: number;
  nombre: string;
  categoria: CategoriaTratamiento;
  /** Etiquetas de filtro rapido: limpieza, hidratación, reafirmante, etc. */
  etiquetas: string[];
  resumen: string;
  descripcion: string;
  beneficios: string[];
  recomendaciones: string[];
  duracionMin: number;
  limpiezaMin: number;
  precio: number;
  precioAntes?: number;
  imagen: string;
  destacado: boolean;
  activo: boolean;
}

export interface Producto {
  id: number;
  nombre: string;
  marca: string;
  categoria: string;
  descripcion: string;
  precio: number;
  precioAntes?: number;
  stock: number;
  imagen: string;
  activo: boolean;
}

export interface Paciente {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  celular: string;
  correo: string;
  fechaRegistro: string;
  observaciones: string;
  citasTotales: number;
  ultimaVisita: string;
  totalGastado: number;
}

export interface Cita {
  id: number;
  codigo: string;
  fecha: string;          // YYYY-MM-DD
  horaInicio: string;     // HH:mm
  horaFin: string;        // HH:mm
  pacienteId: number;
  tratamientoId: number;
  /** Se asigna en el local al momento de la atencion, no al reservar. */
  especialistaId?: number;
  localId: number;
  /** Se asigna en el local al momento de la atencion, no al reservar. */
  habitacionId?: number;
  estado: EstadoCita;
  estadoPago: EstadoPago;
  metodoPago?: MetodoPago;
  montoTotal: number;
  montoPagado: number;
  registradaPor: string;
  registradaEl: string;
  confirmadaPor?: string;
  codigoOperacion?: string;
  pagadaEl?: string;
  origen: 'Web' | 'Recepción' | 'WhatsApp';
  notas?: string;
}

export interface Pedido {
  id: number;
  codigo: string;
  fecha: string;
  cliente: string;
  celular: string;
  items: { productoId: number; cantidad: number }[];
  entrega: EntregaPedido;
  estado: EstadoPedido;
  estadoPago: EstadoPago;
  metodoPago?: MetodoPago;
  total: number;
  pagado: number;
  codigoOperacion?: string;
}

export type RolUsuario = 'Administrador' | 'Recepcionista' | 'Especialista' | 'Paciente';

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  celular: string;
  correo: string;
  clave: string;
  rol: RolUsuario;
  pacienteId?: number;
  localId?: number;
}

/**
 * Promocion publicada desde el panel. Las destacadas alimentan el carrusel de
 * la pagina de inicio.
 */
export interface Promocion {
  id: number;
  titulo: string;
  subtitulo: string;
  descripcion: string;
  categoria: CategoriaTratamiento | 'General';
  precioAntes?: number;
  precio?: number;
  sesiones?: number;
  sesionesDetalle?: { titulo: string; descripcion: string; tratamientoId?: number }[];
  vigenciaDesde: string;
  vigenciaHasta: string;
  imagen: string;
  etiqueta: string;
  destacada: boolean;
  activa: boolean;
}

/** Avance de una sesion dentro de un plan multisesion. */
export type EstadoSesion =
  | 'Pendiente'
  | 'Programada'
  | 'En proceso'
  | 'Atendida'
  | 'No asistió'
  | 'Reprogramada';

export const ESTADOS_SESION: EstadoSesion[] = [
  'Pendiente', 'Programada', 'En proceso', 'Atendida', 'No asistió', 'Reprogramada'
];

export interface SesionPlan {
  numero: number;
  tratamientoId: number;
  /** Nombre del procedimiento de esa sesion: limpieza, skin care, peeling, etc. */
  procedimiento: string;
  fecha?: string;
  estado: EstadoSesion;
  observaciones?: string;
}

export type EstadoPlan = 'En curso' | 'Finalizado' | 'Pausado';

/**
 * Plan de sesiones personalizadas de una paciente: se identifica por DNI y cada
 * sesion se programa cada cierto numero de dias segun indique la especialista.
 */
export interface PlanSesiones {
  id: number;
  codigo: string;
  pacienteId: number;
  dni: string;
  nombre: string;
  localId: number;
  /** Dias entre una sesion y la siguiente (15, 30, etc.). */
  intervaloDias: number;
  inicio: string;
  precioTotal: number;
  pagado: number;
  estado: EstadoPlan;
  sesiones: SesionPlan[];
  notas?: string;
}

export interface MovimientoPago {
  id: number;
  fecha: string;
  hora: string;
  concepto: string;
  referencia: string;
  origen: 'Cita' | 'Producto';
  metodo: MetodoPago;
  canal: 'Online' | 'En local';
  estado: EstadoPago;
  monto: number;
  localId: number;
  registradoPor: string;
  codigoOperacion: string;
}
