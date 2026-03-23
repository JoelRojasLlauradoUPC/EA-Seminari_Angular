import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario.model';
import { environment } from '../../environments/environment';
import { Organizacion } from '../models/organizacion.model';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}
  
  //Función: obtener usuarios de la API
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(
      `${this.baseUrl}/usuarios`
    );
  }

  //Función: obtener organizaciones de la API
  getOrganizaciones(): Observable<Organizacion[]> {
    return this.http.get<Organizacion[]>(
      `${this.baseUrl}/organizaciones`
    );
  }

  //Función: obtener un usuario por su ID
  getUsuarioById(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(
      `${this.baseUrl}/usuarios/${id}`
    );
  }

  //Función: crear nuevo usuario
  createUsuario(name: string, email: string, password: string, organizacion: string): Observable<Usuario> {
    return this.http.post<Usuario>(
      `${this.baseUrl}/usuarios`,
      { name, email, password, organizacion }
    );
  }

  //Función: actualizar usuario existente
  updateUsuario(id: string, name: string, email: string, password: string, organizacion: string | null): Observable<Usuario> {
    return this.http.put<Usuario>(
      `${this.baseUrl}/usuarios/${id}`,
      { name, email, password, organizacion: organizacion || '' } 
    );
  }

  //Función: alternar rol admin de un usuario
  toggleUsuarioAdmin(id: string): Observable<Usuario> {
    return this.http.patch<Usuario>(
      `${this.baseUrl}/usuarios/${id}/roles/admin`,
      {}
    );
  }

  //Función: eliminar usuario
  deleteUsuario(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/usuarios/${id}`
    );
  }

  //TASCA 3: desasignar usuari d'una organització
  removeOrganization(id: string): Observable<Usuario> {
    return this.http.put<Usuario>(
      `${this.baseUrl}/usuarios/removeOrganization/${id}`,
      {}
    );
  }
}
