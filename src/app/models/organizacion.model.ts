import type { Usuario } from './usuario.model';

export interface Organizacion {
  _id: string;
  name: string;
  usuarios: Usuario[];
}
//TASCA 1: afegim els usuaris a l'organització (array de tipus Usuario)