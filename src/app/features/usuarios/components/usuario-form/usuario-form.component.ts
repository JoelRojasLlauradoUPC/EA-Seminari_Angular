import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Organizacion } from '../../../../models/organizacion.model';

@Component({
  selector: 'app-usuario-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuario-form.component.html',
  styleUrl: './usuario-form.component.css',
})
export class UsuarioFormComponent {
  readonly form = input.required<FormGroup>();
  readonly organizaciones = input<Organizacion[]>([]);
  readonly editando = input(false);

  readonly save = output<void>();
  readonly cancel = output<void>();

  submit(): void {
    this.save.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
