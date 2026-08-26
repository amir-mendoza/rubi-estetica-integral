import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MapaSedeComponent } from '../../compartido/mapa-sede.component';
import { RedesEnlacesComponent } from '../../compartido/redes-enlaces.component';
import { RedesService } from '../../compartido/redes.service';
import { LOCALES } from '../../data/datos';
import { ConfiguracionPanelService } from '../../compartido/configuracion-panel.service';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [RouterLink, FormsModule, MapaSedeComponent, RedesEnlacesComponent],
  template: `
    <section class="cabecera-pagina">
      <div class="contenedor">
        <div class="miga"><a routerLink="/">Inicio</a> / Contacto</div>
        <h1>Contacto</h1>
        <p>Escríbenos y una asesora te responderá dentro del horario de atención.</p>
      </div>
    </section>

    <section class="seccion">
      <div class="contenedor contacto">
        <div class="panel">
          <h3>Envíanos un mensaje</h3>
          <p class="campo__ayuda" style="margin-bottom:24px">
            Los campos marcados son obligatorios. En el prototipo el envío no registra datos.
          </p>

          @if (enviado()) {
            <div class="aviso" style="margin-bottom:20px">
              Mensaje registrado. En la versión final se enviará al correo de la clínica y al panel administrativo.
            </div>
          }

          <div class="grid grid-2" style="gap:0 20px">
            <div class="campo">
              <label>Nombre y apellido</label>
              <input type="text" [(ngModel)]="nombre" placeholder="Ej. María López">
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
          <div class="campo">
            <label>Motivo de consulta</label>
            <select [(ngModel)]="motivo">
              <option>Información sobre un tratamiento</option>
              <option>Reprogramar una cita</option>
              <option>Consulta sobre productos</option>
              <option>Trabaja con nosotros</option>
              <option>Otro</option>
            </select>
          </div>
          <div class="campo">
            <label>Mensaje</label>
            <textarea rows="5" [(ngModel)]="mensaje" placeholder="Cuéntanos en qué podemos ayudarte"></textarea>
          </div>
          <button class="btn btn--primario" (click)="enviar()">Enviar mensaje</button>
        </div>

        <aside class="contacto__aside">
          <div class="panel">
            <h4>Atención inmediata</h4>
            <p>Para reservas del mismo día, escríbenos por WhatsApp.</p>
            @if (redes.whatsapp()) {
              <a [href]="redes.whatsapp()" target="_blank" rel="noopener" class="btn btn--primario btn--sm btn--bloque">
                Escribir por WhatsApp
              </a>
            }
            <a href="tel:945189720" class="btn btn--linea btn--sm btn--bloque" style="margin-top:10px">945 189 720</a>
          </div>

          @for (l of locales(); track l.id) {
            <div class="panel" style="margin-top:22px">
              <h4>{{ l.nombre }}</h4>
              <p style="margin-bottom:14px">{{ l.direccion }}<br>{{ l.referencia }}<br>{{ l.distrito }}</p>
              @for (h of l.horario; track h.dias) {
                <div class="contacto__horario"><span>{{ h.dias }}</span><strong>{{ h.apertura }} — {{ h.cierre }}</strong></div>
              }
              <div style="margin-top:16px">
                <app-mapa-sede [local]="l" />
              </div>
            </div>
          }

          @if (redes.activas().length) {
            <div class="panel" style="margin-top:22px">
              <h4>Síguenos</h4>
              <app-redes-enlaces [conTexto]="true" />
            </div>
          }
        </aside>
      </div>
    </section>
  `,
  styles: [`
    .contacto { display: grid; grid-template-columns: 1.5fr 1fr; gap: 40px; align-items: start; }
    .contacto__horario { display: flex; justify-content: space-between; gap: 12px; font-size: .94rem; color: var(--gris); padding: 6px 0; border-bottom: 1px dashed var(--linea); }
    .contacto__horario strong { color: var(--tinta); font-weight: 500; }
    @media (max-width: 960px) { .contacto { grid-template-columns: 1fr; } }
  `]
})
export class ContactoComponent {
  readonly redes = inject(RedesService);
  readonly configPanel = inject(ConfiguracionPanelService);
  locales = computed(() => this.configPanel.combinarLocalesConHorarios(LOCALES));
  nombre = '';
  celular = '';
  correo = '';
  motivo = 'Información sobre un tratamiento';
  mensaje = '';
  enviado = signal(false);

  enviar(): void {
    this.enviado.set(true);
  }
}
