import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  ETIQUETAS_TRATAMIENTO, LOCALES, TRATAMIENTOS, formatoFechaLarga, soles
} from '../../data/datos';
import { CategoriaTratamiento, Local, Tratamiento } from '../../data/modelos';
import { Bloque, DisponibilidadService } from '../../compartido/disponibilidad.service';
import { SesionService } from '../../compartido/sesion.service';

const CATEGORIAS: (CategoriaTratamiento | 'Todos')[] = [
  'Todos', 'Facial', 'Corporal', 'Aparatología', 'Medicina estética'
];

@Component({
  selector: 'app-reservar',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './reservar.component.html',
  styleUrl: './reservar.component.scss'
})
export class ReservarComponent {
  private disponibilidad = inject(DisponibilidadService);
  private ruta = inject(ActivatedRoute);
  readonly sesion = inject(SesionService);

  soles = soles;
  formatoFechaLarga = formatoFechaLarga;

  locales = LOCALES;
  categorias = CATEGORIAS;
  etiquetas = ETIQUETAS_TRATAMIENTO;
  dias = this.disponibilidad.proximosDias(14);

  paso = signal(1);
  local = signal<Local | null>(null);
  tratamiento = signal<Tratamiento | null>(null);
  categoria = signal<CategoriaTratamiento | 'Todos'>('Todos');
  etiqueta = signal<string>('Todas');
  busqueda = signal('');
  fecha = signal<string>(this.dias[0].iso);
  bloque = signal<Bloque | null>(null);
  confirmado = signal(false);

  // Datos de la paciente: se precargan si hay una sesión iniciada.
  nombre = this.sesion.usuario()?.nombre ?? '';
  apellido = this.sesion.usuario()?.apellido ?? '';
  dni = this.sesion.usuario()?.dni ?? '';
  celular = this.sesion.usuario()?.celular ?? '';
  correo = this.sesion.usuario()?.correo ?? '';
  observaciones = '';
  metodoPago: 'Izipay' | 'Local' = 'Izipay';

  pasos = [
    { n: 1, titulo: 'Sede' },
    { n: 2, titulo: 'Tratamiento' },
    { n: 3, titulo: 'Fecha y hora' },
    { n: 4, titulo: 'Tus datos' },
    { n: 5, titulo: 'Pago' }
  ];

  tratamientosFiltrados = computed<Tratamiento[]>(() => {
    const cat = this.categoria();
    const etq = this.etiqueta();
    const texto = this.busqueda().trim().toLowerCase();
    return TRATAMIENTOS.filter(t => {
      if (!t.activo) { return false; }
      if (cat !== 'Todos' && t.categoria !== cat) { return false; }
      if (etq !== 'Todas' && !t.etiquetas.includes(etq)) { return false; }
      if (texto && !`${t.nombre} ${t.resumen}`.toLowerCase().includes(texto)) { return false; }
      return true;
    });
  });

  bloques = computed<Bloque[]>(() => {
    const l = this.local();
    return l ? this.disponibilidad.bloques(this.fecha(), l) : [];
  });

  cupoSede = computed(() => {
    const l = this.local();
    return l ? this.disponibilidad.cupo(l) : 0;
  });

  cabinasSede = computed(() => {
    const l = this.local();
    return l ? this.disponibilidad.cabinas(l) : 0;
  });

  duracionEstimada = computed(() => {
    const t = this.tratamiento();
    return t ? t.duracionMin : 0;
  });

  datosCompletos(): boolean {
    return !!(this.nombre && this.apellido && this.dni && this.celular);
  }

  constructor() {
    const q = this.ruta.snapshot.queryParamMap;
    const localId = Number(q.get('local'));
    const tratId = Number(q.get('tratamiento'));

    if (localId) { this.local.set(LOCALES.find(l => l.id === localId) ?? null); }
    if (tratId) { this.tratamiento.set(TRATAMIENTOS.find(t => t.id === tratId) ?? null); }
    if (this.local() && this.tratamiento()) { this.paso.set(3); }
    else if (this.local()) { this.paso.set(2); }
  }

  elegirLocal(l: Local): void {
    this.local.set(l);
    this.bloque.set(null);
    this.paso.set(2);
  }

  elegirTratamiento(t: Tratamiento): void {
    this.tratamiento.set(t);
    this.bloque.set(null);
    this.paso.set(3);
  }

  elegirCategoria(c: CategoriaTratamiento | 'Todos'): void {
    this.categoria.set(c);
    this.etiqueta.set('Todas');
  }

  elegirEtiqueta(e: string): void {
    this.etiqueta.set(this.etiqueta() === e ? 'Todas' : e);
  }

  elegirFecha(iso: string): void {
    this.fecha.set(iso);
    this.bloque.set(null);
  }

  elegirBloque(b: Bloque): void {
    if (!b.disponible) { return; }
    this.bloque.set(b);
  }

  irA(n: number): void {
    if (n < this.paso()) { this.paso.set(n); }
  }

  siguiente(): void { this.paso.set(Math.min(this.paso() + 1, 5)); }
  anterior(): void { this.paso.set(Math.max(this.paso() - 1, 1)); }

  confirmar(): void {
    this.confirmado.set(true);
  }

  reiniciar(): void {
    this.confirmado.set(false);
    this.paso.set(1);
    this.local.set(null);
    this.tratamiento.set(null);
    this.bloque.set(null);
    this.categoria.set('Todos');
    this.etiqueta.set('Todas');
    this.busqueda.set('');
    const u = this.sesion.usuario();
    this.nombre = u?.nombre ?? '';
    this.apellido = u?.apellido ?? '';
    this.dni = u?.dni ?? '';
    this.celular = u?.celular ?? '';
    this.correo = u?.correo ?? '';
    this.observaciones = '';
  }
}
