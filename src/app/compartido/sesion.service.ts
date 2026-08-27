import { computed, Injectable, signal } from '@angular/core';
import { USUARIOS } from '../data/datos';
import { Usuario } from '../data/modelos';

export interface DatosRegistro {
  nombre: string;
  apellido: string;
  dni: string;
  celular: string;
  correo: string;
  clave: string;
}

export interface DatosRegistroRecepcion extends DatosRegistro {
  pacienteId: number;
}

const CLAVE_SESION = 'rubi-prototipo-sesion';

/**
 * Sesión simulada del prototipo: las cuentas viven en memoria y solo la sesión
 * activa se recuerda en sessionStorage para no perderla al recargar. No hay
 * autenticación real, tokens ni almacenamiento de datos de negocio.
 */
@Injectable({ providedIn: 'root' })
export class SesionService {
  private usuarios = signal<Usuario[]>([...USUARIOS]);
  private actual = signal<Usuario | null>(this.recuperar());

  readonly usuario = this.actual.asReadonly();
  readonly autenticado = computed(() => this.actual() !== null);
  readonly esAdmin = computed(() => {
    const u = this.actual();
    return u !== null && u.rol !== 'Paciente';
  });
  readonly nombreCompleto = computed(() => {
    const u = this.actual();
    return u ? `${u.nombre} ${u.apellido}` : '';
  });
  readonly iniciales = computed(() => {
    const u = this.actual();
    return u ? `${u.nombre.charAt(0)}${u.apellido.charAt(0)}`.toUpperCase() : '';
  });

  ingresar(correo: string, clave: string): Usuario | null {
    const buscado = correo.trim().toLowerCase();
    const buscadoNumerico = correo.replace(/\D/g, '');
    const usuario = this.usuarios().find(
      u => (
        u.correo.toLowerCase() === buscado ||
        u.dni === buscadoNumerico ||
        u.celular.replace(/\D/g, '') === buscadoNumerico
      ) && u.clave === clave
    );
    if (usuario) {
      this.establecer(usuario);
      return usuario;
    }
    return null;
  }

  registrar(datos: DatosRegistro): Usuario | null {
    const correo = datos.correo.trim().toLowerCase();
    if (correo && this.usuarios().some(u => u.correo.toLowerCase() === correo)) {
      return null;
    }
    const nuevo: Usuario = {
      id: Math.max(...this.usuarios().map(u => u.id)) + 1,
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      dni: datos.dni.trim(),
      celular: datos.celular.trim(),
      correo: datos.correo.trim(),
      clave: datos.clave,
      rol: 'Paciente'
    };
    this.usuarios.update(lista => [...lista, nuevo]);
    this.establecer(nuevo);
    return nuevo;
  }

  registrarDesdeRecepcion(datos: DatosRegistroRecepcion): Usuario {
    const correo = datos.correo.trim().toLowerCase();
    const existente = this.usuarios().find(u =>
      u.dni === datos.dni.trim() ||
      (!!correo && u.correo.toLowerCase() === correo)
    );

    if (existente) {
      const actualizado: Usuario = {
        ...existente,
        nombre: datos.nombre.trim() || existente.nombre,
        apellido: datos.apellido.trim() || existente.apellido,
        dni: datos.dni.trim() || existente.dni,
        celular: datos.celular.trim() || existente.celular,
        correo: datos.correo.trim() || existente.correo,
        clave: datos.clave,
        rol: 'Paciente',
        pacienteId: datos.pacienteId
      };
      this.usuarios.update(lista => lista.map(u => u.id === existente.id ? actualizado : u));
      return actualizado;
    }

    const nuevo: Usuario = {
      id: Math.max(...this.usuarios().map(u => u.id), 0) + 1,
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      dni: datos.dni.trim(),
      celular: datos.celular.trim(),
      correo: datos.correo.trim(),
      clave: datos.clave,
      rol: 'Paciente',
      pacienteId: datos.pacienteId
    };
    this.usuarios.update(lista => [...lista, nuevo]);
    return nuevo;
  }

  salir(): void {
    this.actual.set(null);
    sessionStorage.removeItem(CLAVE_SESION);
  }

  private establecer(usuario: Usuario): void {
    this.actual.set(usuario);
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify({ ...usuario, clave: '' }));
  }

  private recuperar(): Usuario | null {
    const guardado = sessionStorage.getItem(CLAVE_SESION);
    if (!guardado) {
      return null;
    }
    try {
      return JSON.parse(guardado) as Usuario;
    } catch {
      sessionStorage.removeItem(CLAVE_SESION);
      return null;
    }
  }
}
