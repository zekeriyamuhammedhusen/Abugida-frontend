import { useAuth } from "../../context/AuthContext"; // Assuming you have a context for user authentication
import { useLanguage } from "../../context/LanguageContext";
import ukFlag from "../../assets/flags/uk.png";
import ethFlag from "../../assets/flags/eth.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import cn from "classnames"; // Utility for conditional class names
import { Grid, LogOut, Menu, X } from "react-feather"; // Corrected to use Grid for Dashboard icon
import { Button } from "../ui/button"; // Assuming Button component is available
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu"; // Assuming DropdownMenu component is available
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ThemeToggle from "../ui/ThemeToggle";
const Navbar = () => {
  const { user, logout, loading } = useAuth();  // Get user state from AuthContext
  const { language, setLanguage, t } = useLanguage();
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Sample navigation links
  const navLinks = [
    { name: t("nav.home"), href: "/" },
    { name: t("nav.courses"), href: "/courses" },
    { name: t("nav.about"), href: "/about" },
    { name: t("nav.contact"), href: "/contact" },
  ];

  const languageOptions = [
    { code: "en", label: t("english"), flag: ukFlag },
    { code: "am", label: t("amharic"), flag: ethFlag },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const getDashboardLink = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "student": return "/student-dashboard";
      case "instructor": return "/instructor-dashboard";
      case "admin": return "/admin-dashboard";
      default: return "/dashboard";
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");  // Redirect to home after logging out
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 px-6 md:px-8 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 px-6 md:px-8 transition-all duration-300 ease-in-out",
        isScrolled || location.pathname !== "/"
          ? "py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg shadow-sm"
          : "py-5 bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="text-2xl font-display font-bold text-abugida-900 dark:text-white flex items-center"
        >
          <span className="bg-abugida-500 text-white h-8 w-8 rounded-lg flex items-center justify-center mr-2 shadow-lg">
            A
          </span>
          Abugida
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                location.pathname === link.href
                  ? "text-fidel-600 bg-fidel-50 dark:bg-fidel-950/30"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              )}
            >
              {link.name}
            </Link>
          ))}
          
          {/* Show Dashboard link when logged in */}
          {user && (
            <Link
              to={getDashboardLink()}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center",
                location.pathname.startsWith("/dashboard")
                  ? "text-fidel-600 bg-fidel-50 dark:bg-fidel-950/30"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              )}
            >
              <Grid className="w-4 h-4 mr-2" /> {/* Changed to Grid */}
              {t("nav.dashboard")}
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center space-x-4">
          <ThemeToggle />

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLanguageMenuOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-2 rounded-md border dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
              aria-haspopup="listbox"
              aria-expanded={languageMenuOpen}
            >
              {(() => {
                const current = languageOptions.find((o) => o.code === language) || languageOptions[0];
                return (
                  <>
                    <img src={current.flag} alt="flag" className="w-4 h-4 object-contain" />
                    <span>{current.label}</span>
                  </>
                );
              })()}
            </button>
            {languageMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-md border dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg z-50">
                <ul role="listbox" className="py-1">
                  {languageOptions.map((opt) => (
                    <li key={opt.code}>
                      <button
                        onClick={() => {
                          setLanguage(opt.code);
                          setLanguageMenuOpen(false);
                        }}
                        className={cn(
                          "w-full px-3 py-2 flex items-center gap-2 text-sm text-left",
                          language === opt.code
                            ? "bg-slate-100 dark:bg-slate-800 font-medium"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                        role="option"
                        aria-selected={language === opt.code}
                      >
                        <img src={opt.flag} alt="flag" className="w-4 h-4 object-contain" />
                        <span>{opt.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {user ? (
            <div className="flex items-center space-x-4">
              {/* Display username */}
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {user.name}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                    size="icon"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-fidel-100 text-fidel-700 dark:bg-fidel-900 dark:text-fidel-300">
                        {user.name ? user.name[0].toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name || user.email}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.role}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      to={getDashboardLink()}
                      className="cursor-pointer w-full flex items-center"
                    >
                      <Grid className="mr-2 h-4 w-4" /> {/* Changed to Grid */}
                      <span>{t("nav.dashboard")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-500 focus:text-red-500"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t("nav.logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  {t("nav.login")}
                </Button>
              </Link>
              <Link to="/signup">
                <Button
                  className="bg-abugida-500 hover:bg-abugida-600 text-white shadow-sm hover:shadow-md transition-all duration-200"
                  size="sm"
                >
                  {t("nav.signup")}
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
{mobileMenuOpen && (
  <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg shadow-lg border-t border-gray-200 dark:border-slate-800 animate-fade-in">
    <div className="p-4 space-y-4">
      <nav className="flex flex-col space-y-2">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            to={link.href}
            onClick={() => setMobileMenuOpen(false)} // Close menu when clicked
            className={cn(
              "px-3 py-2 rounded-md text-base font-medium transition-colors duration-200",
              location.pathname === link.href
                ? "text-fidel-500 bg-fidel-50 dark:bg-fidel-950/30"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            {link.name}
          </Link>
        ))}

        {/* Show Dashboard link in mobile when logged in */}
        {user && (
          <Link
            to={getDashboardLink()}
            onClick={() => setMobileMenuOpen(false)} // Close menu when clicked
            className={cn(
              "px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 flex items-center",
              location.pathname.startsWith("/dashboard")
                ? "text-fidel-500 bg-fidel-50 dark:bg-fidel-950/30"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            <Grid className="w-4 h-4 mr-2" />
            {t("nav.dashboard")}
          </Link>
        )}
      </nav>

      {/* Mobile Language Switcher */}
      <div className="mt-2">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {t("language")}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {languageOptions.map((opt) => (
            <button
              key={opt.code}
              onClick={() => { setLanguage(opt.code); setMobileMenuOpen(false); }}
              className={cn(
                "px-3 py-2 rounded-md text-sm border dark:border-slate-700 flex items-center justify-center gap-2",
                language === opt.code ? "bg-slate-100 dark:bg-slate-800" : "bg-transparent"
              )}
              aria-label={`Switch to ${opt.label}`}
            >
              <img src={opt.flag} alt="flag" className="w-4 h-4 object-contain" />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Logout Button */}
      {user ? (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-red-500 focus:text-red-500"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("nav.logout")}
        </Button>
      ) : (
        <>
    <div className="grid grid-cols-2 gap-4 w-full">
  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
    <Button
      className="w-full px-4 py-2 bg-fidel-500 hover:bg-fidel-600 text-white shadow-sm hover:shadow-md transition-all duration-200 rounded-md"
      size="sm"
    >
      {t("nav.login")}
    </Button>
  </Link>
  <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
    <Button
      className="w-full px-4 py-2 bg-fidel-500 hover:bg-fidel-600 text-white shadow-sm hover:shadow-md transition-all duration-200 rounded-md"
      size="sm"
    >
      {t("nav.signup")}
    </Button>
  </Link>
</div>

      </>
      
      )}
    </div>
  </div>
)}

    </header>
  );
};

export default Navbar;
