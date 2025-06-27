"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";

// import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRepoDataContext } from "@/context/repo-data-provider";

export function RepoDatePicker() {
  const { data, selectedDate, setSelectedDate } = useRepoDataContext();
  
  // Get current trending date from data (the actual scraped date), fallback to today
  const currentTrendingDate = data.length > 0 ? new Date(data[0].trendingDate) : new Date();
  const displayDate = selectedDate || currentTrendingDate;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[280px] justify-start text-left font-normal text-2xl font-bold"
        >
          <CalendarIcon />
          <span>{displayDate.toLocaleDateString()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar 
          mode="single" 
          selected={selectedDate || currentTrendingDate} 
          onSelect={(date) => setSelectedDate(date)} 
        />
      </PopoverContent>
    </Popover>
  );
}
