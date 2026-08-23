-- DEVELOPMENT ONLY. All names and records below are fictional.
do $$ declare site uuid := '10000000-0000-4000-8000-000000000001'; s0 uuid := '20000000-0000-4000-8000-000000000001'; s1 uuid := '20000000-0000-4000-8000-000000000002'; p0 uuid := '30000000-0000-4000-8000-000000000001'; p1 uuid := '30000000-0000-4000-8000-000000000002'; u0 uuid := '40000000-0000-4000-8000-000000000001'; u1 uuid := '40000000-0000-4000-8000-000000000002'; sub uuid := '60000000-0000-4000-8000-000000000001'; begin
insert into public.sites(id,name,description) values(site,'Harbourline Tower · Block B','Fictional development seed');
insert into public.storeys(id,site_id,name,number,level_from,level_to,structural_note) values
 (s0,site,'Ground floor',0,0,4.2,'Transfer slab above'), (s1,site,'Level 01',1,4.2,7.8,'Typical reinforced-concrete frame');
insert into public.floor_plans(id,site_id,storey_id,name,code,slab_level,gross_area,structural_grid) values
 (p0,site,s0,'Ground floor plan','A-GF-01',0,1840,'A–H / 1–8'), (p1,site,s1,'Level 01 plan','A-01-01',4.2,1765,'A–H / 1–8');
insert into public.units(id,site_id,floor_plan_id,code,room_tags,usable_area,ceiling_height,entry_door,boundary_type,grid_reference,status) values
 (u0,site,p0,'B-G-01',array['G01','G02'],310,3.2,'D-G01','Blockwork','A–C / 1–3','occupied'),
 (u1,site,p1,'B-1-01',array['101','102','103'],428,2.8,'D-101','Stud partition','C–F / 2–5','fit-out');
insert into public.installations(site_id,unit_id,equipment,model,asset_tag,location_in_unit,installed_date,state) values
 (site,u0,'Air handling unit','AeroFlow 400','HLB-AHU-001','Plant enclosure','2026-03-14','live'),
 (site,u1,'Distribution board','VoltSafe DB24','HLB-DB-014','Electrical riser',null,'scheduled');
insert into public.subcontractors(id,site_id,company_name,trade,contact_person,email,contract_reference,default_scope_codes) values
 (sub,site,'North Quay Services','Mechanical','Maya Chen','maya@example.invalid','HLB-MEP-07',array['C','D']::public.scope_code[]);
insert into public.scope_assignments(site_id,subcontractor_id,unit_id,scope_code) values(site,sub,u0,'C'),(site,sub,u0,'D');
end $$;
