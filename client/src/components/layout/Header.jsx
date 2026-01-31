import { Bell, MessageSquare, Settings } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle";
import { useLanguage } from "@/context/LanguageContext";

const Header = ({
  activeTab,
  onNotificationsClick = () => {},
  onMessagesClick = () => {},
  onSettingsClick = () => {},
  notificationCount = 0,
  messageCount = 0,
}) => {
  const { t } = useLanguage();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      <div className="flex items-center">
        <h1 className="text-xl md:text-2xl font-bold pl-12 pt-3">
          {t(`instructor.sidebar.${activeTab}`) || t("instructor.sidebar.dashboard")}
        </h1>
      </div>
      <div className="flex items-center space-x-3">
        <div className="relative">
          <button
            type="button"
            aria-label="Open notifications"
            onClick={onNotificationsClick}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-200"
          >
            <Bell size={20} />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 min-h-[16px] min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">
                {notificationCount}
              </span>
            )}
 
          </button>
        </div>
        <div className="relative hidden sm:block">
          <button
            type="button"
            aria-label="Open messages"
            onClick={onMessagesClick}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-200"
          >
            <MessageSquare size={20} />
            {messageCount > 0 && (
              <span className="absolute -top-1 -right-1 min-h-[16px] min-w-[16px] px-1 rounded-full bg-fidel-500 text-white text-[10px] leading-4 text-center">
                {messageCount}
              </span>
            )}
          </button>
        </div>
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>
        <ThemeToggle />
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>
        <button
          type="button"
          aria-label="Open settings"
          onClick={onSettingsClick}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-200 hidden sm:block"
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  );
};

export default Header;