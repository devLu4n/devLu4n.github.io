const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function analisarCandidatos(vaga, candidaturas) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const descricaoVaga = [
    `Titulo: ${vaga.titulo}`,
    `Descricao: ${vaga.descricao}`,
    `Area: ${vaga.area}`,
    `Tecnologias: ${vaga.tecnologias}`,
    `Cidade: ${vaga.cidade}`,
    `Modalidade: ${vaga.modalidade}`,
  ].join("\n");

  const candidatosTexto = candidaturas.map((c, i) => {
    const perfil = c.candidato;
    const usuario = perfil.usuario;
    return [
      `--- Candidato ${i + 1} (id: ${c.id}) ---`,
      `Nome: ${usuario.nome}`,
      `Email: ${usuario.email}`,
      `Cidade: ${perfil.cidade || "Nao informada"}`,
      `LinkedIn: ${perfil.linkedin || "Nao informado"}`,
      `Curriculo: ${perfil.curriculo || "Nao enviado"}`,
      `Mensagem: ${c.mensagem || "Nenhuma"}`,
    ].join("\n");
  }).join("\n\n");

  const prompt = `Voce e um recrutador de TI especializado. Analise os candidatos abaixo para a vaga descrita e retorne um ranking de compatibilidade.

VAGA:
${descricaoVaga}

CANDIDATOS:
${candidatosTexto}

Retorne APENAS um JSON valido (sem markdown, sem texto extra) no seguinte formato:
[
  {
    "candidaturaId": <id da candidatura>,
    "nome": "<nome do candidato>",
    "compatibilidade": <numero de 0 a 100>,
    "justificativa": "<breve justificativa em portugues>"
  }
]

Ordene do mais compativel para o menos compativel.`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text().trim();

  const jsonMatch = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  const ranking = JSON.parse(jsonMatch);

  return ranking;
}

module.exports = { analisarCandidatos };
