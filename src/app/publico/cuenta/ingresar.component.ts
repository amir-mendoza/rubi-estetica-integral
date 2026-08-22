import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SesionService } from '../../compartido/sesion.service';

@Component({
  selector: 'app-ingresar',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <section class="cabecera-pagina">
      <div class="contenedor">
        <div class="miga"><a routerLink="/">Inicio</a> / Ingresar</div>
        <h1>Acceso a tu cuenta</h1>
        <p>Ingresa para reservar más rápido, revisar tus citas y tus pedidos de recojo en local.</p>
      </div>
    </section>

    <section class="seccion">
      <div class="contenedor acceso">
        <div class="panel">
          <h3>Iniciar sesión</h3>
          <p class="campo__ayuda" style="margin-bottom:24px">
            Ingresa con tu correo y contraseña. Las cuentas administrativas usan el mismo formulario
            y acceden al panel interno.
          </p>

          @if (error()) {
            <div class="aviso aviso--error" style="margin-bottom:20px">{{ error() }}</div>
          }

          <div class="campo">
            <label>Correo electrónico</label>
            <input type="email" [(ngModel)]="correo" autocomplete="username" placeholder="correo@ejemplo.com">
          </div>
          <div class="campo">
            <label>Contraseña</label>
            <input type="password" [(ngModel)]="clave" autocomplete="current-password" placeholder="••••••••">
          </div>

          <button class="btn btn--primario btn--bloque" [disabled]="!completo()" (click)="ingresar()">
            Ingresar
          </button>

          <p class="acceso__pie">
            ¿No tienes cuenta? <a routerLink="/registro">Crear una cuenta</a>
          </p>
        </div>

        <aside class="panel panel--suave">
          <h4>Cuentas de demostración</h4>
          <p class="campo__ayuda" style="margin-bottom:18px">
            Este prototipo no realiza autenticación real ni guarda datos: las cuentas viven en memoria
            y se reinician al cerrar el navegador.
          </p>

          <div class="demo">
            <span class="eyebrow">Administración</span>
            <strong>admin&#64;rubiestetica.pe</strong>
            <span>Contraseña: rubi2026</span>
            <button class="btn btn--linea btn--sm" (click)="usarDemo('admin@rubiestetica.pe', 'rubi2026')">
              Usar esta cuenta
            </button>
          </div>

          <div class="demo">
            <span class="eyebrow">Paciente registrada</span>
            <strong>maria.lopez&#64;gmail.com</strong>
            <span>Contraseña: maria123</span>
            <button class="btn btn--linea btn--sm" (click)="usarDemo('maria.lopez@gmail.com', 'maria123')">
              Usar esta cuenta
            </button>
          </div>

          <p class="campo__ayuda">
            Con la cuenta de paciente, el formulario de reserva se completa automáticamente con sus datos.
          </p>
        </aside>
      </div>
    </section>
  `,
  styles: [`
    .acceso { display: grid; grid-template-columns: 1.1fr 1fr; gap: 36px; align-items: start; max-width: 940px; }
    .panel--suave { background: var(--rosa-50); }
    .acceso__pie { margin: 22px 0 0; font-size: .94rem; color: var(--gris); text-align: center; }
    .acceso__pie a { color: var(--magenta); font-weight: 500; }
    .demo {
      display: grid; gap: 6px; padding: 16px 0;
      border-bottom: 1px dashed var(--linea); font-size: .9rem; color: var(--gris);
    }
    .demo strong { color: var(--tinta); font-weight: 500; }
    .demo .btn { justify-self: start; margin-top: 6px; }
    @media (max-width: 860px) { .acceso { grid-template-columns: 1fr; } }
  `]
})
export class IngresarComponent {
  private sesion = inject(SesionService);
  private router = inject(Router);
  private ruta = inject(ActivatedRoute);

  correo = '';
  clave = '';
  error = signal('');

  completo(): boolean {
    return !!(this.correo && this.clave);
  }

  usarDemo(correo: string, clave: string): void {
    this.correo = correo;
    this.clave = clave;
    this.error.set('');
  }

  ingresar(): void {
    const usuario = this.sesion.ingresar(this.correo, this.clave);
    if (!usuario) {
      this.error.set('Correo o contraseña incorrectos. Revisa las cuentas de demostración.');
      return;
    }
    this.error.set('');
    const volver = this.ruta.snapshot.queryParamMap.get('volver');
    if (volver && (usuario.rol !== 'Paciente' || !volver.startsWith('/admin'))) {
      this.router.navigateByUrl(volver);
      return;
    }
    this.router.navigateByUrl(usuario.rol === 'Paciente' ? '/mi-cuenta' : '/admin/dashboard');
  }
}
