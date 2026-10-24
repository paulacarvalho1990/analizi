-- Atualiza os sites existentes de Paula e Junior para o plano admin na base D1
update tracker_sites
set plan = 'admin', updated_at = current_timestamp
where tracker_site_id in ('ANLZ4A484-A', 'ANLZ104D5-A');
