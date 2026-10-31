import { Routes } from '@angular/router';
import { LoginPage } from './features/auth/pages/login-page/login-page';
import { TelaHome } from './features/auth/pages/tela-home/tela-home';
import { MostrarLivros } from './features/auth/pages/mostrar-livros/mostrar-livros';
import { CadastrarLivro } from './features/auth/pages/cadastrar-livro/cadastrar-livro';
import { VisualizarLivro } from './features/auth/pages/visualizar-livro/visualizar-livro';
import { MeusDados } from './features/auth/pages/meus-dados/meus-dados';
import { CadastroUsuario } from './features/auth/pages/cadastro-usuario/cadastro-usuario';
import { CadastrarUsuario } from './features/auth/pages/cadastrar-usuario/cadastrar-usuario';
import { Solicitacoes } from './features/auth/pages/solicitacoes/solicitacoes';
import { MinhasSolicitacoes } from './features/auth/pages/minhas-solicitacoes/minhas-solicitacoes';
import { ListarUsuarios } from './features/auth/pages/listar-usuarios/listar-usuarios';
import { RedefinirSenha } from './features/auth/pages/redefinir-senha/redefinir-senha';
import { authGuard, funcionarioGuard, leitorGuard } from './core/guards/auth-guards';

export const routes: Routes = [
    {path: '',component: LoginPage},
    {path: 'cadastro',component: CadastroUsuario},
    {path: 'redefinir-senha', component: RedefinirSenha},
    {path: 'home',component: TelaHome, canActivate: [authGuard]},
    {path: 'mostrar-livros', component: MostrarLivros, canActivate: [authGuard]},
    {path: 'cadastrar-livro', component: CadastrarLivro, canActivate: [authGuard]},
    {path: 'livro/:id', component: VisualizarLivro, canActivate: [authGuard]},
    {path: 'meus-dados', component: MeusDados, canActivate: [authGuard]},
    {path: 'usuarios', component: ListarUsuarios, canActivate: [authGuard, funcionarioGuard]},
    {path: 'usuarios/cadastro', component: CadastrarUsuario, canActivate: [authGuard]},
    {path: 'solicitacoes', component: Solicitacoes, canActivate: [authGuard, funcionarioGuard]},
    {path: 'minhas-solicitacoes', component: MinhasSolicitacoes, canActivate: [authGuard, leitorGuard]}
];

