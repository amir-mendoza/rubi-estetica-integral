import { Component, DestroyRef, OnDestroy, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CargadorService } from './cargador.service';
import { CargadorRuedaComponent } from './cargador-rueda.component';

/**
 * Velo de carga entre páginas: aparece al iniciar la navegación y avanza hasta
 * 100 % cuando la vista ya está lista, evitando la sensación de página trabada.
 */
@Component({
  selector: 'app-cargador-ruta',
  imports: [CargadorRuedaComponent],
  template: `
    @if (config().activo && visible()) {
      <div class="velo" [class.velo--saliendo]="saliendo()" aria-live="polite">
        <div
          class="velo__caja"
          [style.--velo-tam.px]="tamanoReal()"
          [style.--velo-escala]="escalaReal()"
        >
          <app-cargador-rueda [tamano]="tamanoReal()" [porcentaje]="porcentaje()" [etiqueta]="config().mensaje" />
          <p class="velo__mensaje">{{ config().mensaje }}</p>
          @if (config().mostrarPorcentaje) {
            <p class="velo__porcentaje">{{ porcentaje() }}%</p>
          }
          <span class="velo__barra"><i [style.width.%]="porcentaje()"></i></span>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .velo {
      position: fixed; inset: 0; z-index: 120;
      display: grid; place-items: center;
      background: color-mix(in srgb, var(--crema, #fff7f2) 96%, #fff);
      backdrop-filter: blur(6px);
      animation: velo-entrar .35s ease both;
    }
    .velo--saliendo { animation: velo-salir .4s ease both; }
    .velo__caja {
      display: grid;
      justify-items: center;
      gap: clamp(8px, calc(14px * var(--velo-escala, 1)), 18px);
      width: min(88%, calc(250px + (120px * var(--velo-escala, 1))));
      text-align: center;
    }
    .velo__mensaje {
      margin: 0; color: var(--vino, #7d1f45);
      font-size: clamp(.78rem, calc(1rem * var(--velo-escala, 1)), 1.08rem);
      letter-spacing: .06em; text-transform: uppercase;
      line-height: 1.25;
    }
    .velo__porcentaje {
      margin: 0; color: var(--gris, #5f5560);
      font-size: clamp(.78rem, calc(.94rem * var(--velo-escala, 1)), 1rem);
      font-variant-numeric: tabular-nums;
      line-height: 1.2;
    }
    .velo__barra {
      display: block;
      width: min(100%, calc(180px + (120px * var(--velo-escala, 1))));
      max-width: 100%;
      height: clamp(4px, calc(5px * var(--velo-escala, 1)), 7px);
      border-radius: 999px; overflow: hidden;
      background: color-mix(in srgb, var(--vino, #7d1f45) 14%, transparent);
    }
    .velo__barra i {
      display: block; height: 100%; border-radius: 999px;
      background: linear-gradient(90deg, var(--vino, #7d1f45), var(--fucsia, #c2185b));
      transition: width .25s ease;
    }
    @media (max-width: 640px) {
      .velo__caja { gap: 12px; }
    }
    @keyframes velo-entrar { from { opacity: 0; } to { opacity: 1; } }
    @keyframes velo-salir { to { opacity: 0; visibility: hidden; } }
  `]
})
export class CargadorRutaComponent implements OnDestroy {
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private cargador = inject(CargadorService);

  visible = signal(false);
  saliendo = signal(false);
  porcentaje = signal(0);
  config = this.cargador.config;

  private avance?: ReturnType<typeof setInterval>;
  private cierre?: ReturnType<typeof setTimeout>;
  private inicio = 0;

  tamanoReal(): number {
    const base = this.config().tamanoPx || 72;
    return Math.max(48, Math.min(base, 96));
  }

  escalaReal(): number {
    return Math.max(.76, Math.min(this.tamanoReal() / 72, 1.2));
  }

  constructor() {
    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(evento => {
        if (evento instanceof NavigationStart) {
          this.abrir();
        } else if (
          evento instanceof NavigationEnd ||
          evento instanceof NavigationCancel ||
          evento instanceof NavigationError
        ) {
          this.completar();
        }
      });
  }

  ngOnDestroy(): void {
    this.limpiar();
  }

  private abrir(): void {
    if (!this.config().activo) { return; }
    this.limpiar();
    this.inicio = Date.now();
    this.porcentaje.set(8);
    this.saliendo.set(false);
    this.visible.set(true);

    // Avance simulado: sube rápido al principio y se frena cerca del 90 %
    // hasta que la ruta termine de cargar su código y sus datos.
    this.avance = setInterval(() => {
      this.porcentaje.update(v => (v >= 90 ? 90 : v + Math.max(1, Math.round((90 - v) / 6))));
    }, 110);
  }

  private completar(): void {
    if (!this.visible()) { return; }

    clearInterval(this.avance);
    this.porcentaje.set(100);

    const transcurrido = Date.now() - this.inicio;
    const espera = Math.max(this.config().minimoMs - transcurrido, 180);

    this.cierre = setTimeout(() => {
      this.saliendo.set(true);
      this.cierre = setTimeout(() => {
        this.visible.set(false);
        this.saliendo.set(false);
        this.porcentaje.set(0);
      }, 380);
    }, espera);
  }

  private limpiar(): void {
    clearInterval(this.avance);
    clearTimeout(this.cierre);
  }
}
