import { useEffect } from "react";
import Hero from "@/components/home/Hero";
import PopularCourses from "@/components/home/PopularCourses";
import CallToAction from "@/components/home/CallToAction";
import Testimonials from "@/components/home/Testimonials";

const Index = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <Hero />
        <PopularCourses />
        <CallToAction />
        <Testimonials />
      </main>

    </div>
  );
};

export default Index;
