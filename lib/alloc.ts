import type {SupabaseClient} from "@supabase/supabase-js";
// Allocation RULE. A project's slot is fixed by its Job ID, so a missing project keeps its reserved slot
// and nothing shifts. Box n = [start + (n-firstBox)*boxSize, +boxSize-1]; dossier = 50 consecutive IDs.
export const RULE={prefix:"D",firstBox:41,startJobId:35150,boxSize:300,dossierSize:50};
const num=(c:string)=>Number(String(c).replace(/\D/g,""))||0;
export async function allocate(s:SupabaseClient,uid?:string){
 const un:number[]=[];
 for(let i=0;i<200;i++){const {data}:any=await s.from("projects").select("job_id").is("box_id",null).gte("job_id",RULE.startJobId).order("job_id").range(i*1000,i*1000+999);const d=data||[];un.push(...d.map((x:any)=>x.job_id));if(d.length<1000)break}
 if(!un.length)return [];
 const {data:bs}:any=await s.from("archive_boxes").select("id,box_code");
 const boxes=new Map<string,any>((bs||[]).map((b:any)=>[b.box_code,b]));
 const groups=new Map<string,number[]>(),out:Record<string,number>={};
 for(const id of un){const i=id-RULE.startJobId,code=RULE.prefix+(RULE.firstBox+Math.floor(i/RULE.boxSize)),k=code+"|"+(Math.floor((i%RULE.boxSize)/RULE.dossierSize)+1);
  if(!groups.has(k))groups.set(k,[]);groups.get(k)!.push(id);out[code]=(out[code]||0)+1}
 const res:any[]=[];
 for(const code of Object.keys(out)){const bFirst=RULE.startJobId+(num(code)-RULE.firstBox)*RULE.boxSize;let b=boxes.get(code);
  if(!b){const ins:any=await s.from("archive_boxes").insert({box_code:code,first_job_id:bFirst,last_job_id:bFirst+RULE.boxSize-1}).select("id").single();if(ins.error){res.push({code,skipped:ins.error.message});continue}b=ins.data;
   await s.from("audit_logs").insert({actor_id:uid??null,action:"Box created (auto allocation)",entity_type:"box",entity_id:code,after_data:{rule:RULE}})}
  for(const [k,ids] of Array.from(groups.entries())){if(!k.startsWith(code+"|"))continue;const dn=Number(k.split("|")[1]),dFirst=bFirst+(dn-1)*RULE.dossierSize;
   let {data:d}:any=await s.from("dossiers").select("id").eq("box_id",b.id).eq("dossier_number",dn).maybeSingle();
   if(!d){const r:any=await s.from("dossiers").insert({box_id:b.id,dossier_number:dn,first_job_id:dFirst,last_job_id:dFirst+RULE.dossierSize-1}).select("id").single();if(r.error)continue;d=r.data}
   for(let i=0;i<ids.length;i+=500)await s.from("projects").update({box_id:b.id,dossier_id:d.id}).in("job_id",ids.slice(i,i+500)).is("box_id",null)}
  res.push({code,assigned:out[code]})}
 await s.from("audit_logs").insert({actor_id:uid??null,action:"Auto allocation",entity_type:"allocation",entity_id:"auto",after_data:{result:res}});
 return res}
