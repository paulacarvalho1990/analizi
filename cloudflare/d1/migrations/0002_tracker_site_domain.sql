alter table tracker_sites add column domain text not null default '';
alter table tracker_sites add column updated_at text not null default current_timestamp;
