import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CarritoService } from '../../compartido/carrito.service';
import { SesionService } from '../../compartido/sesion.service';
import { PagosOnlineService } from '../../compartido/pagos-online.service';
import { LOCALES, soles } from '../../data/datos';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <section class="cabecera-pagina">
      <div class="contenedor">
        <div class="miga"><a routerLink="/">Inicio</a> / Carrito</div>
        <h1>Checkout de productos</h1>
        <p>Confirma tu pedido, completa tus datos, elige dónde recogerlo y termina el pago.</p>
      </div>
    </section>

    <section class="seccion">
      <div class="contenedor">
        @if (!carrito.items().length && !confirmado()) {
          <div class="vacio">
            <h3>Todavía no agregaste productos</h3>
            <p>Explora la tienda y agrega los productos recomendados por nuestras especialistas.</p>
            <a routerLink="/productos" class="btn btn--primario">Ir a la tienda</a>
          </div>
        } @else if (confirmado()) {
          <div class="vacio">
            <span class="chip chip--ok chip--punto">Pedido registrado</span>
            <h3 style="margin-top:16px">Pedido {{ codigo }} generado</h3>
            <p>
              @if (codigoOperacion()) {
                Pago online aprobado con código <strong>{{ codigoOperacion() }}</strong>. El pedido queda listo para aparecer
                como pagado en el panel administrativo cuando Spring Boot registre la confirmación.
              } @else {
                El pedido queda pendiente de pago hasta que recepción cobre al momento del recojo.
              }
            </p>
            <div class="confirmacion__acciones">
              <a routerLink="/productos" class="btn btn--linea">Seguir comprando</a>
              <a routerLink="/" class="btn btn--primario">Volver al inicio</a>
            </div>
          </div>
        } @else {
          <div class="checkout">
            <div>
              <ol class="pasos-barra">
                @for (p of pasos; track p.n) {
                  <li [class.activo]="paso() === p.n" [class.hecho]="paso() > p.n" (click)="irA(p.n)">
                    <span class="pasos-barra__n">{{ p.n }}</span>
                    <span class="pasos-barra__t">{{ p.titulo }}</span>
                  </li>
                }
              </ol>

              @if (paso() === 1) {
                <div class="panel bloque">
                  <h3>1. Revisa tu carrito</h3>
                  <p>Confirma cantidades antes de continuar con tus datos.</p>

                  <div class="lista-movil">
                    @for (i of carrito.items(); track i.producto.id) {
                      <article class="item-movil panel panel--interno">
                        <img class="img-cobertura" [src]="i.producto.imagen" [alt]="i.producto.nombre">
                        <div class="item-movil__cuerpo">
                          <strong>{{ i.producto.nombre }}</strong>
                          <span class="item-movil__marca">{{ i.producto.marca }}</span>
                          <span class="item-movil__precio">{{ soles(i.producto.precio) }} c/u</span>
                          <div class="item-movil__pie">
                            <div class="cantidad">
                              <button (click)="carrito.cambiarCantidad(i.producto.id, i.cantidad - 1)">−</button>
                              <span>{{ i.cantidad }}</span>
                              <button (click)="carrito.cambiarCantidad(i.producto.id, i.cantidad + 1)">+</button>
                            </div>
                            <strong class="item-movil__subtotal">{{ soles(i.cantidad * i.producto.precio) }}</strong>
                          </div>
                          <button class="quitar" (click)="carrito.quitar(i.producto.id)">Quitar</button>
                        </div>
                      </article>
                    }
                  </div>

                  <div class="tabla-envoltura tabla-escritorio">
                    <table class="tabla">
                      <thead>
                        <tr><th>Producto</th><th>Precio</th><th>Cantidad</th><th class="num">Subtotal</th><th></th></tr>
                      </thead>
                      <tbody>
                        @for (i of carrito.items(); track i.producto.id) {
                          <tr>
                            <td>
                              <div class="linea-prod">
                                <img class="img-cobertura" [src]="i.producto.imagen" [alt]="i.producto.nombre">
                                <div>
                                  <strong>{{ i.producto.nombre }}</strong>
                                  <span>{{ i.producto.marca }}</span>
                                </div>
                              </div>
                            </td>
                            <td>{{ soles(i.producto.precio) }}</td>
                            <td>
                              <div class="cantidad">
                                <button (click)="carrito.cambiarCantidad(i.producto.id, i.cantidad - 1)">−</button>
                                <span>{{ i.cantidad }}</span>
                                <button (click)="carrito.cambiarCantidad(i.producto.id, i.cantidad + 1)">+</button>
                              </div>
                            </td>
                            <td class="num">{{ soles(i.cantidad * i.producto.precio) }}</td>
                            <td class="num">
                              <button class="quitar" (click)="carrito.quitar(i.producto.id)">Quitar</button>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>

                  <div class="acciones-paso">
                    <a routerLink="/productos" class="btn btn--linea btn--sm">Seguir comprando</a>
                    <button class="btn btn--primario btn--sm" (click)="siguiente()">Continuar</button>
                  </div>
                </div>
              }

              @if (paso() === 2) {
                <div class="panel bloque">
                  <h3>2. Tus datos personales</h3>
                  <p>Estos datos servirán para identificar quién recoge el pedido y para el cobro online.</p>
                  @if (sesion.autenticado()) {
                    <div class="aviso aviso--ok" style="margin-bottom:20px">
                      Tus datos se cargaron desde tu cuenta. Puedes corregirlos si algo cambió.
                    </div>
                  }
                  <div class="grid grid-2" style="gap:0 20px">
                    <div class="campo">
                      <label>Nombres</label>
                      <input type="text" [(ngModel)]="nombre" placeholder="Ej. María">
                    </div>
                    <div class="campo">
                      <label>Apellidos</label>
                      <input type="text" [(ngModel)]="apellido" placeholder="Ej. López Rivera">
                    </div>
                    <div class="campo">
                      <label>DNI</label>
                      <input type="text" [(ngModel)]="dni" maxlength="8" placeholder="Ej. 74859632">
                    </div>
                    <div class="campo">
                      <label>Celular</label>
                      <input type="tel" [(ngModel)]="celular" placeholder="Ej. 987 654 321">
                    </div>
                  </div>
                  <div class="campo">
                    <label>Correo electrónico (opcional)</label>
                    <input type="email" [(ngModel)]="correo" placeholder="correo@ejemplo.com">
                    <span class="campo__ayuda">Izipay puede usar este correo para confirmar el pago.</span>
                  </div>

                  <div class="acciones-paso">
                    <button class="btn btn--linea btn--sm" (click)="anterior()">Volver</button>
                    <button class="btn btn--primario btn--sm" [disabled]="!datosCompletos()" (click)="siguiente()">Continuar</button>
                  </div>
                </div>
              }

              @if (paso() === 3) {
                <div class="panel bloque">
                  <h3>3. Elige dónde recogerás tu pedido</h3>
                  <p>Selecciona la sede donde recepción preparará tus productos para entrega.</p>

                  <div class="grid grid-2">
                    @for (l of locales; track l.id) {
                      <button class="opcion" [class.opcion--activa]="localRecojoId === l.id" (click)="localRecojoId = l.id">
                        <img class="img-cobertura" [src]="l.imagen" [alt]="l.nombre">
                        <div>
                          <strong>{{ l.nombre }}</strong>
                          <span>{{ l.direccion }}</span>
                          <span>{{ l.distrito }}</span>
                        </div>
                      </button>
                    }
                  </div>

                  <div class="aviso" style="margin-top:18px">
                    Por ahora solo trabajamos con recojo en local. El pedido se entrega en recepción con tus datos y tu código de operación si pagaste online.
                  </div>

                  <div class="acciones-paso">
                    <button class="btn btn--linea btn--sm" (click)="anterior()">Volver</button>
                    <button class="btn btn--primario btn--sm" (click)="siguiente()">Continuar</button>
                  </div>
                </div>
              }

              @if (paso() === 4) {
                <div class="panel bloque">
                  <h3>4. Método de pago</h3>
                  <p>Elige si deseas pagar ahora con Izipay o dejar el pedido pendiente para pagarlo al recoger.</p>

                  <button class="opcion opcion--fila" [class.opcion--activa]="metodo === 'Pagar en línea con Izipay'" (click)="metodo = 'Pagar en línea con Izipay'">
                    <div class="opcion__texto">
                      <strong>Pagar en línea con Izipay</strong>
                      <span>Dejamos preparado el checkout para tarjeta y, según tu cuenta Izipay, también Yape, Plin, QR u otros medios habilitados.</span>
                    </div>
                    <div class="opcion__precio">{{ soles(carrito.subtotal()) }}</div>
                  </button>

                  <button class="opcion opcion--fila" [class.opcion--activa]="metodo === 'Pagar al recoger en el local'" (click)="metodo = 'Pagar al recoger en el local'">
                    <div class="opcion__texto">
                      <strong>Pagar al recoger en el local</strong>
                      <span>El pedido quedará registrado como pendiente de pago para que recepción cobre al momento de la entrega.</span>
                    </div>
                    <div class="opcion__precio">{{ soles(carrito.subtotal()) }}</div>
                  </button>

                  @if (mensajePago()) {
                    <div class="aviso" [class.aviso--ok]="codigoOperacion()" style="margin-top:14px">
                      {{ mensajePago() }}
                    </div>
                  }

                  <div class="acciones-paso">
                    <button class="btn btn--linea btn--sm" (click)="anterior()">Volver</button>
                    <button class="btn btn--primario" [disabled]="procesandoPago()" (click)="confirmar()">
                      @if (procesandoPago()) {
                        Procesando pago...
                      } @else {
                        {{ metodo === 'Pagar en línea con Izipay' ? 'Pagar pedido con Izipay' : 'Continuar sin pagar' }}
                      }
                    </button>
                  </div>
                </div>
              }
            </div>

            <aside class="panel checkout__resumen">
              <h3>Resumen del pedido</h3>
              @if (carrito.reservaRestanteSeg() > 0) {
                <div class="aviso aviso--ok" style="margin-bottom:16px">
                  Tus productos están reservados en el carrito por <strong>{{ tiempoReservaTexto() }}</strong>
                  mientras completas el checkout.
                </div>
              }
              <div class="resumen__linea"><span>Productos</span><strong>{{ carrito.cantidad() }}</strong></div>
              <div class="resumen__linea"><span>Subtotal</span><strong>{{ soles(carrito.subtotal()) }}</strong></div>
              <div class="resumen__linea"><span>Recojo en local</span><strong>Sin costo</strong></div>
              <div class="resumen__linea"><span>Cliente</span><strong>{{ nombreCompleto() || 'Por completar' }}</strong></div>
              <div class="resumen__linea"><span>Sede de recojo</span><strong>{{ nombreLocalRecojo() }}</strong></div>
              <div class="resumen__linea"><span>Pago</span><strong>{{ metodo === 'Pagar en línea con Izipay' ? 'Izipay' : 'Pago en local' }}</strong></div>
              <div class="resumen__total"><span>Total</span><strong>{{ soles(carrito.subtotal()) }}</strong></div>

              <div class="panel panel--interno checkout__nota">
                <h4>Cómo quedará con Izipay real</h4>
                <p>
                  El frontend ya está listo para abrir el checkout. Cuando conectemos Spring Boot, el backend generará la sesión segura
                  y Izipay mostrará los medios disponibles para la cuenta del comercio.
                </p>
              </div>
            </aside>
          </div>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .checkout { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(320px, .95fr); gap: 32px; align-items: start; }
    .checkout > * { min-width: 0; }
    .bloque { display: grid; gap: 18px; padding: 26px; }
    .lista-movil { display: none; }
    .panel { padding: 24px; }
    .panel--interno { background: var(--rosa-2); border: 1px solid var(--linea); border-radius: var(--radio-lg); }
    .pasos-barra { list-style: none; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; padding: 0; margin: 0 0 24px; }
    .pasos-barra li { display: grid; gap: 8px; align-content: start; padding: 14px; border: 1px solid var(--linea); border-radius: var(--radio-lg); cursor: pointer; background: #fff; transition: .24s ease; }
    .pasos-barra li.activo { border-color: var(--magenta); box-shadow: 0 14px 28px rgba(109, 16, 68, .08); transform: translateY(-2px); }
    .pasos-barra li.hecho { background: rgba(182, 33, 116, .07); border-color: rgba(182, 33, 116, .22); }
    .pasos-barra__n { width: 30px; height: 30px; border-radius: 999px; display: grid; place-items: center; background: var(--vino); color: #fff; font-size: .9rem; font-weight: 600; }
    .pasos-barra__t { font-size: .96rem; color: var(--tinta); font-weight: 500; }
    .linea-prod { display: flex; gap: 14px; align-items: center; }
    .linea-prod img { width: 56px; height: 56px; object-fit: cover; border-radius: var(--radio); }
    .linea-prod strong { display: block; font-weight: 500; }
    .linea-prod span { font-size: .92rem; color: var(--gris); }
    .cantidad { display: inline-flex; align-items: center; border: 1px solid var(--linea); border-radius: var(--radio); background: #fff; }
    .cantidad button { background: none; border: none; width: 30px; height: 32px; cursor: pointer; color: var(--vino); font-size: 1rem; }
    .cantidad span { min-width: 28px; text-align: center; font-size: .96rem; }
    .quitar { background: none; border: none; color: var(--gris); cursor: pointer; font-family: inherit; font-size: .94rem; text-decoration: underline; padding: 0; }
    .quitar:hover { color: var(--error); }
    .resumen__linea { display: flex; justify-content: space-between; gap: 12px; padding: 11px 0; border-bottom: 1px dashed var(--linea); font-size: .98rem; color: var(--gris); }
    .resumen__linea strong { color: var(--tinta); font-weight: 500; text-align: right; }
    .resumen__total { display: flex; justify-content: space-between; align-items: baseline; padding: 16px 0 0; }
    .resumen__total strong { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.8rem; color: var(--vino); }
    .vacio { text-align: center; padding: 60px 20px; border: 1px dashed var(--linea); border-radius: var(--radio-lg); }
    .vacio p { max-width: 60ch; margin: 0 auto 24px; }
    .confirmacion__acciones, .acciones-paso { display: flex; gap: 12px; flex-wrap: wrap; }
    .checkout__resumen { position: sticky; top: 110px; }
    .checkout__nota { margin-top: 18px; }
    .checkout__nota h4 { margin: 0 0 10px; }
    .checkout__nota p { margin: 0; font-size: .95rem; color: var(--gris); }
    .opcion { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 18px; width: 100%; padding: 16px; border-radius: var(--radio-lg); border: 1px solid var(--linea); background: #fff; cursor: pointer; text-align: left; transition: .24s ease; }
    .opcion:hover, .opcion--activa { border-color: rgba(182, 33, 116, .3); box-shadow: 0 14px 28px rgba(109, 16, 68, .08); transform: translateY(-2px); }
    .opcion img { width: 110px; height: 110px; border-radius: var(--radio); object-fit: cover; }
    .opcion strong { display: block; margin-bottom: 6px; font-weight: 500; }
    .opcion span { display: block; color: var(--gris); font-size: .94rem; }
    .opcion--fila { grid-template-columns: minmax(0, 1fr) auto; align-items: center; }
    .opcion__texto { min-width: 0; }
    .opcion__meta { margin-top: 4px; }
    .opcion__precio { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.7rem; color: var(--vino); white-space: nowrap; }
    .tabla-envoltura { overflow: auto; border: 1px solid var(--linea); border-radius: var(--radio-lg); }
    .tabla { width: 100%; border-collapse: collapse; }
    .tabla th, .tabla td { padding: 16px; border-bottom: 1px solid var(--linea); text-align: left; vertical-align: middle; }
    .tabla th { font-size: .82rem; text-transform: uppercase; letter-spacing: .12em; color: var(--gris); font-weight: 600; }
    .tabla td.num, .tabla th.num { text-align: right; }
    .item-movil { display: grid; grid-template-columns: 74px minmax(0, 1fr); gap: 14px; padding: 14px; align-items: start; }
    .item-movil img { width: 74px; height: 74px; border-radius: var(--radio); }
    .item-movil__cuerpo { display: grid; gap: 4px; min-width: 0; }
    .item-movil strong { font-weight: 500; line-height: 1.2; }
    .item-movil__marca { font-size: .9rem; color: var(--gris); }
    .item-movil__precio { font-size: .92rem; color: var(--gris); }
    .item-movil__pie { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 6px; }
    .item-movil__subtotal { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.3rem; color: var(--vino); }
    @media (max-width: 1080px) {
      .checkout { grid-template-columns: 1fr; }
      .checkout__resumen { position: static; order: -1; }
    }
    @media (max-width: 960px) {
      .pasos-barra { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .tabla-escritorio { display: none; }
      .lista-movil { display: grid; gap: 12px; }
      .opcion, .opcion--fila { grid-template-columns: 1fr; }
      .opcion img { width: 100%; height: 190px; }
      .opcion__precio { font-size: 1.5rem; }
    }
    @media (max-width: 640px) {
      .bloque, .panel { padding: 18px; }
      .pasos-barra { grid-template-columns: 1fr; }
      .confirmacion__acciones, .acciones-paso { flex-direction: column; }
      .confirmacion__acciones .btn, .acciones-paso .btn { width: 100%; }
      .resumen__linea { font-size: .94rem; }
    }
  `]
})
export class CarritoComponent {
  carrito = inject(CarritoService);
  readonly sesion = inject(SesionService);
  private pagosOnline = inject(PagosOnlineService);
  soles = soles;
  locales = LOCALES;

  paso = signal(1);
  confirmado = signal(false);
  procesandoPago = signal(false);
  mensajePago = signal('');
  codigoOperacion = signal<string | null>(null);

  pasos = [
    { n: 1, titulo: 'Carrito' },
    { n: 2, titulo: 'Datos personales' },
    { n: 3, titulo: 'Recojo' },
    { n: 4, titulo: 'Pago' }
  ];

  localRecojoId = LOCALES[0].id;
  metodo = 'Pagar en línea con Izipay';
  nombre = this.sesion.usuario()?.nombre ?? '';
  apellido = this.sesion.usuario()?.apellido ?? '';
  dni = this.sesion.usuario()?.dni ?? '';
  correo = this.sesion.usuario()?.correo ?? '';
  celular = this.sesion.usuario()?.celular ?? '';
  codigo = 'PD-2042';

  irA(n: number): void {
    if (n < this.paso()) {
      this.paso.set(n);
    }
  }

  siguiente(): void {
    const actual = this.paso();
    this.paso.set(Math.min(actual + 1, 4));
  }

  anterior(): void {
    const actual = this.paso();
    this.paso.set(Math.max(actual - 1, 1));
  }

  datosCompletos(): boolean {
    return !!(this.nombre.trim() && this.apellido.trim() && this.dni.trim() && this.celular.trim());
  }

  nombreCompleto(): string {
    const full = `${this.nombre} ${this.apellido}`.trim();
    return full || '';
  }

  nombreLocalRecojo(): string {
    return this.locales.find(l => l.id === Number(this.localRecojoId))?.nombre ?? 'Por elegir';
  }

  confirmar(): void {
    if (this.metodo === 'Pagar en línea con Izipay') {
      this.procesarPagoOnline();
      return;
    }
    this.codigoOperacion.set(null);
    this.confirmado.set(true);
    this.carrito.vaciar();
  }

  tiempoReservaTexto(): string {
    const total = this.carrito.reservaRestanteSeg();
    const minutos = Math.floor(total / 60);
    const segundos = total % 60;
    return `${`${minutos}`.padStart(2, '0')}:${`${segundos}`.padStart(2, '0')}`;
  }

  private procesarPagoOnline(): void {
    if (this.procesandoPago()) { return; }
    this.procesandoPago.set(true);
    this.mensajePago.set('Preparando pago seguro con Izipay...');

    const items = this.carrito.items();
    this.pagosOnline.iniciarPago({
      tipo: 'Producto',
      referencia: this.codigo,
      descripcion: `Pedido ${this.codigo} · ${items.length} producto(s)`,
      monto: this.carrito.subtotal(),
      moneda: 'PEN',
      localId: Number(this.localRecojoId),
      cliente: {
        nombre: this.nombre,
        apellido: this.apellido,
        dni: this.dni,
        correo: this.correo,
        celular: this.celular
      },
      items: items.map(item => ({
        id: item.producto.id,
        nombre: item.producto.nombre,
        cantidad: item.cantidad,
        precioUnitario: item.producto.precio
      })),
      metadata: {
        entrega: this.entregaSeleccionada(),
        dni: this.dni
      }
    }).subscribe({
      next: resultado => {
        this.procesandoPago.set(false);
        this.mensajePago.set(resultado.mensaje);
        if (resultado.aprobado) {
          this.codigoOperacion.set(resultado.codigoOperacion ?? null);
          this.confirmado.set(true);
          this.carrito.vaciar();
        }
      },
      error: () => {
        this.procesandoPago.set(false);
        this.mensajePago.set('No se pudo iniciar el pago online. Puedes intentar otra vez o pagar al recoger.');
      }
    });
  }

  private entregaSeleccionada(): string {
    const local = this.locales.find(l => l.id === Number(this.localRecojoId)) ?? this.locales[0];
    return `Recojo en ${local.nombre}`;
  }
}
