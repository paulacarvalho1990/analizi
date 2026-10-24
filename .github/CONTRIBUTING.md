# Diretrizes de Contribuição e Git Workflow - ANALIZI

Para garantir a integridade do código e permitir que múltiplos ambientes e telas trabalhem de forma concorrente sem sobrescrever alterações nem perder dados, todos os contribuidores e ferramentas devem seguir o fluxo abaixo:

## 1. Fluxo de Branches

```
           (feature/nova-tela)
             o---o---o---o
            /             \
main  <--- develop <-------' (merge testado)
 (prod)     (dev)
```

- **`develop`**: Branch padrão de trabalho e desenvolvimento.
- **`main`**: Produção (somente releases homologadas e testadas).
- **`feature/*`**: Obrigatória para mudanças de médio e grande porte.
- **`fix/*`**: Correções de bugs específicas.

### Criação e Merge de Branches para Grandes Mudanças:
1. Atualize a `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   ```
2. Crie sua branch a partir da `develop`:
   ```bash
   git checkout -b feature/sua-feature
   ```
3. Realize commits atômicos e constantes:
   ```bash
   git commit -m "feat: adicionar componente X"
   ```
4. Ao concluir, execute os testes e build local:
   ```bash
   npm run build
   ```
5. Mescle na `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git merge feature/sua-feature --no-ff -m "merge: feature/sua-feature into develop"
   ```

---

## 2. Padrão de Commits

> Faça commits frequentes. Cada commit deve conter uma unidade lógica de trabalho.

Adote o padrão Conventional Commits:
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `refactor:` Melhoria ou reorganização de código
- `style:` Formatação ou CSS
- `chore:` Tarefas de manutenção, dependências ou documentação

---

## 3. Segurança Multi-Telas (Anti-Sobrescrita)

- **Nunca use `git reset --hard` ou `git clean -fd`** sem antes verificar se outra tela tem arquivos pendentes.
- Sempre verifique `git status` antes de iniciar qualquer trabalho.
- Se houver pendências locais desconhecidas:
  - Utilize `git stash push -u -m "backup-tela-X"` ou isole em uma branch `wip/*`.
