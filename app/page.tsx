"use client";
import Link from "next/link";
import {useEffect,useMemo,useRef,useState} from "react";
import {Search,Upload,Tag,FileText,Boxes as BoxesIcon,CheckCircle2} from "lucide-react";
import {useApi,Status} from "../components/useApi";
import ProjectModal from "../components/ProjectModal";

const DONE=["Completed","Ready for Delivery","Delivered"];
const ORDER:[string,string][]=[["Delivered","var(--p)"],["Ready for Delivery","var(--p2)"],["Completed","var(--ok)"],["In Progress","var(--warn)"],["On Hold","var(--mute)"],["Pending","var(--line)"],["Missing","var(--bad)"]];
const fmt=(n:number)=>Number(n||0).toLocaleString("en-US");
const sum=(a:any[],k:string)=>a.reduce((t,x)=>t+(Number(x[k])||0),0);
const ago=(iso:string)=>{const s=(Date.now()-new Date(iso).getTime())/1000;if(!(s>=0))return "";if(s<60)return "just now";if(s<3600)return Math.floor(s/60)+" min ago";if(s<86400)return Math.floor(s/3600)+" h ago";return Math.floor(s/86400)+" d ago"};
const BOX_TONE:any={Open:"var(--info)","In Progress":"var(--warn)",Completed:"var(--ok)",Closed:"var(--mute)","Ready for Delivery":"var(--p2)",Delivered:"var(--p)"};

function Finder({rows,onPick}:{rows:any[];onPick:(p:any)=>void}){
 const [q,setQ]=useState(""),[i,setI]=useState(0),ref=useRef<HTMLInputElement>(null);
 useEffect(()=>{const k=(e:KeyboardEvent)=>{if(e.key==="/"&&!(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)){e.preventDefault();ref.current?.focus()}};window.addEventListener("keydown",k);return()=>window.removeEventListener("keydown",k)},[]);
 const hits=useMemo(()=>{const s=q.trim().toLowerCase();if(!s)return [];
  const idm=rows.filter(r=>String(r.job_id).startsWith(s));const rest=rows.filter(r=>!String(r.job_id).startsWith(s)&&(String(r.job_id).includes(s)||(r.job_name||"").toLowerCase().includes(s)||(r.branch_name||"").toLowerCase().includes(s)));
  return [...idm,...rest].slice(0,8)},[q,rows]);
 const pick=(p:any)=>{if(p){onPick(p);setQ("");setI(0)}};
 return <div className="find"><Search size={17}/><input ref={ref} value={q} placeholder="Find a project by Job ID, name or branch" aria-label="Find a project" onChange={e=>{setQ(e.target.value);setI(0)}}
  onKeyDown={e=>{if(e.key==="ArrowDown"){e.preventDefault();setI(Math.min(i+1,hits.length-1))}else if(e.key==="ArrowUp"){e.preventDefault();setI(Math.max(i-1,0))}else if(e.key==="Enter")pick(hits[i]);else if(e.key==="Escape")setQ("")}}/>{!q&&<kbd>/</kbd>}
  {q.trim()&&<div className="hits">{hits.length?hits.map((h,n)=><button key={h.job_id} className={"hit"+(n===i?" on":"")} onMouseEnter={()=>setI(n)} onClick={()=>pick(h)}><b>{h.job_id}</b><span>{h.job_name||"Untitled"}</span><i>{h.box||"no box"}</i><Status s={h.status}/></button>):<div className="msg">No project matches “{q}”.</div>}</div>}</div>}

export default function Dashboard(){
 const {d:p,e}=useApi("projects"),{d:b}=useApi("boxes"),{d:au}=useApi("audit"),{d:im}=useApi("imports");
 const [sel,setSel]=useState<any>(null);
 const m=useMemo(()=>{if(!p)return null;
  const cnt=(s:string)=>p.filter((x:any)=>x.status===s).length;
  const total=p.length,done=p.filter((x:any)=>DONE.includes(x.status)).length;
  const changed=p.filter((x:any)=>x.import_state==="Changed").length,unboxed=p.filter((x:any)=>!x.box).length;
  const readyClose=(b||[]).filter((x:any)=>x.status!=="Closed"&&x.projects>0&&x.remaining===0&&x.missing===0&&x.reserved===0);
  // branches
  const br=new Map<string,{n:number;d:number}>();for(const x of p){const k=x.branch_name||"No branch",v=br.get(k)||{n:0,d:0};v.n++;if(DONE.includes(x.status))v.d++;br.set(k,v)}
  const branches=Array.from(br,([name,v])=>({name,...v,left:v.n-v.d})).sort((a,c)=>c.left-a.left).slice(0,7);
  // shelf: 6 dossier cells per box (50 job IDs each)
  const cells=new Map<string,{have:number;done:number;missing:number}[]>();
  for(const bx of b||[])cells.set(bx.box_code,Array.from({length:6},()=>({have:0,done:0,missing:0})));
  const first=new Map<string,number>((b||[]).map((x:any)=>[x.box_code,Number(x.first_job_id)]));
  for(const x of p){if(!x.box||!cells.has(x.box))continue;const f=first.get(x.box);if(!Number.isFinite(f))continue;const i=Math.min(5,Math.max(0,Math.floor((x.job_id-(f as number))/50))),c=cells.get(x.box)![i];c.have++;if(DONE.includes(x.status))c.done++;if(x.status==="Missing")c.missing++}
  const shelf=[...(b||[])].sort((a:any,c:any)=>(a.status==="Closed"?1:0)-(c.status==="Closed"?1:0)||String(a.box_code).localeCompare(String(c.box_code),"en",{numeric:true}));
  return {cnt,total,done,changed,unboxed,readyClose,branches,cells,shelf,docs:sum(p,"total_documents"),sheets:sum(p,"total_sheets"),boxes:sum(p,"total_boxes")}},[p,b]);

 if(e)return <div className="msg err" role="alert">{e}</div>;
 if(!p||!m)return <><h1>Dashboard</h1><div className="skel" style={{marginTop:18}}/><div className="skel" style={{marginTop:14,height:200}}/></>;
 if(!p.length)return <><h1>Dashboard</h1><div className="card" style={{marginTop:18,textAlign:"center",padding:40}}><h2 style={{margin:"0 0 6px"}}>The archive is empty</h2><p className="sub">Import the project workbook to see progress, boxes and branches here.</p><Link href="/import" className="tab on" style={{display:"inline-flex",width:"auto",background:"var(--p)"}}><Upload size={16}/>Import data</Link></div></>;

 const empty=sum(p,"total_documents")===0&&sum(p,"total_sheets")===0;
 const pct=m.total?Math.round(m.done/m.total*100):0;
 const todo=[
  {n:m.changed,t:"Imported values changed",s:"Review the differences from the last import",h:"/projects?status=Changed",c:"var(--warn)"},
  {n:m.cnt("Missing"),t:"Missing projects",s:"Marked missing in the archive",h:"/projects?status=Missing",c:"var(--bad)"},
  {n:m.cnt("On Hold"),t:"Projects on hold",s:"Waiting for a decision",h:"/projects?status=On%20Hold",c:"var(--mute)"},
  {n:m.cnt("Ready for Delivery"),t:"Ready for delivery",s:"Completed and waiting to be delivered",h:"/projects?status=Ready%20for%20Delivery",c:"var(--p2)"},
  {n:m.readyClose.length,t:"Boxes ready to close",s:m.readyClose.slice(0,4).map((x:any)=>x.box_code).join(", ")+(m.readyClose.length>4?"…":""),h:"/boxes",c:"var(--ok)"},
  {n:m.unboxed,t:"Projects not in a box",s:"Allocate them from the Boxes page",h:"/boxes",c:"var(--info)"},
 ].filter(x=>x.n>0);
 const last=im?.[0];

 return <>
  <div className="dh"><div><h1>Dashboard</h1><p className="sub" style={{margin:0}}>{fmt(m.total)} projects in {fmt((b||[]).length)} boxes</p></div><Finder rows={p} onPick={setSel}/></div>
  {empty&&<div className="msg err" role="alert">Projects are loaded but every Documents and Sheets number is empty. Open Import data and upload the workbook again — empty values are filled in, and the detected columns are shown before you confirm.</div>}

  <div className="card"><div className="hero"><div><div className="pct">{pct}<small>%</small></div><div className="cap">{fmt(m.done)} of {fmt(m.total)} done</div></div>
   <div><div className="stack" role="img" aria-label="Projects by status">{ORDER.map(([s,c])=>{const n=m.cnt(s);return n?<Link key={s} href={"/projects?status="+encodeURIComponent(s)} title={`${s}: ${fmt(n)}`} style={{["--c" as any]:c,width:n/m.total*100+"%"}}/>:null})}</div>
   <div className="legend">{ORDER.map(([s,c])=><Link key={s} href={"/projects?status="+encodeURIComponent(s)} style={{["--c" as any]:c}}><i/>{s} <b>{fmt(m.cnt(s))}</b></Link>)}</div></div></div>
   <div className="vol"><div><b>{fmt(m.docs)}</b><span>Documents</span></div><div><b>{fmt(m.sheets)}</b><span>Sheets</span></div><div><b>{fmt(m.boxes)}</b><span>Boxes in source files</span></div></div></div>

  <div className="row2" style={{marginTop:14}}>
   <div className="card"><h2 style={{margin:"0 0 6px"}}>Needs attention</h2>
    {todo.length?<ul className="todo">{todo.map(x=><li key={x.t}><Link href={x.h}><span className="n" style={{["--c" as any]:x.c}}>{fmt(x.n)}</span><span><b>{x.t}</b><em>{x.s}</em></span></Link></li>)}</ul>:<div className="ok-all"><CheckCircle2 size={20}/>Nothing needs attention right now.</div>}</div>
   <div className="card"><h2 style={{margin:"0 0 6px"}}>Last import</h2>
    {last?<><div style={{fontWeight:600,unicodeBidi:"plaintext"}}>{last.file_name}</div><div className="sub" style={{margin:"2px 0 0"}}>{ago(last.created_at)} · {fmt(last.total_rows)} rows</div>
     <div className="legend" style={{marginTop:10}}><span>New <b>{fmt(last.new_rows)}</b></span><span>Changed <b>{fmt(last.changed_rows)}</b></span><span>Duplicates <b>{fmt(last.duplicate_rows)}</b></span><span>Errors <b>{fmt(last.error_rows)}</b></span></div></>:<p className="sub" style={{margin:0}}>No import yet.</p>}
    <div className="acts"><Link href="/import"><Upload size={16}/>Import data</Link><Link href="/labels"><Tag size={16}/>Print labels</Link><Link href="/reports"><FileText size={16}/>Reports</Link><Link href="/boxes"><BoxesIcon size={16}/>All boxes</Link></div></div>
  </div>

  <h2>Boxes</h2>
  <div className="key"><span><i style={{background:"var(--ok)"}}/>Done</span><span><i style={{background:"color-mix(in srgb,var(--p) 30%,var(--line))"}}/>In the system, not done</span><span><i style={{background:"var(--line)"}}/>Reserved slot</span><span><i style={{boxShadow:"inset 0 0 0 2px var(--bad)"}}/>Has missing projects</span><span>Each box shows its 6 dossiers</span></div>
  {m.shelf.length?<div className="shelf">{m.shelf.slice(0,24).map((x:any)=>{const cs=m.cells.get(x.box_code)||[];
   return <Link key={x.id} href={"/boxes/"+x.box_code} className="bx" style={{["--c" as any]:BOX_TONE[x.status]||"var(--line)"}}>
    <div className="t"><b>{x.box_code}</b><Status s={x.status}/></div>
    <div className="cells">{cs.map((c,i)=><div key={i} className="cell" title={`Dossier ${i+1}: ${c.done} done, ${c.have} in system, ${50-c.have} reserved`}><i style={{height:c.have*2+"%"}}/><u style={{height:c.done*2+"%"}}/>{c.missing>0&&<s/>}</div>)}</div>
    <div className="f"><span>{fmt(x.completed)} / {fmt(x.projects)} done</span><span>{x.progress}</span></div></Link>})}</div>:<div className="card msg">No boxes yet. Allocate projects from the Boxes page.</div>}
  {m.shelf.length>24&&<p className="sub" style={{marginTop:12}}><Link href="/boxes" style={{color:"var(--p)",fontWeight:600}}>Show all {m.shelf.length} boxes</Link></p>}

  <div className="row2" style={{marginTop:14}}>
   <div className="card"><h2 style={{margin:"0 0 6px"}}>Branches with the most work left</h2>
    {m.branches.map(x=><div className="br" key={x.name}><span title={x.name}>{x.name}</span><div className="meter"><i style={{width:(x.n?x.d/x.n*100:0)+"%"}}/></div><small>{fmt(x.left)} left of {fmt(x.n)}</small></div>)}</div>
   <div className="card"><h2 style={{margin:"0 0 6px"}}>Recent activity</h2>
    {au?(au.length?<ul className="feed">{au.slice(0,8).map((a:any)=><li key={a.id}><span>{a.action}{a.entity_id&&a.entity_type!=="import_batch"&&a.entity_type!=="allocation"?<> · <b>{a.entity_id}</b></>:null}</span><time>{ago(a.created_at)}</time></li>)}</ul>:<p className="sub" style={{margin:0}}>Nothing has happened yet.</p>):<div className="skel" style={{height:80}}/>}</div>
  </div>
  {sel&&<ProjectModal p={sel} onClose={()=>setSel(null)}/>}
 </>}
