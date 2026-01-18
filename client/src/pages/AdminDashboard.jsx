import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  BookOpen,
  Layers,
  Award,
  PieChart,
  Settings,
  Sliders,
  Shield,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ui/ThemeToggle";
import CourseModeration from "@/components/admin/CourseModeration";
import PlatformAnalytics from "@/components/admin/PlatformAnalytics";
import PaymentManagement from "@/components/admin/PaymentManagement";
import PlatformSettings from "../components/admin/PlatformSettings";
import UserManagement from "../components/admin/UserManagement";
import UserDetail from "../pages/Userdetails";
import Logo from "../components/layout/Logo";
import { useAuth } from "../context/AuthContext";
import CourseTable from "../components/instructor-dashboard/CourseTable";
import { useLanguage } from "@/context/LanguageContext";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { t } = useLanguage();

  const navItems = [
    { id: "overview", label: t("admin.nav.overview"), icon: Layers },
    { id: "users", label: t("admin.nav.users"), icon: Users },
    { id: "courses", label: t("admin.nav.courses"), icon: BookOpen },
    { id: "analytics", label: t("admin.nav.analytics"), icon: PieChart },
    { id: "payments", label: t("admin.nav.payments"), icon: Award },
    { id: "settings", label: t("admin.nav.settings"), icon: Settings },
  ];

  const handleNavItemClick = (id) => {
    if (id !== "users") {
      setSelectedUserId(null);
    }
    setActiveTab(id);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleViewUser = (userId) => {
    setSelectedUserId(userId);
    setActiveTab("user-detail");
  };

  const handleBackToUsers = () => {
    setSelectedUserId(null);
    setActiveTab("users");
  };

  const { user } = useAuth();

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

        <div className="absolute bottom-5 left-5">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-xs font-medium">
              {user?.name ? user.name[0].toUpperCase() : "A"}
            </div>
            <div>
              <div className="text-sm font-medium">
                {user?.name || "Admin User"}
              </div>
              <div className="text-xs text-muted-foreground">
                {user?.email || "admin@abugida.com"}
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
        <Layers size={20} />
      </button>

      {/* Main content */}
      <div className="flex-1 flex flex-col p-5 overflow-auto h-[100vh]">
        <header className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold pl-10">
            {activeTab === "user-detail" ? t("admin.header.userDetails") : t("admin.header.dashboard")}
          </h1>
          <div className="flex items-center space-x-3">
            <ThemeToggle />
          </div>
        </header>

        {activeTab === "user-detail" && (
          <div className="mb-4 pl-10">
            <Button variant="ghost" onClick={handleBackToUsers}>
              <ChevronLeft size={16} className="mr-2" />
              {t("admin.backToUsers")}
            </Button>
          </div>
        )}

        {/* Page content based on active tab */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-lg bg-abugida-50 dark:bg-slate-800">
                  <Shield
                    size={24}
                    className="text-abugida-500 dark:text-abugida-400"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    {t("admin.overview.welcome")}
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    {t("admin.overview.subtitle")}
                  </p>
                </div>
              </div>
            </div>
            <PlatformAnalytics />
          </motion.div>
        )}

        {activeTab === "users" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <UserManagement onViewUser={handleViewUser} />
          </motion.div>
        )}

        {activeTab === "user-detail" && selectedUserId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <UserDetail
              userId={selectedUserId}
              onBack={handleBackToUsers}
              embedded={true}
            />
          </motion.div>
        )}

        {activeTab === "courses" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <CourseTable
              courses={[]} // Replace with actual course data
              showActions={true}
              onEdit={(id) => console.log("Edit course", id)}
              onDelete={(id) => console.log("Delete course", id)}
            />
          </motion.div>
        )}

        {activeTab === "analytics" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <PlatformAnalytics />
          </motion.div>
        )}

        {activeTab === "payments" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <PaymentManagement />
          </motion.div>
        )}

        {activeTab === "settings" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <PlatformSettings />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
