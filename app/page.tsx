"use client";
import Link from "next/link";import {useApi} from "../components/useApi";
const sum=(a:any[],k:string)=>a.reduce((t,x)=>t+(Number(x[k])||0),0),fmt=(n:number)=>n.toLocaleString("en-US");
export default function Dashboard(){const {d:p,e}=useApi("projects"),{d:b}=useApi("boxes");
if(e)return <div className="msg err">{e}</div>;if(!p)return <div className="msg">Loading…</div>;
const n=(s:string)=>p.filter((x:any)=>x.status===s).length;
const vol=[["Total Projects",p.length],["Total Documents",sum(p,"total_documents")],["Total Sheets",sum(p,"total_sheets")],["Total Boxes (sum of source field)",sum(p,"total_boxes")]];
const arc=["Pending","In Progress","Completed","Missing","Ready for Delivery","Delivered"].map(s=>[s+" Projects",n(s),"/projects?status="+encodeURIComponent(s)]);
const bx=["Open","In Progress","Completed","Closed"].map(s=>[s+" Boxes",(b||[]).filter((x:any)=>x.status===s).length,"/boxes"]);
const K=({r}:{r:any[]})=><div className="grid">{r.map(([l,v,h])=>{const C:any=h?Link:"div";return <C key={l} href={h} className="card kpi"><span>{l}</span><b>{fmt(v)}</b></C>})}</div>;
const empty=p.length>0&&sum(p,"total_documents")===0&&sum(p,"total_sheets")===0;
return <><h1>Dashboard</h1>{empty&&<div className="msg err">Projects exist but all Documents/Sheets numbers are empty in the database. Re-upload the Excel file from Import Data — blank values will be filled and the detected columns are shown before you confirm.</div>}<h2>Project Volume — source data</h2><K r={vol}/><h2>Archive Progress</h2><K r={[...arc,["Changed — needs review",p.filter((x:any)=>x.import_state==="Changed").length,"/projects?status=Changed"]]}/><K r={bx}/></>}
