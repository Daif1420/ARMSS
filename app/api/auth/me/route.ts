import {NextResponse as R} from "next/server";import {session} from "../../../../lib/server";
export async function GET(req:Request){const u=session(req);return u?R.json({role:u.role,email:u.email}):R.json({error:"Unauthorized"},{status:401})}
