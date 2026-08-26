import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { soles, tratamientoPorId } from '../../data/datos';
import { Paciente } from '../../data/modelos';
import { PacientesService } from '../../compartido/pacientes.service';
import { AgendaService } from '../../compartido/agenda.service';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Pacientes</h1>
        <p>Historial de pacientes registradas, con sus citas y su consumo acumulado.</p>
      </div>
      <div class="cabecera-admin__acciones">
        <button class="btn btn--linea btn--sm">Exportar listado</button>
      </div>
    </div>

    <div class="kpis kpis-4">
      <div class="kpi"><span class="kpi__label">Pacientes registradas</span><span class="kpi__valor">{{ pacientes().length }}</span><span class="kpi__nota">Base histórica</span></div>
      <div class="kpi"><span class="kpi__label">Con cita futura</span><span class="kpi__valor">{{ conCitaFutura() }}</span><span class="kpi__nota">Agendadas desde hoy</span></div>
      <div class="kpi"><span class="kpi__label">Consumo acumulado</span><span class="kpi__valor">{{ soles(consumoTotal()) }}</span><span class="kpi__nota">Histórico de todas las pacientes</span></div>
      <div class="kpi"><span class="kpi__label">Ticket promedio</span><span class="kpi__valor">{{ soles(ticketPromedio()) }}</span><span class="kpi__nota">Por cita atendida</span></div>
    </div>

    <div class="barra-filtros">
      <div class="campo barra-filtros__crecer">
        <label>Buscar</label>
        <input type="search" placeholder="Nombre, DNI o celular" [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)">
      </div>
      <div class="campo">
        <label>Ordenar por</label>
        <select [ngModel]="orden()" (ngModelChange)="orden.set($event)">
          <option value="reciente">Última visita</option>
          <option value="gasto">Mayor consumo</option>
          <option value="citas">Más citas</option>
          <option value="nombre">Nombre</option>
        </select>
      </div>
    </div>

    <div class="tabla-panel">
      <div class="tabla-panel__cabecera">
        <h3>Listado de pacientes</h3>
        <span class="dato__label">{{ lista().length }} resultados</span>
      </div>
      <div class="tabla-envoltura">
        <table class="tabla">
          <thead>
            <tr>
              <th>Paciente</th><th>DNI</th><th>Celular</th><th>Registro</th>
              <th class="num">Citas</th><th>Última visita</th><th class="num">Consumo</th><th></th>
            </tr>
          </thead>
          <tbody>
            @for (p of lista(); track p.id) {
              <tr>
                <td>
                  <div class="mini-dato">
                    <strong>{{ p.nombre }} {{ p.apellido }}</strong>
                    <span>{{ p.correo }}</span>
                  </div>
                </td>
                <td>{{ p.dni }}</td>
                <td>{{ p.celular }}</td>
                <td>{{ p.fechaRegistro }}</td>
                <td class="num">{{ p.citasTotales }}</td>
                <td>{{ p.ultimaVisita }}</td>
                <td class="num">{{ soles(p.totalGastado) }}</td>
                <td class="num">
                  <button class="boton-icono" (click)="abierta.set(abierta() === p.id ? null : p.id)">
                    {{ abierta() === p.id ? 'Cerrar' : 'Historial' }}
                  </button>
                  <a class="boton-icono" [routerLink]="['/admin/pacientes', p.id, 'historial']">Ver completo</a>
                </td>
              </tr>
              @if (abierta() === p.id) {
                <tr class="fila-detalle">
                  <td colspan="8">
                    <div class="detalle-paciente">
                      <div>
                        <span class="dato__label">Observaciones clínicas</span>
                        <p>{{ p.observaciones || 'Sin observaciones registradas.' }}</p>
                      </div>
                      <div>
                        <span class="dato__label">Últimas citas</span>
                        @for (c of citasDe(p.id); track c.id) {
                          <div class="historial">
                            <span>{{ c.fecha }} · {{ c.horaInicio }}</span>
                            <span>{{ tratamientosCita(c) }}</span>
                            <span>{{ c.estado }}</span>
                            <strong>{{ soles(c.montoTotal) }}</strong>
                          </div>
                        }
                        @if (!citasDe(p.id).length) { <p>Sin citas registradas.</p> }
                      </div>
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .kpis-4 { grid-template-columns: repeat(4, 1fr); margin-bottom: 22px; }
    .fila-detalle td { background: var(--rosa-50); }
    .detalle-paciente { display: grid; grid-template-columns: 1fr 1.4fr; gap: 32px; padding: 8px 0 14px; }
    .detalle-paciente p { font-size: .94rem; margin: 6px 0 0; }
    .historial { display: grid; grid-template-columns: 1.1fr 1.4fr .8fr .6fr; gap: 12px; padding: 7px 0; border-bottom: 1px dashed var(--linea); font-size: .9rem; color: var(--gris); }
    .historial strong { text-align: right; color: var(--tinta); font-weight: 500; }
    @media (max-width: 1200px) {
      .kpis-4 { grid-template-columns: repeat(2, 1fr); }
      .detalle-paciente { grid-template-columns: 1fr; }
    }
  `]
})
export class PacientesComponent {
  private pacientesService = inject(PacientesService);
  private agenda = inject(AgendaService);
  soles = soles;
  pacientes = this.pacientesService.pacientes;
  busqueda = signal('');
  orden = signal('reciente');
  abierta = signal<number | null>(null);

  consumoTotal = computed(() => this.pacientes().reduce((t, p) => t + p.totalGastado, 0));
  conCitaFutura = computed(() => new Set(this.agenda.citas().filter(c => c.fecha >= new Date().toISOString().slice(0, 10)).map(c => c.pacienteId)).size);
  ticketPromedio = computed(() => {
    const citas = this.pacientes().reduce((t, p) => t + p.citasTotales, 0);
    return citas ? Math.round(this.consumoTotal() / citas) : 0;
  });

  lista = computed<Paciente[]>(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const filtradas = this.pacientes().filter(p =>
      !texto || `${p.nombre} ${p.apellido} ${p.dni} ${p.celular}`.toLowerCase().includes(texto)
    );
    const orden = this.orden();
    return [...filtradas].sort((a, b) => {
      if (orden === 'gasto') { return b.totalGastado - a.totalGastado; }
      if (orden === 'citas') { return b.citasTotales - a.citasTotales; }
      if (orden === 'nombre') { return a.nombre.localeCompare(b.nombre); }
      return b.ultimaVisita.localeCompare(a.ultimaVisita);
    });
  });

  citasDe(id: number) {
    return this.agenda.citas().filter(c => c.pacienteId === id).sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 5);
  }

  tratamientosCita(cita: { tratamientoId: number; tratamientosIncluidos?: number[] }): string {
    const ids = cita.tratamientosIncluidos?.length ? cita.tratamientosIncluidos : [cita.tratamientoId];
    return ids.map(id => tratamientoPorId(id)?.nombre ?? '—').join(' + ');
  }
}
