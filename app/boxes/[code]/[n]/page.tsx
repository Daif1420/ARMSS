"use client";
import {useState} from "react";import Link from "next/link";import {useParams} from "next/navigation";
import DataTable from "../../../../components/DataTable";import ProjectModal from "../../../../components/ProjectModal";import {useApi,Status} from "../../../../components/useApi";import {cols} from "../../../../components/cols";
const DONE=["Completed","Ready for Delivery","Delivered"];
export default function DossierPage(){const {code,n}=useParams() as {code:string;n:string};const {d,e}=useApi("box&code="+code),[sel,setSel]=useState<any>(null);
 if(e)return <div className="msg err">{e}</div>;if(!d)return <div className="msg">Loading…</div>;
 const ds=d.dossiers.find((x:any)=>String(x.dossier_number)===n);
 if(!ds)return <><h1>Dossier not found</h1><p className="sub">Box {code} has no dossier {n}. <Link href={"/boxes/"+code} style={{color:"var(--p)"}}>Back to box ›</Link></p></>;
 const mine=d.projects.filter((p:any)=>p.dossier_id===ds.id),have=new Set(mine.map((p:any)=>p.job_id)),slots:any[]=[];
 for(let i=ds.first_job_id;i<=ds.last_job_id;i++)if(!have.has(i))slots.push({job_id:i,job_name:"Reserved slot — not in system",status:"Reserved",reserved:true});
 const rows=[...mine,...slots].sort((a:any,b:any)=>a.job_id-b.job_id);
 const done=mine.filter((p:any)=>DONE.includes(p.status)).length,miss=mine.filter((p:any)=>p.status==="Missing").length,total=ds.last_job_id-ds.first_job_id+1,pct=mine.length?Math.round(done/mine.length*100):0;
 const num=(v:string)=>Number(v)||0;const prev=num(n)>1?num(n)-1:null,next=d.dossiers.some((x:any)=>x.dossier_number===num(n)+1)?num(n)+1:null;
 return <><p className="sub" style={{margin:"0 0 6px"}}><Link href="/boxes" style={{color:"var(--p)"}}>Boxes</Link> › <Link href={"/boxes/"+code} style={{color:"var(--p)"}}>{code}</Link></p>
 <h1>Dossier {n} <Status s={d.box.status}/></h1><p className="sub">Box {code} · Job IDs {ds.first_job_id} – {ds.last_job_id}</p>
 <div className="kpis">
  <div className="k" style={{["--c" as any]:"var(--p)"}}><span>In the system</span><b>{mine.length}</b><em>of {total} slots</em></div>
  <div className="k" style={{["--c" as any]:"var(--ok)"}}><span>Completed</span><b>{done}</b><em>{pct}% of projects</em></div>
  <div className="k" style={{["--c" as any]:"var(--bad)"}}><span>Missing</span><b>{miss}</b><em>marked missing</em></div>
  <div className="k" style={{["--c" as any]:"var(--mute)"}}><span>Reserved</span><b>{slots.length}</b><em>empty slots</em></div></div>
 <div className="bar" style={{margin:"16px 0"}}>{prev&&<Link href={`/boxes/${code}/${prev}`}><button>‹ Dossier {prev}</button></Link>}{next&&<Link href={`/boxes/${code}/${next}`}><button>Dossier {next} ›</button></Link>}<Link href={"/boxes/"+code} style={{marginInlineStart:"auto"}}><button>Back to box</button></Link></div>
 <DataTable cols={cols} rows={rows} fk="status" onRow={(p:any)=>!p.reserved&&setSel(p)}/>{sel&&<ProjectModal p={sel} onClose={()=>setSel(null)}/>}</>}
