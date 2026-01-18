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
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import api from "@/lib/api";

const CourseEarnings = ({ paymentMethod, timeRange }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        setLoading(true);
        const url = `/api/withdrawals/InstructorEarnings?groupBy=month${
          timeRange ? `&range=${timeRange}` : ""
        }`;
        const res = await api.get(url);
        const monthly = res.data?.monthlyEarnings || [];

        const parsed = monthly.map((item) => ({
          month: item.month,
          value: item.value,
        }));

        setData(parsed);
      } catch (e) {
        setError(e.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [timeRange]);

  return (
    <Card className="w-full overflow-hidden hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
        <div>
          <CardTitle>
            Course Earnings (via{" "}
            {paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)})
          </CardTitle>
          <CardDescription>
            Monthly revenue generated from course sales
          </CardDescription>
        </div>
        <div className="h-10 w-10 rounded-full flex items-center justify-center bg-fidel-50 dark:bg-slate-800">
          <TrendingUp className="h-5 w-5 text-fidel-600 dark:text-fidel-400" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[300px] p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">Loading…</div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500">{error}</div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No earnings data available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D9488" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0D9488" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white dark:bg-slate-800 p-2 rounded shadow-lg border border-slate-200 dark:border-slate-700">
                          <p className="text-sm font-medium">
                            {`${payload[0].payload.month}: ETB ${payload[0].value}`}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0D9488"
                  strokeWidth={3}
                  dot={{ fill: "#0D9488", strokeWidth: 2 }}
                  fill="url(#colorValue)"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseEarnings;
