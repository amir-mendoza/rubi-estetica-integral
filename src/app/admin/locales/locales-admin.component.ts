import { Component } from '@angular/core';
import { MapaSedeComponent } from '../../compartido/mapa-sede.component';
import { CITAS, ESPECIALISTAS, HABITACIONES, HOY_ISO, LOCALES, soles } from '../../data/datos';

@Component({
  selector: 'app-locales-admin',
  standalone: true,
  imports: [MapaSedeComponent],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Locales y cabinas</h1>
        <p>Sedes, horarios configurables y cabinas disponibles para la agenda.</p>
      </div>
      <div class="cabecera-admin__acciones">
        <button class="btn btn--linea btn--sm">Nueva cabina</button>
        <button class="btn btn--vino btn--sm">Nuevo local</button>
      </div>
    </div>

    @for (l of locales; track l.id) {
      <section class="panel local" >
        <header class="local__cabecera">
          <div>
            <h3>{{ l.nombre }}</h3>
            <p>{{ l.direccion }} · {{ l.referencia }} · {{ l.distrito }}</p>
            <p class="local__coords">Coordenadas: {{ l.latitud }}, {{ l.longitud }}</p>
          </div>
          <div class="local__acciones">
            <span [class]="l.activo ? 'chip chip--ok chip--punto' : 'chip chip--error chip--punto'">
              {{ l.activo ? 'Operativo' : 'Cerrado' }}
            </span>
            <button class="boton-icono">Editar datos</button>
            <button class="boton-icono">Editar horario</button>
          </div>
        </header>

        <div class="local__metricas">
          <div><strong>{{ cabinas(l.id).length }}</strong><span>Cabinas</span></div>
          <div><strong>{{ especialistas(l.id) }}</strong><span>Especialistas asignadas</span></div>
          <div><strong>{{ citasHoy(l.id) }}</strong><span>Citas hoy</span></div>
          <div><strong>{{ soles(ingresosMes(l.id)) }}</strong><span>Ingresos del mes</span></div>
          <div><strong>{{ ocupacion(l.id) }} %</strong><span>Ocupación de cabinas hoy</span></div>
        </div>

        <div class="local__columnas">
          <div>
            <span class="dato__label">Ubicación</span>
            <app-mapa-sede [local]="l" />

            <span class="dato__label" style="margin-top:20px;display:block">Horario de atención (configurable)</span>
            <table class="tabla tabla--simple">
              <tbody>
                @for (h of l.horario; track h.dias) {
                  <tr>
                    <td>{{ h.dias }}</td>
                    <td class="num">{{ h.apertura }} — {{ h.cierre }}</td>
                    <td class="num"><button class="boton-icono">Cambiar</button></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <div>
            <span class="dato__label">Cabinas</span>
            <table class="tabla tabla--simple">
              <thead><tr><th>Cabina</th><th>Equipamiento</th><th class="num">Citas hoy</th><th>Estado</th></tr></thead>
              <tbody>
                @for (c of cabinas(l.id); track c.id) {
                  <tr>
                    <td><strong>{{ c.nombre }}</strong></td>
                    <td>{{ c.equipamiento }}</td>
                    <td class="num">{{ citasCabina(c.id) }}</td>
                    <td>
                      <span [class]="c.activa ? 'chip chip--ok chip--punto' : 'chip chip--alerta chip--punto'">
                        {{ c.activa ? 'Habilitada' : 'En mantenimiento' }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>
    }
  `,
  styles: [`
    .local { margin-bottom: 20px; }
    .local__cabecera { display: flex; justify-content: space-between; gap: 20px; flex-wrap: wrap; align-items: flex-start; }
    .local__cabecera h3 { margin: 0 0 4px; }
    .local__cabecera p { margin: 0; font-size: .88rem; }
    .local__coords { margin-top: 4px !important; font-size: .78rem !important; color: var(--gris-claro); }
    .local__acciones { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .local__metricas { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin: 22px 0; padding: 18px 0; border-top: 1px dashed var(--linea); border-bottom: 1px dashed var(--linea); }
    .local__metricas div { display: flex; flex-direction: column; }
    .local__metricas strong { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.7rem; color: var(--vino); }
    .local__metricas span { font-size: .7rem; color: var(--gris-claro); letter-spacing: .08em; }
    .local__columnas { display: grid; grid-template-columns: .8fr 1.4fr; gap: 30px; }
    .tabla--simple { margin-top: 10px; }
    .tabla--simple td, .tabla--simple th { padding: 9px 10px; }
    @media (max-width: 1200px) {
      .local__metricas { grid-template-columns: repeat(2, 1fr); }
      .local__columnas { grid-template-columns: 1fr; }
    }
  `]
})
export class LocalesAdminComponent {
  soles = soles;
  locales = LOCALES;
  private mes = HOY_ISO.slice(0, 7);

  cabinas(localId: number) { return HABITACIONES.filter(h => h.localId === localId); }
  especialistas(localId: number) { return ESPECIALISTAS.filter(e => e.locales.includes(localId)).length; }
  citasHoy(localId: number) { return CITAS.filter(c => c.localId === localId && c.fecha === HOY_ISO).length; }
  citasCabina(habId: number) { return CITAS.filter(c => c.habitacionId === habId && c.fecha === HOY_ISO).length; }

  ingresosMes(localId: number): number {
    return CITAS.filter(c => c.localId === localId && c.fecha.slice(0, 7) === this.mes)
      .reduce((t, c) => t + c.montoPagado, 0);
  }

  ocupacion(localId: number): number {
    const cabinas = this.cabinas(localId).length || 1;
    const minutos = CITAS.filter(c => c.localId === localId && c.fecha === HOY_ISO)
      .reduce((t, c) => t + this.minutos(c.horaFin) - this.minutos(c.horaInicio), 0);
    const disponible = cabinas * 11 * 60;
    return Math.round((minutos / disponible) * 100);
  }

  private minutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }
}
