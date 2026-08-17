import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <span class="logo" [class.logo--claro]="claro" [class.logo--sm]="compacto">
      <img src="img/logo-rubi-oficial.png" alt="Rubí Estética Integral">
    </span>
  `,
  styles: [`
    .logo {
      display: inline-flex;
      align-items: center;
      width: 206px;
      height: 62px;
      line-height: 1;
    }
    .logo img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: contain;
      object-position: left center;
    }
    .logo--claro {
      width: 214px;
      height: 72px;
      padding: 8px;
      border-radius: var(--radio);
      background: #fff;
    }
    .logo--sm { width: 150px; height: 46px; }
  `]
})
export class LogoComponent {
  @Input() claro = false;
  @Input() compacto = false;
}
