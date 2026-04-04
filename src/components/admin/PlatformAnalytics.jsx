import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  BookOpen,
  Layers,
  DollarSign,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import CourseEarnings from "./analytics/CourseEarnings";
import CourseRatingsFeedback from "./analytics/CourseRatingsFeedback";
import StudentProgressCompletion from "./analytics/StudentProgressCompletion";
import StudentEnrollmentsPerCourse from "./analytics/StudentEnrollmentsPerCourse";
import api from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

const PlatformAnalytics = () => {
  const { t } = useLanguage();
  const [timePeriod, setTimePeriod] = useState("30days");
  const [paymentMethod, setPaymentMethod] = useState("chapa");
  const [startDate, setStartDate] = useState(undefined);
  const [endDate, setEndDate] = useState(undefined);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  const userGrowthData = [
    { name: "Jan", students: 120, instructors: 8 },
    { name: "Feb", students: 165, instructors: 12 },
    { name: "Mar", students: 210, instructors: 15 },
    { name: "Apr", students: 305, instructors: 20 },
    { name: "May", students: 390, instructors: 24 },
    { name: "Jun", students: 480, instructors: 30 },
  ];

  const formatNumber = (val) =>
    typeof val === "number" && Number.isFinite(val)
      ? val.toLocaleString("en-US")
      : "—";

  const formatCurrency = (val) =>
    typeof val === "number" && Number.isFinite(val)
      ? `ETB ${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : "ETB 0.00";

  const platformStats = [
    {
      titleKey: "admin.analytics.totalUsers",
      value: formatNumber(stats?.totalUsers),
      icon: Users,
      change: "",
      chart: "up",
      dataKey: "students",
    },
    {
      titleKey: "admin.analytics.totalStudents",
      value: formatNumber(Number.isFinite(stats?.totalStudents) ? stats.totalStudents : 0),
      icon: Users,
      change: "",
      chart: "up",
      dataKey: "students",
    },
    {
      titleKey: "admin.analytics.totalInstructors",
      value: formatNumber(stats?.totalInstructors),
      icon: BookOpen,
      change: "",
      chart: "up",
      dataKey: "instructors",
    },
    {
      titleKey: "admin.analytics.totalCourses",
      value: formatNumber(stats?.totalCourses),
      icon: Layers,
      change: "",
      chart: "up",
      dataKey: "students",
    },
    {
      titleKey: "admin.analytics.totalRevenue",
      value: formatCurrency(stats?.totalRevenue),
      icon: DollarSign,
      change: "",
      chart: "up",
      dataKey: "students",
    },
  ];

  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);
        const res = await api.get("/api/admin/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load platform stats", err);
        setStatsError(t("admin.analytics.statsError"));
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, []);

  const resetDateFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>{t("admin.analytics.title")}</CardTitle>
              <CardDescription>
                {t("admin.analytics.subtitle")}
              </CardDescription>
            </div>

       
          </div>
        </CardHeader>  
        <CardContent>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {platformStats.map((stat, index) => (
              <Card
                key={stat.titleKey}
                className="border-none shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {t(stat.titleKey)}
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-fidel-50 dark:bg-slate-800">
                      <stat.icon
                        size={18}
                        className="text-fidel-500 dark:text-fidel-400"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    <h3 className="text-2xl font-bold mt-1">
                      {statsLoading ? '—' : stat.value}
                    </h3>
                    {statsError ? (
                      <p className="text-xs text-red-500 mt-1">{statsError}</p>
                    ) : (
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp size={14} className="text-green-500" />
                        <p className="text-xs text-green-500">
                          {stat.change || t("admin.analytics.liveData")}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 h-10">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={userGrowthData}
                        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id={`colorStat${index}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#0d8df4"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#0d8df4"
                              stopOpacity={0.1}
                            />
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey={stat.dataKey}
                          stroke="#0d8df4"
                          fill={`url(#colorStat${index})`}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Analytics Components */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <StudentEnrollmentsPerCourse />
            <StudentProgressCompletion />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CourseEarnings paymentMethod={paymentMethod} />
            <CourseRatingsFeedback />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformAnalytics;