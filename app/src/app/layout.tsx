import type { Metadata } from "next";
import "./globals.css";
import { Familjen_Grotesk, Inter } from 'next/font/google'
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';
import { RedButtonProvider } from '@/components/RedButton/context';
import Menu from './menu';
import Footer from './footer';
import { createMetadata } from '@/lib/metadata';

// If loading a variable font, you don't need to specify the font weight
const inter = Inter({ subsets: ['latin'] })
const familjen = Familjen_Grotesk({ subsets: ['latin'], weight: 'variable' })

export const metadata: Metadata = createMetadata();

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="nl">
            <body className={cn(inter.className, familjen.className, 'bg-blue-50 text-blue-900')}>
                <RedButtonProvider>
                    <TooltipProvider>
                        <div className="flex flex-col min-h-screen">
                            <Menu />
                            <main className="max-w-[1280px] mx-auto xl:px-0 md:p-8 p-4 flex-grow-1 w-full">
                                {children}
                            </main>
                            <Footer />
                        </div>
                    </TooltipProvider>
                </RedButtonProvider>
            </body>
        </html>
    );
}
