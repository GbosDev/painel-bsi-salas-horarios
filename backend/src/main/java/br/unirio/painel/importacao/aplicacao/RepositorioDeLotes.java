package br.unirio.painel.importacao.aplicacao;

import br.unirio.painel.importacao.dominio.LinhaAnalisada;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

/** Porta de saída: lotes de importação (prévia → aplicação) e suas linhas. */
public interface RepositorioDeLotes {

    record NovoLote(String cursoCodigo, Long usuarioId, String nomeArquivo, String hashSha256,
                    int totalLinhas, int totalOk, int totalAviso, int totalErro) { }

    record Lote(long id, String cursoCodigo, String nomeArquivo, String hashSha256, Situacao situacao,
                int totalLinhas, int totalOk, int totalAviso, int totalErro, List<LinhaAnalisada> linhas) { }

    enum Situacao { PREVIA, APLICADO, DESCARTADO }

    long criarPrevia(NovoLote lote, List<LinhaAnalisada> linhas);

    Optional<Lote> buscar(long id);

    void marcarAplicado(long id, String observacao, int criadas, int atualizadas, Instant quando);

    /** Quando o mesmo arquivo (hash) foi aplicado neste curso, se alguma vez. */
    Optional<Instant> aplicadoAnteriormente(String hashSha256, String cursoCodigo);
}
