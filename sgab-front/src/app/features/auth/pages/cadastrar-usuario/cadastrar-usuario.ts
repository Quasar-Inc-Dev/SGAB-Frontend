import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Header } from '../../../../shared/header/header';
import { Footer } from '../../../../shared/footer/footer';
import { UsuarioService } from '../../../../core/services/usuario';

function senhasIguaisValidator(control: AbstractControl): ValidationErrors | null {
  const senha = control.get('senha')?.value;
  const confirmarSenha = control.get('confirmarSenha')?.value;
  return senha === confirmarSenha ? null : { senhasDiferentes: true };
}

@Component({
  selector: 'app-cadastrar-usuario',
  imports: [ReactiveFormsModule, Header, Footer],
  templateUrl: './cadastrar-usuario.html',
  styleUrl: './cadastrar-usuario.scss',
})
export class CadastrarUsuario {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    cpf: ['', [Validators.required, Validators.pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)]],
    dataNascimento: ['', Validators.required],
    genero: ['', Validators.required],
    tipoLeitor: ['', Validators.required],
    senha: ['', [Validators.required, Validators.minLength(6)]],
    confirmarSenha: ['', Validators.required],
  }, { validators: senhasIguaisValidator });

  senhaVisivel = signal(false);
  enviando = signal(false);
  erroCadastro = signal('');
  sucesso = signal(false);

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

  cancelar() {
    this.router.navigateByUrl('/home');
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.erroCadastro.set('');
    this.sucesso.set(false);

    const { confirmarSenha, ...dados } = this.form.getRawValue();

    this.usuarioService.cadastrarLeitor({ ...dados, cpf: dados.cpf.replace(/\D/g, '') }).subscribe({
      next: () => {
        this.enviando.set(false);
        this.sucesso.set(true);
        this.form.reset();
      },
      error: (err: HttpErrorResponse) => {
        this.enviando.set(false);
        this.erroCadastro.set(err.error?.mensagem ?? 'Não foi possível concluir o cadastro.');
      },
    });
  }
}
