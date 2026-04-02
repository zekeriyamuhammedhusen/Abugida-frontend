import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

const StudentProgressCompletion = () => {
  const { t } = useLanguage();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/api/admin/graphs/completion-rates");
        const rows = Array.isArray(res.data) ? res.data : [];
        setData(rows);
      } catch (err) {
        console.error("Failed to load completion rates", err);
        setError(t("analytics.completion.error"));
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="text-lg">{t("analytics.completion.title")}</CardTitle>
        <CardDescription>
          {t("analytics.completion.subtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Skeleton className="h-32 w-full" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : data.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("analytics.completion.empty")}</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.map((row) => ({
                  name: row.name,
                  completionRate: row.completionRate,
                  students: row.students,
                }))}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip
                  formatter={(value, _name, props) => [
                    t("analytics.completion.tooltip.value", {
                      value,
                      count: props.payload.students || 0,
                    }),
                    t("analytics.completion.tooltip.label"),
                  ]}
                  labelFormatter={(label) => `${label}`}
                />
                <Legend />
                <Bar
                  dataKey="completionRate"
                  name={t("analytics.completion.legend")}
                  fill="#06b6d4"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                >
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`rgba(6, 182, 212, ${0.5 + index * 0.1})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentProgressCompletion;
