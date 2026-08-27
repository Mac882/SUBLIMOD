import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import WhatsAppWidget from "@/components/WhatsAppWidget";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "SubliMod | Productos Personalizados",
  description: "Personalización de productos mediante sublimación y vinilado en Jinotega.",
  icons: {
    icon: "/logo-sublimod.svg",
    shortcut: "/logo-sublimod.svg",
    apple: "/logo-sublimod.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={`${poppins.className} antialiased bg-slate-50 text-slate-800`}>
        {children}
        <WhatsAppWidget />
      </body>
    </html>
  );
}
