import {NextResponse as R} from "next/server";import {session,db} from "../../../lib/server";
export const runtime="nodejs";const ROLES=["System Manager","Supervisor","User"];
function sm(req:Request){const u=session(req);return u&&u.role==="System Manager"?u:null}
export async function GET(req:Request){if(!sm(req))return R.json({error:"Only a System Manager can manage users."},{status:403});const s=db();
 const {data:pr,error}=await s.from("profiles").select("id,full_name,role,created_at").order("created_at");if(error)return R.json({error:error.message},{status:500});
 const l=await s.auth.admin.listUsers({perPage:1000});const em=new Map((l.data?.users||[]).map(x=>[x.id,x.email]));
 return R.json({rows:(pr||[]).map(x=>({...x,email:em.get(x.id)||""}))})}
export async function POST(req:Request){const u=sm(req);if(!u)return R.json({error:"Only a System Manager can manage users."},{status:403});
 const {email,password,full_name,role}=await req.json().catch(()=>({}));
 if(!email||!full_name||String(password||"").length<8||!ROLES.includes(role))return R.json({error:"Email, full name, role and a password of 8+ characters are required."},{status:400});
 const s=db();const c=await s.auth.admin.createUser({email,password,email_confirm:true});if(c.error||!c.data.user)return R.json({error:c.error?.message||"Create failed"},{status:400});
 const p=await s.from("profiles").upsert({id:c.data.user.id,full_name,role});if(p.error)return R.json({error:p.error.message},{status:500});
 await s.from("audit_logs").insert({actor_id:u.uid??null,action:"User created",entity_type:"user",entity_id:email,after_data:{role,full_name}});return R.json({ok:true})}
export async function PATCH(req:Request){const u=sm(req);if(!u)return R.json({error:"Only a System Manager can manage users."},{status:403});
 const {id,role}=await req.json().catch(()=>({}));if(!id||!ROLES.includes(role))return R.json({error:"Invalid data."},{status:400});
 if(id===u.uid)return R.json({error:"You cannot change your own role."},{status:409});
 const s=db(),{data:o}=await s.from("profiles").select("role").eq("id",id).maybeSingle();const e=await s.from("profiles").update({role}).eq("id",id);if(e.error)return R.json({error:e.error.message},{status:500});
 await s.from("audit_logs").insert({actor_id:u.uid??null,action:"Role changed",entity_type:"user",entity_id:id,before_data:{role:o?.role},after_data:{role}});return R.json({ok:true})}
