import { Component, HostListener, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LogoComponent } from '../compartido/logo.component';
import { SesionService } from '../compartido/sesion.service';
import { LOCALES } from '../data/datos';

@Component({
  selector: 'app-publico-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent],
  templateUrl: './publico-layout.component.html',
  styleUrl: './publico-layout.component.scss'
})
export class PublicoLayoutComponent {
  readonly sesion = inject(SesionService);
  locales = LOCALES;
  compacto = false;
  menuAbierto = false;
  anio = new Date().getFullYear();

  enlaces = [
    { ruta: '/', texto: 'Inicio', exacto: true },
    { ruta: '/nosotros', texto: 'Nosotros', exacto: false },
    { ruta: '/tratamientos', texto: 'Tratamientos', exacto: false },
    { ruta: '/especialistas', texto: 'Especialistas', exacto: false },
    { ruta: '/productos', texto: 'Productos', exacto: false },
    { ruta: '/locales', texto: 'Locales', exacto: false },
    { ruta: '/contacto', texto: 'Contacto', exacto: false }
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.compacto = window.scrollY > 40;
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }
}
