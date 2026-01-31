import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronRight, Plus } from "lucide-react";
import { Edit, Trash2, Eye } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const CourseTable = ({ courses = [], onViewAll, onCreate, showStatus = false, showActions = false, onEdit, onDelete }) => {
  const { t } = useLanguage();
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">{t("instructor.courses.title") || "Your Courses"}</h3>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            {t("instructor.courses.viewAll") || "View All Courses"}
          </Button>
        )}
        {onCreate && (
          <Button onClick={onCreate} className="w-full md:w-auto">
            <Plus size={16} className="mr-2" />
            {t("instructor.sidebar.createCourse")}
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("instructor.courses.course") || "Course"}</TableHead>
              <TableHead className="hidden sm:table-cell">{t("instructor.common.students") || "Students"}</TableHead>
              <TableHead>{t("instructor.courses.progress") || "Progress"}</TableHead>
              <TableHead className="hidden md:table-cell">{t("instructor.courses.lastUpdated") || "Last Updated"}</TableHead>
              {showStatus && (
                <TableHead className="hidden sm:table-cell">{t("instructor.courses.status") || "Status"}</TableHead>
              )}
              {(showActions || !onViewAll) && <TableHead>{t("instructor.courses.actions") || "Actions"}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(courses) && courses.length > 0 ? (
              courses.map((course) => (
                <TableRow key={course._id || course.id}>
                  <TableCell className="font-medium">{course.title}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {course.students}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="w-24 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-fidel-500 rounded-full"
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {course.progress}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
  {new Date(course.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
     
  })}
</TableCell>
                  {showStatus && (
                    <TableCell className="hidden sm:table-cell">
                      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs">
                        {t("instructor.courses.published") || "Published"}
                      </span>
                    </TableCell>
                  )}
                  {(showActions || !onViewAll) && (
                    <TableCell>
                      {showActions ? (
                        <div className="flex space-x-2">
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(course._id || course.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(course._id || course.id)}
                            >
                              <Edit size={16} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.href = `/courses/${course._id || course.id}`}
                          >
                            <Eye size={16} />
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="p-0">
                          <ChevronRight size={16} />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  {t("instructor.courses.empty") || "No courses found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CourseTable;
