import { Injectable, inject } from '@angular/core';
import { LOCALES, aISO, cabinasDeSede } from '../data/datos';
import { Cita, Local } from '../data/modelos';
import { ConfiguracionPanelService } from './configuracion-panel.service';
import { AgendaService } from './agenda.service';

/**
 * Bloque horario de la agenda. La paciente reserva la hora a la que piensa
 * llegar; la cabina y la especialista se asignan en el local al momento de la
 * atencion.
 */
export interface Bloque {
  inicio: string;
  fin: string;
  cupo: number;
  reservados: number;
  retenidos: number;
  libres: number;
  disponible: boolean;
  motivo?: string;
  retenidoPorMi: boolean;
  vencimientoRetencion?: number;
}

export function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export function aHora(minutos: number): string {
  return `${`${Math.floor(minutos / 60)}`.padStart(2, '0')}:${`${minutos % 60}`.padStart(2, '0')}`;
}

interface RetencionBloque {
  id: string;
  sessionId: string;
  localId: number;
  fechaISO: string;
  inicio: string;
  fin: string;
  expiraEn: number;
  estado: 'retenido' | 'confirmado';
}

const CLAVE_RETENCIONES = 'rubi.retenciones-bloque';
const CLAVE_SESION_RETENCION = 'rubi.retenciones-sesion';

@Injectable({ providedIn: 'root' })
export class DisponibilidadService {
  private configPanel = inject(ConfiguracionPanelService);
  private agenda = inject(AgendaService);
  private sessionId = this.leerSessionId();

  /** Horario del local para la fecha indicada (respetando el horario configurable). */
  horarioDelDia(local: Local, fechaISO: string): { apertura: number; cierre: number } | null {
    const [a, m, d] = fechaISO.split('-').map(Number);
    const dia = new Date(a, m - 1, d).getDay(); // 0 = domingo
    const horarios = this.configPanel.obtenerHorariosLocal(local.id);
    const bloque = horarios.find(h => this.aplicaEnDia(h.dias, dia));
    if (!bloque) { return null; }
    return { apertura: aMinutos(bloque.apertura), cierre: aMinutos(bloque.cierre) };
  }

  citasDe(fechaISO: string, localId: number): Cita[] {
    return this.agenda.citas().filter(c =>
      c.fecha === fechaISO &&
      c.localId === localId &&
      c.estado !== 'Cancelada' &&
      c.estado !== 'No asistió' &&
      c.estado !== 'Atendida'
    );
  }

  cupo(local: Local): number { return this.configPanel.obtenerCupoLocal(local.id); }
  cabinas(local: Local): number { return cabinasDeSede(local.id).length; }

  /**
   * Bloques del dia. Cada bloque acepta hasta 10 pacientes por sede; al llenarse
   * el cupo el bloque se cierra y la paciente pasa a la siguiente hora.
   */
  bloques(fechaISO: string, local: Local): Bloque[] {
    this.limpiarRetenciones();
    const horario = this.horarioDelDia(local, fechaISO);
    if (!horario) { return []; }

    const cupo = this.cupo(local);
    const citas = this.citasDe(fechaISO, local.id);
    const retenciones = this.retencionesActivas().filter(r =>
      r.localId === local.id && r.fechaISO === fechaISO
    );
    const salida: Bloque[] = [];

    const bloqueMin = this.configPanel.agenda().bloqueMin;
    for (let inicio = horario.apertura; inicio + bloqueMin <= horario.cierre; inicio += bloqueMin) {
      const fin = inicio + bloqueMin;
      const reservados = citas.filter(c => {
        const h = aMinutos(c.horaInicio);
        return h >= inicio && h < fin;
      }).length;
      const retenidos = retenciones.filter(r => r.inicio === aHora(inicio)).length;
      const retenidoPropio = retenciones.find(r => r.inicio === aHora(inicio) && r.sessionId === this.sessionId);
      const libres = Math.max(cupo - reservados - retenidos, 0);

      salida.push({
        inicio: aHora(inicio),
        fin: aHora(fin),
        cupo,
        reservados,
        retenidos,
        libres,
        disponible: libres > 0 || !!retenidoPropio,
        motivo: libres > 0 || retenidoPropio ? undefined : 'Cupo completo en esta hora',
        retenidoPorMi: !!retenidoPropio,
        vencimientoRetencion: retenidoPropio?.expiraEn
      });
    }
    return salida;
  }

  /** Próximos días disponibles para el selector de fechas del prototipo. */
  proximosDias(cantidad = 14): { iso: string; dia: number; nombre: string; mes: string; cerrado: boolean }[] {
    const nombres = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const salida = [];
    const hoy = new Date();
    for (let i = 0; i < cantidad; i++) {
      const f = new Date(hoy);
      f.setDate(f.getDate() + i);
      salida.push({
        iso: aISO(f),
        dia: f.getDate(),
        nombre: nombres[f.getDay()],
        mes: meses[f.getMonth()],
        cerrado: !this.horarioDelDia(LOCALES[0], aISO(f))
      });
    }
    return salida;
  }

  retenerBloque(
    fechaISO: string,
    local: Local,
    bloque: Pick<Bloque, 'inicio' | 'fin'>,
    minutos = 8,
    expiraEnForzado?: number
  ):
    { ok: boolean; expiraEn?: number; motivo?: string } {
    this.limpiarRetenciones();
    const bloques = this.bloques(fechaISO, local);
    const objetivo = bloques.find(item => item.inicio === bloque.inicio);
    if (!objetivo || (!objetivo.disponible && !objetivo.retenidoPorMi)) {
      return { ok: false, motivo: 'La hora elegida ya no está disponible.' };
    }

    const retenciones = this.leerRetenciones()
      .filter(r => !(r.sessionId === this.sessionId && r.estado === 'retenido'));

    const expiraEn = expiraEnForzado ?? (Date.now() + minutos * 60_000);
    retenciones.push({
      id: `hold-${this.sessionId}-${local.id}-${fechaISO}-${bloque.inicio}`,
      sessionId: this.sessionId,
      localId: local.id,
      fechaISO,
      inicio: bloque.inicio,
      fin: bloque.fin,
      expiraEn,
      estado: 'retenido'
    });
    this.guardarRetenciones(retenciones);
    return { ok: true, expiraEn };
  }

  extenderRetencionActiva(minutosExtra = 5, expiraEnForzado?: number): { ok: boolean; expiraEn?: number } {
    this.limpiarRetenciones();
    const retenciones = this.leerRetenciones();
    const actual = retenciones.find(r => r.sessionId === this.sessionId && r.estado === 'retenido');
    if (!actual) {
      return { ok: false };
    }
    actual.expiraEn = expiraEnForzado ?? (Date.now() + minutosExtra * 60_000);
    this.guardarRetenciones(retenciones);
    return { ok: true, expiraEn: actual.expiraEn };
  }

  confirmarRetencionActiva(): void {
    this.limpiarRetenciones();
    const retenciones = this.leerRetenciones();
    const actual = retenciones.find(r => r.sessionId === this.sessionId && r.estado === 'retenido');
    if (!actual) { return; }
    actual.estado = 'confirmado';
    actual.expiraEn = Date.now() + 24 * 60 * 60_000;
    this.guardarRetenciones(retenciones);
  }

  liberarRetencionActiva(): void {
    this.guardarRetenciones(
      this.leerRetenciones().filter(r => !(r.sessionId === this.sessionId && r.estado === 'retenido'))
    );
  }

  retencionActiva(): RetencionBloque | null {
    this.limpiarRetenciones();
    return this.leerRetenciones().find(r => r.sessionId === this.sessionId && r.estado === 'retenido') ?? null;
  }

  private retencionesActivas(): RetencionBloque[] {
    return this.leerRetenciones().filter(r => r.estado === 'confirmado' || r.expiraEn > Date.now());
  }

  private limpiarRetenciones(): void {
    this.guardarRetenciones(this.retencionesActivas());
  }

  private leerRetenciones(): RetencionBloque[] {
    try {
      const guardado = localStorage.getItem(CLAVE_RETENCIONES);
      return guardado ? JSON.parse(guardado) as RetencionBloque[] : [];
    } catch {
      return [];
    }
  }

  private guardarRetenciones(retenciones: RetencionBloque[]): void {
    try {
      localStorage.setItem(CLAVE_RETENCIONES, JSON.stringify(retenciones));
    } catch {
      // El prototipo no debe romperse si el navegador bloquea el almacenamiento.
    }
  }

  private leerSessionId(): string {
    try {
      const guardado = sessionStorage.getItem(CLAVE_SESION_RETENCION);
      if (guardado) {
        return guardado;
      }
      const nuevo = `ses-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(CLAVE_SESION_RETENCION, nuevo);
      return nuevo;
    } catch {
      return `ses-${Math.random().toString(36).slice(2, 10)}`;
    }
  }

  private aplicaEnDia(diasConfigurados: string, dia: number): boolean {
    const texto = diasConfigurados.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (texto.includes('todos')) { return true; }
    if (texto.includes('lunes') && texto.includes('viernes')) { return dia >= 1 && dia <= 5; }
    if (texto.includes('lunes') && texto.includes('sabado')) { return dia >= 1 && dia <= 6; }
    if (texto.includes('sabado')) { return dia === 6; }
    if (texto.includes('domingo')) { return dia === 0; }

    const nombreDia = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][dia];
    return texto.includes(nombreDia);
  }
}
