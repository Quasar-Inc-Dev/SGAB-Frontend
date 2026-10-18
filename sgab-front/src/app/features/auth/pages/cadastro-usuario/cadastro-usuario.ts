import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { UsuarioService } from '../../../../core/services/usuario';

function senhasIguaisValidator(control: AbstractControl): ValidationErrors | null {
  const senha = control.get('senha')?.value;
  const confirmarSenha = control.get('confirmarSenha')?.value;
  return senha === confirmarSenha ? null : { senhasDiferentes: true };
}

@Component({
  selector: 'app-cadastro-usuario',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cadastro-usuario.html',
  styleUrl: './cadastro-usuario.scss',
})
export class CadastroUsuario {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    cpf: ['', Validators.required],
    dataNascimento: ['', Validators.required],
    genero: ['', Validators.required],
    tipoLeitor: ['', Validators.required],
    senha: ['', [Validators.required, Validators.minLength(6)]],
    confirmarSenha: ['', Validators.required],
  }, { validators: senhasIguaisValidator });

  senhaVisivel = signal(false);
  enviando = signal(false);
  erroCadastro = signal('');

  readonly generos = [
    { valor: 'MASCULINO', label: 'Masculino' },
    { valor: 'FEMININO', label: 'Feminino' },
  ];

  readonly tiposLeitor = [
    { valor: 'LEITOR', label: 'Leitor' },
    { valor: 'PROFESSOR', label: 'Professor' },
  ];

  toggleSenhaVisivel() {
    this.senhaVisivel.update(v => !v);
  }

  formatarCpf(event: Event) {
    const digitos = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11);
    let formatado = digitos;
    if (digitos.length > 9) formatado = `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
    else if (digitos.length > 6) formatado = `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
    else if (digitos.length > 3) formatado = `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
    this.form.controls.cpf.setValue(formatado);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.erroCadastro.set('');

    const { confirmarSenha, ...dados } = this.form.getRawValue();

    this.usuarioService.cadastrarLeitor(dados).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.erroCadastro.set(err.error?.mensagem ?? 'Não foi possível concluir o cadastro.');
      },
    });
  }
}
