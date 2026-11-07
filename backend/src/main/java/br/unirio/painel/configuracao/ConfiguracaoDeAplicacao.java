package br.unirio.painel.configuracao;

import br.unirio.painel.importacao.aplicacao.ServicoDeImportacaoCsv.LimitesDeImportacao;
import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ConfiguracaoDeAplicacao {

    @Bean
    public Clock relogio() {
        return Clock.systemUTC();
    }

    @Bean
    public LimitesDeImportacao limitesDeImportacao(PropriedadesDoPainel props) {
        return new LimitesDeImportacao(props.csv().tamanhoMaximoBytes(), props.csv().linhasMaximas());
    }
}
