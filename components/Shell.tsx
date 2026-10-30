"use client";
import {useEffect,useState} from "react";import Link from "next/link";import {usePathname} from "next/navigation";
import {LayoutDashboard,Boxes,FolderOpen,Upload,Tag,LogOut,ScrollText,FileText,Users} from "lucide-react";
const tabs=[["/","Dashboard",LayoutDashboard,"A"],["/boxes","Boxes",Boxes,"A"],["/projects","Projects",FolderOpen,"A"],["/import","Import Data",Upload,"M"],["/labels","Labels",Tag,"S"],["/reports","Reports",FileText,"S"],["/audit","Audit Logs",ScrollText,"M"],["/users","Users",Users,"M"]] as const;
export default function Shell(){const p=usePathname(),login=p==="/login",[role,setRole]=useState("");
useEffect(()=>{if(!login)fetch("/api/auth/me").then(r=>r.json()).then(j=>setRole(j.role||"")).catch(()=>{})},[login]);if(login)return null;
const show=(t:string)=>t==="A"||(t==="S"&&["System Manager","Supervisor"].includes(role))||(t==="M"&&role==="System Manager");
return <nav className="top"><span className="brand">ARMS</span>{tabs.filter(t=>show(t[3])).map(([h,l,I])=><Link key={h} href={h} className={"tab"+(p===h?" on":"")}><I size={16}/>{l}</Link>)}
<button className="tab" style={{marginInlineStart:"auto",background:"none",border:0,cursor:"pointer"}} onClick={async()=>{await fetch("/api/auth/logout",{method:"POST"});location.href="/login"}}><LogOut size={16}/>Logout</button></nav>}
