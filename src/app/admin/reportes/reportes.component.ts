import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  HOY_ISO, LOCALES, MESES, PEDIDOS, PRODUCTOS, TRATAMIENTOS,
  aISO, localPorId, soles, tratamientoPorId
} from '../../data/datos';
import { Cita, MetodoPago, Pedido } from '../../data/modelos';
import { AgendaService } from '../../compartido/agenda.service';
import { PacientesService } from '../../compartido/pacientes.service';
import { PlanesService } from '../../compartido/planes.service';

type GrupoCaja = 'Todos' | 'Atendidos pagados' | 'Atendidos con saldo' | 'Pendientes por atender' | 'Cancelados';

interface ResumenPeriodo {
  etiqueta: string;
  desde: string;
  hasta: string;
  atenciones: number;
  productos: number;
  cobrado: number;
  pendiente: number;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Reportes</h1>
        <p>Registro de caja y atención para reemplazar el cuaderno: pacientes, tratamientos, pagos, deuda y ventas por periodo.</p>
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
      <div class="campo">
        <label>Estado de caja</label>
        <select [ngModel]="grupo()" (ngModelChange)="grupo.set($event)">
          @for (g of grupos; track g) { <option>{{ g }}</option> }
        </select>
      </div>
      <div class="campo barra-filtros__crecer">
        <label>Buscar</label>
        <input type="search" placeholder="Paciente, tratamiento, código o celular" [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)">
      </div>
    </div>

    <div class="resumen-rapido">
      @for (r of resumenes(); track r.etiqueta) {
        <div class="kpi kpi--acento">
          <span class="kpi__label">{{ r.etiqueta }}</span>
          <span class="kpi__valor">{{ soles(r.cobrado) }}</span>
          <span class="kpi__nota">{{ r.atenciones }} atenciones · {{ r.productos }} pedidos · pendiente {{ soles(r.pendiente) }}</span>
        </div>
      }
    </div>

    <div class="kpis kpis-5">
      <div class="kpi kpi--acento"><span class="kpi__label">Cobrado total</span><span class="kpi__valor">{{ soles(cobradoTotal()) }}</span><span class="kpi__nota">Atenciones + productos pagados</span></div>
      <div class="kpi"><span class="kpi__label">Atenciones cobradas</span><span class="kpi__valor" style="color:var(--ok)">{{ soles(cobradoAtenciones()) }}</span><span class="kpi__nota">{{ atendidosPagados().length }} pacientes atendidos y pagados</span></div>
      <div class="kpi"><span class="kpi__label">Productos cobrados</span><span class="kpi__valor">{{ soles(cobradoProductos()) }}</span><span class="kpi__nota">{{ pedidosPeriodo().length }} pedidos en el periodo</span></div>
      <div class="kpi"><span class="kpi__label">Pendiente por cobrar</span><span class="kpi__valor" style="color:var(--alerta)">{{ soles(pendienteTotal()) }}</span><span class="kpi__nota">Saldo de citas y pedidos</span></div>
      <div class="kpi"><span class="kpi__label">Atendidos con deuda</span><span class="kpi__valor" style="color:var(--error)">{{ atendidosConSaldo().length }}</span><span class="kpi__nota">Ya atendidos, falta completar pago</span></div>
    </div>

    <div class="tabla-panel">
      <div class="tabla-panel__cabecera">
        <div>
          <h3>Cuaderno de caja: atenciones y pagos</h3>
          <span class="dato__label">{{ tituloPeriodo() }} · {{ citasCaja().length }} registros</span>
        </div>
        <span class="chip chip--info">Web + Recepción + WhatsApp</span>
      </div>
      <div class="tabla-envoltura">
        <table class="tabla tabla-caja">
          <thead>
            <tr>
              <th>Fecha / hora</th><th>Paciente</th><th>Tratamiento</th><th>Zona / notas</th>
              <th class="num">Precio</th><th>Método de pago</th><th class="num">Pagado</th><th class="num">Falta</th><th>Control</th>
            </tr>
          </thead>
          <tbody>
            @for (c of citasCaja(); track c.id) {
              <tr>
                <td><div class="mini-dato"><strong>{{ c.fecha }}</strong><span>{{ c.horaInicio }} · {{ c.codigo }}</span></div></td>
                <td>
                  <div class="mini-dato">
                    <strong>{{ paciente(c)?.nombre }} {{ paciente(c)?.apellido }}</strong>
                    <span>DNI {{ paciente(c)?.dni }} · {{ paciente(c)?.celular }}</span>
                  </div>
                </td>
                <td>
                  <div class="mini-dato">
                    <strong>{{ tratamientosCita(c) }}</strong>
                    <span>{{ local(c.localId) }} · {{ c.origen }}</span>
                  </div>
                </td>
                <td>
                  <div class="mini-dato">
                    <strong>{{ c.zonaTratamiento || 'Sin zona indicada' }}</strong>
                    <span>{{ c.notas || 'Sin notas' }}</span>
                  </div>
                </td>
                <td class="num">{{ soles(c.montoTotal) }}</td>
                <td>{{ metodoPagoCita(c) }}</td>
                <td class="num" style="color:var(--ok)">{{ soles(c.montoPagado) }}</td>
                <td class="num" [style.color]="saldoCita(c) > 0 ? 'var(--alerta)' : 'var(--ok)'">{{ soles(saldoCita(c)) }}</td>
                <td>
                  <div class="estado-stack">
                    <span [class]="claseAtencion(c)">{{ estadoCaja(c) }}</span>
                    <small>{{ c.registradaPor }}<br>{{ c.estado }} · {{ c.estadoPago }}</small>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="9" class="vacio">No hay registros con los filtros seleccionados.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <div class="grid-dos" style="margin-top:20px">
      <div class="tabla-panel">
        <div class="tabla-panel__cabecera"><h3>Citas agendadas por la web</h3><span class="dato__label">{{ citasWeb().length }} registros</span></div>
        <div class="tabla-envoltura">
          <table class="tabla">
            <thead><tr><th>Paciente</th><th>Tratamiento</th><th>Fecha</th><th class="num">Pagado</th><th class="num">Falta</th></tr></thead>
            <tbody>
              @for (c of citasWeb(); track c.id) {
                <tr>
                  <td>{{ paciente(c)?.nombre }} {{ paciente(c)?.apellido }}</td>
                  <td>{{ tratamiento(c)?.nombre }}</td>
                  <td>{{ c.fecha }} {{ c.horaInicio }}</td>
                  <td class="num">{{ soles(c.montoPagado) }}</td>
                  <td class="num">{{ soles(saldoCita(c)) }}</td>
                </tr>
              } @empty { <tr><td colspan="5" class="vacio">Sin citas web en el periodo.</td></tr> }
            </tbody>
          </table>
        </div>
      </div>

      <div class="tabla-panel">
        <div class="tabla-panel__cabecera"><h3>Citas registradas en recepción/local</h3><span class="dato__label">{{ citasRecepcion().length }} registros</span></div>
        <div class="tabla-envoltura">
          <table class="tabla">
            <thead><tr><th>Paciente</th><th>Tratamiento</th><th>Origen</th><th class="num">Pagado</th><th class="num">Falta</th></tr></thead>
            <tbody>
              @for (c of citasRecepcion(); track c.id) {
                <tr>
                  <td>{{ paciente(c)?.nombre }} {{ paciente(c)?.apellido }}</td>
                  <td>{{ tratamiento(c)?.nombre }}</td>
                  <td>{{ c.origen }}</td>
                  <td class="num">{{ soles(c.montoPagado) }}</td>
                  <td class="num">{{ soles(saldoCita(c)) }}</td>
                </tr>
              } @empty { <tr><td colspan="5" class="vacio">Sin citas de recepción en el periodo.</td></tr> }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="grid-dos" style="margin-top:20px">
      <div class="tabla-panel">
        <div class="tabla-panel__cabecera">
          <div><h3>Ventas de productos</h3><span class="dato__label">{{ pedidosPeriodo().length }} pedidos · {{ soles(cobradoProductos()) }} cobrado</span></div>
        </div>
        <div class="tabla-envoltura">
          <table class="tabla">
            <thead><tr><th>Fecha</th><th>Cliente</th><th>Productos</th><th>Estado</th><th class="num">Total</th><th class="num">Pagado</th></tr></thead>
            <tbody>
              @for (p of pedidosPeriodo(); track p.id) {
                <tr>
                  <td>{{ p.fecha }}<br><small>{{ p.codigo }}</small></td>
                  <td>{{ p.cliente }}<br><small>{{ p.celular }}</small></td>
                  <td>{{ productosPedido(p) }}</td>
                  <td><span [class]="p.estadoPago === 'Pagado' ? 'chip chip--ok' : 'chip chip--alerta'">{{ p.estadoPago }}</span></td>
                  <td class="num">{{ soles(p.total) }}</td>
                  <td class="num">{{ soles(p.pagado) }}</td>
                </tr>
              } @empty { <tr><td colspan="6" class="vacio">Sin ventas de productos en el periodo.</td></tr> }
            </tbody>
          </table>
        </div>
      </div>

      <div class="tabla-panel">
        <div class="tabla-panel__cabecera"><h3>Resumen por tratamiento</h3></div>
        <div class="tabla-envoltura">
          <table class="tabla">
            <thead><tr><th>Tratamiento</th><th class="num">Citas</th><th class="num">Cobrado</th><th class="num">Pendiente</th></tr></thead>
            <tbody>
              @for (f of porTratamiento(); track f.nombre) {
                <tr>
                  <td>{{ f.nombre }}</td>
                  <td class="num">{{ f.cantidad }}</td>
                  <td class="num" style="color:var(--ok)">{{ soles(f.pagado) }}</td>
                  <td class="num" style="color:var(--alerta)">{{ soles(f.pendiente) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="tabla-panel" style="margin-top:20px">
      <div class="tabla-panel__cabecera">
        <div>
          <h3>Seguimiento multisesión</h3>
          <span class="dato__label">{{ planesSeguimiento().length }} planes registrados</span>
        </div>
      </div>
      <div class="tabla-envoltura">
        <table class="tabla tabla-caja">
          <thead>
            <tr>
              <th>Paciente</th><th>Plan / local</th><th>Primera sesión</th><th>Próxima coordinación</th>
              <th class="num">Total</th><th class="num">Pagado</th><th class="num">Falta</th><th>Control</th>
            </tr>
          </thead>
          <tbody>
            @for (plan of planesSeguimiento(); track plan.id) {
              <tr>
                <td>
                  <div class="mini-dato">
                    <strong>{{ pacientePlan(plan.pacienteId) }}</strong>
                    <span>DNI {{ plan.dni }} · {{ celularPlan(plan.pacienteId) }}</span>
                  </div>
                </td>
                <td>
                  <div class="mini-dato">
                    <strong>{{ plan.nombre }}</strong>
                    <span>{{ local(plan.localId) }}</span>
                  </div>
                </td>
                <td>{{ resumenPrimeraSesion(plan) }}</td>
                <td>{{ resumenProximaSesion(plan) }}</td>
                <td class="num">{{ soles(plan.precioTotal) }}</td>
                <td class="num">{{ soles(plan.pagado) }}</td>
                <td class="num" [style.color]="plan.precioTotal - plan.pagado > 0 ? 'var(--alerta)' : 'var(--ok)'">{{ soles(plan.precioTotal - plan.pagado) }}</td>
                <td>
                  <div class="estado-stack">
                    <span [class]="plan.precioTotal - plan.pagado > 0 ? 'chip chip--alerta chip--punto' : 'chip chip--ok chip--punto'">{{ plan.estado }}</span>
                    <small>{{ resumenControlPlan(plan) }}</small>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="8" class="vacio">No hay planes multisesión con los filtros seleccionados.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .resumen-rapido { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-bottom: 18px; }
    .kpis-5 { grid-template-columns: repeat(5, 1fr); margin-bottom: 22px; }
    .grid-dos { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: start; }
    .tabla-caja td { vertical-align: top; }
    .estado-stack { display: grid; gap: 4px; justify-items: start; }
    .estado-stack small { color: var(--gris-claro); font-size: .82rem; }
    .vacio { text-align: center; color: var(--gris-claro); padding: 24px 0; }
    @media (max-width: 1400px) { .kpis-5 { grid-template-columns: repeat(3, 1fr); } .resumen-rapido { grid-template-columns: 1fr; } }
    @media (max-width: 1100px) { .grid-dos { grid-template-columns: 1fr; } .kpis-5 { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class ReportesComponent {
  private agenda = inject(AgendaService);
  private pacientes = inject(PacientesService);
  private planes = inject(PlanesService);
  soles = soles;
  locales = LOCALES;
  grupos: GrupoCaja[] = ['Todos', 'Atendidos pagados', 'Atendidos con saldo', 'Pendientes por atender', 'Cancelados'];
  periodo = signal('hoy');
  sede = signal('Todos');
  grupo = signal<GrupoCaja>('Todos');
  busqueda = signal('');

  tituloPeriodo = computed(() => {
    const [a, m] = HOY_ISO.split('-').map(Number);
    switch (this.periodo()) {
      case 'hoy': return HOY_ISO;
      case 'semana': return `${this.ultimos(7)[0]} al ${HOY_ISO}`;
      case 'mes': return `${MESES[m - 1]} ${a}`;
      default: return 'Histórico completo del prototipo';
    }
  });

  citasPeriodo = computed(() => this.filtrarCitas(this.agenda.citas()));
  pedidosPeriodo = computed(() => this.filtrarPedidos(PEDIDOS));

  citasCaja = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return this.citasPeriodo()
      .filter(c => this.coincideGrupo(c))
      .filter(c => {
        if (!texto) { return true; }
        const p = this.pacientes.porId(c.pacienteId);
        const t = tratamientoPorId(c.tratamientoId);
        return `${p?.nombre} ${p?.apellido} ${p?.dni} ${p?.celular} ${t?.nombre} ${c.codigo}`.toLowerCase().includes(texto);
      })
      .sort((a, b) => `${b.fecha} ${b.horaInicio}`.localeCompare(`${a.fecha} ${a.horaInicio}`));
  });

  atendidosPagados = computed(() => this.citasPeriodo().filter(c => c.estado === 'Atendida' && this.saldoCita(c) === 0));
  atendidosConSaldo = computed(() => this.citasPeriodo().filter(c => c.estado === 'Atendida' && this.saldoCita(c) > 0));
  citasWeb = computed(() => this.citasPeriodo().filter(c => c.origen === 'Web'));
  citasRecepcion = computed(() => this.citasPeriodo().filter(c => c.origen !== 'Web'));
  pagosPlanesDirectos = computed(() =>
    this.planes.planes()
      .flatMap(plan => (plan.pagosDetalle ?? []).map((pago, indice) => ({ plan, pago, indice })))
      .filter(({ plan, pago }) =>
        this.enPeriodo(pago.fecha) &&
        (this.sede() === 'Todos' || this.local(plan.localId) === this.sede()) &&
        (!pago.codigoOperacion || !this.codigoOperacionExisteEnCitas(pago.codigoOperacion))
      )
  );

  cobradoAtenciones = computed(() =>
    this.citasPeriodo().reduce((t, c) => t + c.montoPagado, 0) +
    this.pagosPlanesDirectos().reduce((t, item) => t + item.pago.monto, 0)
  );
  cobradoProductos = computed(() => this.pedidosPeriodo().reduce((t, p) => t + p.pagado, 0));
  cobradoTotal = computed(() => this.cobradoAtenciones() + this.cobradoProductos());
  pendienteTotal = computed(() =>
    this.citasPeriodo().reduce((t, c) => t + this.saldoCita(c), 0) +
    this.pedidosPeriodo().reduce((t, p) => t + Math.max(p.total - p.pagado, 0), 0)
  );

  resumenes = computed<ResumenPeriodo[]>(() => [
    this.resumen('Hoy', HOY_ISO, HOY_ISO),
    this.resumen('Últimos 7 días', this.ultimos(7)[0], HOY_ISO),
    this.resumen('Mes en curso', `${HOY_ISO.slice(0, 7)}-01`, HOY_ISO)
  ]);

  porTratamiento = computed(() => TRATAMIENTOS.map(t => {
    const citas = this.citasPeriodo().filter(c => c.tratamientoId === t.id);
    return {
      nombre: t.nombre,
      cantidad: citas.length,
      pagado: citas.reduce((sum, c) => sum + c.montoPagado, 0),
      pendiente: citas.reduce((sum, c) => sum + this.saldoCita(c), 0)
    };
  }).filter(f => f.cantidad > 0).sort((a, b) => b.pagado - a.pagado));

  planesSeguimiento = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    return this.planes.planes()
      .filter(plan => this.sede() === 'Todos' || this.local(plan.localId) === this.sede())
      .filter(plan => {
        if (!texto) { return true; }
        const paciente = this.pacientes.porId(plan.pacienteId);
        return `${plan.codigo} ${plan.nombre} ${plan.dni} ${paciente?.nombre} ${paciente?.apellido} ${paciente?.celular}`.toLowerCase().includes(texto);
      })
      .sort((a, b) => b.inicio.localeCompare(a.inicio));
  });

  paciente(c: Cita) { return this.pacientes.porId(c.pacienteId); }
  tratamiento(c: Cita) { return tratamientoPorId(c.tratamientoId); }
  pacientePlan(id: number): string {
    const paciente = this.pacientes.porId(id);
    return paciente ? `${paciente.nombre} ${paciente.apellido}` : '—';
  }
  celularPlan(id: number): string {
    return this.pacientes.porId(id)?.celular ?? '—';
  }
  local(id: number): string { return localPorId(id)?.nombre ?? '—'; }
  tratamientosCita(c: Cita): string {
    const ids = c.tratamientosIncluidos?.length ? c.tratamientosIncluidos : [c.tratamientoId];
    return ids.map(id => tratamientoPorId(id)?.nombre ?? 'Tratamiento').join(' + ');
  }

  montoMetodo(c: Cita, metodo: MetodoPago): number {
    if (c.pagosDetalle?.length) {
      return c.pagosDetalle
        .filter(pago => pago.metodo === metodo)
        .reduce((total, pago) => total + pago.monto, 0);
    }
    return c.metodoPago === metodo ? c.montoPagado : 0;
  }

  metodoPagoCita(c: Cita): string {
    const metodos = c.pagosDetalle?.length
      ? Array.from(new Set(c.pagosDetalle.filter(pago => pago.monto !== 0).map(pago => pago.metodo)))
      : c.metodoPago ? [c.metodoPago] : [];
    return metodos.length ? metodos.join(' + ') : 'Por definir';
  }

  saldoCita(c: Cita): number {
    if (c.estado === 'Cancelada' || c.estado === 'No asistió' || c.estadoPago === 'Reembolsado') { return 0; }
    return Math.max(c.montoTotal - c.montoPagado, 0);
  }

  estadoCaja(c: Cita): string {
    if (c.estado === 'Cancelada' || c.estado === 'No asistió') { return 'Cancelado / no asistió'; }
    if (c.estado === 'Atendida' && this.saldoCita(c) === 0) { return 'Atendido y pagado'; }
    if (c.estado === 'Atendida' && this.saldoCita(c) > 0) { return 'Atendido con saldo'; }
    if (this.saldoCita(c) > 0) { return 'Pendiente por atender/cobrar'; }
    return 'Reservado pagado';
  }

  claseAtencion(c: Cita): string {
    const estado = this.estadoCaja(c);
    if (estado === 'Atendido y pagado' || estado === 'Reservado pagado') { return 'chip chip--ok chip--punto'; }
    if (estado === 'Atendido con saldo' || estado === 'Pendiente por atender/cobrar') { return 'chip chip--alerta chip--punto'; }
    return 'chip chip--error chip--punto';
  }

  claseOrigen(origen: string): string {
    if (origen === 'Web') { return 'chip chip--info'; }
    if (origen === 'Recepción') { return 'chip'; }
    return 'chip chip--alerta';
  }

  productosPedido(pedido: Pedido): string {
    return pedido.items.map(item => {
      const producto = PRODUCTOS.find(p => p.id === item.productoId);
      return `${item.cantidad} x ${producto?.nombre ?? 'Producto'}`;
    }).join(', ');
  }

  resumenPrimeraSesion(plan: { sesiones: { numero: number; fecha?: string; hora?: string; procedimiento: string }[] }): string {
    const primera = plan.sesiones.find(s => s.numero === 1) ?? plan.sesiones[0];
    if (!primera) { return 'Sin sesiones registradas'; }
    const fecha = primera.fecha ? `${primera.fecha}${primera.hora ? ` ${primera.hora}` : ''}` : 'Sin fecha';
    return `${fecha} · ${primera.procedimiento}`;
  }

  resumenProximaSesion(plan: { sesiones: { numero: number; fecha?: string; hora?: string; procedimiento: string; estado: string }[] }): string {
    const siguiente = plan.sesiones.find(s => s.estado !== 'Atendida');
    if (!siguiente) { return 'Plan completo'; }
    if (!siguiente.fecha) { return `Sesión ${siguiente.numero} pendiente de coordinar`; }
    return `Sesión ${siguiente.numero} · ${siguiente.fecha}${siguiente.hora ? ` ${siguiente.hora}` : ''}`;
  }

  resumenControlPlan(plan: { precioTotal: number; pagado: number; sesiones: { estado: string }[] }): string {
    const saldo = Math.max(plan.precioTotal - plan.pagado, 0);
    if (saldo > 0) {
      return `Saldo pendiente ${soles(saldo)} · ${plan.sesiones.filter(s => s.estado === 'Atendida').length} sesiones atendidas`;
    }
    return 'Pago completo registrado';
  }

  private coincideGrupo(c: Cita): boolean {
    switch (this.grupo()) {
      case 'Atendidos pagados': return c.estado === 'Atendida' && this.saldoCita(c) === 0;
      case 'Atendidos con saldo': return c.estado === 'Atendida' && this.saldoCita(c) > 0;
      case 'Pendientes por atender': return c.estado !== 'Atendida' && c.estado !== 'Cancelada' && c.estado !== 'No asistió';
      case 'Cancelados': return c.estado === 'Cancelada' || c.estado === 'No asistió';
      default: return true;
    }
  }

  private filtrarCitas(citas: Cita[]): Cita[] {
    const sede = this.sede();
    return citas.filter(c => {
      if (sede !== 'Todos' && this.local(c.localId) !== sede) { return false; }
      return this.enPeriodo(c.fecha);
    });
  }

  private filtrarPedidos(pedidos: Pedido[]): Pedido[] {
    return pedidos.filter(p => this.enPeriodo(p.fecha));
  }

  private enPeriodo(fecha: string): boolean {
    switch (this.periodo()) {
      case 'hoy': return fecha === HOY_ISO;
      case 'semana': return this.ultimos(7).includes(fecha);
      case 'mes': return fecha.slice(0, 7) === HOY_ISO.slice(0, 7);
      default: return true;
    }
  }

  private resumen(etiqueta: string, desde: string, hasta: string): ResumenPeriodo {
    const citas = this.agenda.citas().filter(c => c.fecha >= desde && c.fecha <= hasta);
    const pedidos = PEDIDOS.filter(p => p.fecha >= desde && p.fecha <= hasta);
    const pagosPlanes = this.planes.planes()
      .flatMap(plan => (plan.pagosDetalle ?? []).filter(pago =>
        pago.fecha >= desde &&
        pago.fecha <= hasta &&
        (!pago.codigoOperacion || !this.codigoOperacionExisteEnCitas(pago.codigoOperacion))
      ));
    return {
      etiqueta,
      desde,
      hasta,
      atenciones: citas.length,
      productos: pedidos.length,
      cobrado: citas.reduce((t, c) => t + c.montoPagado, 0) + pedidos.reduce((t, p) => t + p.pagado, 0) + pagosPlanes.reduce((t, pago) => t + pago.monto, 0),
      pendiente: citas.reduce((t, c) => t + this.saldoCita(c), 0) + pedidos.reduce((t, p) => t + Math.max(p.total - p.pagado, 0), 0)
    };
  }

  private codigoOperacionExisteEnCitas(codigo: string): boolean {
    return this.agenda.citas().some(cita =>
      (cita.pagosDetalle ?? []).some(pago => pago.codigoOperacion === codigo)
    );
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
