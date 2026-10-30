import "./globals.css";import Shell from "../components/Shell";
export const metadata={title:"ARMS — Intercom Archive"};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en" dir="ltr"><head><meta name="viewport" content="width=device-width, initial-scale=1"/><meta name="color-scheme" content="light dark"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin=""/>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"/>
 </head><body><Shell/><main>{children}</main></body></html>}
