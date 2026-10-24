# Diretrizes de Git e Desenvolvimento - ANALIZI

Consulte as regras consolidadas do repositório em [AGENTS.md](./AGENTS.md).

### Resumo das Regras Obrigatórias:
1. **Multi-telas e Não Sobrescrita**: Sempre inspecione `git status` e `git diff` antes de tocar no código. Nunca use comandos destrutivos (`reset --hard`, `checkout .`, `clean -fd`).
2. **Commits Constantes**: Faça commit atômico sempre que alterar ou concluir algo funcional.
3. **Mudanças Grandes**: Crie sempre uma branch dedicada (`feature/<nome>`) a partir de `develop`. Realize os commits e, ao terminar e testar, faça o merge na `develop`.
4. **Deploy Automático em Staging**: O worker atual é Staging. Sempre que commitou e validou (`npm run build`), pode realizar o deploy imediatamente (`npm run deploy:staging`).
5. **Verificação de Mudanças Pendentes**: Se existirem alterações de outras janelas, faça stash seguro ou crie uma branch temporária de salvaguarda.
