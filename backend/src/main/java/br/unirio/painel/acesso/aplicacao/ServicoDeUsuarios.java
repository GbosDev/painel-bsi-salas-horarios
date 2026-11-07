package br.unirio.painel.acesso.aplicacao;

import br.unirio.painel.acesso.dominio.Perfil;
import br.unirio.painel.acesso.dominio.PoliticaDeSenha;
import br.unirio.painel.acesso.dominio.Usuario;
import br.unirio.painel.compartilhado.ErroDeNegocio;
import br.unirio.painel.compartilhado.Textos;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Contas de acesso.
 * <ul>
 *   <li>Estudante: matrícula e nome obrigatórios; a matrícula é o login.</li>
 *   <li>Professor: login e nome obrigatórios; matrícula opcional.</li>
 *   <li>Ativar, desativar e apagar contas: somente a conta de administração (coordenação principal).</li>
 * </ul>
 */
@Service
public class ServicoDeUsuarios {

    private static final Pattern LOGIN = Pattern.compile("^[a-z0-9._-]{3,60}$");
    /** Matrícula: só dígitos (espaços, pontos e traços digitados são removidos). */
    private static final Pattern MATRICULA = Pattern.compile("^\\d{5,20}$");

    private final RepositorioDeUsuarios usuarios;
    private final CodificadorDeSenha codificador;

    public ServicoDeUsuarios(RepositorioDeUsuarios usuarios, CodificadorDeSenha codificador) {
        this.usuarios = usuarios;
        this.codificador = codificador;
    }

    /** "2026 100.101-1" → "20261001011". */
    public static String normalizarMatricula(String bruta) {
        return bruta == null ? "" : bruta.replaceAll("[\\s.\\-/]", "");
    }

    @Transactional
    public Usuario criar(String loginBruto, String nomeBruto, String senha, Perfil perfil, String matriculaBruta) {
        return criar(loginBruto, nomeBruto, senha, perfil, matriculaBruta, false);
    }

    private Usuario criar(String loginBruto, String nomeBruto, String senha, Perfil perfil, String matriculaBruta,
                          boolean administrador) {
        if (perfil == null) throw ErroDeNegocio.invalido("perfil_invalido", "Perfil inválido.");
        String nome = Textos.limpar(nomeBruto);
        if (nome.isEmpty() || nome.length() > 150) {
            throw ErroDeNegocio.invalido("nome_invalido", "Informe o nome completo (até 150 caracteres).");
        }
        String matricula = normalizarMatricula(matriculaBruta);
        String login;
        if (perfil == Perfil.ALUNO) {
            if (matricula.isEmpty()) {
                throw ErroDeNegocio.invalido("matricula_obrigatoria", "Informe a matrícula do estudante: ela é o login dele.");
            }
            if (!MATRICULA.matcher(matricula).matches()) {
                throw ErroDeNegocio.invalido("matricula_invalida", "A matrícula deve ter só números (de 5 a 20 dígitos).");
            }
            login = matricula;
        } else {
            login = loginBruto == null ? "" : loginBruto.trim().toLowerCase();
            if (!LOGIN.matcher(login).matches()) {
                throw ErroDeNegocio.invalido("login_invalido",
                        "O login deve ter de 3 a 60 caracteres: letras minúsculas, números, ponto, hífen ou sublinhado.");
            }
            if (!matricula.isEmpty() && matricula.length() > 30) {
                throw ErroDeNegocio.invalido("matricula_invalida", "A matrícula pode ter no máximo 30 caracteres.");
            }
        }
        PoliticaDeSenha.validar(senha, login);
        if (!matricula.isEmpty() && usuarios.buscarPorMatricula(matricula).isPresent()) {
            throw ErroDeNegocio.conflito("matricula_em_uso", "Já existe uma conta com esta matrícula.", List.of());
        }
        if (usuarios.buscarPorLogin(login).isPresent()) {
            throw ErroDeNegocio.conflito("login_em_uso", "Já existe uma conta com este login.", List.of());
        }
        return usuarios.salvar(new Usuario(null, login, nome, codificador.codificar(senha), perfil,
                matricula.isEmpty() ? null : matricula, true, administrador, 0, null));
    }

    @Transactional
    public void alterarSenha(long usuarioId, String senhaAtual, String novaSenha) {
        Usuario u = usuarios.buscarPorId(usuarioId)
                .orElseThrow(() -> ErroDeNegocio.naoEncontrado("usuario_nao_encontrado", "Usuário não encontrado."));
        if (!codificador.confere(senhaAtual == null ? "" : senhaAtual, u.senhaHash())) {
            throw ErroDeNegocio.invalido("senha_atual_incorreta", "A senha atual está incorreta.");
        }
        PoliticaDeSenha.validar(novaSenha, u.login());
        u.trocarSenhaHash(codificador.codificar(novaSenha));
        usuarios.salvar(u);
    }

    @Transactional(readOnly = true)
    public List<Usuario> listar() {
        return usuarios.listar();
    }

    /** A sessão de quem foi desativado ou apagado deixa de valer na próxima requisição. */
    @Transactional(readOnly = true)
    public boolean contaAtiva(long id) {
        return usuarios.buscarPorId(id).map(Usuario::ativo).orElse(false);
    }

    @Transactional
    public Usuario definirAtivo(long atorId, long alvoId, boolean ativo) {
        Usuario alvo = alvoGerenciavel(atorId, alvoId);
        alvo.definirAtivo(ativo);
        return usuarios.salvar(alvo);
    }

    @Transactional
    public void excluir(long atorId, long alvoId) {
        alvoGerenciavel(atorId, alvoId);
        usuarios.excluir(alvoId);
    }

    private Usuario alvoGerenciavel(long atorId, long alvoId) {
        boolean ehAdministrador = usuarios.buscarPorId(atorId).map(u -> u.administrador() && u.ativo()).orElse(false);
        if (!ehAdministrador) {
            throw ErroDeNegocio.proibido("somente_administracao",
                    "Somente a conta de administração pode ativar, desativar ou apagar contas.");
        }
        if (atorId == alvoId) {
            throw ErroDeNegocio.invalido("propria_conta", "Você não pode desativar nem apagar a sua própria conta.");
        }
        Usuario alvo = usuarios.buscarPorId(alvoId)
                .orElseThrow(() -> ErroDeNegocio.naoEncontrado("usuario_nao_encontrado", "Usuário não encontrado."));
        if (alvo.administrador()) {
            throw ErroDeNegocio.proibido("alvo_administracao", "A conta de administração não pode ser desativada nem apagada.");
        }
        return alvo;
    }

    /** Usado na partida: cria o administrador inicial somente se ainda não houver nenhum usuário. */
    @Transactional
    public boolean criarAdministradorInicialSeNecessario(String login, String nome, String senha) {
        if (usuarios.contar() > 0) return false;
        criar(login, nome, senha, Perfil.PROFESSOR, null, true);
        return true;
    }

    /**
     * Usado na partida: se ainda não há conta de administração, a conta ADMIN_LOGIN (professor existente) passa a ser.
     * Nunca troca uma administração já definida.
     */
    @Transactional
    public boolean garantirAdministrador(String login) {
        if (login == null || login.isBlank() || usuarios.existeAdministrador()) return false;
        return usuarios.buscarPorLogin(login.trim().toLowerCase())
                .filter(u -> u.perfil() == Perfil.PROFESSOR)
                .map(u -> {
                    usuarios.marcarComoAdministrador(u.id());
                    return true;
                })
                .orElse(false);
    }
}
