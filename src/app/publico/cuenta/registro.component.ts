import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SesionService } from '../../compartido/sesion.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <section class="cabecera-pagina">
      <div class="contenedor">
        <div class="miga"><a routerLink="/">Inicio</a> / <a routerLink="/ingresar">Ingresar</a> / Crear cuenta</div>
        <h1>Crear una cuenta</h1>
        <p>Registra tus datos una sola vez y tus próximas reservas se completarán automáticamente.</p>
      </div>
    </section>

    <section class="seccion">
      <div class="contenedor registro">
        <div class="panel">
          <h3>Datos de la paciente</h3>
          <p class="campo__ayuda" style="margin-bottom:24px">
            En el prototipo la cuenta se crea solo en memoria: no se almacena información real.
          </p>

          @if (error()) {
            <div class="aviso aviso--error" style="margin-bottom:20px">{{ error() }}</div>
          }

          <div class="grid grid-2" style="gap:0 20px">
            <div class="campo">
              <label>Nombre</label>
              <input type="text" [(ngModel)]="nombre" placeholder="Ej. María">
            </div>
            <div class="campo">
              <label>Apellidos</label>
              <input type="text" [(ngModel)]="apellido" placeholder="Ej. López Rivera">
            </div>
            <div class="campo">
              <label>DNI</label>
              <input type="text" maxlength="8" [(ngModel)]="dni" placeholder="Ej. 74859632">
            </div>
            <div class="campo">
              <label>Celular</label>
              <input type="tel" [(ngModel)]="celular" placeholder="Ej. 987 654 321">
            </div>
          </div>
          <div class="campo">
            <label>Correo electrónico</label>
            <input type="email" [(ngModel)]="correo" placeholder="correo@ejemplo.com">
          </div>
          <div class="grid grid-2" style="gap:0 20px">
            <div class="campo">
              <label>Contraseña</label>
              <input type="password" [(ngModel)]="clave" placeholder="Mínimo 6 caracteres">
            </div>
            <div class="campo">
              <label>Repetir contraseña</label>
              <input type="password" [(ngModel)]="claveRepetida" placeholder="Repite la contraseña">
            </div>
          </div>

          <label class="acepto">
            <input type="checkbox" [(ngModel)]="acepta">
            <span>Acepto el tratamiento de mis datos para gestionar citas y comunicaciones de la clínica.</span>
          </label>

          <button class="btn btn--primario btn--bloque" [disabled]="!completo()" (click)="registrar()">
            Crear mi cuenta
          </button>

          <p class="registro__pie">¿Ya tienes cuenta? <a routerLink="/ingresar">Ingresar</a></p>
        </div>

        <aside class="panel panel--suave">
          <h4>Ventajas de tener cuenta</h4>
          <ul class="ventajas">
            <li>Tus datos se completan solos al reservar una cita.</li>
            <li>Historial de tus citas y tratamientos realizados.</li>
            <li>Seguimiento de tus pedidos para recojo en local.</li>
            <li>Avisos de promociones y recordatorios de control.</li>
          </ul>
          <div class="aviso" style="margin-top:20px">
            Los productos se entregan únicamente con recojo en la Sede 1522 o la Sede 1544. No realizamos envíos.
          </div>
        </aside>
      </div>
    </section>
  `,
  styles: [`
    .registro { display: grid; grid-template-columns: 1.35fr 1fr; gap: 36px; align-items: start; max-width: 1040px; }
    .panel--suave { background: var(--rosa-50); }
    .acepto { display: flex; gap: 10px; align-items: flex-start; font-size: .9rem; color: var(--gris); margin: 6px 0 22px; }
    .acepto input { width: 16px; height: 16px; margin-top: 2px; accent-color: var(--magenta); }
    .registro__pie { margin: 22px 0 0; font-size: .94rem; color: var(--gris); text-align: center; }
    .registro__pie a { color: var(--magenta); font-weight: 500; }
    .ventajas { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; font-size: .94rem; color: var(--gris); }
    .ventajas li { padding-left: 16px; position: relative; }
    .ventajas li::before { content: ''; position: absolute; left: 0; top: 8px; width: 5px; height: 5px; border-radius: 50%; background: var(--magenta); }
    @media (max-width: 860px) { .registro { grid-template-columns: 1fr; } }
  `]
})
export class RegistroComponent {
  private sesion = inject(SesionService);
  private router = inject(Router);

  nombre = '';
  apellido = '';
  dni = '';
  celular = '';
  correo = '';
  clave = '';
  claveRepetida = '';
  acepta = false;
  error = signal('');

  completo(): boolean {
    return !!(
      this.nombre && this.apellido && this.dni && this.celular &&
      this.correo && this.clave && this.claveRepetida && this.acepta
    );
  }

  registrar(): void {
    if (this.dni.length !== 8) {
      this.error.set('El DNI debe tener 8 dígitos.');
      return;
    }
    if (this.clave.length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (this.clave !== this.claveRepetida) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }
    const creado = this.sesion.registrar({
      nombre: this.nombre,
      apellido: this.apellido,
      dni: this.dni,
      celular: this.celular,
      correo: this.correo,
      clave: this.clave
    });
    if (!creado) {
      this.error.set('Ya existe una cuenta registrada con ese correo.');
      return;
    }
    this.error.set('');
    this.router.navigateByUrl('/mi-cuenta');
  }
}
