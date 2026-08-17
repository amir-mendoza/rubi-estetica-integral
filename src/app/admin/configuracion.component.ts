import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LOCALES, cabinasDeSede, cupoDeSede } from '../data/datos';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="cabecera-admin">
      <div>
        <h1>Configuración</h1>
        <p>Parámetros del negocio, agenda, pagos, usuarios y preparación para la etapa offline.</p>
      </div>
      <div class="cabecera-admin__acciones">
        <button class="btn btn--vino btn--sm">Guardar cambios</button>
      </div>
    </div>

    <nav class="pestanas">
      @for (t of pestanas; track t) {
        <button [class.activa]="pestana() === t" (click)="pestana.set(t)">{{ t }}</button>
      }
    </nav>

    @if (pestana() === 'Negocio') {
      <div class="grid-config">
        <div class="panel">
          <h4>Datos del negocio</h4>
          <div class="campo"><label>Nombre comercial</label><input type="text" value="Rubí Estética Integral"></div>
          <div class="campo"><label>RUC</label><input type="text" value="10 4XX XXX XX1"></div>
          <div class="campo"><label>Teléfono principal</label><input type="text" value="945 189 720"></div>
          <div class="campo"><label>Correo de contacto</label><input type="email" value="contacto@rubiestetica.pe"></div>
        </div>
        <div class="panel">
          <h4>Redes y canales</h4>
          <div class="campo"><label>Instagram</label><input type="text" value="@rubiesteticaintegral346"></div>
          <div class="campo"><label>TikTok</label><input type="text" value="@rubiesteticaintegral"></div>
          <div class="campo"><label>Facebook</label><input type="text" value="Rubí Estética Integral"></div>
          <div class="campo"><label>WhatsApp de reservas</label><input type="text" value="+51 945 189 720"></div>
        </div>
      </div>
    }

    @if (pestana() === 'Agenda') {
      <div class="grid-config">
        <div class="panel">
          <h4>Reglas de la agenda</h4>
          <div class="campo"><label>Duración del bloque horario</label>
            <select><option>60 minutos</option><option>90 minutos</option><option>30 minutos</option></select>
          </div>
          <div class="campo"><label>Anticipación mínima para reservar en línea</label>
            <select><option>2 horas</option><option>1 hora</option><option>Mismo día sin restricción</option></select>
          </div>
          @for (l of locales; track l.id) {
            <div class="campo">
              <label>Citas por bloque en {{ l.nombre }} ({{ cabinas(l.id) }} cabinas)</label>
              <input type="number" [value]="cupo(l.id)" min="1" [max]="cabinas(l.id)">
              <span class="campo__ayuda">
                Quedan {{ cabinas(l.id) - cupo(l.id) }} cabinas libres por hora para pacientes sin cita.
              </span>
            </div>
          }
          <div class="interruptores">
            <label><input type="checkbox" checked> Cerrar el bloque horario al llegar a su cupo</label>
            <label><input type="checkbox" checked> Reservar cabinas para atenciones sin cita</label>
            <label><input type="checkbox" checked> Asignar cabina y especialista en el local, al llegar la paciente</label>
            <label><input type="checkbox"> Permitir sobreventa autorizada por administración</label>
          </div>
        </div>

        <div class="panel">
          <h4>Horario por local</h4>
          @for (l of locales; track l.id) {
            <div class="horario-config">
              <strong>{{ l.nombre }}</strong>
              @for (h of l.horario; track h.dias) {
                <div class="horario-config__fila">
                  <span>{{ h.dias }}</span>
                  <input type="time" [value]="h.apertura">
                  <input type="time" [value]="h.cierre">
                </div>
              }
            </div>
          }
        </div>
      </div>
    }

    @if (pestana() === 'Pagos') {
      <div class="grid-config">
        <div class="panel">
          <h4>Pasarela Izipay</h4>
          <div class="campo"><label>Modo</label><select><option>Pruebas (sandbox)</option><option>Producción</option></select></div>
          <div class="campo"><label>Identificador de comercio</label><input type="text" value="—" placeholder="Se configura en la etapa de integración"></div>
          <div class="campo"><label>URL del webhook de confirmación</label><input type="text" value="https://api.rubiestetica.pe/pagos/izipay/webhook"></div>
          <div class="interruptores">
            <label><input type="checkbox" checked> Marcar la cita como pagada solo con la confirmación del webhook</label>
            <label><input type="checkbox" checked> Registrar el código de operación en cada movimiento</label>
          </div>
        </div>
        <div class="panel">
          <h4>Cobros en local</h4>
          <div class="interruptores">
            <label><input type="checkbox" checked> Efectivo (único método presencial habilitado)</label>
            <label><input type="checkbox"> Yape</label>
            <label><input type="checkbox"> Tarjeta POS</label>
            <label><input type="checkbox"> Transferencia bancaria</label>
          </div>
          <div class="campo" style="margin-top:18px">
            <label>Adelanto requerido para reservar en línea</label>
            <select><option>Sin adelanto</option><option>30 % del tratamiento</option><option>50 % del tratamiento</option><option>Pago completo</option></select>
          </div>
        </div>
      </div>
    }

    @if (pestana() === 'Usuarios') {
      <div class="tabla-panel">
        <div class="tabla-panel__cabecera">
          <h3>Usuarios del sistema</h3>
          <button class="btn btn--linea btn--sm">Nuevo usuario</button>
        </div>
        <div class="tabla-envoltura">
          <table class="tabla">
            <thead><tr><th>Usuario</th><th>Rol</th><th>Local</th><th>Permisos</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              @for (u of usuarios; track u.usuario) {
                <tr>
                  <td><div class="mini-dato"><strong>{{ u.nombre }}</strong><span>{{ u.usuario }}</span></div></td>
                  <td>{{ u.rol }}</td>
                  <td>{{ u.local }}</td>
                  <td>{{ u.permisos }}</td>
                  <td><span class="chip chip--ok chip--punto">Activo</span></td>
                  <td class="num"><button class="boton-icono">Editar</button></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    @if (pestana() === 'Sincronización') {
      <div class="panel">
        <h4>Preparación para la etapa offline</h4>
        <p>
          Estos parámetros aún no están activos. Quedan documentados en el prototipo porque la
          segunda etapa contempla una aplicación de escritorio por local con sincronización.
        </p>
        <div class="grid-config" style="margin-top:20px">
          <div>
            <div class="campo"><label>Frecuencia de sincronización</label><select><option>Cada 5 minutos</option><option>Cada 15 minutos</option></select></div>
            <div class="campo"><label>Bloquear reservas del día si un local no sincroniza hace</label><select><option>30 minutos</option><option>60 minutos</option></select></div>
          </div>
          <div class="interruptores">
            <label><input type="checkbox" checked> Registrar uuid global en cada operación</label>
            <label><input type="checkbox" checked> Registrar el local de origen de cada registro</label>
            <label><input type="checkbox" checked> Usar borrado lógico en lugar de borrado físico</label>
            <label><input type="checkbox" checked> Mantener marcas de creación y actualización</label>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .pestanas { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 22px; }
    .pestanas button {
      background: #fff; border: 1px solid var(--linea); border-radius: 999px;
      padding: .5rem 1.2rem; font-family: inherit; font-size: .78rem; letter-spacing: .08em;
      color: var(--gris); cursor: pointer;
    }
    .pestanas button:hover { border-color: var(--magenta-300); color: var(--magenta); }
    .pestanas button.activa { background: var(--vino); border-color: var(--vino); color: #fff; }
    .grid-config { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; align-items: start; }
    .interruptores { display: grid; gap: 12px; }
    .interruptores label { display: flex; gap: 10px; align-items: flex-start; font-size: .88rem; color: var(--gris); cursor: pointer; }
    .interruptores input { margin-top: 3px; accent-color: var(--magenta); }
    .horario-config { margin-bottom: 20px; }
    .horario-config strong { display: block; margin-bottom: 10px; font-weight: 500; }
    .horario-config__fila { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 10px; align-items: center; margin-bottom: 8px; }
    .horario-config__fila span { font-size: .84rem; color: var(--gris); }
    .horario-config__fila input { border: 1px solid var(--linea); border-radius: var(--radio); padding: .45rem .6rem; font-family: inherit; font-size: .84rem; }
    @media (max-width: 1100px) { .grid-config { grid-template-columns: 1fr; } }
  `]
})
export class ConfiguracionComponent {
  locales = LOCALES;
  cupo = cupoDeSede;
  cabinas = (localId: number) => cabinasDeSede(localId).length;
  pestanas = ['Negocio', 'Agenda', 'Pagos', 'Usuarios', 'Sincronización'];
  pestana = signal('Negocio');

  usuarios = [
    { nombre: 'Rubí Salazar', usuario: 'rubi.admin', rol: 'Administradora', local: 'Ambas sedes', permisos: 'Acceso total' },
    { nombre: 'Milagros Ríos', usuario: 'milagros.recepcion', rol: 'Recepcionista', local: 'Sede Las Flores 1522', permisos: 'Agenda, pacientes y cobros' },
    { nombre: 'Jazmín Cabrera', usuario: 'jazmin.recepcion', rol: 'Recepcionista', local: 'Sede Las Flores 1544', permisos: 'Agenda, pacientes y cobros' },
    { nombre: 'Ana Torres', usuario: 'ana.especialista', rol: 'Especialista', local: 'Sede Las Flores 1522', permisos: 'Sus citas y observaciones' },
    { nombre: 'Lucía Ramos', usuario: 'lucia.especialista', rol: 'Especialista', local: 'Sede Las Flores 1544', permisos: 'Sus citas y observaciones' }
  ];
}
