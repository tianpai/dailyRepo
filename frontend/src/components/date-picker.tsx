"use client";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDateContext } from "@/components/date-provider";

function formatDate(date: Date) {
  const monthAbbreviations = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthAbbreviations[date.getMonth()];
  const day = date.getDate();
  return `${month} ${day}`;
}

export function RepoDatePicker() {
  const { selectedDate, setSelectedDate } = useDateContext();

  // Default to today if no date is selected
  const today = new Date();
  const displayDate = selectedDate || today;

  // Function to handle date change
  const changeDate = (increment: number) => {
    const currentDate = selectedDate || today;
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + increment);
    setSelectedDate(newDate);
  };

  return (
    <div className="max-w-full flex items-center gap-1">
      <button
        onClick={() => changeDate(-1)}
        className="p-2 text-foreground major-mono hover:opacity-70 transition-all duration-200 shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0">
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-full p-2 border-2 bg-background border-border text-foreground major-mono text-lg hover:bg-foreground hover:text-background transition-all duration-200 flex items-center justify-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span className="truncate">{formatDate(displayDate)}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1 border-2 bg-background border-border">
            <Calendar
              mode="single"
              selected={displayDate}
              onSelect={(date) => setSelectedDate(date)}
              className="major-mono"
            />
          </PopoverContent>
        </Popover>
      </div>
      <button
        onClick={() => changeDate(1)}
        className="p-2 text-foreground major-mono hover:opacity-70 transition-all duration-200 shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
