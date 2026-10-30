import "./globals.css";import Shell from "../components/Shell";
export const metadata={title:"ARMS — Intercom Archive"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl"><body><Shell/><main>{children}</main></body></html>}
