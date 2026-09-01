import { Component, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HOY_ISO, PEDIDOS, PRODUCTOS, aISO, productoPorId, soles } from '../../data/datos';
import { EntregaPedido, EstadoPedido, MetodoPago, Pedido, Producto } from '../../data/modelos';

interface PedidoItemForm {
  productoId: number;
  cantidad: number;
  busqueda: string;
}

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Pedidos</h1>
        <p>Ventas de productos en web o recepción, con control de recojo y despacho en tienda.</p>
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
        <div class="tabla-panel__cabecera">
          <div>
            <h3>Pedido vendido en local</h3>
            <span class="dato__label">Para compras hechas en recepción o pedidos web que se recogen en tienda</span>
          </div>
        </div>
        <form class="pedido-form__grid" (ngSubmit)="registrarPedido()">
          <div class="campo">
            <label>DNI</label>
            <input required maxlength="8" [(ngModel)]="nuevoDni" name="nuevoDni" placeholder="Ej. 74859632">
          </div>
          <div class="campo">
            <label>Nombre</label>
            <input required [(ngModel)]="nuevoNombre" name="nuevoNombre" placeholder="Ej. Maria">
          </div>
          <div class="campo">
            <label>Apellido</label>
            <input required [(ngModel)]="nuevoApellido" name="nuevoApellido" placeholder="Ej. Lopez Rivera">
          </div>
          <div class="campo">
            <label>Celular</label>
            <input required [(ngModel)]="nuevoCelular" name="nuevoCelular" placeholder="987 654 321">
          </div>
          <div class="campo pedido-form__doble">
            <label>Entrega</label>
            <select [(ngModel)]="nuevaEntrega" name="nuevaEntrega">
              <option>Recojo en Sede Las Flores 1522</option>
              <option>Recojo en Sede Las Flores 1544</option>
            </select>
          </div>
          <div class="campo pedido-form__doble">
            <label>Responsable de entrega (opcional)</label>
            <input [(ngModel)]="nuevoResponsable" name="nuevoResponsable" placeholder="Ej. Recepción · Milagros">
          </div>

          <div class="productos-form">
            <div class="productos-form__cabecera">
              <div>
                <span class="dato__label">Productos</span>
                <p>Escribe para buscar o abre la lista para elegir un producto registrado.</p>
              </div>
              <button type="button" class="btn btn--linea btn--sm" (click)="agregarItem()">Agregar producto</button>
            </div>
            <datalist id="productos-pedido-list">
              @for (p of productos; track p.id) {
                <option [value]="productoEtiqueta(p)"></option>
              }
            </datalist>
            @for (item of nuevoItems(); track $index; let i = $index) {
              <div class="item-row">
                <div class="campo">
                  <label>Producto {{ i + 1 }}</label>
                  <input list="productos-pedido-list"
                         [ngModel]="item.busqueda"
                         (ngModelChange)="buscarProductoItem(i, $event)"
                         [name]="'prodBusqueda' + i"
                         placeholder="Ej. crema, serum, bloqueador">
                  <small>{{ productoResumen(item.productoId) }}</small>
                </div>
                <div class="campo">
                  <label>Cantidad</label>
                  <input type="number" min="1" [ngModel]="item.cantidad" (ngModelChange)="editarItem(i, 'cantidad', Number($event))" [name]="'cant' + i">
                </div>
                <button type="button" class="boton-icono item-row__quitar" (click)="quitarItem(i)" [disabled]="nuevoItems().length === 1">Quitar</button>
              </div>
            }
          </div>

          <div class="campo">
            <label>Total del pedido</label>
            <input [value]="soles(nuevoTotal)" readonly>
          </div>
          <div class="campo">
            <label>Pagado</label>
            <input [value]="soles(nuevoTotal)" readonly>
          </div>
          <div class="campo">
            <label>Método de pago</label>
            <select [(ngModel)]="nuevoMetodo" name="nuevoMetodo">@for (m of metodos; track m) { <option>{{ m }}</option> }</select>
          </div>
          <div class="campo">
            <label>Estado de despacho</label>
            <select [(ngModel)]="nuevoEstado" name="nuevoEstado">@for (e of estadosPedido; track e) { <option>{{ e }}</option> }</select>
          </div>
          <button class="btn btn--vino btn--sm pedido-form__guardar" type="submit" [disabled]="!pedidoValido()">Guardar pedido</button>
        </form>
      </div>
    }

    <div class="kpis kpis-4">
      <div class="kpi"><span class="kpi__label">Pedidos</span><span class="kpi__valor">{{ lista().length }}</span><span class="kpi__nota">{{ periodoTexto() }}</span></div>
      <div class="kpi"><span class="kpi__label">Cobrado</span><span class="kpi__valor" style="color:var(--ok)">{{ soles(cobrado()) }}</span><span class="kpi__nota">Productos pagados al 100%</span></div>
      <div class="kpi"><span class="kpi__label">Por entregar</span><span class="kpi__valor" style="color:var(--alerta)">{{ porEntregar() }}</span><span class="kpi__nota">Nuevo, preparación o listo</span></div>
      <div class="kpi"><span class="kpi__label">Productos</span><span class="kpi__valor">{{ unidades() }}</span><span class="kpi__nota">Unidades vendidas</span></div>
    </div>

    <div class="barra-filtros">
      <div class="campo barra-filtros__crecer">
        <label>Buscar</label>
        <input type="search" placeholder="Cliente, DNI, celular, producto o código" [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)">
      </div>
      <div class="campo">
        <label>Periodo</label>
        <select [ngModel]="periodo()" (ngModelChange)="periodo.set($event)">
          <option value="hoy">Hoy</option><option value="semana">Semana</option><option value="mes">Mes</option><option value="todo">Todo</option>
        </select>
      </div>
      <div class="campo">
        <label>Estado de despacho</label>
        <select [ngModel]="estado()" (ngModelChange)="estado.set($event)">
          <option>Todos</option>
          @for (e of estadosPedido; track e) { <option>{{ e }}</option> }
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
              <th>Código</th><th>Fecha</th><th>Cliente</th><th>Productos</th><th>Recojo</th>
              <th>Despacho</th><th>Pago</th><th class="num">Total</th><th></th>
            </tr>
          </thead>
          <tbody>
            @for (p of lista(); track p.id) {
              <tr>
                <td><strong>{{ p.codigo }}</strong></td>
                <td>{{ p.fecha }}</td>
                <td>
                  <div class="mini-dato">
                    <strong>{{ nombrePedido(p) }}</strong>
                    <span>DNI {{ p.dni || '—' }} · {{ p.celular }}</span>
                  </div>
                </td>
                <td>{{ detalle(p.items) }}</td>
                <td>{{ p.entrega }}</td>
                <td>
                  <span [class]="claseEstado(p.estado)">{{ p.estado }}</span>
                  <br><small>{{ p.responsableEntrega || 'Responsable por asignar' }}</small>
                </td>
                <td>
                  <span [class]="p.estadoPago === 'Pagado' ? 'chip chip--ok chip--punto' : 'chip chip--error chip--punto'">
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
                      <div class="campo">
                        <label>Estado de despacho</label>
                        <select [ngModel]="p.estado" (ngModelChange)="actualizarPedido(p.id, 'estado', $event)">
                          @for (e of estadosPedido; track e) { <option>{{ e }}</option> }
                        </select>
                      </div>
                      <div class="campo">
                        <label>Responsable de entrega</label>
                        <input [ngModel]="p.responsableEntrega || ''" (ngModelChange)="actualizarPedido(p.id, 'responsableEntrega', $event)" placeholder="Nombre de quien entrega">
                      </div>
                      <div class="campo">
                        <label>Método de pago</label>
                        <select [ngModel]="p.metodoPago || 'Efectivo'" (ngModelChange)="actualizarPedido(p.id, 'metodoPago', $event)">
                          @for (m of metodos; track m) { <option>{{ m }}</option> }
                        </select>
                      </div>
                      <div class="campo">
                        <label>Entregado el</label>
                        <input [value]="p.entregadoEl || 'Pendiente de entrega'" readonly>
                      </div>
                      <button class="btn btn--linea btn--sm" (click)="actualizarPedido(p.id, 'estado', 'Listo para entregar')">Listo para entregar</button>
                      <button class="btn btn--vino btn--sm" (click)="marcarEntregado(p)">Marcar entregado</button>
                    </div>
                  </td>
                </tr>
              }
            } @empty {
              <tr><td colspan="9" class="vacio">No hay pedidos con los filtros seleccionados.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Default,
  styles: [`
    .kpis-4 { grid-template-columns: repeat(4, 1fr); margin-bottom: 22px; }
    .pedido-form { margin-bottom: 22px; }
    .pedido-form__grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
      align-items: end;
      padding: 20px 22px 24px;
      box-sizing: border-box;
    }
    .pedido-form__grid *, .pedido-form__grid input, .pedido-form__grid select, .pedido-form__grid button {
      box-sizing: border-box;
      min-width: 0;
      max-width: 100%;
    }
    .pedido-form__doble { grid-column: span 2; }
    .pedido-form__guardar { align-self: stretch; min-height: 44px; }
    .productos-form {
      grid-column: 1 / -1;
      border: 1px solid var(--linea);
      border-radius: var(--radio);
      padding: 14px;
      background: var(--rosa-50);
    }
    .productos-form__cabecera {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      margin-bottom: 10px;
      flex-wrap: wrap;
    }
    .productos-form__cabecera p { margin: 4px 0 0; color: var(--gris); font-size: .9rem; }
    .item-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 120px auto;
      gap: 10px;
      align-items: end;
      margin-top: 10px;
    }
    .item-row small { display: block; color: var(--gris); margin-top: 6px; line-height: 1.35; }
    .item-row__quitar { min-height: 44px; }
    .fila-detalle td { background: var(--rosa-50); }
    .gestion {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr)) auto auto;
      gap: 12px;
      align-items: end;
      padding: 10px 0;
    }
    .vacio { text-align: center; color: var(--gris-claro); padding: 24px 0; }
    @media (max-width: 1280px) {
      .kpis-4 { grid-template-columns: repeat(2, 1fr); }
      .pedido-form__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .gestion { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 760px) {
      .pedido-form__grid, .gestion, .item-row { grid-template-columns: 1fr; }
      .pedido-form__doble { grid-column: auto; }
      .pedido-form__grid { padding: 16px 14px 18px; }
      .productos-form { padding: 12px; }
      .productos-form__cabecera .btn, .pedido-form__guardar, .gestion .btn { width: 100%; }
      .kpis-4 { grid-template-columns: 1fr; }
    }
  `]
})
export class PedidosComponent {
  Number = Number;
  soles = soles;
  productos = PRODUCTOS.filter(p => p.activo);
  metodos: MetodoPago[] = ['Efectivo', 'Yape', 'Plin', 'Tarjeta POS', 'Transferencia', 'Izipay'];
  estadosPedido: EstadoPedido[] = ['Nuevo pedido', 'En preparación', 'Listo para entregar', 'Entregado', 'Cancelado'];
  pedidos = signal(PEDIDOS.map(p => ({ ...p, items: p.items.map(i => ({ ...i })) })));
  busqueda = signal('');
  periodo = signal<'hoy' | 'semana' | 'mes' | 'todo'>('hoy');
  estado = signal('Todos');
  entrega = signal('Todas');
  gestionando = signal<number | null>(null);
  mostrarRegistro = signal(false);

  nuevoDni = '';
  nuevoNombre = '';
  nuevoApellido = '';
  nuevoCelular = '';
  nuevoResponsable = '';
  nuevaEntrega: EntregaPedido = 'Recojo en Sede Las Flores 1522';
  nuevoEstado: EstadoPedido = 'Nuevo pedido';
  nuevoItems = signal<PedidoItemForm[]>([this.crearItemForm()]);
  nuevoTotal = PRODUCTOS[0]?.precio ?? 0;
  nuevoMetodo: MetodoPago = 'Efectivo';

  lista = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return this.pedidos().filter(p =>
      this.enPeriodo(p.fecha) &&
      (this.estado() === 'Todos' || p.estado === this.estado()) &&
      (this.entrega() === 'Todas' || p.entrega === this.entrega()) &&
      (!texto || `${this.nombrePedido(p)} ${p.dni ?? ''} ${p.celular} ${p.codigo} ${this.detalle(p.items)} ${p.metodoPago ?? ''}`.toLowerCase().includes(texto))
    );
  });

  cobrado = computed(() => this.lista().filter(p => p.estado !== 'Cancelado' && p.estadoPago === 'Pagado').reduce((t, p) => t + p.pagado, 0));
  porEntregar = computed(() => this.lista().filter(p => p.estado !== 'Entregado' && p.estado !== 'Cancelado').length);
  unidades = computed(() => this.lista().filter(p => p.estado !== 'Cancelado').reduce((t, p) => t + p.items.reduce((sum, i) => sum + i.cantidad, 0), 0));

  periodoTexto(): string {
    return this.periodo() === 'hoy' ? 'Hoy' : this.periodo() === 'semana' ? 'Ultimos 7 dias' : this.periodo() === 'mes' ? 'Mes en curso' : 'Todo';
  }

  nombrePedido(pedido: Pedido): string {
    return `${pedido.nombre ?? ''} ${pedido.apellido ?? ''}`.trim() || pedido.cliente;
  }

  detalle(items: { productoId: number; cantidad: number }[]): string {
    return items.map(i => `${i.cantidad} x ${productoPorId(i.productoId)?.nombre ?? 'Producto'}`).join(', ');
  }

  productoEtiqueta(producto: Producto): string {
    return `${producto.nombre} · ${producto.marca} · ${soles(producto.precio)}`;
  }

  productoResumen(productoId: number): string {
    const producto = productoPorId(productoId);
    return producto ? `${producto.marca} · ${producto.categoria} · ${soles(producto.precio)}` : 'Selecciona un producto registrado';
  }

  agregarItem(): void {
    this.nuevoItems.update(items => [...items, this.crearItemForm()]);
    this.recalcularTotal();
  }

  quitarItem(index: number): void {
    this.nuevoItems.update(items => items.length === 1 ? items : items.filter((_, i) => i !== index));
    this.recalcularTotal();
  }

  editarItem(index: number, campo: 'productoId' | 'cantidad', valor: number): void {
    this.nuevoItems.update(items => items.map((item, i) => {
      if (i !== index) { return item; }
      const producto = campo === 'productoId' ? productoPorId(valor) : productoPorId(item.productoId);
      return {
        ...item,
        [campo]: campo === 'cantidad' ? Math.max(Number(valor || 1), 1) : valor,
        busqueda: campo === 'productoId' && producto ? this.productoEtiqueta(producto) : item.busqueda
      };
    }));
    this.recalcularTotal();
  }

  buscarProductoItem(index: number, valor: string): void {
    const texto = valor.trim();
    const elegido = this.productos.find(p =>
      this.normalizar(this.productoEtiqueta(p)) === this.normalizar(texto) ||
      this.normalizar(p.nombre) === this.normalizar(texto)
    );

    this.nuevoItems.update(items => items.map((item, i) => i === index ? {
      ...item,
      productoId: elegido?.id ?? item.productoId,
      busqueda: valor
    } : item));
    this.recalcularTotal();
  }

  registrarPedido(): void {
    if (!this.pedidoValido()) { return; }
    const id = this.pedidos().reduce((max, p) => Math.max(max, p.id), 0) + 1;
    const total = Number(this.nuevoTotal);
    const nombre = this.nuevoNombre.trim();
    const apellido = this.nuevoApellido.trim();
    const pedido: Pedido = {
      id,
      codigo: `PD-${2040 + id}`,
      fecha: HOY_ISO,
      dni: this.nuevoDni.trim(),
      nombre,
      apellido,
      cliente: `${nombre} ${apellido}`.trim(),
      celular: this.nuevoCelular.trim(),
      items: this.nuevoItems().map(i => ({ productoId: i.productoId, cantidad: Math.max(Number(i.cantidad || 1), 1) })),
      entrega: this.nuevaEntrega,
      estado: this.nuevoEstado,
      estadoPago: 'Pagado',
      metodoPago: this.nuevoMetodo,
      total,
      pagado: total,
      codigoOperacion: `${this.nuevoMetodo.toUpperCase().replace(/\s/g, '-')}-${Date.now().toString().slice(-5)}`,
      responsableEntrega: this.nuevoResponsable.trim() || undefined,
      entregadoEl: this.nuevoEstado === 'Entregado' ? this.fechaHoraActual() : undefined
    };
    this.pedidos.update(lista => [pedido, ...lista]);
    this.mostrarRegistro.set(false);
    this.limpiarRegistro();
  }

  actualizarPedido<K extends keyof Pedido>(id: number, campo: K, valor: Pedido[K]): void {
    this.pedidos.update(lista => lista.map(p => {
      if (p.id !== id) { return p; }
      const actualizado = { ...p, [campo]: valor };
      if (campo === 'estado' && valor === 'Entregado' && !p.entregadoEl) {
        return { ...actualizado, entregadoEl: this.fechaHoraActual() };
      }
      return actualizado;
    }));
  }

  marcarEntregado(p: Pedido): void {
    this.pedidos.update(lista => lista.map(item => item.id === p.id ? {
      ...item,
      estado: 'Entregado',
      estadoPago: 'Pagado',
      pagado: item.total,
      metodoPago: item.metodoPago || 'Efectivo',
      responsableEntrega: item.responsableEntrega || this.nuevoResponsable.trim() || 'Recepción',
      entregadoEl: item.entregadoEl || this.fechaHoraActual()
    } : item));
  }

  pedidoValido(): boolean {
    return this.nuevoDni.trim().length === 8 &&
      this.nuevoNombre.trim().length >= 2 &&
      this.nuevoApellido.trim().length >= 2 &&
      this.nuevoCelular.trim().length >= 6 &&
      this.nuevoItems().length > 0 &&
      this.nuevoItems().every(item => item.productoId && item.cantidad > 0) &&
      this.nuevoTotal > 0;
  }

  claseEstado(estado: string): string {
    if (estado === 'Entregado') { return 'chip chip--ok'; }
    if (estado === 'Cancelado') { return 'chip chip--error'; }
    if (estado === 'Nuevo pedido') { return 'chip chip--alerta'; }
    return 'chip chip--info';
  }

  private recalcularTotal(): void {
    this.nuevoTotal = this.nuevoItems().reduce((total, item) => total + (productoPorId(item.productoId)?.precio ?? 0) * Math.max(Number(item.cantidad || 1), 1), 0);
  }

  private crearItemForm(): PedidoItemForm {
    const producto = this.productos[0] ?? PRODUCTOS[0];
    return {
      productoId: producto?.id ?? 1,
      cantidad: 1,
      busqueda: producto ? this.productoEtiqueta(producto) : ''
    };
  }

  private limpiarRegistro(): void {
    this.nuevoDni = '';
    this.nuevoNombre = '';
    this.nuevoApellido = '';
    this.nuevoCelular = '';
    this.nuevoResponsable = '';
    this.nuevaEntrega = 'Recojo en Sede Las Flores 1522';
    this.nuevoEstado = 'Nuevo pedido';
    this.nuevoMetodo = 'Efectivo';
    this.nuevoItems.set([this.crearItemForm()]);
    this.recalcularTotal();
  }

  private fechaHoraActual(): string {
    const ahora = new Date();
    return `${aISO(ahora)} ${ahora.toTimeString().slice(0, 5)}`;
  }

  private normalizar(valor: string): string {
    return valor.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
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
