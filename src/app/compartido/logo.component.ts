import { Component, Input, inject, ChangeDetectionStrategy } from '@angular/core';
import { MarcaService } from './marca.service';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <span class="logo" [class.logo--claro]="claro" [class.logo--sm]="compacto">
      <img [src]="panel ? marca.logoAdmin() : marca.logoSitio()" alt="Rubí Estética Integral">
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
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
    }
    .logo--sm { width: 150px; height: 46px; }
    .logo--sm img { object-position: center; }
  `]
})
export class LogoComponent {
  marca = inject(MarcaService);
  @Input() claro = false;
  @Input() compacto = false;
  @Input() panel = false;
}
