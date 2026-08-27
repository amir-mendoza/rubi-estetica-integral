import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { soles, tratamientoPorId } from '../../data/datos';
import { Paciente } from '../../data/modelos';
import { PacientesService } from '../../compartido/pacientes.service';
import { AgendaService } from '../../compartido/agenda.service';

@Component({
  selector: 'app-pacientes',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Pacientes</h1>
        <p>Historial de pacientes registradas, con sus citas y su consumo acumulado.</p>
      </div>
      <div class="cabecera-admin__acciones">
        <button class="btn btn--vino btn--sm" (click)="alternarFormulario()">
          {{ mostrarFormulario() ? 'Cerrar formulario' : 'Crear cuenta de paciente' }}
        </button>
        <button class="btn btn--linea btn--sm">Exportar listado</button>
      </div>
    </div>

    @if (mostrarFormulario()) {
      <section class="tabla-panel paciente-form-panel">
        <div class="tabla-panel__cabecera">
          <div>
            <h3>Nueva cuenta de paciente</h3>
            <span class="dato__label">Recepción puede afiliar a la paciente para conservar su historial y futuros beneficios.</span>
          </div>
        </div>
        <form class="paciente-form" (ngSubmit)="guardarPaciente()">
          <div class="aviso-cuenta">
            Pide DNI, nombre completo, celular y correo si lo recuerda. El correo es opcional; más adelante los beneficios también podrán enviarse por SMS al celular registrado.
          </div>
          <div class="paciente-form__grid">
            <div class="campo">
              <label>DNI (8 dígitos)</label>
              <input required maxlength="8" [ngModel]="nuevoDni()" (ngModelChange)="buscarDniFormulario($event)" name="nuevoDni" placeholder="Ej. 74859632">
            </div>
            <div class="campo paciente-form__ancho">
              <label>Nombre completo</label>
              <input required [ngModel]="nuevoNombreCompleto()" (ngModelChange)="nuevoNombreCompleto.set($event)" name="nuevoNombreCompleto" placeholder="Nombre y apellido de la paciente">
            </div>
            <div class="campo">
              <label>Celular</label>
              <input required [ngModel]="nuevoCelular()" (ngModelChange)="nuevoCelular.set($event)" name="nuevoCelular" placeholder="987 654 321">
            </div>
            <div class="campo paciente-form__ancho">
              <label>Correo (opcional)</label>
              <input type="email" [ngModel]="nuevoCorreo()" (ngModelChange)="nuevoCorreo.set($event)" name="nuevoCorreo" placeholder="correo@ejemplo.com">
            </div>
          </div>
          @if (pacienteEncontrada()) {
            <div class="estado-cuenta estado-cuenta--ok">
              <strong>Paciente ya registrada</strong>
              <span>Se cargaron sus datos. Puedes corregirlos y guardar para actualizar su cuenta.</span>
            </div>
          } @else if (nuevoDni().length === 8) {
            <div class="estado-cuenta estado-cuenta--alerta">
              <strong>Nueva cuenta web</strong>
              <span>No existe una paciente con este DNI. Al guardar, quedará afiliada para historial, campañas y futuros descuentos.</span>
            </div>
          }
          @if (mensajeFormulario()) {
            <div class="estado-cuenta estado-cuenta--ok">
              <strong>Listo</strong>
              <span>{{ mensajeFormulario() }}</span>
            </div>
          }
          <div class="paciente-form__acciones">
            <button class="btn btn--vino btn--sm" type="submit" [disabled]="!formularioValido()">Guardar cuenta</button>
            <button class="btn btn--linea btn--sm" type="button" (click)="limpiarFormulario()">Limpiar</button>
          </div>
        </form>
      </section>
    }

    <div class="kpis kpis-4">
      <div class="kpi"><span class="kpi__label">Pacientes registradas</span><span class="kpi__valor">{{ pacientes().length }}</span><span class="kpi__nota">Base histórica</span></div>
      <div class="kpi"><span class="kpi__label">Con cita futura</span><span class="kpi__valor">{{ conCitaFutura() }}</span><span class="kpi__nota">Agendadas desde hoy</span></div>
      <div class="kpi"><span class="kpi__label">Consumo acumulado</span><span class="kpi__valor">{{ soles(consumoTotal()) }}</span><span class="kpi__nota">Histórico de todas las pacientes</span></div>
      <div class="kpi"><span class="kpi__label">Ticket promedio</span><span class="kpi__valor">{{ soles(ticketPromedio()) }}</span><span class="kpi__nota">Por cita atendida</span></div>
    </div>

    <div class="barra-filtros">
      <div class="campo barra-filtros__crecer">
        <label>Buscar</label>
        <input type="search" placeholder="Nombre, DNI o celular" [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)">
      </div>
      <div class="campo">
        <label>Ordenar por</label>
        <select [ngModel]="orden()" (ngModelChange)="orden.set($event)">
          <option value="reciente">Última visita</option>
          <option value="gasto">Mayor consumo</option>
          <option value="citas">Más citas</option>
          <option value="nombre">Nombre</option>
        </select>
      </div>
    </div>

    <div class="tabla-panel">
      <div class="tabla-panel__cabecera">
        <h3>Listado de pacientes</h3>
        <span class="dato__label">{{ lista().length }} resultados</span>
      </div>
      <div class="tabla-envoltura">
        <table class="tabla">
          <thead>
            <tr>
              <th>Paciente</th><th>DNI</th><th>Celular</th><th>Registro</th>
              <th class="num">Citas</th><th>Última visita</th><th class="num">Consumo</th><th></th>
            </tr>
          </thead>
          <tbody>
            @for (p of lista(); track p.id) {
              <tr>
                <td>
                  <div class="mini-dato">
                    <strong>{{ p.nombre }} {{ p.apellido }}</strong>
                    <span>{{ p.correo }}</span>
                  </div>
                </td>
                <td>{{ p.dni }}</td>
                <td>{{ p.celular }}</td>
                <td>{{ p.fechaRegistro }}</td>
                <td class="num">{{ p.citasTotales }}</td>
                <td>{{ p.ultimaVisita }}</td>
                <td class="num">{{ soles(p.totalGastado) }}</td>
                <td class="num">
                  <button class="boton-icono" (click)="abierta.set(abierta() === p.id ? null : p.id)">
                    {{ abierta() === p.id ? 'Cerrar' : 'Historial' }}
                  </button>
                  <a class="boton-icono" [routerLink]="['/admin/pacientes', p.id, 'historial']">Ver completo</a>
                </td>
              </tr>
              @if (abierta() === p.id) {
                <tr class="fila-detalle">
                  <td colspan="8">
                    <div class="detalle-paciente">
                      <div>
                        <span class="dato__label">Observaciones clínicas</span>
                        <p>{{ p.observaciones || 'Sin observaciones registradas.' }}</p>
                      </div>
                      <div>
                        <span class="dato__label">Últimas citas</span>
                        @for (c of citasDe(p.id); track c.id) {
                          <div class="historial">
                            <span>{{ c.fecha }} · {{ c.horaInicio }}</span>
                            <span>{{ tratamientosCita(c) }}<br><small>{{ tipoCita(c) }}</small></span>
                            <span>{{ c.estado }}</span>
                            <strong>{{ soles(c.montoTotal) }}</strong>
                          </div>
                        }
                        @if (!citasDe(p.id).length) { <p>Sin citas registradas.</p> }
                      </div>
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
    .fila-detalle td { background: var(--rosa-50); }
    .detalle-paciente { display: grid; grid-template-columns: 1fr 1.4fr; gap: 32px; padding: 8px 0 14px; }
    .detalle-paciente p { font-size: .94rem; margin: 6px 0 0; }
    .historial { display: grid; grid-template-columns: 1.1fr 1.4fr .8fr .6fr; gap: 12px; padding: 7px 0; border-bottom: 1px dashed var(--linea); font-size: .9rem; color: var(--gris); }
    .historial strong { text-align: right; color: var(--tinta); font-weight: 500; }
    .paciente-form-panel { margin-bottom: 22px; }
    .paciente-form { padding: 20px 22px 24px; }
    .paciente-form, .paciente-form * { box-sizing: border-box; }
    .paciente-form input, .paciente-form button { max-width: 100%; min-width: 0; }
    .paciente-form__grid {
      display: grid;
      grid-template-columns: minmax(150px, .7fr) minmax(220px, 1.3fr) minmax(170px, .8fr) minmax(220px, 1.2fr);
      gap: 14px;
    }
    .paciente-form__acciones { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
    .aviso-cuenta {
      margin-bottom: 16px;
      padding: 14px 16px;
      border-left: 4px solid var(--magenta);
      background: var(--rosa-50);
      color: var(--vino);
      font-size: .94rem;
      line-height: 1.5;
    }
    .estado-cuenta {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 14px 0 0;
      padding: 12px 14px;
      border-radius: var(--radio);
      font-size: .9rem;
      line-height: 1.45;
    }
    .estado-cuenta strong { color: var(--vino); white-space: nowrap; }
    .estado-cuenta span { color: var(--gris); }
    .estado-cuenta--ok { border: 1px solid rgba(44, 139, 93, .24); background: rgba(44, 139, 93, .08); }
    .estado-cuenta--alerta { border: 1px solid rgba(184, 124, 35, .28); background: #fffaf2; }
    @media (max-width: 1200px) {
      .kpis-4 { grid-template-columns: repeat(2, 1fr); }
      .detalle-paciente { grid-template-columns: 1fr; }
      .paciente-form__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .paciente-form__ancho { grid-column: span 1; }
    }
    @media (max-width: 720px) {
      .paciente-form { padding: 16px 14px 18px; }
      .paciente-form__grid { grid-template-columns: 1fr; }
      .paciente-form__acciones { flex-direction: column; }
      .paciente-form__acciones .btn { width: 100%; }
      .estado-cuenta { align-items: flex-start; flex-direction: column; gap: 5px; }
      .estado-cuenta strong { white-space: normal; }
    }
  `]
})
export class PacientesComponent {
  private pacientesService = inject(PacientesService);
  private agenda = inject(AgendaService);
  soles = soles;
  pacientes = this.pacientesService.pacientes;
  busqueda = signal('');
  orden = signal('reciente');
  abierta = signal<number | null>(null);
  mostrarFormulario = signal(false);
  nuevoDni = signal('');
  nuevoNombreCompleto = signal('');
  nuevoCelular = signal('');
  nuevoCorreo = signal('');
  pacienteEncontrada = signal<Paciente | null>(null);
  mensajeFormulario = signal('');

  consumoTotal = computed(() => this.pacientes().reduce((t, p) => t + p.totalGastado, 0));
  conCitaFutura = computed(() => new Set(this.agenda.citas().filter(c => c.fecha >= new Date().toISOString().slice(0, 10)).map(c => c.pacienteId)).size);
  ticketPromedio = computed(() => {
    const citas = this.pacientes().reduce((t, p) => t + p.citasTotales, 0);
    return citas ? Math.round(this.consumoTotal() / citas) : 0;
  });

  lista = computed<Paciente[]>(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const filtradas = this.pacientes().filter(p =>
      !texto || `${p.nombre} ${p.apellido} ${p.dni} ${p.celular}`.toLowerCase().includes(texto)
    );
    const orden = this.orden();
    return [...filtradas].sort((a, b) => {
      if (orden === 'gasto') { return b.totalGastado - a.totalGastado; }
      if (orden === 'citas') { return b.citasTotales - a.citasTotales; }
      if (orden === 'nombre') { return a.nombre.localeCompare(b.nombre); }
      return b.ultimaVisita.localeCompare(a.ultimaVisita);
    });
  });

  citasDe(id: number) {
    return this.agenda.citas().filter(c => c.pacienteId === id).sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 5);
  }

  tratamientosCita(cita: { tratamientoId: number; tratamientosIncluidos?: number[] }): string {
    const ids = cita.tratamientosIncluidos?.length ? cita.tratamientosIncluidos : [cita.tratamientoId];
    return ids.map(id => tratamientoPorId(id)?.nombre ?? '—').join(' + ');
  }

  tipoCita(cita: { planId?: number }): string {
    return cita.planId ? 'Seguimiento multisesión' : 'Cita simple';
  }

  alternarFormulario(): void {
    this.mostrarFormulario.update(v => !v);
    this.mensajeFormulario.set('');
  }

  buscarDniFormulario(dni: string): void {
    const limpio = dni.replace(/\D/g, '').slice(0, 8);
    this.nuevoDni.set(limpio);
    this.pacienteEncontrada.set(null);
    this.mensajeFormulario.set('');
    if (limpio.length !== 8) { return; }

    const paciente = this.pacientesService.porDni(limpio) ?? null;
    this.pacienteEncontrada.set(paciente);
    if (paciente) {
      this.nuevoNombreCompleto.set(`${paciente.nombre} ${paciente.apellido}`.trim());
      this.nuevoCelular.set(paciente.celular);
      this.nuevoCorreo.set(paciente.correo || '');
    }
  }

  formularioValido(): boolean {
    return this.nuevoDni().length === 8 &&
      this.nuevoNombreCompleto().trim().length >= 3 &&
      this.nuevoCelular().trim().length >= 6;
  }

  guardarPaciente(): void {
    if (!this.formularioValido()) { return; }
    const paciente = this.pacientesService.registrarOActualizar({
      dni: this.nuevoDni(),
      nombreCompleto: this.nuevoNombreCompleto(),
      celular: this.nuevoCelular(),
      correo: this.nuevoCorreo()
    });
    this.pacienteEncontrada.set(paciente);
    this.busqueda.set(paciente.dni);
    this.mensajeFormulario.set(`Cuenta de ${paciente.nombre} ${paciente.apellido} guardada correctamente.`);
  }

  limpiarFormulario(): void {
    this.nuevoDni.set('');
    this.nuevoNombreCompleto.set('');
    this.nuevoCelular.set('');
    this.nuevoCorreo.set('');
    this.pacienteEncontrada.set(null);
    this.mensajeFormulario.set('');
  }
}
