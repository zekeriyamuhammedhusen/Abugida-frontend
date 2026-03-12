import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

const RevenueGrowth = () => {
  const { t } = useLanguage();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/api/admin/graphs/revenue-growth");
        const rows = Array.isArray(res.data) ? res.data : [];

        // Ensure chronological order and compute cumulative revenue for a steadily increasing curve
        const sorted = [...rows].sort((a, b) => {
          // Expect labels like "Jan 2025"; fallback to original order if parsing fails
          const da = new Date(a.month);
          const db = new Date(b.month);
          return da - db;
        });

        let running = 0;
        const cumulative = sorted.map((row) => {
          const rev = Number(row.revenue) || 0;
          running += rev;
          return { ...row, revenue: running, monthlyRevenue: rev };
        });

        setData(cumulative);
      } catch (err) {
        console.error("Failed to load revenue growth", err);
        setError(t("analytics.revenue.error"));
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
        <CardTitle className="text-lg">{t("analytics.revenue.title")}</CardTitle>
        <CardDescription>
          {t("analytics.revenue.subtitle")}
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
            <p className="text-sm text-muted-foreground">{t("analytics.revenue.empty")}</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `ETB ${Math.round(value / 1000)}k`} />
                <Tooltip
                  formatter={(value, _name, props) => {
                    const monthly = props.payload?.monthlyRevenue ?? 0;
                    return [
                      t("analytics.revenue.tooltip.value", {
                        total: Number(value).toLocaleString(),
                        monthly: Number(monthly).toLocaleString(),
                      }),
                      t("analytics.revenue.tooltip.label"),
                    ];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8884d8"
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RevenueGrowth;
