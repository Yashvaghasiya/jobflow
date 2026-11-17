begin;
create table public.profiles(id uuid primary key references auth.users on delete cascade,role text not null check(role in ('owner','worker')),owner_id uuid references auth.users on delete cascade,person_id text);
insert into public.profiles(id,role) select id,'owner' from auth.users;
alter table public.profiles enable row level security;
create policy self_profile on public.profiles for select to authenticated using(id=auth.uid());
revoke all on public.profiles from anon,authenticated;grant select on public.profiles to authenticated;
alter table public.people add column "portalEmail" text;
create unique index people_portal_email_unique on public.people(lower(trim("portalEmail"))) where nullif(trim("portalEmail"),'') is not null;
create function public.jobflow_is_owner() returns boolean language sql stable security definer set search_path=public,pg_temp as $$select exists(select 1 from profiles where id=auth.uid() and role='owner')$$;
revoke all on function public.jobflow_is_owner() from public;grant execute on function public.jobflow_is_owner() to authenticated;
create function public.jobflow_signup() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$declare p public.people;begin select * into p from people where lower(trim("portalEmail"))=lower(new.email);if found then insert into profiles values(new.id,'worker',p.user_id,p.id);else insert into profiles(id,role) values(new.id,'owner');end if;return new;end$$;
create trigger jobflow_signup after insert on auth.users for each row execute function public.jobflow_signup();
create function public.jobflow_guard() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
if auth.uid() is not null and not public.jobflow_is_owner() then
if tg_table_name in ('tasks','projects') and tg_op='UPDATE' and current_setting('jobflow.completing',true)='yes' then return new;end if;
raise exception 'Worker access denied' using errcode='42501';end if;
if tg_op='DELETE' then return old;end if;return new;end$$;
do $$declare n text;begin foreach n in array array['projects','tasks','people','purchases','reminders','business_profiles','invoices','invoice_items','invoice_payments','invoice_sequences','attachments'] loop
execute format('create policy phase2b_owner_only on public.%I as restrictive for all to authenticated using(public.jobflow_is_owner()) with check(public.jobflow_is_owner())',n);
execute format('create trigger phase2b_guard before insert or update or delete on public.%I for each row execute function public.jobflow_guard()',n);
end loop;end$$;
create table public.client_shares(id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references auth.users on delete cascade,project_id text not null,token_hash text not null unique check(token_hash ~ '^[0-9a-f]{64}$'),client_name text,client_email text,created_at timestamptz not null default now(),revoked_at timestamptz,expires_at timestamptz);
alter table public.client_shares enable row level security;
create policy owner_shares on public.client_shares for all to authenticated using(user_id=auth.uid() and public.jobflow_is_owner()) with check(user_id=auth.uid() and public.jobflow_is_owner() and exists(select 1 from projects where user_id=auth.uid() and id=project_id));
revoke all on public.client_shares from anon,authenticated;grant select,insert,update,delete on public.client_shares to authenticated;
create function public.client_portal(token text) returns jsonb language plpgsql security definer set search_path=public,extensions,pg_temp as $$declare s client_shares;result jsonb;begin
if token !~ '^[0-9a-f]{64}$' then return null;end if;
select * into s from client_shares where token_hash=encode(extensions.digest(token,'sha256'),'hex') and revoked_at is null and (expires_at is null or expires_at>now());
if not found then return null;end if;
select jsonb_build_object('name',p.name,'tasks',coalesce((select jsonb_agg(jsonb_build_object('sequence',t."order",'name',t.name,'status',t.status) order by t."order") from tasks t where t.user_id=s.user_id and t."projectId"=p.id),'[]'::jsonb),'invoices',coalesce((select jsonb_agg(jsonb_build_object('number',i."invoiceNumber",'date',i."issuedDate",'status',i.status,'total',i.total,'paid',i."amountPaid",'vpa',i.supplier->>'vpa','payee',i.supplier->>'legalName') order by i."issuedDate") from invoices i where i.user_id=s.user_id and i."projectId"=p.id and i.status in ('Issued','Partially Paid','Paid')),'[]'::jsonb)) into result from projects p where p.user_id=s.user_id and p.id=s.project_id;
return result;end$$;
revoke all on function public.client_portal(text) from public;grant execute on function public.client_portal(text) to anon,authenticated;
create function public.worker_tasks() returns jsonb language sql stable security definer set search_path=public,pg_temp as $$select coalesce(jsonb_agg(jsonb_build_object('id',t.id,'project',p.name,'name',t.name,'sequence',t."order",'status',t.status,'dueDate',t."dueDate") order by p.name,t."order"),'[]'::jsonb) from profiles r join tasks t on r.owner_id=t.user_id and r.person_id=t."assignedPersonId" join projects p on p.user_id=t.user_id and p.id=t."projectId" where r.id=auth.uid() and r.role='worker'$$;
create function public.worker_complete(task_id text) returns void language plpgsql security definer set search_path=public,pg_temp as $$declare r profiles;t tasks;begin
select * into r from profiles where id=auth.uid() and role='worker';if not found then raise exception 'Worker required' using errcode='42501';end if;
perform pg_advisory_xact_lock(hashtextextended(r.owner_id::text,0));
select * into t from tasks where user_id=r.owner_id and id=task_id and "assignedPersonId"=r.person_id for update;
if not found or t.status not in ('In Progress','Completed') then raise exception 'Assigned active task required' using errcode='42501';end if;
if t.status='Completed' then return;end if;
perform set_config('jobflow.completing','yes',true);
update tasks set status='Completed',"completedDate"=(now() at time zone 'Asia/Kolkata')::date::text where user_id=r.owner_id and id=t.id;
if not exists(select 1 from tasks where user_id=r.owner_id and "projectId"=t."projectId" and status='In Progress') then
update tasks set status='In Progress' where user_id=r.owner_id and id=(select id from tasks where user_id=r.owner_id and "projectId"=t."projectId" and status='Pending' and "order">t."order" order by "order" limit 1);end if;
update projects set "invoicePaymentVersion"=coalesce("invoicePaymentVersion",0)+1 where user_id=r.owner_id and id=t."projectId";
perform set_config('jobflow.completing','no',true);end$;
create table public.worker_proofs(id uuid primary key default gen_random_uuid(),worker_id uuid not null references auth.users on delete cascade,owner_id uuid not null references auth.users on delete cascade,task_id text not null,path text not null unique,created_at timestamptz default now());
alter table public.worker_proofs enable row level security;revoke all on public.worker_proofs from anon,authenticated;
create policy proof_read on public.worker_proofs for select to authenticated using(worker_id=auth.uid() or owner_id=auth.uid());grant select on public.worker_proofs to authenticated;
create function public.worker_proof(task_id text,file_path text) returns void language plpgsql security definer set search_path=public,pg_temp as $$declare r profiles;begin
select * into r from profiles where id=auth.uid() and role='worker';
if not found or not exists(select 1 from tasks where user_id=r.owner_id and id=task_id and "assignedPersonId"=r.person_id) or file_path !~ ('^'||auth.uid()::text||'/[0-9a-f-]{36}\.jpg$') or not exists(select 1 from storage.objects where bucket_id='attachments' and name=file_path) then raise exception 'Assigned task photo required' using errcode='42501';end if;
insert into worker_proofs(worker_id,owner_id,task_id,path) values(auth.uid(),r.owner_id,task_id,file_path);end$$;
revoke all on function public.worker_tasks(),public.worker_complete(text),public.worker_proof(text,text) from public;
grant execute on function public.worker_tasks(),public.worker_complete(text),public.worker_proof(text,text) to authenticated;
create policy owner_worker_photo on storage.objects for select to authenticated using(bucket_id='attachments' and exists(select 1 from public.worker_proofs p where p.path=name and p.owner_id=auth.uid()));
-- Worker identities are assigned once at signup; changing an email never escalates a worker.
-- Owner workspace saves retain advisory locking. Worker completion uses the same lock.
commit;
