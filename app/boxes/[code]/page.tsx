"use client";
import {useState} from "react";import {useParams,useRouter} from "next/navigation";import DataTable from "../../../components/DataTable";import ProjectModal from "../../../components/ProjectModal";import {useApi,Status} from "../../../components/useApi";
import {cols} from "../../../components/cols";
export default function BoxPage(){const rt=useRouter(),code=String(useParams().code),{d,e}=useApi("box&code="+code),[ds,setDs]=useState<any>(null),[sel,setSel]=useState<any>(null),[msg,setM]=useState("");
async function act(action:string){let reason="";if(action==="reopen"){reason=prompt("Reason for reopening?")||"";if(!reason)return}else if(!confirm(`Close box ${code}?`))return;
 let x=await fetch("/api/boxes",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,action,reason})});let j=await x.json().catch(()=>({}));
 if(x.status===409&&j.canOverride){if(!confirm(j.error+"\n\nOverride and close anyway?"))return;reason=prompt("Override reason (required)?")||"";if(!reason)return;
  x=await fetch("/api/boxes",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,action,reason})});j=await x.json().catch(()=>({}))}
 if(x.ok)location.reload();else setM(j.error||"Failed")}
if(e)return <div className="msg err">{e}</div>;if(!d)return <div className="msg">Loading…</div>;
const {box,dossiers,projects}=d,done=(s:string)=>["Completed","Ready for Delivery","Delivered"].includes(s);
const dr=dossiers.map((x:any)=>{const m=projects.filter((p:any)=>p.dossier_id===x.id),c=m.filter((p:any)=>done(p.status)).length;return {...x,dossier:"Dossier "+x.dossier_number,range:`${x.first_job_id} – ${x.last_job_id}`,count:m.length,reserved:(x.last_job_id-x.first_job_id+1)-m.length,completed:c,progress:m.length?Math.round(c/m.length*100)+"%":"0%"}});
const rows=ds?(()=>{const m=projects.filter((p:any)=>p.dossier_id===ds.id),have=new Set(m.map((p:any)=>p.job_id)),v:any[]=[];for(let i=ds.first_job_id;i<=ds.last_job_id;i++)if(!have.has(i))v.push({job_id:i,job_name:"Reserved slot — not in system",status:"Reserved",reserved:true});return [...m,...v].sort((a:any,b:any)=>a.job_id-b.job_id)})():[];
return <><h1>Box {box.box_code} <Status s={box.status}/></h1><div className="bar"><span className="msg" style={{padding:8}}>{box.first_job_id} – {box.last_job_id} · {projects.length} projects · {(box.last_job_id-box.first_job_id+1)-projects.length} reserved · {projects.filter((p:any)=>done(p.status)).length} completed</span>
{box.status==="Closed"?<button onClick={()=>act("reopen")}>Reopen</button>:<button className="pri" onClick={()=>act("close")}>Close box</button>}{msg&&<span className="err">{msg}</span>}</div>
<h2>Dossiers</h2><DataTable cols={[{k:"dossier",l:"Dossier"},{k:"range",l:"Range"},{k:"count",l:"Projects",num:true},{k:"reserved",l:"Reserved (empty)",num:true},{k:"completed",l:"Completed",num:true},{k:"progress",l:"Progress"}]} rows={dr} onRow={(x:any)=>rt.push(`/boxes/${code}/${x.dossier_number}`)}/>
{ds&&<><h2>Dossier {ds.dossier_number} projects</h2><DataTable cols={cols} rows={rows} fk="status" onRow={(p:any)=>!p.reserved&&setSel(p)}/></>}{sel&&<ProjectModal p={sel} onClose={()=>setSel(null)}/>}</>}
