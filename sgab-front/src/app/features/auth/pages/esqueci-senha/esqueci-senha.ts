import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { auth } from '../../../../core/auth/auth';
import { mensagemErro } from '../../../../core/utils/mensagem-erro';

@Component({
  selector: 'app-esqueci-senha',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './esqueci-senha.html',
  styleUrl: './esqueci-senha.scss',
})
export class EsqueciSenha {
  private fb = inject(FormBuilder);
  private authService = inject(auth);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  enviando = signal(false);
  enviado = signal(false);
  erro = signal('');

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.erro.set('');

    // O back responde 200 com a mesma mensagem exista o e-mail ou não (para não revelar quem tem conta)
    this.authService.solicitarRedefinicaoSenha(this.form.getRawValue().email.trim()).subscribe({
      next: () => {
        this.enviando.set(false);
        this.enviado.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.erro.set(mensagemErro(err, 'Não foi possível enviar o e-mail. Tente novamente.'));
      },
    });
  }
}
