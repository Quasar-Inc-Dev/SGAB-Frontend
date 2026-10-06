import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { auth } from '../../../../core/auth/auth';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(auth);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required]]
  });

  senhaVisivel = signal(false);
  enviando = signal(false);
  erroLogin = signal('');

  toggleSenhaVisivel() {
    this.senhaVisivel.update(v => !v);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, senha } = this.form.getRawValue();
    this.erroLogin.set('');
    this.enviando.set(true);

    this.auth.login(email!, senha!).subscribe({
      next: () => this.router.navigateByUrl('/home'),
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.erroLogin.set(err.error?.mensagem ?? 'Não foi possível entrar. Verifique suas credenciais.');
      }
    });
  }
}
