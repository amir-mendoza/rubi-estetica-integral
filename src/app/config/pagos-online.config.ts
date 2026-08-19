import { ModoPagoOnline } from '../data/pagos-online.modelos';

export const PAGOS_ONLINE_CONFIG = {
  proveedor: 'Izipay',
  /**
   * mock: simula el cobro en Angular mientras no existe Spring Boot.
   * sandbox: Spring Boot genera token de sesion y el frontend abre checkout sandbox.
   * produccion: Spring Boot genera token real y el frontend abre checkout productivo.
   */
  modo: 'mock' as ModoPagoOnline,
  apiBaseUrl: '/api',
  endpoints: {
    crearSesion: '/pagos/izipay/sesion',
    confirmarFrontend: '/pagos/izipay/confirmacion-frontend'
  },
  sdk: {
    sandbox: 'https://sandbox-checkout.izipay.pe/payments/v1/js/index.js',
    produccion: 'https://checkout.izipay.pe/payments/v1/js/index.js'
  },
  keyRSAPlaceholder: 'PENDIENTE_KEY_RSA_PUBLICA_DE_IZIPAY'
};
