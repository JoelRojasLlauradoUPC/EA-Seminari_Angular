import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Organizacion } from '../../models/organizacion.model';

@Component({
  selector: 'app-organizacion-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './organizacion-actions.component.html',
  styleUrl: './organizacion-actions.component.css',
})
export class OrganizacionActionsComponent {
  readonly organizacion = input.required<Organizacion>();
  readonly isAdmin = input(false);
  readonly expanded = input(false);

  readonly toggleExpand = output<void>();
  readonly toggleDetail = output<void>();
  readonly edit = output<void>();
  readonly delete = output<void>();

  onToggleExpand(): void {
    this.toggleExpand.emit();
  }

  onToggleDetail(): void {
    this.toggleDetail.emit();
  }

  onEdit(): void {
    this.edit.emit();
  }

  onDelete(): void {
    this.delete.emit();
  }
}
