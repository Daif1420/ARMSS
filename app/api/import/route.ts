import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
import {session} from "../../../lib/server";import {allocate} from "../../../lib/alloc";

export const runtime = "nodejs";
const required = ["Job ID","Job Name","Branch Name","Total Boxes","Total Documents","Total Sheets"];
function dateValue(v:any):string|null {
  if(v===null||v===undefined||v==="") return null;
  if(v instanceof Date && !Number.isNaN(v.getTime())) return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,"0")}-${String(v.getDate()).padStart(2,"0")}`;
  if(typeof v==="number"){const d=XLSX.SSF.parse_date_code(v);return d?`${d.y}-${String(d.m).padStart(2,"0")}-${String(d.d).padStart(2,"0")}`:null;}
  const s=String(v).trim(); if(!s)return null;
  if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
  const parsed=new Date(s); return Number.isNaN(parsed.getTime())?null:parsed.toISOString().slice(0,10);
}
function normalize(row:any){
 const pick=(...keys:string[])=>{for(const k of keys){if(row[k]!==undefined&&row[k]!==null&&String(row[k]).trim()!=="")return row[k]}return ""};
 const rawId=String(pick("Job ID","JobID","Job Id","رقم المشروع")).trim();
 if(!rawId)return null;
 const id=Number(rawId);
 if(!Number.isSafeInteger(id)||id<=0)throw new Error(`Invalid Job ID: ${rawId}`);
 const number=(v:any)=>{if(v===""||v===null||v===undefined)return null;const n=Number(v);if(!Number.isFinite(n)||n<0)throw new Error(`Invalid numeric value: ${v}`);return Math.trunc(n)};
 const jobName=String(pick("Job Name ","Job Name","JobName","اسم المشروع")).trim();
 const branch=String(pick("Branch Name","Branch name","Branch","الفرع")).trim();
 const totalBoxes=number(pick("Total Boxes","Total Box"));
 const totalDocuments=number(pick("Total Documents","Total Document"));
 const totalSheets=number(pick("Total Sheets","Total Sheet"));
 const date=dateValue(pick("Date Of Delivery","Date of Delivery","Date Delivery","Date Print"));
 return {job_id:id,job_name:jobName||null,branch_name:branch||null,total_boxes:totalBoxes,total_documents:totalDocuments,total_sheets:totalSheets,date_of_delivery:date,source_payload:row};
}
export async function POST(req:Request){
 try{
  const sess=session(req);if(!sess||sess.role!=="System Manager")return NextResponse.json({error:"Only a System Manager can import data."},{status:403});
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)return NextResponse.json({error:"Server is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."},{status:503});
  const form=await req.formData();const file=form.get("file");
  if(!(file instanceof File))return NextResponse.json({error:"Attach an Excel file using form field 'file'."},{status:400});
  if(file.size>20*1024*1024)return NextResponse.json({error:"File exceeds the 20 MB limit."},{status:413});
  const bytes=Buffer.from(await file.arrayBuffer());
  const wb=XLSX.read(bytes,{type:"buffer",cellDates:true,dateNF:"yyyy-mm-dd"});
  const sheetName=wb.SheetNames.find(n=>n==="البيانات (2)")||wb.SheetNames.find(n=>n==="بيانات المشاريع")||wb.SheetNames[0];
  if(!sheetName)return NextResponse.json({error:"Workbook contains no sheets."},{status:400});
  const sheet=wb.Sheets[sheetName];const raw=XLSX.utils.sheet_to_json<any>(sheet,{defval:""});
  if(!raw.length)return NextResponse.json({error:`Sheet '${sheetName}' is empty.`},{status:400});
  const headings=Object.keys(raw[0]);const idHeading=headings.some(h=>["Job ID","JobID","Job Id","رقم المشروع"].includes(h));
  if(!idHeading)return NextResponse.json({error:`Job ID column not found in sheet '${sheetName}'. Found columns: ${headings.join(", ")}`},{status:422});
  const maxRows=Number(process.env.ARMS_IMPORT_MAX_ROWS||20000);
  if(raw.length>maxRows)return NextResponse.json({error:`Workbook has ${raw.length} rows; configured maximum is ${maxRows}.`},{status:413});
  const seen=new Set<number>(),duplicates:number[]=[],normalized:any[]=[],errors:any[]=[];
  for(let i=0;i<raw.length;i++){
   try{const item=normalize(raw[i]);if(!item)continue;if(seen.has(item.job_id)){duplicates.push(item.job_id);continue;}seen.add(item.job_id);normalized.push(item);}
   catch(e){errors.push({row:i+2,error:e instanceof Error?e.message:"Invalid row"});}
  }
  if(!normalized.length)return NextResponse.json({error:"No valid project rows found.",row_errors:errors.slice(0,100)},{status:422});
  const supabase=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  if(form.get("preview")==="1"){const ids=normalized.map(x=>x.job_id),ex=new Map<number,any>();
   for(let k=0;k<ids.length;k+=500){const {data:rs}=await supabase.from("projects").select("job_id,job_name,branch_name,total_boxes,total_documents,total_sheets,date_of_delivery").in("job_id",ids.slice(k,k+500));(rs||[]).forEach((r:any)=>ex.set(r.job_id,r))}
   let nw=0,ch=0,same=0;const sample:any[]=[];
   for(const n of normalized){const o=ex.get(n.job_id);if(!o){nw++;continue}const df=["job_name","branch_name","total_boxes","total_documents","total_sheets","date_of_delivery"].filter(k=>String(o[k]??"")!==String(n[k]??""));if(df.length){ch++;if(sample.length<50)sample.push({job_id:n.job_id,fields:df.join(", ")})}else same++}
   return NextResponse.json({preview:true,file:file.name,sheet:sheetName,source_rows:raw.length,new:nw,changed:ch,existing:same,duplicate_rows:duplicates.length,invalid_rows:errors.length,changed_sample:sample,row_errors:errors.slice(0,100)})}
  const {data,error}=await supabase.rpc("arms_import_projects",{p_file_name:file.name,p_sheet_name:sheetName,p_rows:normalized,p_row_count:raw.length,p_duplicate_job_ids:duplicates,p_row_errors:errors});
  if(error)return NextResponse.json({error:"Database import failed",details:error.message,row_errors:errors.slice(0,100)},{status:500});
  let allocation:any[]=[];try{allocation=await allocate(supabase,sess.uid)}catch{}
  return NextResponse.json({ok:true,allocation,file:file.name,sheet:sheetName,source_rows:raw.length,valid_unique_rows:normalized.length,duplicate_rows:duplicates.length,invalid_rows:errors.length,result:data,row_errors:errors.slice(0,100)});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unexpected import error"},{status:400});}
}