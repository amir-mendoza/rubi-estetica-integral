import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LOCALES, formatoFechaLarga, nombrePaciente, pacientePorId, soles } from '../data/datos';
import { ESTADOS_SESION, EstadoSesion, PlanSesiones, SesionPlan } from '../data/modelos';
import { PlanesService } from '../compartido/planes.service';

@Component({
  selector: 'app-sesiones',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Planes de sesiones</h1>
        <p>
          Seguimiento de las sesiones personalizadas de cada paciente. Busca por DNI para ver
          en qué sesión va, qué procedimiento le toca y cuándo debe volver.
        </p>
      </div>
      <div class="cabecera-admin__acciones">
        <button class="btn btn--vino btn--sm">Nuevo plan</button>
      </div>
    </div>

    <div class="kpis kpis-4">
      <div class="kpi">
        <span class="kpi__label">Planes en curso</span>
        <span class="kpi__valor">{{ enCurso() }}</span>
        <span class="kpi__nota">Con sesiones pendientes</span>
      </div>
      <div class="kpi">
        <span class="kpi__label">Sesiones atendidas</span>
        <span class="kpi__valor">{{ atendidas() }}</span>
        <span class="kpi__nota">Acumulado de todos los planes</span>
      </div>
      <div class="kpi">
        <span class="kpi__label">Sesiones por atender</span>
        <span class="kpi__valor">{{ porAtender() }}</span>
        <span class="kpi__nota">Programadas o pendientes</span>
      </div>
      <div class="kpi">
        <span class="kpi__label">Saldo por cobrar</span>
        <span class="kpi__valor" style="color:var(--alerta)">{{ soles(saldo()) }}</span>
        <span class="kpi__nota">Diferencia entre plan y pagos</span>
      </div>
    </div>

    <div class="barra-filtros">
      <div class="campo barra-filtros__crecer">
        <label>Buscar por DNI, código o plan</label>
        <input type="search" placeholder="Ej. 74859632" [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)">
      </div>
      <div class="campo">
        <label>Estado del plan</label>
        <select [ngModel]="estado()" (ngModelChange)="estado.set($event)">
          <option>Todos</option><option>En curso</option><option>Pausado</option><option>Finalizado</option>
        </select>
      </div>
      <div class="campo">
        <label>Sede</label>
        <select [ngModel]="local()" (ngModelChange)="local.set($event)">
          <option>Todas</option>
          @for (l of locales; track l.id) { <option>{{ l.nombre }}</option> }
        </select>
      </div>
    </div>

    @for (plan of lista(); track plan.id) {
      <section class="plan">
        <header class="plan__cabecera">
          <div>
            <span class="dato__label">{{ plan.codigo }}</span>
            <h3>{{ paciente(plan.pacienteId) }}</h3>
            <p class="plan__meta">
              DNI {{ plan.dni }} · {{ plan.nombre }} · {{ sede(plan.localId) }} ·
              Una sesión cada {{ plan.intervaloDias }} días
            </p>
          </div>
          <div class="plan__estado">
            <span [class]="claseEstadoPlan(plan.estado)">{{ plan.estado }}</span>
            <div class="plan__avance">
              <div class="barra-progreso">
                <span [style.width.%]="planes.avance(plan)"></span>
              </div>
              <small>{{ planes.atendidas(plan) }} de {{ plan.sesiones.length }} sesiones atendidas</small>
            </div>
          </div>
          <div class="plan__cobro">
            <div><span class="dato__label">Plan</span><strong>{{ soles(plan.precioTotal) }}</strong></div>
            <div><span class="dato__label">Pagado</span><strong>{{ soles(plan.pagado) }}</strong></div>
            <div>
              <span class="dato__label">Saldo</span>
              <strong [style.color]="plan.precioTotal - plan.pagado > 0 ? 'var(--alerta)' : 'var(--ok)'">
                {{ soles(plan.precioTotal - plan.pagado) }}
              </strong>
            </div>
          </div>
        </header>

        <ol class="sesiones">
          @for (s of plan.sesiones; track s.numero) {
            <li class="sesion" [class.sesion--actual]="planes.sesionActual(plan)?.numero === s.numero">
              <div class="sesion__numero">{{ s.numero }}</div>
              <div class="sesion__cuerpo">
                <div class="sesion__titulo">
                  <strong>Sesión {{ s.numero }} · {{ s.procedimiento }}</strong>
                  <span [class]="claseEstadoSesion(s.estado)">{{ s.estado }}</span>
                </div>
                <p class="sesion__fecha">
                  {{ s.fecha ? fechaLarga(s.fecha) : 'Sin fecha asignada · se programa al terminar la sesión anterior' }}
                </p>
                @if (s.observaciones) { <p class="sesion__obs">{{ s.observaciones }}</p> }
                <div class="sesion__acciones">
                  @for (e of estadosSesion; track e) {
                    <button class="accion" [class.accion--activa]="s.estado === e"
                            (click)="planes.cambiarEstadoSesion(plan.id, s.numero, e)">{{ e }}</button>
                  }
                </div>
              </div>
            </li>
          }
        </ol>

        <footer class="plan__pie">
          @if (plan.notas) { <p class="plan__notas">{{ plan.notas }}</p> }
          <div class="plan__acciones">
            <button class="btn btn--linea btn--sm" (click)="planes.programarSiguiente(plan.id)">
              Programar siguiente sesión
            </button>
            @if (plan.precioTotal - plan.pagado > 0) {
              <button class="btn btn--vino btn--sm" (click)="cobrar(plan)">
                Registrar pago en efectivo de una sesión
              </button>
            }
          </div>
        </footer>
      </section>
    } @empty {
      <div class="tabla-panel"><p class="vacio">No hay planes que coincidan con la búsqueda.</p></div>
    }
  `,
  styles: [`
    .kpis-4 { grid-template-columns: repeat(4, 1fr); margin-bottom: 22px; }
    .plan { background: #fff; border: 1px solid var(--linea); border-radius: var(--radio-lg); box-shadow: var(--sombra); margin-bottom: 20px; }
    .plan__cabecera {
      display: grid; grid-template-columns: 1.4fr .8fr .8fr; gap: 22px;
      padding: 22px 24px; border-bottom: 1px solid var(--linea);
    }
    .plan__cabecera h3 { margin: 4px 0 6px; }
    .plan__meta { font-size: .84rem; margin: 0; }
    .plan__estado { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }
    .plan__avance { width: 100%; }
    .plan__avance small { color: var(--gris); font-size: .76rem; }
    .plan__cobro { display: flex; flex-direction: column; gap: 6px; text-align: right; }
    .plan__cobro div { display: flex; justify-content: space-between; gap: 14px; }
    .sesiones { list-style: none; margin: 0; padding: 8px 0; }
    .sesion { display: flex; gap: 16px; padding: 16px 24px; border-bottom: 1px solid var(--linea); }
    .sesion:last-child { border-bottom: none; }
    .sesion--actual { background: var(--rosa-50); }
    .sesion__numero {
      flex: 0 0 34px; height: 34px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      background: var(--vino); color: #fff;
      font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.1rem;
    }
    .sesion__cuerpo { flex: 1; }
    .sesion__titulo { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 4px; }
    .sesion__fecha { font-size: .82rem; margin: 0 0 4px; }
    .sesion__obs { font-size: .8rem; color: var(--gris); margin: 0 0 8px; font-style: italic; }
    .sesion__acciones { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
    .accion {
      border: 1px solid var(--linea); border-radius: 999px; background: #fff;
      padding: 5px 12px; font-family: inherit; font-size: .72rem; color: var(--gris); cursor: pointer;
    }
    .accion:hover { border-color: var(--magenta-300); color: var(--magenta); }
    .accion--activa { background: var(--vino); border-color: var(--vino); color: #fff; }
    .plan__pie { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 18px 24px; border-top: 1px solid var(--linea); background: var(--rosa-50); }
    .plan__notas { margin: 0; font-size: .82rem; font-style: italic; }
    .plan__acciones { display: flex; gap: 10px; flex-wrap: wrap; }
    .vacio { text-align: center; color: var(--gris-claro); padding: 30px 0; margin: 0; }
    @media (max-width: 1200px) {
      .kpis-4 { grid-template-columns: repeat(2, 1fr); }
      .plan__cabecera { grid-template-columns: 1fr; }
      .plan__cobro { text-align: left; }
    }
  `]
})
export class SesionesComponent {
  soles = soles;
  fechaLarga = formatoFechaLarga;
  paciente = nombrePaciente;
  locales = LOCALES;
  estadosSesion = ESTADOS_SESION;

  busqueda = signal('');
  estado = signal('Todos');
  local = signal('Todas');

  lista = computed<PlanSesiones[]>(() => this.planes.buscar(this.busqueda()).filter(p =>
    (this.estado() === 'Todos' || p.estado === this.estado()) &&
    (this.local() === 'Todas' || this.sede(p.localId) === this.local())
  ));

  enCurso = computed(() => this.planes.planes().filter(p => p.estado === 'En curso').length);
  atendidas = computed(() => this.todasLasSesiones().filter(s => s.estado === 'Atendida').length);
  porAtender = computed(() => this.todasLasSesiones()
    .filter(s => s.estado === 'Pendiente' || s.estado === 'Programada' || s.estado === 'Reprogramada').length);
  saldo = computed(() => this.planes.planes().reduce((t, p) => t + (p.precioTotal - p.pagado), 0));

  constructor(public planes: PlanesService) {}

  sede(id: number): string {
    return LOCALES.find(l => l.id === id)?.nombre ?? '—';
  }

  dni(pacienteId: number): string {
    return pacientePorId(pacienteId)?.dni ?? '—';
  }

  cobrar(plan: PlanSesiones): void {
    const cuota = Math.round(plan.precioTotal / plan.sesiones.length);
    this.planes.registrarPago(plan.id, cuota);
  }

  claseEstadoPlan(estado: string): string {
    switch (estado) {
      case 'En curso': return 'chip chip--info chip--punto';
      case 'Finalizado': return 'chip chip--ok chip--punto';
      default: return 'chip chip--alerta chip--punto';
    }
  }

  claseEstadoSesion(estado: EstadoSesion): string {
    switch (estado) {
      case 'Atendida': return 'chip chip--ok';
      case 'En proceso': return 'chip chip--info';
      case 'Programada': return 'chip chip--alerta';
      case 'No asistió': return 'chip chip--error';
      default: return 'chip';
    }
  }

  private todasLasSesiones(): SesionPlan[] {
    return this.planes.planes().flatMap(p => p.sesiones);
  }
}
