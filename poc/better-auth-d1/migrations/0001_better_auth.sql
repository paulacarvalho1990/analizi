-- Tabelas mínimas do Better Auth (protótipo do card #25).
create table if not exists "user" (
  id text primary key, name text not null, email text not null unique,
  emailVerified integer not null default 0, image text,
  createdAt date not null, updatedAt date not null
);
create table if not exists session (
  id text primary key, expiresAt date not null, token text not null unique,
  createdAt date not null, updatedAt date not null, ipAddress text, userAgent text,
  userId text not null references "user"(id) on delete cascade
);
create index if not exists session_user on session(userId);
create table if not exists account (
  id text primary key, accountId text not null, providerId text not null,
  userId text not null references "user"(id) on delete cascade,
  accessToken text, refreshToken text, idToken text,
  accessTokenExpiresAt date, refreshTokenExpiresAt date, scope text, password text,
  createdAt date not null, updatedAt date not null
);
create index if not exists account_user on account(userId);
create table if not exists verification (
  id text primary key, identifier text not null, value text not null,
  expiresAt date not null, createdAt date, updatedAt date
);
