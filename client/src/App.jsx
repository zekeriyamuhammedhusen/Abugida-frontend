import React, { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import StudentDashboard from "./pages/StudentDashboard";
import InstructorDashboard from "./pages/InstructorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PendingApproval from "./components/instructor/PendingApproval";
import UserDetails from "./pages/Userdetails";
import { Toaster } from "./components/ui/sonner";
import { toast } from "react-toastify";
import {
  connectSocket,
  listenForForceLogout,
  disconnectSocket,
} from "./socket";
import RequireAdmin from "./components/auth/RequireAdmin";
import ForgotPassword from "./pages/ForgotPassword";
import OTPVerification from "./pages/OTPVerification";
import OTPSend from "./pages/OTPSend";
import RegisterOTPSend from "./pages/RegisterOTPSend";
import VerifyOTP from "./pages/VerifyOTP";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import VerifyPayment from "./../src/components/Payment/VerifyPayment";
import GetCertified from "./components/course details/GetCertified";
import LessonPlayer from "./pages/LessonPlayer";
import TranslatorPage from "./pages/TranslatorPage";

const MainLayout = ({ children }) => (
  <>
    <Navbar />
    {children}
    <Footer />
  </>
);

const App = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Scroll to top on route load
    window.scroll(0, 0);

    // If we have a logged-in user, connect the socket and register
    if (user && user._id) {
      connectSocket(user._id);

      listenForForceLogout((data) => {
        toast.error(data.message || "You have been logged out");
        // logout flow handled by AuthContext; navigate to login
        if (data.reason === "blocked") {
          navigate("/login?blocked=true", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
        window.location.reload();
      });
    }

    return () => {
      disconnectSocket();
    };
  }, [navigate, user]);

  return (
    <>
      <Routes>
        {/* Public routes with layout */}
        <Route
          path="/"
          element={
            <MainLayout>
              <Index />
            </MainLayout>
          }
        />
        <Route
          path="/courses"
          element={
            <MainLayout>
              <Courses />
            </MainLayout>
          }
        />
        <Route
          path="/courses/:courseId"
          element={
            <MainLayout>
              <CourseDetails />
            </MainLayout>
          }
        />
        <Route
          path="/login"
          element={
            <MainLayout>
              <Login />
            </MainLayout>
          }
        />
        <Route
          path="/signup"
          element={
            <MainLayout>
              <Signup />
            </MainLayout>
          }
        />
        <Route
          path="/about"
          element={
            <MainLayout>
              <About />
            </MainLayout>
          }
        />
        <Route
          path="/contact"
          element={
            <MainLayout>
              <Contact />
            </MainLayout>
          }
        />

        <Route
          path="/translate"
          element={
            <MainLayout>
              <TranslatorPage />
            </MainLayout>
          }
        />

        {/* Authentication flow routes */}
        <Route
          path="/forgot-password"
          element={
            <MainLayout>
              <ForgotPassword />
            </MainLayout>
          }
        />
        <Route
          path="/verify-otp"
          element={
            <MainLayout>
              <OTPVerification />
            </MainLayout>
          }
        />
        <Route
          path="/send-otp"
          element={
            <MainLayout>
              <OTPSend />
            </MainLayout>
          }
        />
        <Route
          path="/get-certified/:courseId/:studentId"
          element={
            <MainLayout>
              <GetCertified />
            </MainLayout>
          }
        />
        <Route
          path="/courses/:courseId/complete"
          element={
            <MainLayout>
              <GetCertified />
            </MainLayout>
          }
        />

        {/* Registration-specific OTP routes */}
        <Route
          path="/signup/send-otp-Registration"
          element={
            <MainLayout>
              <RegisterOTPSend />
            </MainLayout>
          }
        />
        <Route
          path="/signup/verify-otp"
          element={
            <MainLayout>
              <VerifyOTP />
            </MainLayout>
          }
        />

        {/* Instructor approval */}
        <Route
          path="/pending-approval"
          element={
            <MainLayout>
              <PendingApproval />
            </MainLayout>
          }
        />

        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment/failed" element={<PaymentFailed />} />
        <Route path="/verify-payment/:tx_ref" element={<VerifyPayment />} />

        {/* Protected routes without layout */}
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/instructor-dashboard" element={<InstructorDashboard />} />
        <Route
          path="/admin-dashboard"
          element={
            <RequireAdmin>
              <AdminDashboard />
            </RequireAdmin>
          }
        />
        <Route path="/profile" element={<Profile />} />
        <Route path="/users/:userId" element={<UserDetails />} />
        <Route path="/learn/:courseId/lesson/:lessonId" element={<LessonPlayer />} />
      </Routes>

      <Toaster />
    </>
  );
};

export default App;
