import {NextResponse as R} from "next/server";import {session,db} from "../../../lib/server";
export const runtime="nodejs";
export async function POST(req:Request){const u=session(req);if(!u)return R.json({error:"Unauthorized"},{status:401});
 if(!["System Manager","Supervisor"].includes(u.role))return R.json({error:"You do not have permission to generate labels."},{status:403});
 const {box,first,count}=await req.json().catch(()=>({}));const a=Number(first),n=Number(count);
 if(!box||!Number.isSafeInteger(a)||a<=0||!Number.isInteger(n)||n<1)return R.json({error:"Invalid label data."},{status:400});
 const z=a+n-1,s=db();const {data}=await s.from("archive_boxes").select("box_code").neq("box_code",box).lte("first_job_id",z).gte("last_job_id",a);
 const conflicts=(data||[]).map(x=>x.box_code);
 if(conflicts.length&&u.role!=="System Manager")return R.json({error:"Range overlaps registered box "+conflicts.join(", ")+". A System Manager must approve this label."},{status:403});
 await s.from("audit_logs").insert({actor_id:u.uid??null,action:conflicts.length?"Label generated (range conflict override)":"Label generated",entity_type:"box",entity_id:String(box),after_data:{first:a,last:z,count:n,conflicts}});
 return R.json({ok:true,conflicts})}
