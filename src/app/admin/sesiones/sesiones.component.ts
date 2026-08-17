import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LOCALES, formatoFechaLarga, nombrePaciente, pacientePorId, soles, PACIENTES, TRATAMIENTOS, PROMOCIONES, aISO } from '../../data/datos';
import { ESTADOS_SESION, EstadoSesion, PlanSesiones, SesionPlan, Paciente } from '../../data/modelos';
import { PlanesService } from '../../compartido/planes.service';

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
        <button class="btn btn--vino btn--sm" (click)="mostrarFormulario.set(!mostrarFormulario())">
          {{ mostrarFormulario() ? 'Cerrar Formulario' : 'Nuevo plan' }}
        </button>
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

    <!-- ============================================== Formulario Nuevo Plan -->
    @if (mostrarFormulario()) {
      <div class="tabla-panel" style="margin-bottom: 22px;">
        <div class="tabla-panel__cabecera">
          <h3>Registrar nuevo plan de sesiones</h3>
        </div>
        <form class="promo-form" (ngSubmit)="guardarNuevoPlan()">
          <div class="promo-form__fila">
            <div class="campo">
              <label>DNI del Paciente (8 dígitos)</label>
              <input type="text" maxlength="8" [ngModel]="formDni()" (ngModelChange)="buscarDni($event)" name="formDni" required placeholder="Ej. 74859632">
            </div>
            <div class="campo">
              <label>Nombre</label>
              <input type="text" [ngModel]="formNombre()" (ngModelChange)="formNombre.set($event)" name="formNombre" required placeholder="María">
            </div>
            <div class="campo">
              <label>Apellido</label>
              <input type="text" [ngModel]="formApellido()" (ngModelChange)="formApellido.set($event)" name="formApellido" required placeholder="López Rivera">
            </div>
          </div>
          
          <div class="promo-form__fila">
            <div class="campo">
              <label>Celular</label>
              <input type="tel" [ngModel]="formCelular()" (ngModelChange)="formCelular.set($event)" name="formCelular" required placeholder="987 654 321">
            </div>
            <div class="campo">
              <label>Correo electrónico (opcional)</label>
              <input type="email" [ngModel]="formCorreo()" (ngModelChange)="formCorreo.set($event)" name="formCorreo" placeholder="correo@ejemplo.com">
            </div>
            <div class="campo">
              <label>Sede del plan (opcional)</label>
              <select [ngModel]="formLocalId()" (ngModelChange)="formLocalId.set(Number($event))" name="formLocalId">
                <option [value]="0">Por definir / se decide al reservar</option>
                @for (l of locales; track l.id) {
                  <option [value]="l.id">{{ l.nombre }}</option>
                }
              </select>
            </div>
          </div>

          <hr style="margin: 15px 0; border: none; border-top: 1px solid var(--linea);">

          <div class="promo-form__fila">
            <div class="campo">
              <label>Cargar base (Preconfiguración)</label>
              <select [ngModel]="formBaseCarga()" (ngModelChange)="cargarBase($event)" name="formBaseCarga">
                <option value="Personalizado">Personalizado (vacío)</option>
                <optgroup label="Promociones">
                  @for (p of promocionesLista; track p.id) {
                    <option [value]="'promo-' + p.id">{{ p.titulo }} ({{ p.sesiones }} ses.)</option>
                  }
                </optgroup>
                <optgroup label="Tratamientos">
                  @for (t of tratamientosLista; track t.id) {
                    <option [value]="'trat-' + t.id">{{ t.nombre }}</option>
                  }
                </optgroup>
              </select>
            </div>
            <div class="campo">
              <label>Nombre del Plan</label>
              <input type="text" [ngModel]="formNombrePlan()" (ngModelChange)="formNombrePlan.set($event)" name="formNombrePlan" required placeholder="Ej. Plan facial luminosidad">
            </div>
            <div class="campo">
              <label>Intervalo de sesiones (días)</label>
              <input type="number" min="1" [ngModel]="formIntervaloDias()" (ngModelChange)="formIntervaloDias.set($event)" name="formIntervaloDias" required>
            </div>
          </div>

          <div class="promo-form__fila">
            <div class="campo">
              <label>Precio Total (S/)</label>
              <input type="number" min="0" [ngModel]="formPrecioTotal()" (ngModelChange)="formPrecioTotal.set($event)" name="formPrecioTotal" required>
            </div>
            <div class="campo">
              <label>Monto Pagado Inicial (S/)</label>
              <input type="number" min="0" [ngModel]="formPagado()" (ngModelChange)="formPagado.set($event)" name="formPagado" required>
            </div>
            <div class="campo">
              <label>Notas / Observaciones del plan (opcional)</label>
              <input type="text" [ngModel]="formNotas()" (ngModelChange)="formNotas.set($event)" name="formNotas" placeholder="Ej. Piel sensible">
            </div>
          </div>

          <hr style="margin: 15px 0; border: none; border-top: 1px solid var(--linea);">

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h4 style="margin: 0;">Sesiones del Plan ({{ formSesiones().length }})</h4>
            <button type="button" class="btn btn--linea btn--sm" (click)="agregarSesionForm()">+ Agregar sesión</button>
          </div>

          <div class="sesiones-form-lista" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 15px;">
            @for (s of formSesiones(); track $index; let idx = $index) {
              <div class="sesion-form-item" style="display: grid; grid-template-columns: 80px 1.5fr 2fr 100px; gap: 14px; align-items: center;">
                <strong>Sesión {{ idx + 1 }}</strong>
                <select [ngModel]="s.tratamientoId" (ngModelChange)="actualizarSesionTratamiento(idx, Number($event))" name="tratamientoId_{{idx}}">
                  @for (t of tratamientosLista; track t.id) {
                    <option [value]="t.id">{{ t.nombre }}</option>
                  }
                </select>
                <input type="text" [ngModel]="s.procedimiento" (ngModelChange)="actualizarSesionProcedimiento(idx, $event)" name="procedimiento_{{idx}}" placeholder="Nombre del procedimiento" required>
                <button type="button" class="btn btn--linea btn--sm" style="color: var(--error); border-color: var(--error);" (click)="eliminarSesionForm(idx)">Eliminar</button>
              </div>
            }
            @if (formSesiones().length === 0) {
              <div class="vacio" style="padding: 10px; border: 1px dashed var(--linea); text-align: center; border-radius: var(--radio);">
                No hay sesiones en el plan. Añade al menos una.
              </div>
            }
          </div>

          <div class="promo-form__acciones" style="margin-top: 25px;">
            <button type="submit" class="btn btn--vino btn--sm" [disabled]="!formNombrePlan() || !formDni() || !formNombre() || !formApellido() || formSesiones().length === 0">
              Registrar Plan
            </button>
            <button type="button" class="btn btn--linea btn--sm" (click)="mostrarFormulario.set(false)">Cancelar</button>
          </div>
        </form>
      </div>
    }

    <!-- ============================================== Buscador y Filtros -->
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

    <!-- ============================================== Listado de Planes -->
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
              Programar siguiente sesión según intervalo
            </button>
            @if (plan.precioTotal - plan.pagado > 0) {
              <button class="btn btn--vino btn--sm" (click)="cobrar(plan)">
                Cobrar cuota sugerida en recepción
              </button>
              <button class="btn btn--linea btn--sm" (click)="cobrarSaldo(plan)">
                Marcar saldo completo pagado
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
    
    /* Estilos del formulario de registro */
    .promo-form { padding: 20px 22px 24px; }
    .promo-form__fila { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; }
    .promo-form__acciones { display: flex; align-items: center; gap: 14px; }
    .sesion-form-item select, .sesion-form-item input { padding: 6px 10px; font-size: 0.85rem; }

    @media (max-width: 1200px) {
      .kpis-4 { grid-template-columns: repeat(2, 1fr); }
      .plan__cabecera { grid-template-columns: 1fr; }
      .plan__cobro { text-align: left; }
    }
  `]
})
export class SesionesComponent {
  Number = Number;
  soles = soles;
  fechaLarga = formatoFechaLarga;
  paciente = nombrePaciente;
  locales = LOCALES;
  estadosSesion = ESTADOS_SESION;

  // Catálogos base para el formulario
  promocionesLista = PROMOCIONES;
  tratamientosLista = TRATAMIENTOS;

  busqueda = signal('');
  estado = signal('Todos');
  local = signal('Todas');

  // Control del formulario
  mostrarFormulario = signal(false);
  formDni = signal('');
  formNombre = signal('');
  formApellido = signal('');
  formCelular = signal('');
  formCorreo = signal('');
  formLocalId = signal(0);
  formBaseCarga = signal('Personalizado');
  formNombrePlan = signal('');
  formIntervaloDias = signal(15);
  formPrecioTotal = signal<number>(0);
  formPagado = signal<number>(0);
  formNotas = signal('');
  formSesiones = signal<{ tratamientoId: number; procedimiento: string }[]>([]);

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
    return id ? (LOCALES.find(l => l.id === id)?.nombre ?? '—') : 'Por definir';
  }

  dni(pacienteId: number): string {
    return pacientePorId(pacienteId)?.dni ?? '—';
  }

  cobrar(plan: PlanSesiones): void {
    const saldo = plan.precioTotal - plan.pagado;
    const cuota = Math.min(saldo, Math.round(plan.precioTotal / plan.sesiones.length));
    this.planes.registrarPago(plan.id, cuota);
  }

  cobrarSaldo(plan: PlanSesiones): void {
    this.planes.registrarPago(plan.id, plan.precioTotal - plan.pagado);
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

  // --- Lógica del formulario de Nuevo Plan
  buscarDni(dni: string): void {
    this.formDni.set(dni);
    if (dni.length === 8) {
      const p = PACIENTES.find(pac => pac.dni === dni);
      if (p) {
        this.formNombre.set(p.nombre);
        this.formApellido.set(p.apellido);
        this.formCelular.set(p.celular);
        this.formCorreo.set(p.correo || '');
      }
    }
  }

  cargarBase(val: string): void {
    this.formBaseCarga.set(val);
    if (val === 'Personalizado') {
      this.formNombrePlan.set('');
      this.formPrecioTotal.set(0);
      this.formSesiones.set([]);
      return;
    }

    if (val.startsWith('promo-')) {
      const id = Number(val.replace('promo-', ''));
      const promo = PROMOCIONES.find(p => p.id === id);
      if (promo) {
        this.formNombrePlan.set(promo.titulo);
        this.formPrecioTotal.set(promo.precio || 0);

        const numSesiones = promo.sesiones || 1;
        if (promo.sesionesDetalle?.length) {
          this.formSesiones.set(promo.sesionesDetalle.map(s => ({
            tratamientoId: s.tratamientoId ?? 1,
            procedimiento: s.titulo.replace(/^Sesion \d+ ·\s*/, '')
          })));
        } else {
          const arr = [];
          for (let i = 1; i <= numSesiones; i++) {
            arr.push({ tratamientoId: 1, procedimiento: `Sesión ${i} - ${promo.titulo}` });
          }
          this.formSesiones.set(arr);
        }
      }
    } else if (val.startsWith('trat-')) {
      const id = Number(val.replace('trat-', ''));
      const trat = TRATAMIENTOS.find(t => t.id === id);
      if (trat) {
        this.formNombrePlan.set(trat.nombre);
        this.formPrecioTotal.set(trat.precio);
        this.formSesiones.set([{ tratamientoId: trat.id, procedimiento: trat.nombre }]);
      }
    }
  }

  agregarSesionForm(): void {
    this.formSesiones.update(list => [...list, { tratamientoId: 1, procedimiento: 'Limpieza facial profunda' }]);
  }

  eliminarSesionForm(index: number): void {
    this.formSesiones.update(list => list.filter((_, i) => i !== index));
  }

  actualizarSesionTratamiento(index: number, tratamientoId: number): void {
    const trat = TRATAMIENTOS.find(t => t.id === tratamientoId);
    this.formSesiones.update(list => list.map((s, i) => i === index ? { ...s, tratamientoId, procedimiento: trat?.nombre || s.procedimiento } : s));
  }

  actualizarSesionProcedimiento(index: number, procedimiento: string): void {
    this.formSesiones.update(list => list.map((s, i) => i === index ? { ...s, procedimiento } : s));
  }

  guardarNuevoPlan(): void {
    if (!this.formDni() || !this.formNombre() || !this.formApellido() || !this.formNombrePlan() || this.formSesiones().length === 0) {
      return;
    }

    // 1. Validar o registrar paciente en la lista de datos en memoria
    let pac = PACIENTES.find(p => p.dni === this.formDni());
    let pacienteId = pac ? pac.id : 0;
    if (!pac) {
      pacienteId = Math.max(...PACIENTES.map(p => p.id), 0) + 1;
      const nuevoPac: Paciente = {
        id: pacienteId,
        nombre: this.formNombre(),
        apellido: this.formApellido(),
        dni: this.formDni(),
        celular: this.formCelular(),
        correo: this.formCorreo(),
        fechaRegistro: aISO(new Date()),
        observaciones: this.formNotas(),
        citasTotales: 0,
        ultimaVisita: aISO(new Date()),
        totalGastado: 0
      };
      PACIENTES.push(nuevoPac);
    }

    // 2. Mapear sesiones con sus estados iniciales
    const sesiones: SesionPlan[] = this.formSesiones().map((s, idx) => ({
      numero: idx + 1,
      tratamientoId: s.tratamientoId,
      procedimiento: s.procedimiento,
      estado: idx === 0 ? 'En proceso' : 'Pendiente',
      fecha: idx === 0 ? aISO(new Date()) : undefined
    }));

    // 3. Crear la estructura del plan
    const planData: Omit<PlanSesiones, 'id' | 'codigo'> = {
      pacienteId,
      dni: this.formDni(),
      nombre: this.formNombrePlan(),
      localId: this.formLocalId(),
      intervaloDias: this.formIntervaloDias(),
      inicio: aISO(new Date()),
      precioTotal: this.formPrecioTotal(),
      pagado: this.formPagado(),
      estado: 'En curso',
      sesiones,
      notas: this.formNotas() || undefined
    };

    // 4. Registrar en el servicio
    this.planes.crearPlan(planData);

    // 5. Limpiar y cerrar formulario
    this.mostrarFormulario.set(false);
    this.formDni.set('');
    this.formNombre.set('');
    this.formApellido.set('');
    this.formCelular.set('');
    this.formCorreo.set('');
    this.formNombrePlan.set('');
    this.formPrecioTotal.set(0);
    this.formPagado.set(0);
    this.formNotas.set('');
    this.formSesiones.set([]);
    this.formBaseCarga.set('Personalizado');
  }

  private todasLasSesiones(): SesionPlan[] {
    return this.planes.planes().flatMap(p => p.sesiones);
  }
}
