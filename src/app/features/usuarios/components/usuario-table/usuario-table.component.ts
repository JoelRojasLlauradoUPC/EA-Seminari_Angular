import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { Organizacion } from '../../../../models/organizacion.model';
import { Usuario } from '../../../../models/usuario.model';

@Component({
  selector: 'app-usuario-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './usuario-table.component.html',
  styleUrl: './usuario-table.component.css',
})
export class UsuarioTableComponent {
  readonly usuarios = input<Usuario[]>([]);
  readonly isAdmin = input(false);
  readonly currentUserId = input<string | null>(null);

  readonly edit = output<Usuario>();
  readonly delete = output<Usuario>();
  readonly adminToggle = output<{ user: Usuario; checked: boolean }>();

  organizacionLabel(u: Usuario): string {
    const org = u.organizacion;
    if (!org) return '-';
    if (typeof org === 'string') return org;
    return (org as Organizacion).name ?? '-';
  }

  canModify(userId: string): boolean {
    if (this.isAdmin()) {
      return true;
    }

    return !!this.currentUserId() && this.currentUserId() === userId;
  }

  isUserAdmin(user: Usuario): boolean {
    return (user.roles ?? []).includes('admin');
  }

  canToggleAdmin(user: Usuario): boolean {
    if (!this.isAdmin()) {
      return false;
    }

    const isCurrentUser = this.currentUserId() === user._id;
    if (isCurrentUser && this.isUserAdmin(user)) {
      return false;
    }

    return true;
  }

  onEdit(user: Usuario): void {
    this.edit.emit(user);
  }

  onDelete(user: Usuario): void {
    this.delete.emit(user);
  }

  onToggleAdmin(user: Usuario, checked: boolean): void {
    if (!this.canToggleAdmin(user)) {
      return;
    }

    this.adminToggle.emit({ user, checked });
  }
}
