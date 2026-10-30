import {NextResponse} from "next/server";import {createClient} from "@supabase/supabase-js";import {createHmac} from "crypto";
export const runtime="nodejs";
export async function POST(req:Request){
 const u=process.env.SUPABASE_URL,k=process.env.SUPABASE_SERVICE_ROLE_KEY,sec=process.env.SESSION_SECRET;
 if(!u||!k||!sec)return NextResponse.json({error:"Server is not configured. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SESSION_SECRET."},{status:503});
 const {email,password}=await req.json().catch(()=>({}));
 if(!email||!password)return NextResponse.json({error:"Enter email and password."},{status:400});
 const opt={auth:{persistSession:false,autoRefreshToken:false}};
 const {data,error}=await createClient(u,k,opt).auth.signInWithPassword({email:String(email).trim(),password:String(password)});
 if(error||!data.user)return NextResponse.json({error:"Invalid email or password."},{status:401});
 const {data:pr}=await createClient(u,k,opt).from("profiles").select("role").eq("id",data.user.id).maybeSingle();
 if(!pr)return NextResponse.json({error:"This account has no ARMS profile. Ask the System Manager."},{status:403});
 const p=Buffer.from(JSON.stringify({uid:data.user.id,email:data.user.email,role:pr.role,exp:Date.now()+12*3600*1000})).toString("base64url");
 const res=NextResponse.json({ok:true,role:pr.role});
 res.cookies.set("arms_session",p+"."+createHmac("sha256",sec).update(p).digest("base64url"),{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:43200});
 return res}
