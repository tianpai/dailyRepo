"use client";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <Button
        variant="outline"
        size="icon"
        onClick={() => changeDate(-1)}
        className="h-10 w-10 shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex-1 min-w-0">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-center font-normal h-10"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              <span className="truncate ">{formatDate(displayDate)}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1">
            <Calendar
              mode="single"
              selected={displayDate}
              onSelect={(date) => setSelectedDate(date)}
            />
          </PopoverContent>
        </Popover>
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={() => changeDate(1)}
        className="h-10 w-10 shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
