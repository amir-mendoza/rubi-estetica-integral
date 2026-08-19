import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HOY_ISO, PEDIDOS, PRODUCTOS, aISO, productoPorId, soles } from '../../data/datos';
import { EntregaPedido, EstadoPedido, MetodoPago, Pedido } from '../../data/modelos';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Pedidos</h1>
        <p>Ventas de productos en web o recepción, con filtros por día, semana y mes.</p>
      </div>
      <div class="cabecera-admin__acciones">
        <button class="btn btn--linea btn--sm">Exportar</button>
        <button class="btn btn--vino btn--sm" (click)="mostrarRegistro.set(!mostrarRegistro())">
          {{ mostrarRegistro() ? 'Cerrar registro' : 'Registrar pedido' }}
        </button>
      </div>
    </div>

    @if (mostrarRegistro()) {
      <div class="tabla-panel pedido-form">
        <div class="tabla-panel__cabecera"><h3>Pedido vendido en local</h3><span class="dato__label">Para compras hechas en recepción</span></div>
        <form class="pedido-form__grid" (ngSubmit)="registrarPedido()">
          <div class="campo"><label>Cliente</label><input required [(ngModel)]="nuevoCliente" name="nuevoCliente"></div>
          <div class="campo"><label>Celular</label><input required [(ngModel)]="nuevoCelular" name="nuevoCelular"></div>
          <div class="campo">
            <label>Entrega</label>
            <select [(ngModel)]="nuevaEntrega" name="nuevaEntrega">
              <option>Recojo en Sede Las Flores 1522</option>
              <option>Recojo en Sede Las Flores 1544</option>
            </select>
          </div>
          <div class="productos-form">
            <div class="productos-form__cabecera">
              <span class="dato__label">Productos</span>
              <button type="button" class="btn btn--linea btn--sm" (click)="agregarItem()">Agregar producto</button>
            </div>
            @for (item of nuevoItems(); track $index; let i = $index) {
              <div class="item-row">
                <select [ngModel]="item.productoId" (ngModelChange)="editarItem(i, 'productoId', Number($event))" [name]="'prod' + i">
                  @for (p of productos; track p.id) { <option [value]="p.id">{{ p.nombre }} · {{ soles(p.precio) }}</option> }
                </select>
                <input type="number" min="1" [ngModel]="item.cantidad" (ngModelChange)="editarItem(i, 'cantidad', Number($event))" [name]="'cant' + i">
                <button type="button" class="boton-icono" (click)="quitarItem(i)" [disabled]="nuevoItems().length === 1">Quitar</button>
              </div>
            }
          </div>
          <div class="campo"><label>Total</label><input type="number" min="0" [(ngModel)]="nuevoTotal" name="nuevoTotal"></div>
          <div class="campo"><label>Pagado</label><input type="number" min="0" [(ngModel)]="nuevoPagado" name="nuevoPagado"></div>
          <div class="campo"><label>Método</label><select [(ngModel)]="nuevoMetodo" name="nuevoMetodo">@for (m of metodos; track m) { <option>{{ m }}</option> }</select></div>
          <button class="btn btn--vino btn--sm" type="submit" [disabled]="!nuevoCliente || !nuevoCelular">Guardar pedido</button>
        </form>
      </div>
    }

    <div class="kpis kpis-4">
      <div class="kpi"><span class="kpi__label">Pedidos</span><span class="kpi__valor">{{ lista().length }}</span><span class="kpi__nota">{{ periodoTexto() }}</span></div>
      <div class="kpi"><span class="kpi__label">Cobrado</span><span class="kpi__valor" style="color:var(--ok)">{{ soles(cobrado()) }}</span><span class="kpi__nota">Dinero confirmado</span></div>
      <div class="kpi"><span class="kpi__label">Por cobrar</span><span class="kpi__valor" style="color:var(--alerta)">{{ soles(porCobrar()) }}</span><span class="kpi__nota">Pendiente, no es ingreso</span></div>
      <div class="kpi"><span class="kpi__label">Productos</span><span class="kpi__valor">{{ unidades() }}</span><span class="kpi__nota">Unidades vendidas</span></div>
    </div>

    <div class="barra-filtros">
      <div class="campo barra-filtros__crecer">
        <label>Buscar</label>
        <input type="search" placeholder="Cliente, celular o código" [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)">
      </div>
      <div class="campo">
        <label>Periodo</label>
        <select [ngModel]="periodo()" (ngModelChange)="periodo.set($event)">
          <option value="hoy">Hoy</option><option value="semana">Semana</option><option value="mes">Mes</option><option value="todo">Todo</option>
        </select>
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
        <span class="dato__label">{{ lista().length }} pedidos · {{ soles(cobrado()) }} cobrado</span>
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
                <td class="num"><button class="boton-icono" (click)="gestionando.set(gestionando() === p.id ? null : p.id)">Gestionar</button></td>
              </tr>
              @if (gestionando() === p.id) {
                <tr class="fila-detalle">
                  <td colspan="9">
                    <div class="gestion">
                      <div class="campo"><label>Estado pedido</label><select [ngModel]="p.estado" (ngModelChange)="actualizarPedido(p.id, 'estado', $event)">@for (e of estadosPedido; track e) { <option>{{ e }}</option> }</select></div>
                      <div class="campo"><label>Estado pago</label><select [ngModel]="p.estadoPago" (ngModelChange)="actualizarPedido(p.id, 'estadoPago', $event)"><option>Pendiente</option><option>Pagado</option></select></div>
                      <div class="campo"><label>Pagado</label><input type="number" min="0" [ngModel]="p.pagado" (ngModelChange)="actualizarPedido(p.id, 'pagado', Number($event))"></div>
                      <div class="campo"><label>Método</label><select [ngModel]="p.metodoPago || 'Efectivo'" (ngModelChange)="actualizarPedido(p.id, 'metodoPago', $event)">@for (m of metodos; track m) { <option>{{ m }}</option> }</select></div>
                      <button class="btn btn--vino btn--sm" (click)="marcarPagado(p)">Marcar pagado</button>
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
    .pedido-form { margin-bottom: 22px; }
    .pedido-form__grid { display: grid; grid-template-columns: repeat(4, minmax(140px, 1fr)); gap: 14px; align-items: end; padding: 20px 22px 24px; }
    .productos-form { grid-column: 1 / -1; border: 1px solid var(--linea); border-radius: var(--radio); padding: 14px; background: var(--rosa-50); }
    .productos-form__cabecera { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 10px; }
    .item-row { display: grid; grid-template-columns: 1fr 100px auto; gap: 10px; margin-top: 8px; }
    .fila-detalle td { background: var(--rosa-50); }
    .gestion { display: grid; grid-template-columns: repeat(5, minmax(130px, 1fr)); gap: 12px; align-items: end; padding: 10px 0; }
    @media (max-width: 1200px) { .kpis-4 { grid-template-columns: repeat(2, 1fr); } .pedido-form__grid, .gestion { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 720px) { .pedido-form__grid, .gestion, .item-row { grid-template-columns: 1fr; } }
  `]
})
export class PedidosComponent {
  Number = Number;
  soles = soles;
  productos = PRODUCTOS.filter(p => p.activo);
  metodos: MetodoPago[] = ['Efectivo', 'Yape', 'Plin', 'Tarjeta POS', 'Transferencia'];
  estadosPedido: EstadoPedido[] = ['Pendiente', 'Pagado', 'Preparando', 'Listo para recojo', 'Entregado', 'Cancelado'];
  pedidos = signal(PEDIDOS.map(p => ({ ...p, items: p.items.map(i => ({ ...i })) })));
  busqueda = signal('');
  periodo = signal<'hoy' | 'semana' | 'mes' | 'todo'>('hoy');
  estado = signal('Todos');
  entrega = signal('Todas');
  gestionando = signal<number | null>(null);
  mostrarRegistro = signal(false);

  nuevoCliente = '';
  nuevoCelular = '';
  nuevaEntrega: EntregaPedido = 'Recojo en Sede Las Flores 1522';
  nuevoItems = signal([{ productoId: PRODUCTOS[0]?.id ?? 1, cantidad: 1 }]);
  nuevoTotal = PRODUCTOS[0]?.precio ?? 0;
  nuevoPagado = 0;
  nuevoMetodo: MetodoPago = 'Efectivo';

  lista = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return this.pedidos().filter(p =>
      this.enPeriodo(p.fecha) &&
      (this.estado() === 'Todos' || p.estado === this.estado()) &&
      (this.entrega() === 'Todas' || p.entrega === this.entrega()) &&
      (!texto || `${p.cliente} ${p.celular} ${p.codigo}`.toLowerCase().includes(texto))
    );
  });

  cobrado = computed(() => this.lista().reduce((t, p) => t + p.pagado, 0));
  porCobrar = computed(() => this.lista().filter(p => p.estado !== 'Cancelado').reduce((t, p) => t + Math.max(p.total - p.pagado, 0), 0));
  unidades = computed(() => this.lista().reduce((t, p) => t + p.items.reduce((sum, i) => sum + i.cantidad, 0), 0));

  periodoTexto(): string {
    return this.periodo() === 'hoy' ? 'Hoy' : this.periodo() === 'semana' ? 'Últimos 7 días' : this.periodo() === 'mes' ? 'Mes en curso' : 'Todo';
  }

  detalle(items: { productoId: number; cantidad: number }[]): string {
    return items.map(i => `${i.cantidad} x ${productoPorId(i.productoId)?.nombre ?? ''}`).join(', ');
  }

  agregarItem(): void {
    this.nuevoItems.update(items => [...items, { productoId: this.productos[0]?.id ?? 1, cantidad: 1 }]);
    this.recalcularTotal();
  }

  quitarItem(index: number): void {
    this.nuevoItems.update(items => items.length === 1 ? items : items.filter((_, i) => i !== index));
    this.recalcularTotal();
  }

  editarItem(index: number, campo: 'productoId' | 'cantidad', valor: number): void {
    this.nuevoItems.update(items => items.map((item, i) => i === index ? { ...item, [campo]: valor } : item));
    this.recalcularTotal();
  }

  registrarPedido(): void {
    const id = this.pedidos().reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const pagado = Number(this.nuevoPagado);
    const pedido: Pedido = {
      id,
      codigo: `PD-${2040 + id}`,
      fecha: HOY_ISO,
      cliente: this.nuevoCliente,
      celular: this.nuevoCelular,
      items: this.nuevoItems().map(i => ({ ...i })),
      entrega: this.nuevaEntrega,
      estado: pagado >= this.nuevoTotal ? 'Pagado' : 'Pendiente',
      estadoPago: pagado >= this.nuevoTotal ? 'Pagado' : 'Pendiente',
      metodoPago: pagado > 0 ? this.nuevoMetodo : undefined,
      total: Number(this.nuevoTotal),
      pagado,
      codigoOperacion: pagado > 0 ? `${this.nuevoMetodo.toUpperCase().replace(/\s/g, '-')}-${Date.now().toString().slice(-5)}` : undefined
    };
    this.pedidos.update(lista => [pedido, ...lista]);
    this.mostrarRegistro.set(false);
    this.nuevoCliente = '';
    this.nuevoCelular = '';
    this.nuevoPagado = 0;
    this.nuevoItems.set([{ productoId: PRODUCTOS[0]?.id ?? 1, cantidad: 1 }]);
    this.recalcularTotal();
  }

  actualizarPedido<K extends keyof Pedido>(id: number, campo: K, valor: Pedido[K]): void {
    this.pedidos.update(lista => lista.map(p => p.id === id ? { ...p, [campo]: valor } : p));
  }

  marcarPagado(p: Pedido): void {
    this.pedidos.update(lista => lista.map(item => item.id === p.id ? {
      ...item,
      estadoPago: 'Pagado',
      estado: item.estado === 'Pendiente' ? 'Pagado' : item.estado,
      pagado: item.total,
      metodoPago: item.metodoPago || 'Efectivo',
      codigoOperacion: item.codigoOperacion || `CAJA-${Date.now().toString().slice(-5)}`
    } : item));
  }

  claseEstado(estado: string): string {
    if (estado === 'Entregado' || estado === 'Pagado') { return 'chip chip--ok'; }
    if (estado === 'Cancelado') { return 'chip chip--error'; }
    if (estado === 'Pendiente') { return 'chip chip--alerta'; }
    return 'chip chip--info';
  }

  private recalcularTotal(): void {
    this.nuevoTotal = this.nuevoItems().reduce((total, item) => total + (productoPorId(item.productoId)?.precio ?? 0) * item.cantidad, 0);
  }

  private enPeriodo(fecha: string): boolean {
    if (this.periodo() === 'todo') { return true; }
    if (this.periodo() === 'hoy') { return fecha === HOY_ISO; }
    if (this.periodo() === 'mes') { return fecha.slice(0, 7) === HOY_ISO.slice(0, 7); }
    const dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return aISO(d);
    });
    return dias.includes(fecha);
  }
}
