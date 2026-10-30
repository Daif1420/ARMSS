"use client";
import {useEffect,useState} from "react";
export function useApi<T=any>(kind:string){const [d,setD]=useState<T|null>(null),[e,setE]=useState("");
useEffect(()=>{let dead=false;
 (async()=>{try{
  let acc:any[]|null=null,off=0,out:any=null;
  for(let i=0;i<200;i++){
   const r=await fetch("/api/data?kind="+kind+(kind==="projects"?"&offset="+off:""),{cache:"no-store"});
   const txt=await r.text();let j:any;try{j=JSON.parse(txt)}catch{throw new Error(r.status===413||/too large/i.test(txt)?"The server response was too large (HTTP "+r.status+").":"The server returned an unreadable response (HTTP "+r.status+").")}
   if(r.status===401){location.href="/login";return}
   if(!r.ok)throw new Error(j.error||"Request failed");
   if(kind==="projects"&&Array.isArray(j.rows)){acc=(acc||[]).concat(j.rows);if(j.next==null||(j.total!=null&&acc.length>=j.total)||!j.rows.length){out=acc;break}off=j.next}else{out=j.rows;break}
  }
  if(!dead)setD(out)}catch(x:any){if(!dead)setE(x?.message||"Network error")}})();
 return()=>{dead=true}},[kind]);return {d,e}}
export const Status=({s}:{s:string})=>{const c:any={Completed:"var(--ok)",Delivered:"var(--ind)","Ready for Delivery":"var(--teal)",Missing:"var(--bad)","On Hold":"var(--warn)","In Progress":"var(--warn)",Pending:"var(--mute)",Open:"var(--info)",Closed:"var(--ok)"};return <span className="badge" style={{["--c" as any]:c[s]||"var(--t2)"}}>{s}</span>};
