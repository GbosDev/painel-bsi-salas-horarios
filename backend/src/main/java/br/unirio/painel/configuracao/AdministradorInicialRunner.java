package br.unirio.painel.configuracao;

import br.unirio.painel.acesso.aplicacao.ServicoDeUsuarios;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Cria a conta inicial de professor/coordenação a partir de variáveis de ambiente (ADMIN_LOGIN, ADMIN_SENHA),
 * apenas quando o banco ainda não tem nenhum usuário. A senha nunca é registrada em log.
 */
@Component
public class AdministradorInicialRunner implements ApplicationRunner {

    private static final Logger LOG = LoggerFactory.getLogger(AdministradorInicialRunner.class);

    private final ServicoDeUsuarios usuarios;
    private final PropriedadesDoPainel props;

    public AdministradorInicialRunner(ServicoDeUsuarios usuarios, PropriedadesDoPainel props) {
        this.usuarios = usuarios;
        this.props = props;
    }

    @Override
    public void run(ApplicationArguments args) {
        var cfg = props.administradorInicial();
        // Garante a conta de administração (única que ativa/desativa/apaga contas) mesmo sem ADMIN_SENHA.
        if (cfg != null && usuarios.garantirAdministrador(cfg.login())) {
            LOG.info("Conta '{}' marcada como administração.", cfg.login());
        }
        boolean configurado = cfg != null && cfg.login() != null && !cfg.login().isBlank() && cfg.senha() != null && !cfg.senha().isBlank();
        if (!configurado) {
            if (usuarios.listar().isEmpty()) {
                LOG.warn("Nenhum usuário cadastrado e ADMIN_LOGIN/ADMIN_SENHA não definidos: ninguém conseguirá entrar. Veja o README.");
            }
            return;
        }
        // Falha de política de senha aborta a partida de propósito (melhor que subir com conta fraca).
        if (usuarios.criarAdministradorInicialSeNecessario(cfg.login(), cfg.nome(), cfg.senha())) {
            LOG.info("Conta inicial '{}' criada (perfil PROFESSOR, administração). Remova ADMIN_SENHA do ambiente após o primeiro acesso.", cfg.login());
        }
    }
}
