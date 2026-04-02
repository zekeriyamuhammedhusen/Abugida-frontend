import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Award } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import api from "@/lib/api";

const COLORS = ["#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE", "#DBEAFE"];

const StudentProgressCompletion = ({ timeRange }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatLabel = (name) => {
    if (!name) return "Unknown";
    const cleaned = name.toString().trim().replace(/[_-]/g, " ");
    const lower = cleaned.toLowerCase();

    if (lower.includes("in progress")) return "In Progress";
    if (lower.includes("completed")) return "Completed";
    if (lower.includes("not")) return "Not Started";

    return cleaned.replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const { t } = useLanguage();

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        const response = await api.get(`/api/graphs/student-progress-completion`, {
          params: { timeRange },
        });
        const normalized = (response.data || []).map((item) => ({
          ...item,
          label: formatLabel(item.name),
          value: Number(item.value) || 0,
          count: Number(item.count) || 0,
        }));
        setData(normalized);
      } catch (error) {
        console.error("Error fetching student progress data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [timeRange]);

  return (
    <Card className="w-full overflow-hidden hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
        <div>
          <CardTitle>{t("analytics.progress.title")}</CardTitle>
          <CardDescription>
            {t("analytics.progress.desc")}
          </CardDescription>
        </div>
        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-fidel-50 dark:bg-slate-800">
          <Award className="h-5 w-5 text-fidel-600 dark:text-fidel-400" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[300px] p-6">
          {loading ? (
            <div className="flex justify-center items-center h-full">{t("analytics.common.loading")}</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  label={false}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-800 p-2 rounded shadow-lg border border-slate-200 dark:border-slate-700">
                          <p className="text-sm font-medium">
                            {t("analytics.progress.tooltip.pct")
                              .replace("{label}", payload[0].payload.label)
                              .replace("{value}", payload[0].value)}
                          </p>
                          <p className="text-sm">
                            {t("analytics.progress.tooltip.count").replace(
                              "{count}",
                              payload[0].payload.count
                            )}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          {!loading && data.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {data.map((entry, index) => (
                <div key={entry.label} className="space-y-1">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span
                      className="inline-block h-3 w-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      aria-hidden
                    />
                    <span className="font-medium truncate">{entry.label}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <span>{entry.value}%</span>
                    <span>· {entry.count} {t("instructor.common.students") || "students"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentProgressCompletion;
