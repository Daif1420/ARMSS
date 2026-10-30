import {randomUUID} from "crypto";
import type {SupabaseClient} from "@supabase/supabase-js";

// Import done entirely from the server code (no database function needed).
//  * New Job IDs are inserted.
//  * Existing projects: blank (NULL) values are filled from the file.
//  * Existing projects with a different non-blank value: flagged 'Changed' (or overwritten when apply=true).
//  * Status and box/dossier placement are never touched. Absent rows are NOT marked Missing.
const F=["job_name","branch_name","total_boxes","total_documents","total_sheets","date_of_delivery"] as const;
const blank=(v:any)=>v===null||v===undefined||v==="";
const same=(a:any,b:any)=>String(a)===String(b);
const chunk=<T,>(a:T[],n:number)=>{const o:T[][]=[];for(let i=0;i<a.length;i+=n)o.push(a.slice(i,i+n));return o};

export async function importProjects(s:SupabaseClient,o:{fileName:string;sheetName:string;items:any[];rowCount:number;duplicates:number[];errors:any[];apply:boolean}){
 const importId=randomUUID(),now=new Date().toISOString();
 // 1. read existing projects
 const ex=new Map<number,any>();
 for(const ids of chunk(o.items.map(x=>x.job_id),300)){
  const {data,error}=await s.from("projects").select("job_id,job_name,branch_name,total_boxes,total_documents,total_sheets,date_of_delivery,source_payload,import_state").in("job_id",ids);
  if(error)throw new Error("Read existing projects failed: "+error.message);
  (data||[]).forEach((r:any)=>ex.set(Number(r.job_id),r));
 }
 // 2. batch record
 {const {error}=await s.from("import_batches").insert({id:importId,file_name:o.fileName,sheet_name:o.sheetName,total_rows:o.rowCount,valid_rows:o.items.length,duplicate_rows:o.duplicates.length,error_rows:o.errors.length,details:{duplicate_job_ids:o.duplicates,row_errors:o.errors.slice(0,500),apply:o.apply}});
  if(error)throw new Error("Could not create import batch: "+error.message);}
 // 3. decide per row
 let nw=0,changed=0,applied=0,filled=0,unchanged=0;
 const upserts:any[]=[],log:any[]=[];
 for(const it of o.items){
  const old=ex.get(it.job_id);
  if(!old){
   nw++;upserts.push({job_id:it.job_id,job_name:it.job_name,branch_name:it.branch_name,total_boxes:it.total_boxes,total_documents:it.total_documents,total_sheets:it.total_sheets,date_of_delivery:it.date_of_delivery,source_payload:it.source_payload,import_state:"New",last_seen_import_id:importId,updated_at:now});
   log.push({import_id:importId,job_id:it.job_id,change_type:"New",before_data:null,incoming_data:it});continue}
  const diff=F.some(k=>!blank(old[k])&&!blank(it[k])&&!same(old[k],it[k]));
  const fill=F.some(k=>blank(old[k])&&!blank(it[k]));
  const merged:any={},before:any={};
  for(const k of F){before[k]=old[k]??null;merged[k]=(o.apply&&!blank(it[k]))?it[k]:(blank(old[k])?(it[k]??null):old[k]??null)}
  let state=["Changed","Review"].includes(old.import_state)?old.import_state:"Existing",payload=old.source_payload??{},type="Unchanged";
  if(o.apply&&(diff||fill)){applied++;state="Existing";payload=it.source_payload;type="Changed"}
  else{
   if(fill){filled++;payload=it.source_payload}
   if(diff){changed++;state="Changed";type="Changed"}else unchanged++}
  upserts.push({job_id:it.job_id,...merged,source_payload:payload,import_state:state,last_seen_import_id:importId,updated_at:now});
  log.push({import_id:importId,job_id:it.job_id,change_type:type,before_data:before,incoming_data:it});
 }
 // 4. write (upsert by job_id; status/box/dossier columns are not in the payload so they stay as they are)
 for(const part of chunk(upserts,500)){
  const {error}=await s.from("projects").upsert(part,{onConflict:"job_id"});
  if(error)throw new Error("Saving projects failed: "+error.message);
 }
 for(const part of chunk(log,500)){const {error}=await s.from("import_row_changes").insert(part);if(error)throw new Error("Saving import log failed: "+error.message)}
 await s.from("import_batches").update({new_rows:nw,changed_rows:changed+applied,unchanged_rows:unchanged}).eq("id",importId);
 await s.from("audit_logs").insert({action:"Excel import",entity_type:"import_batch",entity_id:importId,after_data:{file:o.fileName,sheet:o.sheetName,rows:o.items.length,new:nw,changed,applied,filled_blanks:filled,unchanged}});
 return {import_id:importId,total_valid_rows:o.items.length,new:nw,changed,applied,filled_blanks:filled,unchanged,duplicate_rows:o.duplicates.length,invalid_rows:o.errors.length};
}
