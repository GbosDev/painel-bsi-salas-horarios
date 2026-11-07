package br.unirio.painel.importacao.infra;

import br.unirio.painel.compartilhado.ReferenciasDeCurso;
import br.unirio.painel.importacao.aplicacao.RepositorioDeLotes;
import br.unirio.painel.importacao.dominio.LinhaAnalisada;
import br.unirio.painel.importacao.dominio.RegistroImportado;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class RepositorioDeLotesJpa implements RepositorioDeLotes {

    private final LoteJpaRepository lotes;
    private final LinhaJpaRepository linhas;
    private final ReferenciasDeCurso cursos;
    private final ObjectMapper json;
    private final Clock relogio;

    public RepositorioDeLotesJpa(LoteJpaRepository lotes, LinhaJpaRepository linhas, ReferenciasDeCurso cursos,
                                 ObjectMapper json, Clock relogio) {
        this.lotes = lotes;
        this.linhas = linhas;
        this.cursos = cursos;
        this.json = json;
        this.relogio = relogio;
    }

    @Override
    public long criarPrevia(NovoLote n, List<LinhaAnalisada> analisadas) {
        Long cursoId = cursos.idPorCodigo(n.cursoCodigo()).orElseThrow();
        LoteJpa lote = lotes.save(new LoteJpa("CSV", cursoId, n.usuarioId(), n.nomeArquivo(), n.hashSha256(), "PREVIA",
                n.totalLinhas(), n.totalOk(), n.totalAviso(), n.totalErro(), relogio.instant()));
        for (LinhaAnalisada l : analisadas) {
            String mensagem = l.mensagem() == null ? null : (l.mensagem().length() > 500 ? l.mensagem().substring(0, 500) : l.mensagem());
            linhas.save(new LinhaJpa(lote.getId(), l.numero(), l.situacao().codigo(), mensagem, l.registro() == null ? null : paraJson(l.registro())));
        }
        return lote.getId();
    }

    @Override
    public Optional<Lote> buscar(long id) {
        return lotes.findById(id).map(l -> {
            ReferenciasDeCurso.Referencia curso = l.getCursoId() == null ? null : cursos.porId(l.getCursoId()).orElse(null);
            List<LinhaAnalisada> analisadas = linhas.findByLoteIdOrderByNumeroLinhaAsc(id).stream()
                    .map(x -> new LinhaAnalisada(x.getNumeroLinha(), LinhaAnalisada.Situacao.deCodigo(x.getSituacao()), x.getMensagem(),
                            x.getDadosJson() == null ? null : doJson(x.getDadosJson())))
                    .toList();
            return new Lote(l.getId(), curso == null ? null : curso.codigo(), l.getNomeArquivo(), l.getHashSha256(),
                    RepositorioDeLotes.Situacao.valueOf(l.getSituacao()), l.getTotalLinhas(), l.getTotalOk(), l.getTotalAviso(),
                    l.getTotalErro(), analisadas);
        });
    }

    @Override
    public void marcarAplicado(long id, String observacao, int criadas, int atualizadas, Instant quando) {
        LoteJpa lote = lotes.findById(id).orElseThrow();
        lote.aplicar(observacao, criadas, atualizadas, quando);
        lotes.save(lote);
    }

    @Override
    public Optional<Instant> aplicadoAnteriormente(String hashSha256, String cursoCodigo) {
        return cursos.idPorCodigo(cursoCodigo)
                .flatMap(cursoId -> lotes.ultimoAplicado(hashSha256, cursoId))
                .map(l -> l.getAplicadoEmOuNull());
    }

    private String paraJson(RegistroImportado r) {
        try {
            return json.writeValueAsString(r);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Falha ao serializar linha de importação", e);
        }
    }

    private RegistroImportado doJson(String texto) {
        try {
            return json.readValue(texto, RegistroImportado.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Linha de importação corrompida", e);
        }
    }
}
