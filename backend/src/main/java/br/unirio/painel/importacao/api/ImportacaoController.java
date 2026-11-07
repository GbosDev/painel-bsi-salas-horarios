package br.unirio.painel.importacao.api;

import br.unirio.painel.compartilhado.ErroDeNegocio;
import br.unirio.painel.configuracao.UsuarioAutenticado;
import br.unirio.painel.importacao.aplicacao.ServicoDeImportacaoCsv;
import br.unirio.painel.importacao.dominio.LinhaAnalisada;
import java.io.IOException;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/** Importação de turmas por CSV em duas etapas (prévia → aplicação). Somente PROFESSOR. */
@RestController
@RequestMapping("/api/v1")
@PreAuthorize("hasRole('PROFESSOR')")
public class ImportacaoController {

    public record HorarioDto(int diaSemana, String inicio, String fim) { }

    /** acao: "criar", "atualizar", "sem_alteracao" ou null (linha com erro). */
    public record LinhaDto(int numero, String situacao, String acao, String mensagem, String sigla, String disciplina,
                           String professor, String sala, List<HorarioDto> horarios) {
        static LinhaDto de(LinhaAnalisada l, ServicoDeImportacaoCsv.Acao acao) {
            var r = l.registro();
            var d = r == null ? null : (r.disciplina2023() != null ? r.disciplina2023() : r.disciplina2008());
            return new LinhaDto(l.numero(), l.situacao().codigo(), acao == null ? null : acao.codigo(), l.mensagem(),
                    d == null ? null : d.sigla(), d == null ? null : d.nome(),
                    r == null ? null : r.professor(), r == null ? null : r.sala(),
                    r == null ? List.of() : r.horarios().stream().map(h -> new HorarioDto(h.diaSemana(), h.inicio().toString(), h.fim().toString())).toList());
        }
    }

    public record PreviaDto(long loteId, String nomeArquivo, boolean formatoDuplo, int totalLinhas, int totalOk, int totalAviso,
                            int totalErro, int totalCriar, int totalAtualizar, int totalSemAlteracao, String avisoGeral,
                            List<LinhaDto> linhas) { }

    public record AplicacaoRequisicao(String observacao) { }

    public record AplicacaoDto(long loteId, int criadas, int atualizadas, int semAlteracao, int salasCriadas) { }

    private final ServicoDeImportacaoCsv servico;

    public ImportacaoController(ServicoDeImportacaoCsv servico) {
        this.servico = servico;
    }

    @PostMapping(value = "/cursos/{codigo}/importacoes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PreviaDto previa(@PathVariable String codigo, @RequestPart("arquivo") MultipartFile arquivo,
                            @AuthenticationPrincipal UsuarioAutenticado u) {
        byte[] bytes;
        try {
            bytes = arquivo.getBytes();
        } catch (IOException e) {
            throw ErroDeNegocio.invalido("csv_ilegivel", "Não foi possível ler o arquivo enviado.");
        }
        var p = servico.gerarPrevia(codigo, arquivo.getOriginalFilename(), bytes, u.comoAutor());
        return new PreviaDto(p.loteId(), p.nomeArquivo(), p.formatoDuplo(), p.totalLinhas(), p.totalOk(), p.totalAviso(),
                p.totalErro(), p.totalCriar(), p.totalAtualizar(), p.totalSemAlteracao(), p.avisoGeral(),
                p.linhas().stream().map(l -> LinhaDto.de(l, p.acoes().get(l.numero()))).toList());
    }

    @PostMapping("/importacoes/{loteId}/aplicacao")
    public AplicacaoDto aplicar(@PathVariable long loteId, @RequestBody(required = false) AplicacaoRequisicao req,
                                @AuthenticationPrincipal UsuarioAutenticado u) {
        var r = servico.aplicar(loteId, req == null ? null : req.observacao(), u.comoAutor());
        return new AplicacaoDto(r.loteId(), r.criadas(), r.atualizadas(), r.semAlteracao(), r.salasCriadas());
    }
}
