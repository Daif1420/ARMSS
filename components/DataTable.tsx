"use client";
import {useMemo,useState} from "react";import {Status} from "./useApi";import * as XLSX from "xlsx";
export type Col={k:string;l:string;num?:boolean;st?:boolean};
export default function DataTable({cols,rows,fk,init="",onRow}:{cols:Col[];rows:any[];fk?:string;init?:string;onRow?:(r:any)=>void}){
const [q,setQ]=useState(""),[f,setF]=useState(init),[sk,setSk]=useState(""),[asc,setAsc]=useState(true),[pg,setPg]=useState(0);const N=25;
const opts=useMemo(()=>fk?Array.from(new Set(rows.map(r=>r[fk]).filter(Boolean))).sort():[],[rows,fk]);
const out=useMemo(()=>{const s=q.toLowerCase();let a=rows.filter(r=>(!f||r[fk!]===f)&&(!s||cols.some(c=>String(r[c.k]??"").toLowerCase().includes(s))));
if(sk){const c=cols.find(c=>c.k===sk);a=[...a].sort((x,y)=>{const u=x[sk]??"",v=y[sk]??"";return(c?.num?Number(u)-Number(v):String(u).localeCompare(String(v),"ar"))*(asc?1:-1)})}return a},[rows,q,f,sk,asc,cols,fk]);
const pages=Math.max(1,Math.ceil(out.length/N)),cur=Math.min(pg,pages-1);
return <div><div className="bar"><input placeholder="Search…" value={q} onChange={e=>{setQ(e.target.value);setPg(0)}}/>{fk&&<select value={f} onChange={e=>{setF(e.target.value);setPg(0)}}><option value="">All</option>{opts.map(o=><option key={o}>{o}</option>)}</select>}<span className="msg" style={{padding:8}}>{out.length} rows</span><button onClick={()=>{const ws=XLSX.utils.json_to_sheet(out.map(r=>Object.fromEntries(cols.map(c=>[c.l,r[c.k]??""]))));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"ARMS");XLSX.writeFile(wb,"arms-export.xlsx")}}>Export Excel</button></div>
<div className="card wrap"><table dir="ltr"><thead><tr>{cols.map(c=><th key={c.k} onClick={()=>{setAsc(sk===c.k?!asc:true);setSk(c.k)}}>{c.l}{sk===c.k?(asc?" ↑":" ↓"):""}</th>)}</tr></thead>
<tbody>{out.slice(cur*N,cur*N+N).map((r,i)=><tr key={i} className={onRow?"click":""} onClick={()=>onRow?.(r)}>{cols.map(c=><td key={c.k}>{c.st?<Status s={r[c.k]}/>:r[c.k]??"—"}</td>)}</tr>)}</tbody></table>{!out.length&&<div className="msg">No records found.</div>}</div>
<div className="bar" style={{marginTop:12,justifyContent:"center"}}><button disabled={cur===0} onClick={()=>setPg(cur-1)}>‹</button><span className="msg" style={{padding:8}}>{cur+1} / {pages}</span><button disabled={cur+1>=pages} onClick={()=>setPg(cur+1)}>›</button></div></div>}
