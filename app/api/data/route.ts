import {NextResponse} from "next/server";import {createClient} from "@supabase/supabase-js";
export const runtime="nodejs";export const dynamic="force-dynamic";
// TODO: protect with authentication before real use (see README).
export async function GET(req:Request){
const u=process.env.SUPABASE_URL,k=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!u||!k)return NextResponse.json({error:"Server is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."},{status:503});
const J=(b:any,status=200)=>NextResponse.json(b,{status,headers:{"Cache-Control":"no-store, max-age=0"}});
const s=createClient(u,k,{auth:{persistSession:false}});const kind=new URL(req.url).searchParams.get("kind");
async function all(sel:string){const rows:any[]=[];for(let i=0;i<100;i++){const {data,error}=await s.from("projects").select(sel).order("job_id").range(i*1000,i*1000+999);if(error)throw error;const d=(data||[]) as any[];rows.push(...d);if(d.length<1000)break}return rows}
try{
if(kind==="projects"){
 // Paged (default 2000 rows per request) so the response never hits the host's response-size limit (e.g. Vercel 4.5 MB).
 const q=new URL(req.url).searchParams,off=Math.max(0,Number(q.get("offset"))||0),lim=Math.min(5000,Math.max(1,Number(q.get("limit"))||2000));
 const SEL="job_id,job_name,branch_name,total_boxes,total_documents,total_sheets,date_of_delivery,status,import_state,box_id";
 const {data,error,count}=await s.from("projects").select(SEL,{count:"exact"}).order("job_id").range(off,off+lim-1);if(error)throw error;
 const bm=new Map<string,string>();{const {data:bs,error:be}=await s.from("archive_boxes").select("id,box_code");if(be)throw be;(bs||[]).forEach((b:any)=>bm.set(b.id,b.box_code))}
 const rows=((data||[]) as any[]).map(({box_id,...x})=>({...x,box:box_id?bm.get(box_id)??null:null}));
 return J({rows,total:count??null,next:rows.length===lim?off+lim:null})}
if(kind==="diag"){const c=async(t:string)=>(await s.from(t).select("*",{count:"exact",head:true})).count??0;
 const {count:withDocs}=await s.from("projects").select("job_id",{count:"exact",head:true}).not("total_documents","is",null);
 return J({rows:{projects:await c("projects"),projects_with_documents:withDocs??0,boxes:await c("archive_boxes"),dossiers:await c("dossiers"),imports:await c("import_batches")}})}
if(kind==="boxes"){const {data,error}=await s.from("archive_boxes").select("id,box_code,first_job_id,last_job_id,status").order("box_code");if(error)throw error;const p=await all("box_id,status");
return J({rows:(data||[]).map(b=>{const m=p.filter(x=>x.box_id===b.id),c=m.filter(x=>["Completed","Ready for Delivery","Delivered"].includes(x.status)).length,ms=m.filter(x=>x.status==="Missing").length;return {...b,projects:m.length,completed:c,missing:ms,reserved:(b.first_job_id&&b.last_job_id)?b.last_job_id-b.first_job_id+1-m.length:0,remaining:m.length-c-ms,progress:m.length?Math.round(c/m.length*100)+"%":"0%"}})})}
if(kind==="audit"){const {data,error}=await s.from("audit_logs").select("id,created_at,action,entity_type,entity_id,reason").order("id",{ascending:false}).limit(500);if(error)throw error;return J({rows:data})}
if(kind==="box"){const code=new URL(req.url).searchParams.get("code");const {data:bx,error}=await s.from("archive_boxes").select("id,box_code,first_job_id,last_job_id,status,override_reason").eq("box_code",code).maybeSingle();if(error)throw error;if(!bx)return NextResponse.json({error:"Box not found"},{status:404});
const {data:ds}=await s.from("dossiers").select("id,dossier_number,first_job_id,last_job_id").eq("box_id",bx.id).order("dossier_number");
const {data:ps}=await s.from("projects").select("job_id,job_name,branch_name,total_boxes,total_documents,total_sheets,date_of_delivery,status,import_state,dossier_id").eq("box_id",bx.id).order("job_id").limit(1000);
return J({rows:{box:bx,dossiers:ds||[],projects:ps||[]}})}
if(kind&&kind.startsWith("imports")){const {data,error}=await s.from("import_batches").select("file_name,total_rows,new_rows,changed_rows,duplicate_rows,error_rows,created_at").order("created_at",{ascending:false}).limit(10);if(error)throw error;return J({rows:data})}
return NextResponse.json({error:"Unknown kind"},{status:400});
}catch(e:any){return NextResponse.json({error:e?.message||"Database error"},{status:500})}}
