import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Header } from '../../../../shared/header/header';
import { Footer } from '../../../../shared/footer/footer';
import { UsuarioService } from '../../../../core/services/usuario';
import { UsuarioResponse } from '../../../../core/models/usuario';

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
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  usuario = signal<UsuarioResponse | null>(null);
  carregando = signal(true);
  erro = signal(false);

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

  valor(key: keyof UsuarioResponse): string {
    const v = this.usuario()?.[key];
    if (v === null || v === undefined || v === '') return '-';
    if (key === 'tipoUsuario') return TIPOS_USUARIO[String(v)] ?? String(v);
    if (typeof v === 'boolean') return v ? 'Ativo' : 'Inativo';
    return String(v);
  }
}
