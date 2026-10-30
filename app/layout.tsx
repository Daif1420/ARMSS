import "./globals.css";import Shell from "../components/Shell";
export const metadata={title:"ARMS — Intercom Archive"};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en" dir="ltr"><head>
  <link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Schibsted+Grotesk:wght@400;500;600;700&display=swap"/>
 </head><body><Shell/><main>{children}</main></body></html>}
