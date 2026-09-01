import { AfterViewInit, Component, ElementRef, HostListener, Input, inject, ChangeDetectionStrategy } from '@angular/core';
import { MarcaService } from './marca.service';

const LOGO_CLARO = 'img/marca-rubi-logo-blanco.png';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <span class="logo" [class.logo--claro]="claro" [class.logo--sm]="compacto">
      <img [src]="logoSrc()" alt="Rubí Estética Integral">
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .logo {
      display: inline-flex;
      align-items: center;
      width: 142px;
      height: 62px;
      line-height: 1;
    }
    .logo img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: contain;
    }
    .logo--claro {
      width: 152px;
      height: 68px;
      padding: 0;
    }
    .logo--sm { width: 150px; height: 46px; overflow: visible; }
    .logo--sm img {
      width: 100%;
      height: 100%;
      max-width: 100%;
      object-fit: contain;
    }
  `]
})
export class LogoComponent {
  marca = inject(MarcaService);
  private host = inject(ElementRef<HTMLElement>);

  @Input() claro = false;
  @Input() compacto = false;
  @Input() panel = false;
  fondoOscuro = false;

  ngAfterViewInit(): void {
    this.actualizarFondo();
  }

  @HostListener('window:resize')
  actualizarFondo(): void {
    this.fondoOscuro = this.detectarFondoOscuro();
  }

  logoSrc(): string {
    if (this.panel) {
      return this.marca.logoAdmin();
    }
    return this.claro || this.fondoOscuro ? LOGO_CLARO : this.marca.logoSitio();
  }

  private detectarFondoOscuro(): boolean {
    if (this.claro || this.panel) {
      return this.claro || this.panel;
    }

    let elemento = this.host.nativeElement.parentElement;
    while (elemento) {
      const color = getComputedStyle(elemento).backgroundColor;
      if (this.colorVisible(color)) {
        return this.esColorOscuro(color);
      }
      elemento = elemento.parentElement;
    }

    return this.esColorOscuro(getComputedStyle(document.body).backgroundColor);
  }

  private colorVisible(color: string): boolean {
    if (!color || color === 'transparent') {
      return false;
    }
    const valores = color.match(/[\d.]+/g)?.map(Number) ?? [];
    return valores.length < 4 || valores[3] > 0.05;
  }

  private esColorOscuro(color: string): boolean {
    const [r = 255, g = 255, b = 255] = color.match(/[\d.]+/g)?.map(Number) ?? [];
    return (r * 299 + g * 587 + b * 114) / 1000 < 150;
  }
}
