import { Component, inject, signal } from '@angular/core';
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
        <h1>Tu carrito</h1>
        <p>Revisa tu pedido, elige el local donde lo recogerás y completa el pago. No realizamos envíos.</p>
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
            <a routerLink="/productos" class="btn btn--linea">Seguir comprando</a>
          </div>
        } @else {
          <div class="carrito">
            <div>
              <div class="tabla-envoltura panel">
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
            </div>

            <aside class="panel">
              <h3>Resumen</h3>
              <div class="resumen__linea"><span>Subtotal</span><strong>{{ soles(carrito.subtotal()) }}</strong></div>
              <div class="resumen__linea"><span>Recojo en local</span><strong>Sin costo</strong></div>
              <div class="resumen__total"><span>Total</span><strong>{{ soles(carrito.subtotal()) }}</strong></div>

              <div class="campo" style="margin-top:24px">
                <label>Local de recojo</label>
                <select [(ngModel)]="localRecojoId">
                  @for (l of locales; track l.id) {
                    <option [value]="l.id">{{ l.nombre }} — {{ l.direccion }}</option>
                  }
                </select>
                <span class="campo__ayuda">Solo recojo en local; por ahora no hay envíos a domicilio.</span>
              </div>
              <div class="campo">
                <label>Nombre y apellido</label>
                <input type="text" [(ngModel)]="nombre" placeholder="Ej. María López">
              </div>
              <div class="campo">
                <label>Celular</label>
                <input type="tel" [(ngModel)]="celular" placeholder="Ej. 987 654 321">
              </div>
              <div class="campo">
                <label>Método de pago</label>
                <select [(ngModel)]="metodo">
                  <option>Pagar en línea con Izipay</option>
                  <option>Pagar al recoger en el local</option>
                </select>
              </div>

              @if (mensajePago()) {
                <div class="aviso" [class.aviso--ok]="codigoOperacion()" style="margin-top:14px">
                  {{ mensajePago() }}
                </div>
              }
              <button class="btn btn--primario btn--bloque" [disabled]="procesandoPago()" (click)="confirmar()">
                @if (procesandoPago()) {
                  Procesando pago...
                } @else {
                  {{ metodo === 'Pagar en línea con Izipay' ? 'Pagar pedido con Izipay' : 'Confirmar pedido' }}
                }
              </button>
              <p class="campo__ayuda" style="margin-top:14px">
                Pago online preparado para Izipay. Ahora está en modo simulación hasta conectar Spring Boot.
              </p>
            </aside>
          </div>
        }
      </div>
    </section>
  `,
  styles: [`
    .carrito { display: grid; grid-template-columns: 1.6fr 1fr; gap: 32px; align-items: start; }
    .panel { padding: 24px; }
    .linea-prod { display: flex; gap: 14px; align-items: center; }
    .linea-prod img { width: 56px; height: 56px; object-fit: cover; border-radius: var(--radio); }
    .linea-prod strong { display: block; font-weight: 500; }
    .linea-prod span { font-size: .78rem; color: var(--gris-claro); }
    .cantidad { display: inline-flex; align-items: center; border: 1px solid var(--linea); border-radius: var(--radio); }
    .cantidad button { background: none; border: none; width: 30px; height: 32px; cursor: pointer; color: var(--vino); font-size: 1rem; }
    .cantidad span { min-width: 28px; text-align: center; font-size: .9rem; }
    .quitar { background: none; border: none; color: var(--gris-claro); cursor: pointer; font-family: inherit; font-size: .8rem; text-decoration: underline; }
    .quitar:hover { color: var(--error); }
    .resumen__linea { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed var(--linea); font-size: .92rem; color: var(--gris); }
    .resumen__linea strong { color: var(--tinta); font-weight: 500; }
    .resumen__total { display: flex; justify-content: space-between; align-items: baseline; padding: 16px 0 0; }
    .resumen__total strong { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.8rem; color: var(--vino); }
    .vacio { text-align: center; padding: 60px 20px; border: 1px dashed var(--linea); border-radius: var(--radio-lg); }
    .vacio p { max-width: 60ch; margin: 0 auto 24px; }
    @media (max-width: 960px) { .carrito { grid-template-columns: 1fr; } }
  `]
})
export class CarritoComponent {
  carrito = inject(CarritoService);
  private sesion = inject(SesionService);
  private pagosOnline = inject(PagosOnlineService);
  soles = soles;
  locales = LOCALES;

  localRecojoId = LOCALES[0].id;
  metodo = 'Pagar en línea con Izipay';
  nombre = this.sesion.nombreCompleto();
  celular = this.sesion.usuario()?.celular ?? '';
  confirmado = signal(false);
  procesandoPago = signal(false);
  mensajePago = signal('');
  codigoOperacion = signal<string | null>(null);
  codigo = 'PD-2042';

  confirmar(): void {
    if (this.metodo === 'Pagar en línea con Izipay') {
      this.procesarPagoOnline();
      return;
    }
    this.codigoOperacion.set(null);
    this.confirmado.set(true);
    this.carrito.vaciar();
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
        celular: this.celular
      },
      items: items.map(item => ({
        id: item.producto.id,
        nombre: item.producto.nombre,
        cantidad: item.cantidad,
        precioUnitario: item.producto.precio
      })),
      metadata: {
        entrega: this.entregaSeleccionada()
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
