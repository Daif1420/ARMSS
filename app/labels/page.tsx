"use client";
import {useState} from "react";import {QRCodeSVG} from "qrcode.react";import {useApi} from "../../components/useApi";
const Br=()=><svg viewBox="0 0 305 307" style={{position:"absolute",left:"58.8mm",top:"12mm",width:"19.5mm",height:"19.6mm"}} fill="none" stroke="#000" strokeWidth="9" strokeLinecap="round"><path d="M5 45V30Q5 5 30 5H45M260 5H275Q300 5 300 30V45M300 262V277Q300 302 275 302H260M45 302H30Q5 302 5 277V262"/></svg>;
function Label({dossier,box,a,b,qr}:{dossier?:number;box:string;a:number;b:number;qr:string}){
return <div className="lab"><div className="f"><div className="hd"><img src="/intercom-logo-white.png" alt="Intercom"/></div>
<div className="bx" style={{left:"2.9mm",top:"11.8mm",width:"40.8mm",height:"30.4mm"}}/>
{dossier?<><div className="a c" style={{left:"23.3mm",top:"16.4mm",fontSize:"4.4mm",fontWeight:800}}>Dossier</div><div className="a c" style={{left:"23.3mm",top:"24.4mm",fontSize:"14.2mm",fontWeight:800,lineHeight:1}}>{dossier}</div><div className="rl" style={{top:"30.1mm"}}/><div className="a l" style={{left:"5.3mm",top:"33.5mm",fontSize:"3.2mm",fontWeight:800}}>Box</div><div className="a l" style={{left:"5.3mm",top:"38.3mm",fontSize:"6.2mm",fontWeight:800,lineHeight:1}}>{box}</div></>
:<><div className="a c" style={{left:"23.3mm",top:"23mm",fontSize:"17mm",fontWeight:800,lineHeight:1,letterSpacing:"-.4mm"}}>{box}</div><div className="rl" style={{top:"32.5mm"}}/><div className="a l" style={{left:"5.3mm",top:"37.3mm",fontSize:"3.2mm",fontWeight:800,letterSpacing:".45mm"}}>ARCHIVE BOX</div></>}
<><Br/><div className="a" style={{left:"60.4mm",top:"13.6mm",width:"16.1mm",height:"16.1mm"}}><QRCodeSVG value={qr} size={256} level="M" marginSize={0} style={{width:"100%",height:"100%"}}/></div></>
<div className="bx rg"><i/><small style={{left:"3.2mm"}}>FROM</small><b style={{left:"3.2mm"}}>{a}</b><small style={{left:"24.8mm"}}>TO</small><b style={{left:"24.8mm"}}>{b}</b></div></div></div>}
export default function Labels(){const {d}=useApi("boxes"),[box,setBox]=useState("D41"),[first,setFirst]=useState(35150),[cnt,setCnt]=useState(300),[what,setWhat]=useState("all"),[msg,setM]=useState("");
const last=first+cnt-1,per=50,ds=Math.ceil(cnt/per),reg:any[]=d||[];
const conf=reg.filter(x=>x.box_code!==box&&x.first_job_id<=last&&x.last_job_id>=first).map(x=>x.box_code);
function pick(c:string){setBox(c);const x=reg.find(r=>r.box_code===c);if(x&&x.first_job_id){setFirst(x.first_job_id);setCnt(x.last_job_id-x.first_job_id+1)}}
async function print(){setM("");try{const x=await fetch("/api/labels",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({box,first,count:cnt})});if(x.status===403||x.status===400){const j=await x.json().catch(()=>({}));setM(j.error||"Not allowed");return}}catch{}window.print()}
const dq=(i:number)=>{const a=first+i*per,z=Math.min(a+per-1,last);return {a,z,qr:["Box:"+box,`Dossier:${i+1} of ${ds}`,"From:"+a,"To:"+z,"Total Project:"+(z-a+1)].join("\n")}};
return <><h1>Labels</h1><div className="bar noprint" dir="ltr"><select value={reg.some(x=>x.box_code===box)?box:""} onChange={e=>e.target.value&&pick(e.target.value)}><option value="">Manual box</option>{reg.map(x=><option key={x.box_code}>{x.box_code}</option>)}</select>
<input value={box} onChange={e=>setBox(e.target.value.toUpperCase())} style={{width:90}}/><input type="number" value={first} onChange={e=>setFirst(+e.target.value)}/><input type="number" min={1} value={cnt} onChange={e=>setCnt(Math.max(1,+e.target.value||1))} style={{width:90}}/>
<select value={what} onChange={e=>setWhat(e.target.value)}><option value="all">Box + dossiers</option><option value="box">Box label only</option><option value="dos">Dossier labels only</option></select>
<button className="pri" onClick={print}>Print</button></div>
{conf.length>0&&<p className="err noprint">Range overlaps registered box {conf.join(", ")}. Only a System Manager can print it (audited).</p>}{msg&&<p className="err noprint">{msg}</p>}
<div style={{display:"grid",gap:14,justifyItems:"start"}}>{what!=="dos"&&<Label box={box} a={first} b={last} qr={["Box:"+box,"From:"+first,"To:"+last,"Total Project:"+cnt].join("\n")}/>}
{what!=="box"&&Array.from({length:ds},(_,i)=>{const q=dq(i);return <Label key={i} dossier={i+1} box={box} a={q.a} b={q.z} qr={q.qr}/>})}</div></>}
