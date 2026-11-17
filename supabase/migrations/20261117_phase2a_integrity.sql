begin;
alter table public.projects add column if not exists "invoicePaymentVersion" integer default 0;
create or replace function public.save_jobflow_workspace(workspace jsonb) returns void language plpgsql security invoker set search_path=public as $$ declare uid uuid:=auth.uid(); begin if uid is null then raise exception 'Authentication required'; end if;
perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
if exists(select 1 from projects p join jsonb_array_elements(workspace->'projects') x on x->>'id'=p.id where p.user_id=uid and coalesce(p."invoicePaymentVersion",0)<>coalesce((x->>'invoicePaymentVersion')::integer,0)) then raise exception 'Invoice receipts changed in another tab. Export unsynced changes and reload before saving.';end if;
if jsonb_typeof(workspace->'projects') is distinct from 'array' then raise exception 'Invalid projects collection'; end if; delete from public.projects where user_id=uid; insert into public.projects select (jsonb_populate_record(null::public.projects, value || jsonb_build_object('user_id',uid,'created_at',coalesce(value->>'created_at',now()::text),'updated_at',now()))).* from jsonb_array_elements(workspace->'projects');
if jsonb_typeof(workspace->'tasks') is distinct from 'array' then raise exception 'Invalid tasks collection'; end if; delete from public.tasks where user_id=uid; insert into public.tasks select (jsonb_populate_record(null::public.tasks, value || jsonb_build_object('user_id',uid,'created_at',coalesce(value->>'created_at',now()::text),'updated_at',now()))).* from jsonb_array_elements(workspace->'tasks');
if jsonb_typeof(workspace->'people') is distinct from 'array' then raise exception 'Invalid people collection'; end if; delete from public.people where user_id=uid; insert into public.people select (jsonb_populate_record(null::public.people, value || jsonb_build_object('user_id',uid,'created_at',coalesce(value->>'created_at',now()::text),'updated_at',now()))).* from jsonb_array_elements(workspace->'people');
if jsonb_typeof(workspace->'purchases') is distinct from 'array' then raise exception 'Invalid purchases collection'; end if; delete from public.purchases where user_id=uid; insert into public.purchases select (jsonb_populate_record(null::public.purchases, value || jsonb_build_object('user_id',uid,'created_at',coalesce(value->>'created_at',now()::text),'updated_at',now()))).* from jsonb_array_elements(workspace->'purchases');
if jsonb_typeof(workspace->'reminders') is distinct from 'array' then raise exception 'Invalid reminders collection'; end if; delete from public.reminders where user_id=uid; insert into public.reminders select (jsonb_populate_record(null::public.reminders, value || jsonb_build_object('user_id',uid,'created_at',coalesce(value->>'created_at',now()::text),'updated_at',now()))).* from jsonb_array_elements(workspace->'reminders');
end $$;
create or replace function public.record_jobflow_invoice_payment(invoice_id uuid,payment_id uuid,paid_amount numeric,payment_note text default '') returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare inv invoices;begin
 if auth.uid() is null then raise insufficient_privilege;end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select * into inv from invoices where id=invoice_id and user_id=auth.uid() for update;
 if not found or inv.status='Draft' then raise exception 'Issued invoice required';end if;
 if exists(select 1 from invoice_payments where id=payment_id and user_id=auth.uid() and "invoiceId"=invoice_id and amount=paid_amount) then return;end if;
 if paid_amount<>round(paid_amount,2) or paid_amount<=0 or paid_amount>inv.total-inv."amountPaid" then raise exception 'Payment exceeds balance or has invalid precision';end if;
 if inv."projectId" is not null then
 update projects set "invoicePaymentVersion"=coalesce("invoicePaymentVersion",0)+1,"clientAmountReceived"=coalesce("clientAmountReceived",0)+paid_amount,"updatedAt"=now() where id=inv."projectId" and user_id=auth.uid() and coalesce("clientAmountReceived",0)+paid_amount<="projectValue";
 if not found then raise exception 'Project missing or receipt exceeds project value. Update project value before recording.';end if;end if;
 insert into invoice_payments(id,user_id,"invoiceId",amount,note) values(payment_id,auth.uid(),invoice_id,paid_amount,payment_note);
 update invoices set "amountPaid"="amountPaid"+paid_amount,status=case when "amountPaid"+paid_amount=total then 'Paid' else 'Partially Paid' end,"updatedAt"=now() where id=invoice_id;
end $$;

create or replace function public.save_jobflow_invoice(request jsonb,issue boolean default false) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $
declare uid uuid:=auth.uid(); iid uuid:=coalesce(nullif(request->>'id','')::uuid,gen_random_uuid()); inv public.invoices; prof public.business_profiles; item jsonb; pos integer:=0; sub numeric:=0; c numeric:=0; s numeric:=0; ig numeric:=0; rt numeric:=coalesce((request->>'taxRate')::numeric,18); fy text; yr integer; seq integer; dt date:=(now() at time zone 'Asia/Kolkata')::date;
begin
 if uid is null then raise insufficient_privilege; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 select * into inv from public.invoices where id=iid for update;
 if found and (inv.user_id<>uid or inv.status<>'Draft') then raise exception 'Only owned drafts may be edited'; end if;
 if nullif(request->>'projectId','') is not null and not exists(select 1 from public.projects where id=request->>'projectId' and user_id=uid) then raise exception 'Project not owned'; end if;
 if rt is null or rt<0 or rt>100 or jsonb_typeof(request->'items') is distinct from 'array' then raise exception 'Invalid invoice items or tax rate';end if;
 if jsonb_array_length(request->'items') not between 1 and 500 then raise exception 'Invalid invoice items or tax rate'; end if;
 for item in select * from jsonb_array_elements(request->'items') loop
 if coalesce(trim(item->>'description'),'')='' or coalesce(item->>'hsnSac','') !~ '^[0-9]{4,8}
 or nullif(item->>'qty','') is null or nullif(item->>'rate','') is null or (item->>'qty')::numeric<=0 or (item->>'rate')::numeric<0 then raise exception 'Description, HSN/SAC, positive quantity and nonnegative rate required'; end if;
 sub:=sub+round((item->>'qty')::numeric*(item->>'rate')::numeric,2); end loop;
 select * into prof from public.business_profiles where user_id=uid;
 if issue then
 if coalesce(trim(prof."legalName"),'')='' or coalesce(trim(prof.address),'')='' or coalesce(prof."stateCode",'') !~ '^(0[1-9]|[12][0-9]|3[0-8])
 or prof."stateCode" in ('25','28') or coalesce(prof.gstin,'') !~ ('^'||prof."stateCode"||'[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]
) or coalesce(prof.vpa,'') !~ '^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9._-]{1,64}
 then raise exception 'Complete business profile in Settings before issuing'; end if;
 if coalesce(trim(request->>'clientName'),'')='' or coalesce(trim(request->>'clientAddress'),'')='' or coalesce(request->>'placeOfSupply','') !~ '^(0[1-9]|[12][0-9]|3[0-8])
 or request->>'placeOfSupply' in ('25','28') then raise exception 'Client name, address and valid place of supply required'; end if;
 if coalesce(request->>'clientGstin','')<>'' and request->>'clientGstin' !~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]
 then raise exception 'Invalid client GSTIN'; end if;
 yr:=extract(year from dt)::integer-case when extract(month from dt)<4 then 1 else 0 end; fy:=yr::text||'-'||right((yr+1)::text,2);
 insert into public.invoice_sequences values(uid,fy,1) on conflict(user_id,fy) do update set serial=invoice_sequences.serial+1 returning serial into seq;
 end if;
 if prof."stateCode"=request->>'placeOfSupply' then c:=round(sub*rt/200,2);s:=c;else ig:=round(sub*rt/100,2);end if;
 insert into public.invoices(id,user_id,"projectId","clientName","clientAddress","clientGstin","placeOfSupply","taxRate",notes,status,"invoiceNumber","financialYear","issuedDate",supplier,subtotal,cgst,sgst,igst,total)
 values(iid,uid,nullif(request->>'projectId',''),coalesce(request->>'clientName',''),coalesce(request->>'clientAddress',''),coalesce(request->>'clientGstin',''),coalesce(request->>'placeOfSupply',''),rt,coalesce(request->>'notes',''),case when issue then 'Issued' else 'Draft' end,case when issue then 'INV/'||fy||'/'||lpad(seq::text,4,'0') end,fy,case when issue then dt end,to_jsonb(prof)-'user_id',sub,c,s,ig,sub+c+s+ig)
 on conflict(id) do update set "projectId"=excluded."projectId","clientName"=excluded."clientName","clientAddress"=excluded."clientAddress","clientGstin"=excluded."clientGstin","placeOfSupply"=excluded."placeOfSupply","taxRate"=excluded."taxRate",notes=excluded.notes,status=excluded.status,"invoiceNumber"=excluded."invoiceNumber","financialYear"=excluded."financialYear","issuedDate"=excluded."issuedDate",supplier=excluded.supplier,subtotal=excluded.subtotal,cgst=excluded.cgst,sgst=excluded.sgst,igst=excluded.igst,total=excluded.total,"updatedAt"=now() returning * into inv;
 delete from public.invoice_items where "invoiceId"=iid;
 for item in select * from jsonb_array_elements(request->'items') loop pos:=pos+1;insert into public.invoice_items(user_id,"invoiceId",position,description,"hsnSac",qty,rate) values(uid,iid,pos,item->>'description',item->>'hsnSac',(item->>'qty')::numeric,(item->>'rate')::numeric);end loop;
 return to_jsonb(inv);
end $;

commit;
