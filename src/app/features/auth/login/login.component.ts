import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, timeout } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = false;
  errorMsg = '';

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.loginForm.invalid || this.loading) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    const { email, password } = this.loginForm.getRawValue();

    this.auth
      .login(email, password)
      .pipe(
        timeout(15000),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.errorMsg = this.getLoginErrorMessage(err);
        },
      });
  }

  private getLoginErrorMessage(err: unknown): string {
    const status = this.getStatus(err);
    const backendMessage = this.getBackendErrorText(err);
    const normalizedMessage = backendMessage.toLowerCase();

    const userNotFoundTokens = [
      'no existe',
      'usuario no encontrado',
      'user not found',
      'not found',
      'inexistente',
      'does not exist',
    ];

    const isUserNotFound = userNotFoundTokens.some((token) => normalizedMessage.includes(token));

    if (status === 404 || status === 401 || isUserNotFound) {
      return 'Credenciales invalidos';
    }

    if (typeof backendMessage === 'string' && backendMessage.toLowerCase().includes('timeout')) {
      return 'La peticion tardo demasiado. Intentalo de nuevo.';
    }

    return backendMessage || 'No se ha podido iniciar sesion.';
  }

  private getStatus(err: unknown): number | undefined {
    if (typeof err === 'object' && err !== null && 'status' in err) {
      return (err as { status?: number }).status;
    }

    return undefined;
  }

  private getBackendErrorText(err: unknown): string {
    if (typeof err !== 'object' || err === null) {
      return '';
    }

    const errorContainer = (err as { error?: unknown }).error;
    if (typeof errorContainer === 'string') {
      return errorContainer;
    }

    if (typeof errorContainer === 'object' && errorContainer !== null) {
      const message = (errorContainer as { message?: unknown }).message;
      if (typeof message === 'string') {
        return message;
      }

      const error = (errorContainer as { error?: unknown }).error;
      if (typeof error === 'string') {
        return error;
      }
    }

    const message = (err as { message?: unknown }).message;
    if (typeof message === 'string') {
      return message;
    }

    return '';
  }
}
