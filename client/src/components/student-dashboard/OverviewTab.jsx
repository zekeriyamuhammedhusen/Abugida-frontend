import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import api from "@/lib/api";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export const OverviewTab = ({ courses: propCourses, progressMap: propProgressMap, loading: propLoading, error: propError }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [courses, setCourses] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch enrolled courses
  useEffect(() => {
    if (propCourses) {
      setCourses(propCourses);
      setIsLoading(!!propLoading);
      setError(propError || null);
      return;
    }

    const fetchCourses = async () => {
      if (!user?._id) return;

      setIsLoading(true);
      try {
        const response = await api.get(`/api/enrollments/${user._id}/courses`);
        setCourses(response.data);
      } catch (err) {
        console.error("Failed to fetch enrolled courses:", err);
        setError(err?.response?.data?.message || err?.message || "Failed to load courses");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [user, propCourses, propLoading, propError]);

  // Fetch progress for all courses
  useEffect(() => {
    if (propProgressMap && Object.keys(propProgressMap).length) {
      setProgressMap(propProgressMap);
      setIsLoading(!!propLoading);
      setError(propError || null);
      return;
    }

    const fetchAllProgress = async () => {
      if (!user?._id || courses.length === 0) return;

      setIsLoading(true);
      const updatedProgressMap = {};

      try {
        await Promise.all(
          courses.map(async (course) => {
            try {
              const res = await api.get(`/api/progress/${user._id}/${course._id}`);
              const data = res.data;
              updatedProgressMap[course._id] = data;
            } catch (err) {
              console.error(`Progress fetch failed for course ${course._id}:`, err);
              updatedProgressMap[course._id] = {
                progressPercentage: 0,
                completedLessons: [],
                error: err instanceof Error ? err.message : "Failed to fetch progress",
              };
            }
          })
        );
      } catch (err) {
        console.error("Failed to fetch progress for courses:", err);
        setError(err?.response?.data?.message || err?.message || "Failed to load progress");
      } finally {
        setProgressMap(updatedProgressMap);
        setIsLoading(false);
      }
    };

    fetchAllProgress();
  }, [user, courses, propProgressMap, propLoading, propError]);

  // Calculate course statistics
  const completedCourses = courses.filter(
    (c) => progressMap[c._id]?.progressPercentage === 100
  ).length;
  const inProgressCourses = courses.filter(
    (c) =>
      progressMap[c._id]?.progressPercentage > 0 &&
      progressMap[c._id]?.progressPercentage < 100
  ).length;
  const upcomingCourses = courses.filter(
    (c) => progressMap[c._id]?.progressPercentage === 0
  ).length;

  // Filter in-progress courses for "Continue Learning" (limit to 2)
  const continueLearningCourses = courses
    .filter(
      (c) =>
        progressMap[c._id]?.progressPercentage > 0 &&
        progressMap[c._id]?.progressPercentage < 100
    )
    .slice(0, 2);

  const getLastAccessedDate = (lastAccessed) => {
    if (!lastAccessed) return t("student.overview.never");
    try {
      return new Date(lastAccessed).toLocaleDateString();
    } catch {
      return t("student.overview.unknown");
    }
  };

  return (
    <div className="space-y-7">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700/70 bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 p-6 md:p-7 shadow-sm">
        <div className="absolute -right-20 -top-16 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />

        <div className="relative z-10">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {t("student.overview.welcome")}, {user?.name || t("student.sidebar.namePlaceholder") }!
          </h2>
          <p className="text-slate-600 dark:text-slate-300 mt-2 max-w-2xl">
            {t("student.overview.subtitle")}
          </p>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/80 dark:bg-emerald-950/20 px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{t("student.overview.completed")}</p>
              <p className="text-2xl font-semibold text-emerald-900 dark:text-emerald-100 mt-1">
                {completedCourses}
              </p>
            </div>

            <div className="rounded-xl border border-sky-200/70 dark:border-sky-900/40 bg-sky-50/80 dark:bg-sky-950/20 px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-sky-700 dark:text-sky-300">{t("student.overview.inProgress")}</p>
              <p className="text-2xl font-semibold text-sky-900 dark:text-sky-100 mt-1">
                {inProgressCourses}
              </p>
            </div>

            <div className="rounded-xl border border-amber-200/70 dark:border-amber-900/40 bg-amber-50/80 dark:bg-amber-950/20 px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">{t("student.overview.upcoming")}</p>
              <p className="text-2xl font-semibold text-amber-900 dark:text-amber-100 mt-1">
                {upcomingCourses}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Continue learning */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t("student.overview.continue")}
          </h3>
          <span className="text-xs px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {continueLearningCourses.length} active
          </span>
        </div>

        {error && !isLoading && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 p-3 text-sm text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 h-36 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : continueLearningCourses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 p-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t("student.overview.none")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {continueLearningCourses.map((course, i) => (
              <motion.div
                key={course._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                      {course.title}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {t("student.overview.lastAccessed")}: {" "}
                      {getLastAccessedDate(progressMap[course._id]?.lastAccessed)}
                    </p>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 shrink-0">
                    {progressMap[course._id]?.progressPercentage || 0}%
                  </span>
                </div>

                <div className="mt-4 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      progressMap[course._id]?.progressPercentage >= 75
                        ? "bg-emerald-500"
                        : progressMap[course._id]?.progressPercentage >= 35
                        ? "bg-sky-500"
                        : "bg-amber-500"
                    )}
                    style={{
                      width: `${progressMap[course._id]?.progressPercentage || 0}%`,
                    }}
                  ></div>
                </div>

                <div className="mt-3 flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">
                    {progressMap[course._id]?.progressPercentage || 0}% {t("student.common.complete")}
                  </span>
                  <span className="font-semibold text-sky-600 dark:text-sky-400 group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                    {t("student.overview.continue")}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};