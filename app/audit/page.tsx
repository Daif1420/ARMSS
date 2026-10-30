"use client";
import DataTable from "../../components/DataTable";import {useApi} from "../../components/useApi";
export default function Audit(){const {d,e}=useApi("audit");if(e)return <div className="msg err">{e}</div>;if(!d)return <div className="msg">Loading…</div>;
return <><h1>Audit Logs</h1><DataTable fk="action" cols={[{k:"created_at",l:"Date"},{k:"action",l:"Action"},{k:"entity_type",l:"Entity"},{k:"entity_id",l:"ID"},{k:"reason",l:"Reason"}]} rows={d}/></>}
