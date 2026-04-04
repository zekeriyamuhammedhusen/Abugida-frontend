import React from "react";
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
import { useLanguage } from "@/context/LanguageContext";
const feedbackData = [
  { name: "Web Development", rating: 4.8, reviews: 125 },
  { name: "Data Science", rating: 4.6, reviews: 98 },
  { name: "Design", rating: 4.7, reviews: 87 },
  { name: "Marketing", rating: 4.5, reviews: 76 },
  { name: "Business", rating: 4.4, reviews: 65 },
];

const CourseRatingsFeedback = () => {
  const { t } = useLanguage();

  const getCourseLabel = (name) => {
    const map = {
      "Web Development": "analytics.ratings.course.webDevelopment",
      "Data Science": "analytics.ratings.course.dataScience",
      "Design": "analytics.ratings.course.design",
      "Marketing": "analytics.ratings.course.marketing",
      "Business": "analytics.ratings.course.business",
    };
    const key = map[name];
    return key ? t(key) : name;
  };

  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="text-lg">{t("analytics.ratings.title")}</CardTitle>
        <CardDescription>
          {t("analytics.ratings.subtitle")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={feedbackData.map((item) => ({
                ...item,
                name: getCourseLabel(item.name),
              }))}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" domain={[0, 5]} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 150]} />
              <Tooltip
                formatter={(value, name) => {
                  if (name === t("analytics.ratings.legend.rating")) return [value, t("analytics.ratings.tooltip.rating")];
                  return [value, t("analytics.ratings.tooltip.reviews")];
                }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="rating"
                name={t("analytics.ratings.legend.rating")}
                fill="#8884d8"
                radius={[4, 4, 0, 0]}
              >
                {feedbackData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`rgba(136, 132, 216, ${0.5 + index * 0.1})`}
                  />
                ))}
              </Bar>
              <Bar
                yAxisId="right"
                dataKey="reviews"
                name={t("analytics.ratings.legend.reviews")}
                fill="#82ca9d"
                radius={[4, 4, 0, 0]}
              >
                {feedbackData.map((entry, index) => (    
                  <Cell
                    key={`cell-${index}`}
                    fill={`rgba(130, 202, 157, ${0.5 + index * 0.1})`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default CourseRatingsFeedback;
