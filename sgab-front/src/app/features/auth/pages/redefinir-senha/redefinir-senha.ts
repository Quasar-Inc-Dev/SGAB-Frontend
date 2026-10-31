import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { auth } from '../../../../core/auth/auth';
import { mensagemErro } from '../../../../core/utils/mensagem-erro';

// Mesma regra do @ValidSenha do back
const SENHA_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

function senhasIguaisValidator(control: AbstractControl): ValidationErrors | null {
  const senha = control.get('novaSenha')?.value;
  const confirmarSenha = control.get('confirmarSenha')?.value;
  return senha === confirmarSenha ? null : { senhasDiferentes: true };
}

@Component({
  selector: 'app-redefinir-senha',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './redefinir-senha.html',
  styleUrl: './redefinir-senha.scss',
})
export class RedefinirSenha {
  private fb = inject(FormBuilder);
  private authService = inject(auth);

  readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token');

  form = this.fb.nonNullable.group({
    novaSenha: ['', [Validators.required, Validators.pattern(SENHA_REGEX)]],
    confirmarSenha: ['', Validators.required],
  }, { validators: senhasIguaisValidator });

  senhaVisivel = signal(false);
  enviando = signal(false);
  sucesso = signal(false);
  erro = signal('');

  toggleSenhaVisivel(): void {
    this.senhaVisivel.update(v => !v);
  }

  onSubmit(): void {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.erro.set('');

    this.authService.redefinirSenha(this.token, this.form.getRawValue().novaSenha).subscribe({
      next: () => {
        this.enviando.set(false);
        this.sucesso.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.erro.set(mensagemErro(err, 'Não foi possível redefinir a senha. O link pode ter expirado.'));
      }
    });
  }
}
