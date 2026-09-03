import { Injectable, signal } from '@angular/core';
import { ESPECIALISTAS } from '../data/datos';
import { Especialista } from '../data/modelos';

function clonarEspecialista(especialista: Especialista): Especialista {
  return {
    ...especialista,
    locales: [...especialista.locales],
    tratamientos: [...especialista.tratamientos]
  };
}

@Injectable({ providedIn: 'root' })
export class EspecialistasService {
  private lista = signal<Especialista[]>(ESPECIALISTAS.map(clonarEspecialista));

  readonly especialistas = this.lista.asReadonly();

  guardar(especialista: Especialista): void {
    this.lista.update(lista => especialista.id
      ? lista.map(item => item.id === especialista.id ? clonarEspecialista(especialista) : item)
      : [{ ...clonarEspecialista(especialista), id: this.siguienteId(lista) }, ...lista]);
  }

  private siguienteId(lista: Especialista[]): number {
    return lista.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  }
}
