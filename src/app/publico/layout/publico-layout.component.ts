import { AfterViewInit, Component, DestroyRef, ElementRef, HostListener, OnDestroy, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LogoComponent } from '../../compartido/logo.component';
import { SesionService } from '../../compartido/sesion.service';
import { CarritoService } from '../../compartido/carrito.service';
import { FondoWebComponent } from '../../compartido/fondo-web.component';
import { RedesEnlacesComponent } from '../../compartido/redes-enlaces.component';
import { RedesService } from '../../compartido/redes.service';
import { CargadorRutaComponent } from '../../compartido/cargador-ruta.component';
import { LOCALES } from '../../data/datos';
import { ConfiguracionPanelService } from '../../compartido/configuracion-panel.service';

@Component({
  selector: 'app-publico-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent, FondoWebComponent, RedesEnlacesComponent, CargadorRutaComponent],
  templateUrl: './publico-layout.component.html',
  styleUrl: './publico-layout.component.scss'
})
export class PublicoLayoutComponent implements AfterViewInit, OnDestroy {
  readonly sesion = inject(SesionService);
  readonly carrito = inject(CarritoService);
  readonly redes = inject(RedesService);
  readonly configPanel = inject(ConfiguracionPanelService);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private observadorAnimaciones?: IntersectionObserver;
  locales = computed(() => this.configPanel.combinarLocalesConHorarios(LOCALES));
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

  ngAfterViewInit(): void {
    this.prepararAnimaciones();
    this.router.events
      .pipe(
        filter(evento => evento instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => setTimeout(() => this.prepararAnimaciones(), 0));
  }

  ngOnDestroy(): void {
    this.observadorAnimaciones?.disconnect();
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
  }

  private prepararAnimaciones(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) { return; }

    this.observadorAnimaciones?.disconnect();
    this.observadorAnimaciones = new IntersectionObserver((entradas) => {
      entradas.forEach(entrada => {
        entrada.target.classList.toggle('animar-scroll--visible', entrada.isIntersecting);
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -10% 0px'
    });

    const selectores = [
      '.cabecera-pagina .contenedor',
      '.portada__contenido > *',
      '.encabezado-seccion',
      '.grid > *',
      '.pasos__intro',
      '.paso',
      '.detalle__imagen',
      '.detalle__grid > div',
      '.detalle__contenido > *',
      '.detalle-prod__imagen',
      '.detalle-prod > div',
      '.detalle-prod-info__grid > *',
      '.panel',
      '.cta__contenido',
      '.seccion .contenedor > form',
      '.seccion .contenedor > article',
      '.seccion .contenedor > aside',
      '.pie__grid > *'
    ].join(',');

    const raiz = this.host.nativeElement as HTMLElement;
    const elementos = Array.from(raiz.querySelectorAll(selectores)) as HTMLElement[];
    const unicos = elementos.filter((elemento, indice) => elementos.indexOf(elemento) === indice);

    unicos.forEach((elemento, indice) => {
      elemento.classList.remove(
        'animar-scroll--visible',
        'animar-scroll--izquierda',
        'animar-scroll--derecha',
        'animar-scroll--zoom',
        'animar-scroll--giro',
        'animar-scroll--filete'
      );
      elemento.classList.add('animar-scroll');
      elemento.style.setProperty('--anim-delay', `${Math.min((indice % 4) * 140, 420)}ms`);

      if (elemento.classList.contains('detalle__imagen') || elemento.classList.contains('detalle-prod__imagen')) {
        elemento.classList.add('animar-scroll--zoom');
      } else if (elemento.classList.contains('paso')) {
        elemento.classList.add('animar-scroll--giro');
      } else if (indice % 3 === 0) {
        elemento.classList.add('animar-scroll--izquierda');
      } else if (indice % 3 === 2) {
        elemento.classList.add('animar-scroll--derecha');
      }

      this.observadorAnimaciones?.observe(elemento);
    });
  }
}
