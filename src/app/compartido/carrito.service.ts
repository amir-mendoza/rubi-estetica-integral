import { Injectable, computed, signal } from '@angular/core';
import { Producto } from '../data/modelos';

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly items$ = signal<ItemCarrito[]>([]);
  private readonly aviso$ = signal<string | null>(null);
  private temporizadorAviso?: ReturnType<typeof setTimeout>;

  readonly items = this.items$.asReadonly();
  readonly aviso = this.aviso$.asReadonly();
  readonly cantidad = computed(() => this.items$().reduce((t, i) => t + i.cantidad, 0));
  readonly subtotal = computed(() => this.items$().reduce((t, i) => t + i.cantidad * i.producto.precio, 0));

  agregar(producto: Producto, cantidad = 1): void {
    const actuales = [...this.items$()];
    const existente = actuales.find(i => i.producto.id === producto.id);
    if (existente) {
      existente.cantidad = Math.min(existente.cantidad + cantidad, Math.max(producto.stock, 1));
    } else {
      actuales.push({ producto, cantidad });
    }
    this.items$.set(actuales);
    this.mostrarAviso(`${producto.nombre} se agregó al carrito`);
  }

  cambiarCantidad(productoId: number, cantidad: number): void {
    this.items$.set(
      this.items$()
        .map(i => (i.producto.id === productoId ? { ...i, cantidad } : i))
        .filter(i => i.cantidad > 0)
    );
  }

  quitar(productoId: number): void {
    this.items$.set(this.items$().filter(i => i.producto.id !== productoId));
  }

  vaciar(): void {
    this.items$.set([]);
  }

  cerrarAviso(): void {
    this.aviso$.set(null);
    if (this.temporizadorAviso) {
      clearTimeout(this.temporizadorAviso);
      this.temporizadorAviso = undefined;
    }
  }

  private mostrarAviso(mensaje: string): void {
    this.aviso$.set(mensaje);
    if (this.temporizadorAviso) { clearTimeout(this.temporizadorAviso); }
    this.temporizadorAviso = setTimeout(() => this.aviso$.set(null), 3200);
  }
}
