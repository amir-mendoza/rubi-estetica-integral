import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CITAS, ESPECIALISTAS, HOY_ISO, LOCALES, MESES, PAGOS, TRATAMIENTOS, aISO, soles
} from '../data/datos';

interface Fila { etiqueta: string; citas: number; vendido: number; pagado: number; pendiente: number; }

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Reportes</h1>
        <p>Ingresos y ventas por periodo, local, tratamiento y especialista.</p>
      </div>
      <div class="cabecera-admin__acciones">
        <button class="btn btn--linea btn--sm">Descargar PDF</button>
        <button class="btn btn--vino btn--sm">Exportar a Excel</button>
      </div>
    </div>

    <div class="barra-filtros">
      <div class="campo">
        <label>Periodo</label>
        <select [ngModel]="periodo()" (ngModelChange)="periodo.set($event)">
          <option value="hoy">Hoy</option>
          <option value="semana">Últimos 7 días</option>
          <option value="mes">Mes en curso</option>
          <option value="todo">Todo el histórico cargado</option>
        </select>
      </div>
      <div class="campo">
        <label>Local</label>
        <select [ngModel]="sede()" (ngModelChange)="sede.set($event)">
          <option>Todos</option>
          @for (l of locales; track l.id) { <option>{{ l.nombre }}</option> }
        </select>
      </div>
      <div class="campo barra-filtros__crecer">
        <label>Referencia</label>
        <input type="text" [value]="tituloPeriodo()" readonly>
      </div>
    </div>

    <div class="kpis kpis-5">
      <div class="kpi kpi--acento"><span class="kpi__label">Monto vendido</span><span class="kpi__valor">{{ soles(vendido()) }}</span><span class="kpi__nota">{{ citasPeriodo().length }} citas del periodo</span></div>
      <div class="kpi"><span class="kpi__label">Monto pagado</span><span class="kpi__valor" style="color:var(--ok)">{{ soles(pagado()) }}</span><span class="kpi__nota">Cobrado y confirmado</span></div>
      <div class="kpi"><span class="kpi__label">Monto pendiente</span><span class="kpi__valor" style="color:var(--alerta)">{{ soles(pendiente()) }}</span><span class="kpi__nota">Por cobrar en local</span></div>
      <div class="kpi"><span class="kpi__label">Monto cancelado</span><span class="kpi__valor" style="color:var(--error)">{{ soles(cancelado()) }}</span><span class="kpi__nota">Citas anuladas o no asistidas</span></div>
      <div class="kpi"><span class="kpi__label">Ganancia estimada</span><span class="kpi__valor">{{ soles(ganancia()) }}</span><span class="kpi__nota">62 % del monto cobrado</span></div>
    </div>

    <div class="grid-dos">
      <div class="tabla-panel">
        <div class="tabla-panel__cabecera"><h3>Por local</h3></div>
        <div class="tabla-envoltura">
          <table class="tabla">
            <thead><tr><th>Local</th><th class="num">Citas</th><th class="num">Vendido</th><th class="num">Pagado</th><th class="num">Pendiente</th></tr></thead>
            <tbody>
              @for (f of porLocal(); track f.etiqueta) {
                <tr>
                  <td>{{ f.etiqueta }}</td><td class="num">{{ f.citas }}</td>
                  <td class="num">{{ soles(f.vendido) }}</td>
                  <td class="num" style="color:var(--ok)">{{ soles(f.pagado) }}</td>
                  <td class="num" style="color:var(--alerta)">{{ soles(f.pendiente) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="tabla-panel">
        <div class="tabla-panel__cabecera"><h3>Por método de pago</h3></div>
        <div class="tabla-envoltura">
          <table class="tabla">
            <thead><tr><th>Método</th><th>Canal</th><th class="num">Movimientos</th><th class="num">Monto</th></tr></thead>
            <tbody>
              @for (m of porMetodo(); track m.metodo) {
                <tr>
                  <td>{{ m.metodo }}</td><td>{{ m.canal }}</td>
                  <td class="num">{{ m.cantidad }}</td>
                  <td class="num">{{ soles(m.monto) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="grid-dos" style="margin-top:20px">
      <div class="tabla-panel">
        <div class="tabla-panel__cabecera"><h3>Por tratamiento</h3></div>
        <div class="tabla-envoltura">
          <table class="tabla">
            <thead><tr><th>Tratamiento</th><th class="num">Sesiones</th><th class="num">Vendido</th><th class="num">Pagado</th></tr></thead>
            <tbody>
              @for (f of porTratamiento(); track f.etiqueta) {
                <tr>
                  <td>{{ f.etiqueta }}</td><td class="num">{{ f.citas }}</td>
                  <td class="num">{{ soles(f.vendido) }}</td>
                  <td class="num" style="color:var(--ok)">{{ soles(f.pagado) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <div class="tabla-panel">
        <div class="tabla-panel__cabecera"><h3>Por especialista</h3></div>
        <div class="tabla-envoltura">
          <table class="tabla">
            <thead><tr><th>Especialista</th><th class="num">Atenciones</th><th class="num">Vendido</th><th class="num">Pagado</th></tr></thead>
            <tbody>
              @for (f of porEspecialista(); track f.etiqueta) {
                <tr>
                  <td>{{ f.etiqueta }}</td><td class="num">{{ f.citas }}</td>
                  <td class="num">{{ soles(f.vendido) }}</td>
                  <td class="num" style="color:var(--ok)">{{ soles(f.pagado) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .kpis-5 { grid-template-columns: repeat(5, 1fr); margin-bottom: 22px; }
    .grid-dos { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: start; }
    @media (max-width: 1400px) { .kpis-5 { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 1100px) { .grid-dos { grid-template-columns: 1fr; } .kpis-5 { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class ReportesComponent {
  soles = soles;
  locales = LOCALES;
  periodo = signal('mes');
  sede = signal('Todos');

  tituloPeriodo = computed(() => {
    const [a, m] = HOY_ISO.split('-').map(Number);
    switch (this.periodo()) {
      case 'hoy': return HOY_ISO;
      case 'semana': return `${this.ultimos(7)[0]} al ${HOY_ISO}`;
      case 'mes': return `${MESES[m - 1]} ${a}`;
      default: return 'Histórico completo del prototipo';
    }
  });

  citasPeriodo = computed(() => {
    const sede = this.sede();
    return CITAS.filter(c => {
      if (sede !== 'Todos' && LOCALES.find(l => l.id === c.localId)?.nombre !== sede) { return false; }
      switch (this.periodo()) {
        case 'hoy': return c.fecha === HOY_ISO;
        case 'semana': return this.ultimos(7).includes(c.fecha);
        case 'mes': return c.fecha.slice(0, 7) === HOY_ISO.slice(0, 7);
        default: return true;
      }
    });
  });

  private validas = computed(() => this.citasPeriodo().filter(c => c.estado !== 'Cancelada' && c.estado !== 'No asistió'));

  vendido = computed(() => this.validas().reduce((t, c) => t + c.montoTotal, 0));
  pagado = computed(() => this.validas().reduce((t, c) => t + c.montoPagado, 0));
  pendiente = computed(() => this.vendido() - this.pagado());
  cancelado = computed(() =>
    this.citasPeriodo().filter(c => c.estado === 'Cancelada' || c.estado === 'No asistió').reduce((t, c) => t + c.montoTotal, 0)
  );
  ganancia = computed(() => Math.round(this.pagado() * 0.62));

  porLocal = computed<Fila[]>(() =>
    LOCALES.map(l => this.fila(l.nombre, this.validas().filter(c => c.localId === l.id))).filter(f => f.citas > 0)
  );

  porTratamiento = computed<Fila[]>(() =>
    TRATAMIENTOS.map(t => this.fila(t.nombre, this.validas().filter(c => c.tratamientoId === t.id)))
      .filter(f => f.citas > 0).sort((a, b) => b.vendido - a.vendido)
  );

  porEspecialista = computed<Fila[]>(() =>
    ESPECIALISTAS.map(e => this.fila(`${e.nombre} ${e.apellido}`, this.validas().filter(c => c.especialistaId === e.id)))
      .filter(f => f.citas > 0).sort((a, b) => b.vendido - a.vendido)
  );

  porMetodo = computed(() => {
    const mapa = new Map<string, { metodo: string; canal: string; cantidad: number; monto: number }>();
    for (const p of PAGOS) {
      if (p.estado !== 'Pagado') { continue; }
      const actual = mapa.get(p.metodo) ?? { metodo: p.metodo, canal: p.canal, cantidad: 0, monto: 0 };
      actual.cantidad++;
      actual.monto += p.monto;
      mapa.set(p.metodo, actual);
    }
    return [...mapa.values()].sort((a, b) => b.monto - a.monto);
  });

  private fila(etiqueta: string, citas: typeof CITAS): Fila {
    const vendido = citas.reduce((t, c) => t + c.montoTotal, 0);
    const pagado = citas.reduce((t, c) => t + c.montoPagado, 0);
    return { etiqueta, citas: citas.length, vendido, pagado, pendiente: vendido - pagado };
  }

  private ultimos(dias: number): string[] {
    const salida: string[] = [];
    for (let i = dias - 1; i >= 0; i--) {
      const f = new Date();
      f.setDate(f.getDate() - i);
      salida.push(aISO(f));
    }
    return salida;
  }
}
