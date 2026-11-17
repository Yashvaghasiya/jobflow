begin;
create table if not exists public.business_profiles(user_id uuid primary key references auth.users on delete cascade,"legalName" text not null default '',address text not null default '',"stateCode" text not null default '',gstin text not null default '',vpa text not null default '',"createdAt" timestamptz not null default now(),"updatedAt" timestamptz not null default now());
create table if not exists public.invoices(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,"projectId" text,"clientName" text not null default '',"clientAddress" text not null default '',"clientGstin" text not null default '',"placeOfSupply" text not null default '',"taxRate" numeric not null default 18 check("taxRate" between 0 and 100),notes text not null default '',status text not null default 'Draft' check(status in ('Draft','Issued','Partially Paid','Paid')),"invoiceNumber" text,"financialYear" text,"issuedDate" date,supplier jsonb,subtotal numeric not null default 0,cgst numeric not null default 0,sgst numeric not null default 0,igst numeric not null default 0,total numeric not null default 0,"amountPaid" numeric not null default 0,"createdAt" timestamptz not null default now(),"updatedAt" timestamptz not null default now(),unique(user_id,"invoiceNumber"),unique(id,user_id));
create table if not exists public.invoice_items(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,"invoiceId" uuid not null,position integer not null,description text not null,"hsnSac" text not null,qty numeric not null check(qty>0),rate numeric not null check(rate>=0),"createdAt" timestamptz not null default now(),"updatedAt" timestamptz not null default now(),foreign key("invoiceId",user_id) references public.invoices(id,user_id) on delete cascade);
create table if not exists public.invoice_payments(id uuid primary key,user_id uuid not null references auth.users on delete cascade,"invoiceId" uuid not null,amount numeric not null check(amount>0),note text not null default '',"createdAt" timestamptz not null default now(),"updatedAt" timestamptz not null default now(),foreign key("invoiceId",user_id) references public.invoices(id,user_id) on delete cascade);
create table if not exists public.invoice_sequences(user_id uuid not null references auth.users on delete cascade,fy text not null,serial integer not null check(serial between 1 and 9999),primary key(user_id,fy));
create table if not exists public.attachments(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,"projectId" text,"taskId" text,path text unique not null,"fileName" text not null,"createdAt" timestamptz not null default now(),"updatedAt" timestamptz not null default now(),check ("projectId" is not null or "taskId" is not null));
do $$ declare t text; begin foreach t in array array['business_profiles','invoices','invoice_items','invoice_payments','invoice_sequences','attachments'] loop execute format('alter table public.%I enable row level security',t);execute format('create policy owner_select on public.%I for select to authenticated using (auth.uid()=user_id)',t); end loop; end $$;
create policy owner_write on public.business_profiles for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy owner_attachments on public.attachments for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id and (storage.foldername(path))[1]=auth.uid()::text and ("projectId" is null or exists(select 1 from public.projects p where p.id=attachments."projectId" and p.user_id=auth.uid())) and ("taskId" is null or exists(select 1 from public.tasks t where t.id=attachments."taskId" and t.user_id=auth.uid())));
revoke all on public.business_profiles,public.invoices,public.invoice_items,public.invoice_payments,public.invoice_sequences,public.attachments from anon;
revoke insert,update,delete,truncate,references,trigger on public.invoices,public.invoice_items,public.invoice_payments,public.invoice_sequences from authenticated;
grant select on public.business_profiles,public.invoices,public.invoice_items,public.invoice_payments,public.attachments to authenticated;
grant insert,update,delete on public.business_profiles,public.attachments to authenticated;
create or replace function public.save_jobflow_invoice(request jsonb,issue boolean default false) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare uid uuid:=auth.uid(); iid uuid:=coalesce(nullif(request->>'id','')::uuid,gen_random_uuid()); inv public.invoices; prof public.business_profiles; item jsonb; pos integer:=0; sub numeric:=0; c numeric:=0; s numeric:=0; ig numeric:=0; rt numeric:=coalesce((request->>'taxRate')::numeric,18); fy text; yr integer; seq integer; dt date:=(now() at time zone 'Asia/Kolkata')::date;
begin
 if uid is null then raise insufficient_privilege; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 select * into inv from public.invoices where id=iid for update;
 if found and (inv.user_id<>uid or inv.status<>'Draft') then raise exception 'Only owned drafts may be edited'; end if;
 if nullif(request->>'projectId','') is not null and not exists(select 1 from public.projects where id=request->>'projectId' and user_id=uid) then raise exception 'Project not owned'; end if;
 if rt<0 or rt>100 or jsonb_array_length(request->'items') not between 1 and 500 then raise exception 'Invalid invoice items or tax rate'; end if;
 for item in select * from jsonb_array_elements(request->'items') loop
 if coalesce(trim(item->>'description'),'')='' or coalesce(item->>'hsnSac','') !~ '^[0-9]{4,8}$' or (item->>'qty')::numeric<=0 or (item->>'rate')::numeric<0 then raise exception 'Description, HSN/SAC, positive quantity and nonnegative rate required'; end if;
 sub:=sub+round((item->>'qty')::numeric*(item->>'rate')::numeric,2); end loop;
 select * into prof from public.business_profiles where user_id=uid;
 if issue then
 if coalesce(trim(prof."legalName"),'')='' or coalesce(trim(prof.address),'')='' or coalesce(prof."stateCode",'') !~ '^(0[1-9]|[12][0-9]|3[0-8])$' or prof."stateCode" in ('25','28') or coalesce(prof.gstin,'') !~ ('^'||prof."stateCode"||'[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$') or coalesce(prof.vpa,'') !~ '^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9._-]{1,64}$' then raise exception 'Complete business profile in Settings before issuing'; end if;
 if coalesce(trim(request->>'clientName'),'')='' or coalesce(trim(request->>'clientAddress'),'')='' or coalesce(request->>'placeOfSupply','') !~ '^(0[1-9]|[12][0-9]|3[0-8])$' or request->>'placeOfSupply' in ('25','28') then raise exception 'Client name, address and valid place of supply required'; end if;
 if coalesce(request->>'clientGstin','')<>'' and request->>'clientGstin' !~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$' then raise exception 'Invalid client GSTIN'; end if;
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
end $$;
create or replace function public.delete_jobflow_draft(invoice_id uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$ begin if auth.uid() is null then raise insufficient_privilege;end if; delete from invoices where id=invoice_id and user_id=auth.uid() and status='Draft';if not found then raise exception 'Owned draft not found';end if;end $$;
create or replace function public.record_jobflow_invoice_payment(invoice_id uuid,payment_id uuid,paid_amount numeric,payment_note text default '') returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare inv invoices;begin
 if auth.uid() is null then raise insufficient_privilege;end if;
 select * into inv from invoices where id=invoice_id and user_id=auth.uid() for update;
 if not found or inv.status='Draft' then raise exception 'Issued invoice required';end if;
 if exists(select 1 from invoice_payments where id=payment_id and user_id=auth.uid() and "invoiceId"=invoice_id and amount=paid_amount) then return;end if;
 if paid_amount<>round(paid_amount,2) or paid_amount<=0 or paid_amount>inv.total-inv."amountPaid" then raise exception 'Payment exceeds balance or has invalid precision';end if;
 if inv."projectId" is not null then
 update projects set "clientAmountReceived"=coalesce("clientAmountReceived",0)+paid_amount,"updatedAt"=now() where id=inv."projectId" and user_id=auth.uid() and coalesce("clientAmountReceived",0)+paid_amount<="projectValue";
 if not found then raise exception 'Project missing or receipt exceeds project value. Update project value before recording.';end if;end if;
 insert into invoice_payments(id,user_id,"invoiceId",amount,note) values(payment_id,auth.uid(),invoice_id,paid_amount,payment_note);
 update invoices set "amountPaid"="amountPaid"+paid_amount,status=case when "amountPaid"+paid_amount=total then 'Paid' else 'Partially Paid' end,"updatedAt"=now() where id=invoice_id;
end $$;
revoke all on function public.save_jobflow_invoice(jsonb,boolean),public.delete_jobflow_draft(uuid),public.record_jobflow_invoice_payment(uuid,uuid,numeric,text) from public,anon;
grant execute on function public.save_jobflow_invoice(jsonb,boolean),public.delete_jobflow_draft(uuid),public.record_jobflow_invoice_payment(uuid,uuid,numeric,text) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('attachments','attachments',false,5242880,array['image/jpeg']) on conflict(id) do nothing;
create policy attachments_owner on storage.objects for all to authenticated using(bucket_id='attachments' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='attachments' and (storage.foldername(name))[1]=auth.uid()::text);
commit;
