"use client";
import {useState} from "react";import DataTable from "../../components/DataTable";import ProjectModal from "../../components/ProjectModal";import {cols} from "../../components/cols";import {useApi} from "../../components/useApi";
export default function Projects(){const {d,e}=useApi("projects"),[sel,setSel]=useState<any>(null);if(e)return <div className="msg err">{e}</div>;if(!d)return <div className="msg">Loading…</div>;
const s=new URLSearchParams(location.search).get("status")||"";const rows=s==="Changed"?d.filter((x:any)=>x.import_state==="Changed"):d;
return <><h1>Projects</h1><DataTable cols={cols} rows={rows} fk="status" init={s==="Changed"?"":s} onRow={setSel}/>{sel&&<ProjectModal p={sel} onClose={()=>setSel(null)}/>}</>}
