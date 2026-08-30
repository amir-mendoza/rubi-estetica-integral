import { Component, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { RedesService } from './redes.service';

@Component({
  selector: 'app-redes-enlaces',
  standalone: true,
  template: `
    @if (redes.activas().length) {
      <ul class="redes" [class.redes--claro]="claro()" [attr.aria-label]="'Redes sociales de Rubí Estética Integral'">
        @for (r of redes.activas(); track r.red) {
          <li>
            <a [href]="r.url" target="_blank" rel="noopener" [attr.aria-label]="r.nombre" [title]="r.nombre">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                @switch (r.red) {
                  @case ('instagram') {
                    <path d="M12 2.2c3.2 0 3.58.01 4.85.07 1.17.05 1.96.24 2.42.42.6.23 1.04.51 1.5.97.46.46.74.9.97 1.5.18.46.37 1.25.42 2.42.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.24 1.96-.42 2.42-.23.6-.51 1.04-.97 1.5-.46.46-.9.74-1.5.97-.46.18-1.25.37-2.42.42-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.96-.24-2.42-.42-.6-.23-1.04-.51-1.5-.97a4.1 4.1 0 0 1-.97-1.5c-.18-.46-.37-1.25-.42-2.42C2.21 15.58 2.2 15.2 2.2 12s.01-3.58.07-4.85c.05-1.17.24-1.96.42-2.42.23-.6.51-1.04.97-1.5.46-.46.9-.74 1.5-.97.46-.18 1.25-.37 2.42-.42C8.42 2.21 8.8 2.2 12 2.2zm0 1.8c-3.14 0-3.48.01-4.71.07-.94.04-1.45.2-1.79.33-.45.17-.77.38-1.11.72-.34.34-.55.66-.72 1.11-.13.34-.29.85-.33 1.79C3.28 9.25 3.27 9.6 3.27 12s.01 2.75.07 3.98c.04.94.2 1.45.33 1.79.17.45.38.77.72 1.11.34.34.66.55 1.11.72.34.13.85.29 1.79.33 1.23.06 1.57.07 4.71.07s3.48-.01 4.71-.07c.94-.04 1.45-.2 1.79-.33.45-.17.77-.38 1.11-.72.34-.34.55-.66.72-1.11.13-.34.29-.85.33-1.79.06-1.23.07-1.58.07-3.98s-.01-2.75-.07-3.98c-.04-.94-.2-1.45-.33-1.79a2.9 2.9 0 0 0-.72-1.11 2.9 2.9 0 0 0-1.11-.72c-.34-.13-.85-.29-1.79-.33-1.23-.06-1.57-.07-4.71-.07zm0 3.06a5.94 5.94 0 1 1 0 11.88 5.94 5.94 0 0 1 0-11.88zm0 1.8a4.14 4.14 0 1 0 0 8.28 4.14 4.14 0 0 0 0-8.28zm6.16-2.13a1.35 1.35 0 1 1-2.7 0 1.35 1.35 0 0 1 2.7 0z"/>
                  }
                  @case ('tiktok') {
                    <path d="M16.6 2h-3.1v13.2a2.6 2.6 0 1 1-2.6-2.6c.24 0 .47.03.7.1V9.5a5.75 5.75 0 1 0 5 5.7V8.6a6.3 6.3 0 0 0 3.6 1.14V6.6a3.6 3.6 0 0 1-3.6-3.6V2z"/>
                  }
                  @case ('facebook') {
                    <path d="M13.5 21.9v-8.2h2.8l.42-3.25H13.5V8.37c0-.94.26-1.58 1.6-1.58h1.72V3.88c-.3-.04-1.33-.13-2.53-.13-2.5 0-4.21 1.53-4.21 4.33v2.42H7.26v3.25h2.82v8.15h3.42z"/>
                  }
                  @case ('whatsapp') {
                    <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.48 1.34 4.99L2 22l5.2-1.36a9.9 9.9 0 0 0 4.84 1.24h.01c5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2zm5.8 14.06c-.24.68-1.42 1.32-1.95 1.36-.5.05-.99.23-3.35-.7-2.82-1.11-4.6-3.98-4.74-4.17-.14-.19-1.13-1.5-1.13-2.86s.71-2.03.96-2.31c.25-.28.55-.35.73-.35.18 0 .37 0 .53.01.17.01.4-.06.62.48.24.57.8 1.97.87 2.11.07.14.12.31.02.5-.09.19-.14.31-.28.47-.14.16-.29.36-.42.48-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.16-.19.69-.8.87-1.08.18-.28.37-.23.62-.14.25.09 1.6.76 1.87.9.28.14.46.21.53.33.07.12.07.68-.17 1.36z"/>
                  }
                }
              </svg>
              @if (conTexto()) { <span class="redes__texto">{{ r.nombre }}</span> }
            </a>
          </li>
        }
      </ul>
    }
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .redes {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      list-style: none;
      margin: 0;
      padding: 0;
      min-width: 0;
    }
    .redes a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      min-width: 42px;
      min-height: 42px;
      padding: 0 12px;
      border: 1px solid var(--linea);
      border-radius: 999px;
      color: var(--vino);
      background: #fff;
      text-decoration: none;
      transition: transform .3s ease, color .3s ease, border-color .3s ease, background .3s ease;
    }
    .redes a:hover {
      transform: translateY(-3px);
      color: var(--magenta);
      border-color: var(--magenta-300);
    }
    .redes__texto { font-size: .88rem; letter-spacing: .04em; }

    .redes--claro a {
      border-color: rgba(255, 255, 255, .34);
      background: rgba(255, 255, 255, .1);
      color: #fff;
      backdrop-filter: blur(2px);
    }
    .redes--claro a:hover {
      background: rgba(255, 255, 255, .2);
      border-color: #fff;
      color: #fff;
    }
  `]
})
export class RedesEnlacesComponent {
  redes = inject(RedesService);
  /** Variante para fondos oscuros (portada y pie). */
  claro = input(false);
  /** Muestra el nombre de la red junto al icono. */
  conTexto = input(false);
}
