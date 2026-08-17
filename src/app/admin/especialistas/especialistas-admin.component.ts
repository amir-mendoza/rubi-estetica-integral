import { Component } from '@angular/core';
import { CITAS, ESPECIALISTAS, HOY_ISO, LOCALES, TRATAMIENTOS, soles } from '../../data/datos';

@Component({
  selector: 'app-especialistas-admin',
  standalone: true,
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Especialistas</h1>
        <p>Equipo profesional, sedes asignadas, tratamientos habilitados y carga de trabajo.</p>
      </div>
      <div class="cabecera-admin__acciones">
        <button class="btn btn--linea btn--sm">Configurar horarios</button>
        <button class="btn btn--vino btn--sm">Nueva especialista</button>
      </div>
    </div>

    <div class="grid-esp">
      @for (e of especialistas; track e.id) {
        <article class="panel tarjeta-esp-admin">
          <header>
            <img class="img-cobertura" [src]="e.foto" [alt]="e.nombre">
            <div>
              <h3>{{ e.nombre }} {{ e.apellido }}</h3>
              <span class="dato__label">{{ e.especialidad }}</span>
              <span [class]="e.activa ? 'chip chip--ok chip--punto' : 'chip chip--error chip--punto'">
                {{ e.activa ? 'Activa' : 'Inactiva' }}
              </span>
            </div>
          </header>

          <div class="tarjeta-esp-admin__datos">
            <div><span class="dato__label">Colegiatura</span><span>{{ e.colegiatura }}</span></div>
            <div><span class="dato__label">Horario</span><span>{{ e.horario }}</span></div>
            <div><span class="dato__label">Sedes</span><span>{{ sedes(e.locales) }}</span></div>
          </div>

          <div class="tarjeta-esp-admin__metricas">
            <div><strong>{{ citasHoy(e.id) }}</strong><span>Citas hoy</span></div>
            <div><strong>{{ citasMes(e.id) }}</strong><span>Citas del mes</span></div>
            <div><strong>{{ soles(ingresos(e.id)) }}</strong><span>Ingresos del mes</span></div>
          </div>

          <div class="tarjeta-esp-admin__trats">
            <span class="dato__label">Tratamientos habilitados</span>
            <div class="etiquetas">
              @for (t of tratamientos(e.tratamientos); track t) { <span class="chip">{{ t }}</span> }
            </div>
          </div>

          <div class="acciones-fila" style="justify-content:flex-start">
            <button class="boton-icono">Editar perfil</button>
            <button class="boton-icono">Ver agenda</button>
            <button class="boton-icono">Asignar tratamientos</button>
          </div>
        </article>
      }
    </div>
  `,
  styles: [`
    .grid-esp { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
    .tarjeta-esp-admin header { display: flex; gap: 16px; align-items: center; margin-bottom: 20px; }
    .tarjeta-esp-admin header img { width: 68px; height: 68px; border-radius: 50%; object-fit: cover; }
    .tarjeta-esp-admin header h3 { margin: 0 0 2px; font-size: 1.25rem; }
    .tarjeta-esp-admin header .chip { margin-top: 8px; }
    .tarjeta-esp-admin__datos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; padding-bottom: 16px; border-bottom: 1px dashed var(--linea); }
    .tarjeta-esp-admin__datos div { display: flex; flex-direction: column; gap: 2px; }
    .tarjeta-esp-admin__datos span:last-child { font-size: .85rem; color: var(--tinta); }
    .tarjeta-esp-admin__metricas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; padding: 16px 0; }
    .tarjeta-esp-admin__metricas div { display: flex; flex-direction: column; }
    .tarjeta-esp-admin__metricas strong { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.6rem; color: var(--vino); }
    .tarjeta-esp-admin__metricas span { font-size: .7rem; color: var(--gris-claro); letter-spacing: .08em; }
    .tarjeta-esp-admin__trats { margin-bottom: 18px; }
    .etiquetas { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    @media (max-width: 1200px) {
      .grid-esp { grid-template-columns: 1fr; }
      .tarjeta-esp-admin__datos { grid-template-columns: 1fr; }
    }
  `]
})
export class EspecialistasAdminComponent {
  soles = soles;
  especialistas = ESPECIALISTAS;
  private mes = HOY_ISO.slice(0, 7);

  sedes(ids: number[]): string {
    return ids.map(id => LOCALES.find(l => l.id === id)?.nombre ?? '').join(' · ');
  }

  tratamientos(ids: number[]): string[] {
    return ids.map(id => TRATAMIENTOS.find(t => t.id === id)?.nombre ?? '').filter(Boolean);
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
}
