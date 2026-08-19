import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, delay, of, switchMap, throwError } from 'rxjs';
import { PAGOS_ONLINE_CONFIG } from '../config/pagos-online.config';
import {
  ResultadoPagoOnline,
  SesionPagoOnline,
  SolicitudPagoOnline
} from '../data/pagos-online.modelos';

declare global {
  interface Window {
    Izipay?: new (args: unknown) => { LoadForm(args: unknown): void };
  }
}

@Injectable({ providedIn: 'root' })
export class PagosOnlineService {
  private http = inject(HttpClient);
  private sdkCargado?: Promise<void>;

  iniciarPago(solicitud: SolicitudPagoOnline): Observable<ResultadoPagoOnline> {
    if (PAGOS_ONLINE_CONFIG.modo === 'mock') {
      return this.simularPago(solicitud);
    }

    return this.crearSesion(solicitud).pipe(
      switchMap(sesion => this.abrirCheckoutIzipay(solicitud, sesion)),
      catchError(error => throwError(() => ({
        proveedor: 'Izipay',
        referencia: solicitud.referencia,
        estado: 'Error',
        aprobado: false,
        mensaje: 'No se pudo iniciar el pago online. Intenta nuevamente o elige pago en local.',
        raw: error
      } satisfies ResultadoPagoOnline)))
    );
  }

  crearSesion(solicitud: SolicitudPagoOnline): Observable<SesionPagoOnline> {
    const url = `${PAGOS_ONLINE_CONFIG.apiBaseUrl}${PAGOS_ONLINE_CONFIG.endpoints.crearSesion}`;
    return this.http.post<SesionPagoOnline>(url, solicitud);
  }

  confirmarDesdeFrontend(resultado: ResultadoPagoOnline): Observable<ResultadoPagoOnline> {
    if (PAGOS_ONLINE_CONFIG.modo === 'mock') { return of(resultado); }
    const url = `${PAGOS_ONLINE_CONFIG.apiBaseUrl}${PAGOS_ONLINE_CONFIG.endpoints.confirmarFrontend}`;
    return this.http.post<ResultadoPagoOnline>(url, resultado);
  }

  private simularPago(solicitud: SolicitudPagoOnline): Observable<ResultadoPagoOnline> {
    const codigo = `IZI-${Date.now().toString().slice(-8)}`;
    return of({
      proveedor: 'Izipay',
      referencia: solicitud.referencia,
      estado: 'Aprobado',
      aprobado: true,
      codigoOperacion: codigo,
      transactionId: `TX-${codigo}`,
      orderNumber: solicitud.referencia,
      mensaje: 'Pago simulado aprobado. Listo para reemplazar por Izipay sandbox cuando exista Spring Boot.',
      raw: { modo: 'mock', solicitud }
    } satisfies ResultadoPagoOnline).pipe(delay(850));
  }

  private abrirCheckoutIzipay(
    solicitud: SolicitudPagoOnline,
    sesion: SesionPagoOnline
  ): Observable<ResultadoPagoOnline> {
    return new Observable<ResultadoPagoOnline>(observer => {
      this.cargarSdk()
        .then(() => {
          if (!window.Izipay) {
            throw new Error('SDK de Izipay no disponible en window.Izipay');
          }

          const checkout = new window.Izipay({
            config: {
              transactionId: sesion.transactionId,
              action: 'pay',
              merchantCode: sesion.publicConfig?.['merchantCode'],
              order: {
                orderNumber: sesion.orderNumber,
                currency: sesion.currency,
                amount: Math.round(sesion.amount * 100)
              },
              customer: {
                name: solicitud.cliente.nombre,
                lastName: solicitud.cliente.apellido,
                email: solicitud.cliente.correo,
                phoneNumber: solicitud.cliente.celular,
                documentType: solicitud.cliente.dni ? 'DNI' : undefined,
                document: solicitud.cliente.dni
              }
            }
          });

          checkout.LoadForm({
            authorization: sesion.authorization,
            keyRSA: sesion.keyRSA,
            callbackResponse: (respuesta: unknown) => {
              const resultado = this.mapearRespuestaIzipay(solicitud, sesion, respuesta);
              this.confirmarDesdeFrontend(resultado).subscribe({
                next: confirmado => {
                  observer.next(confirmado);
                  observer.complete();
                },
                error: error => observer.error(error)
              });
            }
          });
        })
        .catch(error => observer.error(error));
    });
  }

  private cargarSdk(): Promise<void> {
    if (this.sdkCargado) { return this.sdkCargado; }

    const src = PAGOS_ONLINE_CONFIG.modo === 'produccion'
      ? PAGOS_ONLINE_CONFIG.sdk.produccion
      : PAGOS_ONLINE_CONFIG.sdk.sandbox;

    this.sdkCargado = new Promise<void>((resolve, reject) => {
      const existente = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
      if (existente) {
        existente.addEventListener('load', () => resolve(), { once: true });
        if (window.Izipay) { resolve(); }
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar el SDK de Izipay'));
      document.head.appendChild(script);
    });

    return this.sdkCargado;
  }

  private mapearRespuestaIzipay(
    solicitud: SolicitudPagoOnline,
    sesion: SesionPagoOnline,
    respuesta: unknown
  ): ResultadoPagoOnline {
    const data = respuesta as Record<string, unknown>;
    const codigo = String(data['code'] ?? data['transactionId'] ?? data['orderNumber'] ?? sesion.transactionId);
    const exitoso = ['00', 'SUCCESS', 'APPROVED', 'PAID'].includes(String(data['status'] ?? data['code'] ?? '').toUpperCase());

    return {
      proveedor: 'Izipay',
      referencia: solicitud.referencia,
      estado: exitoso ? 'Aprobado' : 'Rechazado',
      aprobado: exitoso,
      codigoOperacion: codigo,
      transactionId: sesion.transactionId,
      orderNumber: sesion.orderNumber,
      mensaje: exitoso ? 'Pago aprobado por Izipay.' : 'Izipay no aprobó la transacción.',
      raw: respuesta
    };
  }
}
