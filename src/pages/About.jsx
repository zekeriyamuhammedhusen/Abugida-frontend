import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GraduationCap, BookOpen, Users, Globe, Award } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

function About() {
  const { t } = useLanguage();

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
                {t("about.title")}
              </h1>
              <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
                {t("about.subtitle")}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Mission and vision */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                {t("about.missionTitle")}
              </h2>
              <p className="text-muted-foreground">
                {t("about.missionP1")}
              </p>
              <p className="text-muted-foreground">
                {t("about.missionP2")}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                {t("about.visionTitle")}
              </h2>
              <p className="text-muted-foreground">
                {t("about.visionP1")}
              </p>
              <p className="text-muted-foreground">
                {t("about.visionP2")}
              </p>
            </motion.div>
          </div>
        </div>

        {/* Our values */}
        <div className="bg-slate-50 dark:bg-slate-800/30 py-16 md:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                {t("about.valuesTitle")}
              </h2>
              <p className="text-muted-foreground max-w-3xl mx-auto">
                {t("about.valuesSubtitle")}
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: <GraduationCap className="h-10 w-10 text-abugida-500" />,
                  title: t("about.value.excellence.title"),
                  description: t("about.value.excellence.desc"),
                },
                {
                  icon: <BookOpen className="h-10 w-10 text-abugida-500" />,
                  title: t("about.value.accessibility.title"),
                  description: t("about.value.accessibility.desc"),
                },
                {
                  icon: <Users className="h-10 w-10 text-abugida-500" />,
                  title: t("about.value.community.title"),
                  description: t("about.value.community.desc"),
                },
                {
                  icon: <Globe className="h-10 w-10 text-abugida-500" />,
                  title: t("about.value.innovation.title"),
                  description: t("about.value.innovation.desc"),
                },
              ].map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
                  viewport={{ once: true }}
                  className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center"
                >
                  <div className="mb-4">{value.icon}</div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Team section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              {t("about.teamTitle")}
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              {t("about.teamSubtitle")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Abebe Bekele",
                role: "Founder & CEO",
                bio: "Abebe has over 15 years of experience in education and technology, with a passion for expanding educational access across Ethiopia.",
                avatar: "AB",
              },
              {
                name: "Tigist Haile",
                role: "Chief Academic Officer",
                bio: "Tigist brings her extensive background in curriculum development to ensure our courses meet the highest academic standards.",
                avatar: "TH",
              },
              {
                name: "Solomon Tadesse",
                role: "CTO",
                bio: "Solomon leads our technical team, implementing innovative solutions that make learning accessible and engaging for all users.",
                avatar: "ST",
              },
              {
                name: "Liya Abera",
                role: "Head of Student Success",
                bio: "Liya works to ensure that every student receives the support they need to achieve their educational goals.",
                avatar: "LA",
              },
              {
                name: "Dawit Melaku",
                role: "Content Director",
                bio: "Dawit collaborates with top instructors to create courses that are both rigorous and relevant to the Ethiopian context.",
                avatar: "DM",
              },
              {
                name: "Hirut Bekele",
                role: "Community Manager",
                bio: "Hirut builds and nurtures our learning community, facilitating connections between students and instructors.",
                avatar: "HB",
              },
            ].map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * (index + 1) }}
                viewport={{ once: true }}
                className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="h-20 w-20 rounded-full bg-abugida-100 dark:bg-abugida-900 text-abugida-500 flex items-center justify-center text-xl font-bold mb-4">
                    {member.avatar}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
                    {member.name}
                  </h3>
                  <p className="text-abugida-500 font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-muted-foreground">{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Call to action */}
        <div className="bg-abugida-500 dark:bg-abugida-600 text-white py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-3xl font-bold mb-6">
                {t("about.ctaTitle")}
              </h2>
              <p className="text-lg mb-8 max-w-3xl mx-auto">
                {t("about.ctaDesc")}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  to="/courses"
                  className="bg-white text-abugida-500 hover:bg-slate-100 px-6 py-3 rounded-md font-medium transition-colors"
                >
                  {t("about.ctaExplore")}
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default About;
