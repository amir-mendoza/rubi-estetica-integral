import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HOY_ISO, LOCALES, PAGOS, localPorId, soles } from '../data/datos';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Pagos</h1>
        <p>Todos los movimientos con su código de operación, quién los confirmó y por qué canal ingresaron.</p>
      </div>
      <div class="cabecera-admin__acciones">
        <button class="btn btn--linea btn--sm">Exportar a Excel</button>
        <button class="btn btn--vino btn--sm">Registrar cobro en local</button>
      </div>
    </div>

    <div class="kpis kpis-5">
      <div class="kpi kpi--acento">
        <span class="kpi__label">Cobrado hoy</span>
        <span class="kpi__valor">{{ soles(cobradoHoy) }}</span>
        <span class="kpi__nota">Confirmado por Izipay o caja</span>
      </div>
      <div class="kpi"><span class="kpi__label">Online (Izipay)</span><span class="kpi__valor">{{ soles(online) }}</span><span class="kpi__nota">Confirmado por webhook</span></div>
      <div class="kpi"><span class="kpi__label">En local</span><span class="kpi__valor">{{ soles(local) }}</span><span class="kpi__nota">Efectivo, Yape y POS</span></div>
      <div class="kpi"><span class="kpi__label">Pendiente</span><span class="kpi__valor" style="color:var(--alerta)">{{ soles(pendiente) }}</span><span class="kpi__nota">Por cobrar en caja</span></div>
      <div class="kpi"><span class="kpi__label">Reembolsos</span><span class="kpi__valor" style="color:var(--error)">{{ soles(reembolsos) }}</span><span class="kpi__nota">Devoluciones registradas</span></div>
    </div>

    <div class="barra-filtros">
      <div class="campo barra-filtros__crecer">
        <label>Buscar</label>
        <input type="search" placeholder="Concepto, referencia o código de operación"
               [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)">
      </div>
      <div class="campo">
        <label>Canal</label>
        <select [ngModel]="canal()" (ngModelChange)="canal.set($event)">
          <option>Todos</option><option>Online</option><option>En local</option>
        </select>
      </div>
      <div class="campo">
        <label>Método</label>
        <select [ngModel]="metodo()" (ngModelChange)="metodo.set($event)">
          <option>Todos</option><option>Izipay</option><option>Efectivo</option>
          <option>Yape</option><option>Tarjeta POS</option><option>Transferencia</option>
        </select>
      </div>
      <div class="campo">
        <label>Estado</label>
        <select [ngModel]="estado()" (ngModelChange)="estado.set($event)">
          <option>Todos</option><option>Pagado</option><option>Pendiente</option><option>Reembolsado</option>
        </select>
      </div>
      <div class="campo">
        <label>Local</label>
        <select [ngModel]="sede()" (ngModelChange)="sede.set($event)">
          <option>Todos</option>
          @for (l of locales; track l.id) { <option>{{ l.nombre }}</option> }
        </select>
      </div>
    </div>

    <div class="tabla-panel">
      <div class="tabla-panel__cabecera">
        <h3>Movimientos</h3>
        <span class="dato__label">{{ lista().length }} registros · {{ soles(totalFiltrado()) }}</span>
      </div>
      <div class="tabla-envoltura">
        <table class="tabla">
          <thead>
            <tr>
              <th>Fecha y hora</th><th>Concepto</th><th>Referencia</th><th>Método</th>
              <th>Canal</th><th>Registrado / confirmado por</th><th>Código de operación</th>
              <th>Estado</th><th class="num">Monto</th>
            </tr>
          </thead>
          <tbody>
            @for (p of lista(); track p.id) {
              <tr>
                <td><div class="mini-dato"><strong>{{ p.fecha }}</strong><span>{{ p.hora }}</span></div></td>
                <td>{{ p.concepto }}</td>
                <td>{{ p.referencia }}<br><small>{{ p.origen }}</small></td>
                <td>{{ p.metodo }}</td>
                <td>{{ p.canal }}</td>
                <td>{{ p.registradoPor }}<br><small>{{ nombreLocal(p.localId) }}</small></td>
                <td>{{ p.codigoOperacion }}</td>
                <td><span [class]="clase(p.estado)">{{ p.estado }}</span></td>
                <td class="num" [style.color]="p.monto < 0 ? 'var(--error)' : ''"><strong>{{ soles(p.monto) }}</strong></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .kpis-5 { grid-template-columns: repeat(5, 1fr); margin-bottom: 22px; }
    @media (max-width: 1400px) { .kpis-5 { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 1000px) { .kpis-5 { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class PagosComponent {
  soles = soles;
  locales = LOCALES;
  busqueda = signal('');
  canal = signal('Todos');
  metodo = signal('Todos');
  estado = signal('Todos');
  sede = signal('Todos');

  cobradoHoy = PAGOS.filter(p => p.fecha === HOY_ISO && p.estado === 'Pagado').reduce((t, p) => t + p.monto, 0);
  online = PAGOS.filter(p => p.fecha === HOY_ISO && p.canal === 'Online' && p.estado === 'Pagado').reduce((t, p) => t + p.monto, 0);
  local = PAGOS.filter(p => p.fecha === HOY_ISO && p.canal === 'En local' && p.estado === 'Pagado').reduce((t, p) => t + p.monto, 0);
  pendiente = PAGOS.filter(p => p.estado === 'Pendiente').reduce((t, p) => t + p.monto, 0);
  reembolsos = Math.abs(PAGOS.filter(p => p.estado === 'Reembolsado').reduce((t, p) => t + p.monto, 0));

  lista = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return PAGOS.filter(p =>
      (this.canal() === 'Todos' || p.canal === this.canal()) &&
      (this.metodo() === 'Todos' || p.metodo === this.metodo()) &&
      (this.estado() === 'Todos' || p.estado === this.estado()) &&
      (this.sede() === 'Todos' || this.nombreLocal(p.localId) === this.sede()) &&
      (!texto || `${p.concepto} ${p.referencia} ${p.codigoOperacion}`.toLowerCase().includes(texto))
    );
  });

  totalFiltrado = computed(() => this.lista().reduce((t, p) => t + p.monto, 0));

  nombreLocal(id: number): string {
    return localPorId(id)?.nombre ?? '—';
  }

  clase(estado: string): string {
    if (estado === 'Pagado') { return 'chip chip--ok chip--punto'; }
    if (estado === 'Pendiente') { return 'chip chip--alerta chip--punto'; }
    return 'chip chip--error chip--punto';
  }
}
