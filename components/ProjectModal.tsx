"use client";
import {useEffect,useState} from "react";import {Status} from "./useApi";
const ST=["Pending","In Progress","Completed","Missing","On Hold","Ready for Delivery","Delivered"];
const F=({l,v,w}:{l:string;v:any;w?:boolean})=><div className={w?"w2":""}><span>{l}</span><b>{v??"—"}</b></div>;
export default function ProjectModal({p,onClose}:{p:any;onClose:()=>void}){const [st,setSt]=useState(p.status),[reason,setR]=useState(""),[err,setErr]=useState(""),[busy,setB]=useState(false);
useEffect(()=>{const k=(e:KeyboardEvent)=>e.key==="Escape"&&onClose();window.addEventListener("keydown",k);return()=>window.removeEventListener("keydown",k)},[onClose]);
async function save(status:string){if(status==="Delivered"&&!confirm(`Deliver project ${p.job_id}?`))return;setB(true);setErr("");
 const r=await fetch("/api/projects",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({job_id:p.job_id,status,reason})});const j=await r.json().catch(()=>({}));
 if(r.ok)location.reload();else{setErr(j.error||"Could not save the status.");setB(false)}}
const n=(v:any)=>v==null?null:Number(v).toLocaleString("en-US");
return <div className="mback" onClick={onClose}><div className="modal" role="dialog" aria-modal="true" onClick={e=>e.stopPropagation()}>
<div className="mh"><b>Project {p.job_id}</b><Status s={p.status}/></div>
<div className="mb"><h3>{p.job_name||"Untitled project"}</h3>
<div className="facts"><F l="Branch" v={p.branch_name} w/><F l="Documents" v={n(p.total_documents)}/><F l="Sheets" v={n(p.total_sheets)}/><F l="Boxes" v={n(p.total_boxes)}/>
<F l="Archive box" v={p.box||"Not in a box"}/><F l="Delivery date" v={p.date_of_delivery}/>{p.import_state==="Changed"&&<F l="Import" v="Changed — needs review"/>}</div>
<div className="bar"><select value={st} onChange={e=>setSt(e.target.value)} aria-label="Status">{ST.map(s=><option key={s}>{s}</option>)}</select><input placeholder="Reason (optional)" value={reason} onChange={e=>setR(e.target.value)}/></div>
{err&&<p className="err" role="alert">{err}</p>}
<div className="bar" style={{marginBottom:0}}><button className="pri" disabled={busy||st===p.status} onClick={()=>save(st)}>Save status</button>
{["Completed","Ready for Delivery"].includes(p.status)&&<button disabled={busy} onClick={()=>save("Delivered")}>Mark delivered</button>}<button onClick={onClose} style={{marginInlineStart:"auto"}}>Close</button></div></div></div></div>}
