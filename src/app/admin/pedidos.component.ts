import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PEDIDOS, productoPorId, soles } from '../data/datos';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Pedidos</h1>
        <p>Pedidos de la tienda con su estado de preparación, entrega y pago.</p>
      </div>
      <div class="cabecera-admin__acciones">
        <button class="btn btn--linea btn--sm">Exportar</button>
        <button class="btn btn--vino btn--sm">Registrar pedido</button>
      </div>
    </div>

    <div class="kpis kpis-4">
      <div class="kpi"><span class="kpi__label">Pedidos del periodo</span><span class="kpi__valor">{{ pedidos.length }}</span><span class="kpi__nota">Últimos días</span></div>
      <div class="kpi"><span class="kpi__label">Vendido</span><span class="kpi__valor">{{ soles(vendido) }}</span><span class="kpi__nota">Total facturado</span></div>
      <div class="kpi"><span class="kpi__label">Cobrado</span><span class="kpi__valor" style="color:var(--ok)">{{ soles(cobrado) }}</span><span class="kpi__nota">Confirmado</span></div>
      <div class="kpi"><span class="kpi__label">Por cobrar</span><span class="kpi__valor" style="color:var(--alerta)">{{ soles(vendido - cobrado) }}</span><span class="kpi__nota">Pendiente de pago</span></div>
    </div>

    <div class="barra-filtros">
      <div class="campo barra-filtros__crecer">
        <label>Buscar</label>
        <input type="search" placeholder="Cliente, celular o código" [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)">
      </div>
      <div class="campo">
        <label>Estado</label>
        <select [ngModel]="estado()" (ngModelChange)="estado.set($event)">
          <option>Todos</option><option>Pendiente</option><option>Pagado</option><option>Preparando</option>
          <option>Listo para recojo</option><option>Entregado</option><option>Cancelado</option>
        </select>
      </div>
      <div class="campo">
        <label>Entrega</label>
        <select [ngModel]="entrega()" (ngModelChange)="entrega.set($event)">
          <option>Todas</option><option>Recojo en Sede Las Flores 1522</option>
          <option>Recojo en Sede Las Flores 1544</option>
        </select>
      </div>
    </div>

    <div class="tabla-panel">
      <div class="tabla-panel__cabecera">
        <h3>Listado de pedidos</h3>
        <span class="dato__label">{{ lista().length }} pedidos</span>
      </div>
      <div class="tabla-envoltura">
        <table class="tabla">
          <thead>
            <tr>
              <th>Código</th><th>Fecha</th><th>Cliente</th><th>Productos</th><th>Entrega</th>
              <th>Estado</th><th>Pago</th><th class="num">Total</th><th></th>
            </tr>
          </thead>
          <tbody>
            @for (p of lista(); track p.id) {
              <tr>
                <td><strong>{{ p.codigo }}</strong></td>
                <td>{{ p.fecha }}</td>
                <td><div class="mini-dato"><strong>{{ p.cliente }}</strong><span>{{ p.celular }}</span></div></td>
                <td>{{ detalle(p.items) }}</td>
                <td>{{ p.entrega }}</td>
                <td><span [class]="claseEstado(p.estado)">{{ p.estado }}</span></td>
                <td>
                  <span [class]="p.estadoPago === 'Pagado' ? 'chip chip--ok chip--punto' : 'chip chip--alerta chip--punto'">
                    {{ p.estadoPago }}
                  </span>
                  <br><small>{{ p.metodoPago || '—' }} · {{ p.codigoOperacion || 'sin operación' }}</small>
                </td>
                <td class="num">{{ soles(p.total) }}</td>
                <td class="num"><button class="boton-icono">Gestionar</button></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .kpis-4 { grid-template-columns: repeat(4, 1fr); margin-bottom: 22px; }
    @media (max-width: 1200px) { .kpis-4 { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class PedidosComponent {
  soles = soles;
  pedidos = PEDIDOS;
  busqueda = signal('');
  estado = signal('Todos');
  entrega = signal('Todas');

  vendido = PEDIDOS.filter(p => p.estado !== 'Cancelado').reduce((t, p) => t + p.total, 0);
  cobrado = PEDIDOS.reduce((t, p) => t + p.pagado, 0);

  lista = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return PEDIDOS.filter(p =>
      (this.estado() === 'Todos' || p.estado === this.estado()) &&
      (this.entrega() === 'Todas' || p.entrega === this.entrega()) &&
      (!texto || `${p.cliente} ${p.celular} ${p.codigo}`.toLowerCase().includes(texto))
    );
  });

  detalle(items: { productoId: number; cantidad: number }[]): string {
    return items.map(i => `${i.cantidad} × ${productoPorId(i.productoId)?.nombre ?? ''}`).join(', ');
  }

  claseEstado(estado: string): string {
    if (estado === 'Entregado' || estado === 'Pagado') { return 'chip chip--ok'; }
    if (estado === 'Cancelado') { return 'chip chip--error'; }
    if (estado === 'Pendiente') { return 'chip chip--alerta'; }
    return 'chip chip--info';
  }
}
