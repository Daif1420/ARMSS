"use client";
import {useEffect,useState} from "react";import Link from "next/link";import {usePathname} from "next/navigation";
import {LayoutDashboard,Boxes,FolderOpen,Upload,Tag,LogOut,ScrollText,FileText,Users} from "lucide-react";
const tabs=[["/","Dashboard",LayoutDashboard,"A"],["/boxes","Boxes",Boxes,"A"],["/projects","Projects",FolderOpen,"A"],["/import","Import data",Upload,"M"],["/labels","Labels",Tag,"S"],["/reports","Reports",FileText,"S"],["/audit","Audit log",ScrollText,"M"],["/users","Users",Users,"M"]] as const;
export default function Shell(){const p=usePathname(),login=p==="/login",[me,setMe]=useState<{role?:string;email?:string}>({});
useEffect(()=>{if(!login)fetch("/api/auth/me").then(r=>r.json()).then(j=>setMe(j)).catch(()=>{})},[login]);if(login)return null;
const role=me.role||"";
const show=(t:string)=>t==="A"||(t==="S"&&["System Manager","Supervisor"].includes(role))||(t==="M"&&role==="System Manager");
const on=(h:string)=>h==="/"?p==="/":p===h||p.startsWith(h+"/");
return <aside className="side"><div className="logo"><span className="mk"><img src="/intercom-logo-white.png" alt="Intercom"/></span><small>Archive records</small></div>
<nav>{tabs.filter(t=>show(t[3])).map(([h,l,I])=><Link key={h} href={h} className={"tab"+(on(h)?" on":"")}><I size={18} strokeWidth={1.75}/>{l}</Link>)}</nav>
<div className="who">{role&&<b>{me.email||"Signed in"}</b>}{role}</div>
<button className="tab out" onClick={async()=>{await fetch("/api/auth/logout",{method:"POST"});location.href="/login"}}><LogOut size={18} strokeWidth={1.75}/>Log out</button></aside>}
