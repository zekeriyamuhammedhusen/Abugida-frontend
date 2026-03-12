import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/context/LanguageContext";

function Contact() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubjectChange = (value) => {
    setFormData({
      ...formData,
      subject: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast.success(
        t("contact.subtitle")
      );
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
      setIsSubmitting(false);
    }, 1500);
  };
  const [openIndex, setOpenIndex] = useState(null);
  const toggle = (index) => setOpenIndex(openIndex === index ? null : index);

  const faqs = [
    {
      question: t("contact.faq.q1"),
      answer: t("contact.faq.a1"),
    },
    {
      question: t("contact.faq.q2"),
      answer: t("contact.faq.a2"),
    },
    {
      question: t("contact.faq.q3"),
      answer: t("contact.faq.a3"),
    },
    {
      question: t("contact.faq.q4"),
      answer: t("contact.faq.a4"),
    },
  ];
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      <div className="flex-1 pt-24 pb-12">
        {/* Hero section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-abugida-500 to-abugida-700 py-20 md:py-28">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-abugida-100 dark:bg-abugida-950/20 rounded-full blur-3xl opacity-60 dark:opacity-30 -z-10"></div>
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-slate-100 dark:bg-slate-800/20 rounded-full blur-3xl opacity-60 dark:opacity-30 -z-10"></div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                {t("contact.title")}
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
                {t("contact.subtitle")}
              </p>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
                  {t("contact.getInTouch")}
                </h2>
                <p className="text-muted-foreground mb-8">
                  {t("contact.getInTouchDesc")}
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-abugida-50 dark:bg-abugida-950/20 p-3 rounded-full">
                    <Mail className="h-6 w-6 text-abugida-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {t("contact.email")}
                    </h3>
                    <p className="text-muted-foreground">info@abugida.edu</p>
                    <p className="text-muted-foreground">
                      support@abugida.edu
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-abugida-50 dark:bg-abugida-950/20 p-3 rounded-full">
                    <Phone className="h-6 w-6 text-abugida-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {t("contact.phone")}
                    </h3>
                    <p className="text-muted-foreground">+251 11 234 5678</p>
                    <p className="text-muted-foreground">+251 91 234 5678</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-abugida-50 dark:bg-abugida-950/20 p-3 rounded-full">
                    <MapPin className="h-6 w-6 text-abugida-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {t("contact.location")}
                    </h3>
                    <p className="text-muted-foreground">
                      123 Education Street
                    </p>
                    <p className="text-muted-foreground">
                      Addis Ababa, Ethiopia
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-abugida-50 dark:bg-abugida-950/20 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-abugida-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {t("contact.hours")}
                    </h3>
                    <p className="text-muted-foreground">
                      {t("contact.hours.weekday")}
                    </p>
                    <p className="text-muted-foreground">
                      {t("contact.hours.sat")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  {t("contact.follow")}
                </h3>
                <div className="flex space-x-4">
                  {[
                    {
                      icon: <Facebook className="h-5 w-5" />,
                      name: "Facebook",
                      color: "bg-blue-600",
                      link: "https://www.facebook.com",
                    },
                    {
                      icon: <Twitter className="h-5 w-5" />,
                      name: "Twitter",
                      color: "bg-sky-500",
                      link: "https://www.twitter.com",
                    },
                    {
                      icon: <Instagram className="h-5 w-5" />,
                      name: "Instagram",
                      color: "bg-pink-600",
                      link: "https://www.instagram.com",
                    },
                    {
                      icon: <Linkedin className="h-5 w-5" />,
                      name: "LinkedIn",
                      color: "bg-blue-700",
                      link: "https://www.linkedin.com",
                    },
                  ].map((social, index) => (
                    <a
                      key={index}
                      href={social.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${social.color} text-white h-10 w-10 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity`}
                    >
                      <span className="sr-only">{social.name}</span>
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Contact form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-8"
            >
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                  {t("contact.form.title")}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
                    >
                        {t("contact.form.name")}
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                        placeholder={t("signup.placeholder.name")}
                      required
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
                    >
                      {t("contact.form.email")}
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t("signup.placeholder.email")}
                      required
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
                    >
                      {t("contact.form.subject")}
                    </label>
                    <Select
                      onValueChange={handleSubjectChange}
                      value={formData.subject}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("contact.form.subject")}/>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">{t("contact.form.subject.general")}</SelectItem>
                        <SelectItem value="courses">
                          {t("contact.form.subject.courses")}
                        </SelectItem>
                        <SelectItem value="technical">
                          {t("contact.form.subject.technical")}
                        </SelectItem>
                        <SelectItem value="billing">
                          {t("contact.form.subject.billing")}
                        </SelectItem>
                        <SelectItem value="partnership">
                          {t("contact.form.subject.partnership")}
                        </SelectItem>
                        <SelectItem value="other">{t("contact.form.subject.other")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1"
                    >
                      {t("contact.form.message")}
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder={t("contact.form.placeholder.message")}
                      rows={5}
                      required
                      className="w-full"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-abugida-500 hover:bg-abugida-600 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin mr-2" />
                      {t("contact.form.sending")}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {t("contact.form.send")}
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          </div>
        </div>

        {/* Map */}
        <div className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <div className="h-80 rounded-lg overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1275.1234567890123!2d38.76361111111111!3d9.030000000000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b8f1234567890%3A0xabcdef1234567890!2s123%20Education%20Street%2C%20Addis%20Ababa%2C%20Ethiopia!5e0!3m2!1sen!2sus!4v1699999999999!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>

        {/* FAQ Section */}

        {/* FAQ Section */}
        <div className="bg-slate-50 dark:bg-slate-800/30 py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                  {t("contact.faq.title")}
              </h2>
                <p className="text-muted-foreground max-w-3xl mx-auto">
                  {t("contact.getInTouchDesc")}
              </p>
            </motion.div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm"
                >
                  <Button
                    type="button"
                    className="w-full bg-abugida-500 hover:bg-abugida-600 text-white"
                    onClick={() => toggle(index)}
                  >
                    {faq.question}
                    <span className="ml-2 text-xl">
                      {openIndex === index ? "−" : "+"}
                    </span>
                  </Button>

                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="mt-2 text-muted-foreground text-sm">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Contact;
