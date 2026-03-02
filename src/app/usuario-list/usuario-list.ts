import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../posts/api.service';
import { Usuario } from '../models/usuario.model';
import { Organizacion } from '../models/organizacion.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuario-list.html',
  styleUrls: ['./usuario-list.css'],
})
export class UsuarioList implements OnInit {
  usuarios: Usuario[] = [];
  organizaciones: Organizacion[] = [];
  usuariosFiltrados: Usuario[] = [];
  searchControl = new FormControl('');
  loading = false;
  errorMsg = '';
  mostrarForm = false;
  usuarioForm!: FormGroup;
  editando = false;
  usuarioEditId: string | null = null;

  constructor(private api: ApiService, private fb: FormBuilder, private cdr: ChangeDetectorRef, private dialog: MatDialog) {
    this.usuarioForm = this.fb.group({
      name: ['', Validators.required],
      organizacion: ['', Validators.required],
    });

    this.searchControl = new FormControl('');

  }

  ngOnInit(): void {
    this.load();
    this.loadOrganizaciones();
    
    this.searchControl.valueChanges.subscribe(value => {
      const term = value?.toLowerCase() ?? '';
  
      this.usuariosFiltrados = this.usuarios.filter(org =>
        org.name.toLowerCase().includes(term)
      );
    });
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.api.getUsuarios().subscribe({
      next: (res) => {
        this.usuarios = res?.usuarios ?? [];
        this.usuariosFiltrados = [...this.usuarios];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'No se han podido cargar los usuarios.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  trackById(_index: number, u: Usuario): string {
    return u._id;
  }

  organizacionLabel(u: Usuario): string {
    const org = u.organizacion;
    if (!org) return '-';
    if (typeof org === 'string') return org; 
    return (org as Organizacion).name ?? '-';
  }

   mostrarFormulario(): void {
  this.mostrarForm = true;
}

loadOrganizaciones(): void {
  this.api.getOrganizaciones().subscribe({
    next: (res) => this.organizaciones = res?.organizaciones ?? [],
    error: (err) => console.error(err)
  });
}

guardar(): void {

  if (this.usuarioForm.invalid) return;

  const { name, organizacion } = this.usuarioForm.value;

  if (this.editando && this.usuarioEditId) {

    // UPDATE
    this.api.updateUsuario(this.usuarioEditId, name, organizacion)
      .subscribe({
        next: () => {
          this.resetForm();
          this.load();
        },
        error: (err) => {
          console.error(err);
          this.errorMsg = 'No se ha podido actualizar el usuario.';
        }
      });

  } else {

    // CREATE
    this.api.createUsuario(name, organizacion)
      .subscribe({
        next: () => {
          this.resetForm();
          this.load();
        },
        error: (err) => {
          console.error(err);
          this.errorMsg = 'No se ha podido crear el usuario.';
        }
      });
  }
}
  confirmDelete(id: string, name: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: name
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.delete(id);
      }
    });
  }
editar(user: Usuario): void {
  this.mostrarForm = true;
  this.editando = true;
  this.usuarioEditId = user._id;

  this.usuarioForm.patchValue({
    name: user.name,
    organizacion: typeof user.organizacion === 'string'
      ? user.organizacion
      : (user.organizacion as Organizacion)?._id
  });
}
resetForm(): void {
  this.mostrarForm = false;
  this.editando = false;
  this.usuarioEditId = null;
  this.usuarioForm.reset();
}

  delete(id: string): void {
    this.errorMsg = '';
    this.loading = true;

    this.api.deleteUsuario(id).subscribe({
      next: () => {
        this.load();
      },
      error: () => {
        this.errorMsg = 'Error delete';
        this.loading = false;
      }
    });
  }
}
