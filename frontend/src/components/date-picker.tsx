"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import { LuArrowLeft, LuArrowRight } from "react-icons/lu";
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
  const currentTrendingDate =
    data.length > 0 ? new Date(data[0].trendingDate) : new Date();
  const displayDate = selectedDate || currentTrendingDate;

  // Function to handle date change
  const changeDate = (increment: number) => {
    if (selectedDate && selectedDate <= currentTrendingDate) {
      const newDate = new Date(selectedDate);
      newDate.setDate(newDate.getDate() + increment);
      setSelectedDate(newDate);
    } else {
      const newDate = new Date(currentTrendingDate);
      newDate.setDate(newDate.getDate() + increment);
      setSelectedDate(newDate);
    }
  };

  return (
    <div className="max-w-full mb-4 flex items-center gap-1 p-2 sm:p-4">
      <Button
        variant="outline"
        size="icon"
        onClick={() => changeDate(-1)}
        className="h-10 w-10 shrink-0"
      >
        <LuArrowLeft className="h-4 w-4" />
      </Button>

      <div className="flex-1 min-w-0">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal text-lg sm:text-xl font-bold h-10"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              <span className="truncate">
                {displayDate.toLocaleDateString()}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1">
            <Calendar
              mode="single"
              selected={selectedDate || currentTrendingDate}
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
        <LuArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
