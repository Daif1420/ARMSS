"use client";
import {useEffect,useState} from "react";
const ROLES=["System Manager","Supervisor","User"];
export default function Users(){const [rows,setRows]=useState<any[]|null>(null),[e,setE]=useState(""),[f,setF]=useState({email:"",full_name:"",password:"",role:"User"});
const load=()=>fetch("/api/users").then(r=>r.json().then(j=>r.ok?setRows(j.rows):setE(j.error||"Failed"))).catch(()=>setE("Network error"));useEffect(()=>{load()},[]);
async function call(m:string,b:any){setE("");const r=await fetch("/api/users",{method:m,headers:{"Content-Type":"application/json"},body:JSON.stringify(b)});const j=await r.json().catch(()=>({}));if(r.ok){load();if(m==="POST")setF({email:"",full_name:"",password:"",role:"User"})}else setE(j.error||"Failed")}
return <><h1>Users</h1><div className="card bar" dir="ltr"><input placeholder="Email" value={f.email} onChange={x=>setF({...f,email:x.target.value})}/><input placeholder="Full name" value={f.full_name} onChange={x=>setF({...f,full_name:x.target.value})}/><input type="password" placeholder="Password (8+)" value={f.password} onChange={x=>setF({...f,password:x.target.value})}/>
<select value={f.role} onChange={x=>setF({...f,role:x.target.value})}>{ROLES.map(r=><option key={r}>{r}</option>)}</select><button className="pri" onClick={()=>call("POST",f)}>Add user</button></div>
{e&&<p className="err">{e}</p>}{!rows&&!e&&<div className="msg">Loading…</div>}
{rows&&<div className="card wrap" style={{marginTop:12}}><table dir="ltr"><thead><tr><th>Full Name</th><th>Email</th><th>Role</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.full_name}</td><td>{r.email}</td><td><select value={r.role} onChange={x=>call("PATCH",{id:r.id,role:x.target.value})}>{ROLES.map(o=><option key={o}>{o}</option>)}</select></td></tr>)}</tbody></table></div>}</>}
