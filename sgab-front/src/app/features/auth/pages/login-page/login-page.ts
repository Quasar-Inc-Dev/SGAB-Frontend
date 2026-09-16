import { Component, inject } from '@angular/core';
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

  errorMessage = '';

  onSubmit(){
    if (this.form.invalid) return;
    const {email, senha} = this.form.getRawValue();

    console.log(email, senha);

    this.auth.login(email!, senha!).subscribe({
      // next: () => this.router.navigateByUrl('/home'),
      // error: () => this.errorMessage = 'Email ou senha inválidos'

      next: () => alert('Parabéns! Você entrou no sistema do SGAB!'),
      error: (err: HttpErrorResponse) => {
        alert(err.error?.mensagem ?? 'Erro ao tentar fazer login');
      }
    });
  }
}
