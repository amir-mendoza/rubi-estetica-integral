import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SesionService } from '../../compartido/sesion.service';
import {
  CITAS, formatoFechaLarga, localPorId, nombreEspecialista, PEDIDOS, tratamientoPorId
} from '../../data/datos';
import { Cita, Pedido } from '../../data/modelos';

@Component({
  selector: 'app-mi-cuenta',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="cabecera-pagina">
      <div class="contenedor">
        <div class="miga"><a routerLink="/">Inicio</a> / Mi cuenta</div>
        <h1>Mi cuenta</h1>
        @if (usuario()) {
          <p>Hola {{ usuario()!.nombre }}, aquí puedes revisar tus datos, tus citas y tus pedidos.</p>
        } @else {
          <p>Necesitas iniciar sesión para ver esta sección.</p>
        }
      </div>
    </section>

    <section class="seccion">
      <div class="contenedor">
        @if (!usuario()) {
          <div class="panel" style="max-width:520px">
            <h3>Sesión no iniciada</h3>
            <p class="campo__ayuda" style="margin:12px 0 22px">
              Ingresa con tu cuenta para ver tus citas y pedidos.
            </p>
            <a routerLink="/ingresar" class="btn btn--primario btn--sm">Ingresar</a>
          </div>
        } @else {
          <div class="cuenta">
            <aside class="panel">
              <div class="perfil">
                <span class="perfil__avatar">{{ sesion.iniciales() }}</span>
                <div>
                  <strong>{{ sesion.nombreCompleto() }}</strong>
                  <span class="chip chip--neutro">{{ usuario()!.rol }}</span>
                </div>
              </div>
              <div class="dato"><span class="dato__label">DNI</span><span class="dato__valor">{{ usuario()!.dni }}</span></div>
              <div class="dato"><span class="dato__label">Celular</span><span class="dato__valor">{{ usuario()!.celular }}</span></div>
              <div class="dato"><span class="dato__label">Correo</span><span class="dato__valor">{{ usuario()!.correo }}</span></div>

              <div class="perfil__acciones">
                <a routerLink="/reservar" class="btn btn--primario btn--sm btn--bloque">Reservar una cita</a>
                @if (sesion.esAdmin()) {
                  <a routerLink="/admin/dashboard" class="btn btn--linea btn--sm btn--bloque" style="margin-top:10px">
                    Ir al panel administrativo
                  </a>
                }
                <button class="btn btn--linea btn--sm btn--bloque" style="margin-top:10px" (click)="salir()">
                  Cerrar sesión
                </button>
              </div>
            </aside>

            <div class="cuenta__contenido">
              <div class="panel">
                <div class="panel__titulo"><h3>Mis citas</h3></div>
                @if (citas().length === 0) {
                  <p class="campo__ayuda">Todavía no tienes citas registradas en el prototipo.</p>
                } @else {
                  @for (c of citas(); track c.id) {
                    <article class="fila">
                      <div>
                        <strong>{{ tratamiento(c) }}</strong>
                        <span>{{ formatoFecha(c.fecha) }} · {{ c.horaInicio }} — {{ c.horaFin }}</span>
                        <span>{{ especialista(c) }} · {{ local(c) }}</span>
                      </div>
                      <div class="fila__estado">
                        <span [class]="'chip ' + claseEstado(c.estadoPago)">{{ c.estadoPago }}</span>
                        <strong>S/ {{ c.montoTotal }}</strong>
                      </div>
                    </article>
                  }
                }
              </div>

              <div class="panel" style="margin-top:24px">
                <div class="panel__titulo"><h3>Mis pedidos</h3></div>
                <p class="campo__ayuda" style="margin-bottom:16px">
                  Los productos se entregan únicamente con recojo en local.
                </p>
                @if (pedidos().length === 0) {
                  <p class="campo__ayuda">Todavía no tienes pedidos registrados.</p>
                } @else {
                  @for (p of pedidos(); track p.id) {
                    <article class="fila">
                      <div>
                        <strong>{{ p.codigo }}</strong>
                        <span>{{ formatoFecha(p.fecha) }} · {{ p.entrega }}</span>
                      </div>
                      <div class="fila__estado">
                        <span class="chip chip--info">{{ p.estado }}</span>
                        <strong>S/ {{ p.total }}</strong>
                      </div>
                    </article>
                  }
                }
              </div>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.Default,
  styles: [`
    .cuenta { display: grid; grid-template-columns: minmax(min(100%, 260px), 28%) minmax(0, 1fr); gap: 32px; align-items: start; }
    .perfil { display: flex; gap: 14px; align-items: center; padding-bottom: 20px; border-bottom: 1px solid var(--linea); }
    .perfil__avatar {
      display: inline-flex; align-items: center; justify-content: center;
      width: 52px; height: 52px; border-radius: 50%;
      background: var(--rosa); color: var(--vino); font-weight: 600; letter-spacing: .04em;
    }
    .perfil strong { display: block; margin-bottom: 6px; font-weight: 500; }
    .perfil__acciones { margin-top: 22px; }
    .dato { display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px dashed var(--linea); }
    .fila {
      display: flex; justify-content: space-between; gap: 18px; align-items: center;
      padding: 14px 0; border-bottom: 1px dashed var(--linea);
    }
    .fila:last-child { border-bottom: none; }
    .fila strong { display: block; font-weight: 500; font-size: 1rem; }
    .fila span { display: block; font-size: .9rem; color: var(--gris); }
    .fila__estado { text-align: right; display: grid; gap: 8px; justify-items: end; }
    @media (max-width: 900px) { .cuenta { grid-template-columns: 1fr; } }
  `]
})
export class MiCuentaComponent {
  readonly sesion = inject(SesionService);
  private router = inject(Router);

  readonly usuario = this.sesion.usuario;

  readonly citas = computed<Cita[]>(() => {
    const u = this.usuario();
    if (!u || u.pacienteId === undefined) {
      return [];
    }
    return CITAS.filter(c => c.pacienteId === u.pacienteId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  });

  readonly pedidos = computed<Pedido[]>(() => {
    const u = this.usuario();
    if (!u) {
      return [];
    }
    const nombre = `${u.nombre} ${u.apellido}`.toLowerCase();
    return PEDIDOS.filter(p => (p.dni && p.dni === u.dni) || p.cliente.toLowerCase() === nombre);
  });

  formatoFecha(iso: string): string {
    return formatoFechaLarga(iso);
  }

  tratamiento(c: Cita): string {
    return tratamientoPorId(c.tratamientoId)?.nombre ?? '—';
  }

  especialista(c: Cita): string {
    return nombreEspecialista(c.especialistaId);
  }

  local(c: Cita): string {
    return localPorId(c.localId)?.nombre ?? '—';
  }

  claseEstado(estado: string): string {
    if (estado === 'Pagado') {
      return 'chip--ok';
    }
    if (estado === 'Pendiente') {
      return 'chip--alerta';
    }
    return 'chip--neutro';
  }

  salir(): void {
    this.sesion.salir();
    this.router.navigateByUrl('/');
  }
}
