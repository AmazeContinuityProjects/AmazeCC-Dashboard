import Image from "next/image";
import { EmptyState } from "@amazecontinuityprojects/amazeui";

export default function NoContentFound() {
 return (
 <div className="flex flex-col items-center justify-center h-full py-12">
 <EmptyState
 icon={
 <Image
 src="/chepu/empty_page_chepu.png"
 alt="Empty State"
 width={60}
 height={60}
 className="opacity-90"
 />
 }
 title="No content found"
 description="There's nothing to see here right now."
 />
 </div>
 );
}