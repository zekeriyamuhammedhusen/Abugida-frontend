import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import StudentEnrollmentsPerCourse from "./StudentEnrollmentsPerCourse";
import StudentProgressCompletion from "./StudentProgressCompletion";
import CourseRatingsFeedback from "./CourseRatingsFeedback";
import CourseEarnings from "./CourseEarnings";

const timeRanges = [
  { label: "Week", value: "7d" },
  { label: "Month", value: "30d" },
  { label: "Quarter", value: "90d" },
  { label: "Year", value: "ytd" },
];

const InstructorAnalyticsDashboard = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d");
  const [paymentMethod, setPaymentMethod] = useState("chapa");

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold">Instructor Analytics Dashboard</h2>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chapa">Chapa</SelectItem>
                <SelectItem value="telebirr">TeleBirr</SelectItem>
                <SelectItem value="all">All Methods</SelectItem>
              </SelectContent>
            </Select> */}

            <div className="flex space-x-2">
              {timeRanges.map((range) => (
                <Button
                  key={range.value}
                  variant={selectedTimeRange === range.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeRange(range.value)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StudentEnrollmentsPerCourse timeRange={selectedTimeRange} />
        <StudentProgressCompletion timeRange={selectedTimeRange} />
        <CourseRatingsFeedback />
        <CourseEarnings
          paymentMethod={paymentMethod}
          timeRange={selectedTimeRange}
        />
      </div>
    </div>
  );
};

export default InstructorAnalyticsDashboard;
