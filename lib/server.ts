import {createHmac} from "crypto";import {createClient} from "@supabase/supabase-js";
export type Sess={email:string;role:string;uid?:string};
export function session(req:Request):Sess|null{const c=(req.headers.get("cookie")||"").split(/;\s*/).find(x=>x.startsWith("arms_session="));const sec=process.env.SESSION_SECRET;if(!c||!sec)return null;
 const [p,sig]=c.slice(13).split(".");if(!p||sig!==createHmac("sha256",sec).update(p).digest("base64url"))return null;
 try{const d=JSON.parse(Buffer.from(p,"base64url").toString());return d.exp>Date.now()?d:null}catch{return null}}
export const db=()=>createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
export const DONE=["Completed","Ready for Delivery","Delivered"];
