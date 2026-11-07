package br.unirio.painel.acesso;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import br.unirio.painel.acesso.aplicacao.ServicoDeAutenticacao;
import br.unirio.painel.acesso.aplicacao.ServicoDeUsuarios;
import br.unirio.painel.acesso.dominio.Perfil;
import br.unirio.painel.acesso.dominio.Usuario;
import br.unirio.painel.apoio.FakesEmMemoria;
import br.unirio.painel.compartilhado.ErroDeNegocio;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class GestaoDeContasTest {

    final FakesEmMemoria.Usuarios usuarios = new FakesEmMemoria.Usuarios();
    final FakesEmMemoria.CodificadorFalso codificador = new FakesEmMemoria.CodificadorFalso();
    final ServicoDeUsuarios servico = new ServicoDeUsuarios(usuarios, codificador);
    final ServicoDeAutenticacao autenticacao = new ServicoDeAutenticacao(usuarios, codificador, FakesEmMemoria.relogioFixo());

    final Usuario admin;
    final Usuario professor;
    final Usuario aluno;

    GestaoDeContasTest() {
        servico.criarAdministradorInicialSeNecessario("coord", "Coordenação", "senha-admin-123");
        admin = usuarios.buscarPorLogin("coord").orElseThrow();
        professor = servico.criar("prof.ana", "Ana Prof", "senha-prof-123", Perfil.PROFESSOR, null);
        aluno = servico.criar(null, "Bruno Aluno", "senha-aluno-123", Perfil.ALUNO, "2026 100.102");
    }

    @Test
    @DisplayName("estudante: matrícula obrigatória, só dígitos, vira o login; nome obrigatório")
    void matriculaComoLogin() {
        assertEquals("2026100102", aluno.login());
        assertEquals("2026100102", aluno.matricula());
        assertEquals("2026100102 · Bruno Aluno", aluno.identificacao());
        assertEquals("matricula_obrigatoria",
                assertThrows(ErroDeNegocio.class, () -> servico.criar("x", "Sem Matrícula", "senha-aluno-123", Perfil.ALUNO, " ")).codigo());
        assertEquals("matricula_invalida",
                assertThrows(ErroDeNegocio.class, () -> servico.criar(null, "Letras", "senha-aluno-123", Perfil.ALUNO, "ABC123")).codigo());
        assertEquals("nome_invalido",
                assertThrows(ErroDeNegocio.class, () -> servico.criar(null, "  ", "senha-aluno-123", Perfil.ALUNO, "2026100199")).codigo());
        assertEquals("matricula_em_uso",
                assertThrows(ErroDeNegocio.class, () -> servico.criar(null, "Outro", "senha-aluno-123", Perfil.ALUNO, "2026100102")).codigo());
        autenticacao.autenticar("2026100102", "senha-aluno-123");
    }

    @Test
    @DisplayName("somente a administração ativa, desativa e apaga contas")
    void somenteAdministracao() {
        assertEquals("somente_administracao",
                assertThrows(ErroDeNegocio.class, () -> servico.definirAtivo(professor.id(), aluno.id(), false)).codigo());
        assertEquals("somente_administracao",
                assertThrows(ErroDeNegocio.class, () -> servico.excluir(professor.id(), aluno.id())).codigo());
        assertEquals("propria_conta",
                assertThrows(ErroDeNegocio.class, () -> servico.definirAtivo(admin.id(), admin.id(), false)).codigo());
    }

    @Test
    @DisplayName("conta desativada não entra e perde a sessão; reativar devolve o acesso")
    void desativar() {
        servico.definirAtivo(admin.id(), aluno.id(), false);
        assertFalse(servico.contaAtiva(aluno.id()));
        assertThrows(ErroDeNegocio.class, () -> autenticacao.autenticar("2026100102", "senha-aluno-123"));
        servico.definirAtivo(admin.id(), aluno.id(), true);
        assertTrue(servico.contaAtiva(aluno.id()));
        autenticacao.autenticar("2026100102", "senha-aluno-123");
    }

    @Test
    @DisplayName("apagar remove a conta (e a sessão deixa de valer)")
    void apagar() {
        servico.excluir(admin.id(), professor.id());
        assertTrue(usuarios.buscarPorId(professor.id()).isEmpty());
        assertFalse(servico.contaAtiva(professor.id()));
        assertEquals("usuario_nao_encontrado",
                assertThrows(ErroDeNegocio.class, () -> servico.excluir(admin.id(), professor.id())).codigo());
    }

    @Test
    @DisplayName("ADMIN_LOGIN vira administração só se ainda não houver uma")
    void garantirAdministrador() {
        assertFalse(servico.garantirAdministrador("prof.ana"));
        FakesEmMemoria.Usuarios outro = new FakesEmMemoria.Usuarios();
        ServicoDeUsuarios s2 = new ServicoDeUsuarios(outro, codificador);
        s2.criar("chefe", "Chefe", "senha-chefe-123", Perfil.PROFESSOR, null);
        assertTrue(s2.garantirAdministrador("chefe"));
        assertTrue(outro.buscarPorLogin("chefe").orElseThrow().administrador());
    }
}
