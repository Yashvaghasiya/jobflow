begin;
create extension if not exists pg_cron;
create table public.automation_settings (
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 rule_key text not null check(rule_key in ('task_due_soon','task_overdue','invoice_overdue','project_pending_closure')),
 enabled boolean not null default false, config jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 primary key(user_id,rule_key), check(jsonb_typeof(config)='object'),
 check(not(config ? 'daysBeforeDue') or (config->>'daysBeforeDue')::integer between 0 and 30),
 check(not(config ? 'daysAfterIssue') or (config->>'daysAfterIssue')::integer between 1 and 90));
alter table public.automation_settings enable row level security;
create policy owner_automation_settings on public.automation_settings for all to authenticated using(auth.uid()=user_id and exists(select 1 from public.profiles where id=auth.uid() and role='owner')) with check(auth.uid()=user_id and exists(select 1 from public.profiles where id=auth.uid() and role='owner'));
grant select,insert,update,delete on public.automation_settings to authenticated;
revoke all on public.automation_settings from anon;
create table public.automation_runs(user_id uuid primary key references auth.users(id) on delete cascade,last_run timestamptz not null);
alter table public.automation_runs enable row level security;
revoke all on public.automation_runs from anon,authenticated;
alter table public.reminders add column "sourceKey" text;
create unique index reminders_automation_key on public.reminders(user_id,"sourceKey") where "sourceKey" is not null;
-- A condition key includes its due-date occurrence, not scan date. Completed/dismissed reminders remain tombstones.
create or replace function public.jobflow_scan_owner(uid uuid) returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare dt date:=(now() at time zone 'Asia/Kolkata')::date; n integer;
begin
perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
if not exists(select 1 from public.profiles where id=uid and role='owner') then return 0; end if;
with candidates as (
 select 'task_due_soon:'||t.id||':'||t."dueDate" as key,'Due soon: '||t.name as title,t."projectId" as project_id,'Task due '||t."dueDate" as description
 from public.tasks t join public.automation_settings a on a.user_id=t.user_id and a.rule_key='task_due_soon' and a.enabled
 where t.user_id=uid and t.status is distinct from 'Completed' and t."dueDate">=dt::text and t."dueDate"<=(dt+coalesce((a.config->>'daysBeforeDue')::integer,2))::text
 union all
 select 'task_overdue:'||t.id||':'||t."dueDate",'Overdue: '||t.name,t."projectId",'Task due '||t."dueDate"
 from public.tasks t join public.automation_settings a on a.user_id=t.user_id and a.rule_key='task_overdue' and a.enabled
 where t.user_id=uid and t.status is distinct from 'Completed' and t."dueDate" ~ '^\d{4}-\d{2}-\d{2}$' and t."dueDate"<dt::text
 union all
 select 'invoice_overdue:'||i.id||':'||i."issuedDate"||':'||coalesce(a.config->>'daysAfterIssue','15'),'Invoice overdue: '||coalesce(i."invoiceNumber",i.id::text),i."projectId",'Unpaid balance: INR '||(i.total-i."amountPaid")::text
 from public.invoices i join public.automation_settings a on a.user_id=i.user_id and a.rule_key='invoice_overdue' and a.enabled
 where i.user_id=uid and i.status<>'Draft' and i.total>i."amountPaid" and i."issuedDate"+coalesce((a.config->>'daysAfterIssue')::integer,15)<dt
 union all
 select 'project_pending_closure:'||p.id,'Close out: '||p.name,p.id,'All tasks completed. Review project status and outstanding invoices.'
 from public.projects p join public.automation_settings a on a.user_id=p.user_id and a.rule_key='project_pending_closure' and a.enabled
 where p.user_id=uid and exists(select 1 from public.tasks t where t.user_id=uid and t."projectId"=p.id)
 and not exists(select 1 from public.tasks t where t.user_id=uid and t."projectId"=p.id and t.status is distinct from 'Completed')
 and (p.status is distinct from 'Completed' or exists(select 1 from public.invoices i where i.user_id=uid and i."projectId"=p.id and i.status<>'Draft' and i.total>i."amountPaid"))
)
insert into public.reminders(id,user_id,title,description,"projectId",date,time,priority,completed,"sourceKey")
select gen_random_uuid()::text,uid,title,description,project_id,dt::text,'06:00','High',false,key from candidates
on conflict(user_id,"sourceKey") where "sourceKey" is not null do nothing;
get diagnostics n=row_count; return n;
end $$;
revoke all on function public.jobflow_scan_owner(uuid) from public,anon,authenticated;
create or replace function public.jobflow_run_automations() returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare u uuid;n integer:=0;begin
for u in select distinct user_id from public.automation_settings where enabled loop n:=n+public.jobflow_scan_owner(u);end loop;
return n;end $$;
revoke all on function public.jobflow_run_automations() from public,anon,authenticated;
create or replace function public.jobflow_run_my_automations() returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare uid uuid:=auth.uid();begin
if uid is null or not exists(select 1 from public.profiles where id=uid and role='owner') then raise insufficient_privilege using message='Owner authentication required';end if;
perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
if exists(select 1 from public.automation_runs where user_id=uid and last_run>now()-interval '1 minute') then raise exception 'Please wait one minute between scans';end if;
insert into public.automation_runs values(uid,now()) on conflict(user_id) do update set last_run=excluded.last_run;
return public.jobflow_scan_owner(uid);end $$;
revoke all on function public.jobflow_run_my_automations() from public,anon;
grant execute on function public.jobflow_run_my_automations() to authenticated;
-- GMT verified in the project's cron.timezone. 00:30 GMT = 06:00 Asia/Kolkata.
select cron.schedule('jobflow-daily-automations','30 0 * * *','select public.jobflow_run_automations();');
-- Preserve cron reminders absent from an older open client's snapshot. Same owner lock serializes scans/saves.
create or replace function public.save_jobflow_workspace(workspace jsonb) returns void language plpgsql security invoker set search_path=public as $$ declare uid uuid:=auth.uid(); begin if uid is null then raise exception 'Authentication required'; end if;
perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
if exists(select 1 from projects p join jsonb_array_elements(workspace->'projects') x on x->>'id'=p.id where p.user_id=uid and coalesce(p."invoicePaymentVersion",0)<>coalesce((x->>'invoicePaymentVersion')::integer,0)) then raise exception 'Invoice receipts changed in another tab. Export unsynced changes and reload before saving.';end if;
if jsonb_typeof(workspace->'projects') is distinct from 'array' then raise exception 'Invalid projects collection'; end if; delete from public.projects where user_id=uid; insert into public.projects select (jsonb_populate_record(null::public.projects, value || jsonb_build_object('user_id',uid,'created_at',coalesce(value->>'created_at',now()::text),'updated_at',now()))).* from jsonb_array_elements(workspace->'projects');
if jsonb_typeof(workspace->'tasks') is distinct from 'array' then raise exception 'Invalid tasks collection'; end if; delete from public.tasks where user_id=uid; insert into public.tasks select (jsonb_populate_record(null::public.tasks, value || jsonb_build_object('user_id',uid,'created_at',coalesce(value->>'created_at',now()::text),'updated_at',now()))).* from jsonb_array_elements(workspace->'tasks');
if jsonb_typeof(workspace->'people') is distinct from 'array' then raise exception 'Invalid people collection'; end if; delete from public.people where user_id=uid; insert into public.people select (jsonb_populate_record(null::public.people, value || jsonb_build_object('user_id',uid,'created_at',coalesce(value->>'created_at',now()::text),'updated_at',now()))).* from jsonb_array_elements(workspace->'people');
if jsonb_typeof(workspace->'purchases') is distinct from 'array' then raise exception 'Invalid purchases collection'; end if; delete from public.purchases where user_id=uid; insert into public.purchases select (jsonb_populate_record(null::public.purchases, value || jsonb_build_object('user_id',uid,'created_at',coalesce(value->>'created_at',now()::text),'updated_at',now()))).* from jsonb_array_elements(workspace->'purchases');
if jsonb_typeof(workspace->'reminders') is distinct from 'array' then raise exception 'Invalid reminders collection'; end if; delete from public.reminders where user_id=uid and ("sourceKey" is null or id in (select x->>'id' from jsonb_array_elements(workspace->'reminders') x)); insert into public.reminders select (jsonb_populate_record(null::public.reminders, value || jsonb_build_object('user_id',uid,'created_at',coalesce(value->>'created_at',now()::text),'updated_at',now()))).* from jsonb_array_elements(workspace->'reminders');
end $$;

commit;
