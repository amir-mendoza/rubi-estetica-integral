import { Injectable, signal } from '@angular/core';
import { PEDIDOS } from '../data/datos';
import { Pedido } from '../data/modelos';

function clonarPedido(pedido: Pedido): Pedido {
  return {
    ...pedido,
    items: pedido.items.map(item => ({ ...item }))
  };
}

/**
 * Estado temporal de pedidos para el prototipo. Mantiene sincronizados Pedidos,
 * Pagos, Reportes, Dashboard e historial mientras Angular siga abierto.
 */
@Injectable({ providedIn: 'root' })
export class PedidosService {
  private lista = signal<Pedido[]>(PEDIDOS.map(clonarPedido));

  readonly pedidos = this.lista.asReadonly();

  agregar(pedido: Pedido): void {
    this.lista.update(lista => [clonarPedido(pedido), ...lista]);
  }

  actualizar<K extends keyof Pedido>(id: number, campo: K, valor: Pedido[K]): void {
    this.lista.update(lista => lista.map(pedido =>
      pedido.id === id ? { ...pedido, [campo]: valor } : pedido
    ));
  }

  actualizarCon(id: number, actualizar: (pedido: Pedido) => Pedido): void {
    this.lista.update(lista => lista.map(pedido =>
      pedido.id === id ? clonarPedido(actualizar(clonarPedido(pedido))) : pedido
    ));
  }

  porCodigo(codigo: string): Pedido | undefined {
    return this.lista().find(pedido => pedido.codigo === codigo);
  }
}
