"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsCards({
 attendancePercentage,
 ODhoursData,
 setODhoursIsOpen,
 marksData,
 feedbackStatus,
 setGradesDisplayIsOpen,
 CGPAHidden,
 setCGPAHidden,
 attendancePercentageOrString,
 setAttendancePercentageOrString,
 isLoading = false,
}) {
 const totalODHours =
 ODhoursData && ODhoursData.length > 0 && ODhoursData[0].courses
 ? ODhoursData.reduce((sum, day) => sum + day.total, 0)
 : 0;

 const cardBase =
  "cursor-pointer p-6 rounded-md shadow-small hover:shadow-medium transition flex-shrink-0 snap-start w-[calc(50%-8px)] md:w-[calc(25%-12px)] flex flex-col items-center justify-center text-center";

 if (isLoading) {
 return (
 <div data-scrollable className="overflow-x-auto snap-x snap-mandatory ml-4 mr-4">
 <div className="flex gap-4 py-4 px-2">
  <Skeleton className={`${cardBase} h-32 bg-card `} />
  <Skeleton className={`${cardBase} h-32 bg-card `} />
  <Skeleton className={`${cardBase} h-32 bg-card `} />
  <Skeleton className={`${cardBase} h-32 bg-card `} />
 </div>
 </div>
 );
 }

 return (
 <div data-scrollable className="overflow-x-auto snap-x snap-mandatory ml-4 mr-4">
 <div className="flex gap-4 py-4 px-2">
 {/* Card 1 */}
  <div
  className={`${cardBase} bg-card `}
  onClick={() => setAttendancePercentageOrString(attendancePercentageOrString === "percentage" ? "str" : "percentage")}
  >
  <h2 className="text-lg font-semibold text-muted-foreground ">Attendance</h2>
  <p className="text-3xl font-bold text-foreground mt-2">
  {attendancePercentage?.[attendancePercentageOrString] || 0}
  </p>
  </div>

  {/* Card 2 */}
  <div
  className={`${cardBase} bg-card `}
  onClick={() => setODhoursIsOpen(true)}
  >
  <h2 className="text-lg font-semibold text-muted-foreground ">OD hours</h2>
  <p className="text-3xl font-bold text-foreground mt-2">
  {totalODHours}/40
  </p>
  </div>

  {/* Card 3 - Feedback Status */}
  {feedbackStatus && <div
  className={`${cardBase} bg-card `}
  onClick={() => console.log("Feedback Status was clicked")}
  >
  <h2 className="text-lg font-semibold text-muted-foreground mb-1">
  Feedback
  </h2>

  <div className="flex items-center justify-center gap-3 mt-2 text-center">
  <div className="flex flex-col items-center">
  <span className="text-xs text-muted-foreground ">
  Mid Sem
  </span>
  <span
  className={`text-base font-bold ${feedbackStatus?.MidSem?.Curriculum && feedbackStatus?.MidSem?.Course
  ? "text-[var(--semantic-success)]"
  : "text-[var(--semantic-danger)]"
  }`}
  >
  {feedbackStatus?.MidSem?.Curriculum && feedbackStatus?.MidSem?.Course
  ? "Given"
  : "Not Given"}
  </span>
  </div>

  <div className="h-8 w-px bg-border rounded-full" />

  <div className="flex flex-col items-center">
  <span className="text-xs text-muted-foreground ">
  End Sem
  </span>
  <span
  className={`text-base font-bold ${feedbackStatus?.EndSem?.Curriculum && feedbackStatus?.EndSem?.Course
  ? "text-[var(--semantic-success)]"
  : "text-[var(--semantic-danger)]"
  }`}
  >
  {feedbackStatus?.EndSem?.Curriculum && feedbackStatus?.EndSem?.Course
  ? "Given"
  : "Not Given"}
  </span>
  </div>
  </div>
  </div>}

  {/* Card 3 */}
  {marksData?.cgpa && <div
  className={`${cardBase} bg-card `}
  onClick={() => setCGPAHidden(!CGPAHidden)}
  >
  <h2 className="text-lg font-semibold text-muted-foreground ">
  CGPA
  </h2>
  <p className="text-3xl font-bold text-foreground mt-2 select-none">
  {CGPAHidden ? "###" : marksData?.cgpa?.cgpa}
  </p>
  </div>
  }

  {/* Card 4 */}
  <div
  className={`${cardBase} bg-card `}
  onClick={() => setGradesDisplayIsOpen(true)}
  >
  <h2 className="text-lg font-semibold text-muted-foreground ">Credits Earned</h2>
  <p className="text-3xl font-bold text-foreground mt-2">
  {Number(marksData?.cgpa?.creditsEarned || 0) + Number(marksData?.cgpa?.nonGradedRequirement || 0)}
  </p>
  </div>
 </div>
 </div>
 );
}
