import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CITAS, HOY_ISO, LOCALES, PACIENTES, PAGOS, PRODUCTOS, localPorId, nombreEspecialista, soles, tratamientoPorId } from '../../data/datos';
import { MetodoPago, MovimientoPago, Pedido } from '../../data/modelos';
import { PedidosService } from '../../compartido/pedidos.service';

type PeriodoPago = 'hoy' | 'semana' | 'mes' | 'fecha' | 'semana-especifica' | 'mes-especifico' | 'rango' | 'todo';

function movimientosIniciales(pedidos: Pedido[]): MovimientoPago[] {
  const referencias = new Set(PAGOS.map(p => p.referencia));
  const pedidosFaltantes = pedidos
    .filter(p => p.estadoPago === 'Pagado' && p.pagado > 0 && !referencias.has(p.codigo))
    .map((p, indice): MovimientoPago => ({
      id: 9000 + indice + p.id,
      fecha: p.fecha,
      hora: p.entregadoEl?.slice(11, 16) || '12:00',
      concepto: `Pedido ${p.codigo} · ${p.items.reduce((total, item) => total + item.cantidad, 0)} productos`,
      referencia: p.codigo,
      origen: 'Producto',
      metodo: p.metodoPago ?? 'Izipay',
      canal: p.metodoPago === 'Izipay' ? 'Online' : 'Recepción',
      estado: 'Pagado',
      monto: p.pagado,
      localId: p.entrega.includes('1544') ? 2 : 1,
      registradoPor: p.responsableEntrega ?? (p.metodoPago === 'Izipay' ? 'Izipay (automático)' : 'Recepción'),
      codigoOperacion: p.codigoOperacion ?? '—'
    }));
  return [...PAGOS.map(p => ({ ...p })), ...pedidosFaltantes].sort((a, b) => `${b.fecha} ${b.hora}`.localeCompare(`${a.fecha} ${a.hora}`));
}

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Pagos</h1>
        <p>Caja real: dinero cobrado, pendientes por cobrar y devoluciones separados para no mezclar ingresos.</p>
      </div>
      <div class="cabecera-admin__acciones">
        <button class="btn btn--linea btn--sm">Exportar a Excel</button>
      </div>
    </div>

    <div class="kpis kpis-pagos">
      <div class="kpi kpi--acento">
        <span class="kpi__label">Cobrado hoy</span>
        <span class="kpi__valor">{{ soles(cobradoHoy()) }}</span>
        <span class="kpi__nota">Confirmado por Izipay o caja</span>
      </div>
      <div class="kpi kpi--verde"><span class="kpi__label">Tratamientos cobrados</span><span class="kpi__valor">{{ soles(tratamientosHoy()) }}</span><span class="kpi__nota">Reservas y atenciones estéticas pagadas</span></div>
      <div class="kpi kpi--azul"><span class="kpi__label">Productos cobrados</span><span class="kpi__valor">{{ soles(productosHoy()) }}</span><span class="kpi__nota">Ventas de tienda pagadas</span></div>
      <div class="kpi kpi--morado"><span class="kpi__label">Online (Izipay)</span><span class="kpi__valor">{{ soles(online()) }}</span><span class="kpi__nota">Pagos confirmados automáticamente</span></div>
      <div class="kpi kpi--verde"><span class="kpi__label">Recepción / WhatsApp</span><span class="kpi__valor">{{ soles(local()) }}</span><span class="kpi__nota">Cobros gestionados por el equipo</span></div>
      <div class="kpi kpi--naranja"><span class="kpi__label">Por cobrar hoy</span><span class="kpi__valor">{{ soles(pendienteHoy()) }}</span><span class="kpi__nota">No cuenta como ingreso</span></div>
      <div class="kpi kpi--rojo"><span class="kpi__label">Reembolsos hoy</span><span class="kpi__valor">{{ soles(reembolsosHoy()) }}</span><span class="kpi__nota">Dinero devuelto</span></div>
    </div>

    <div class="barra-filtros">
      <div class="campo barra-filtros__crecer">
        <label>Buscar</label>
        <input type="search" placeholder="Concepto, referencia o código de operación"
               [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)">
      </div>
      <div class="campo">
        <label>Periodo</label>
        <select [ngModel]="periodo()" (ngModelChange)="periodo.set($event)">
          <option value="hoy">Hoy</option>
          <option value="semana">Últimos 7 días</option>
          <option value="mes">Mes actual</option>
          <option value="fecha">Fecha específica</option>
          <option value="semana-especifica">Semana específica</option>
          <option value="mes-especifico">Mes específico</option>
          <option value="rango">Rango personalizado</option>
          <option value="todo">Todo</option>
        </select>
      </div>
      @if (periodo() === 'fecha') {
        <div class="campo">
          <label>Fecha</label>
          <input type="date" [ngModel]="fechaEspecifica()" (ngModelChange)="fechaEspecifica.set($event)">
        </div>
      }
      @if (periodo() === 'semana-especifica') {
        <div class="campo">
          <label>Semana</label>
          <input type="week" [ngModel]="semanaEspecifica()" (ngModelChange)="semanaEspecifica.set($event)">
        </div>
      }
      @if (periodo() === 'mes-especifico') {
        <div class="campo">
          <label>Mes</label>
          <input type="month" [ngModel]="mesEspecifico()" (ngModelChange)="mesEspecifico.set($event)">
        </div>
      }
      @if (periodo() === 'rango') {
        <div class="campo">
          <label>Desde</label>
          <input type="date" [ngModel]="rangoDesde()" (ngModelChange)="rangoDesde.set($event)">
        </div>
        <div class="campo">
          <label>Hasta</label>
          <input type="date" [ngModel]="rangoHasta()" (ngModelChange)="rangoHasta.set($event)">
        </div>
      }
      <div class="campo">
        <label>Canal</label>
        <select [ngModel]="canal()" (ngModelChange)="canal.set($event)">
          <option>Todos</option><option>Online</option><option>Recepción</option><option>WhatsApp</option>
        </select>
      </div>
      <div class="campo">
        <label>Método</label>
        <select [ngModel]="metodo()" (ngModelChange)="metodo.set($event)">
          <option>Todos</option><option>Izipay</option><option>Efectivo</option><option>Yape</option><option>Plin</option><option>Tarjeta POS</option><option>Transferencia</option>
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
        <span class="dato__label">{{ lista().length }} registros · {{ soles(totalCobradoFiltrado()) }} cobrado</span>
      </div>
      <div class="tabla-envoltura">
        <table class="tabla">
          <thead>
            <tr>
              <th>Fecha y hora</th><th>Cliente / paciente</th><th>Detalle</th><th>Referencia</th><th>Método / estado</th>
              <th>Canal</th><th>Registrado / confirmado por</th><th>Código de operación</th>
              <th class="num">Monto</th><th></th>
            </tr>
          </thead>
          <tbody>
            @for (p of lista(); track p.id) {
              <tr>
                <td><div class="mini-dato"><strong>{{ p.fecha }}</strong><span>{{ p.hora }}</span></div></td>
                <td><div class="mini-dato"><strong>{{ clientePago(p) }}</strong><span>{{ contactoPago(p) }}</span></div></td>
                <td><div class="mini-dato"><strong>{{ tituloDetallePago(p) }}</strong><span>{{ subtituloDetallePago(p) }}</span></div></td>
                <td><span [class]="claseReferencia(p)">{{ p.referencia }}</span><br><small>{{ p.origen === 'Cita' ? 'Tratamiento / cita' : 'Producto / tienda' }}</small></td>
                <td>{{ p.metodo }}<br><span [class]="clase(p.estado)">{{ p.estado }}</span></td>
                <td>{{ p.canal }}</td>
                <td>{{ responsablePago(p) }}<br><small>{{ nombreLocal(p.localId) }}</small></td>
                <td>{{ p.codigoOperacion }}</td>
                <td class="num" [style.color]="p.monto < 0 ? 'var(--error)' : ''"><strong>{{ soles(p.monto) }}</strong></td>
                <td class="num">
                  <div class="acciones-fila">
                    <a class="boton-icono" [routerLink]="rutaDetalle(p)">Abrir</a>
                    @if (p.estado === 'Pendiente') {
                      <button class="boton-icono" (click)="abrirCobro(p)">Cobrar</button>
                    } @else if (p.estado === 'Pagado') {
                      <button class="boton-icono" (click)="abrirCobro(p)">Editar</button>
                      <button class="boton-icono boton-icono--peligro" (click)="registrarReembolso(p)">Reembolso</button>
                    } @else if (p.estado === 'Reembolsado') {
                      <button class="boton-icono" (click)="cancelarReembolso(p)">Cancelar reembolso</button>
                    }
                  </div>
                </td>
              </tr>
              @if (cobroAbierto() === p.id) {
                <tr class="fila-cobro">
                  <td colspan="10">
                    <form class="cobro-inline" (ngSubmit)="guardarCobroMovimiento(p)">
                      <div>
                        <strong>{{ p.estado === 'Pendiente' ? 'Registrar cobro' : 'Editar pago' }}</strong>
                        <span>{{ p.concepto }} · {{ p.referencia }}</span>
                      </div>
                      <div class="cobro-resumen">
                        <span>{{ p.estado === 'Pendiente' ? 'Monto pendiente' : 'Monto registrado' }}</span>
                        <strong>{{ soles(Math.abs(p.monto)) }}</strong>
                      </div>
                      <div class="campo">
                        <label>{{ p.estado === 'Pendiente' ? 'Monto que paga ahora' : 'Monto corregido' }}</label>
                        <input type="number" min="1" [max]="p.estado === 'Pendiente' ? p.monto : null" [ngModel]="montoCobro(p)" (ngModelChange)="setCobroMonto(p.id, Number($event))" name="monto{{ p.id }}">
                      </div>
                      <div class="campo">
                        <label>Método</label>
                        <select [ngModel]="cobroMetodo()[p.id] || p.metodo" (ngModelChange)="setCobroMetodo(p.id, $event)" name="metodo{{ p.id }}">
                          @for (m of metodosPago; track m) { <option>{{ m }}</option> }
                        </select>
                      </div>
                      <div class="codigo-auto">
                        <span>Código automático</span>
                        <strong>{{ codigoGenerado(p) }}</strong>
                      </div>
                      <button class="btn btn--vino btn--sm" type="submit">Guardar</button>
                      <button class="boton-icono" type="button" (click)="cobroAbierto.set(null)">Cancelar</button>
                    </form>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Default,
  styles: [`
    .kpis-pagos { grid-template-columns: repeat(4, 1fr); margin-bottom: 22px; }
    .referencia-tipo {
      display: inline-flex;
      align-items: center;
      min-width: 82px;
      justify-content: center;
      padding: 6px 10px;
      border-radius: 999px;
      font-weight: 800;
      font-size: .78rem;
      letter-spacing: .04em;
    }
    .referencia-tipo--cita { background: var(--ok-bg); color: var(--ok); }
    .referencia-tipo--producto { background: #f0f8fc; color: #2b86b8; }
    .cobro-inline {
      display: grid;
      grid-template-columns: minmax(220px, 1.2fr) minmax(120px, .55fr) repeat(2, minmax(140px, .7fr)) minmax(150px, .65fr) auto auto;
      gap: 14px;
      align-items: end;
      padding: 14px;
      border: 1px solid var(--linea);
      border-radius: var(--radio-lg);
      background: var(--rosa-50);
    }
    .cobro-inline > div:first-child { display: grid; gap: 2px; align-self: center; }
    .cobro-inline > div:first-child strong { color: var(--vino); }
    .cobro-inline > div:first-child span { color: var(--gris); font-size: .9rem; }
    .cobro-inline .campo { margin: 0; }
    .cobro-resumen,
    .codigo-auto {
      display: grid;
      gap: 4px;
      min-height: 42px;
      padding: 9px 12px;
      border: 1px solid var(--linea);
      border-radius: var(--radio);
      background: #fff;
    }
    .cobro-resumen span,
    .codigo-auto span {
      color: var(--gris-claro);
      font-size: .78rem;
      font-weight: 700;
      letter-spacing: .14em;
      text-transform: uppercase;
    }
    .cobro-resumen strong,
    .codigo-auto strong {
      color: var(--vino);
      font-size: 1rem;
      line-height: 1.1;
    }
    .fila-cobro td { background: #fff; }
    .boton-icono--peligro { color: var(--error); border-color: rgba(166,40,40,.28); }
    .boton-icono--peligro:hover { background: var(--error-bg); border-color: var(--error); color: var(--error); }
    @media (max-width: 1400px) { .kpis-pagos { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 1200px) { .cobro-inline { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 1000px) { .kpis-pagos { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) { .kpis-pagos, .cobro-form { grid-template-columns: 1fr; } }
  `]
})
export class PagosComponent {
  private pedidosService = inject(PedidosService);
  Math = Math;
  Number = Number;
  soles = soles;
  locales = LOCALES;
  movimientos = signal(movimientosIniciales(this.pedidosService.pedidos()));
  busqueda = signal('');
  periodo = signal<PeriodoPago>('hoy');
  fechaEspecifica = signal(HOY_ISO);
  semanaEspecifica = signal(this.semanaISO(HOY_ISO));
  mesEspecifico = signal(HOY_ISO.slice(0, 7));
  rangoDesde = signal(HOY_ISO);
  rangoHasta = signal(HOY_ISO);
  canal = signal('Todos');
  metodo = signal('Todos');
  estado = signal('Todos');
  sede = signal('Todos');
  cobroAbierto = signal<number | null>(null);
  cobroMonto = signal<Record<number, number>>({});
  cobroMetodo = signal<Record<number, MetodoPago>>({});
  cobroCodigo = signal<Record<number, string>>({});
  metodosPago: MetodoPago[] = ['Efectivo', 'Yape', 'Plin', 'Tarjeta POS', 'Transferencia', 'Izipay'];

  cobradoHoy = computed(() => this.movimientos().filter(p => p.fecha === HOY_ISO && p.estado === 'Pagado').reduce((t, p) => t + p.monto, 0));
  tratamientosHoy = computed(() => this.movimientos().filter(p => p.fecha === HOY_ISO && p.origen === 'Cita' && p.estado === 'Pagado').reduce((t, p) => t + p.monto, 0));
  productosHoy = computed(() => this.movimientos().filter(p => p.fecha === HOY_ISO && p.origen === 'Producto' && p.estado === 'Pagado').reduce((t, p) => t + p.monto, 0));
  online = computed(() => this.movimientos().filter(p => p.fecha === HOY_ISO && p.canal === 'Online' && p.estado === 'Pagado').reduce((t, p) => t + p.monto, 0));
  local = computed(() => this.movimientos().filter(p => p.fecha === HOY_ISO && (p.canal === 'Recepción' || p.canal === 'WhatsApp') && p.estado === 'Pagado').reduce((t, p) => t + p.monto, 0));
  pendienteHoy = computed(() => this.movimientos().filter(p => p.fecha === HOY_ISO && p.estado === 'Pendiente').reduce((t, p) => t + p.monto, 0));
  reembolsosHoy = computed(() => Math.abs(this.movimientos().filter(p => p.fecha === HOY_ISO && p.estado === 'Reembolsado').reduce((t, p) => t + p.monto, 0)));

  lista = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return this.movimientos().filter(p =>
      (this.canal() === 'Todos' || p.canal === this.canal()) &&
      (this.metodo() === 'Todos' || p.metodo === this.metodo()) &&
      (this.estado() === 'Todos' || p.estado === this.estado()) &&
      (this.sede() === 'Todos' || this.nombreLocal(p.localId) === this.sede()) &&
      this.enPeriodo(p.fecha) &&
      (!texto || `${p.concepto} ${p.referencia} ${p.codigoOperacion} ${this.clientePago(p)} ${this.contactoPago(p)} ${this.tituloDetallePago(p)} ${this.subtituloDetallePago(p)}`.toLowerCase().includes(texto))
    );
  });

  totalCobradoFiltrado = computed(() => this.lista().filter(p => p.estado === 'Pagado').reduce((t, p) => t + p.monto, 0));

  nombreLocal(id: number): string {
    return localPorId(id)?.nombre ?? '—';
  }

  clase(estado: string): string {
    if (estado === 'Pagado') { return 'chip chip--ok chip--punto'; }
    if (estado === 'Pendiente') { return 'chip chip--alerta chip--punto'; }
    return 'chip chip--error chip--punto';
  }

  claseReferencia(p: MovimientoPago): string {
    return `referencia-tipo ${p.origen === 'Producto' ? 'referencia-tipo--producto' : 'referencia-tipo--cita'}`;
  }

  clientePago(p: MovimientoPago): string {
    const pedido = this.pedidoPorReferencia(p.referencia);
    if (pedido) { return pedido.cliente; }
    const cita = this.citaPorReferencia(p.referencia);
    if (cita) {
      const paciente = this.pacientePorId(cita.pacienteId);
      return paciente ? `${paciente.nombre} ${paciente.apellido}` : this.nombreDesdeConcepto(p.concepto);
    }
    return this.nombreDesdeConcepto(p.concepto);
  }

  contactoPago(p: MovimientoPago): string {
    const pedido = this.pedidoPorReferencia(p.referencia);
    if (pedido) { return `${pedido.dni || 'DNI no registrado'} · ${pedido.celular || 'Celular no registrado'}`; }
    const cita = this.citaPorReferencia(p.referencia);
    if (cita) {
      const paciente = this.pacientePorId(cita.pacienteId);
      return paciente ? `${paciente.dni} · ${paciente.celular}` : 'Sin contacto registrado';
    }
    return 'Sin contacto registrado';
  }

  responsablePago(p: MovimientoPago): string {
    if (p.canal === 'Online') { return 'Pago automático por Izipay'; }
    const cita = this.citaPorReferencia(p.referencia);
    if (cita?.especialistaId) { return nombreEspecialista(cita.especialistaId); }
    return p.registradoPor;
  }

  rutaDetalle(p: MovimientoPago): string {
    return p.origen === 'Producto' ? '/admin/pedidos' : '/admin/calendario';
  }

  tituloDetallePago(p: MovimientoPago): string {
    const pedido = this.pedidoPorReferencia(p.referencia);
    if (pedido) {
      return pedido.items
        .map(item => {
          const producto = PRODUCTOS.find(prod => prod.id === item.productoId);
          return `${item.cantidad} x ${producto?.nombre ?? 'Producto'}`;
        })
        .join(' · ');
    }
    const cita = this.citaPorReferencia(p.referencia);
    if (cita) {
      const ids = cita.tratamientosIncluidos?.length ? cita.tratamientosIncluidos : [cita.tratamientoId];
      return ids.map(id => tratamientoPorId(id)?.nombre ?? 'Tratamiento').join(' + ');
    }
    return p.concepto;
  }

  subtituloDetallePago(p: MovimientoPago): string {
    const pedido = this.pedidoPorReferencia(p.referencia);
    if (pedido) {
      const total = pedido.items.reduce((suma, item) => suma + item.cantidad, 0);
      return `${total} producto${total === 1 ? '' : 's'} · ${pedido.entrega}`;
    }
    const cita = this.citaPorReferencia(p.referencia);
    if (cita?.zonaTratamiento) { return cita.zonaTratamiento; }
    return p.origen === 'Cita' ? 'Atención estética reservada' : p.concepto;
  }

  abrirCobro(p: MovimientoPago): void {
    this.cobroAbierto.set(this.cobroAbierto() === p.id ? null : p.id);
    this.setCobroMonto(p.id, Math.abs(p.monto));
    this.setCobroMetodo(p.id, p.metodo);
    this.setCobroCodigo(p.id, this.codigoGenerado(p));
  }

  setCobroMonto(id: number, monto: number): void {
    this.cobroMonto.update(v => ({ ...v, [id]: monto }));
  }

  setCobroMetodo(id: number, metodo: MetodoPago): void {
    this.cobroMetodo.update(v => ({ ...v, [id]: metodo }));
  }

  setCobroCodigo(id: number, codigo: string): void {
    this.cobroCodigo.update(v => ({ ...v, [id]: codigo }));
  }

  montoCobro(p: MovimientoPago): number {
    return this.cobroMonto()[p.id] || Math.abs(p.monto);
  }

  codigoGenerado(p: MovimientoPago): string {
    const existente = p.codigoOperacion && p.codigoOperacion !== '—' ? p.codigoOperacion : '';
    const prefijo = p.estado === 'Pendiente' ? 'CAJA' : p.estado === 'Reembolsado' ? 'RB' : 'AJ';
    return this.cobroCodigo()[p.id] || existente || `${prefijo}-${String(p.id).padStart(5, '0')}`;
  }

  guardarCobroMovimiento(p: MovimientoPago): void {
    const ahora = new Date();
    const hora = ahora.toTimeString().slice(0, 5);
    const monto = Math.max(0, Number(this.cobroMonto()[p.id] ?? Math.abs(p.monto)));
    const metodo = this.cobroMetodo()[p.id] ?? p.metodo;
    const codigo = this.cobroCodigo()[p.id] || `CAJA-${String(Date.now()).slice(-5)}`;

    if (p.estado === 'Pendiente' && monto > 0 && monto < p.monto) {
      const id = this.movimientos().reduce((max, item) => Math.max(max, item.id), 0) + 1;
      this.movimientos.update(lista => [
        {
          ...p,
          id,
          fecha: HOY_ISO,
          hora,
          metodo,
          canal: metodo === 'Izipay' ? 'Online' : p.canal,
          estado: 'Pagado',
          monto,
          registradoPor: 'Recepción',
          codigoOperacion: codigo
        },
        ...lista.map(item => item.id === p.id ? { ...item, monto: Math.max(item.monto - monto, 0) } : item)
      ]);
    } else {
      this.movimientos.update(lista => lista.map(item => item.id === p.id
        ? {
            ...item,
            fecha: item.estado === 'Pendiente' ? HOY_ISO : item.fecha,
            hora: item.estado === 'Pendiente' ? hora : item.hora,
            metodo,
            canal: metodo === 'Izipay' ? 'Online' : item.canal,
            estado: 'Pagado',
            monto: monto || item.monto,
            registradoPor: item.estado === 'Pendiente' ? 'Recepción' : item.registradoPor,
            codigoOperacion: codigo
          }
        : item));
    }
    this.cobroAbierto.set(null);
  }

  registrarReembolso(p: MovimientoPago): void {
    if (!confirm(`¿Registrar reembolso de ${soles(Math.abs(p.monto))} para ${p.referencia}?`)) { return; }
    const hora = new Date().toTimeString().slice(0, 5);
    const id = this.movimientos().reduce((max, p) => Math.max(max, p.id), 0) + 1;
    this.movimientos.update(lista => [{
      id,
      fecha: HOY_ISO,
      hora,
      concepto: `Reembolso · ${p.concepto}`,
      referencia: p.referencia,
      origen: p.origen,
      metodo: p.metodo,
      canal: p.canal,
      estado: 'Reembolsado',
      monto: -Math.abs(p.monto),
      localId: p.localId,
      registradoPor: 'Administración',
      codigoOperacion: `RB-${String(id).padStart(5, '0')}`
    }, ...lista]);
  }

  cancelarReembolso(p: MovimientoPago): void {
    if (!confirm(`¿Cancelar el reembolso registrado para ${p.referencia}?`)) { return; }
    this.movimientos.update(lista => lista.filter(item => item.id !== p.id));
  }

  private enPeriodo(fecha: string): boolean {
    if (this.periodo() === 'todo') { return true; }
    if (this.periodo() === 'hoy') { return fecha === HOY_ISO; }
    if (this.periodo() === 'mes') { return fecha.slice(0, 7) === HOY_ISO.slice(0, 7); }
    if (this.periodo() === 'fecha') { return fecha === this.fechaEspecifica(); }
    if (this.periodo() === 'semana-especifica') { return this.enSemanaISO(fecha, this.semanaEspecifica()); }
    if (this.periodo() === 'mes-especifico') { return fecha.slice(0, 7) === this.mesEspecifico(); }
    if (this.periodo() === 'rango') { return fecha >= this.rangoDesde() && fecha <= this.rangoHasta(); }
    const base = new Date(`${HOY_ISO}T00:00:00`);
    const actual = new Date(`${fecha}T00:00:00`);
    const inicio = new Date(base);
    inicio.setDate(base.getDate() - 6);
    return actual >= inicio && actual <= base;
  }

  private citaPorReferencia(referencia: string) {
    return CITAS.find(c => c.codigo === referencia);
  }

  private pedidoPorReferencia(referencia: string) {
    return this.pedidosService.porCodigo(referencia);
  }

  private pacientePorId(id: number) {
    return PACIENTES.find(p => p.id === id);
  }

  private nombreDesdeConcepto(concepto: string): string {
    const partes = concepto.split('·').map(p => p.trim()).filter(Boolean);
    return partes.at(-1) ?? 'Cliente no identificado';
  }

  private semanaISO(fecha: string): string {
    const date = new Date(`${fecha}T00:00:00`);
    const jueves = new Date(date);
    jueves.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
    const primeraSemana = new Date(jueves.getFullYear(), 0, 4);
    const semana = 1 + Math.round(((jueves.getTime() - primeraSemana.getTime()) / 86400000 - 3 + ((primeraSemana.getDay() + 6) % 7)) / 7);
    return `${jueves.getFullYear()}-W${String(semana).padStart(2, '0')}`;
  }

  private enSemanaISO(fecha: string, semana: string): boolean {
    return this.semanaISO(fecha) === semana;
  }
}
