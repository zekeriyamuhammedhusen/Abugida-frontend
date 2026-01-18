import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Linkedin, Github } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const Footer = () => {

  const { t } = useLanguage();

  const categories = [
    { key: "category.development", slug: "development" },
    { key: "category.business", slug: "business" },
    { key: "category.finance", slug: "finance" },
    { key: "category.design", slug: "design" },
    { key: "category.marketing", slug: "marketing" },
    { key: "category.photography", slug: "photography" },
    { key: "category.music", slug: "music" },
  ];
  return (
    <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link 
              to="/" 
              className="text-2xl font-display font-bold text-slate-900 dark:text-white flex items-center"
            >
              <span className="bg-abugida-500 text-white h-8 w-8 rounded-lg flex items-center justify-center mr-2 shadow-lg">A</span>
              Abugida
            </Link>
            <p className="mt-4 text-muted-foreground text-sm">
              {t("footer.description")}
            </p>
            <div className="mt-6 flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-abugida-500 transition-colors duration-200">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-abugida-500 transition-colors duration-200">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-abugida-500 transition-colors duration-200">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-abugida-500 transition-colors duration-200">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-abugida-500 transition-colors duration-200">
                <Github size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-base font-semibold mb-4">{t("footer.quickLinks")}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-abugida-500 transition-colors duration-200 text-sm">
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link to="/courses" className="text-muted-foreground hover:text-abugida-500 transition-colors duration-200 text-sm">
                  {t("nav.courses")}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-abugida-500 transition-colors duration-200 text-sm">
                  {t("nav.about")}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-abugida-500 transition-colors duration-200 text-sm">
                  {t("nav.contact")}
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
              <h4 className="font-medium text-lg mb-4">{t("footer.categories")}</h4>
              <ul className="space-y-2">
                {categories.map((item) => (
                  <li key={item.slug}>
                    <Link 
                      to={`/courses?category=${item.slug}`} 
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {t(item.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

          
          <div>
            <h3 className="text-base font-semibold mb-4">{t("footer.contactUs")}</h3>
            <address className="not-italic text-sm text-muted-foreground">
            <p>{t("footer.address1")}</p>
            <p>{t("footer.address2")}</p>
            <p className="mt-2">{t("footer.email")}</p>
            <p>{t("footer.phone")}</p>

            </address>
          </div>
        </div>
        
        <div className="border-t border-slate-200 dark:border-slate-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Abugida. {t("footer.rights")}
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-abugida-500 transition-colors duration-200">
              {t("footer.terms")}
            </Link>
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-abugida-500 transition-colors duration-200">
              {t("footer.privacy")}
            </Link>
            <Link to="/cookies" className="text-sm text-muted-foreground hover:text-abugida-500 transition-colors duration-200">
              {t("footer.cookies")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
