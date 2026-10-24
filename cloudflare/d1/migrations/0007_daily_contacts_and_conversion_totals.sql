-- Migration 0007: Adiciona colunas de WhatsApp e Cadastros em daily_metrics e cria daily_contacts
ALTER TABLE daily_metrics ADD COLUMN whatsapp_contacts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE daily_metrics ADD COLUMN sign_ups INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS daily_contacts (
  tracker_site_id TEXT NOT NULL REFERENCES tracker_sites(tracker_site_id),
  metric_date TEXT NOT NULL,
  contact_type TEXT NOT NULL,
  page_path TEXT NOT NULL,
  contacts INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tracker_site_id, metric_date, contact_type, page_path)
);

CREATE INDEX IF NOT EXISTS idx_daily_contacts_site_date
  ON daily_contacts (tracker_site_id, metric_date);
