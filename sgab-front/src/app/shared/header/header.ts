import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { auth } from '../../core/auth/auth';

type Menu = 'livros' | 'navUsuario' | 'usuario';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  auth = inject(auth);
  private router = inject(Router);

  menuMobileAberto = signal(false);

  // Só um dropdown aberto por vez: abrir um fecha o outro
  private menuAberto = signal<Menu | null>(null);
  menuLivrosAberto = computed(() => this.menuAberto() === 'livros');
  menuNavUsuarioAberto = computed(() => this.menuAberto() === 'navUsuario');
  menuUsuarioAberto = computed(() => this.menuAberto() === 'usuario');

  toggleMenuMobile() {
    this.menuMobileAberto.update(v => !v);
    this.menuAberto.set(null);
  }

  toggleMenuLivros() {
    this.alternar('livros');
  }

  toggleMenuNavUsuario() {
    this.alternar('navUsuario');
  }

  toggleMenuUsuario() {
    this.alternar('usuario');
    this.menuMobileAberto.set(false);
  }

  fecharMenus() {
    this.menuMobileAberto.set(false);
    this.menuAberto.set(null);
  }

  private alternar(menu: Menu) {
    this.menuAberto.update(atual => (atual === menu ? null : menu));
  }

  sair() {
    this.auth.logout();
    this.fecharMenus();
    this.router.navigateByUrl('/');
  }
}
