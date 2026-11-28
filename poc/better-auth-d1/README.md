# Protótipo: Better Auth + Google + D1 (card #25)

Validação da decisão do [ADR 0001](../../docs/adr/0001-migracao-supabase-d1.md). Resultado registrado no ADR.

- `src/index.ts`: Worker com `/entrar`, `/me` (mostra a sessão e quantas consultas ao D1 a requisição fez) e `/sair`.
- `migrations/0001_better_auth.sql`: tabelas mínimas do Better Auth (`user`, `session`, `account`, `verification`).

O Worker e o banco `analizi-auth-poc` foram apagados depois do teste. Este código fica como referência para o #27; não é usado pelo app.
