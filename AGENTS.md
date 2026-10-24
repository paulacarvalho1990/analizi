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
