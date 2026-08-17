import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LogoComponent } from '../../compartido/logo.component';
import { SesionService } from '../../compartido/sesion.service';

interface Seccion {
  ruta: string;
  texto: string;
  icono: string;
  grupo: 'Operación' | 'Catálogo' | 'Finanzas' | 'Sistema';
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LogoComponent],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  readonly sesion = inject(SesionService);
  private router = inject(Router);

  colapsado = signal(false);
  rol = signal<'Administrador' | 'Recepcionista' | 'Especialista'>('Administrador');
  ahora = signal(new Date());
  private reloj?: ReturnType<typeof setInterval>;

  secciones: Seccion[] = [
    { ruta: '/admin/dashboard', texto: 'Dashboard', icono: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z', grupo: 'Operación' },
    { ruta: '/admin/calendario', texto: 'Calendario / Citas', icono: 'M7 2v3M17 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', grupo: 'Operación' },
    { ruta: '/admin/pacientes', texto: 'Pacientes', icono: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0', grupo: 'Operación' },
    { ruta: '/admin/sesiones', texto: 'Planes de sesiones', icono: 'M4 6h16M4 12h10M4 18h7M17 15l2 2 3-4', grupo: 'Operación' },
    { ruta: '/admin/pedidos', texto: 'Pedidos', icono: 'M4 5h2l2.2 10.5h9.1L20 8H7M10 19a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z', grupo: 'Operación' },
    { ruta: '/admin/promociones', texto: 'Promociones', icono: 'M20.6 12.6 12 21.2 3.4 12.6a4 4 0 0 1 0-5.7 4 4 0 0 1 5.7 0L12 9.8l2.9-2.9a4 4 0 0 1 5.7 5.7z', grupo: 'Catálogo' },
    { ruta: '/admin/tratamientos', texto: 'Tratamientos', icono: 'M12 3v18M5 8l14 8M19 8L5 16', grupo: 'Catálogo' },
    { ruta: '/admin/productos', texto: 'Productos', icono: 'M4 7l8-4 8 4v10l-8 4-8-4V7zm8 4l8-4m-8 4L4 7m8 4v10', grupo: 'Catálogo' },
    { ruta: '/admin/especialistas', texto: 'Especialistas', icono: 'M16 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 21v-2a4 4 0 0 1 4-4h8M6 7a3 3 0 1 0 0 6', grupo: 'Catálogo' },
    { ruta: '/admin/locales', texto: 'Locales y cabinas', icono: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6', grupo: 'Catálogo' },
    { ruta: '/admin/pagos', texto: 'Pagos', icono: 'M2 7h20v10H2zM2 11h20M6 15h4', grupo: 'Finanzas' },
    { ruta: '/admin/reportes', texto: 'Reportes', icono: 'M4 20V10M10 20V4M16 20v-7M22 20H2', grupo: 'Finanzas' },
    { ruta: '/admin/configuracion', texto: 'Configuración', icono: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2 2 2 0 1 1-4 0 1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 4.6 15a2 2 0 1 1 0-4 1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2 2 2 0 1 1 4 0 1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9 2 2 0 1 1 0 4z', grupo: 'Sistema' }
  ];

  grupos: Seccion['grupo'][] = ['Operación', 'Catálogo', 'Finanzas', 'Sistema'];

  seccionesDe(grupo: Seccion['grupo']): Seccion[] {
    return this.secciones.filter(s => s.grupo === grupo);
  }

  ngOnInit(): void {
    this.reloj = setInterval(() => this.ahora.set(new Date()), 1000);
  }

  ngOnDestroy(): void {
    if (this.reloj) { clearInterval(this.reloj); }
  }

  fechaActual(): string {
    return new Intl.DateTimeFormat('es-PE', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(this.ahora());
  }

  horaActual(): string {
    return new Intl.DateTimeFormat('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(this.ahora());
  }

  cerrarSesion(): void {
    this.sesion.salir();
    this.router.navigateByUrl('/ingresar');
  }
}
