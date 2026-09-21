/**
 * Teste Automatizado de Homologação da Integração TypeSafe AI (System One / Jev)
 * Valida:
 * 1. Padrão Pre-Parsed Value Extraction e seleção tipada em resume-parser.ts
 * 2. Motor de Fit Semântico com primitivas Score, Choice e Noul em fit-evaluator.ts
 * 3. Resiliência de Fallback offline (0ms) garantida
 */

import { extractHeuristicResumeData, parseResumeWithAi } from "../src/lib/resume-parser";
import { evaluateApplicationFit, evaluateApplicationFitSemantic } from "../src/lib/fit-evaluator";
import { isTypeSafeConfigured, getTypeSafeClient } from "../src/lib/typesafe";

console.log("================================================================================");
console.log("🚀 [TESTE DE HOMOLOGAÇÃO] EVOLUÇÃO TYPESAFE AI - MAÎTRE CONECTA");
console.log("================================================================================\n");

async function runTests() {
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      if (detail) console.log(`     └─ ${detail}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (detail) console.error(`     └─ Detalhe: ${detail}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Verificação de Infraestrutura e Cliente Singleton
  // ---------------------------------------------------------------------------
  console.log("📦 1. Verificação de Infraestrutura e Configuração TypeSafe AI");
  const isConfigured = isTypeSafeConfigured();
  console.log(`     └─ TypeSafe AI configurado no ambiente: ${isConfigured ? "SIM (Chave Ativa)" : "NÃO (Modo Fallback Resiliente)"}`);
  
  const client = getTypeSafeClient();
  if (isConfigured) {
    assert(client !== null, "Cliente singleton TypeSafeClient inicializado com sucesso");
  } else {
    assert(client === null, "Cliente singleton lida graciosamente com ausência de chave (Zero crash)");
  }

  // ---------------------------------------------------------------------------
  // 2. Teste do Ponto 1: Extração de Currículos (Pre-Parsed Value Extraction)
  // ---------------------------------------------------------------------------
  console.log("\n📄 2. Teste de Extração de Currículos (resume-parser.ts)");

  const mockCvTextSeniorTech = `
    MARIANA ALBUQUERQUE DE SOUZA
    mariana.souza@techconsultoria.com.br | (11) 98765-4321
    https://linkedin.com/in/mariana-albuquerque-tech
    São Paulo - SP

    RESUMO PROFISSIONAL
    Tech Lead e Engenheira de Software Sênior com 8 anos de experiência em arquitetura de microsserviços,
    sistemas distribuídos e liderança técnica de squads ágeis. Especialista em Next.js, TypeScript,
    Node.js, PostgreSQL, Docker, AWS e Kubernetes.

    EXPERIÊNCIA PROFISSIONAL
    Tech Lead Sênior - Inovação Digital (2021 - Atual)
    - Liderança de equipe de 10 engenheiros fullstack.
    - Arquitetura de APIs com TypeScript, NestJS e PostgreSQL.

    FORMAÇÃO
    Bacharelado em Engenharia de Computação - USP

    Pretensão Salarial: R$ 16.500,00
  `;

  const heuristicData = extractHeuristicResumeData(mockCvTextSeniorTech);
  assert(heuristicData.firstName === "MARIANA" && heuristicData.lastName.includes("ALBUQUERQUE"), "Detecção do Nome Completo correto", `${heuristicData.name}`);
  assert(heuristicData.email === "mariana.souza@techconsultoria.com.br", "Extração de E-mail corporativo", heuristicData.email);
  assert(heuristicData.phone.includes("98765-4321"), "Extração de Telefone com DDD brasileiro", heuristicData.phone);
  assert(heuristicData.linkedinUrl.includes("mariana-albuquerque-tech"), "Extração de URL do LinkedIn", heuristicData.linkedinUrl);
  assert(heuristicData.skills.includes("TypeScript") && heuristicData.skills.includes("PostgreSQL"), "Identificação de Skills essenciais", heuristicData.tags);
  assert(heuristicData.salaryExpectation === 16500, "Extração de Pretensão Salarial", `R$ ${heuristicData.salaryExpectation}`);

  // Teste de parseResumeWithAi com fallback garantido
  const aiParsed = await parseResumeWithAi(mockCvTextSeniorTech);
  assert(Boolean(aiParsed && aiParsed.name), "Execução segura de parseResumeWithAi sem lançar exceções");

  // ---------------------------------------------------------------------------
  // 3. Teste do Ponto 2: Motor de Fit Semântico Avançado (fit-evaluator.ts)
  // ---------------------------------------------------------------------------
  console.log("\n🎯 3. Teste do Motor de Fit Semântico e Triagem Inteligente (fit-evaluator.ts)");

  const mockJobTechLead = {
    title: "Tech Lead Fullstack (TypeScript / Next.js)",
    description: "Buscamos líder técnico sênior com sólida vivência em arquitetura de microsserviços, TypeScript, Next.js, Node.js, PostgreSQL e computação em nuvem AWS. Desejável experiência em mentoria de desenvolvedores e condução de cerimônias ágeis.",
    department: "Engenharia de Software",
    salaryMin: 14000,
    salaryMax: 18000,
    requiredSkills: "TypeScript, Next.js, Node.js, PostgreSQL, AWS, Docker, Liderança",
  };

  // 3.1. Candidato Alinhado (Alto Fit)
  console.log("   --- Caso A: Candidato Alto Fit dentro do orçamento ---");
  const evalHighFit = await evaluateApplicationFitSemantic(
    mockJobTechLead,
    {
      name: heuristicData.name,
      tags: heuristicData.tags,
      profileSummary: heuristicData.profileSummary,
      rawText: mockCvTextSeniorTech,
    },
    { salaryExpectation: 16500 }
  );

  assert(evalHighFit.salaryFit.status === "WITHIN_BUDGET", "Salary Fit classificado como WITHIN_BUDGET");
  assert(evalHighFit.overallCategory === "ALTO_FIT", "Candidato qualificado categorizado como ALTO_FIT", `Categoria: ${evalHighFit.overallCategory}, Score: ${evalHighFit.overallScore}%`);
  assert(evalHighFit.prioritySuggestion === "PRIORIZADO", "Sugestão de prioridade PRIORIZADO");

  // 3.2. Candidato com Pretensão Salarial com Tolerância de 15% (Negociação)
  console.log("   --- Caso B: Candidato com Salário em Margem de Tolerância (+12%) ---");
  const evalTolerated = await evaluateApplicationFitSemantic(
    mockJobTechLead,
    {
      name: heuristicData.name,
      tags: heuristicData.tags,
      profileSummary: heuristicData.profileSummary,
      rawText: mockCvTextSeniorTech,
    },
    { salaryExpectation: 20000 } // Teto: 18.000 -> 20.000 é ~11% acima (dentro dos 15%)
  );

  assert(evalTolerated.salaryFit.status === "SLIGHTLY_ABOVE", "Salário até 15% classificado como SLIGHTLY_ABOVE", `Status: ${evalTolerated.salaryFit.status} (+${evalTolerated.salaryFit.diffPercentage}%)`);
  assert(evalTolerated.salaryFit.isKnockout === false, "Margem de tolerância NÃO aciona Knockout");

  // 3.3. Candidato com Salário Fora do Orçamento (Knockout > 15%)
  console.log("   --- Caso C: Candidato com Salário Out of Budget (Knockout > 15%) ---");
  const evalKnockout = await evaluateApplicationFitSemantic(
    mockJobTechLead,
    {
      name: heuristicData.name,
      tags: heuristicData.tags,
      profileSummary: heuristicData.profileSummary,
      rawText: mockCvTextSeniorTech,
    },
    { salaryExpectation: 26000 } // 44% acima do teto de 18.000
  );

  assert(evalKnockout.salaryFit.status === "OUT_OF_BUDGET", "Salário > 15% classificado como OUT_OF_BUDGET");
  assert(evalKnockout.salaryFit.isKnockout === true, "Desvio salarial severo aciona Knockout");
  assert(evalKnockout.overallCategory === "BAIXO_FIT", "Knockout orçamentário força BAIXO_FIT");
  assert(evalKnockout.prioritySuggestion === "DUVIDA", "Prioridade rebaixada para DUVIDA");

  // 3.4. Candidato com Perfil Desalinhado / Competências Incompatíveis
  console.log("   --- Caso D: Candidato de outra área profissional (Baixo Fit Técnico) ---");
  const mockCvUnrelated = `
    ROBERTO CARLOS NOGUEIRA
    roberto.vendas@empresa.com.br | (31) 99999-8888
    Vendedor Externo e Balconista com 2 anos de experiência em comércio varejista de autopeças.
    Pretensão: R$ 2.500,00
  `;
  const evalUnrelated = await evaluateApplicationFitSemantic(
    mockJobTechLead,
    {
      name: "Roberto Carlos Nogueira",
      tags: "Vendas, Atendimento, Varejo",
      profileSummary: "Vendedor de autopeças",
      rawText: mockCvUnrelated,
    },
    { salaryExpectation: 2500 }
  );

  assert(evalUnrelated.overallCategory === "BAIXO_FIT", "Perfil de outra área classificado como BAIXO_FIT", `Categoria: ${evalUnrelated.overallCategory}`);

  // ---------------------------------------------------------------------------
  // Resumo Final
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`📊 RESULTADO DA HOMOLOGAÇÃO: ${passed}/${total} asserções passaram com êxito (${Math.round((passed/total)*100)}%)`);
  console.log("================================================================================");

  if (passed === total) {
    console.log("🎉 INTEGRAÇÃO TYPESAFE AI (SYSTEM ONE) HOMOLOGADA COM SUCESSO NO MAÎTRE CONECTA!\n");
    process.exit(0);
  } else {
    console.error("⚠️ Algumas asserções falharam. Verifique os logs acima.\n");
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("❌ Erro fatal durante a execução do teste:", err);
  process.exit(1);
});
