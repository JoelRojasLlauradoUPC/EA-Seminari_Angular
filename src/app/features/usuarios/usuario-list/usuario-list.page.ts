import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UsuarioService } from '../../../services/usuario.service';
import { Usuario } from '../../../models/usuario.model';
import { Organizacion } from '../../../models/organizacion.model';
import { ConfirmDialogComponent } from '../../../confirm-dialog/confirm-dialog';
import { AuthService } from '../../../core/auth/auth.service';
import { UsuarioFormComponent } from '../components/usuario-form/usuario-form.component';
import { UsuarioTableComponent } from '../components/usuario-table/usuario-table.component';

@Component({
  selector: 'app-usuario-list-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UsuarioFormComponent, UsuarioTableComponent],
  templateUrl: './usuario-list.page.html',
  styleUrl: './usuario-list.page.css',
})
export class UsuarioListPageComponent implements OnInit {
  usuarios: Usuario[] = [];
  organizaciones: Organizacion[] = [];
  usuariosFiltrados: Usuario[] = [];

  searchControl = new FormControl('');
  loading = false;
  errorMsg = '';
  permisosMsg = '';

  mostrarForm = false;
  editando = false;
  usuarioEditId: string | null = null;
  currentUserId: string | null = null;

  limite = 10;
  mostrarTodosUsuarios = false;
  soloMiUsuario = false;

  usuarioForm: FormGroup;

  constructor(
    private readonly api: UsuarioService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
    private readonly dialog: MatDialog,
    private readonly auth: AuthService
  ) {
    this.usuarioForm = this.fb.group(
      {
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
        organizacion: ['', Validators.required],
      },
      { validators: this.passwordsMatchValidator }
    );
  }

  ngOnInit(): void {
    this.currentUserId = this.auth.getCurrentUser()?._id ?? null;
    this.hydrateCurrentUserId();
    this.loadUsuarios();
    this.loadOrganizaciones();

    this.searchControl.valueChanges.subscribe((value) => {
      const term = value?.toLowerCase() ?? '';
      this.usuariosFiltrados = this.usuarios.filter((usuario) => usuario.name.toLowerCase().includes(term));
    });
  }

  hydrateCurrentUserId(): void {
    if (this.currentUserId) {
      return;
    }

    this.auth.fetchCurrentUser().subscribe({
      next: (user) => {
        this.currentUserId = user._id;
      },
      error: () => {
        // Keep existing behavior; permission checks will continue based on available auth data.
      },
    });
  }

  passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  loadUsuarios(): void {
    this.loading = true;
    this.errorMsg = '';
    this.permisosMsg = '';
    this.soloMiUsuario = false;
    this.cdr.detectChanges();

    this.api.getUsuarios().subscribe({
      next: (res) => {
        this.usuarios = res;
        this.usuariosFiltrados = [...res];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err instanceof HttpErrorResponse && err.status === 403) {
          this.permisosMsg = 'no tienes permisos para ver ni modificar otros usuarios';
          this.soloMiUsuario = true;
          this.loadSoloMiUsuario();
          return;
        }

        console.error(err);
        this.errorMsg = 'No se han podido cargar los usuarios.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadSoloMiUsuario(): void {
    this.auth.fetchCurrentUser().subscribe({
      next: (user) => {
        this.errorMsg = '';
        this.currentUserId = user._id;
        this.usuarios = [user];
        this.usuariosFiltrados = [user];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'No se ha podido cargar tu usuario.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadOrganizaciones(): void {
    this.api.getOrganizaciones().subscribe({
      next: (res) => {
        this.organizaciones = res;
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  get usuariosVisibles(): Usuario[] {
    if (this.mostrarTodosUsuarios) {
      return this.usuariosFiltrados;
    }

    return this.usuariosFiltrados.slice(0, this.limite);
  }

  mostrarFormulario(): void {
    this.mostrarForm = true;
  }

  mostrarMas(): void {
    this.mostrarTodosUsuarios = true;
  }

  resetForm(): void {
    this.mostrarForm = false;
    this.editando = false;
    this.usuarioEditId = null;
    this.usuarioForm.reset();
  }

  guardar(): void {
    if (this.usuarioForm.invalid) {
      return;
    }

    const { name, email, password, organizacion } = this.usuarioForm.value;

    if (this.editando && this.usuarioEditId) {
      if (!this.puedeModificar(this.usuarioEditId)) {
        this.errorMsg = 'no tienes permisos para ver ni modificar otros usuarios';
        return;
      }

      this.api.updateUsuario(this.usuarioEditId, name, email, password, organizacion).subscribe({
        next: () => {
          this.resetForm();
          this.loadUsuarios();
        },
        error: (err) => {
          console.error(err);
          this.errorMsg = 'No se ha podido actualizar el usuario.';
        },
      });
      return;
    }

    if (this.soloMiUsuario && !this.esAdmin()) {
      this.errorMsg = 'no tienes permisos para ver ni modificar otros usuarios';
      return;
    }

    this.api.createUsuario(name, email, password, organizacion).subscribe({
      next: () => {
        this.resetForm();
        this.loadUsuarios();
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = err?.error?.message ?? 'No se ha podido crear el usuario.';
      },
    });
  }

  editar(user: Usuario): void {
    if (!this.puedeModificar(user._id)) {
      this.errorMsg = 'no tienes permisos para ver ni modificar otros usuarios';
      return;
    }

    this.mostrarForm = true;
    this.editando = true;
    this.usuarioEditId = user._id;

    this.usuarioForm.patchValue({
      name: user.name,
      email: user.email,
      organizacion: typeof user.organizacion === 'string' ? user.organizacion : (user.organizacion as Organizacion)?._id,
    });
  }

  confirmDelete(user: Usuario): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: user.name,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.delete(user._id);
      }
    });
  }

  delete(id: string): void {
    if (!this.puedeModificar(id)) {
      this.errorMsg = 'no tienes permisos para ver ni modificar otros usuarios';
      return;
    }

    this.errorMsg = '';
    this.loading = true;

    this.api.deleteUsuario(id).subscribe({
      next: () => {
        this.auth.clearSessionAndRedirect();
      },
      error: () => {
        this.errorMsg = 'Error delete';
        this.loading = false;
      },
    });
  }

  esAdmin(): boolean {
    return this.auth.hasRole('admin');
  }

  puedeModificar(userId: string): boolean {
    if (this.esAdmin()) {
      return true;
    }

    return !!this.currentUserId && this.currentUserId === userId;
  }

  toggleAdmin(event: { user: Usuario; checked: boolean }): void {
    if (!this.esAdmin()) {
      return;
    }

    if (event.user._id === this.currentUserId && !event.checked) {
      this.errorMsg = 'No puedes quitarte el rol de admin a ti mismo.';
      return;
    }

    this.api.toggleUsuarioAdmin(event.user._id).subscribe({
      next: (updatedUser) => {
        if (updatedUser?.roles) {
          event.user.roles = updatedUser.roles;
          return;
        }

        event.user.roles = event.checked
          ? Array.from(new Set([...(event.user.roles ?? []), 'admin']))
          : (event.user.roles ?? []).filter((role) => role !== 'admin');
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = err?.error?.message ?? 'No se ha podido actualizar el rol de admin.';
      },
    });
  }
}
