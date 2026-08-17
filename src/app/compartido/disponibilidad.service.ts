import { Injectable } from '@angular/core';
import { CITAS, HABITACIONES, LOCALES, aISO } from '../data/datos';
import { Cita, Especialista, Local, Tratamiento } from '../data/modelos';

export interface Slot {
  inicio: string;
  fin: string;
  disponible: boolean;
  motivo?: string;
  habitacionId?: number;
  especialistaId?: number;
}

const PASO_MINUTOS = 30;

export function aMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

export function aHora(minutos: number): string {
  return `${`${Math.floor(minutos / 60)}`.padStart(2, '0')}:${`${minutos % 60}`.padStart(2, '0')}`;
}

/** Dos rangos se cruzan si inicioA < finB y finA > inicioB. */
export function seCruzan(iniA: number, finA: number, iniB: number, finB: number): boolean {
  return iniA < finB && finA > iniB;
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

  /**
   * Calcula los slots del día. Un horario queda libre solo si existe al menos una
   * cabina disponible y la especialista elegida no tiene otra cita cruzada.
   */
  slots(
    fechaISO: string,
    local: Local,
    tratamiento: Tratamiento,
    especialistas: Especialista[],
    especialistaElegida: Especialista | null
  ): Slot[] {
    const horario = this.horarioDelDia(local, fechaISO);
    if (!horario) { return []; }

    const bloqueo = tratamiento.duracionMin + tratamiento.limpiezaMin;
    const cabinas = HABITACIONES.filter(h => h.localId === local.id && h.activa);
    const citas = this.citasDe(fechaISO, local.id);
    const candidatas = especialistaElegida ? [especialistaElegida] : especialistas;

    const resultado: Slot[] = [];
    for (let inicio = horario.apertura; inicio + bloqueo <= horario.cierre; inicio += PASO_MINUTOS) {
      const fin = inicio + bloqueo;

      const cabinaLibre = cabinas.find(cab =>
        !citas.some(c =>
          c.habitacionId === cab.id &&
          seCruzan(inicio, fin, aMinutos(c.horaInicio), aMinutos(c.horaFin))
        )
      );

      const especialistaLibre = candidatas.find(e =>
        !citas.some(c =>
          c.especialistaId === e.id &&
          seCruzan(inicio, fin, aMinutos(c.horaInicio), aMinutos(c.horaFin))
        )
      );

      let motivo: string | undefined;
      if (!cabinaLibre) { motivo = 'Cabinas ocupadas'; }
      else if (!especialistaLibre) { motivo = 'Especialista ocupada'; }

      resultado.push({
        inicio: aHora(inicio),
        fin: aHora(fin),
        disponible: !!cabinaLibre && !!especialistaLibre,
        motivo,
        habitacionId: cabinaLibre?.id,
        especialistaId: especialistaLibre?.id
      });
    }
    return resultado;
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
