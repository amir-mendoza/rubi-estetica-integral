import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

const CLAVE_COOKIES = 'rubi.cookies-aceptadas';

@Component({
  selector: 'app-cookies-aviso',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (visible()) {
      <section class="cookies" aria-label="Aviso de cookies">
        <div>
          <strong>Usamos cookies necesarias</strong>
          <p>
            Guardamos preferencias básicas para sesión, carrito y reserva. No usamos cookies de publicidad en esta etapa.
            Revisa nuestra <a routerLink="/legal/privacidad">política de privacidad</a> y <a routerLink="/legal/cookies">política de cookies</a>.
          </p>
        </div>
        <button type="button" class="btn btn--primario btn--sm" (click)="aceptar()">Aceptar</button>
        <button type="button" class="cookies__cerrar" aria-label="Cerrar aviso de cookies" (click)="aceptar()">×</button>
      </section>
    }
  `,
  styles: [`
    .cookies {
      position: fixed;
      left: 50%;
      bottom: 18px;
      z-index: 120;
      width: min(940px, calc(100vw - 28px));
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto auto;
      gap: 18px;
      align-items: center;
      padding: 18px 20px;
      border: 1px solid rgba(176, 27, 114, .2);
      border-radius: var(--radio-lg);
      background: rgba(255, 255, 255, .96);
      box-shadow: 0 18px 44px rgba(42, 32, 40, .18);
      transform: translateX(-50%);
    }
    .cookies strong {
      display: block;
      color: var(--vino);
      margin-bottom: 2px;
    }
    .cookies p {
      margin: 0;
      font-size: .94rem;
      line-height: 1.45;
    }
    .cookies__cerrar {
      width: 34px;
      height: 34px;
      border: 1px solid var(--linea);
      border-radius: 50%;
      background: #fff;
      color: var(--gris);
      cursor: pointer;
      font-size: 1.25rem;
      line-height: 1;
    }
    .cookies__cerrar:hover {
      border-color: var(--magenta);
      color: var(--magenta);
    }
    @media (max-width: 680px) {
      .cookies {
        grid-template-columns: 1fr auto;
        align-items: start;
        bottom: 12px;
        padding: 16px;
      }
      .cookies .btn {
        grid-column: 1 / -1;
        width: 100%;
      }
      .cookies__cerrar {
        grid-column: 2;
        grid-row: 1;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CookiesAvisoComponent {
  visible = signal(!this.cookiesAceptadas());

  aceptar(): void {
    try {
      localStorage.setItem(CLAVE_COOKIES, 'si');
    } catch {
      // Si el navegador bloquea localStorage, solo se oculta durante esta visita.
    }
    this.visible.set(false);
  }

  private cookiesAceptadas(): boolean {
    try {
      return localStorage.getItem(CLAVE_COOKIES) === 'si';
    } catch {
      return false;
    }
  }
}
