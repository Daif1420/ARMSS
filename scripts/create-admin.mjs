import {createClient} from "@supabase/supabase-js";
const {SUPABASE_URL:u,SUPABASE_SERVICE_ROLE_KEY:k,ADMIN_EMAIL:email,ADMIN_PASSWORD:password,ADMIN_NAME:name}=process.env;
if(!u||!k||!email||!password||u.includes("PASTE")||k.includes("PASTE")){console.error("Fill SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD in .env.local first.");process.exit(1)}
const s=createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false}});
let id;const {data,error}=await s.auth.admin.createUser({email,password,email_confirm:true});
if(error){if(!/already|registered|exists/i.test(error.message)){console.error("Create user failed:",error.message);process.exit(1)}
 const l=await s.auth.admin.listUsers({perPage:1000});const f=l.data?.users?.find(x=>x.email?.toLowerCase()===email.toLowerCase());
 if(!f){console.error("User exists but was not found.");process.exit(1)}id=f.id;await s.auth.admin.updateUserById(id,{password,email_confirm:true});console.log("User already existed — password updated.")}
else id=data.user.id;
const r=await s.from("profiles").upsert({id,full_name:name||"System Manager",role:"System Manager"});
if(r.error){console.error("Profile failed (did you run supabase/schema.sql?):",r.error.message);process.exit(1)}
console.log("Admin ready:",email,"(System Manager)");
