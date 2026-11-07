package br.unirio.painel.configuracao;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Propriedades "bussola.*" do application.yml (valores sensíveis vêm do ambiente, nunca do código). */
@ConfigurationProperties(prefix = "bussola")
public record PropriedadesDoPainel(AdministradorInicial administradorInicial, Cors cors, Csv csv) {

    public record AdministradorInicial(String login, String nome, String senha) { }

    public record Cors(List<String> origensPermitidas) { }

    public record Csv(long tamanhoMaximoBytes, int linhasMaximas) { }
}
