package br.unirio.painel.acesso.dominio;

import java.time.Duration;
import java.time.Instant;

/**
 * Conta de acesso. A senha só existe aqui como hash (BCrypt).
 * Estudantes: o login É a matrícula (obrigatória). Professores: login livre; matrícula opcional.
 * {@code administrador}: a conta de coordenação principal, única que ativa, desativa e apaga contas.
 */
public class Usuario {

    public static final int TENTATIVAS_ATE_BLOQUEAR = 5;
    public static final Duration TEMPO_DE_BLOQUEIO = Duration.ofMinutes(15);

    private final Long id;
    private final String login;
    private final String nome;
    private String senhaHash;
    private final Perfil perfil;
    private final String matricula;
    private boolean ativo;
    private final boolean administrador;
    private int tentativasFalhas;
    private Instant bloqueadoAte;

    public Usuario(Long id, String login, String nome, String senhaHash, Perfil perfil, String matricula,
                   boolean ativo, boolean administrador, int tentativasFalhas, Instant bloqueadoAte) {
        this.id = id;
        this.login = login;
        this.nome = nome;
        this.senhaHash = senhaHash;
        this.perfil = perfil;
        this.matricula = matricula;
        this.ativo = ativo;
        this.administrador = administrador;
        this.tentativasFalhas = tentativasFalhas;
        this.bloqueadoAte = bloqueadoAte;
    }

    public boolean bloqueado(Instant agora) {
        return bloqueadoAte != null && agora.isBefore(bloqueadoAte);
    }

    public void registrarFalha(Instant agora) {
        tentativasFalhas++;
        if (tentativasFalhas >= TENTATIVAS_ATE_BLOQUEAR) {
            bloqueadoAte = agora.plus(TEMPO_DE_BLOQUEIO);
            tentativasFalhas = 0;
        }
    }

    public void registrarSucesso() {
        tentativasFalhas = 0;
        bloqueadoAte = null;
    }

    public void trocarSenhaHash(String novoHash) {
        this.senhaHash = novoHash;
    }

    /** Reativar também zera o bloqueio por tentativas. */
    public void definirAtivo(boolean ativo) {
        this.ativo = ativo;
        if (ativo) registrarSucesso();
    }

    /** Estudantes aparecem pela matrícula e depois pelo nome; professores, pelo nome. */
    public String identificacao() {
        return perfil == Perfil.ALUNO && matricula != null ? matricula + " · " + nome : nome;
    }

    public Long id() { return id; }
    public String login() { return login; }
    public String nome() { return nome; }
    public String senhaHash() { return senhaHash; }
    public Perfil perfil() { return perfil; }
    public String matricula() { return matricula; }
    public boolean ativo() { return ativo; }
    public boolean administrador() { return administrador; }
    public int tentativasFalhas() { return tentativasFalhas; }
    public Instant bloqueadoAte() { return bloqueadoAte; }
}
