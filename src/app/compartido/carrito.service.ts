import { Injectable, computed, signal } from '@angular/core';
import { Producto } from '../data/modelos';

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

interface EstadoCarritoGuardado {
  items: ItemCarrito[];
  reservadoHasta: number | null;
}

const CLAVE_CARRITO = 'rubi.carrito';
const MINUTOS_RESERVA_CARRITO = 20;

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly items$ = signal<ItemCarrito[]>(this.leer().items);
  private readonly aviso$ = signal<string | null>(null);
  private readonly reservadoHasta$ = signal<number | null>(this.leer().reservadoHasta);
  private temporizadorAviso?: ReturnType<typeof setTimeout>;
  private temporizadorReserva = setInterval(() => this.verificarExpiracion(), 1000);

  readonly items = this.items$.asReadonly();
  readonly aviso = this.aviso$.asReadonly();
  readonly reservadoHasta = this.reservadoHasta$.asReadonly();
  readonly cantidad = computed(() => this.items$().reduce((t, i) => t + i.cantidad, 0));
  readonly subtotal = computed(() => this.items$().reduce((t, i) => t + i.cantidad * i.producto.precio, 0));
  readonly reservaRestanteSeg = computed(() => {
    const hasta = this.reservadoHasta$();
    return hasta ? Math.max(0, Math.ceil((hasta - Date.now()) / 1000)) : 0;
  });

  agregar(producto: Producto, cantidad = 1): void {
    const actuales = [...this.items$()];
    const existente = actuales.find(i => i.producto.id === producto.id);
    if (existente) {
      existente.cantidad = Math.min(existente.cantidad + cantidad, Math.max(producto.stock, 1));
    } else {
      actuales.push({ producto, cantidad });
    }
    this.items$.set(actuales);
    this.renovarReserva();
    this.persistir();
    this.mostrarAviso(`${producto.nombre} se agregó al carrito`);
  }

  cambiarCantidad(productoId: number, cantidad: number): void {
    this.items$.set(
      this.items$()
        .map(i => (i.producto.id === productoId ? { ...i, cantidad } : i))
        .filter(i => i.cantidad > 0)
    );
    if (this.items$().length) {
      this.renovarReserva();
    } else {
      this.reservadoHasta$.set(null);
    }
    this.persistir();
  }

  quitar(productoId: number): void {
    this.items$.set(this.items$().filter(i => i.producto.id !== productoId));
    if (!this.items$().length) {
      this.reservadoHasta$.set(null);
    }
    this.persistir();
  }

  vaciar(): void {
    this.items$.set([]);
    this.reservadoHasta$.set(null);
    this.persistir();
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

  private renovarReserva(): void {
    this.reservadoHasta$.set(Date.now() + MINUTOS_RESERVA_CARRITO * 60_000);
  }

  private verificarExpiracion(): void {
    const hasta = this.reservadoHasta$();
    if (!hasta || this.items$().length === 0 || hasta > Date.now()) {
      return;
    }
    this.items$.set([]);
    this.reservadoHasta$.set(null);
    this.persistir();
    this.mostrarAviso('La reserva del carrito venció y los productos se liberaron automáticamente.');
  }

  private persistir(): void {
    try {
      localStorage.setItem(CLAVE_CARRITO, JSON.stringify({
        items: this.items$(),
        reservadoHasta: this.reservadoHasta$()
      } satisfies EstadoCarritoGuardado));
    } catch {
      // El prototipo no se cae si el navegador bloquea localStorage.
    }
  }

  private leer(): EstadoCarritoGuardado {
    try {
      const guardado = localStorage.getItem(CLAVE_CARRITO);
      if (!guardado) {
        return { items: [], reservadoHasta: null };
      }
      const data = JSON.parse(guardado) as EstadoCarritoGuardado;
      if (!data.reservadoHasta || data.reservadoHasta > Date.now()) {
        return { items: data.items ?? [], reservadoHasta: data.reservadoHasta ?? null };
      }
      return { items: [], reservadoHasta: null };
    } catch {
      return { items: [], reservadoHasta: null };
    }
  }
}
