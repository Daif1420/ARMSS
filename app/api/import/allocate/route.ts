import {NextResponse} from "next/server";
import {createClient} from "@supabase/supabase-js";
import {allocate} from "../../../../lib/alloc";
import {session} from "../../../../lib/server";

export const runtime="nodejs";

export async function POST(req:Request){
  try{
    const sess=session(req);
    if(!sess||sess.role!=="System Manager")return NextResponse.json({error:"Only a System Manager can allocate boxes."},{status:403});
    const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!url||!key)return NextResponse.json({error:"Server is not configured."},{status:503});
    const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const allocation=await allocate(supabase,sess.uid);
    return NextResponse.json({ok:true,allocation});
  }catch(e:any){return NextResponse.json({error:e?.message||"Allocation failed"},{status:500});}
}
