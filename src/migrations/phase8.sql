begin;
alter table public.tasks add column if not exists scheduled_date date;
alter table public.invoices add column if not exists "clientPhone" text;
-- Existing owner-scoped RLS and workspace JSON populate-record path are unchanged.
alter table public.business_profiles add column if not exists "reviewLink" text default '';
alter table public.business_profiles add column if not exists "reviewEnabled" boolean default false;
create or replace function public.save_jobflow_invoice(request jsonb,issue boolean default false) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
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
 if coalesce(trim(item->>'description'),'')='' or coalesce(item->>'hsnSac','') !~ '^[0-9]{4,8}$' or nullif(item->>'qty','') is null or nullif(item->>'rate','') is null or (item->>'qty')::numeric<=0 or (item->>'rate')::numeric<0 then raise exception 'Description, HSN/SAC, positive quantity and nonnegative rate required'; end if;
 sub:=sub+round((item->>'qty')::numeric*(item->>'rate')::numeric,2); end loop;
 select * into prof from public.business_profiles where user_id=uid;
 if issue then
 if coalesce(trim(prof."legalName"),'')='' or coalesce(trim(prof.address),'')='' or coalesce(prof."stateCode",'') !~ '^(0[1-9]|[12][0-9]|3[0-8])$' or prof."stateCode" in ('25','28') or coalesce(prof.gstin,'') !~ ('^'||prof."stateCode"||'[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$') or coalesce(prof.vpa,'') !~ '^[a-zA-Z0-9._-]{2,255}@[a-zA-Z][a-zA-Z0-9._-]{1,64}$' then raise exception 'Complete business profile in Settings before issuing'; end if;
 if coalesce(trim(request->>'clientName'),'')='' or coalesce(trim(request->>'clientAddress'),'')='' or coalesce(request->>'placeOfSupply','') !~ '^(0[1-9]|[12][0-9]|3[0-8])$' or request->>'placeOfSupply' in ('25','28') then raise exception 'Client name, address and valid place of supply required'; end if;
 if coalesce(request->>'clientGstin','')<>'' and request->>'clientGstin' !~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$' then raise exception 'Invalid client GSTIN'; end if;
 yr:=extract(year from dt)::integer-case when extract(month from dt)<4 then 1 else 0 end; fy:=yr::text||'-'||right((yr+1)::text,2);
 insert into public.invoice_sequences values(uid,fy,1) on conflict on constraint invoice_sequences_pkey do update set serial=invoice_sequences.serial+1 returning serial into seq;
 end if;
 if prof."stateCode"=request->>'placeOfSupply' then c:=round(sub*rt/200,2);s:=c;else ig:=round(sub*rt/100,2);end if;
 insert into public.invoices(id,user_id,"projectId","clientName","clientPhone","clientAddress","clientGstin","placeOfSupply","taxRate",notes,status,"invoiceNumber","financialYear","issuedDate",supplier,subtotal,cgst,sgst,igst,total)
 values(iid,uid,nullif(request->>'projectId',''),coalesce(request->>'clientName',''),left(coalesce(request->>'clientPhone',''),32),coalesce(request->>'clientAddress',''),coalesce(request->>'clientGstin',''),coalesce(request->>'placeOfSupply',''),rt,coalesce(request->>'notes',''),case when issue then 'Issued' else 'Draft' end,case when issue then 'INV/'||fy||'/'||lpad(seq::text,4,'0') end,fy,case when issue then dt end,to_jsonb(prof)-'user_id',sub,c,s,ig,sub+c+s+ig)
 on conflict(id) do update set "projectId"=excluded."projectId","clientName"=excluded."clientName","clientPhone"=excluded."clientPhone","clientAddress"=excluded."clientAddress","clientGstin"=excluded."clientGstin","placeOfSupply"=excluded."placeOfSupply","taxRate"=excluded."taxRate",notes=excluded.notes,status=excluded.status,"invoiceNumber"=excluded."invoiceNumber","financialYear"=excluded."financialYear","issuedDate"=excluded."issuedDate",supplier=excluded.supplier,subtotal=excluded.subtotal,cgst=excluded.cgst,sgst=excluded.sgst,igst=excluded.igst,total=excluded.total,"updatedAt"=now() returning * into inv;
 delete from public.invoice_items where "invoiceId"=iid;
 for item in select * from jsonb_array_elements(request->'items') loop pos:=pos+1;insert into public.invoice_items(user_id,"invoiceId",position,description,"hsnSac",qty,rate) values(uid,iid,pos,item->>'description',item->>'hsnSac',(item->>'qty')::numeric,(item->>'rate')::numeric);end loop;
 return to_jsonb(inv);
end $$;
commit;
