import { Injectable, inject } from '@angular/core';
import { ConfiguracionImpresionEquipo, ConfiguracionPanelService } from './configuracion-panel.service';

export interface TrabajoImpresionVoucher {
  codigo: string;
  titulo: string;
  localId: number;
  html: string;
  texto: string;
  abrirEnNavegador: () => void;
}

interface RespuestaAgente {
  ok?: boolean;
  mensaje?: string;
}

@Injectable({ providedIn: 'root' })
export class ImpresionService {
  private readonly configPanel = inject(ConfiguracionPanelService);

  async imprimirVoucher(trabajo: TrabajoImpresionVoucher): Promise<void> {
    const equipo = this.equipoParaLocal(trabajo.localId);
    if (!equipo?.activo || !equipo.imprimirAutomaticamente || equipo.modo === 'navegador') {
      trabajo.abrirEnNavegador();
      return;
    }

    const impreso = await this.enviarAlAgente(equipo, trabajo);
    if (!impreso && equipo.fallbackNavegador) {
      trabajo.abrirEnNavegador();
    }
  }

  async probarEquipo(localId: number): Promise<{ ok: boolean; mensaje: string }> {
    const equipo = this.equipoParaLocal(localId);
    if (!equipo) {
      return { ok: false, mensaje: 'No hay equipo configurado para esta sede.' };
    }
    if (equipo.modo === 'navegador') {
      return { ok: true, mensaje: 'Modo navegador activo. La prueba abrirá la ventana normal de impresión.' };
    }
    const url = this.urlAgente(equipo, '/api/print/test');
    try {
      const respuesta = await this.fetchConTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: 1,
          localId: equipo.localId,
          equipo: equipo.equipo,
          impresoraPrincipal: equipo.impresoraPrincipal,
          impresoraRespaldo: equipo.impresoraRespaldo,
          papel: equipo.papel,
          copias: equipo.copias
        })
      });
      if (!respuesta.ok) {
        return { ok: false, mensaje: `El agente respondió con error ${respuesta.status}.` };
      }
      const cuerpo = await this.leerRespuesta(respuesta);
      return { ok: cuerpo.ok !== false, mensaje: cuerpo.mensaje || 'Prueba enviada al agente local.' };
    } catch {
      return { ok: false, mensaje: 'No se pudo conectar con el agente local de esta computadora.' };
    }
  }

  equipoParaLocal(localId: number): ConfiguracionImpresionEquipo | undefined {
    return this.configPanel.impresion().equipos.find(equipo => equipo.localId === localId)
      ?? this.configPanel.impresion().equipos.find(equipo => equipo.activo);
  }

  private async enviarAlAgente(equipo: ConfiguracionImpresionEquipo, trabajo: TrabajoImpresionVoucher): Promise<boolean> {
    const url = this.urlAgente(equipo, '/api/print/jobs');
    try {
      const respuesta = await this.fetchConTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: 1,
          tipo: 'voucher',
          codigo: trabajo.codigo,
          titulo: trabajo.titulo,
          localId: trabajo.localId,
          equipo: equipo.equipo,
          impresoraPrincipal: equipo.impresoraPrincipal,
          impresoraRespaldo: equipo.usarRespaldoSiFalla ? equipo.impresoraRespaldo : '',
          papel: equipo.papel,
          copias: equipo.copias,
          html: trabajo.html,
          texto: trabajo.texto
        })
      });
      if (!respuesta.ok) { return false; }
      const cuerpo = await this.leerRespuesta(respuesta);
      return cuerpo.ok !== false;
    } catch {
      return false;
    }
  }

  private urlAgente(equipo: ConfiguracionImpresionEquipo, ruta: string): string {
    const base = (equipo.agenteUrl || 'http://127.0.0.1:48531').replace(/\/+$/, '');
    return `${base}${ruta}`;
  }

  private async fetchConTimeout(url: string, init: RequestInit): Promise<Response> {
    const controlador = new AbortController();
    const timeout = window.setTimeout(() => controlador.abort(), 2500);
    try {
      return await fetch(url, { ...init, signal: controlador.signal });
    } finally {
      window.clearTimeout(timeout);
    }
  }

  private async leerRespuesta(respuesta: Response): Promise<RespuestaAgente> {
    try {
      return await respuesta.json() as RespuestaAgente;
    } catch {
      return { ok: respuesta.ok };
    }
  }
}
