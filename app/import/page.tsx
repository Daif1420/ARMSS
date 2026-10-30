"use client";
import {useState} from "react";import DataTable from "../../components/DataTable";import {useApi} from "../../components/useApi";
const K=({r}:{r:any[][]})=><div className="grid" style={{margin:"12px 0"}}>{r.map(([l,v])=><div key={l} className="card kpi"><span>{l}</span><b>{v}</b></div>)}</div>;
export default function Import(){const [f,setF]=useState<File|null>(null),[pv,setPv]=useState<any>(null),[r,setR]=useState<any>(null),[busy,setB]=useState(false),[err,setErr]=useState(""),[n,setN]=useState(0);const {d}=useApi("imports"+(n?"&n="+n:""));
async function send(file:File,preview:boolean){setB(true);setErr("");const fd=new FormData();fd.append("file",file);if(preview)fd.append("preview","1");
 try{const x=await fetch("/api/import",{method:"POST",body:fd});const j=await x.json().catch(()=>({}));if(!x.ok)setErr(j.error+(j.details?` — ${j.details}`:""));else if(preview){setPv(j);setR(null)}else{setR(j);setPv(null);setF(null);setN(n+1)}}catch{setErr("Network error")}setB(false)}
return <><h1>Import Data</h1><div className="card"><input type="file" accept=".xlsx,.xls" disabled={busy} onChange={e=>{const x=e.target.files?.[0]||null;setF(x);setPv(null);setR(null);if(x)send(x,true)}}/>{busy&&<span className="msg">Working…</span>}{err&&<p className="err">{err}</p>}
{pv&&<><K r={[["New",pv.new],["Changed",pv.changed],["Existing",pv.existing],["Duplicates",pv.duplicate_rows],["Errors",pv.invalid_rows]]}/>
{pv.changed_sample.length>0&&<DataTable cols={[{k:"job_id",l:"Changed Job ID",num:true},{k:"fields",l:"Fields"}]} rows={pv.changed_sample}/>}
{pv.row_errors.length>0&&<DataTable cols={[{k:"row",l:"Row",num:true},{k:"error",l:"Error"}]} rows={pv.row_errors}/>}
<p className="msg" style={{padding:8}}>Preview only — nothing is saved yet. Changed projects keep their stored status and are flagged for review.</p>
<button className="pri" disabled={busy||!f||pv.new+pv.changed+pv.existing===0} onClick={()=>f&&confirm("Save this import to the database?")&&send(f,false)}>Confirm import</button></>}
{r?.ok&&<><p>Import saved.</p>{r.allocation?.length>0&&<p>Allocation: {r.allocation.map((a:any)=>a.code+(a.skipped?` skipped (${a.skipped})`:`: ${a.assigned} assigned`)).join(" · ")}</p>}<K r={[["New",r.result.new],["Changed",r.result.changed],["Existing",r.result.unchanged],["Duplicates",r.duplicate_rows],["Errors",r.invalid_rows]]}/></>}</div>
<h2>Recent imports</h2>{d&&<DataTable cols={[{k:"file_name",l:"File"},{k:"total_rows",l:"Rows",num:true},{k:"new_rows",l:"New",num:true},{k:"changed_rows",l:"Changed",num:true},{k:"duplicate_rows",l:"Duplicates",num:true},{k:"error_rows",l:"Errors",num:true},{k:"created_at",l:"Date"}]} rows={d}/>}</>}
