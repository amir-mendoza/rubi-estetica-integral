import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <span class="logo" [class.logo--claro]="claro" [class.logo--sm]="compacto">
      <svg class="logo__marca" viewBox="0 0 40 48" aria-hidden="true">
        <path d="M20 3c7 0 11 4.6 11 10.4 0 6.2-4.9 9.2-9.6 11.4-3.6 1.7-6.2 3-6.2 5.6 0 2 1.7 3.4 3.9 3.4"
              fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M20 45c-6 0-10.6-3.6-10.6-8.6 0-4.4 3.3-7 7.3-8.9"
              fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        <circle cx="26.4" cy="12.4" r="2.1" fill="currentColor"/>
      </svg>
      <span class="logo__texto">
        <span class="logo__nombre">RUBÍ</span>
        <span class="logo__bajada">Estética Integral</span>
      </span>
    </span>
  `,
  styles: [`
    .logo {
      display: inline-flex; align-items: center; gap: 12px;
      color: var(--vino);
      line-height: 1;
    }
    .logo--claro { color: #fff; }
    .logo__marca { width: 34px; height: 41px; flex: none; }
    .logo__texto { display: flex; flex-direction: column; gap: 4px; }
    .logo__nombre {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 1.85rem; font-weight: 600; letter-spacing: .16em;
    }
    .logo__bajada {
      font-size: .55rem; letter-spacing: .34em; text-transform: uppercase;
      color: var(--magenta); font-weight: 500;
    }
    .logo--claro .logo__bajada { color: rgba(255,255,255,.72); }
    .logo--sm .logo__marca { width: 26px; height: 32px; }
    .logo--sm .logo__nombre { font-size: 1.35rem; }
    .logo--sm .logo__bajada { font-size: .48rem; letter-spacing: .28em; }
  `]
})
export class LogoComponent {
  @Input() claro = false;
  @Input() compacto = false;
}
