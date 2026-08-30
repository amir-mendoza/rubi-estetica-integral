import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CITAS, ESPECIALISTAS, HOY_ISO, localPorId, nombrePaciente, soles, tratamientoPorId } from '../../data/datos';
import { Especialista } from '../../data/modelos';
import { SubidasService } from '../../compartido/subidas.service';

function especialistaVacia(): Especialista {
  return {
    id: 0,
    dni: '',
    nombre: '',
    apellido: '',
    especialidad: '',
    colegiatura: '',
    bio: '',
    foto: 'img/esp-1.jpg',
    locales: [1],
    tratamientos: [1],
    horario: 'Lunes a sábado · 09:00 a 18:00',
    activa: true
  };
}

@Component({
  selector: 'app-especialistas-admin',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Especialistas</h1>
        <p>Equipo profesional visible de forma segura: datos básicos, especialidad, foto y métricas internas.</p>
      </div>
      <div class="cabecera-admin__acciones">
        <button class="btn btn--vino btn--sm" (click)="nueva()">Nueva especialista</button>
      </div>
    </div>

    @if (mostrarFormulario()) {
      <div class="tabla-panel panel-form">
        <div class="tabla-panel__cabecera">
          <h3>{{ borrador().id ? 'Editar especialista' : 'Nueva especialista' }}</h3>
          <button class="boton-icono" (click)="cerrar()">Cancelar</button>
        </div>
        <form class="esp-form" (ngSubmit)="guardar()">
          <div class="esp-form__foto">
            <img [src]="borrador().foto" [alt]="borrador().nombre || 'Especialista'">
            <label class="btn btn--linea btn--sm">
              Subir foto
              <input type="file" accept="image/*" (change)="cargarFoto($event)" hidden>
            </label>
          </div>
          <div class="campo"><label>Nombres</label><input required [ngModel]="borrador().nombre" (ngModelChange)="editar('nombre', $event)" name="nombre"></div>
          <div class="campo"><label>Apellidos</label><input required [ngModel]="borrador().apellido" (ngModelChange)="editar('apellido', $event)" name="apellido"></div>
          <div class="campo"><label>DNI interno</label><input maxlength="8" [ngModel]="borrador().dni" (ngModelChange)="editar('dni', $event)" name="dni" placeholder="Para buscarla rápido en recepción"></div>
          <div class="campo"><label>Especialidad</label><input [ngModel]="borrador().especialidad" (ngModelChange)="editar('especialidad', $event)" name="especialidad"></div>
          <div class="campo esp-form__ancho"><label>Presentación / notas internas</label><textarea rows="3" [ngModel]="borrador().bio" (ngModelChange)="editar('bio', $event)" name="bio" placeholder="Experiencia breve visible y notas útiles para administración"></textarea></div>
          <button class="btn btn--vino btn--sm" type="submit" [disabled]="!borrador().nombre || !borrador().apellido">Guardar especialista</button>
        </form>
      </div>
    }

    <div class="grid-esp">
      @for (e of especialistas(); track e.id) {
        <article class="panel tarjeta-esp-admin">
          <header>
            <img class="img-cobertura" [src]="e.foto" [alt]="e.nombre">
            <div>
              <h3>{{ e.nombre }} {{ e.apellido }}</h3>
              <span class="dato__label">{{ e.especialidad }}</span>
              <span class="chip chip--info">DNI {{ e.dni || 'por registrar' }}</span>
            </div>
          </header>

          <div class="tarjeta-esp-admin__datos">
            <div><span class="dato__label">Especialidad</span><span>{{ e.especialidad || 'Sin dato' }}</span></div>
            <div><span class="dato__label">Notas internas</span><span>{{ e.bio || 'Sin notas' }}</span></div>
          </div>

          <div class="tarjeta-esp-admin__metricas">
            <div><strong>{{ citasHoy(e.id) }}</strong><span>Citas hoy</span></div>
            <div><strong>{{ citasMes(e.id) }}</strong><span>Citas del mes</span></div>
            <div><strong>{{ soles(ingresos(e.id)) }}</strong><span>Ingresos cobrados del mes</span></div>
          </div>

          <div class="movimientos-esp">
            <div class="movimientos-esp__cabecera">
              <div>
                <span class="dato__label">Movimientos recientes</span>
                <strong>Pacientes, local e ingreso asociado</strong>
              </div>
            </div>
            @for (m of movimientos(e.id); track m.id) {
              <div class="movimiento-row">
                <div><strong>{{ nombrePaciente(m.pacienteId) }}</strong><span>{{ tratamiento(m.tratamientoId) }}</span></div>
                <div><span>{{ m.fecha }} · {{ m.horaInicio }}</span><small>{{ local(m.localId) }}</small></div>
                <div class="movimiento-row__monto">{{ soles(m.montoPagado) }}</div>
              </div>
            } @empty {
              <p class="movimientos-esp__vacio">Aún no hay atenciones registradas para supervisar.</p>
            }
          </div>

          <div class="acciones-fila" style="justify-content:flex-start">
            <button class="boton-icono" (click)="editarEspecialista(e)">Editar perfil</button>
            <a class="boton-icono" [routerLink]="['/admin/especialistas', e.id, 'historial']">Ver historial completo</a>
          </div>
        </article>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .panel-form { margin-bottom: 22px; }
    .esp-form { display: grid; grid-template-columns: minmax(min(100%, 120px), 150px) repeat(4, minmax(min(100%, 150px), 1fr)); gap: 14px; padding: 20px 4% 24px; align-items: end; }
    .esp-form__foto { grid-row: span 3; display: grid; gap: 10px; align-content: start; }
    .esp-form__foto img { width: 126px; height: 126px; object-fit: cover; border-radius: 50%; border: 1px solid var(--linea); background: var(--rosa-50); }
    .esp-form__ancho { grid-column: 2 / -1; }
    .grid-esp { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
    .tarjeta-esp-admin header { display: flex; gap: 16px; align-items: center; margin-bottom: 20px; }
    .tarjeta-esp-admin header img { width: 68px; height: 68px; border-radius: 50%; object-fit: cover; }
    .tarjeta-esp-admin header h3 { margin: 0 0 2px; font-size: 1.25rem; }
    .tarjeta-esp-admin header .chip { margin-top: 8px; }
    .tarjeta-esp-admin__datos { display: grid; grid-template-columns: .7fr 1.3fr; gap: 14px; padding-bottom: 16px; border-bottom: 1px dashed var(--linea); }
    .tarjeta-esp-admin__datos div { display: flex; flex-direction: column; gap: 2px; }
    .tarjeta-esp-admin__datos span:last-child { font-size: .94rem; color: var(--tinta); }
    .tarjeta-esp-admin__metricas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; padding: 16px 0; }
    .tarjeta-esp-admin__metricas div { display: flex; flex-direction: column; }
    .tarjeta-esp-admin__metricas strong { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.6rem; color: var(--vino); }
    .tarjeta-esp-admin__metricas span { font-size: .82rem; color: var(--gris-claro); letter-spacing: .08em; }
    .movimientos-esp { border-top: 1px dashed var(--linea); border-bottom: 1px dashed var(--linea); padding: 14px 0; margin-bottom: 16px; }
    .movimientos-esp__cabecera { margin-bottom: 10px; }
    .movimientos-esp__cabecera strong { display: block; color: var(--vino); font-size: .96rem; }
    .movimiento-row {
      display: grid;
      grid-template-columns: minmax(170px, 1fr) minmax(150px, .8fr) auto;
      gap: 12px;
      align-items: center;
      padding: 9px 0;
      border-top: 1px solid var(--linea);
      font-size: .9rem;
    }
    .movimiento-row:first-of-type { border-top: 0; }
    .movimiento-row div { display: flex; flex-direction: column; }
    .movimiento-row span, .movimiento-row small { color: var(--gris); }
    .movimiento-row__monto { align-items: flex-end; color: var(--vino); font-weight: 700; font-variant-numeric: tabular-nums; }
    .movimientos-esp__vacio { margin: 0; font-size: .9rem; }
    @media (max-width: 1200px) {
      .grid-esp { grid-template-columns: 1fr; }
      .tarjeta-esp-admin__datos { grid-template-columns: 1fr; }
      .esp-form { grid-template-columns: 1fr 1fr; }
      .esp-form__foto, .esp-form__ancho { grid-column: 1 / -1; }
    }
    @media (max-width: 720px) {
      .esp-form { grid-template-columns: 1fr; }
      .movimiento-row { grid-template-columns: 1fr; }
      .movimiento-row__monto { align-items: flex-start; }
    }
  `]
})
export class EspecialistasAdminComponent {
  private subidas = inject(SubidasService);
  soles = soles;
  nombrePaciente = nombrePaciente;
  especialistas = signal(ESPECIALISTAS.map(e => ({ ...e, locales: [...e.locales], tratamientos: [...e.tratamientos] })));
  mostrarFormulario = signal(false);
  borrador = signal<Especialista>(especialistaVacia());
  private mes = HOY_ISO.slice(0, 7);

  nueva(): void {
    this.borrador.set(especialistaVacia());
    this.mostrarFormulario.set(true);
  }

  editarEspecialista(e: Especialista): void {
    this.borrador.set({ ...e, locales: [...e.locales], tratamientos: [...e.tratamientos] });
    this.mostrarFormulario.set(true);
  }

  cerrar(): void {
    this.borrador.set(especialistaVacia());
    this.mostrarFormulario.set(false);
  }

  editar<K extends keyof Especialista>(campo: K, valor: Especialista[K]): void {
    this.borrador.update(e => ({ ...e, [campo]: valor }));
  }

  guardar(): void {
    const e = this.borrador();
    this.especialistas.update(lista => e.id
      ? lista.map(item => item.id === e.id ? { ...e } : item)
      : [{ ...e, id: lista.reduce((max, item) => Math.max(max, item.id), 0) + 1 }, ...lista]);
    this.cerrar();
  }

  cargarFoto(evento: Event): void {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    if (!archivo) { return; }
    this.subidas.leer(archivo, 'Foto').then(fuente => this.editar('foto', fuente)).catch(() => undefined);
  }

  citasHoy(id: number): number {
    return CITAS.filter(c => c.especialistaId === id && c.fecha === HOY_ISO).length;
  }

  citasMes(id: number): number {
    return CITAS.filter(c => c.especialistaId === id && c.fecha.slice(0, 7) === this.mes).length;
  }

  ingresos(id: number): number {
    return CITAS.filter(c => c.especialistaId === id && c.fecha.slice(0, 7) === this.mes)
      .reduce((t, c) => t + c.montoPagado, 0);
  }

  movimientos(id: number) {
    return CITAS
      .filter(c => c.especialistaId === id)
      .sort((a, b) => `${b.fecha} ${b.horaInicio}`.localeCompare(`${a.fecha} ${a.horaInicio}`))
      .slice(0, 5);
  }

  tratamiento(id: number): string {
    return tratamientoPorId(id)?.nombre ?? 'Tratamiento sin dato';
  }

  local(id: number): string {
    return localPorId(id)?.nombre ?? 'Local sin dato';
  }
}
