import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../posts/api.service';
import { Organizacion } from '../models/organizacion.model';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';


@Component({
  selector: 'app-organizacion-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './organizacion-list.html',
  styleUrls: ['./organizacion-list.css'],
})
export class OrganizacionList implements OnInit {
  organizaciones: Organizacion[] = [];
  organizacionesFiltradas: Organizacion[] = [];
  searchControl = new FormControl('');
  loading = true;
  errorMsg = '';
  // Variable para controlar la visibilidad del formulario
  mostrarForm = false;
  organizacionForm!: FormGroup;
  editando = false;
organizacionEditId: string | null = null;

  constructor(private api: ApiService, private fb: FormBuilder, private cdr: ChangeDetectorRef, private dialog: MatDialog) {
    this.organizacionForm = this.fb.group({
      nombre: ['', Validators.required],
    });

    this.searchControl = new FormControl('');
  }

  //Función: leer
  ngOnInit(): void {
    this.load();

    this.searchControl.valueChanges.subscribe(value => {
      const term = value?.toLowerCase() ?? '';
  
      this.organizacionesFiltradas = this.organizaciones.filter(org =>
        org.name.toLowerCase().includes(term)
      );
    });
  }

  load(): void {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.api.getOrganizaciones().subscribe({
      next: (res) => {
        this.organizaciones = res?.organizaciones ?? [];
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

  trackById(_index: number, org: Organizacion): string {
    return org._id;
  }

  //Función: crear
  mostrarFormulario(): void {
  this.mostrarForm = true;
}
editar(org: Organizacion): void {
  this.mostrarForm = true;
  this.editando = true;
  this.organizacionEditId = org._id;

  this.organizacionForm.patchValue({
    nombre: org.name
  });
}


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
