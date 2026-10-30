"use client";
import {useState} from "react";import DataTable from "../../components/DataTable";import {cols} from "../../components/cols";import {useApi} from "../../components/useApi";
const R=["Completed","Missing","Delivered","Pending","In Progress","Ready for Delivery","On Hold"];
export default function Reports(){const {d,e}=useApi("projects"),[r,setR]=useState("");if(e)return <div className="msg err">{e}</div>;if(!d)return <div className="msg">Loading…</div>;
return <><h1>Reports</h1><div className="bar noprint"><select value={r} onChange={x=>setR(x.target.value)}><option value="">All projects</option>{R.map(x=><option key={x} value={x}>{x} Projects</option>)}</select><button onClick={()=>window.print()}>Print</button></div>
<DataTable key={r} cols={cols} rows={r?d.filter((x:any)=>x.status===r):d} fk="branch_name"/></>}
