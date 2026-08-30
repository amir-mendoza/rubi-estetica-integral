import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HOY_ISO, MESES, PEDIDOS, PRODUCTOS, TRATAMIENTOS, aISO, soles, tratamientoPorId } from '../../data/datos';
import { Cita, EstadoPago, MetodoPago, Pedido } from '../../data/modelos';
import { AgendaService } from '../../compartido/agenda.service';
import { PacientesService } from '../../compartido/pacientes.service';
import { PlanesService } from '../../compartido/planes.service';

type PeriodoReporte = 'hoy' | 'ultimos7' | 'mesActual' | 'fecha' | 'semana' | 'mes' | 'rango';
type EstadoPagoFiltro = 'Todos' | 'Pagados' | 'Con adelanto' | 'Pendientes';
type OrigenFiltro = 'Todos' | 'Web' | 'WhatsApp' | 'Recepción';
type EstadoVisual = 'Pagado' | 'Con adelanto' | 'Pendiente' | 'Cancelado';
type TablaReporte = 'atenciones' | 'productos';

interface RangoFechas { desde: string; hasta: string; etiqueta: string; }
interface ResumenDia { fecha: string; dia: string; generado: number; cobrado: number; pendiente: number; }
interface IndicadorReporte { titulo: string; monto: string; nota: string; tono: 'morado' | 'verde' | 'naranja' | 'rojo' | 'menta' | 'azul'; }

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Reportes</h1>
        <p>Resumen claro de dinero generado, dinero cobrado, saldos pendientes, atenciones y ventas de productos.</p>
      </div>
      <div class="cabecera-admin__acciones">
        <button type="button" class="btn btn--linea btn--sm" (click)="limpiarFiltros()">Limpiar filtros</button>
        <button type="button" class="btn btn--vino btn--sm" (click)="exportarExcel()">Exportar a Excel</button>
      </div>
    </div>

    <section class="reportes-panel">
      <div class="panel-titulo">
        <div>
          <span class="dato__label">Filtros</span>
          <h2>Consultar caja por periodo y origen</h2>
        </div>
        <span class="chip chip--info">{{ rangoActivo().etiqueta }}</span>
      </div>
      <div class="filtros-grid">
        <div class="campo">
          <label>Periodo</label>
          <select [ngModel]="periodo()" (ngModelChange)="periodo.set($event); aplicarFiltros()">
            <option value="hoy">Hoy</option>
            <option value="ultimos7">Últimos 7 días</option>
            <option value="mesActual">Mes en curso</option>
            <option value="fecha">Fecha específica</option>
            <option value="semana">Semana específica</option>
            <option value="mes">Mes específico</option>
            <option value="rango">Rango personalizado</option>
          </select>
        </div>
        @if (periodo() === 'fecha') {
          <div class="campo"><label>Fecha</label><input type="date" [ngModel]="fechaEspecifica()" (ngModelChange)="fechaEspecifica.set($event); aplicarFiltros()"></div>
        }
        @if (periodo() === 'semana') {
          <div class="campo"><label>Día de la semana</label><input type="date" [ngModel]="semanaEspecifica()" (ngModelChange)="semanaEspecifica.set($event); aplicarFiltros()"></div>
        }
        @if (periodo() === 'mes') {
          <div class="campo"><label>Mes</label><input type="month" [ngModel]="mesEspecifico()" (ngModelChange)="mesEspecifico.set($event); aplicarFiltros()"></div>
        }
        @if (periodo() === 'rango') {
          <div class="campo"><label>Desde</label><input type="date" [ngModel]="rangoDesde()" (ngModelChange)="rangoDesde.set($event); aplicarFiltros()"></div>
          <div class="campo"><label>Hasta</label><input type="date" [ngModel]="rangoHasta()" (ngModelChange)="rangoHasta.set($event); aplicarFiltros()"></div>
        }
        <div class="campo">
          <label>Estado de pago</label>
          <select [ngModel]="estadoPago()" (ngModelChange)="estadoPago.set($event); aplicarFiltros()">
            <option>Todos</option><option>Pagados</option><option>Con adelanto</option><option>Pendientes</option>
          </select>
        </div>
        <div class="campo">
          <label>Origen de reserva</label>
          <select [ngModel]="origen()" (ngModelChange)="origen.set($event); aplicarFiltros()">
            <option>Todos</option><option>Web</option><option>WhatsApp</option><option>Recepción</option>
          </select>
        </div>
        <div class="campo">
          <label>Tratamiento</label>
          <select [ngModel]="tratamientoId()" (ngModelChange)="tratamientoId.set($event); aplicarFiltros()">
            <option value="Todos">Todos</option>
            @for (t of tratamientos; track t.id) { <option [value]="t.id">{{ t.nombre }}</option> }
          </select>
        </div>
        <div class="campo"><label>Zona tratada</label><input type="search" placeholder="Rostro, abdomen, espalda..." [ngModel]="zona()" (ngModelChange)="zona.set($event); aplicarFiltros()"></div>
        <div class="campo filtros-grid__buscar"><label>Buscar</label><input type="search" placeholder="Paciente, DNI, celular, código o tratamiento" [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event); aplicarFiltros()"></div>
      </div>
      <div class="filtros-acciones">
        <button type="button" class="btn btn--vino btn--sm" (click)="aplicarFiltros()">Aplicar filtros</button>
        <button type="button" class="btn btn--linea btn--sm" (click)="limpiarFiltros()">Limpiar filtros</button>
        <button type="button" class="btn btn--linea btn--sm" (click)="exportarExcel()">Exportar resultado a Excel</button>
      </div>
    </section>

    <section class="indicadores-grid">
      @for (kpi of indicadores(); track kpi.titulo) {
        <article [class]="'indicador indicador--' + kpi.tono">
          <span>{{ kpi.titulo }}</span><strong>{{ kpi.monto }}</strong><p>{{ kpi.nota }}</p>
        </article>
      }
    </section>

    <section class="resumen-rapido">
      @for (r of resumenesRapidos(); track r.etiqueta) {
        <article class="resumen-card">
          <span>{{ r.etiqueta }}</span><strong>{{ soles(r.generado) }}</strong>
          <p>Total generado. Cobrado: {{ soles(r.cobrado) }} · Pendiente: {{ soles(r.pendiente) }}</p>
        </article>
      }
    </section>

    @if (mostrarResumenDiario()) {
      <section class="reportes-panel">
        <div class="panel-titulo"><div><span class="dato__label">Resumen por día</span><h2>Generado, cobrado y pendiente</h2></div></div>
        <div class="tabla-envoltura">
          <table class="tabla">
            <thead><tr><th>Fecha</th><th class="num">Generado</th><th class="num">Cobrado</th><th class="num">Pendiente</th></tr></thead>
            <tbody>
              @for (dia of resumenDiario(); track dia.fecha) {
                <tr><td><strong>{{ dia.dia }}</strong><br><small>{{ dia.fecha }}</small></td><td class="num color-morado">{{ soles(dia.generado) }}</td><td class="num color-verde">{{ soles(dia.cobrado) }}</td><td class="num color-naranja">{{ soles(dia.pendiente) }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    }

    <section class="reportes-panel">
      <div class="panel-titulo">
        <div>
          <span class="dato__label">Detalle</span>
          <h2>{{ tablaActiva() === 'atenciones' ? 'Atenciones y pacientes' : 'Ventas de productos' }}</h2>
        </div>
        <span class="chip">{{ tablaActiva() === 'atenciones' ? atencionesFiltradas().length + ' registros' : productosFiltrados().length + ' ventas' }}</span>
      </div>

      <div class="tabla-tabs">
        <button type="button" [class.tabla-tab--activa]="tablaActiva() === 'atenciones'" (click)="tablaActiva.set('atenciones')">
          Atenciones y pacientes
          <span>{{ atencionesFiltradas().length }}</span>
        </button>
        <button type="button" [class.tabla-tab--activa]="tablaActiva() === 'productos'" (click)="tablaActiva.set('productos')">
          Ventas de productos
          <span>{{ productosFiltrados().length }}</span>
        </button>
      </div>

      @if (tablaActiva() === 'atenciones') {
        <div class="tabla-envoltura">
          <table class="tabla tabla-detalle">
            <thead>
              <tr><th>Fecha y hora</th><th>Paciente</th><th>Tratamiento</th><th>Zona / notas</th><th class="num">Precio total</th><th class="num">Pagado</th><th class="num">Saldo pendiente</th><th>Estado</th><th>Método</th><th>Origen</th></tr>
            </thead>
            <tbody>
              @for (c of atencionesPaginadas(); track c.id) {
                <tr>
                  <td><div class="mini-dato"><strong>{{ c.fecha }}</strong><span>{{ c.horaInicio }} · {{ c.codigo }}</span></div></td>
                  <td><div class="mini-dato"><strong>{{ pacienteNombre(c) }}</strong><span>{{ pacienteDetalle(c) }}</span></div></td>
                  <td>{{ tratamientosCita(c) }}</td>
                  <td><div class="mini-dato"><strong>{{ c.zonaTratamiento || 'Sin zona indicada' }}</strong><span>{{ c.notas || 'Sin notas' }}</span></div></td>
                  <td class="num">{{ soles(totalCita(c)) }}</td>
                  <td class="num color-verde">{{ soles(pagadoCita(c)) }}</td>
                  <td class="num" [class.color-naranja]="saldoCita(c) > 0" [class.color-verde]="saldoCita(c) === 0">{{ soles(saldoCita(c)) }}</td>
                  <td><span [class]="clasePago(estadoVisualCita(c))">{{ estadoVisualCita(c) }}</span></td>
                  <td>{{ metodoPagoCita(c) }}</td>
                  <td><span [class]="claseOrigen(c.origen)">{{ origenLegible(c.origen) }}</span></td>
                </tr>
              } @empty { <tr><td colspan="10" class="vacio">No hay atenciones con los filtros seleccionados.</td></tr> }
            </tbody>
          </table>
        </div>
        <div class="paginacion">
          <button type="button" class="boton-icono" (click)="paginaAtenciones.set(paginaAtenciones() - 1)" [disabled]="paginaAtenciones() <= 1">Anterior</button>
          @for (p of paginasAtenciones(); track p) { <button type="button" class="boton-icono" [class.boton-icono--activo]="p === paginaAtenciones()" (click)="paginaAtenciones.set(p)">{{ p }}</button> }
          <button type="button" class="boton-icono" (click)="paginaAtenciones.set(paginaAtenciones() + 1)" [disabled]="paginaAtenciones() >= totalPaginasAtenciones()">Siguiente</button>
        </div>
      } @else {
        <div class="tabla-envoltura">
          <table class="tabla tabla-detalle">
            <thead><tr><th>Fecha</th><th>Cliente</th><th>Productos</th><th class="num">Total</th><th class="num">Pagado</th><th class="num">Saldo</th><th>Estado</th><th>Método</th></tr></thead>
            <tbody>
              @for (p of productosPaginados(); track p.id) {
                <tr>
                  <td><strong>{{ p.fecha }}</strong><br><small>{{ p.codigo }}</small></td><td>{{ nombrePedido(p) }}<br><small>DNI {{ p.dni || '—' }} · {{ p.celular }}</small></td><td>{{ productosPedido(p) }}</td>
                  <td class="num">{{ soles(totalPedido(p)) }}</td><td class="num color-verde">{{ soles(pagadoPedido(p)) }}</td><td class="num" [class.color-naranja]="saldoPedido(p) > 0" [class.color-verde]="saldoPedido(p) === 0">{{ soles(saldoPedido(p)) }}</td>
                  <td><span [class]="clasePago(estadoVisualPedido(p))">{{ estadoVisualPedido(p) }}</span></td><td>{{ p.metodoPago || 'Por definir' }}</td>
                </tr>
              } @empty { <tr><td colspan="8" class="vacio">No hay ventas de productos con los filtros seleccionados.</td></tr> }
            </tbody>
          </table>
        </div>
        <div class="paginacion">
          <button type="button" class="boton-icono" (click)="paginaProductos.set(paginaProductos() - 1)" [disabled]="paginaProductos() <= 1">Anterior</button>
          @for (p of paginasProductos(); track p) { <button type="button" class="boton-icono" [class.boton-icono--activo]="p === paginaProductos()" (click)="paginaProductos.set(p)">{{ p }}</button> }
          <button type="button" class="boton-icono" (click)="paginaProductos.set(paginaProductos() + 1)" [disabled]="paginaProductos() >= totalPaginasProductos()">Siguiente</button>
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .reportes-panel { margin-bottom: 20px; border: 1px solid var(--linea); border-radius: var(--radio-lg); background: #fff; overflow: hidden; }
    .panel-titulo { display: flex; justify-content: space-between; gap: 16px; align-items: center; padding: 20px 22px; border-bottom: 1px solid var(--linea); }
    .panel-titulo h2 { margin: 4px 0 0; color: var(--vino); font-size: 1.45rem; line-height: 1.15; }
    .filtros-grid { display: grid; grid-template-columns: repeat(4, minmax(180px, 1fr)); gap: 14px; padding: 20px 22px 12px; }
    .filtros-grid__buscar { grid-column: span 2; }
    .filtros-acciones { display: flex; flex-wrap: wrap; gap: 10px; padding: 0 22px 22px; }
    .indicadores-grid { display: grid; grid-template-columns: repeat(6, minmax(150px, 1fr)); gap: 14px; margin-bottom: 18px; }
    .indicador { min-height: 150px; padding: 18px; border-radius: var(--radio-lg); border: 1px solid var(--linea); background: #fff; box-shadow: 0 14px 34px rgba(116, 16, 55, .06); }
    .indicador span, .resumen-card span { display: block; color: var(--gris); font-size: .77rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; margin-bottom: 12px; }
    .indicador strong { display: block; font-family: 'Cormorant Garamond', Georgia, serif; font-size: 2.25rem; line-height: 1; }
    .indicador p, .resumen-card p { margin: 12px 0 0; color: var(--gris); font-size: .92rem; line-height: 1.45; }
    .indicador--morado { border-left: 5px solid #6d5bd0; background: #f7f5ff; } .indicador--morado strong, .color-morado { color: #6d5bd0; }
    .indicador--verde { border-left: 5px solid #168a52; background: #f2fbf6; } .indicador--verde strong, .color-verde { color: #168a52; }
    .indicador--naranja { border-left: 5px solid #c47a11; background: #fff8ed; } .indicador--naranja strong, .color-naranja { color: #c47a11; }
    .indicador--rojo { border-left: 5px solid #bf2c4b; background: #fff1f4; } .indicador--rojo strong { color: #bf2c4b; }
    .indicador--menta { border-left: 5px solid #42a77a; background: #f1fbf7; } .indicador--menta strong { color: #42a77a; }
    .indicador--azul { border-left: 5px solid #2b86b8; background: #f0f8fc; } .indicador--azul strong { color: #2b86b8; }
    .resumen-rapido { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 20px; }
    .resumen-card { padding: 16px 18px; border: 1px solid var(--linea); border-radius: var(--radio-lg); background: #fff; }
    .resumen-card strong { display: block; color: var(--vino); font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.9rem; line-height: 1; }
    .tabla-tabs { display: flex; flex-wrap: wrap; gap: 10px; padding: 16px 18px; border-bottom: 1px solid var(--linea); background: var(--rosa-50); }
    .tabla-tabs button { border: 1px solid var(--linea); background: #fff; color: var(--vino); border-radius: 999px; padding: 10px 16px; cursor: pointer; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; font-size: .78rem; }
    .tabla-tabs button span { display: inline-grid; place-items: center; min-width: 24px; height: 24px; margin-left: 8px; padding: 0 7px; border-radius: 999px; background: var(--rosa-50); color: var(--magenta); }
    .tabla-tabs .tabla-tab--activa { background: var(--vino); border-color: var(--vino); color: #fff; box-shadow: 0 12px 24px rgba(116, 16, 55, .16); }
    .tabla-tabs .tabla-tab--activa span { background: rgba(255,255,255,.18); color: #fff; }
    .tabla-detalle th, .tabla-detalle td { vertical-align: top; }
    .mini-dato { display: grid; gap: 4px; } .mini-dato span, small { color: var(--gris-claro); font-size: .84rem; }
    .paginacion { display: flex; justify-content: flex-end; align-items: center; gap: 8px; flex-wrap: wrap; padding: 14px 18px 18px; border-top: 1px solid var(--linea); }
    .boton-icono--activo { background: var(--vino); color: #fff; border-color: var(--vino); }
    .vacio { text-align: center; color: var(--gris-claro); padding: 26px 0; }
    @media (max-width: 1500px) { .indicadores-grid { grid-template-columns: repeat(3, 1fr); } .filtros-grid { grid-template-columns: repeat(3, minmax(180px, 1fr)); } }
    @media (max-width: 980px) { .indicadores-grid, .resumen-rapido { grid-template-columns: repeat(2, 1fr); } .filtros-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .filtros-grid__buscar { grid-column: span 2; } .panel-titulo { align-items: flex-start; flex-direction: column; } }
    @media (max-width: 640px) { .indicadores-grid, .resumen-rapido, .filtros-grid { grid-template-columns: 1fr; } .filtros-grid__buscar { grid-column: auto; } .indicador { min-height: auto; } .indicador strong { font-size: 1.85rem; } .paginacion { justify-content: flex-start; } }
  `]
})
export class ReportesComponent {
  private agenda = inject(AgendaService);
  private pacientes = inject(PacientesService);
  private planes = inject(PlanesService);
  soles = soles;
  tratamientos = TRATAMIENTOS;
  periodo = signal<PeriodoReporte>('hoy');
  fechaEspecifica = signal(HOY_ISO);
  semanaEspecifica = signal(HOY_ISO);
  mesEspecifico = signal(HOY_ISO.slice(0, 7));
  rangoDesde = signal(HOY_ISO);
  rangoHasta = signal(HOY_ISO);
  estadoPago = signal<EstadoPagoFiltro>('Todos');
  origen = signal<OrigenFiltro>('Todos');
  tratamientoId = signal<string>('Todos');
  zona = signal('');
  busqueda = signal('');
  paginaAtenciones = signal(1);
  paginaProductos = signal(1);
  tablaActiva = signal<TablaReporte>('atenciones');
  porPagina = 8;

  rangoActivo = computed(() => this.calcularRango());
  atencionesFiltradas = computed(() => this.filtrarAtenciones());
  productosFiltrados = computed(() => this.filtrarProductos());
  atencionesContables = computed(() => this.atencionesFiltradas().filter(c => this.esCitaContable(c)));
  productosContables = computed(() => this.productosFiltrados().filter(p => this.esPedidoContable(p)));
  totalGenerado = computed(() => this.atencionesContables().reduce((t, c) => t + this.totalCita(c), 0) + this.productosContables().reduce((t, p) => t + this.totalPedido(p), 0));
  totalCobrado = computed(() => this.atencionesContables().reduce((t, c) => t + this.pagadoCita(c), 0) + this.productosContables().reduce((t, p) => t + this.pagadoPedido(p), 0) + this.pagosPlanesDirectos().reduce((t, p) => t + p.monto, 0));
  pendienteCobrar = computed(() => this.atencionesContables().reduce((t, c) => t + this.saldoCita(c), 0) + this.productosContables().reduce((t, p) => t + this.saldoPedido(p), 0));
  pacientesConDeuda = computed(() => new Set(this.atencionesContables().filter(c => this.saldoCita(c) > 0).map(c => c.pacienteId)).size);
  atencionesCobradas = computed(() => this.atencionesContables().reduce((t, c) => t + this.pagadoCita(c), 0) + this.pagosPlanesDirectos().reduce((t, p) => t + p.monto, 0));
  productosCobrados = computed(() => this.productosContables().reduce((t, p) => t + this.pagadoPedido(p), 0));

  indicadores = computed<IndicadorReporte[]>(() => [
    { titulo: 'Total generado', monto: soles(this.totalGenerado()), nota: 'Valor total de atenciones y productos del periodo, aunque todavía falte cobrar.', tono: 'morado' },
    { titulo: 'Total cobrado', monto: soles(this.totalCobrado()), nota: 'Dinero recibido por atenciones y productos ya pagados.', tono: 'verde' },
    { titulo: 'Pendiente por cobrar', monto: soles(this.pendienteCobrar()), nota: 'Saldos que aún deben cancelar pacientes o clientes.', tono: 'naranja' },
    { titulo: 'Pacientes con deuda', monto: String(this.pacientesConDeuda()), nota: 'Pacientes con atenciones registradas y saldo pendiente.', tono: 'rojo' },
    { titulo: 'Atenciones cobradas', monto: soles(this.atencionesCobradas()), nota: 'Dinero recibido solo por citas, tratamientos o planes.', tono: 'menta' },
    { titulo: 'Productos cobrados', monto: soles(this.productosCobrados()), nota: 'Dinero recibido solo por ventas de productos.', tono: 'azul' }
  ]);
  resumenesRapidos = computed(() => [
    this.resumenRango('Hoy', { desde: HOY_ISO, hasta: HOY_ISO, etiqueta: HOY_ISO }),
    this.resumenRango('Últimos 7 días', this.rangoUltimos(7)),
    this.resumenRango('Mes en curso', this.rangoMes(HOY_ISO.slice(0, 7)))
  ]);
  resumenDiario = computed(() => this.fechasDelRango(this.rangoActivo()).map(fecha => this.resumenDia(fecha)));
  totalPaginasAtenciones = computed(() => Math.max(1, Math.ceil(this.atencionesFiltradas().length / this.porPagina)));
  totalPaginasProductos = computed(() => Math.max(1, Math.ceil(this.productosFiltrados().length / this.porPagina)));
  atencionesPaginadas = computed(() => this.paginar(this.atencionesFiltradas(), this.paginaAtenciones()));
  productosPaginados = computed(() => this.paginar(this.productosFiltrados(), this.paginaProductos()));
  paginasAtenciones = computed(() => this.paginas(this.totalPaginasAtenciones()));
  paginasProductos = computed(() => this.paginas(this.totalPaginasProductos()));

  aplicarFiltros(): void { this.paginaAtenciones.set(1); this.paginaProductos.set(1); }
  limpiarFiltros(): void {
    this.periodo.set('hoy'); this.fechaEspecifica.set(HOY_ISO); this.semanaEspecifica.set(HOY_ISO); this.mesEspecifico.set(HOY_ISO.slice(0, 7));
    this.rangoDesde.set(HOY_ISO); this.rangoHasta.set(HOY_ISO); this.estadoPago.set('Todos'); this.origen.set('Todos'); this.tratamientoId.set('Todos');
    this.zona.set(''); this.busqueda.set(''); this.aplicarFiltros();
  }
  mostrarResumenDiario(): boolean { return this.periodo() !== 'hoy' && this.fechasDelRango(this.rangoActivo()).length > 1; }
  pacienteNombre(c: Cita): string { const p = this.pacientes.porId(c.pacienteId); return p ? `${p.nombre} ${p.apellido}` : 'Paciente sin registro'; }
  pacienteDetalle(c: Cita): string { const p = this.pacientes.porId(c.pacienteId); return p ? `DNI ${p.dni} · ${p.celular}` : 'Sin DNI registrado'; }
  tratamientosCita(c: Cita): string { const ids = c.tratamientosIncluidos?.length ? c.tratamientosIncluidos : [c.tratamientoId]; return ids.map(id => tratamientoPorId(id)?.nombre ?? 'Tratamiento').join(' + '); }
  productosPedido(p: Pedido): string { return p.items.map(item => `${item.cantidad} x ${PRODUCTOS.find(prod => prod.id === item.productoId)?.nombre ?? 'Producto'}`).join(', '); }
  nombrePedido(p: Pedido): string { return `${p.nombre ?? ''} ${p.apellido ?? ''}`.trim() || p.cliente; }
  totalCita(c: Cita): number { return this.esCitaContable(c) ? Math.max(Number(c.montoTotal || 0), 0) : 0; }
  pagadoCita(c: Cita): number { return this.esCitaContable(c) ? Math.min(Math.max(Number(c.montoPagado || 0), 0), this.totalCita(c)) : 0; }
  saldoCita(c: Cita): number { return Math.max(this.totalCita(c) - this.pagadoCita(c), 0); }
  totalPedido(p: Pedido): number { return this.esPedidoContable(p) ? Math.max(Number(p.total || 0), 0) : 0; }
  pagadoPedido(p: Pedido): number { return this.esPedidoContable(p) ? Math.min(Math.max(Number(p.pagado || 0), 0), this.totalPedido(p)) : 0; }
  saldoPedido(p: Pedido): number { return Math.max(this.totalPedido(p) - this.pagadoPedido(p), 0); }
  estadoVisualCita(c: Cita): EstadoVisual { if (!this.esCitaContable(c)) { return 'Cancelado'; } if (this.saldoCita(c) === 0 && this.totalCita(c) > 0) { return 'Pagado'; } return this.pagadoCita(c) > 0 ? 'Con adelanto' : 'Pendiente'; }
  estadoVisualPedido(p: Pedido): EstadoVisual { if (!this.esPedidoContable(p)) { return 'Cancelado'; } if (this.saldoPedido(p) === 0 && this.totalPedido(p) > 0) { return 'Pagado'; } return this.pagadoPedido(p) > 0 ? 'Con adelanto' : 'Pendiente'; }
  metodoPagoCita(c: Cita): string { const pagos = c.pagosDetalle?.filter(p => p.monto > 0) ?? []; return pagos.length ? Array.from(new Set(pagos.map(p => p.metodo))).join(' + ') : c.metodoPago || 'Por definir'; }
  clasePago(estado: EstadoVisual): string { if (estado === 'Pagado') { return 'chip chip--ok chip--punto'; } if (estado === 'Con adelanto') { return 'chip chip--alerta chip--punto'; } if (estado === 'Pendiente') { return 'chip chip--error chip--punto'; } return 'chip'; }
  claseOrigen(origen: Cita['origen']): string { return origen === 'Web' ? 'chip chip--info' : origen === 'WhatsApp' ? 'chip chip--alerta' : 'chip'; }
  origenLegible(origen: Cita['origen']): string { return origen === 'Web' ? 'Página web' : origen === 'WhatsApp' ? 'WhatsApp' : 'Recepción/local'; }

  exportarExcel(): void {
    const filas = [
      ['REPORTE RUBI ESTETICA INTEGRAL'], ['Periodo', this.rangoActivo().etiqueta], [],
      ['Indicador', 'Valor', 'Descripción'], ...this.indicadores().map(k => [k.titulo, k.monto, k.nota]), [],
      ['RESUMEN POR DÍA'], ['Fecha', 'Generado', 'Cobrado', 'Pendiente'], ...this.resumenDiario().map(d => [d.fecha, String(d.generado), String(d.cobrado), String(d.pendiente)]), [],
      ['ATENCIONES'], ['Fecha', 'Hora', 'Paciente', 'Tratamiento', 'Zona / notas', 'Total', 'Pagado', 'Saldo', 'Estado', 'Método', 'Origen'],
      ...this.atencionesFiltradas().map(c => [c.fecha, c.horaInicio, this.pacienteNombre(c), this.tratamientosCita(c), `${c.zonaTratamiento || 'Sin zona'} ${c.notas || ''}`.trim(), String(this.totalCita(c)), String(this.pagadoCita(c)), String(this.saldoCita(c)), this.estadoVisualCita(c), this.metodoPagoCita(c), this.origenLegible(c.origen)]), [],
      ['PRODUCTOS'], ['Fecha', 'Cliente', 'Productos', 'Total', 'Pagado', 'Saldo', 'Estado', 'Método'],
      ...this.productosFiltrados().map(p => [p.fecha, this.nombrePedido(p), this.productosPedido(p), String(this.totalPedido(p)), String(this.pagadoPedido(p)), String(this.saldoPedido(p)), this.estadoVisualPedido(p), p.metodoPago || 'Por definir'])
    ];
    const contenido = filas.map(fila => fila.map(celda => `"${String(celda).replace(/"/g, '""')}"`).join('\t')).join('\n');
    const url = URL.createObjectURL(new Blob([contenido], { type: 'application/vnd.ms-excel;charset=utf-8;' }));
    const enlace = document.createElement('a');
    enlace.href = url; enlace.download = `reporte-rubi-${this.rangoActivo().desde}-a-${this.rangoActivo().hasta}.xls`; enlace.click();
    URL.revokeObjectURL(url);
  }

  private filtrarAtenciones(): Cita[] {
    const rango = this.rangoActivo(); const texto = this.busqueda().trim().toLowerCase(); const zona = this.zona().trim().toLowerCase(); const tratamiento = this.tratamientoId();
    return this.agenda.citas()
      .filter(c => c.fecha >= rango.desde && c.fecha <= rango.hasta)
      .filter(c => this.origen() === 'Todos' || c.origen === this.origen())
      .filter(c => tratamiento === 'Todos' || (c.tratamientosIncluidos?.length ? c.tratamientosIncluidos : [c.tratamientoId]).includes(Number(tratamiento)))
      .filter(c => !zona || `${c.zonaTratamiento ?? ''} ${c.notas ?? ''}`.toLowerCase().includes(zona))
      .filter(c => this.coincideEstadoPago(this.estadoVisualCita(c)))
      .filter(c => !texto || `${this.pacienteNombre(c)} ${this.pacienteDetalle(c)} ${this.tratamientosCita(c)} ${c.codigo} ${c.origen}`.toLowerCase().includes(texto))
      .sort((a, b) => `${b.fecha} ${b.horaInicio}`.localeCompare(`${a.fecha} ${a.horaInicio}`));
  }
  private filtrarProductos(): Pedido[] {
    const rango = this.rangoActivo(); const texto = this.busqueda().trim().toLowerCase();
    return PEDIDOS.filter(p => p.fecha >= rango.desde && p.fecha <= rango.hasta)
      .filter(p => this.coincideEstadoPago(this.estadoVisualPedido(p)))
      .filter(p => !texto || `${this.nombrePedido(p)} ${p.dni ?? ''} ${p.celular} ${p.codigo} ${this.productosPedido(p)} ${p.metodoPago ?? ''}`.toLowerCase().includes(texto))
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
  }
  private coincideEstadoPago(estado: EstadoVisual): boolean { return this.estadoPago() === 'Todos' || (this.estadoPago() === 'Pagados' && estado === 'Pagado') || (this.estadoPago() === 'Con adelanto' && estado === 'Con adelanto') || (this.estadoPago() === 'Pendientes' && estado === 'Pendiente'); }
  private esCitaContable(c: Cita): boolean { return c.estado !== 'Cancelada' && c.estado !== 'No asistió' && c.estadoPago !== 'Reembolsado' && (!c.planId || !c.numeroSesionPlan || c.numeroSesionPlan === 1); }
  private esPedidoContable(p: Pedido): boolean { return p.estado !== 'Cancelado' && p.estadoPago !== 'Reembolsado'; }
  private pagosPlanesDirectos(): { fecha: string; monto: number; metodo: MetodoPago; estado: EstadoPago }[] {
    const rango = this.rangoActivo();
    const codigos = new Set(this.agenda.citas().flatMap(c => (c.pagosDetalle ?? []).map(p => p.codigoOperacion).filter(Boolean) as string[]));
    return this.planes.planes().flatMap(plan => (plan.pagosDetalle ?? []).map(p => ({ fecha: p.fecha, monto: p.monto, metodo: p.metodo, estado: 'Pagado' as EstadoPago, codigo: p.codigoOperacion })))
      .filter(p => p.fecha >= rango.desde && p.fecha <= rango.hasta && (!p.codigo || !codigos.has(p.codigo)));
  }
  private resumenRango(etiqueta: string, rango: RangoFechas): ResumenDia & { etiqueta: string } {
    const citas = this.agenda.citas().filter(c => c.fecha >= rango.desde && c.fecha <= rango.hasta && this.esCitaContable(c));
    const pedidos = PEDIDOS.filter(p => p.fecha >= rango.desde && p.fecha <= rango.hasta && this.esPedidoContable(p));
    const pagos = this.planes.planes().flatMap(plan => plan.pagosDetalle ?? []).filter(p => p.fecha >= rango.desde && p.fecha <= rango.hasta);
    return { etiqueta, fecha: rango.etiqueta, dia: etiqueta, generado: citas.reduce((t, c) => t + this.totalCita(c), 0) + pedidos.reduce((t, p) => t + this.totalPedido(p), 0), cobrado: citas.reduce((t, c) => t + this.pagadoCita(c), 0) + pedidos.reduce((t, p) => t + this.pagadoPedido(p), 0) + pagos.reduce((t, p) => t + p.monto, 0), pendiente: citas.reduce((t, c) => t + this.saldoCita(c), 0) + pedidos.reduce((t, p) => t + this.saldoPedido(p), 0) };
  }
  private resumenDia(fecha: string): ResumenDia {
    const citas = this.atencionesFiltradas().filter(c => c.fecha === fecha && this.esCitaContable(c)); const pedidos = this.productosFiltrados().filter(p => p.fecha === fecha && this.esPedidoContable(p)); const pagos = this.pagosPlanesDirectos().filter(p => p.fecha === fecha);
    return { fecha, dia: this.nombreDia(fecha), generado: citas.reduce((t, c) => t + this.totalCita(c), 0) + pedidos.reduce((t, p) => t + this.totalPedido(p), 0), cobrado: citas.reduce((t, c) => t + this.pagadoCita(c), 0) + pedidos.reduce((t, p) => t + this.pagadoPedido(p), 0) + pagos.reduce((t, p) => t + p.monto, 0), pendiente: citas.reduce((t, c) => t + this.saldoCita(c), 0) + pedidos.reduce((t, p) => t + this.saldoPedido(p), 0) };
  }
  private calcularRango(): RangoFechas { if (this.periodo() === 'ultimos7') { return this.rangoUltimos(7); } if (this.periodo() === 'mesActual') { return this.rangoMes(HOY_ISO.slice(0, 7)); } if (this.periodo() === 'fecha') { return { desde: this.fechaEspecifica(), hasta: this.fechaEspecifica(), etiqueta: `Fecha ${this.fechaEspecifica()}` }; } if (this.periodo() === 'semana') { return this.rangoSemana(this.semanaEspecifica()); } if (this.periodo() === 'mes') { return this.rangoMes(this.mesEspecifico()); } if (this.periodo() === 'rango') { return this.rangoManual(); } return { desde: HOY_ISO, hasta: HOY_ISO, etiqueta: `Hoy ${HOY_ISO}` }; }
  private rangoUltimos(dias: number): RangoFechas { const base = new Date(`${HOY_ISO}T12:00:00`); base.setDate(base.getDate() - (dias - 1)); return { desde: aISO(base), hasta: HOY_ISO, etiqueta: `${aISO(base)} al ${HOY_ISO}` }; }
  private rangoSemana(fecha: string): RangoFechas { const base = new Date(`${fecha}T12:00:00`); const dia = base.getDay() || 7; const lunes = new Date(base); lunes.setDate(base.getDate() - dia + 1); const domingo = new Date(lunes); domingo.setDate(lunes.getDate() + 6); return { desde: aISO(lunes), hasta: aISO(domingo), etiqueta: `Semana ${aISO(lunes)} al ${aISO(domingo)}` }; }
  private rangoMes(mes: string): RangoFechas { const [anio, numero] = mes.split('-').map(Number); const desde = `${anio}-${String(numero).padStart(2, '0')}-01`; const hasta = aISO(new Date(anio, numero, 0)); return { desde, hasta, etiqueta: `${MESES[numero - 1]} ${anio}` }; }
  private rangoManual(): RangoFechas { const desde = this.rangoDesde() <= this.rangoHasta() ? this.rangoDesde() : this.rangoHasta(); const hasta = this.rangoDesde() <= this.rangoHasta() ? this.rangoHasta() : this.rangoDesde(); return { desde, hasta, etiqueta: `Rango ${desde} al ${hasta}` }; }
  private fechasDelRango(rango: RangoFechas): string[] { const fechas: string[] = []; const cursor = new Date(`${rango.desde}T12:00:00`); const fin = new Date(`${rango.hasta}T12:00:00`); while (cursor <= fin && fechas.length < 370) { fechas.push(aISO(cursor)); cursor.setDate(cursor.getDate() + 1); } return fechas; }
  private nombreDia(fecha: string): string { return ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date(`${fecha}T12:00:00`).getDay()]; }
  private paginar<T>(items: T[], pagina: number): T[] { const inicio = (Math.min(Math.max(pagina, 1), Math.max(1, Math.ceil(items.length / this.porPagina))) - 1) * this.porPagina; return items.slice(inicio, inicio + this.porPagina); }
  private paginas(total: number): number[] { return Array.from({ length: total }, (_, i) => i + 1); }
}
