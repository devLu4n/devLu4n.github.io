const TRANSICOES_STATUS = Object.freeze({
  PENDENTE: ['EM_ANALISE'],
  EM_ANALISE: ['ENTREVISTA'],
  ENTREVISTA: ['APROVADO', 'REJEITADO'],
  APROVADO: [],
  REJEITADO: [],
});

function podeAtualizarStatus(statusAtual, novoStatus) {
  return TRANSICOES_STATUS[statusAtual]?.includes(novoStatus) === true;
}

module.exports = { TRANSICOES_STATUS, podeAtualizarStatus };
