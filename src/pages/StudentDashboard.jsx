import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Book,
  Users,
  MessageSquare,
  Settings,
  Menu,
} from "lucide-react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { OverviewTab } from "@/components/student-dashboard/OverviewTab";
import { MessagesTab } from "@/components/student-dashboard/MessagesTab";
import { InstructorsTab } from "@/components/student-dashboard/InstructorsTab";
import { CoursesTab } from "@/components/student-dashboard/CoursesTab";
import Logo from "../components/layout/Logo";
import { useAuth } from "../context/AuthContext";
import PlatformSettings from "../components/admin/PlatformSettings";
import api from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { id: "overview", label: t("student.nav.overview"), icon: LayoutDashboard },
    { id: "courses", label: t("student.nav.courses"), icon: Book },
    { id: "messages", label: t("student.nav.messages"), icon: MessageSquare },
    { id: "instructors", label: t("student.nav.instructors"), icon: Users },
    { id: "settings", label: t("student.nav.settings"), icon: Settings },
  ];

  // Handle URL tab parameter on load
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get("tab");

    if (tabParam && navItems.some((item) => item.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  const handleNavItemClick = (id) => {
    setActiveTab(id);
    navigate(`/student-dashboard?tab=${id}`);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Fetch courses + progress once for all tabs
  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) return;
      setDataLoading(true);
      setDataError(null);
      try {
        const enrolled = await api.get(`/api/enrollments/${user._id}/courses`);
        const courseList = enrolled.data || [];
        const updatedProgress = {};
        await Promise.all(
          courseList.map(async (course) => {
            try {
              const res = await api.get(`/api/progress/${user._id}/${course._id}`);
              updatedProgress[course._id] = res.data;
            } catch (err) {
              updatedProgress[course._id] = {
                progressPercentage: 0,
                completedLessons: [],
                error: err?.response?.data?.message || err?.message || "Unable to load progress",
              };
            }
          })
        );
        setCourses(courseList);
        setProgressMap(updatedProgress);
      } catch (err) {
        setDataError(err?.response?.data?.message || err?.message || "Failed to load dashboard data");
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const instructors = useMemo(() => {
    const map = new Map();
    courses.forEach((c) => {
      const instr = c.instructor;
      if (!instr) return;
      const id = instr._id || instr.id || instr;
      if (!map.has(id)) {
        map.set(id, {
          id,
          name: instr.name || "Instructor",
          email: instr.email,
          courseCount: 1,
        });
      } else {
        const entry = map.get(id);
        entry.courseCount += 1;
        map.set(id, entry);
      }
    });
    return Array.from(map.values());
  }, [courses]);

  const getActiveTabTitle = () => {
    switch (activeTab) {
      case "overview":
        return t("student.header.overview");
      case "courses":
        return t("student.header.courses");
      case "messages":
        return t("student.header.messages");
      case "instructors":
        return t("student.header.instructors");
      case "settings":
        return t("student.header.settings");
      default:
        return t("student.header.overview");
    }
  };

  return (
    <div className="flex h-[100vh] dark:bg-slate-950">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 h-[100vh] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:relative md:block overflow-hidden`}
      >
        <div className="flex items-center space-x-2 mb-8">
          <Logo />
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavItemClick(item.id)}
              className={`flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium ${
                activeTab === item.id
                  ? "bg-abugida-50 text-abugida-600 dark:bg-slate-800 dark:text-abugida-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <item.icon size={18} className="mr-2" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-5 left-5 right-5">
          <div className="flex items-center space-x-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
            <div className="h-8 w-8 rounded-full bg-abugida-100 dark:bg-abugida-900/30 flex items-center justify-center text-abugida-600 dark:text-abugida-400 font-medium">
              {user?.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                : "ST"}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-medium truncate">
                {user?.name || t("student.sidebar.namePlaceholder")}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {user?.email || t("student.sidebar.emailPlaceholder")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar toggle button */}
      <button
        className="fixed top-5 left-5 z-50 md:hidden p-2 rounded-full bg-abugida-500 text-white"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <Menu size={20} />
      </button>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-auto h-[100vh]">
        <header className="flex justify-between items-start mb-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 py-4 sticky top-0 z-30">
          <h1 className="text-2xl font-bold pl-12 text-slate-900 dark:text-white">
            {getActiveTabTitle()}
          </h1>

          <div className="flex items-center space-x-3">
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
            <ThemeToggle />
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
            <button
              onClick={() => handleNavItemClick("settings")}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-200"
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "overview" && <OverviewTab courses={courses} progressMap={progressMap} loading={dataLoading} error={dataError} />}
            {activeTab === "courses" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <CoursesTab courses={courses} progressMap={progressMap} loading={dataLoading} error={dataError} />
              </motion.div>
            )}
            {activeTab === "messages" && <MessagesTab />}
            {activeTab === "instructors" && <InstructorsTab instructors={instructors} loading={dataLoading} error={dataError} />}
            {activeTab === "settings" && <PlatformSettings />}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
