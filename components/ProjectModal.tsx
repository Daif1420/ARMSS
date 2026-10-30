"use client";
import {useState} from "react";import {Status} from "./useApi";
const ST=["Pending","In Progress","Completed","Missing","On Hold","Ready for Delivery","Delivered"];
export default function ProjectModal({p,onClose}:{p:any;onClose:()=>void}){const [st,setSt]=useState(p.status),[reason,setR]=useState(""),[err,setErr]=useState(""),[busy,setB]=useState(false);
async function save(status:string){if(status==="Delivered"&&!confirm(`Deliver project ${p.job_id}?`))return;setB(true);setErr("");
 const r=await fetch("/api/projects",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({job_id:p.job_id,status,reason})});const j=await r.json().catch(()=>({}));
 if(r.ok)location.reload();else{setErr(j.error||"Failed");setB(false)}}
return <div onClick={onClose} style={{position:"fixed",inset:0,background:"#0006",display:"grid",placeItems:"center",zIndex:20,padding:16}}><div className="card" onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:460}} dir="ltr">
<h1 style={{fontSize:20}}>Project {p.job_id}</h1><p style={{margin:"0 0 12px"}}>{p.job_name}<br/><span className="msg" style={{padding:0}}>{p.branch_name} · Docs {p.total_documents??"—"} · Sheets {p.total_sheets??"—"} · Boxes {p.total_boxes??"—"}</span></p>
<div style={{marginBottom:12}}>Current: <Status s={p.status}/></div>
<div className="bar"><select value={st} onChange={e=>setSt(e.target.value)}>{ST.map(s=><option key={s}>{s}</option>)}</select><input placeholder="Reason (optional)" value={reason} onChange={e=>setR(e.target.value)}/></div>
{err&&<p className="err">{err}</p>}<div className="bar"><button className="pri" disabled={busy||st===p.status} onClick={()=>save(st)}>Save status</button>
{["Completed","Ready for Delivery"].includes(p.status)&&<button disabled={busy} onClick={()=>save("Delivered")}>Deliver</button>}<button onClick={onClose}>Close</button></div></div></div>}
