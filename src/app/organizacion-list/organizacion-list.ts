import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizacionService } from '../services/organizacion.service';
import { UsuarioService } from '../services/usuario.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Organizacion } from '../models/organizacion.model';
import { Usuario } from '../models/usuario.model';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl, FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';


@Component({
  selector: 'app-organizacion-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, FormsModule],
  templateUrl: './organizacion-list.html',
  styleUrls: ['./organizacion-list.css'],
})
export class OrganizacionList implements OnInit {
  organizaciones: Organizacion[] = [];
  organizacionesFiltradas: Organizacion[] = [];
  usuariosDisponibles: Usuario[] = [];
  usuarioSeleccionado: string = '';
  searchControl = new FormControl('');
  loading = true;
  errorMsg = '';
  syncErrorMsg = '';
  mostrarForm = false;
  organizacionForm!: FormGroup;
  editando = false;
  organizacionEditId: string | null = null;
  expanded: { [key: string]: boolean } = {};
  detalleVisible: { [key: string]: boolean } = {};
  limite = 10;
  mostrarTodasOrganizaciones = false;
  
  constructor(private api: OrganizacionService, private usuarioApi: UsuarioService, private fb: FormBuilder, private cdr: ChangeDetectorRef, private dialog: MatDialog) {
    this.organizacionForm = this.fb.group({
      nombre: ['', Validators.required],
    });

    this.searchControl = new FormControl('');
  }

  ngOnInit(): void {
    this.load();
    this.loadUsuariosDisponibles();

    this.searchControl.valueChanges.subscribe(value => {
      const term = value?.toLowerCase() ?? '';
      this.organizacionesFiltradas = this.organizaciones.filter(org =>
        org.name.toLowerCase().includes(term)
      );
    });
  }

  loadUsuariosDisponibles(): void {
    this.usuarioApi.getUsuarios().subscribe({
      next: (res) => {
        this.usuariosDisponibles = res;
      },
      error: () => {
        this.syncErrorMsg = 'No se han podido cargar los usuarios.';
      }
    });
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.api.getOrganizaciones().subscribe({
      next: (res) => {
        this.organizaciones = res;
        this.organizacionesFiltradas = [...this.organizaciones];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMsg = 'No se han podido cargar las organizaciones.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  //Función: trackBy para optimizar el ngFor
  trackById(_index: number, org: Organizacion): string {
    return org._id;
  }

  //Función: mostrar formulario
  mostrarFormulario(): void {
    this.mostrarForm = true;
  }

  //Función: mostrar más organizaciones
  mostrarMas(): void {
    this.mostrarTodasOrganizaciones = true;
  } 

  get organizacionesVisibles(): Organizacion[] {
    if (this.mostrarTodasOrganizaciones) {
      return this.organizacionesFiltradas;
    }
    return this.organizacionesFiltradas.slice(0, this.limite);
  }

  //Función: editar organización
  editar(org: Organizacion): void {
    this.mostrarForm = true;
    this.editando = true;
    this.organizacionEditId = org._id;

    this.organizacionForm.patchValue({
      nombre: org.name
    });
  }

  //Función: guardar organización (crear o actualizar)
  guardar(): void {

    if (this.organizacionForm.invalid) return;

    const nombre = this.organizacionForm.value.nombre;

    if (this.editando && this.organizacionEditId) {

      // UPDATE
      this.api.updateOrganizacion(this.organizacionEditId, nombre)
        .subscribe({
          next: () => {
            this.resetForm();
            this.load();
          },
          error: () => {
            this.errorMsg = 'No se ha podido actualizar la organización.';
          }
        });

    } else {

      // CREATE
      this.api.createOrganizacion(nombre)
        .subscribe({
          next: () => {
            this.resetForm();
            this.load();
          },
          error: () => {
            this.errorMsg = 'No se ha podido crear la organización.';
          }
        });
    }
  }

  asignarUsuario(usuarioId: string, organizacionId: string): void {
    const usuario = this.usuariosDisponibles.find(u => u._id === usuarioId);
    if (!usuario || !usuarioId) return;

    this.syncErrorMsg = '';
    this.usuarioApi.updateUsuario(usuarioId, usuario.name, usuario.email, usuario.password || '', organizacionId).subscribe({
      next: () => {
        this.usuarioSeleccionado = '';
        this.load();
        this.loadUsuariosDisponibles();
      },
      error: () => {
        this.syncErrorMsg = 'No se ha podido asignar el usuario.';
        this.cdr.markForCheck();
      }
    });
  }

  desasignarUsuario(usuarioId: string, organizacionId: string): void {
    this.syncErrorMsg = '';
    this.usuarioApi.removeOrganization(usuarioId).subscribe({
      next: () => {
        this.load();
        this.loadUsuariosDisponibles();
      },
      error: (err: HttpErrorResponse) => {
        const backendMsg = err?.error?.message || err?.message || 'Error desconocido';
        this.syncErrorMsg = `No se ha podido desasignar el usuario. (${err.status}) ${backendMsg}`;
        this.cdr.markForCheck();
      }
    });
  }

  //estado de expansión para mostrar el nombre completo
  toggleExpand(id: string): void {
    this.expanded[id] = !this.expanded[id];
  }

  toggleDetalle(id: string): void {
    this.detalleVisible[id] = !this.detalleVisible[id];
  }

  //Función: resetear formulario
  resetForm(): void {
    this.mostrarForm = false;
    this.editando = false;
    this.organizacionEditId = null;
    this.organizacionForm.reset();
  }

  //Update: editar nombre de la organización
  editOrganizacion(org: Organizacion) {

    const nuevoNombre = prompt('Nuevo nombre:', org.name);

    if (nuevoNombre && nuevoNombre.trim() !== '') {

      this.api.updateOrganizacion(org._id, nuevoNombre)
        .subscribe(() => {

          // actualizar vista sin recargar
          org.name = nuevoNombre;

        });
    }
  }

  //Función: confirmar eliminación
  confirmDelete(id: string, name?: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: name
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.delete(id);
      }
    });
  }

  //Función: eliminar organización
  delete(id: string): void {
    this.errorMsg = '';
    this.loading = true;

    this.api.deleteOrganizacion(id).subscribe({
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
