import { Injectable, signal } from '@angular/core';
import { PACIENTES, aISO } from '../data/datos';
import { Paciente } from '../data/modelos';

export interface RegistroPacienteInput {
  dni: string;
  nombreCompleto: string;
  celular: string;
  correo?: string;
  observaciones?: string;
}

@Injectable({ providedIn: 'root' })
export class PacientesService {
  private lista = signal<Paciente[]>(PACIENTES.map(p => ({ ...p })));

  readonly pacientes = this.lista.asReadonly();

  porId(id: number): Paciente | undefined {
    return this.lista().find(p => p.id === id);
  }

  porDni(dni: string): Paciente | undefined {
    return this.lista().find(p => p.dni === dni);
  }

  registrarOActualizar(input: RegistroPacienteInput): Paciente {
    const existente = this.porDni(input.dni);
    const [nombre, ...resto] = input.nombreCompleto.trim().split(/\s+/);

    if (existente) {
      const actualizado: Paciente = {
        ...existente,
        nombre: nombre || existente.nombre,
        apellido: resto.join(' ') || existente.apellido,
        celular: input.celular || existente.celular,
        correo: input.correo?.trim() || existente.correo,
        observaciones: input.observaciones?.trim() || existente.observaciones
      };
      this.lista.update(lista => lista.map(p => p.id === existente.id ? actualizado : p));
      return actualizado;
    }

    const id = this.lista().reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const nuevo: Paciente = {
      id,
      nombre: nombre || 'Paciente',
      apellido: resto.join(' '),
      dni: input.dni,
      celular: input.celular,
      correo: input.correo?.trim() || '',
      fechaRegistro: aISO(new Date()),
      observaciones: input.observaciones?.trim() || '',
      citasTotales: 0,
      ultimaVisita: aISO(new Date()),
      totalGastado: 0
    };
    this.lista.update(lista => [nuevo, ...lista]);
    return nuevo;
  }

  registrarAtencion(pacienteId: number, fecha: string, montoPagado: number): void {
    this.lista.update(lista => lista.map(p => p.id === pacienteId ? {
      ...p,
      citasTotales: p.citasTotales + 1,
      ultimaVisita: fecha,
      totalGastado: p.totalGastado + montoPagado
    } : p));
  }
}
