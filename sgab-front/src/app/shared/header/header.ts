import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { auth } from '../../core/auth/auth';

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
  menuLivrosAberto = signal(false);
  menuNavUsuarioAberto = signal(false);
  menuUsuarioAberto = signal(false);

  toggleMenuMobile() {
    this.menuMobileAberto.update(v => !v);
  }

  toggleMenuLivros() {
    this.menuLivrosAberto.update(v => !v);
  }

  toggleMenuNavUsuario() {
    this.menuNavUsuarioAberto.update(v => !v);
  }

  toggleMenuUsuario() {
    this.menuUsuarioAberto.update(v => !v);
  }

  fecharMenus() {
    this.menuMobileAberto.set(false);
    this.menuLivrosAberto.set(false);
    this.menuNavUsuarioAberto.set(false);
    this.menuUsuarioAberto.set(false);
  }

  sair() {
    this.auth.logout();
    this.fecharMenus();
    this.router.navigateByUrl('/');
  }
}
