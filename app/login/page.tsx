"use client";
import {useState} from "react";
export default function Login(){const [email,setE]=useState(""),[pw,setP]=useState(""),[err,setErr]=useState(""),[busy,setB]=useState(false);
async function go(e:React.FormEvent){e.preventDefault();setB(true);setErr("");
 try{const r=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password:pw})});const j=await r.json().catch(()=>({}));
 if(r.ok){location.href="/";return}setErr(j.error||"Login failed")}catch{setErr("Network error")}setB(false)}
return <div style={{maxWidth:380,margin:"8vh auto 0"}} className="card"><div style={{background:"#000",borderRadius:12,padding:"14px 18px",marginBottom:20}}><img src="/intercom-logo-white.png" alt="Intercom" style={{height:30,display:"block"}}/></div>
<h1 style={{fontSize:22}}>ARMS Sign in</h1>
<form onSubmit={go} dir="ltr" style={{display:"grid",gap:12}}><input type="email" placeholder="Email" autoComplete="username" value={email} onChange={e=>setE(e.target.value)} required/>
<input type="password" placeholder="Password" autoComplete="current-password" value={pw} onChange={e=>setP(e.target.value)} required/>
{err&&<div className="err" style={{fontSize:14}}>{err}</div>}<button className="pri" disabled={busy}>{busy?"Signing in…":"Sign in"}</button></form></div>}
