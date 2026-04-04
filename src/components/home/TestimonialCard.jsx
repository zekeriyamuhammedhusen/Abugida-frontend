// components/home/TestimonialCard.jsx
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

const TestimonialCard = ({ index }) => {
  const { t } = useLanguage();
  const testimonials = [
    {
      quote: t('home.testimonials.t1.quote'),
      name: "Abebe Z",
      role: t('home.testimonials.t1.role'),
    },
    {
      quote: t('home.testimonials.t2.quote'),
      name: "Kebede M",
      role: t('home.testimonials.t2.role'),
    },
    {
      quote: t('home.testimonials.t3.quote'),
      name: "Alemitu T",
      role: t('home.testimonials.t3.role'),
    },
  ];

  const { quote, name, role } = testimonials[index - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="glass-card p-6"
    >
      <div className="flex items-center mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star} className="text-amber-400 mr-1">
            ★
          </div>
        ))}
      </div>
      <p className="text-slate-600 dark:text-slate-300 mb-6 italic">{quote}</p>
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 mr-4"></div>
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white">
            {name}
          </h4>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </div>
    </motion.div>
  );
};

export default TestimonialCard;
