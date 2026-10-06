import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { auth } from '../../core/auth/auth';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  auth = inject(auth);
  menuMobileAberto = signal(false);
  menuLivrosAberto = signal(false);

  toggleMenuMobile() {
    this.menuMobileAberto.update(v => !v);
  }

  toggleMenuLivros() {
    this.menuLivrosAberto.update(v => !v);
  }

  fecharMenus() {
    this.menuMobileAberto.set(false);
    this.menuLivrosAberto.set(false);
  }
}
