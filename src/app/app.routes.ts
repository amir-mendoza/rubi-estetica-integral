import { Routes } from '@angular/router';
import { adminGuard } from './compartido/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./publico/publico-layout.component').then(m => m.PublicoLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./publico/inicio.component').then(m => m.InicioComponent) },
      { path: 'nosotros', loadComponent: () => import('./publico/nosotros.component').then(m => m.NosotrosComponent) },
      { path: 'tratamientos', loadComponent: () => import('./publico/tratamientos.component').then(m => m.TratamientosComponent) },
      { path: 'tratamientos/:id', loadComponent: () => import('./publico/tratamiento-detalle.component').then(m => m.TratamientoDetalleComponent) },
      { path: 'especialistas', loadComponent: () => import('./publico/especialistas.component').then(m => m.EspecialistasComponent) },
      { path: 'productos', loadComponent: () => import('./publico/productos.component').then(m => m.ProductosComponent) },
      { path: 'productos/:id', loadComponent: () => import('./publico/producto-detalle.component').then(m => m.ProductoDetalleComponent) },
      { path: 'carrito', loadComponent: () => import('./publico/carrito.component').then(m => m.CarritoComponent) },
      { path: 'reservar', loadComponent: () => import('./publico/reservar.component').then(m => m.ReservarComponent) },
      { path: 'locales', loadComponent: () => import('./publico/locales.component').then(m => m.LocalesComponent) },
      { path: 'contacto', loadComponent: () => import('./publico/contacto.component').then(m => m.ContactoComponent) },
      { path: 'ingresar', loadComponent: () => import('./publico/ingresar.component').then(m => m.IngresarComponent) },
      { path: 'registro', loadComponent: () => import('./publico/registro.component').then(m => m.RegistroComponent) },
      { path: 'mi-cuenta', loadComponent: () => import('./publico/mi-cuenta.component').then(m => m.MiCuentaComponent) }
    ]
  },
  {
    path: 'admin',
    canMatch: [adminGuard],
    loadComponent: () => import('./admin/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./admin/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'calendario', loadComponent: () => import('./admin/calendario.component').then(m => m.CalendarioComponent) },
      { path: 'pacientes', loadComponent: () => import('./admin/pacientes.component').then(m => m.PacientesComponent) },
      { path: 'sesiones', loadComponent: () => import('./admin/sesiones.component').then(m => m.SesionesComponent) },
      { path: 'promociones', loadComponent: () => import('./admin/promociones-admin.component').then(m => m.PromocionesAdminComponent) },
      { path: 'productos', loadComponent: () => import('./admin/productos-admin.component').then(m => m.ProductosAdminComponent) },
      { path: 'tratamientos', loadComponent: () => import('./admin/tratamientos-admin.component').then(m => m.TratamientosAdminComponent) },
      { path: 'especialistas', loadComponent: () => import('./admin/especialistas-admin.component').then(m => m.EspecialistasAdminComponent) },
      { path: 'locales', loadComponent: () => import('./admin/locales-admin.component').then(m => m.LocalesAdminComponent) },
      { path: 'pagos', loadComponent: () => import('./admin/pagos.component').then(m => m.PagosComponent) },
      { path: 'pedidos', loadComponent: () => import('./admin/pedidos.component').then(m => m.PedidosComponent) },
      { path: 'reportes', loadComponent: () => import('./admin/reportes.component').then(m => m.ReportesComponent) },
      { path: 'configuracion', loadComponent: () => import('./admin/configuracion.component').then(m => m.ConfiguracionComponent) }
    ]
  },
  { path: '**', redirectTo: '' }
];
