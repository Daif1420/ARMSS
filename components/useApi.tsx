"use client";
import {useEffect,useState} from "react";
// Small in-memory cache so moving between pages doesn't reload everything (30 s).
const CACHE=new Map<string,{t:number;d:any}>();const TTL=30000;
async function get(url:string){const r=await fetch(url,{cache:"no-store"});const txt=await r.text();let j:any;
 try{j=JSON.parse(txt)}catch{throw new Error(r.status===413||/too large/i.test(txt)?"The server response was too large (HTTP "+r.status+").":"The server returned an unreadable response (HTTP "+r.status+").")}
 if(r.status===401){location.href="/login";throw new Error("Signed out")}
 if(!r.ok)throw new Error(j.error||"Request failed");return j}
async function load(kind:string){
 if(kind!=="projects")return (await get("/api/data?kind="+kind)).rows;
 const P=1000,first=await get("/api/data?kind=projects&offset=0");let rows:any[]=first.rows;const total:number=first.total??rows.length;
 const offs:number[]=[];for(let o=P;o<total;o+=P)offs.push(o);const parts:any[][]=new Array(offs.length);let k=0;
 await Promise.all(Array.from({length:Math.min(6,offs.length)},async()=>{while(k<offs.length){const i=k++;parts[i]=(await get("/api/data?kind=projects&offset="+offs[i])).rows}}));
 for(const x of parts)rows=rows.concat(x);return rows}
export function useApi<T=any>(kind:string){const hit=CACHE.get(kind);const [d,setD]=useState<T|null>(hit&&Date.now()-hit.t<TTL?hit.d:null),[e,setE]=useState("");
useEffect(()=>{let dead=false;const h=CACHE.get(kind);if(h&&Date.now()-h.t<TTL){setD(h.d);return}
 load(kind).then(x=>{CACHE.set(kind,{t:Date.now(),d:x});if(!dead)setD(x)}).catch(x=>{if(!dead)setE(x?.message||"Network error")});
 return()=>{dead=true}},[kind]);return {d,e}}
export const Status=({s}:{s:string})=>{const c:any={Completed:"var(--ok)",Delivered:"var(--ind)","Ready for Delivery":"var(--teal)",Missing:"var(--bad)","On Hold":"var(--warn)","In Progress":"var(--warn)",Pending:"var(--mute)",Open:"var(--info)",Closed:"var(--ok)"};return <span className="badge" style={{["--c" as any]:c[s]||"var(--t2)"}}>{s}</span>};
