import { Component, OnDestroy, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LOCALES, formatoFechaLarga, formatoHora12, soles, TRATAMIENTOS, aISO } from '../../data/datos';
import { ESTADOS_SESION, EstadoSesion, PlanSesiones, SesionPlan, MetodoPago, Paciente } from '../../data/modelos';
import { PlanesService } from '../../compartido/planes.service';
import { PacientesService } from '../../compartido/pacientes.service';
import { Bloque, DisponibilidadService } from '../../compartido/disponibilidad.service';
import { VoucherService } from '../../compartido/voucher.service';
import { PromocionesService } from '../../compartido/promociones.service';

interface FormSesionPlan {
  fecha: string;
  hora: string;
  zona: string;
  observaciones: string;
}

interface FormTratamientoPlan {
  tratamientoId: number;
  multisesion: boolean;
  incluidoEnBase?: boolean;
  origen?: string;
  sesiones: FormSesionPlan[];
}

interface OpcionPlanSelector {
  tipo: 'Tratamiento' | 'Promoción';
  id: number;
  titulo: string;
  detalle: string;
  precio: number;
  precioAntes?: number;
}

@Component({
  selector: 'app-sesiones',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Planes de sesiones</h1>
        <p>
          Aquí recepción controla los tratamientos con seguimiento. La primera sesión puede
          salir desde la web o desde caja, y las siguientes se coordinan manualmente después
          de cada atención para que todo quede claro y ordenado.
        </p>
      </div>
      <div class="cabecera-admin__acciones">
        <button class="btn btn--vino btn--sm" (click)="alternarFormularioPlan()">
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
          <div class="aviso-cuenta">
            Pregunta si la paciente ya tiene cuenta web. Si no aparece con su DNI, puedes decirle:
            "Señora/señor, en nuestro sistema no aparece una cuenta web con su DNI. Si desea, podemos ayudarle a crearla para guardar su historial completo de tratamientos, recibir avisos de campañas, eventos y futuros descuentos por correo."
          </div>
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
          @if (pacientePlanEncontrado()) {
            <div class="estado-cuenta estado-cuenta--ok">
              <strong>Paciente encontrada</strong>
              <span>Se autocompletaron sus datos. Este plan quedará asociado a su historial del sistema.</span>
            </div>
          } @else if (formDni().length === 8) {
            <div class="estado-cuenta estado-cuenta--alerta">
              <strong>Paciente sin cuenta registrada</strong>
              <span>Regístrala como atención temporal y ofrécele afiliarse con cuenta web para conservar su historial completo y recibir futuros beneficios.</span>
            </div>
          }
          
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
              <label>Sede del plan</label>
              <select [ngModel]="formLocalId()" (ngModelChange)="cambiarSedePlan(Number($event))" name="formLocalId">
                @for (l of locales; track l.id) {
                  <option [value]="l.id">{{ l.nombre }}</option>
                }
              </select>
            </div>
          </div>

          <hr style="margin: 15px 0; border: none; border-top: 1px solid var(--linea);">

          <div class="promo-form__fila promo-form__fila--nombre-plan">
            <div class="campo">
              <label>Nombre del Plan</label>
              <input type="text" [ngModel]="formNombrePlan()" (ngModelChange)="formNombrePlan.set($event)" name="formNombrePlan" required placeholder="Ej. Plan facial luminosidad">
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

          <div class="plan-builder__cabecera">
            <div>
              <h4>Tratamientos del plan ({{ formTratamientosPlan().length }})</h4>
              <span class="dato__label">Si cargas una promoción, se separan sus tratamientos para decidir si cada uno requiere más sesiones.</span>
            </div>
            <button type="button" class="btn btn--linea btn--sm" (click)="agregarTratamientoPlanForm()">+ Agregar tratamiento</button>
          </div>

          <div class="plan-builder">
            @for (grupo of formTratamientosPlan(); track $index; let gi = $index) {
              <article class="plan-tratamiento">
                <div class="plan-tratamiento__cabecera">
                  <div>
                    <strong>Tratamiento {{ gi + 1 }}</strong>
                    <span>
                      @if (grupo.tratamientoId) {
                        {{ tratamientoNombre(grupo.tratamientoId) }} ·
                        {{ grupo.incluidoEnBase ? 'Incluido en ' + (grupo.origen || 'combo') : soles(precioTratamiento(grupo.tratamientoId)) }}
                      } @else {
                        Selecciona un tratamiento para calcular el precio.
                      }
                    </span>
                  </div>
                  <button type="button" class="boton-icono" (click)="eliminarTratamientoPlanForm(gi)" [disabled]="formTratamientosPlan().length === 1">Quitar tratamiento</button>
                </div>

                <div class="plan-tratamiento__grid">
                  <div class="campo">
                    <label>Tratamiento</label>
                    <div class="selector-tratamiento" [class.selector-tratamiento--abierto]="formTratamientoAbierto() === gi">
                      <div class="selector-tratamiento__control">
                        <input type="search"
                               autocomplete="off"
                               [ngModel]="busquedaTratamientoPlanForm(gi, grupo.tratamientoId)"
                               (focus)="abrirSelectorTratamientoPlan(gi)"
                               (click)="abrirSelectorTratamientoPlan(gi)"
                               (ngModelChange)="buscarTratamientoPlanForm(gi, $event)"
                               name="planTratamientoBusqueda_{{ gi }}"
                               placeholder="Buscar o seleccionar tratamiento">
                        <button type="button" aria-label="Ver tratamientos" (click)="alternarSelectorTratamientoPlan(gi)">⌄</button>
                      </div>
                      @if (formTratamientoAbierto() === gi) {
                        <div class="selector-tratamiento__menu">
                          @for (opcion of opcionesTratamientoPlan(gi); track opcion.tipo + '-' + opcion.id) {
                            <button type="button" (mousedown)="$event.preventDefault()" (click)="seleccionarOpcionPlanForm(gi, opcion)">
                              <span>
                                <small>{{ opcion.tipo }}</small>
                                {{ opcion.titulo }}
                                <em>{{ opcion.detalle }}</em>
                              </span>
                              <strong>
                                @if (opcion.precioAntes) { <del>{{ soles(opcion.precioAntes) }}</del> }
                                {{ soles(opcion.precio) }}
                              </strong>
                            </button>
                          } @empty {
                            <p>No encontramos tratamientos ni promociones con esa búsqueda.</p>
                          }
                        </div>
                      }
                    </div>
                  </div>
                  <div class="campo">
                    <label>¿Requiere más sesiones?</label>
                    <div class="toggle-mini">
                      <button type="button" [class.toggle-mini__activo]="!grupo.multisesion" (click)="alternarMultisesionPlanForm(gi, false)">No</button>
                      <button type="button" [class.toggle-mini__activo]="grupo.multisesion" (click)="alternarMultisesionPlanForm(gi, true)">Sí</button>
                    </div>
                  </div>
                </div>

                <div class="plan-sesiones">
                  <div class="plan-sesiones__cabecera">
                    <span class="dato__label">Sesiones de este tratamiento</span>
                    <button type="button" class="btn btn--linea btn--sm" (click)="agregarSesionPlanForm(gi)" [disabled]="!grupo.multisesion">Agregar sesión</button>
                  </div>
                  @for (s of grupo.sesiones; track $index; let si = $index) {
                    <div class="sesion-form-item">
                      <strong>Sesión {{ si + 1 }}</strong>
                      <div class="campo">
                        <label>Fecha {{ si === 0 ? '(obligatoria)' : '(opcional)' }}</label>
                        <input type="date" [ngModel]="s.fecha" (ngModelChange)="actualizarSesionPlanForm(gi, si, 'fecha', $event)" name="planSesionFecha_{{ gi }}_{{ si }}" [required]="si === 0">
                      </div>
                      <div class="campo">
                        <label>Hora {{ si === 0 ? '(obligatoria)' : '(opcional)' }}</label>
                        <select [ngModel]="s.hora" (ngModelChange)="actualizarSesionPlanForm(gi, si, 'hora', $event)" name="planSesionHora_{{ gi }}_{{ si }}" [required]="si === 0" [disabled]="!s.fecha">
                          @if (si === 0 && !s.hora) { <option value="" disabled>Elige una hora disponible</option> }
                          @if (si > 0) { <option value="">Sin hora definida</option> }
                          @for (bloque of bloquesPlanFormulario(s.fecha); track bloque.inicio) {
                            <option [value]="bloque.inicio" [disabled]="!bloque.disponible">
                              {{ etiquetaBloque(bloque) }}
                            </option>
                          }
                        </select>
                      </div>
                      <div class="campo">
                        <label>Zona (opcional)</label>
                        <input type="text" [ngModel]="s.zona" (ngModelChange)="actualizarSesionPlanForm(gi, si, 'zona', $event)" name="planSesionZona_{{ gi }}_{{ si }}" placeholder="Rostro, labios, abdomen">
                      </div>
                      <div class="campo">
                        <label>Observación (opcional)</label>
                        <input type="text" [ngModel]="s.observaciones" (ngModelChange)="actualizarSesionPlanForm(gi, si, 'observaciones', $event)" name="planSesionObs_{{ gi }}_{{ si }}" placeholder="Nota de recepción">
                      </div>
                      <button type="button" class="boton-icono" (click)="eliminarSesionPlanForm(gi, si)" [disabled]="grupo.sesiones.length === 1">Quitar</button>
                    </div>
                  }
                </div>
              </article>
            }
            @if (formTratamientosPlan().length === 0) {
              <div class="vacio plan-builder__vacio">
                No hay tratamientos en el plan. Carga una promoción, un tratamiento o añade uno manualmente.
              </div>
            }
          </div>

          <div class="promo-form__acciones" style="margin-top: 25px;">
            <button type="submit" class="btn btn--vino btn--sm" [disabled]="!planFormValido()">
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
              DNI {{ plan.dni }} · {{ plan.nombre }} · {{ sede(plan.localId) }}
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
            <div><span class="dato__label">Precio total</span><strong>{{ soles(precioPlan(plan)) }}</strong></div>
            <div><span class="dato__label">Adelanto pagado</span><strong>{{ soles(pagadoPlan(plan)) }}</strong></div>
            <div>
              <span class="dato__label">Saldo restante</span>
              <strong [style.color]="saldoPlan(plan) > 0 ? 'var(--alerta)' : 'var(--ok)'">
                {{ soles(saldoPlan(plan)) }}
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
                  {{ s.fecha ? fechaLarga(s.fecha) + (s.hora ? ' · ' + formatoHora(s.hora) : '') : 'Sin fecha asignada · recepción define fecha y hora con la paciente' }}
                </p>
                @if (s.observaciones) { <p class="sesion__obs">{{ s.observaciones }}</p> }
                <div class="sesion__controles">
                  <div class="sesion__acciones">
                    @for (e of estadosSesion; track e) {
                      <button class="accion" [class.accion--activa]="s.estado === e"
                              (click)="planes.cambiarEstadoSesion(plan.id, s.numero, e)">{{ e }}</button>
                    }
                  </div>
                  <div class="sesion__gestion">
                    <button type="button" class="btn-gestion"
                            [class.btn-gestion--activo]="sesionEditorAbierto(plan.id, s.numero)"
                            (click)="alternarEditorSesion(plan.id, s.numero)">
                      {{ sesionEditorAbierto(plan.id, s.numero) ? 'Ocultar configuración' : (s.fecha ? 'Configurar sesión' : 'Asignar fecha') }}
                    </button>
                    <button type="button" class="btn-gestion btn-gestion--peligro"
                            [disabled]="plan.sesiones.length === 1"
                            (click)="eliminarSesion(plan, s)">
                      Eliminar sesión
                    </button>
                  </div>
                </div>
                @if (sesionEditorAbierto(plan.id, s.numero)) {
                  <div class="sesion-editor">
                    <div class="campo">
                      <label>Tratamiento</label>
                      <select [ngModel]="s.tratamientoId" (ngModelChange)="actualizarSesionPlan(plan.id, s, 'tratamientoId', Number($event))" name="editarTrat{{ plan.id }}{{ s.numero }}">
                        @for (t of tratamientosLista; track t.id) {
                          <option [value]="t.id">{{ t.nombre }}</option>
                        }
                      </select>
                    </div>
                    <div class="campo">
                      <label>Fecha</label>
                      <input type="date" [ngModel]="s.fecha || ''" (ngModelChange)="actualizarSesionPlan(plan.id, s, 'fecha', $event)" name="editarFecha{{ plan.id }}{{ s.numero }}">
                    </div>
                    <div class="campo">
                      <label>Hora</label>
                      <select [ngModel]="s.hora || ''" (ngModelChange)="actualizarSesionPlan(plan.id, s, 'hora', $event)" name="editarHora{{ plan.id }}{{ s.numero }}" [disabled]="!s.fecha">
                        <option value="">Sin hora definida</option>
                        @for (bloque of bloquesPlan(plan, s, s.fecha || ''); track bloque.inicio) {
                          <option [value]="bloque.inicio" [disabled]="!bloque.disponible">
                            {{ etiquetaBloque(bloque) }}
                          </option>
                        }
                      </select>
                    </div>
                    <div class="campo">
                      <label>Zona</label>
                      <input type="text" [ngModel]="s.zona || ''" (ngModelChange)="actualizarSesionPlan(plan.id, s, 'zona', $event)" name="editarZona{{ plan.id }}{{ s.numero }}" placeholder="Rostro, labios, abdomen">
                    </div>
                    <div class="campo sesion-editor__nota">
                      <label>Observación</label>
                      <input type="text" [ngModel]="s.observaciones || ''" (ngModelChange)="actualizarSesionPlan(plan.id, s, 'observaciones', $event)" name="editarObs{{ plan.id }}{{ s.numero }}" placeholder="Nota de recepción o especialista">
                    </div>
                    <div class="sesion-editor__guardar">
                      <button type="button" class="btn btn--vino btn--sm" (click)="guardarConfiguracionSesion(plan.id, s.numero)">
                        Guardar configuración
                      </button>
                      @if (mensajeGuardadoSesion(plan.id, s.numero)) {
                        <span>{{ mensajeGuardadoSesion(plan.id, s.numero) }}</span>
                      } @else {
                        <small>Los cambios se conservan en este prototipo y quedarán listos para la base de datos.</small>
                      }
                    </div>
                  </div>
                }
              </div>
            </li>
          }
        </ol>

        <footer class="plan__pie">
          @if (plan.notas) { <p class="plan__notas">{{ plan.notas }}</p> }
          <div class="plan__acciones">
            <div class="voucher-plan">
              <button class="btn btn--vino btn--sm" type="button" (click)="imprimirVoucherPlan(plan)">Imprimir voucher</button>
              @if (enlaceWhatsappPlan(plan)) {
                <a class="btn btn--linea btn--sm" [href]="enlaceWhatsappPlan(plan)" target="_blank" rel="noopener">WhatsApp</a>
              }
              @if (enlaceCorreoPlan(plan)) {
                <a class="btn btn--linea btn--sm" [href]="enlaceCorreoPlan(plan)">E-mail</a>
              }
            </div>
            @if (saldoPlan(plan) > 0) {
              <div class="cobro-plan">
                <div class="campo"><label>Monto recibido</label><input type="number" min="1" [placeholder]="saldoPlan(plan)" [ngModel]="montoPlan()[plan.id] || saldoPlan(plan)" (ngModelChange)="setMontoPlan(plan.id, Number($event))"></div>
                <div class="campo"><label>Método</label><select [ngModel]="metodoPlan()[plan.id] || 'Efectivo'" (ngModelChange)="setMetodoPlan(plan.id, $event)">@for (m of metodosPago; track m) { <option>{{ m }}</option> }</select></div>
                <button class="btn btn--vino btn--sm" (click)="registrarPagoPlan(plan)">Cobrar ahora</button>
                <button class="btn btn--linea btn--sm" (click)="cobrarSaldo(plan)">Marcar plan totalmente pagado</button>
                <small>Registra aquí lo que la paciente entrega en caja. Si todavía falta saldo, el sistema lo mantiene visible para la siguiente visita.</small>
              </div>
            }
            <div class="agregar-sesion-plan">
              <div class="campo">
                <label>Agregar sesión a tratamiento</label>
                <select [ngModel]="tratamientoNuevoPlan()[plan.id] || tratamientoSugerido(plan)" (ngModelChange)="setTratamientoNuevoPlan(plan.id, Number($event))" name="nuevoTrat{{ plan.id }}">
                  @for (t of tratamientosDePlan(plan); track t.id) {
                    <option [value]="t.id">{{ t.nombre }}</option>
                  }
                </select>
              </div>
              <button class="btn btn--linea btn--sm" type="button" (click)="agregarSesionAPlan(plan)">Agregar sesión</button>
              <small>Úsalo si la paciente necesita una sesión adicional o si recepción debe coordinar una nueva fecha después de atenderla.</small>
            </div>
          </div>
        </footer>
      </section>
    } @empty {
      <div class="tabla-panel"><p class="vacio">No hay planes que coincidan con la búsqueda.</p></div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.Default,
  styles: [`
    .kpis-4 { grid-template-columns: repeat(4, 1fr); margin-bottom: 22px; }
    .plan { background: #fff; border: 1px solid var(--linea); border-radius: var(--radio-lg); box-shadow: var(--sombra); margin-bottom: 20px; overflow: hidden; }
    .plan, .plan * { box-sizing: border-box; }
    .plan__cabecera {
      display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(210px, .8fr) minmax(220px, .8fr); gap: 22px;
      padding: 22px 24px; border-bottom: 1px solid var(--linea);
    }
    .plan__cabecera h3 { margin: 4px 0 6px; }
    .plan__meta { font-size: .9rem; margin: 0; }
    .plan__estado { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; }
    .plan__avance { width: 100%; }
    .plan__avance small { color: var(--gris); font-size: .86rem; }
    .plan__cobro { display: flex; flex-direction: column; gap: 6px; text-align: right; min-width: 0; }
    .plan__cobro div { display: flex; justify-content: space-between; gap: 14px; min-width: 0; }
    .plan__cobro strong, .plan__meta, .sesion__titulo strong { overflow-wrap: anywhere; }
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
    .sesion__cuerpo { flex: 1; min-width: 0; }
    .sesion__titulo { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 4px; }
    .sesion__fecha { font-size: .9rem; margin: 0 0 4px; }
    .sesion__obs { font-size: .9rem; color: var(--gris); margin: 0 0 8px; font-style: italic; }
    .sesion__controles { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; margin-top: 8px; }
    .sesion__acciones { display: flex; gap: 6px; flex-wrap: wrap; min-width: 0; }
    .sesion__gestion { display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; margin-left: auto; min-width: min(100%, 240px); }
    .sesion-editor {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
      gap: 10px;
      margin-top: 12px;
      padding: 12px;
      border: 1px dashed var(--linea);
      border-radius: var(--radio);
      background: #fff;
    }
    .sesion-editor__nota { grid-column: 1 / -1; }
    .sesion-editor__guardar {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      flex-wrap: wrap;
      padding-top: 4px;
    }
    .sesion-editor__guardar span { color: var(--ok); font-weight: 700; font-size: .9rem; }
    .sesion-editor__guardar small { color: var(--gris-claro); font-size: .86rem; }
    .accion {
      border: 1px solid var(--linea); border-radius: 999px; background: #fff;
      min-width: 94px; padding: 6px 14px; font-family: inherit; font-size: .86rem; color: var(--gris); cursor: pointer;
      max-width: 100%;
    }
    .accion:hover { border-color: var(--magenta-300); color: var(--magenta); }
    .accion--activa { background: var(--vino); border-color: var(--vino); color: #fff; }
    .btn-gestion {
      border: 1px solid var(--vino);
      border-radius: 8px;
      background: var(--vino);
      color: #fff;
      min-width: 136px;
      padding: 8px 13px;
      font-family: inherit;
      font-size: .82rem;
      font-weight: 700;
      letter-spacing: .04em;
      cursor: pointer;
      box-shadow: 0 8px 18px rgba(102, 10, 49, .14);
    }
    .btn-gestion:hover, .btn-gestion--activo { background: var(--magenta); border-color: var(--magenta); }
    .btn-gestion--peligro { background: #fff; border-color: rgba(180, 40, 70, .32); color: #9f2745; box-shadow: none; }
    .btn-gestion--peligro:hover { background: #fff3f5; border-color: #9f2745; color: #7c1630; }
    .btn-gestion:disabled { opacity: .45; cursor: not-allowed; }
    .plan__pie { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 18px; padding: 18px 4%; border-top: 1px solid var(--linea); background: var(--rosa-50); }
    .plan__pie > * { min-width: 0; max-width: 100%; }
    .plan__notas { margin: 0; font-size: .9rem; font-style: italic; }
    .plan__acciones { display: flex; gap: 10px; flex-wrap: wrap; align-items: stretch; width: 100%; min-width: 0; }
    .voucher-plan { display: flex; gap: 10px; flex-wrap: wrap; width: 100%; }
    .voucher-plan .btn { flex: 0 1 auto; }
    .cobro-plan small { color: var(--gris); font-size: .86rem; line-height: 1.4; }
    .cobro-plan {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 150px), 1fr)); gap: 10px; align-items: end; min-width: 0; max-width: 100%;
      padding: 12px; border: 1px solid var(--linea); border-radius: var(--radio); background: #fff;
    }
    .cobro-plan .campo { min-width: 0; }
    .cobro-plan input, .cobro-plan select, .sesion-editor input, .sesion-editor select { width: 100%; min-width: 0; max-width: 100%; }
    .cobro-plan .btn { min-width: 0; white-space: normal; line-height: 1.25; }
    .cobro-plan small { grid-column: 1 / -1; }
    .agregar-sesion-plan {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px;
      align-items: end;
      min-width: min(100%, 360px);
      max-width: 100%;
      padding: 12px;
      border: 1px solid var(--linea);
      border-radius: var(--radio);
      background: #fff;
    }
    .agregar-sesion-plan small { grid-column: 1 / -1; color: var(--gris); font-size: .86rem; line-height: 1.4; }
    .vacio { text-align: center; color: var(--gris-claro); padding: 30px 0; margin: 0; }
    
    /* Estilos del formulario de registro */
    .promo-form { padding: 20px 22px 24px; overflow: hidden; }
    .promo-form, .promo-form * { box-sizing: border-box; }
    .promo-form input, .promo-form select, .promo-form textarea, .promo-form button { max-width: 100%; min-width: 0; }
    .promo-form__fila { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 170px), 1fr)); gap: 14px; }
    .promo-form__fila--nombre-plan { grid-template-columns: minmax(0, 760px); }
    .promo-form__acciones { display: flex; align-items: center; gap: 14px; }
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
      margin: -2px 0 16px;
      padding: 12px 14px;
      border-radius: var(--radio);
      font-size: .9rem;
      line-height: 1.45;
    }
    .estado-cuenta strong { color: var(--vino); white-space: nowrap; }
    .estado-cuenta span { color: var(--gris); }
    .estado-cuenta--ok { border: 1px solid rgba(44, 139, 93, .24); background: rgba(44, 139, 93, .08); }
    .estado-cuenta--alerta { border: 1px solid rgba(184, 124, 35, .28); background: #fffaf2; }
    .plan-builder { display: grid; gap: 14px; margin-bottom: 15px; }
    .plan-builder__cabecera {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }
    .plan-builder__cabecera h4 { margin: 0 0 4px; }
    .plan-builder__vacio { padding: 12px; border: 1px dashed var(--linea); border-radius: var(--radio); }
    .plan-tratamiento {
      display: grid;
      gap: 14px;
      padding: 16px;
      border: 1px solid var(--linea);
      border-radius: var(--radio-lg);
      background: var(--rosa-50);
      min-width: 0;
    }
    .plan-tratamiento__cabecera,
    .plan-sesiones__cabecera {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      flex-wrap: wrap;
    }
    .plan-tratamiento__cabecera {
      padding-bottom: 12px;
      border-bottom: 1px dashed var(--linea);
    }
    .plan-tratamiento__cabecera div { display: grid; gap: 3px; min-width: 0; }
    .plan-tratamiento__cabecera strong { color: var(--vino); }
    .plan-tratamiento__cabecera span { color: var(--gris); font-size: .9rem; overflow-wrap: anywhere; }
    .plan-tratamiento__grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
      gap: 14px;
      align-items: end;
    }
    .toggle-mini {
      display: inline-flex;
      width: 100%;
      min-width: 0;
      padding: 4px;
      border: 1px solid var(--linea);
      border-radius: 999px;
      background: #fff;
    }
    .toggle-mini button {
      flex: 1;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: var(--gris);
      font-family: inherit;
      font-weight: 700;
      padding: 8px 14px;
      cursor: pointer;
    }
    .toggle-mini__activo {
      background: var(--vino) !important;
      color: #fff !important;
      box-shadow: 0 8px 18px rgba(102, 10, 49, .18);
    }
    .plan-sesiones { display: grid; gap: 10px; }
    .sesion-form-item {
      display: grid;
      grid-template-columns: 88px repeat(4, minmax(130px, 1fr)) auto;
      gap: 12px;
      align-items: end;
      min-width: 0;
      max-width: 100%;
      padding: 12px;
      border: 1px solid var(--linea);
      border-radius: var(--radio);
      background: #fff;
    }
    .sesion-form-item > strong { color: var(--vino); align-self: center; }
    .sesion-form-item select, .sesion-form-item input { padding: 6px 10px; font-size: 0.85rem; width: 100%; }

    @media (max-width: 1200px) {
      .kpis-4 { grid-template-columns: repeat(2, 1fr); }
      .plan__cabecera { grid-template-columns: 1fr; }
      .plan__cobro { text-align: left; }
      .cobro-plan { grid-template-columns: 1fr; }
      .sesion-editor, .agregar-sesion-plan { grid-template-columns: 1fr; }
    }

    @media (max-width: 720px) {
      .promo-form { padding: 16px 14px 18px; }
      .promo-form__acciones { flex-direction: column; align-items: stretch; }
      .promo-form__acciones .btn { width: 100%; }
      .estado-cuenta { align-items: flex-start; flex-direction: column; gap: 5px; }
      .estado-cuenta strong { white-space: normal; }
      .plan-builder__cabecera .btn,
      .plan-sesiones__cabecera .btn { width: 100%; justify-content: center; }
      .sesion-form-item { grid-template-columns: 1fr !important; align-items: stretch !important; }
      .plan__cabecera, .sesion { padding-left: 16px; padding-right: 16px; }
      .sesion { gap: 10px; }
      .sesion__controles { flex-direction: column; align-items: stretch; }
      .sesion__gestion { justify-content: stretch; margin-left: 0; width: 100%; }
      .sesion__gestion .btn-gestion { flex: 1 1 100%; }
      .plan__acciones { width: 100%; }
      .plan__acciones > * { flex: 1 1 100%; }
      .cobro-plan { grid-template-columns: 1fr; }
      .cobro-plan .btn { width: 100%; }
      .plan__cobro { text-align: left; }
      .plan__cobro div { align-items: flex-start; }
    }
  `]
})
export class SesionesComponent implements OnDestroy {
  private pacientesService = inject(PacientesService);
  private disponibilidad = inject(DisponibilidadService);
  private ruta = inject(ActivatedRoute);
  private vouchers = inject(VoucherService);
  private promocionesService = inject(PromocionesService);
  Number = Number;
  soles = soles;
  fechaLarga = formatoFechaLarga;
  paciente = (id: number) => {
    const paciente = this.pacientesService.porId(id);
    return paciente ? `${paciente.nombre} ${paciente.apellido}` : '—';
  };
  locales = LOCALES;
  estadosSesion = ESTADOS_SESION;
  metodosPago: MetodoPago[] = ['Efectivo', 'Yape', 'Plin', 'Tarjeta POS', 'Transferencia'];
  montoPlan = signal<Record<number, number>>({});
  metodoPlan = signal<Record<number, MetodoPago>>({});
  tratamientoNuevoPlan = signal<Record<number, number>>({});

  // Catálogos base para el formulario
  tratamientosLista = TRATAMIENTOS;
  formatoHora = formatoHora12;

  get promocionesLista() {
    return this.promocionesService.promociones();
  }

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
  formLocalId = signal(LOCALES[0]?.id ?? 1);
  formNombrePlan = signal('');
  formPrecioTotal = signal<number>(0);
  formPrecioBase = signal<number>(0);
  formPagado = signal<number>(0);
  formNotas = signal('');
  formTratamientosPlan = signal<FormTratamientoPlan[]>([]);
  formTratamientoBusqueda = signal<Record<number, string>>({});
  formTratamientoAbierto = signal<number | null>(null);
  editoresSesionAbiertos = signal<Record<string, boolean>>({});
  guardadoSesion = signal<Record<string, string>>({});
  disponibilidadTick = signal(0);
  pacientePlanEncontrado = signal<Paciente | null>(null);
  private temporizadorDisponibilidad?: ReturnType<typeof setInterval>;
  private readonly refrescarDisponibilidad = () => this.disponibilidadTick.update(v => v + 1);

  lista = computed<PlanSesiones[]>(() => this.planes.buscar(this.busqueda()).filter(p =>
    (this.estado() === 'Todos' || p.estado === this.estado()) &&
    (this.local() === 'Todas' || this.sede(p.localId) === this.local())
  ));

  enCurso = computed(() => this.planes.planes().filter(p => p.estado === 'En curso').length);
  atendidas = computed(() => this.todasLasSesiones().filter(s => s.estado === 'Atendida').length);
  porAtender = computed(() => this.todasLasSesiones()
    .filter(s => s.estado === 'Pendiente' || s.estado === 'Programada' || s.estado === 'Reprogramada').length);
  saldo = computed(() => this.planes.planes().reduce((t, p) => t + this.saldoPlan(p), 0));

  constructor(public planes: PlanesService) {
    const buscar = this.ruta.snapshot.queryParamMap.get('buscar');
    if (buscar) {
      this.busqueda.set(buscar);
    }
    this.temporizadorDisponibilidad = setInterval(this.refrescarDisponibilidad, 5000);
    window.addEventListener('storage', this.refrescarDisponibilidad);
  }

  ngOnDestroy(): void {
    clearInterval(this.temporizadorDisponibilidad);
    window.removeEventListener('storage', this.refrescarDisponibilidad);
  }

  sede(id: number): string {
    return id ? (LOCALES.find(l => l.id === id)?.nombre ?? '—') : 'Por definir';
  }

  dni(pacienteId: number): string {
    return this.pacientesService.porId(pacienteId)?.dni ?? '—';
  }

  alternarFormularioPlan(): void {
    const abierto = !this.mostrarFormulario();
    this.mostrarFormulario.set(abierto);
    if (abierto && !this.formTratamientosPlan().length) {
      this.agregarTratamientoPlanForm();
    }
  }

  pacienteEntidad(pacienteId: number): Paciente | undefined {
    return this.pacientesService.porId(pacienteId);
  }

  precioPlan(plan: PlanSesiones): number {
    return Math.max(Number(plan.precioTotal || 0), 0);
  }

  pagadoPlan(plan: PlanSesiones): number {
    return Math.min(Math.max(Number(plan.pagado || 0), 0), this.precioPlan(plan));
  }

  saldoPlan(plan: PlanSesiones): number {
    return Math.max(this.precioPlan(plan) - this.pagadoPlan(plan), 0);
  }

  registrarPagoPlan(plan: PlanSesiones): void {
    const monto = Math.min(Math.max(Number(this.montoPlan()[plan.id] || this.saldoPlan(plan)), 0), this.saldoPlan(plan));
    if (monto <= 0) { return; }
    this.planes.registrarPago(plan.id, monto, this.metodoPlan()[plan.id] || 'Efectivo');
    this.montoPlan.update(v => ({ ...v, [plan.id]: 0 }));
  }

  setMontoPlan(id: number, monto: number): void {
    this.montoPlan.update(v => ({ ...v, [id]: Math.max(Number(monto || 0), 0) }));
  }

  setMetodoPlan(id: number, metodo: MetodoPago): void {
    this.metodoPlan.update(v => ({ ...v, [id]: metodo }));
  }

  sesionEditorAbierto(planId: number, numeroSesion: number): boolean {
    return !!this.editoresSesionAbiertos()[this.claveEditorSesion(planId, numeroSesion)];
  }

  alternarEditorSesion(planId: number, numeroSesion: number): void {
    const clave = this.claveEditorSesion(planId, numeroSesion);
    this.editoresSesionAbiertos.update(v => ({ ...v, [clave]: !v[clave] }));
  }

  mensajeGuardadoSesion(planId: number, numeroSesion: number): string {
    return this.guardadoSesion()[this.claveEditorSesion(planId, numeroSesion)] ?? '';
  }

  guardarConfiguracionSesion(planId: number, numeroSesion: number): void {
    const plan = this.planes.porId(planId);
    if (!plan?.sesiones.some(sesion => sesion.numero === numeroSesion)) { return; }
    const clave = this.claveEditorSesion(planId, numeroSesion);
    this.guardadoSesion.update(v => ({
      ...v,
      [clave]: `Configuración guardada ${new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}`
    }));
    window.setTimeout(() => {
      this.guardadoSesion.update(v => {
        const copia = { ...v };
        delete copia[clave];
        return copia;
      });
    }, 3500);
  }

  eliminarSesion(plan: PlanSesiones, sesion: SesionPlan): void {
    if (plan.sesiones.length === 1) { return; }
    const seguro = confirm(`¿Seguro que quieres eliminar la sesión ${sesion.numero}? Se borrará del registro.`);
    if (!seguro) { return; }
    this.planes.eliminarSesion(plan.id, sesion.numero);
    this.editoresSesionAbiertos.update(v => {
      const copia = { ...v };
      delete copia[this.claveEditorSesion(plan.id, sesion.numero)];
      return copia;
    });
  }

  setTratamientoNuevoPlan(planId: number, tratamientoId: number): void {
    this.tratamientoNuevoPlan.update(v => ({ ...v, [planId]: tratamientoId }));
  }

  cobrarSaldo(plan: PlanSesiones): void {
    const saldo = this.saldoPlan(plan);
    if (saldo <= 0) { return; }
    this.planes.registrarPago(plan.id, saldo, this.metodoPlan()[plan.id] || 'Efectivo');
  }

  imprimirVoucherPlan(plan: PlanSesiones): void {
    this.vouchers.imprimirPlan(plan, this.pacienteEntidad(plan.pacienteId));
  }

  enlaceWhatsappPlan(plan: PlanSesiones): string {
    return this.vouchers.enlaceWhatsappPlan(plan, this.pacienteEntidad(plan.pacienteId));
  }

  enlaceCorreoPlan(plan: PlanSesiones): string {
    return this.vouchers.enlaceCorreoPlan(plan, this.pacienteEntidad(plan.pacienteId));
  }

  actualizarSesionPlan(planId: number, sesion: SesionPlan, campo: 'tratamientoId' | 'fecha' | 'hora' | 'zona' | 'observaciones', valor: string | number): void {
    const plan = this.planes.porId(planId);
    if (!plan) { return; }

    if (campo === 'fecha') {
      const fecha = String(valor);
      this.planes.actualizarSesion(planId, sesion.numero, { fecha });
      if (sesion.hora && !this.bloquesPlan(plan, sesion, fecha).some(bloque => bloque.inicio === sesion.hora && bloque.disponible)) {
        this.planes.actualizarSesion(planId, sesion.numero, { hora: '' });
      }
      return;
    }

    if (campo === 'hora' && valor && !this.bloquesPlan(plan, sesion, sesion.fecha || '').some(bloque => bloque.inicio === valor && bloque.disponible)) {
      return;
    }

    this.planes.actualizarSesion(planId, sesion.numero, { [campo]: campo === 'tratamientoId' ? Number(valor) : String(valor) });
  }

  cambiarSedePlan(localId: number): void {
    this.formLocalId.set(localId);
    this.formTratamientosPlan.update(grupos => grupos.map(grupo => ({
      ...grupo,
      sesiones: grupo.sesiones.map(sesion => ({
        ...sesion,
        hora: sesion.hora && this.horaFormularioDisponible(sesion.fecha, sesion.hora) ? sesion.hora : ''
      }))
    })));
  }

  bloquesPlanFormulario(fecha: string): Bloque[] {
    return this.bloquesPara(this.formLocalId(), fecha);
  }

  bloquesPlan(plan: PlanSesiones, sesion: SesionPlan, fecha: string): Bloque[] {
    return this.bloquesPara(plan.localId, fecha).map(bloque => {
      const esHorarioActual = fecha === sesion.fecha && bloque.inicio === sesion.hora;
      return esHorarioActual
        ? { ...bloque, disponible: true, motivo: undefined }
        : bloque;
    });
  }

  agregarSesionAPlan(plan: PlanSesiones): void {
    this.planes.agregarSesionATratamiento(plan.id, this.tratamientoNuevoPlan()[plan.id] || this.tratamientoSugerido(plan));
    const siguienteNumero = plan.sesiones.reduce((max, s) => Math.max(max, s.numero), 0) + 1;
    this.editoresSesionAbiertos.update(v => ({ ...v, [this.claveEditorSesion(plan.id, siguienteNumero)]: true }));
  }

  tratamientosDePlan(plan: PlanSesiones) {
    const ids = Array.from(new Set(plan.sesiones.map(s => s.tratamientoId)));
    return ids.length
      ? ids.map(id => TRATAMIENTOS.find(t => t.id === id)).filter((t): t is typeof TRATAMIENTOS[number] => !!t)
      : this.tratamientosLista;
  }

  tratamientoSugerido(plan: PlanSesiones): number {
    return plan.sesiones[0]?.tratamientoId || this.tratamientosLista[0]?.id || 1;
  }

  etiquetaBloque(bloque: Bloque): string {
    const ocupados = Math.max(bloque.reservados + bloque.retenidos, 0);
    const detalle = ocupados > 0
      ? ` · ${ocupados} ${ocupados === 1 ? 'ocupado' : 'ocupados'}${bloque.retenidos ? ` (${bloque.retenidos} temporal)` : ''}`
      : '';
    return `${this.formatoHora(bloque.inicio)} · ${bloque.libres} de ${bloque.cupo} disponibles${detalle}`;
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
    const limpio = dni.replace(/\D/g, '').slice(0, 8);
    this.formDni.set(limpio);
    this.pacientePlanEncontrado.set(null);
    if (limpio.length === 8) {
      const p = this.pacientesService.porDni(limpio);
      if (p) {
        this.pacientePlanEncontrado.set(p);
        this.formNombre.set(p.nombre);
        this.formApellido.set(p.apellido);
        this.formCelular.set(p.celular);
        this.formCorreo.set(p.correo || '');
      }
    }
  }

  agregarTratamientoPlanForm(): void {
    this.formTratamientosPlan.update(list => [...list, this.crearTratamientoPlanForm(0)]);
    this.recalcularPrecioNuevoPlan();
  }

  eliminarTratamientoPlanForm(index: number): void {
    this.formTratamientosPlan.update(list => list.length === 1 ? list : list.filter((_, i) => i !== index));
    this.recalcularPrecioNuevoPlan();
  }

  actualizarTratamientoPlanForm(index: number, tratamientoId: number): void {
    this.formTratamientosPlan.update(list => list.map((grupo, i) => i === index ? { ...grupo, tratamientoId } : grupo));
    this.formTratamientoBusqueda.update(v => ({ ...v, [index]: this.tratamientoEtiqueta(tratamientoId) }));
    this.formPrecioBase.set(0);
    this.recalcularPrecioNuevoPlan();
  }

  buscarTratamientoPlanForm(index: number, valor: string): void {
    this.formTratamientoBusqueda.update(v => ({ ...v, [index]: valor }));
    this.formTratamientoAbierto.set(index);
    if (!valor.trim()) {
      this.actualizarTratamientoPlanForm(index, 0);
      return;
    }
    const tratamiento = this.tratamientosLista.find(t =>
      this.normalizarTexto(this.tratamientoEtiqueta(t.id)) === this.normalizarTexto(valor) ||
      this.normalizarTexto(t.nombre) === this.normalizarTexto(valor)
    );
    if (tratamiento) {
      this.actualizarTratamientoPlanForm(index, tratamiento.id);
      return;
    }
    this.formTratamientosPlan.update(list => list.map((grupo, i) => i === index ? { ...grupo, tratamientoId: 0 } : grupo));
    this.formPrecioBase.set(0);
    this.recalcularPrecioNuevoPlan();
  }

  busquedaTratamientoPlanForm(index: number, tratamientoId: number): string {
    return this.formTratamientoBusqueda()[index] ?? this.tratamientoEtiqueta(tratamientoId);
  }

  abrirSelectorTratamientoPlan(index: number): void {
    this.formTratamientoAbierto.set(index);
  }

  alternarSelectorTratamientoPlan(index: number): void {
    this.formTratamientoAbierto.set(this.formTratamientoAbierto() === index ? null : index);
  }

  seleccionarOpcionPlanForm(index: number, opcion: OpcionPlanSelector): void {
    if (opcion.tipo === 'Promoción') {
      this.cargarPromocionPlan(opcion.id);
      this.formTratamientoAbierto.set(null);
      return;
    }
    this.actualizarTratamientoPlanForm(index, opcion.id);
    this.formTratamientoAbierto.set(null);
  }

  opcionesTratamientoPlan(index: number): OpcionPlanSelector[] {
    const texto = this.normalizarTexto(this.formTratamientoBusqueda()[index] ?? '');
    const promociones = this.promocionesVigentes().map(promo => ({
      tipo: 'Promoción' as const,
      id: promo.id,
      titulo: promo.titulo,
      detalle: `${promo.etiqueta} · vigente hasta ${promo.vigenciaHasta}`,
      precio: promo.precio ?? 0,
      precioAntes: promo.precioAntes
    }));
    const tratamientos = this.tratamientosLista.filter(t => t.activo).map(t => ({
      tipo: 'Tratamiento' as const,
      id: t.id,
      titulo: t.nombre,
      detalle: `${t.categoria} · ${t.duracionMin} min`,
      precio: t.precio,
      precioAntes: t.precioAntes
    }));
    const opciones = [...promociones, ...tratamientos];
    if (!texto) { return opciones; }
    return opciones.filter(opcion =>
      this.normalizarTexto(`${opcion.tipo} ${opcion.titulo} ${opcion.detalle} ${opcion.precio}`).includes(texto)
    );
  }

  private cargarPromocionPlan(promocionId: number): void {
    const promo = this.promocionesLista.find(p => p.id === promocionId);
    if (!promo) { return; }

    this.formNombrePlan.set(promo.titulo);
    this.formPrecioBase.set(promo.precio ?? 0);
    this.formTratamientoBusqueda.set({});

    if (promo.sesionesDetalle?.length) {
      const grupos = new Map<number, FormTratamientoPlan>();
      for (const detalle of promo.sesionesDetalle) {
        const tratamientoId = detalle.tratamientoId ?? this.tratamientosLista[0]?.id ?? 1;
        const actual = grupos.get(tratamientoId) ?? this.crearTratamientoPlanForm(tratamientoId, true, promo.titulo);
        const sesion = this.crearSesionPlanForm(actual.sesiones.length === 0);
        sesion.observaciones = `${detalle.titulo}: ${detalle.descripcion}`.trim();
        actual.sesiones = actual.sesiones.length === 1 && !actual.sesiones[0].observaciones
          ? [sesion]
          : [...actual.sesiones, sesion];
        actual.multisesion = actual.sesiones.length > 1;
        grupos.set(tratamientoId, actual);
      }
      this.formTratamientosPlan.set(Array.from(grupos.values()));
    } else {
      this.formTratamientosPlan.set([this.crearTratamientoPlanForm(this.tratamientosLista[0]?.id ?? 1, true, promo.titulo)]);
    }

    this.recalcularPrecioNuevoPlan();
  }

  private promocionesVigentes() {
    const hoy = aISO(new Date());
    return this.promocionesLista.filter(promo =>
      promo.activa && promo.vigenciaDesde <= hoy && promo.vigenciaHasta >= hoy
    );
  }

  tratamientoEtiqueta(tratamientoId: number): string {
    const tratamiento = this.tratamientosLista.find(t => t.id === tratamientoId);
    return tratamiento ? `${tratamiento.nombre} · ${this.soles(tratamiento.precio)}` : '';
  }

  alternarMultisesionPlanForm(index: number, multisesion: boolean): void {
    this.formTratamientosPlan.update(list => list.map((grupo, i) => {
      if (i !== index) { return grupo; }
      return {
        ...grupo,
        multisesion,
        sesiones: multisesion ? grupo.sesiones : [grupo.sesiones[0] ?? this.crearSesionPlanForm(true)]
      };
    }));
  }

  agregarSesionPlanForm(index: number): void {
    this.formTratamientosPlan.update(list => list.map((grupo, i) => i === index
      ? { ...grupo, multisesion: true, sesiones: [...grupo.sesiones, this.crearSesionPlanForm(false)] }
      : grupo
    ));
  }

  eliminarSesionPlanForm(indexTratamiento: number, indexSesion: number): void {
    this.formTratamientosPlan.update(list => list.map((grupo, i) => {
      if (i !== indexTratamiento || grupo.sesiones.length === 1) { return grupo; }
      const sesiones = grupo.sesiones.filter((_, si) => si !== indexSesion);
      return { ...grupo, sesiones, multisesion: sesiones.length > 1 ? grupo.multisesion : false };
    }));
  }

  actualizarSesionPlanForm(indexTratamiento: number, indexSesion: number, campo: keyof FormSesionPlan, valor: string): void {
    this.formTratamientosPlan.update(list => list.map((grupo, i) => {
      if (i !== indexTratamiento) { return grupo; }
      return {
        ...grupo,
        sesiones: grupo.sesiones.map((sesion, si) => {
          if (si !== indexSesion) { return sesion; }
          const actualizada = { ...sesion, [campo]: valor };
          if (campo === 'fecha' && actualizada.hora && !this.horaFormularioDisponible(actualizada.fecha, actualizada.hora)) {
            actualizada.hora = '';
          }
          return actualizada;
        })
      };
    }));
  }

  planFormValido(): boolean {
    const grupos = this.formTratamientosPlan();
    const sesiones = grupos.flatMap(grupo => grupo.sesiones);
    const primerasIncompletas = grupos.some(grupo => !grupo.tratamientoId || !grupo.sesiones[0]?.fecha || !grupo.sesiones[0]?.hora);
    const sesionesIncompletas = sesiones.some(sesion => !!sesion.fecha !== !!sesion.hora);
    const programadas = sesiones.filter(sesion => !!sesion.fecha && !!sesion.hora);

    return !!this.formNombrePlan() &&
      !!this.formDni() &&
      !!this.formNombre() &&
      !!this.formApellido() &&
      !!this.formLocalId() &&
      grupos.length > 0 &&
      !primerasIncompletas &&
      !sesionesIncompletas &&
      programadas.every(sesion => this.horaFormularioDisponible(sesion.fecha, sesion.hora)) &&
      this.cuposFormularioSuficientes(programadas);
  }

  tratamientoNombre(id: number): string {
    return TRATAMIENTOS.find(t => t.id === id)?.nombre ?? 'Sin tratamiento seleccionado';
  }

  precioTratamiento(id: number): number {
    return TRATAMIENTOS.find(t => t.id === id)?.precio ?? 0;
  }

  guardarNuevoPlan(): void {
    if (!this.planFormValido()) {
      return;
    }

    const paciente = this.pacientesService.registrarOActualizar({
      dni: this.formDni(),
      nombre: this.formNombre(),
      apellido: this.formApellido(),
      celular: this.formCelular(),
      correo: this.formCorreo(),
      observaciones: this.formNotas()
    });

    const sesiones: SesionPlan[] = this.formTratamientosPlan().flatMap((grupo, grupoIndex) =>
      grupo.sesiones.map((sesion, sesionIndex) => ({
        numero: 0,
        tratamientoId: grupo.tratamientoId,
        grupoTratamiento: grupoIndex + 1,
        procedimiento: this.tratamientoNombre(grupo.tratamientoId),
        estado: sesion.fecha && sesion.hora ? 'Programada' as const : 'Pendiente' as const,
        fecha: sesion.fecha || undefined,
        hora: sesion.hora || undefined,
        zona: sesion.zona.trim() || undefined,
        observaciones: sesion.observaciones.trim() || undefined,
        registradoPor: 'Recepción'
      }))
    ).map((sesion, index) => ({ ...sesion, numero: index + 1 }));

    const planData: Omit<PlanSesiones, 'id' | 'codigo'> = {
      pacienteId: paciente.id,
      dni: this.formDni(),
      nombre: this.formNombrePlan(),
      localId: this.formLocalId(),
      intervaloDias: 0,
      inicio: sesiones.find(s => !!s.fecha)?.fecha || aISO(new Date()),
      precioTotal: this.formPrecioTotal(),
      pagado: this.formPagado(),
      estado: 'En curso',
      sesiones,
      notas: this.formNotas() || undefined
    };

    const plan = this.planes.crearPlan(planData);
    this.vouchers.imprimirPlan(plan, paciente);

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
    this.formTratamientosPlan.set([]);
    this.formTratamientoBusqueda.set({});
    this.formTratamientoAbierto.set(null);
    this.pacientePlanEncontrado.set(null);
  }

  private crearTratamientoPlanForm(tratamientoId: number, incluidoEnBase = false, origen?: string): FormTratamientoPlan {
    return {
      tratamientoId,
      multisesion: false,
      incluidoEnBase,
      origen,
      sesiones: [this.crearSesionPlanForm(true)]
    };
  }

  private crearSesionPlanForm(esPrimera: boolean): FormSesionPlan {
    return {
      fecha: esPrimera ? aISO(new Date()) : '',
      hora: '',
      zona: '',
      observaciones: ''
    };
  }

  private bloquesPara(localId: number, fecha: string): Bloque[] {
    this.disponibilidadTick();
    const local = LOCALES.find(item => item.id === localId);
    return fecha && local ? this.disponibilidad.bloques(fecha, local) : [];
  }

  private horaFormularioDisponible(fecha: string, hora: string): boolean {
    return this.bloquesPlanFormulario(fecha).some(bloque => bloque.inicio === hora && bloque.disponible);
  }

  private cuposFormularioSuficientes(sesiones: FormSesionPlan[]): boolean {
    const requeridos = new Map<string, number>();
    sesiones.forEach(sesion => {
      const clave = `${sesion.fecha}|${sesion.hora}`;
      requeridos.set(clave, (requeridos.get(clave) ?? 0) + 1);
    });

    return [...requeridos.entries()].every(([clave, cantidad]) => {
      const [fecha, hora] = clave.split('|');
      const bloque = this.bloquesPlanFormulario(fecha).find(item => item.inicio === hora);
      return !!bloque && bloque.disponible && cantidad <= bloque.libres;
    });
  }

  private recalcularPrecioNuevoPlan(): void {
    const extras = this.formTratamientosPlan()
      .filter(grupo => !grupo.incluidoEnBase)
      .reduce((acumulado, grupo) => acumulado + this.precioTratamiento(grupo.tratamientoId), 0);
    const total = Math.max(Number(this.formPrecioBase() || 0), 0) + extras;
    this.formPrecioTotal.set(total);
    this.formPagado.set(Math.min(Math.max(Number(this.formPagado() || 0), 0), total));
  }

  private claveEditorSesion(planId: number, numeroSesion: number): string {
    return `${planId}-${numeroSesion}`;
  }

  private todasLasSesiones(): SesionPlan[] {
    return this.planes.planes().flatMap(p => p.sesiones);
  }

  private normalizarTexto(valor: string): string {
    return valor.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }
}
