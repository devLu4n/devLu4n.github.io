const { podeAtualizarStatus } = require('../services/candidaturas.service');

describe('candidaturas.service', () => {
  it.each([
    ['PENDENTE', 'EM_ANALISE'],
    ['EM_ANALISE', 'ENTREVISTA'],
    ['ENTREVISTA', 'APROVADO'],
    ['ENTREVISTA', 'REJEITADO'],
  ])('permite a transição %s -> %s', (atual, proximo) => {
    expect(podeAtualizarStatus(atual, proximo)).toBe(true);
  });

  it.each([
    ['PENDENTE', 'ENTREVISTA'],
    ['EM_ANALISE', 'APROVADO'],
    ['APROVADO', 'REJEITADO'],
    ['REJEITADO', 'EM_ANALISE'],
  ])('rejeita a transição %s -> %s', (atual, proximo) => {
    expect(podeAtualizarStatus(atual, proximo)).toBe(false);
  });
});
