"use client";
import {useState} from "react";
export default function Login(){const [email,setE]=useState(""),[pw,setP]=useState(""),[err,setErr]=useState(""),[busy,setB]=useState(false);
async function go(e:React.FormEvent){e.preventDefault();setB(true);setErr("");
 try{const r=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:email,password:pw})});const j=await r.json().catch(()=>({}));
 if(r.ok){location.href="/";return}setErr(j.error||"Login failed")}catch{setErr("Can't reach the server. Check your connection and try again.")}setB(false)}
return <div className="lg"><div className="lgc"><div className="logoblk"><img src="/intercom-logo-white.png" alt="Intercom" style={{height:30,display:"block"}}/></div>
<h1>Sign in to ARMS</h1><p className="sub">Track every box, dossier and project in the archive.</p>
<form onSubmit={go}><input type="text" placeholder="Username" autoCapitalize="none" autoCorrect="off" autoComplete="username" value={email} onChange={e=>setE(e.target.value)} required/>
<input type="password" placeholder="Password" autoComplete="current-password" value={pw} onChange={e=>setP(e.target.value)} required/>
{err&&<div className="err" role="alert" style={{fontSize:14}}>{err}</div>}<button className="pri" disabled={busy}>{busy?"Signing in…":"Sign in"}</button></form></div></div>}
