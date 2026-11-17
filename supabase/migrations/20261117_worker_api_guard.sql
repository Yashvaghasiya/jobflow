begin;
create function public.jobflow_api_guard() returns void language plpgsql security definer set search_path=public,pg_temp as $$begin
if exists(select 1 from profiles where id=auth.uid() and role='worker') and coalesce(current_setting('request.path',true),'') not in ('/profiles','/rpc/worker_tasks','/rpc/worker_complete','/rpc/worker_proof','/worker_proofs','/rpc/client_portal') then raise exception 'Worker access denied' using errcode='42501';end if;end$$;
revoke all on function public.jobflow_api_guard() from public;grant execute on function public.jobflow_api_guard() to authenticated,anon;
alter role authenticator set pgrst.db_pre_request='public.jobflow_api_guard';
notify pgrst,'reload config';
revoke all on function public.jobflow_signup(),public.jobflow_guard() from public;
commit;
