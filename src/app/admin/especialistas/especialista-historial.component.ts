import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CITAS, ESPECIALISTAS, HOY_ISO, localPorId, nombrePaciente, soles, tratamientoPorId } from '../../data/datos';

type Periodo = 'hoy' | 'semana' | 'mes' | 'todo';

@Component({
  selector: 'app-especialista-historial',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Historial de especialista</h1>
        <p>Movimientos, pacientes atendidos e ingresos cobrados asociados a la especialista.</p>
      </div>
      <div class="cabecera-admin__acciones">
        <a routerLink="/admin/especialistas" class="btn btn--linea btn--sm">Volver a especialistas</a>
      </div>
    </div>

    @if (especialista(); as e) {
      <section class="panel ficha-esp">
        <img [src]="e.foto" [alt]="e.nombre">
        <div><span class="dato__label">Especialista</span><strong>{{ e.nombre }} {{ e.apellido }}</strong></div>
        <div><span class="dato__label">DNI interno</span><strong>{{ e.dni || 'Por registrar' }}</strong></div>
        <div><span class="dato__label">Especialidad</span><strong>{{ e.especialidad || 'Sin dato' }}</strong></div>
      </section>

      <div class="barra-filtros">
        <div class="campo">
          <label>Periodo</label>
          <select [ngModel]="periodo()" (ngModelChange)="periodo.set($event)">
            <option value="hoy">Hoy</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
            <option value="todo">Todo el historial</option>
          </select>
        </div>
        <div class="campo barra-filtros__crecer">
          <label>Buscar</label>
          <input type="search" placeholder="Paciente, tratamiento o local" [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)">
        </div>
      </div>

      <div class="kpis kpis-3">
        <div class="kpi"><span class="kpi__label">Citas atendidas</span><span class="kpi__valor">{{ atendidas() }}</span><span class="kpi__nota">En el periodo seleccionado</span></div>
        <div class="kpi"><span class="kpi__label">Ingresos cobrados</span><span class="kpi__valor">{{ soles(cobrado()) }}</span><span class="kpi__nota">Solo pagos registrados</span></div>
        <div class="kpi"><span class="kpi__label">Pacientes únicos</span><span class="kpi__valor">{{ pacientesUnicos() }}</span><span class="kpi__nota">Atenciones diferentes</span></div>
      </div>

      <section class="tabla-panel">
        <div class="tabla-panel__cabecera">
          <h3>Movimientos registrados</h3>
          <span class="dato__label">{{ movimientos().length }} registros</span>
        </div>
        <div class="tabla-envoltura">
          <table class="tabla">
            <thead>
              <tr><th>Fecha</th><th>Paciente</th><th>Tratamiento</th><th>Local</th><th>Estado</th><th class="num">Pagado</th></tr>
            </thead>
            <tbody>
              @for (m of movimientos(); track m.id) {
                <tr>
                  <td>{{ m.fecha }}<br><small>{{ m.horaInicio }} - {{ m.horaFin }}</small></td>
                  <td>{{ nombrePaciente(m.pacienteId) }}</td>
                  <td>{{ tratamiento(m.tratamientoId) }}</td>
                  <td>{{ local(m.localId) }}</td>
                  <td>{{ m.estado }}<br><small>{{ m.estadoPago }} · {{ m.metodoPago || 'Sin método' }}</small></td>
                  <td class="num">{{ soles(m.montoPagado) }}</td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="vacio">No hay movimientos en este filtro.</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    } @else {
      <section class="panel texto-centro"><h3>Especialista no encontrada</h3></section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .ficha-esp {
      display: grid;
      grid-template-columns: 74px repeat(3, 1fr);
      gap: 18px;
      align-items: center;
      margin-bottom: 22px;
    }
    .ficha-esp img { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; }
    .ficha-esp div { display: grid; gap: 4px; }
    .ficha-esp strong { color: var(--tinta); }
    .kpis-3 { grid-template-columns: repeat(3, 1fr); margin-bottom: 22px; }
    .vacio { text-align: center; color: var(--gris-claro); padding: 24px 0; }
    @media (max-width: 960px) { .ficha-esp, .kpis-3 { grid-template-columns: 1fr; } }
  `]
})
export class EspecialistaHistorialComponent {
  private ruta = inject(ActivatedRoute);
  soles = soles;
  nombrePaciente = nombrePaciente;
  periodo = signal<Periodo>('mes');
  busqueda = signal('');
  id = Number(this.ruta.snapshot.paramMap.get('id'));
  especialista = computed(() => ESPECIALISTAS.find(e => e.id === this.id));

  movimientosBase = computed(() => CITAS
    .filter(c => c.especialistaId === this.id && this.enPeriodo(c.fecha))
    .sort((a, b) => `${b.fecha} ${b.horaInicio}`.localeCompare(`${a.fecha} ${a.horaInicio}`)));

  movimientos = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    if (!texto) { return this.movimientosBase(); }
    return this.movimientosBase().filter(c =>
      `${nombrePaciente(c.pacienteId)} ${this.tratamiento(c.tratamientoId)} ${this.local(c.localId)}`.toLowerCase().includes(texto)
    );
  });

  atendidas = computed(() => this.movimientos().filter(c => c.estado === 'Atendida').length);
  cobrado = computed(() => this.movimientos().reduce((t, c) => t + c.montoPagado, 0));
  pacientesUnicos = computed(() => new Set(this.movimientos().map(c => c.pacienteId)).size);

  tratamiento(id: number): string { return tratamientoPorId(id)?.nombre ?? 'Tratamiento sin dato'; }
  local(id: number): string { return localPorId(id)?.nombre ?? 'Local sin dato'; }

  private enPeriodo(fecha: string): boolean {
    if (this.periodo() === 'todo') { return true; }
    if (this.periodo() === 'hoy') { return fecha === HOY_ISO; }
    if (this.periodo() === 'mes') { return fecha.slice(0, 7) === HOY_ISO.slice(0, 7); }
    const base = new Date(`${HOY_ISO}T00:00:00`);
    const dia = base.getDay() || 7;
    const inicio = new Date(base);
    inicio.setDate(base.getDate() - dia + 1);
    const fin = new Date(inicio);
    fin.setDate(inicio.getDate() + 6);
    const actual = new Date(`${fecha}T00:00:00`);
    return actual >= inicio && actual <= fin;
  }
}
