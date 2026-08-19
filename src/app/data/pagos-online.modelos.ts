export type ProveedorPagoOnline = 'Izipay';
export type TipoPagoOnline = 'Cita' | 'Producto';
export type EstadoPagoOnline = 'Pendiente' | 'Procesando' | 'Aprobado' | 'Rechazado' | 'Error';
export type ModoPagoOnline = 'mock' | 'sandbox' | 'produccion';

export interface ClientePagoOnline {
  nombre: string;
  apellido?: string;
  dni?: string;
  celular?: string;
  correo?: string;
}

export interface ItemPagoOnline {
  id: number | string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

export interface SolicitudPagoOnline {
  tipo: TipoPagoOnline;
  referencia: string;
  descripcion: string;
  monto: number;
  moneda: 'PEN';
  cliente: ClientePagoOnline;
  items?: ItemPagoOnline[];
  localId?: number;
  metadata?: Record<string, string | number | boolean | null>;
}

/**
 * Respuesta que debe construir Spring Boot consumiendo Izipay.
 * El frontend nunca debe generar credenciales secretas.
 */
export interface SesionPagoOnline {
  proveedor: ProveedorPagoOnline;
  modo: ModoPagoOnline;
  transactionId: string;
  orderNumber: string;
  authorization: string;
  keyRSA: string;
  amount: number;
  currency: 'PEN';
  publicConfig?: Record<string, unknown>;
}

export interface ResultadoPagoOnline {
  proveedor: ProveedorPagoOnline;
  referencia: string;
  estado: EstadoPagoOnline;
  aprobado: boolean;
  codigoOperacion?: string;
  transactionId?: string;
  orderNumber?: string;
  mensaje: string;
  raw?: unknown;
}
