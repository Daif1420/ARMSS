import {NextResponse as R} from "next/server";import {session,db,DONE} from "../../../lib/server";import {allocate} from "../../../lib/alloc";
export const runtime="nodejs";
export async function POST(req:Request){const u=session(req);if(!u)return R.json({error:"Unauthorized"},{status:401});
 if(u.role!=="System Manager")return R.json({error:"Only a System Manager can create boxes."},{status:403});
 const b=await req.json().catch(()=>({}));if(b.auto)return R.json({ok:true,allocation:await allocate(db(),u.uid)});const code=String(b.code||"").toUpperCase(),first=Number(b.first),count=Number(b.count||300);
 if(!/^D\d+$/.test(code)||!Number.isSafeInteger(first)||first<=0||!Number.isInteger(count)||count<1||count>300)return R.json({error:"Invalid box code, first project or count (1–300)."},{status:400});
 const last=first+count-1,s=db();
 const ov=await s.from("archive_boxes").select("box_code").or(`box_code.eq.${code},and(first_job_id.lte.${last},last_job_id.gte.${first})`);
 if(ov.data?.length)return R.json({error:`Overlaps or duplicates existing box: ${ov.data.map(x=>x.box_code).join(", ")}`},{status:409});
 const bx=await s.from("archive_boxes").insert({box_code:code,first_job_id:first,last_job_id:last}).select("id").single();if(bx.error)return R.json({error:bx.error.message},{status:500});
 let assigned=0;
 for(let i=0;i<Math.ceil(count/50);i++){const a=first+i*50,z=Math.min(a+49,last);
  const d=await s.from("dossiers").insert({box_id:bx.data.id,dossier_number:i+1,first_job_id:a,last_job_id:z}).select("id").single();if(d.error)return R.json({error:d.error.message},{status:500});
  const up=await s.from("projects").update({box_id:bx.data.id,dossier_id:d.data.id}).gte("job_id",a).lte("job_id",z).is("box_id",null).select("id");assigned+=up.data?.length||0}
 await s.from("audit_logs").insert({actor_id:u.uid??null,action:"Box created",entity_type:"box",entity_id:code,after_data:{first,last,count,assigned}});
 return R.json({ok:true,assigned})}
export async function PATCH(req:Request){const u=session(req);if(!u)return R.json({error:"Unauthorized"},{status:401});
 const {code,action,reason}=await req.json().catch(()=>({}));const s=db();
 const {data:bx}=await s.from("archive_boxes").select("id,status,first_job_id,last_job_id").eq("box_code",code).maybeSingle();if(!bx)return R.json({error:"Box not found."},{status:404});
 if(action==="reopen"){if(u.role!=="System Manager")return R.json({error:"Only a System Manager can reopen a box."},{status:403});
  if(!reason)return R.json({error:"A reason is required."},{status:400});
  await s.from("archive_boxes").update({status:"Open",closed_at:null,closed_by:null,updated_at:new Date().toISOString()}).eq("id",bx.id);
  await s.from("audit_logs").insert({actor_id:u.uid??null,action:"Box reopened",entity_type:"box",entity_id:code,reason,before_data:{status:bx.status},after_data:{status:"Open"}});return R.json({ok:true})}
 if(action!=="close")return R.json({error:"Unknown action."},{status:400});
 if(!["System Manager","Supervisor"].includes(u.role))return R.json({error:"You do not have permission to close boxes."},{status:403});
 const {data:ps}=await s.from("projects").select("status,import_state").eq("box_id",bx.id);const m=ps||[];const res=bx.first_job_id&&bx.last_job_id?bx.last_job_id-bx.first_job_id+1-m.length:0;
 const blockers=[["Pending projects",m.filter(x=>x.status==="Pending").length],["In Progress / On Hold projects",m.filter(x=>["In Progress","On Hold"].includes(x.status)).length],["Missing projects",m.filter(x=>x.status==="Missing").length],["Unresolved import conflicts",m.filter(x=>x.import_state==="Changed").length],["Reserved slots (not in system)",res]].filter(x=>(x[1] as number)>0);
 const over=blockers.length>0;
 if(over){if(u.role!=="System Manager"||!reason)return R.json({error:"Closure blocked: "+blockers.map(x=>`${x[0]} (${x[1]})`).join(", ")+". A System Manager can override with a reason.",blockers,canOverride:u.role==="System Manager"},{status:409})}
 await s.from("archive_boxes").update({status:"Closed",closed_at:new Date().toISOString(),closed_by:u.uid??null,override_reason:over?reason:null,updated_at:new Date().toISOString()}).eq("id",bx.id);
 await s.from("audit_logs").insert({actor_id:u.uid??null,action:over?"Box closed (manager override)":"Box closed",entity_type:"box",entity_id:code,reason:reason||null,before_data:{status:bx.status},after_data:{status:"Closed",blockers}});
 return R.json({ok:true})}
