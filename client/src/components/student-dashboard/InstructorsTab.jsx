// components/student-dashboard/InstructorsTab.jsx
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export const InstructorsTab = ({ instructors = [], loading, error }) => {
  const { t } = useLanguage();
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-slate-900 dark:text-white">
        {t("student.instructors.title")}
      </h2>
      {loading ? (
        <div className="flex justify-center items-center h-24">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : instructors.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("student.instructors.empty")}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {instructors.map((inst) => (
            <div
              key={inst.id}
              className="glass-card p-4 border border-slate-200 dark:border-slate-800 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-abugida-100 dark:bg-abugida-900/30 flex items-center justify-center text-abugida-600 dark:text-abugida-400 font-medium text-sm">
                  {(inst.name || "IN").split(" ").map((n) => n[0]).join("").toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{inst.name || "Instructor"}</p>
                  <p className="text-xs text-muted-foreground">{inst.email || "Email not available"}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{t("student.instructors.coursesWith")} {inst.courseCount || 0}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
