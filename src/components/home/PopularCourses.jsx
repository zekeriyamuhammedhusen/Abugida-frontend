import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import CourseCard from "./CourseCard";
import AnimatedButton from "../ui/AnimatedButton ";
import { motion } from "framer-motion";
import axios from "axios";
import api from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

const categoryDefs = [
  { value: "All", key: "popular.category.all" },
  { value: "Machine Learning", key: "popular.category.machineLearning" },
  { value: "web-development", key: "popular.category.web" },
  { value: "Business", key: "popular.category.business" },
  { value: "Psychology", key: "popular.category.psychology" },
  { value: "Finance", key: "popular.category.finance" },
  { value: "Design", key: "popular.category.design" },
  { value: "Languages", key: "popular.category.languages" },
];

const PopularCourses = () => {
  const { t } = useLanguage();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("popular");
  const [sortDirection, setSortDirection] = useState("desc");
  const token = null;

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch active courses only
        const response = await api.get(`/api/courses/active`);
        const courseData = response.data;

        // Fetch review stats and student count for each course
        const coursesWithData = await Promise.all(
          courseData.map(async (course) => {
            const courseId = course.id || course._id;
            let avgRating = "N/A";
            let totalReviews = 0;
            let studentCount = 0;

            // Fetch review stats
            try {
              const reviewResponse = await api.get(`/api/review/${courseId}`);
              avgRating = reviewResponse.data.reviewStats?.avgRating || "N/A";
              totalReviews = reviewResponse.data.reviewStats?.totalReviews || 0;
            } catch (error) {
              console.error(`Failed to fetch review stats for course ${courseId}:`, error);
            }

            try {
              const studentResponse = await api.get(`/api/courses/${courseId}/student-count`);
              studentCount = studentResponse.data.studentCount || 0;
            } catch (error) {
              console.error(`Failed to fetch student count for course ${courseId}:`, error);
            }

            return {
              ...course,
              avgRating,
              totalReviews,
              students: studentCount,
            };
          })
        );

        setCourses(coursesWithData);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = courses
    .filter(course => 
      activeCategory === "All" || course.category === activeCategory
    )
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "popular":
          comparison = (a.students || 0) - (b.students || 0);
          break;
        case "rating":
          const ratingA = a.avgRating === "N/A" ? 0 : parseFloat(a.avgRating);
          const ratingB = b.avgRating === "N/A" ? 0 : parseFloat(b.avgRating);
          comparison = ratingA - ratingB;
          break;
        case "price":
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        default:
          comparison = 0;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

  if (loading) {
    return (
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 md:px-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-abugida-500 mx-auto"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 md:px-8 text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-500">{t('popular.error.title')}</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-fidel-500 text-white rounded-lg hover:bg-fidel-600 transition-colors"
          >
            {t('popular.error.retry')}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
            {t('popular.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('popular.subtitle')}
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div className="overflow-x-auto w-full md:w-auto">
            <div className="flex space-x-2 min-w-max">
              {categoryDefs.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setActiveCategory(category.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    activeCategory === category.value
                      ? "bg-fidel-500 text-white shadow-sm"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {t(category.key)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm"
            >
              <option value="popular">{t('popular.sort.popularity')}</option>
              <option value="rating">{t('popular.sort.rating')}</option>
              <option value="price">{t('popular.sort.price')}</option>
              <option value="title">{t('popular.sort.title')}</option>
            </select>
            <button
              onClick={() => setSortDirection(sortDirection === "asc" ? "desc" : "asc")}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              {sortDirection === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>

        {filteredCourses.length > 0 ? (
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {filteredCourses.map((course) => (
              <CourseCard 
                key={course.id || course._id}
                id={course.id || course._id}
                title={course.title}
                instructor={course.instructor}
                category={course.category}
                level={course.level}
                price={course.price}
                thumbnail={course.thumbnail}
                modules={course.modules}
                avgRating={course.avgRating}
                totalReviews={course.totalReviews}
                students={course.students}
                featured={course.featured}
              />
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-slate-400"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">
              {t('popular.empty.title')}
            </h3>
            <p className="text-muted-foreground">
              {t('popular.empty.desc')}
            </p>
          </div>
        )}

        <div className="mt-12 text-center">
          <AnimatedButton to="/courses" variant="outline" size="lg">
            {t('popular.viewAll')}
            <ArrowRight className="ml-2" size={18} />
          </AnimatedButton>
        </div>
      </div>
    </section>
  );
};

export default PopularCourses;