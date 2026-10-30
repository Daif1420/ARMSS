import {NextResponse as R} from "next/server";import {session,db} from "../../../lib/server";
export const runtime="nodejs";
const ST=["Pending","In Progress","Completed","Missing","On Hold","Ready for Delivery","Delivered"];
export async function PATCH(req:Request){const u=session(req);if(!u)return R.json({error:"Unauthorized"},{status:401});
 if(!["System Manager","Supervisor"].includes(u.role))return R.json({error:"You do not have permission to change status."},{status:403});
 const {job_id,status,reason}=await req.json().catch(()=>({}));if(!ST.includes(status))return R.json({error:"Invalid status."},{status:400});
 const s=db();const {data:p}=await s.from("projects").select("id,status").eq("job_id",job_id).maybeSingle();if(!p)return R.json({error:"Project not found."},{status:404});
 if(p.status===status)return R.json({ok:true});
 if(status==="Delivered"&&!["Completed","Ready for Delivery"].includes(p.status))return R.json({error:"Only Completed projects can be delivered."},{status:409});
 if(p.status==="Delivered"&&u.role!=="System Manager")return R.json({error:"Only a System Manager can change a delivered project."},{status:403});
 const e=await s.from("projects").update({status,updated_at:new Date().toISOString()}).eq("id",p.id);if(e.error)return R.json({error:e.error.message},{status:500});
 await s.from("project_status_history").insert({project_id:p.id,old_status:p.status,new_status:status,changed_by:u.uid??null,reason:reason||null});
 await s.from("audit_logs").insert({actor_id:u.uid??null,action:status==="Delivered"?"Project delivered":"Status change",entity_type:"project",entity_id:String(job_id),reason:reason||null,before_data:{status:p.status},after_data:{status}});
 return R.json({ok:true})}
