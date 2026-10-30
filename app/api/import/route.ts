import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import {importProjects} from "../../../lib/importer";
import {parseWorkbook} from "../../../lib/parse";
import {session} from "../../../lib/server";import {allocate} from "../../../lib/alloc";

export const runtime = "nodejs";
export async function POST(req:Request){
 try{
  const sess=session(req);if(!sess||sess.role!=="System Manager")return NextResponse.json({error:"Only a System Manager can import data."},{status:403});
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return NextResponse.json({error:"Server is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."},{status:503});
  const form=await req.formData();const file=form.get("file");
  if(!(file instanceof File))return NextResponse.json({error:"Attach an Excel file using form field 'file'."},{status:400});
  if(file.size>20*1024*1024)return NextResponse.json({error:"File exceeds the 20 MB limit."},{status:413});
  const bytes=Buffer.from(await file.arrayBuffer());
  const wb=XLSX.read(bytes,{type:"buffer",cellDates:true});
  let P;try{P=parseWorkbook(wb)}catch(e:any){return NextResponse.json({error:e?.message||"Could not read workbook"},{status:e?.status||422})}
  const sheetName=P.sheetName,normalized=P.items,duplicates=P.duplicates,errors=P.errors,raw={length:P.sourceRows};
  const maxRows=Number(process.env.ARMS_IMPORT_MAX_ROWS||20000);
  if(raw.length>maxRows)return NextResponse.json({error:`Workbook has ${raw.length} rows; configured maximum is ${maxRows}.`},{status:413});
  const diag={mapping:P.mapping,header_row:P.headerRow,null_counts:P.nullCounts,warnings:P.warnings};
  if(!normalized.length)return NextResponse.json({error:"No valid project rows found.",row_errors:errors.slice(0,100)},{status:422});
  const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  if(form.get("preview")==="1"){const ids=normalized.map(x=>x.job_id),ex=new Map<number,any>();
   for(let k=0;k<ids.length;k+=500){const {data:rs}=await supabase.from("projects").select("job_id,job_name,branch_name,total_boxes,total_documents,total_sheets,date_of_delivery").in("job_id",ids.slice(k,k+500));(rs||[]).forEach((r:any)=>ex.set(r.job_id,r))}
   let nw=0,ch=0,same=0,fill=0;const sample:any[]=[];
   for(const n of normalized){const o=ex.get(n.job_id);if(!o){nw++;continue}const df=["job_name","branch_name","total_boxes","total_documents","total_sheets","date_of_delivery"].filter(k=>String(o[k]??"")!==String(n[k]??""));if(df.length){ch++;const FL=["job_name","branch_name","total_boxes","total_documents","total_sheets","date_of_delivery"];if(FL.some(k=>(o[k]===null||o[k]===undefined||o[k]==="")&&n[k]!==null&&n[k]!==undefined))fill++;if(sample.length<50)sample.push({job_id:n.job_id,fields:df.join(", ")})}else same++}
   return NextResponse.json({preview:true,file:file.name,sheet:sheetName,source_rows:raw.length,new:nw,changed:ch,existing:same,will_fill_blanks:fill,...diag,duplicate_rows:duplicates.length,invalid_rows:errors.length,changed_sample:sample,row_errors:errors.slice(0,100)})}
  let data:any;
  try{data=await importProjects(supabase,{fileName:file.name,sheetName,items:normalized,rowCount:raw.length,duplicates,errors,apply:form.get("apply")==="1"})}
  catch(e:any){return NextResponse.json({error:"Database import failed",details:e?.message||String(e),row_errors:errors.slice(0,100)},{status:500})}
  let allocation:any[]=[];try{allocation=await allocate(supabase,sess.uid)}catch{}
  const tot=await supabase.from("projects").select("job_id",{count:"exact",head:true});const dbTotal=tot.count??null;
  return NextResponse.json({ok:true,db_total:dbTotal,allocation,file:file.name,sheet:sheetName,source_rows:raw.length,valid_unique_rows:normalized.length,duplicate_rows:duplicates.length,invalid_rows:errors.length,result:data,...diag,row_errors:errors.slice(0,100)});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unexpected import error"},{status:400});}
}