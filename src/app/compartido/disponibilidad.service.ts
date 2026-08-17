import { Injectable } from '@angular/core';
import { AGENDA, CITAS, LOCALES, aISO, cabinasDeSede, cupoDeSede, reservaSinCita } from '../data/datos';
import { Cita, Local } from '../data/modelos';

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
  libres: number;
  disponible: boolean;
  motivo?: string;
}

export function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export function aHora(minutos: number): string {
  return `${`${Math.floor(minutos / 60)}`.padStart(2, '0')}:${`${minutos % 60}`.padStart(2, '0')}`;
}

@Injectable({ providedIn: 'root' })
export class DisponibilidadService {
  /** Horario del local para la fecha indicada (respetando el horario configurable). */
  horarioDelDia(local: Local, fechaISO: string): { apertura: number; cierre: number } | null {
    const [a, m, d] = fechaISO.split('-').map(Number);
    const dia = new Date(a, m - 1, d).getDay(); // 0 = domingo
    const bloque = dia === 0
      ? local.horario.find(h => h.dias.toLowerCase().includes('domingo'))
      : local.horario.find(h => !h.dias.toLowerCase().includes('domingo'));
    if (!bloque) { return null; }
    return { apertura: aMinutos(bloque.apertura), cierre: aMinutos(bloque.cierre) };
  }

  citasDe(fechaISO: string, localId: number): Cita[] {
    return CITAS.filter(c =>
      c.fecha === fechaISO &&
      c.localId === localId &&
      c.estado !== 'Cancelada' &&
      c.estado !== 'No asistió'
    );
  }

  cupo(local: Local): number { return cupoDeSede(local.id); }
  cabinas(local: Local): number { return cabinasDeSede(local.id).length; }
  reservaLibre(local: Local): number { return reservaSinCita(local.id); }

  /**
   * Bloques del dia. Cada bloque acepta un numero limitado de citas web para que
   * siempre queden cabinas libres para las pacientes que llegan sin cita. Al
   * llenarse el cupo, el bloque se cierra y la paciente pasa al siguiente.
   */
  bloques(fechaISO: string, local: Local): Bloque[] {
    const horario = this.horarioDelDia(local, fechaISO);
    if (!horario) { return []; }

    const cupo = this.cupo(local);
    const citas = this.citasDe(fechaISO, local.id);
    const salida: Bloque[] = [];

    for (let inicio = horario.apertura; inicio + AGENDA.bloqueMin <= horario.cierre; inicio += AGENDA.bloqueMin) {
      const fin = inicio + AGENDA.bloqueMin;
      const reservados = citas.filter(c => {
        const h = aMinutos(c.horaInicio);
        return h >= inicio && h < fin;
      }).length;
      const libres = Math.max(cupo - reservados, 0);

      salida.push({
        inicio: aHora(inicio),
        fin: aHora(fin),
        cupo,
        reservados,
        libres,
        disponible: libres > 0,
        motivo: libres > 0 ? undefined : 'Cupo completo en esta hora'
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
}
