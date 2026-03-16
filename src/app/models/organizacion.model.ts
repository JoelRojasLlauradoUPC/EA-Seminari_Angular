import type { Usuario } from './usuario.model';

//TASCA 1: afegim els usuaris a l'organització (array de tipus Usuario)
export interface Organizacion {
  _id: string;
  name: string;
  usuarios: Usuario[];
}