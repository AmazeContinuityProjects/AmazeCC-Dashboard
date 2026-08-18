"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const CHEPUS = [
 "/chepu/chepu_on_the_floor.png",
 "/chepu/chepu_says_hi.png",
 "/chepu/chepu_says_sup.png",
 "/chepu/empty_page_chepu.png",
];

export default function NotFoundPage() {
 const pathname = usePathname();
 const [chepuImage, setChepuImage] = useState<string | null>(null);

 useEffect(() => {
 setChepuImage(CHEPUS[Math.floor(Math.random() * CHEPUS.length)]);
 }, []);

 return (
 <main className="min-h-screen w-full bg-gray-100 px-4 text-foreground transition-colors duration-300 dark:bg-slate-900 ">
 <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center py-10">
 <div className="w-full rounded-3xl border border-gray-300 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-slate-800">
 <div className="mb-4">
 <p className="text-sm font-medium text-muted-foreground">AmazeCC Routing</p>
 <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Page not found</h1>
 <p className="text-sm text-muted-foreground md:text-base">
 This route does not exist or may have been removed.
 </p>
 </div>

 <div>
 {chepuImage && (
 <div className="flex justify-center mb-6">
 <Image
 src={chepuImage}
 alt="Random Chepu"
 width={200}
 height={200}
 className="opacity-90 object-contain drop-shadow-md"
 priority
 />
 </div>
 )}
 <div className="rounded-lg border border-border bg-background/60 p-4 text-sm">
 <p>
 <span className="font-semibold">Requested path:</span> {pathname || "unknown"}
 </p>
 </div>

 <div className="mt-6 flex flex-wrap gap-3">
 <Button asChild>
 <Link href="/">Go to dashboard</Link>
 </Button>
 <Button variant="outline" onClick={() => window.history.back()}>
 Go back
 </Button>
 </div>
 </div>
 </div>
 </div>
 </main>
 );
}
