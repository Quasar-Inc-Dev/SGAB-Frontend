import { Routes } from '@angular/router';
import { LoginPage } from './features/auth/pages/login-page/login-page';
import { TelaHome } from './features/auth/pages/tela-home/tela-home';
import { MostrarLivros } from './features/auth/pages/mostrar-livros/mostrar-livros';
import { CadastrarLivro } from './features/auth/pages/cadastrar-livro/cadastrar-livro';
import { VisualizarLivro } from './features/auth/pages/visualizar-livro/visualizar-livro';
import { MeusDados } from './features/auth/pages/meus-dados/meus-dados';
import { CadastroUsuario } from './features/auth/pages/cadastro-usuario/cadastro-usuario';
import { CadastrarUsuario } from './features/auth/pages/cadastrar-usuario/cadastrar-usuario';
import { authGuard } from './core/guards/auth-guards';

export const routes: Routes = [
    {path: '',component: LoginPage},
    {path: 'cadastro',component: CadastroUsuario},
    {path: 'home',component: TelaHome, canActivate: [authGuard]},
    {path: 'mostrar-livros', component: MostrarLivros, canActivate: [authGuard]},
    {path: 'cadastrar-livro', component: CadastrarLivro, canActivate: [authGuard]},
    {path: 'livro/:id', component: VisualizarLivro, canActivate: [authGuard]},
    {path: 'meus-dados', component: MeusDados, canActivate: [authGuard]},
    {path: 'usuarios/cadastro', component: CadastrarUsuario, canActivate: [authGuard]}
];

