// @ts-ignore
import pdf from "pdf-parse/lib/pdf-parse.js";
import OpenAI from "openai";

export interface ParsedResumeData {
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  skills: string[];
  tags: string;
  profileSummary: string;
  salaryExpectation?: number | null;
  rawText: string;
}

// Lista de habilidades conhecidas para matching heurístico automático
const KNOWN_SKILLS = [
  "React", "React Native", "Next.js", "Vue.js", "Angular", "TypeScript", "JavaScript",
  "Node.js", "NestJS", "Express", "Fastify", "Python", "Django", "FastAPI", "Flask",
  "Java", "Spring Boot", "Kotlin", "C#", ".NET", "ASP.NET", "Go", "Golang", "Rust", "PHP", "Laravel",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Oracle", "SQL Server", "Prisma", "Drizzle",
  "AWS", "Amazon Web Services", "GCP", "Google Cloud", "Azure", "Docker", "Kubernetes", "Terraform",
  "CI/CD", "GitHub Actions", "GitLab CI", "Linux", "Nginx", "DevOps", "Microservices", "REST API", "GraphQL",
  "HTML", "HTML5", "CSS", "CSS3", "TailwindCSS", "Bootstrap", "Sass", "Styled Components",
  "Figma", "UI/UX", "Design System", "Product Design",
  "Scrum", "Kanban", "Agile", "Jira", "Trello", "Liderança", "Gestão de Projetos", "Tech Lead",
  "Machine Learning", "IA", "AI", "OpenAI", "Deep Learning", "Data Science", "Pandas", "PyTorch", "TensorFlow",
  "Recrutamento", "Hunting", "RH", "Tech Recruiting", "Gestão de Pessoas", "Comunicação", "Vendas", "B2B"
];

/**
 * Extrai texto bruto de um buffer PDF de forma resiliente
 */
export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  let rawText = "";

  try {
    const data = await pdf(buffer, { version: "v2.0.550" });
    rawText = data.text || "";
  } catch (err1) {
    console.warn("Tentando método alternativo de leitura de PDF:", err1);
    try {
      const dataFallback = await pdf(buffer);
      rawText = dataFallback.text || "";
    } catch (err2) {
      console.warn("Não foi possível extrair texto diretamente do PDF:", err2);
      rawText = "";
    }
  }

  return rawText;
}

/**
 * Extrator Heurístico Inteligente de Alta Precisão (100% Offline e Instantâneo)
 */
export function extractHeuristicResumeData(rawText: string): ParsedResumeData {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Extração de E-mail
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const emailMatch = rawText.match(emailRegex);
  const email = emailMatch ? emailMatch[1].trim() : "";

  // 2. Extração de Telefone (Formatos Brasileiros e Internacionais)
  const phoneRegex = /(?:(?:\+|00)?(55)\s?)?(?:\(?([1-9][0-9])\)?\s?)?(?:((?:9\s?\d|[2-9])\d{3})[-\s]?(\d{4}))/;
  const phoneMatch = rawText.match(phoneRegex);
  let phone = "";
  if (phoneMatch) {
    phone = phoneMatch[0].trim();
  }

  // 3. Extração de LinkedIn
  const linkedinRegex = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i;
  const linkedinMatch = rawText.match(linkedinRegex);
  const linkedinUrl = linkedinMatch ? `https://linkedin.com/in/${linkedinMatch[1]}` : "";

  // 4. Detecção de Nome Completo
  // Filtra cabeçalhos comuns e busca a primeira linha que parece um nome de pessoa
  const ignoreNameWords = [
    "curriculum", "curriculo", "vitae", "resume", "cv", "perfil", "contato",
    "dados", "pessoais", "experiencia", "formacao", "educacao", "resumo",
    "objetivo", "habilidades", "skills", "telefone", "email", "endereco",
    "developer", "engenheiro", "desenvolvedor", "analista", "software", "full stack"
  ];

  let detectedName = "";
  for (let i = 0; i < Math.min(lines.length, 8); i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Se for linha de email ou telefone ou link, pula
    if (line.includes("@") || line.includes("linkedin") || line.includes("github") || line.includes("http")) {
      continue;
    }

    // Se tiver menos de 3 caracteres ou mais de 50 caracteres, pula
    if (line.length < 3 || line.length > 50) continue;

    // Se contiver palavras que indicam títulos de seção, pula
    const hasIgnoredWord = ignoreNameWords.some((w) => lower === w || lower.startsWith(w + " ") || lower.endsWith(" " + w));
    if (hasIgnoredWord) continue;

    // Se tiver formato de nome (2 a 5 palavras com letras)
    const words = line.split(/\s+/).filter((w) => w.length > 1);
    if (words.length >= 2 && words.length <= 5 && !/[0-9]/.test(line)) {
      detectedName = line;
      break;
    }
  }

  // Se não detectou nome específico, usa a primeira linha válida
  if (!detectedName && lines.length > 0) {
    detectedName = lines[0].replace(/[^a-zA-ZÀ-ÿ\s]/g, "").trim();
  }

  const nameParts = detectedName.split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  // 5. Extração de Skills / Tecnologias
  const rawLower = rawText.toLowerCase();
  const matchedSkills: string[] = [];

  for (const skill of KNOWN_SKILLS) {
    const skillLower = skill.toLowerCase();
    // Regex com word boundaries para evitar falso positivo (ex: 'c' em 'css')
    const escaped = skillLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const skillRegex = new RegExp(`(?:\\b|[^a-z0-9])${escaped}(?:\\b|[^a-z0-9])`, "i");

    if (skillRegex.test(rawLower) && !matchedSkills.includes(skill)) {
      matchedSkills.push(skill);
    }
  }

  // 6. Extração de Pretensão Salarial (se mencionada no CV)
  const salaryRegex = /(?:pretens[aã]o|sal[aá]rio|remunera[cç][aã]o)[^\d\n\r]{0,30}(?:r\$|brl)?\s?([\d.,]+)/i;
  const salaryMatch = rawText.match(salaryRegex);
  let salaryExpectation: number | null = null;
  if (salaryMatch && salaryMatch[1]) {
    const cleanNum = parseFloat(salaryMatch[1].replace(/\./g, "").replace(",", "."));
    if (!isNaN(cleanNum) && cleanNum > 500 && cleanNum < 200000) {
      salaryExpectation = cleanNum;
    }
  }

  // 7. Extração do Resumo Profissional / Objetivo
  let profileSummary = "";
  const summaryKeywords = ["resumo", "resumo profissional", "sobre", "perfil", "objetivo", "summary", "about"];
  let capturingSummary = false;
  const summaryLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase().replace(/[:\-_]/g, "").trim();

    if (summaryKeywords.includes(lower)) {
      capturingSummary = true;
      continue;
    }

    if (capturingSummary) {
      // Se encontrar outra seção (ex: Experiência, Formação), para
      if (
        line.toLowerCase().includes("experiência") ||
        line.toLowerCase().includes("experiencia") ||
        line.toLowerCase().includes("formação") ||
        line.toLowerCase().includes("formacao") ||
        line.toLowerCase().includes("educação") ||
        line.toLowerCase().includes("skills") ||
        line.toLowerCase().includes("habilidades")
      ) {
        break;
      }
      summaryLines.push(line);
      if (summaryLines.length >= 5) break;
    }
  }

  if (summaryLines.length > 0) {
    profileSummary = summaryLines.join(" ").substring(0, 500);
  } else {
    // Pega as primeiras linhas do CV que não sejam dados pessoais
    profileSummary = lines.slice(1, 4).join(" ").substring(0, 300);
  }

  return {
    name: detectedName,
    firstName,
    lastName,
    email,
    phone,
    linkedinUrl,
    skills: matchedSkills.slice(0, 15),
    tags: matchedSkills.slice(0, 10).join(", "),
    profileSummary: profileSummary || "Perfil profissional importado via currículo em PDF.",
    salaryExpectation,
    rawText,
  };
}

/**
 * Tenta enriquecer com IA da OpenAI se houver chave e créditos,
 * caindo com segurança para a extração heurística sem travar.
 */
export async function parseResumeWithAi(rawText: string): Promise<ParsedResumeData> {
  const heuristicData = extractHeuristicResumeData(rawText);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return heuristicData;
  }

  try {
    // Limita o tamanho do texto para a chamada de IA
    const truncatedText = rawText.substring(0, 4000);

    const openai = new OpenAI({ apiKey });

    // Promise com timeout seguro de 3.5 segundos para não prender o usuário
    const aiPromise = openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Você é um analisador especialista de currículos ATS. Extraia as informações do texto do currículo e responda EXCLUSIVAMENTE em formato JSON estruturado com os seguintes campos:
{
  "firstName": "string (primeiro nome)",
  "lastName": "string (sobrenomes)",
  "email": "string ou vazio",
  "phone": "string ou vazio",
  "linkedinUrl": "string ou vazio",
  "skills": ["string (tags de habilidades)"],
  "profileSummary": "string (resumo profissional conciso em 2 a 3 frases em português)",
  "salaryExpectation": número ou null
}`
        },
        {
          role: "user",
          content: truncatedText,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 3500)
    );

    const completion = await Promise.race([aiPromise, timeoutPromise]);

    if (completion && completion.choices && completion.choices[0]?.message?.content) {
      const parsedAi = JSON.parse(completion.choices[0].message.content);

      return {
        name: `${parsedAi.firstName || heuristicData.firstName} ${parsedAi.lastName || heuristicData.lastName}`.trim(),
        firstName: parsedAi.firstName || heuristicData.firstName,
        lastName: parsedAi.lastName || heuristicData.lastName,
        email: parsedAi.email || heuristicData.email,
        phone: parsedAi.phone || heuristicData.phone,
        linkedinUrl: parsedAi.linkedinUrl || heuristicData.linkedinUrl,
        skills: Array.isArray(parsedAi.skills) && parsedAi.skills.length > 0 ? parsedAi.skills : heuristicData.skills,
        tags: Array.isArray(parsedAi.skills) ? parsedAi.skills.join(", ") : heuristicData.tags,
        profileSummary: parsedAi.profileSummary || heuristicData.profileSummary,
        salaryExpectation: parsedAi.salaryExpectation || heuristicData.salaryExpectation,
        rawText,
      };
    }
  } catch (err: any) {
    console.warn("OpenAI parsing fallback acionado:", err.message);
  }

  // Retorna os dados heurísticos garantidos
  return heuristicData;
}
