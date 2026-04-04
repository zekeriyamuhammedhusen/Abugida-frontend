
import TestimonialCard from "./TestimonialCard";
import { useLanguage } from "@/context/LanguageContext";

const Testimonials = () => {
  const { t } = useLanguage();
  return (
    <section className="py-20 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="text-center mb-16">
          <div className="inline-block bg-fidel-50 dark:bg-fidel-900/30 rounded-full px-4 py-1.5 mb-6">
            <span className="text-fidel-600 dark:text-fidel-400 text-sm font-medium">
              {t('home.testimonials.badge')}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
            {t('home.testimonials.title')}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('home.testimonials.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <TestimonialCard key={i} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
