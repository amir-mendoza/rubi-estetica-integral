import { Component, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ESPECIALISTAS, LOCALES, PRODUCTOS, TRATAMIENTOS, soles } from '../../data/datos';
import { PromoCarruselComponent } from './promo-carrusel.component';
import { RedesEnlacesComponent } from '../../compartido/redes-enlaces.component';
import { ConfiguracionPanelService } from '../../compartido/configuracion-panel.service';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, PromoCarruselComponent, RedesEnlacesComponent],
  templateUrl: './inicio.component.html',
  changeDetection: ChangeDetectionStrategy.Default,
  styleUrl: './inicio.component.scss'
})
export class InicioComponent {
  private configPanel = inject(ConfiguracionPanelService);
  soles = soles;
  destacados = TRATAMIENTOS.filter(t => t.destacado).slice(0, 6);
  especialistas = ESPECIALISTAS.slice(0, 4);
  productos = PRODUCTOS.slice(0, 4);
  locales = computed(() => this.configPanel.combinarLocalesConHorarios(LOCALES));

  pilares = [
    {
      titulo: 'Diagnóstico personalizado',
      texto: 'Cada tratamiento inicia con una evaluación de la piel y un plan diseñado para tu caso.'
    },
    {
      titulo: 'Tecnología certificada',
      texto: 'Equipos de aparatología de última generación con mantenimiento y protocolos verificados.'
    },
    {
      titulo: 'Profesionales colegiadas',
      texto: 'Cosmiatras y médico estético con colegiatura vigente y formación continua.'
    },
    {
      titulo: 'Seguimiento post sesión',
      texto: 'Indicaciones de cuidado en casa y control de resultados en cada visita.'
    }
  ];

  pasos = [
    { n: '01', titulo: 'Elige tu sede', texto: 'Las Flores de Primavera 1522 o 1544, según te quede más cerca.' },
    { n: '02', titulo: 'Elige el tratamiento', texto: 'Verás la duración real y el precio antes de continuar.' },
    { n: '03', titulo: 'Elige el día y la hora de llegada', texto: 'Elige una hora dentro del horario de atención de la sede; cada bloque recibe hasta 10 pacientes.' },
    { n: '04', titulo: 'Confirma y paga', texto: 'Paga en línea con Izipay o reserva y paga en el local.' }
  ];

  testimonios = [
    {
      texto: 'Llegué con manchas y marcas de acné. Después de tres sesiones mi piel cambió por completo y me explicaron todo el proceso con claridad.',
      autor: 'Rosa H.',
      detalle: 'Peeling facial · Sede Las Flores 1522'
    },
    {
      texto: 'El HIFU me dio el efecto lifting que buscaba sin cirugía. La atención fue puntual y muy profesional.',
      autor: 'Verónica A.',
      detalle: 'HIFU 25D · Sede Las Flores 1522'
    },
    {
      texto: 'Reservé desde el celular en dos minutos y me llegó la confirmación al instante. Excelente organización.',
      autor: 'Fiorella C.',
      detalle: 'Limpieza facial profunda · Sede Las Flores 1544'
    }
  ];
}
