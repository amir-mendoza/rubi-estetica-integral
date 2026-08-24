import { Component, DestroyRef, OnDestroy, inject, signal } from '@angular/core';
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
    @if (visible()) {
      <div class="velo" [class.velo--saliendo]="saliendo()" aria-live="polite">
        <div class="velo__caja">
          <app-cargador-rueda [tamano]="86" [porcentaje]="porcentaje()" [etiqueta]="config().mensaje" />
          <p class="velo__mensaje">{{ config().mensaje }}</p>
          @if (config().mostrarPorcentaje) {
            <p class="velo__porcentaje">{{ porcentaje() }}%</p>
          }
          <span class="velo__barra"><i [style.width.%]="porcentaje()"></i></span>
        </div>
      </div>
    }
  `,
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
      display: grid; justify-items: center; gap: 14px;
      width: min(88%, 340px); text-align: center;
    }
    .velo__mensaje {
      margin: 0; color: var(--vino, #7d1f45);
      font-size: 1rem; letter-spacing: .06em; text-transform: uppercase;
    }
    .velo__porcentaje {
      margin: 0; color: var(--gris, #5f5560); font-size: .95rem;
      font-variant-numeric: tabular-nums;
    }
    .velo__barra {
      display: block; width: 100%; max-width: 100%; height: 4px;
      border-radius: 999px; overflow: hidden;
      background: color-mix(in srgb, var(--vino, #7d1f45) 14%, transparent);
    }
    .velo__barra i {
      display: block; height: 100%; border-radius: 999px;
      background: linear-gradient(90deg, var(--vino, #7d1f45), var(--fucsia, #c2185b));
      transition: width .25s ease;
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
