const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash("123456", 10);

  const usuario = await prisma.usuario.upsert({
    where: { email: "contato@sefaz.al.gov.br" },
    update: {},
    create: {
      nome: "SEFAZ Alagoas",
      email: "contato@sefaz.al.gov.br",
      senhaHash,
    },
  });

  const empresa = await prisma.empresa.upsert({
    where: { usuarioId: usuario.id },
    update: {},
    create: {
      nome: "SEFAZ — AL",
      cnpj: "12.345.678/0001-90",
      descricao: "Secretaria de Estado da Fazenda de Alagoas",
      cidade: "Maceió",
      usuarioId: usuario.id,
    },
  });

  await prisma.vaga.createMany({
    data: [
      {
        titulo: "Desenvolvedor Full Stack",
        descricao: "Atuar no desenvolvimento de sistemas internos da SEFAZ.",
        area: "backend",
        cidade: "Maceió",
        modalidade: "REMOTO",
        tecnologias: "React,Node.js",
        salarioMin: 7000,
        salarioMax: 10000,
        empresaId: empresa.id,
      },
      {
        titulo: "Analista de Dados",
        descricao: "Análise de dados fiscais e criação de dashboards.",
        area: "dados",
        cidade: "Maceió",
        modalidade: "HIBRIDO",
        tecnologias: "Python,Power BI",
        salarioMin: 6000,
        salarioMax: 9000,
        empresaId: empresa.id,
      },
    ],
  });

  console.log("Seed concluido com sucesso.");
  console.log(`   Login de teste -> email: ${usuario.email} | senha: 123456`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
