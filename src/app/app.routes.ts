import { Routes } from '@angular/router';
import { OrganizacionList } from './features/organizaciones/organizacion-list/organizacion-list';
import { UsuarioListPageComponent } from './features/usuarios/usuario-list/usuario-list.page';
import { LoginComponent } from './features/auth/login/login.component';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: OrganizacionList, canActivate: [authGuard] },
  { path: 'usuarios', component: UsuarioListPageComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'home' },
];