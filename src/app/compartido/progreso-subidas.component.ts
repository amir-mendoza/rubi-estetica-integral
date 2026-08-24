import { Component, inject, input } from '@angular/core';
import { CargadorRuedaComponent } from './cargador-rueda.component';
import { SubidasService } from './subidas.service';

/** Banner de progreso de las subidas del panel: porcentaje, barra y confirmación. */
@Component({
  selector: 'app-progreso-subidas',
  imports: [CargadorRuedaComponent],
  template: `
    @if (subidas.subidas().length) {
      <div class="subidas" [class.subidas--flotante]="flotante()" aria-live="polite">
        @for (s of subidas.subidas(); track s.id) {
          <div class="subida" [class.subida--listo]="s.estado === 'listo'" [class.subida--error]="s.estado === 'error'">
            @if (s.estado === 'cargando') {
              <app-cargador-rueda [tamano]="30" [porcentaje]="s.porcentaje" [etiqueta]="s.mensaje" />
            } @else {
              <span class="subida__icono">{{ s.estado === 'listo' ? '✓' : '!' }}</span>
            }
            <div class="subida__cuerpo">
              <div class="subida__linea">
                <strong>{{ s.mensaje }}</strong>
                <span>{{ s.porcentaje }}%</span>
              </div>
              <span class="subida__barra"><i [style.width.%]="s.porcentaje"></i></span>
              <span class="subida__archivo">{{ s.nombre }} · {{ s.tamanoMb }} MB</span>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .subidas { display: grid; gap: 10px; min-width: 0; }
    .subidas--flotante {
      position: fixed; z-index: 140; right: 3%; bottom: 3%;
      width: min(92%, 340px);
      animation: subidas-entrar .5s ease both;
    }
    .subidas--flotante .subida { box-shadow: 0 14px 38px rgba(70, 20, 45, .18); }
    @keyframes subidas-entrar { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
    .subida {
      display: flex; align-items: center; gap: 12px; min-width: 0;
      padding: 12px 3%; border: 1px solid var(--linea); border-radius: var(--radio-md, 14px);
      background: #fff;
    }
    .subida--listo { border-color: color-mix(in srgb, #2e7d32 40%, var(--linea)); }
    .subida--error { border-color: color-mix(in srgb, #c62828 45%, var(--linea)); }
    .subida__icono {
      flex: none; width: 30px; height: 30px; border-radius: 50%;
      display: grid; place-items: center; font-weight: 700; color: #fff;
      background: var(--vino, #7d1f45);
    }
    .subida--listo .subida__icono { background: #2e7d32; }
    .subida--error .subida__icono { background: #c62828; }
    .subida__cuerpo { display: grid; gap: 6px; min-width: 0; flex: 1 1 auto; }
    .subida__linea {
      display: flex; align-items: baseline; justify-content: space-between; gap: 10px;
      min-width: 0; font-size: .95rem;
    }
    .subida__linea strong { min-width: 0; overflow-wrap: anywhere; }
    .subida__linea span { font-variant-numeric: tabular-nums; color: var(--gris, #5f5560); }
    .subida__barra {
      display: block; width: 100%; max-width: 100%; height: 6px;
      border-radius: 999px; overflow: hidden;
      background: color-mix(in srgb, var(--vino, #7d1f45) 12%, transparent);
    }
    .subida__barra i {
      display: block; height: 100%; border-radius: 999px;
      background: linear-gradient(90deg, var(--vino, #7d1f45), var(--fucsia, #c2185b));
      transition: width .2s ease;
    }
    .subida--listo .subida__barra i { background: #2e7d32; }
    .subida__archivo { color: var(--gris-claro, #8b8189); font-size: .85rem; overflow-wrap: anywhere; }
  `]
})
export class ProgresoSubidasComponent {
  readonly subidas = inject(SubidasService);
  flotante = input(false);
}
