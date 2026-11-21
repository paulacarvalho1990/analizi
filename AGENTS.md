# Regras de Git e Fluxo de Desenvolvimento - ANALIZI

Este documento define as regras estritas de operação do Git para qualquer desenvolvedor, terminal ou agente de IA atuando neste projeto.

---

## 1. Verificação Contínua e Prevenção de Perdas (Multi-Telas / Concorrência)

> [!CAUTION]
> **NADA PODE SER SOBRESCRITO OU PERDIDO.**
> Várias telas/terminais podem estar executando alterações concorrentemente.

1. **Checagem Inicial Obrigatória**:
   - Antes de começar qualquer edição, mudar de branch ou rodar commits, execute SEMPRE:
     ```bash
     git status
     git diff --stat
     ```
   - Verifique se há arquivos modificados, arquivos staged ou arquivos não rastreados criados por outra tela/processo.
2. **Comandos Destrutivos Proibidos**:
   - É terminantemente **proibido** executar:
     - `git reset --hard`
     - `git clean -fd`
     - `git checkout .` ou `git restore .` (sem confirmação explícita do desenvolvedor)
     - `git push --force` ou `git push -f`
3. **Resguardo de Modificações Concorrentes**:
   - Se encontrar mudanças não salvas que não pertencem à tarefa atual ou de outra tela, faça stash seguro com descrição:
     ```bash
     git stash push -u -m "wip: pendencias antes de [nome_da_tarefa]"
     ```
   - Ou crie uma branch de trabalho temporária para não poluir o workspace:
     ```bash
     git checkout -b wip/ajustes-locais
     git add -A
     git commit -m "wip: salvaguarda de mudancas locais"
     ```

---

4. **Coordenação entre sessões (evitar conflito no git)** — obrigatório antes de começar a mexer em qualquer coisa:
   - `git fetch origin` e liste o que está em andamento: `git worktree list`, `git branch -a --sort=-committerdate | head -20` e `gh pr list --state open`.
   - Para cada branch/PR aberta, veja quais arquivos ela toca (`git diff --stat origin/develop...<branch>` ou `gh pr diff <n> --name-only`).
   - Se outra sessão/branch estiver mexendo nos mesmos arquivos que a sua tarefa vai tocar: **não comece**. Avise o desenvolvedor e aguarde a outra PR ser mergeada (ou combine a ordem), depois parta da `develop` atualizada.
   - Trabalhe sempre na sua própria worktree/branch. Nunca edite arquivos de outra worktree nem faça checkout da branch de outra sessão.
   - Antes de abrir a PR, rode `git fetch origin && git merge origin/develop` na sua branch e resolva conflitos localmente.

---

## 2. Política de Commits Atômicos

> [!IMPORTANT]
> **Faça commit sempre que mudar ou concluir algo.** Não acumule múltiplas tarefas não relacionadas em um único bloco de alterações.

- Cada modificação testada e funcional deve ser imediatamente commitada.
- Não deixe alterações no limbo do working tree por longos períodos.
- Padrão de mensagens de commit (Conventional Commits):
  - `feat: <descrição curta>` — Nova funcionalidade ou componente
  - `fix: <descrição curta>` — Correção de bug ou regressão
  - `refactor: <descrição curta>` — Refatoração de código sem alteração de comportamento
  - `style: <descrição curta>` — Ajustes de UI, CSS ou layout
  - `chore: <descrição curta>` — Configurações, dependências, scripts ou documentação

---

## 3. Modelo de Branches (GitFlow Adaptado)

### Estrutura de Branches:
- **`main`**: Código em produção estável. NUNCA faça commits diretos na `main`.
- **`develop`**: Branch padrão de integração e desenvolvimento.
- **`feature/<nome-da-funcionalidade>`**: Para qualquer mudança de médio ou grande porte.
- **`fix/<nome-do-bug>`**: Para correções de bugs complexos.

### Regra de Ouro para Mudanças Grandes:
> [!IMPORTANT]
> **Sempre que a mudança for grande ou envolver novo fluxo/componente estrutural:**
> 1. Verifique se o repositório local está limpo (`git status`).
> 2. Puxe as atualizações mais recentes da `develop`:
>    ```bash
>    git checkout develop
>    git pull origin develop
>    ```
> 3. Crie uma branch dedicada a partir da `develop`:
>    ```bash
>    git checkout -b feature/nome-da-mudanca
>    ```
> 4. Desenvolva com **commits frequentes** ao longo do processo.
> 5. Ao concluir e validar os testes/build (`npm run build`):
>    - Faça o merge de volta para a `develop`:
>      ```bash
>      git checkout develop
>      git pull origin develop
>      git merge feature/nome-da-mudanca --no-ff -m "merge: feature/nome-da-mudanca into develop"
>      ```
>    - (Opcional) Exclua a branch de feature após o merge bem-sucedido:
>      ```bash
>      git branch -d feature/nome-da-mudanca
>      ```

---

## 3.1 Pull Requests e Code Review

> [!IMPORTANT]
> **Toda PR só pode ser mergeada depois de pelo menos 1 code review.**
>
> **Exceção:** PRs que alteram **somente arquivos `.md`** (documentação, regras, planos) dispensam code review e podem ser mergeadas direto. Se a PR tiver qualquer outro arquivo, a revisão é obrigatória.

- **Toda feature nova fica numa branch nova** (`feature/<nome>` ou `fix/<nome>`), criada a partir da `develop` atualizada. Nunca reaproveite a branch de outra feature.
- **Uma PR por vez:** cada branch sobe uma única PR, com uma única feature/correção. Não abra a próxima PR enquanto a anterior não tiver sido revisada e mergeada, salvo se tocarem arquivos totalmente diferentes e o desenvolvedor autorizar.
- Fluxo obrigatório: abrir PR para `develop` → code review (humano ou `/code-review`) → corrigir ou responder cada apontamento → merge.
- Proibido `gh pr create && gh pr merge` em sequência, ou merge local na `develop` sem PR revisada.
- O merge na `develop` descrito nas seções 3 e 6 só acontece depois da PR aprovada.

### Regras de Code Review

**Antes de pedir review (autor)**
1. Faça uma auto-revisão do diff.
2. Descrição da PR com o que mudou, por quê, como foi testado e o card (`Closes #N`).
3. Só peça review com build passando e sem conflito com a `develop`.
4. PR pequena e focada em uma feature/correção.

**Durante o review (revisor)**
5. **Um comentário por problema**, na linha exata do código. Não agrupe vários problemas num comentário.
6. Prefixe a gravidade: `bloqueante:` (bug, segurança, perda de dados — impede o merge), `sugestão:` (opcional), `dúvida:` (pedido de explicação), `nit:` (estilo/nome).
7. Explique com um cenário concreto ("se X, acontece Y") e, quando possível, sugira a correção.
8. Ordem de revisão: segurança e permissões → correção do comportamento → dados e migrações → testes → legibilidade.

**Depois do review (autor)**
9. Responda **todo** comentário: "corrigido em `<sha>`" ou o motivo de não corrigir.
10. Cada correção em commit próprio referenciando o comentário; sem reescrever o histórico da PR.
11. **Marque o comentário como resolvido** só depois de corrigir ou responder. Em `bloqueante`, de preferência quem resolve é o revisor.
12. O que ficar para depois vira card no Project, com o link na resposta do comentário.

**Merge**
13. (Exceto PRs só de `.md`) Só com ≥ 1 aprovação, todos os comentários resolvidos e nenhum `bloqueante` aberto.
14. Se a PR mudar significativamente após a aprovação, peça nova revisão.
15. Após o merge, apague a branch.

**Cards no GitHub Project**
17. Um card só vai para **Done** depois do code review aprovado **e** do merge. Abrir a PR não conclui o card.
18. Ao mergear, para **cada card** resolvido pela PR: comente a solução realizada (o que foi feito, arquivos/rotas afetados, link da PR e commits, como foi validado, pendências que viraram outro card), marque o checklist, feche a issue e mova para Done.

**Revisões por IA (`/code-review`)**
16. Publique os achados como comentários na PR (`--comment`), um por problema, seguindo as mesmas regras de responder e resolver.

---

## 4. Política de Staging e Deploy Contínuo

> [!TIP]
> **O Worker atual é considerado ambiente de STAGING.**
> **Regra de Staging**: Sempre que algo for commitado e validado (`npm run build` aprovado sem erros), o deploy em staging pode ser executado imediatamente.

- Script de deploy de staging:
  ```bash
  npm run deploy:staging
  ```
- O deploy atualiza o Cloudflare Worker de staging (`https://analizi.carvalhopaula1990.workers.dev`) servindo os assets compilados do Vite e as rotas `/v1/*`.
- Após validar e commitar em staging, realize o push da branch para o GitHub:
  ```bash
  git push origin develop
  ```

---

## 5. Checklist Pré-Merge e Pré-Push

Antes de realizar merge na `develop` ou enviar commits para o repositório remoto:
1. `git status` — Confirme que não há arquivos pendentes ou esquecidos.
2. `npm run build` ou `npm run check` — Garanta que a aplicação compila sem erros de TypeScript ou bundle.
3. `git fetch origin` — Certifique-se de que a sua branch base está alinhada com o remoto antes de mesclar.

---

## 6. Versão do Front e Deploy (evitar versões dessincronizadas)

> [!CAUTION]
> **Causa histórica do problema:** várias sessões criavam branches a partir de uma `develop` desatualizada, cada uma subia a versão por conta própria (ex.: duas `v0.0.34` diferentes) e fazia deploy de staging **a partir da feature branch**. O staging ficava com o front da última branch que deployou, sem o trabalho das outras.

1. **Deploy de staging só a partir da `develop` atualizada.** Nunca rode `npm run deploy:staging` estando numa `feature/*` ou `fix/*`. Sequência obrigatória:
   ```bash
   git checkout develop
   git pull --ff-only origin develop
   git merge --no-ff feature/x -m "merge: feature/x into develop (vX.Y.Z)"
   npm run build
   git push origin develop
   npm run deploy:staging
   ```
2. **Atualize a base antes de começar e antes de mergear:** `git fetch origin` + `git merge origin/develop` na sua branch. Nunca crie branch a partir de `develop` local sem `git pull --ff-only` antes.
3. **Versão (`src/lib/version.ts`) só é incrementada no momento do merge na `develop`**, nunca no meio da feature. Antes de escolher o número, leia a versão atual de `origin/develop` (`git show origin/develop:src/lib/version.ts`) e use a próxima. Um número de versão nunca é reutilizado.
4. **Conflito em `version.ts`:** resolva sempre com a próxima versão acima das duas em conflito.
5. **Push logo após cada merge na `develop`.** `develop` local nunca deve ficar à frente ou atrás de `origin/develop` por mais que alguns minutos (`git status -sb` deve mostrar sem `ahead`/`behind`).
6. **Branches curtas:** mergeou na `develop`, apague a branch local e remota (`git branch -d x && git push origin --delete x`).
7. **`main` = produção.** Atualize-a só por merge de `develop` (`git checkout main && git merge --ff-only develop`), quando a versão for validada em staging.
8. **Nunca versione segredos:** `.cf-token`, `.env.staging` e similares ficam no `.gitignore`.
