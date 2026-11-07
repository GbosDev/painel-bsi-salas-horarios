package br.unirio.painel.auditoria.aplicacao;

import br.unirio.painel.auditoria.aplicacao.RepositorioDeAuditoria.FiltroDeAuditoria;
import br.unirio.painel.auditoria.dominio.RegistroDeAuditoria;
import br.unirio.painel.auditoria.dominio.TipoDeAlteracao;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConsultaDeHistorico {

    private static final int LIMITE_PADRAO = 200;
    private static final int LIMITE_MAXIMO = 1000;

    private final RepositorioDeAuditoria repositorio;
    private final Clock relogio;

    public ConsultaDeHistorico(RepositorioDeAuditoria repositorio, Clock relogio) {
        this.repositorio = repositorio;
        this.relogio = relogio;
    }

    /** periodo: "1", "7", "30" (dias) ou "tudo". */
    @Transactional(readOnly = true)
    public List<RegistroDeAuditoria> consultar(String cursoCodigo, String tipo, String periodo, String texto, Integer limite) {
        TipoDeAlteracao tipoFiltro = (tipo == null || tipo.isBlank() || "todos".equals(tipo)) ? null : TipoDeAlteracao.deCodigo(tipo);
        String curso = (cursoCodigo == null || cursoCodigo.isBlank() || "todos".equals(cursoCodigo)) ? null : cursoCodigo;
        Instant desde = desde(periodo);
        int lim = limite == null || limite <= 0 ? LIMITE_PADRAO : Math.min(limite, LIMITE_MAXIMO);
        return repositorio.consultar(new FiltroDeAuditoria(curso, tipoFiltro, desde, texto == null ? "" : texto.trim(), lim));
    }

    private Instant desde(String periodo) {
        if (periodo == null || periodo.isBlank()) periodo = "30";
        if ("tudo".equals(periodo)) return null;
        try {
            return relogio.instant().minus(Duration.ofDays(Math.max(1, Integer.parseInt(periodo))));
        } catch (NumberFormatException e) {
            return relogio.instant().minus(Duration.ofDays(30));
        }
    }
}
