import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Header } from '../../../../shared/header/header';
import { Footer } from '../../../../shared/footer/footer';
import { UsuarioService } from '../../../../core/services/usuario';
import { UsuarioResponse } from '../../../../core/models/usuario';
import { HttpErrorResponse } from '@angular/common/http';
import { auth } from '../../../../core/auth/auth';
import { mensagemErro } from '../../../../core/utils/mensagem-erro';

interface CampoUsuario {
  key: keyof UsuarioResponse;
  label: string;
}

const TIPOS_USUARIO: Record<string, string> = {
  LEITOR: 'Leitor',
  FUNCIONARIO: 'Funcionário',
  ADMINISTRADOR: 'Administrador',
};

@Component({
  selector: 'app-meus-dados',
  imports: [Header, Footer, RouterLink],
  templateUrl: './meus-dados.html',
  styleUrl: './meus-dados.scss',
})
export class MeusDados implements OnInit {
  private usuarioService = inject(UsuarioService);
  private authService = inject(auth);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  usuario = signal<UsuarioResponse | null>(null);
  carregando = signal(true);
  erro = signal(false);

  enviandoRedefinicao = signal(false);
  redefinicaoEnviada = signal(false);
  mensagemRedefinicao = signal<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  readonly campos: CampoUsuario[] = [
    { key: 'nome', label: 'Nome' },
    { key: 'email', label: 'E-mail' },
    { key: 'cpf', label: 'CPF' },
    { key: 'tipoUsuario', label: 'Tipo de usuário' },
    { key: 'statusUsuario', label: 'Status' },
  ];

  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.usuarioService.buscarMeusDados().subscribe({
      next: (usuario) => {
        this.usuario.set(usuario);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false);
      },
    });
  }

  solicitarRedefinicaoSenha(): void {
    const email = this.usuario()?.email;
    if (!email) return;

    this.enviandoRedefinicao.set(true);
    this.mensagemRedefinicao.set(null);

    this.authService.solicitarRedefinicaoSenha(email).subscribe({
      next: () => {
        this.enviandoRedefinicao.set(false);
        this.redefinicaoEnviada.set(true);
        this.mensagemRedefinicao.set({
          tipo: 'sucesso',
          texto: `Enviamos um link para ${email}. Ele vale por 30 minutos; confira também a caixa de spam.`,
        });
      },
      error: (err: HttpErrorResponse) => {
        this.enviandoRedefinicao.set(false);
        this.mensagemRedefinicao.set({ tipo: 'erro', texto: mensagemErro(err, 'Não foi possível enviar o e-mail. Tente novamente.') });
      },
    });
  }

  valor(key: keyof UsuarioResponse): string {
    const v = this.usuario()?.[key];
    if (v === null || v === undefined || v === '') return '-';
    if (key === 'tipoUsuario') return TIPOS_USUARIO[String(v)] ?? String(v);
    if (typeof v === 'boolean') return v ? 'Ativo' : 'Inativo';
    return String(v);
  }
}
