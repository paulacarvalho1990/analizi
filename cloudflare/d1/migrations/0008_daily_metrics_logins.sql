-- Migration 0008: Adiciona coluna logins em daily_metrics
ALTER TABLE daily_metrics ADD COLUMN logins INTEGER NOT NULL DEFAULT 0;
