import type { Usuario } from './usuario.model';

export interface Organizacion {
  _id: string;
  name: string;
  usuarios: Usuario[];
}