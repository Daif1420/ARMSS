"use client";
import {useEffect,useState} from "react";
export function useApi<T=any>(kind:string){const [d,setD]=useState<T|null>(null),[e,setE]=useState("");
useEffect(()=>{fetch("/api/data?kind="+kind).then(r=>r.json().then(j=>r.ok?setD(j.rows):setE(j.error||"Request failed"))).catch(()=>setE("Network error"))},[kind]);return {d,e}}
export const Status=({s}:{s:string})=>{const c:any={Completed:"var(--ok)",Delivered:"var(--p)","Ready for Delivery":"var(--p2)",Missing:"var(--bad)","On Hold":"var(--warn)","In Progress":"var(--warn)",Pending:"var(--t2)",Open:"var(--info)",Closed:"var(--ok)"};return <span className="badge" style={{["--c" as any]:c[s]||"var(--t2)"}}>{s}</span>};
