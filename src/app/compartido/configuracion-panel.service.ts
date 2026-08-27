import { Injectable, computed, signal } from '@angular/core';
import { LOCALES } from '../data/datos';
import { MetodoPago } from '../data/modelos';

export interface ConfiguracionNegocio {
  nombreComercial: string;
  ruc: string;
  telefonoPrincipal: string;
  correoContacto: string;
}

export interface HorarioConfigurado {
  dias: string;
  apertura: string;
  cierre: string;
}

export interface ConfiguracionAgenda {
  bloqueMin: 30 | 60 | 90;
  intervaloDias: 7 | 15 | 30;
  llegadaMin: 15 | 20 | 30;
  cuposPorLocal: Record<number, number>;
  cerrarAlLlegarCupo: boolean;
  atencion24h: boolean;
  asignarAlLlegar: boolean;
  aceptarSinCita: boolean;
  horariosPorLocal: Record<number, HorarioConfigurado[]>;
}

export type AdelantoReserva = 'ninguno' | '30' | '50' | '100';
export type ModoIzipayConfig = 'sandbox' | 'produccion';

export interface ConfiguracionPagos {
  modoIzipay: ModoIzipayConfig;
  merchantId: string;
  webhookUrl: string;
  confirmarConWebhook: boolean;
  registrarCodigoOperacion: boolean;
  metodosPresenciales: Record<MetodoPago, boolean>;
  registrarQuienCobra: boolean;
  adelantoReserva: AdelantoReserva;
}

export interface UsuarioSistemaConfig {
  nombre: string;
  usuario: string;
  rol: 'Administrador' | 'Recepcionista' | 'Especialista';
  local: string;
  permisos: string;
  activo: boolean;
}

export interface ConfiguracionSincronizacion {
  frecuenciaMin: 5 | 15;
  bloquearReservasTrasMin: 30 | 60;
  registrarUuid: boolean;
  registrarLocalOrigen: boolean;
  usarBorradoLogico: boolean;
  mantenerTimestamps: boolean;
}

const CLAVE_NEGOCIO = 'rubi.cfg.negocio';
const CLAVE_AGENDA = 'rubi.cfg.agenda';
const CLAVE_PAGOS = 'rubi.cfg.pagos';
const CLAVE_USUARIOS = 'rubi.cfg.usuarios';
const CLAVE_SYNC = 'rubi.cfg.sync';
const APERTURA_DEFECTO = '09:00';
const CIERRE_DEFECTO = '19:00';

const NEGOCIO_POR_DEFECTO: ConfiguracionNegocio = {
  nombreComercial: 'Rubí Estética Integral',
  ruc: '10 4XX XXX XX1',
  telefonoPrincipal: '945 189 720',
  correoContacto: 'contacto@rubiestetica.pe'
};

const AGENDA_POR_DEFECTO: ConfiguracionAgenda = {
  bloqueMin: 60,
  intervaloDias: 15,
  llegadaMin: 20,
  cuposPorLocal: { 1: 10, 2: 10 },
  cerrarAlLlegarCupo: true,
  atencion24h: false,
  asignarAlLlegar: true,
  aceptarSinCita: true,
  horariosPorLocal: Object.fromEntries(
    LOCALES.map(local => [local.id, [{ dias: 'Todos los días', apertura: APERTURA_DEFECTO, cierre: CIERRE_DEFECTO }]])
  ) as Record<number, HorarioConfigurado[]>
};

const PAGOS_POR_DEFECTO: ConfiguracionPagos = {
  modoIzipay: 'sandbox',
  merchantId: '',
  webhookUrl: 'https://api.rubiestetica.pe/pagos/izipay/webhook',
  confirmarConWebhook: true,
  registrarCodigoOperacion: true,
  metodosPresenciales: {
    Izipay: false,
    Efectivo: true,
    Yape: true,
    Plin: true,
    'Tarjeta POS': true,
    Transferencia: true
  },
  registrarQuienCobra: true,
  adelantoReserva: '30'
};

const USUARIOS_POR_DEFECTO: UsuarioSistemaConfig[] = [
  { nombre: 'Rubí Salazar', usuario: 'rubi.admin', rol: 'Administrador', local: 'Ambas sedes', permisos: 'Acceso total', activo: true },
  { nombre: 'Milagros Ríos', usuario: 'milagros.recepcion', rol: 'Recepcionista', local: 'Sede Las Flores 1522', permisos: 'Agenda, pacientes y cobros', activo: true },
  { nombre: 'Jazmín Cabrera', usuario: 'jazmin.recepcion', rol: 'Recepcionista', local: 'Sede Las Flores 1544', permisos: 'Agenda, pacientes y cobros', activo: true },
  { nombre: 'Ana Torres', usuario: 'ana.especialista', rol: 'Especialista', local: 'Sede Las Flores 1522', permisos: 'Sus citas y observaciones', activo: true },
  { nombre: 'Lucía Ramos', usuario: 'lucia.especialista', rol: 'Especialista', local: 'Sede Las Flores 1544', permisos: 'Sus citas y observaciones', activo: true }
];

const SYNC_POR_DEFECTO: ConfiguracionSincronizacion = {
  frecuenciaMin: 5,
  bloquearReservasTrasMin: 30,
  registrarUuid: true,
  registrarLocalOrigen: true,
  usarBorradoLogico: true,
  mantenerTimestamps: true
};

@Injectable({ providedIn: 'root' })
export class ConfiguracionPanelService {
  readonly negocio = signal<ConfiguracionNegocio>(this.leer(CLAVE_NEGOCIO, NEGOCIO_POR_DEFECTO));
  readonly agenda = signal<ConfiguracionAgenda>(this.normalizarAgenda(this.leer(CLAVE_AGENDA, AGENDA_POR_DEFECTO)));
  readonly pagos = signal<ConfiguracionPagos>(this.leer(CLAVE_PAGOS, PAGOS_POR_DEFECTO));
  readonly usuarios = signal<UsuarioSistemaConfig[]>(this.leer(CLAVE_USUARIOS, USUARIOS_POR_DEFECTO));
  readonly sincronizacion = signal<ConfiguracionSincronizacion>(this.leer(CLAVE_SYNC, SYNC_POR_DEFECTO));
  readonly ultimaActualizacion = signal<string>('');

  readonly adelantoReservaPorcentaje = computed(() => {
    const valor = this.pagos().adelantoReserva;
    return valor === 'ninguno' ? 0 : Number(valor);
  });

  actualizarNegocio(cambios: Partial<ConfiguracionNegocio>): void {
    this.persistirSignal(this.negocio, CLAVE_NEGOCIO, cambios);
  }

  actualizarAgenda(cambios: Partial<ConfiguracionAgenda>): void {
    this.persistirSignal(this.agenda, CLAVE_AGENDA, cambios);
  }

  actualizarAgendaHorario(localId: number, indice: number, campo: keyof HorarioConfigurado, valor: string): void {
    const agenda = this.agenda();
    const horarios = (agenda.horariosPorLocal[localId] ?? []).map(h => ({ ...h }));
    if (!horarios[indice]) { return; }
    horarios[indice] = { ...horarios[indice], [campo]: valor };
    this.actualizarAgenda({
      horariosPorLocal: { ...agenda.horariosPorLocal, [localId]: horarios }
    });
  }

  actualizarCupoLocal(localId: number, cupo: number): void {
    const agenda = this.agenda();
    this.actualizarAgenda({
      cuposPorLocal: { ...agenda.cuposPorLocal, [localId]: Math.max(1, Math.min(cupo, 20)) }
    });
  }

  usarHorarioComercial(localId: number, apertura = APERTURA_DEFECTO, cierre = CIERRE_DEFECTO): void {
    const agenda = this.agenda();
    this.actualizarAgenda({
      atencion24h: false,
      horariosPorLocal: {
        ...agenda.horariosPorLocal,
        [localId]: [{ dias: 'Todos los días', apertura, cierre }]
      }
    });
  }

  usarHorarioComercialEnTodasLasSedes(apertura = APERTURA_DEFECTO, cierre = CIERRE_DEFECTO): void {
    const horariosPorLocal = Object.fromEntries(
      LOCALES.map(local => [local.id, [{ dias: 'Todos los días', apertura, cierre }]])
    ) as Record<number, HorarioConfigurado[]>;
    this.actualizarAgenda({ atencion24h: false, horariosPorLocal });
  }

  actualizarPagos(cambios: Partial<ConfiguracionPagos>): void {
    this.persistirSignal(this.pagos, CLAVE_PAGOS, cambios);
  }

  actualizarMetodoPresencial(metodo: MetodoPago, activo: boolean): void {
    const actual = this.pagos();
    this.actualizarPagos({
      metodosPresenciales: { ...actual.metodosPresenciales, [metodo]: activo }
    });
  }

  actualizarSincronizacion(cambios: Partial<ConfiguracionSincronizacion>): void {
    this.persistirSignal(this.sincronizacion, CLAVE_SYNC, cambios);
  }

  agregarUsuario(usuario: UsuarioSistemaConfig): void {
    const lista = [...this.usuarios(), usuario];
    this.usuarios.set(lista);
    this.guardar(CLAVE_USUARIOS, lista);
    this.marcarActualizacion();
  }

  actualizarUsuario(indice: number, cambios: Partial<UsuarioSistemaConfig>): void {
    const lista = this.usuarios().map((u, i) => i === indice ? { ...u, ...cambios } : u);
    this.usuarios.set(lista);
    this.guardar(CLAVE_USUARIOS, lista);
    this.marcarActualizacion();
  }

  eliminarUsuario(indice: number): void {
    const lista = this.usuarios().filter((_, i) => i !== indice);
    this.usuarios.set(lista);
    this.guardar(CLAVE_USUARIOS, lista);
    this.marcarActualizacion();
  }

  obtenerCupoLocal(localId: number): number {
    return this.agenda().cuposPorLocal[localId] ?? 10;
  }

  obtenerHorariosLocal(localId: number): HorarioConfigurado[] {
    if (this.agenda().atencion24h) {
      return [{ dias: 'Todos los días', apertura: '00:00', cierre: '24:00' }];
    }
    return this.agenda().horariosPorLocal[localId]?.map(h => ({ ...h })) ?? [{ dias: 'Todos los días', apertura: APERTURA_DEFECTO, cierre: CIERRE_DEFECTO }];
  }

  combinarLocalesConHorarios<T extends { id: number; horario: HorarioConfigurado[] }>(locales: T[]): T[] {
    return locales.map(local => ({ ...local, horario: this.obtenerHorariosLocal(local.id) }));
  }

  guardarTodo(): void {
    this.guardar(CLAVE_NEGOCIO, this.negocio());
    this.guardar(CLAVE_AGENDA, this.agenda());
    this.guardar(CLAVE_PAGOS, this.pagos());
    this.guardar(CLAVE_USUARIOS, this.usuarios());
    this.guardar(CLAVE_SYNC, this.sincronizacion());
    this.marcarActualizacion();
  }

  restablecerAgenda(): void {
    this.agenda.set({ ...AGENDA_POR_DEFECTO, cuposPorLocal: { ...AGENDA_POR_DEFECTO.cuposPorLocal }, horariosPorLocal: structuredClone(AGENDA_POR_DEFECTO.horariosPorLocal) });
    this.guardar(CLAVE_AGENDA, this.agenda());
    this.marcarActualizacion();
  }

  restablecerPagos(): void {
    this.pagos.set({ ...PAGOS_POR_DEFECTO, metodosPresenciales: { ...PAGOS_POR_DEFECTO.metodosPresenciales } });
    this.guardar(CLAVE_PAGOS, this.pagos());
    this.marcarActualizacion();
  }

  restablecerSincronizacion(): void {
    this.sincronizacion.set({ ...SYNC_POR_DEFECTO });
    this.guardar(CLAVE_SYNC, this.sincronizacion());
    this.marcarActualizacion();
  }

  private persistirSignal<T extends object>(state: { (): T; set(value: T): void }, clave: string, cambios: Partial<T>): void {
    const nuevo = { ...state(), ...cambios };
    state.set(nuevo);
    this.guardar(clave, nuevo);
    this.marcarActualizacion();
  }

  private normalizarAgenda(agenda: ConfiguracionAgenda): ConfiguracionAgenda {
    const horariosPorLocal = { ...agenda.horariosPorLocal };
    let cambio = false;
    for (const local of LOCALES) {
      const horarios = horariosPorLocal[local.id] ?? [];
      const eraHorarioAnterior = horarios.length === 1 && horarios[0].apertura === '09:00' && horarios[0].cierre === '22:00';
      const eraHorario24h = agenda.atencion24h || (horarios.length === 1 && horarios[0].apertura === '00:00' && (horarios[0].cierre === '24:00' || horarios[0].cierre === '00:00'));
      if (!horarios.length || eraHorarioAnterior || eraHorario24h) {
        horariosPorLocal[local.id] = [{ dias: 'Todos los días', apertura: APERTURA_DEFECTO, cierre: CIERRE_DEFECTO }];
        cambio = true;
      }
    }
    return cambio ? { ...agenda, atencion24h: false, horariosPorLocal } : agenda;
  }

  private marcarActualizacion(): void {
    this.ultimaActualizacion.set(new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }

  private leer<T>(clave: string, fallback: T): T {
    try {
      const guardado = localStorage.getItem(clave);
      if (!guardado) { return this.clonar(fallback); }
      return { ...this.clonar(fallback), ...(JSON.parse(guardado) as Partial<T>) };
    } catch {
      return this.clonar(fallback);
    }
  }

  private guardar<T>(clave: string, valor: T): void {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
    } catch {
      // En producción esto irá a backend; el prototipo no debe romperse si el navegador limita storage.
    }
  }

  private clonar<T>(valor: T): T {
    return JSON.parse(JSON.stringify(valor)) as T;
  }
}
