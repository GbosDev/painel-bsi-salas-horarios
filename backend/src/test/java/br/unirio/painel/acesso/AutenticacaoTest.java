package br.unirio.painel.acesso;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import br.unirio.painel.acesso.aplicacao.ServicoDeAutenticacao;
import br.unirio.painel.acesso.aplicacao.ServicoDeUsuarios;
import br.unirio.painel.acesso.dominio.Perfil;
import br.unirio.painel.acesso.dominio.PoliticaDeSenha;
import br.unirio.painel.acesso.dominio.Usuario;
import br.unirio.painel.apoio.FakesEmMemoria;
import br.unirio.painel.compartilhado.ErroDeNegocio;
import br.unirio.painel.compartilhado.Textos;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class AutenticacaoTest {

    final FakesEmMemoria.Usuarios usuarios = new FakesEmMemoria.Usuarios();
    final FakesEmMemoria.CodificadorFalso codificador = new FakesEmMemoria.CodificadorFalso();
    final ServicoDeUsuarios servicoDeUsuarios = new ServicoDeUsuarios(usuarios, codificador);
    final ServicoDeAutenticacao autenticacao = new ServicoDeAutenticacao(usuarios, codificador, FakesEmMemoria.relogioFixo());

    @Test
    @DisplayName("login correto devolve o usuário; senha nunca é guardada em texto puro")
    void loginCorreto() {
        servicoDeUsuarios.criar(null, "Maria da Silva", "segredo-1234", Perfil.ALUNO, "2026100101");
        Usuario u = autenticacao.autenticar("2026100101", "segredo-1234");
        assertEquals("Maria da Silva", u.nome());
        assertFalse(u.senhaHash().equals("segredo-1234"));
    }

    @Test
    @DisplayName("senha errada e usuário inexistente dão a mesma mensagem")
    void mensagemUnica() {
        servicoDeUsuarios.criar("joao", "João", "segredo-1234", Perfil.PROFESSOR, null);
        ErroDeNegocio a = assertThrows(ErroDeNegocio.class, () -> autenticacao.autenticar("joao", "errada-1234"));
        ErroDeNegocio b = assertThrows(ErroDeNegocio.class, () -> autenticacao.autenticar("ninguem", "qualquer-123"));
        assertEquals(a.getMessage(), b.getMessage());
        assertEquals("credenciais_invalidas", a.codigo());
    }

    @Test
    @DisplayName("5 falhas bloqueiam a conta, mesmo com a senha certa")
    void bloqueioPorTentativas() {
        servicoDeUsuarios.criar("ana", "Ana", "segredo-1234", Perfil.PROFESSOR, null);
        for (int i = 0; i < Usuario.TENTATIVAS_ATE_BLOQUEAR; i++) {
            assertThrows(ErroDeNegocio.class, () -> autenticacao.autenticar("ana", "errada-0000"));
        }
        ErroDeNegocio e = assertThrows(ErroDeNegocio.class, () -> autenticacao.autenticar("ana", "segredo-1234"));
        assertEquals("conta_bloqueada", e.codigo());
    }

    @Test
    @DisplayName("sucesso zera o contador de falhas")
    void sucessoZera() {
        servicoDeUsuarios.criar("bia", "Bia", "segredo-1234", Perfil.PROFESSOR, null);
        assertThrows(ErroDeNegocio.class, () -> autenticacao.autenticar("bia", "errada-0000"));
        autenticacao.autenticar("bia", "segredo-1234");
        assertEquals(0, usuarios.buscarPorLogin("bia").orElseThrow().tentativasFalhas());
    }

    @Test
    @DisplayName("política de senha: tamanho, letras e números, diferente do login")
    void politicaDeSenha() {
        assertThrows(ErroDeNegocio.class, () -> PoliticaDeSenha.validar("curta1", "x"));
        assertThrows(ErroDeNegocio.class, () -> PoliticaDeSenha.validar("somenteletrasaqui", "x"));
        assertThrows(ErroDeNegocio.class, () -> PoliticaDeSenha.validar("12345678901234", "x"));
        assertThrows(ErroDeNegocio.class, () -> PoliticaDeSenha.validar("login12345", "LOGIN12345"));
        PoliticaDeSenha.validar("uma-senha-1234", "x");
    }

    @Test
    @DisplayName("login duplicado e login inválido são recusados")
    void loginDuplicado() {
        servicoDeUsuarios.criar("dup", "Dup", "segredo-1234", Perfil.PROFESSOR, null);
        assertThrows(ErroDeNegocio.class, () -> servicoDeUsuarios.criar("DUP", "Outro", "segredo-1234", Perfil.PROFESSOR, null));
        assertThrows(ErroDeNegocio.class, () -> servicoDeUsuarios.criar("a b", "X", "segredo-1234", Perfil.PROFESSOR, null));
    }

    @Test
    @DisplayName("administrador inicial só é criado quando não há nenhum usuário")
    void administradorInicial() {
        assertTrue(servicoDeUsuarios.criarAdministradorInicialSeNecessario("coord", "Coordenação", "senha-inicial-123"));
        assertFalse(servicoDeUsuarios.criarAdministradorInicialSeNecessario("outro", "Outro", "senha-inicial-123"));
        assertEquals(Perfil.PROFESSOR, usuarios.buscarPorLogin("coord").orElseThrow().perfil());
        assertTrue(usuarios.buscarPorLogin("coord").orElseThrow().administrador());
    }

    @Test
    @DisplayName("alterar senha exige a senha atual correta")
    void alterarSenha() {
        Usuario u = servicoDeUsuarios.criar("cris", "Cris", "segredo-1234", Perfil.PROFESSOR, null);
        assertThrows(ErroDeNegocio.class, () -> servicoDeUsuarios.alterarSenha(u.id(), "errada-0000", "nova-senha-123"));
        servicoDeUsuarios.alterarSenha(u.id(), "segredo-1234", "nova-senha-123");
        autenticacao.autenticar("cris", "nova-senha-123");
    }

    @Test
    @DisplayName("Textos: normalização e chave de docente ignoram tratamento, acento e caixa")
    void textos() {
        assertEquals("maria celia senra", Textos.chaveDeDocente("Profa.Maria Célia Senra"));
        assertEquals("christina castelo branco", Textos.chaveDeDocente("Profa Christina Castelo Branco"));
        assertEquals(Textos.chaveDeDocente("Prof. Jefferson"), Textos.chaveDeDocente("jefferson"));
        assertEquals("simone", Textos.chaveDeDocente("Profª Simone"));
        assertEquals(Textos.chaveDeDocente("Prof. Ana"), Textos.chaveDeDocente("Profª Ana"));
        assertEquals("algoritmos e programacao", Textos.normalizar("  Algoritmos   e Programação "));
    }
}
