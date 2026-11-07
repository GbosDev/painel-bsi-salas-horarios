package br.unirio.painel.arquitetura;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noFields;
import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

import com.tngtech.archunit.library.dependencies.SliceAssignment;
import com.tngtech.archunit.library.dependencies.SliceIdentifier;

import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;

/** Fronteiras do monólito modular e da arquitetura hexagonal (ver docs/adr/0002 e 0003). */
@AnalyzeClasses(packages = "br.unirio.painel", importOptions = ImportOption.DoNotIncludeTests.class)
class ArquiteturaTest {

    private static final String[] MODULOS = {"acesso", "auditoria", "catalogo", "importacao", "oferta", "plano"};

    @ArchTest
    static final ArchRule dominio_nao_conhece_framework = noClasses().that().resideInAPackage("..dominio..")
            .should().dependOnClassesThat().resideInAnyPackage("org.springframework..", "jakarta..", "com.fasterxml..", "..infra..", "..api..")
            .because("o domínio é Java puro");

    @ArchTest
    static final ArchRule aplicacao_nao_conhece_adaptadores = noClasses().that().resideInAPackage("..aplicacao..")
            .should().dependOnClassesThat().resideInAnyPackage("..infra..", "..api..", "org.springframework.web..", "jakarta.persistence..")
            .because("casos de uso dependem apenas de portas (interfaces)");

    @ArchTest
    static final ArchRule api_nao_conhece_infra = noClasses().that().resideInAPackage("..api..")
            .should().dependOnClassesThat().resideInAPackage("..infra..")
            .because("controllers só falam com casos de uso");

    @ArchTest
    static void modulos_nao_acessam_infra_nem_api_de_outros(JavaClasses classes) {
        for (String modulo : MODULOS) {
            List<String> proibidos = new ArrayList<>();
            for (String outro : MODULOS) {
                if (!outro.equals(modulo)) {
                    proibidos.add("br.unirio.painel." + outro + ".infra..");
                    proibidos.add("br.unirio.painel." + outro + ".api..");
                }
            }
            noClasses().that().resideInAPackage("br.unirio.painel." + modulo + "..")
                    .should().dependOnClassesThat().resideInAnyPackage(proibidos.toArray(String[]::new))
                    .because("módulos se comunicam pela API pública (aplicacao/dominio), nunca pelos adaptadores do vizinho")
                    .check(classes);
        }
    }

    @ArchTest
    static final ArchRule sem_ciclos_entre_modulos = slices().assignedFrom(new SliceAssignment() {
        @Override
        public SliceIdentifier getIdentifierOf(JavaClass classe) {
            for (String m : MODULOS) {
                if (classe.getPackageName().startsWith("br.unirio.painel." + m + ".")) return SliceIdentifier.of(m);
            }
            return SliceIdentifier.ignore();
        }

        @Override
        public String getDescription() {
            return "módulos de negócio";
        }
    }).should().beFreeOfCycles();

    @ArchTest
    static final ArchRule controllers_nao_usam_entidades_jpa = noClasses().that().resideInAPackage("..api..")
            .should().dependOnClassesThat().areAnnotatedWith(jakarta.persistence.Entity.class)
            .because("entidades JPA nunca são expostas na API");

    @ArchTest
    static final ArchRule sem_injecao_em_campo = noFields().should().beAnnotatedWith(Autowired.class)
            .because("injeção sempre por construtor");
}
