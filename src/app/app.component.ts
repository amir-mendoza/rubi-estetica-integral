import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MarcaService } from './compartido/marca.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private marca = inject(MarcaService);
  title = 'rubi-prototipo';
}
