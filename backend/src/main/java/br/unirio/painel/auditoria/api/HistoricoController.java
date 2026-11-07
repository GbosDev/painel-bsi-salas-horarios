package br.unirio.painel.auditoria.api;

import br.unirio.painel.auditoria.aplicacao.ConsultaDeHistorico;
import br.unirio.painel.auditoria.dominio.RegistroDeAuditoria;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auditoria")
@PreAuthorize("hasRole('PROFESSOR')")
public class HistoricoController {

    public record RegistroDto(long id, Instant ocorridaEm, String autor, String autorPerfil, String cursoCodigo, String cursoNome,
                              String tipo, Long turmaId, String turmaSigla, String turmaNome, String motivo,
                              Map<String, Object> antes, Map<String, Object> depois, Long importacaoLoteId) {
        static RegistroDto de(RegistroDeAuditoria r) {
            return new RegistroDto(r.id(), r.ocorridaEm(), r.autor().nome(), r.autor().perfil(), r.cursoCodigo(), r.cursoNome(),
                    r.tipo().codigo(), r.turmaId(), r.turmaSigla(), r.turmaNome(), r.motivo(), r.antes(), r.depois(), r.importacaoLoteId());
        }
    }

    private final ConsultaDeHistorico consulta;

    public HistoricoController(ConsultaDeHistorico consulta) {
        this.consulta = consulta;
    }

    @GetMapping
    public List<RegistroDto> listar(@RequestParam(required = false) String curso, @RequestParam(required = false) String tipo,
                                    @RequestParam(required = false) String periodo, @RequestParam(required = false, name = "q") String texto,
                                    @RequestParam(required = false) Integer limite) {
        return consulta.consultar(curso, tipo, periodo, texto, limite).stream().map(RegistroDto::de).toList();
    }
}
