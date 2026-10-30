import {NextResponse,type NextRequest} from "next/server";
async function ok(tok:string|undefined,secret:string|undefined){
 if(!tok||!secret)return false;const [p,sig]=tok.split(".");if(!p||!sig)return false;
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
 const mac=new Uint8Array(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(p)));
 const exp=btoa(String.fromCharCode(...Array.from(mac))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
 if(exp!==sig)return false;
 try{return JSON.parse(atob(p.replace(/-/g,"+").replace(/_/g,"/"))).exp>Date.now()}catch{return false}}
export async function middleware(req:NextRequest){
 if(await ok(req.cookies.get("arms_session")?.value,process.env.SESSION_SECRET))return NextResponse.next();
 if(req.nextUrl.pathname.startsWith("/api/"))return NextResponse.json({error:"Unauthorized"},{status:401});
 return NextResponse.redirect(new URL("/login",req.url));}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico|intercom-logo-white.png|login|api/auth|api/health).*)"]};
