package br.unirio.painel.acesso.infra;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "usuario")
public class UsuarioJpa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "login", nullable = false, unique = true)
    private String login;

    @Column(name = "nome", nullable = false)
    private String nome;

    @Column(name = "senha_hash", nullable = false)
    private String senhaHash;

    @Column(name = "perfil", nullable = false)
    private String perfil;

    @Column(name = "matricula")
    private String matricula;

    @Column(name = "ativo", nullable = false)
    private boolean ativo;

    @Column(name = "administrador", nullable = false)
    private boolean administrador;

    @Column(name = "tentativas_falhas", nullable = false)
    private int tentativasFalhas;

    @Column(name = "bloqueado_ate")
    private Instant bloqueadoAte;

    @Column(name = "criado_em", nullable = false)
    private Instant criadoEm;

    protected UsuarioJpa() { }

    public UsuarioJpa(String login, String nome, String senhaHash, String perfil, String matricula, boolean ativo, Instant criadoEm) {
        this.login = login;
        this.nome = nome;
        this.senhaHash = senhaHash;
        this.perfil = perfil;
        this.matricula = matricula;
        this.ativo = ativo;
        this.criadoEm = criadoEm;
    }

    public Long getId() { return id; }
    public String getLogin() { return login; }
    public String getNome() { return nome; }
    public String getSenhaHash() { return senhaHash; }
    public void setSenhaHash(String senhaHash) { this.senhaHash = senhaHash; }
    public String getPerfil() { return perfil; }
    public String getMatricula() { return matricula; }
    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
    public boolean isAdministrador() { return administrador; }
    public void setAdministrador(boolean administrador) { this.administrador = administrador; }
    public int getTentativasFalhas() { return tentativasFalhas; }
    public void setTentativasFalhas(int tentativasFalhas) { this.tentativasFalhas = tentativasFalhas; }
    public Instant getBloqueadoAte() { return bloqueadoAte; }
    public void setBloqueadoAte(Instant bloqueadoAte) { this.bloqueadoAte = bloqueadoAte; }
}
