import {NextResponse} from "next/server";import {createClient} from "@supabase/supabase-js";import {createHmac,timingSafeEqual} from "crypto";
export const runtime="nodejs";
const DOMAIN="arms.local";
// "admin" -> "admin@arms.local". Real emails are left untouched.
const toEmail=(v:string)=>{const x=v.trim().toLowerCase();return x.includes("@")?x:`${x}@${DOMAIN}`};
const same=(a:string,b:string)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)};
export async function POST(req:Request){
 const u=process.env.SUPABASE_URL,k=process.env.SUPABASE_SERVICE_ROLE_KEY,sec=process.env.SESSION_SECRET;
 if(!u||!k||!sec)return NextResponse.json({error:"Server is not configured. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SESSION_SECRET."},{status:503});
 const body=await req.json().catch(()=>({}));
 const id=String(body.username??body.email??"").trim(),password=String(body.password??"");
 if(!id||!password)return NextResponse.json({error:"Enter username and password."},{status:400});
 const email=toEmail(id);
 const opt={auth:{persistSession:false,autoRefreshToken:false}};
 const admin=createClient(u,k,opt);

 // Bootstrap: if the typed credentials equal ADMIN_USERNAME / ADMIN_PASSWORD from the server env,
 // make sure that admin account exists with that password and a System Manager profile.
 const au=process.env.ADMIN_USERNAME,ap=process.env.ADMIN_PASSWORD;
 if(au&&ap&&toEmail(au)===email&&same(ap,password)){
  let uid:string|undefined;
  const c=await admin.auth.admin.createUser({email,password,email_confirm:true});
  if(c.data?.user)uid=c.data.user.id;
  else{
   const l=await admin.auth.admin.listUsers({perPage:1000});
   const f=l.data?.users?.find(x=>x.email?.toLowerCase()===email);
   if(f){uid=f.id;await admin.auth.admin.updateUserById(uid,{password,email_confirm:true})}
  }
  if(!uid)return NextResponse.json({error:"Could not create admin: "+(c.error?.message||"unknown error")},{status:500});
  const pr=await admin.from("profiles").upsert({id:uid,full_name:process.env.ADMIN_NAME||"System Manager",role:"System Manager"});
  if(pr.error)return NextResponse.json({error:"Database tables are missing. Run supabase/schema.sql first. ("+pr.error.message+")"},{status:500});
 }

 const {data,error}=await createClient(u,k,opt).auth.signInWithPassword({email,password});
 if(error||!data.user)return NextResponse.json({error:"Invalid username or password."},{status:401});
 const {data:pr}=await admin.from("profiles").select("role").eq("id",data.user.id).maybeSingle();
 if(!pr)return NextResponse.json({error:"This account has no ARMS profile. Ask the System Manager."},{status:403});
 const p=Buffer.from(JSON.stringify({uid:data.user.id,email:data.user.email,role:pr.role,exp:Date.now()+12*3600*1000})).toString("base64url");
 const res=NextResponse.json({ok:true,role:pr.role});
 res.cookies.set("arms_session",p+"."+createHmac("sha256",sec).update(p).digest("base64url"),{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:43200});
 return res}
