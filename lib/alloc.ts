import type {SupabaseClient} from "@supabase/supabase-js";
// Allocation RULE. A project's slot is fixed by its Job ID, so a missing project keeps its reserved slot.
export const RULE={prefix:"D",firstBox:41,startJobId:35150,boxSize:300,dossierSize:50};
const num=(c:string)=>Number(String(c).replace(/\D/g,""))||0;
const chunks=<T,>(a:T[],n:number)=>{const out:T[][]=[];for(let i=0;i<a.length;i+=n)out.push(a.slice(i,i+n));return out};

export async function allocate(s:SupabaseClient,uid?:string){
 // Fetch unassigned IDs in pages. The partial index in migration 003 makes this scan cheap.
 const un:number[]=[];
 for(let page=0;page<200;page++){
  const {data,error}=await s.from("projects").select("job_id").is("box_id",null)
   .gte("job_id",RULE.startJobId).order("job_id").range(page*1000,page*1000+999);
  if(error)throw new Error("Reading unassigned projects failed: "+error.message);
  const rows=data||[];un.push(...rows.map((x:any)=>Number(x.job_id)));
  if(rows.length<1000)break;
 }
 if(!un.length)return [];

 const [{data:boxRows,error:boxError},{data:dossierRows,error:dossierError}]=await Promise.all([
  s.from("archive_boxes").select("id,box_code"),
  s.from("dossiers").select("id,box_id,dossier_number")
 ]);
 if(boxError)throw new Error("Reading archive boxes failed: "+boxError.message);
 if(dossierError)throw new Error("Reading dossiers failed: "+dossierError.message);
 const boxes=new Map<string,any>((boxRows||[]).map((b:any)=>[b.box_code,b]));
 const dossiers=new Map<string,any>((dossierRows||[]).map((d:any)=>[`${d.box_id}|${d.dossier_number}`,d]));
 const groups=new Map<string,number[]>(),counts:Record<string,number>={};
 for(const id of un){
  const offset=id-RULE.startJobId;
  const code=RULE.prefix+(RULE.firstBox+Math.floor(offset/RULE.boxSize));
  const dossierNo=Math.floor((offset%RULE.boxSize)/RULE.dossierSize)+1;
  const key=code+"|"+dossierNo;
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key)!.push(id);counts[code]=(counts[code]||0)+1;
 }
 const result:any[]=[];
 for(const code of Object.keys(counts).sort((a,b)=>num(a)-num(b))){
  const first=RULE.startJobId+(num(code)-RULE.firstBox)*RULE.boxSize;
  let box=boxes.get(code);
  if(!box){
   const {data,error}=await s.from("archive_boxes").insert({box_code:code,first_job_id:first,last_job_id:first+RULE.boxSize-1}).select("id,box_code").single();
   if(error){result.push({code,skipped:error.message});continue;}
   box=data;boxes.set(code,box);
   const {error:auditError}=await s.from("audit_logs").insert({actor_id:uid??null,action:"Box created (auto allocation)",entity_type:"box",entity_id:code,after_data:{rule:RULE}});
   if(auditError)throw new Error("Logging new box failed: "+auditError.message);
  }
  const updates:{dossierId:string;ids:number[]}[]=[];
  for(let dossierNo=1;dossierNo<=6;dossierNo++){
   const ids=groups.get(`${code}|${dossierNo}`);
   if(!ids?.length)continue;
   const key=`${box.id}|${dossierNo}`;
   let dossier=dossiers.get(key);
   if(!dossier){
    const firstDossier=first+(dossierNo-1)*RULE.dossierSize;
    const {data,error}=await s.from("dossiers").insert({box_id:box.id,dossier_number:dossierNo,first_job_id:firstDossier,last_job_id:firstDossier+RULE.dossierSize-1}).select("id,box_id,dossier_number").single();
    if(error){if(error.code==="23505"){const retry=await s.from("dossiers").select("id,box_id,dossier_number").eq("box_id",box.id).eq("dossier_number",dossierNo).single();if(retry.error)throw new Error("Creating dossier failed: "+retry.error.message);dossier=retry.data;}else throw new Error("Creating dossier failed: "+error.message);}
    else dossier=data;
    dossiers.set(key,dossier);
   }
   updates.push({dossierId:dossier.id,ids});
  }
  // Update independent dossiers concurrently; each request updates a bounded set of IDs.
  const updateResults=await Promise.all(updates.map(async u=>{
   for(const part of chunks(u.ids,500)){
    const {error}=await s.from("projects").update({box_id:box.id,dossier_id:u.dossierId}).in("job_id",part).is("box_id",null);
    if(error)throw new Error(`Assigning ${code} failed: ${error.message}`);
   }
  }));
  void updateResults;
  result.push({code,assigned:counts[code]});
 }
 const {error:auditError}=await s.from("audit_logs").insert({actor_id:uid??null,action:"Auto allocation",entity_type:"allocation",entity_id:"auto",after_data:{result}});
 if(auditError)throw new Error("Writing allocation audit failed: "+auditError.message);
 return result;
}
