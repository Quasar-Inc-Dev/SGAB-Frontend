import { Routes } from '@angular/router';
import { LoginPage } from './features/auth/pages/login-page/login-page';
import { TelaHome } from './features/auth/pages/tela-home/tela-home';
import { MostrarLivros } from './features/auth/pages/mostrar-livros/mostrar-livros';
import { CadastrarLivro } from './features/auth/pages/cadastrar-livro/cadastrar-livro';
import { authGuard } from './core/guards/auth-guards';

export const routes: Routes = [
    {path: '',component: LoginPage},
    {path: 'home',component: TelaHome, canActivate: [authGuard]},
    {path: 'mostrar-livros', component: MostrarLivros, canActivate: [authGuard]},
    {path: 'cadastrar-livro', component: CadastrarLivro, canActivate: [authGuard]}
];

