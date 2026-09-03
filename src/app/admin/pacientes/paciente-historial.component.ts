import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { PRODUCTOS, localPorId, soles, tratamientoPorId } from '../../data/datos';
import { AgendaService } from '../../compartido/agenda.service';
import { PacientesService } from '../../compartido/pacientes.service';
import { PedidosService } from '../../compartido/pedidos.service';

@Component({
  selector: 'app-paciente-historial',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Historial del paciente</h1>
        <p>Citas, tratamientos realizados y productos comprados.</p>
      </div>
      <div class="cabecera-admin__acciones">
        <a routerLink="/admin/pacientes" class="btn btn--linea btn--sm">Volver a pacientes</a>
      </div>
    </div>

    @if (paciente(); as p) {
      <section class="panel ficha">
        <div><span class="dato__label">Paciente</span><strong>{{ p.nombre }} {{ p.apellido }}</strong></div>
        <div><span class="dato__label">DNI</span><strong>{{ p.dni }}</strong></div>
        <div><span class="dato__label">Celular</span><strong>{{ p.celular }}</strong></div>
        <div><span class="dato__label">Consumo registrado</span><strong>{{ soles(total()) }}</strong></div>
      </section>

      <div class="grid-dos">
        <section class="tabla-panel">
          <div class="tabla-panel__cabecera"><h3>Citas y tratamientos</h3><span class="dato__label">{{ citas().length }} registros</span></div>
          <div class="tabla-envoltura">
            <table class="tabla">
              <thead><tr><th>Fecha</th><th>Tratamientos</th><th>Tipo</th><th>Local</th><th>Zona / notas</th><th>Estado</th><th class="num">Pagado</th></tr></thead>
              <tbody>
                @for (c of citas(); track c.id) {
                  <tr>
                    <td>{{ c.fecha }}<br><small>{{ c.horaInicio }}</small></td>
                    <td>{{ tratamientosCita(c) }}</td>
                    <td><span [class]="c.planId ? 'chip chip--info' : 'chip'">{{ c.planId ? 'Multisesión' : 'Simple' }}</span></td>
                    <td>{{ local(c.localId) }}</td>
                    <td>{{ c.zonaTratamiento || c.notas || '—' }}</td>
                    <td>{{ c.estado }}<br><small>{{ c.estadoPago }}</small></td>
                    <td class="num">{{ soles(c.montoPagado) }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="7" class="vacio">Sin citas registradas.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <section class="tabla-panel">
          <div class="tabla-panel__cabecera"><h3>Productos comprados</h3><span class="dato__label">{{ pedidos().length }} pedidos</span></div>
          <div class="tabla-envoltura">
            <table class="tabla">
              <thead><tr><th>Fecha</th><th>Pedido</th><th>Productos</th><th>Pago</th><th class="num">Pagado</th></tr></thead>
              <tbody>
                @for (pedido of pedidos(); track pedido.id) {
                  <tr>
                    <td>{{ pedido.fecha }}</td>
                    <td>{{ pedido.codigo }}</td>
                    <td>{{ productos(pedido.items) }}</td>
                    <td>{{ pedido.estadoPago }}<br><small>{{ pedido.metodoPago || '—' }}</small></td>
                    <td class="num">{{ soles(pedido.pagado) }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="vacio">Sin compras de productos.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      </div>
    } @else {
      <div class="panel texto-centro"><h3>Paciente no encontrado</h3></div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.Default,
  styles: [`
    .ficha { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; margin-bottom: 22px; }
    .ficha div { display: grid; gap: 4px; }
    .ficha strong { color: var(--tinta); font-size: 1rem; }
    .grid-dos { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: start; }
    .vacio { text-align: center; color: var(--gris-claro); padding: 24px 0; }
    @media (max-width: 1200px) { .ficha, .grid-dos { grid-template-columns: 1fr; } }
  `]
})
export class PacienteHistorialComponent {
  private ruta = inject(ActivatedRoute);
  private agenda = inject(AgendaService);
  private pacientesService = inject(PacientesService);
  private pedidosService = inject(PedidosService);
  soles = soles;
  id = Number(this.ruta.snapshot.paramMap.get('id'));
  paciente = computed(() => this.pacientesService.porId(this.id));
  citas = computed(() => this.agenda.citas().filter(c => c.pacienteId === this.id).sort((a, b) => b.fecha.localeCompare(a.fecha)));
  pedidos = computed(() => {
    const p = this.paciente();
    if (!p) { return []; }
    const nombre = `${p.nombre} ${p.apellido}`.toLowerCase();
    return this.pedidosService.pedidos().filter(o => (o.dni && o.dni === p.dni) || o.cliente.toLowerCase() === nombre || o.celular === p.celular)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  });
  total = computed(() => this.citas().reduce((t, c) => t + c.montoPagado, 0) + this.pedidos().reduce((t, p) => t + p.pagado, 0));

  tratamientosCita(cita: { tratamientoId: number; tratamientosIncluidos?: number[] }): string {
    const ids = cita.tratamientosIncluidos?.length ? cita.tratamientosIncluidos : [cita.tratamientoId];
    return ids.map(id => tratamientoPorId(id)?.nombre ?? 'Tratamiento').join(' + ');
  }
  local(id: number): string { return localPorId(id)?.nombre ?? '—'; }
  productos(items: { productoId: number; cantidad: number }[]): string {
    return items.map(i => `${i.cantidad} x ${PRODUCTOS.find(p => p.id === i.productoId)?.nombre ?? 'Producto'}`).join(', ');
  }
}
