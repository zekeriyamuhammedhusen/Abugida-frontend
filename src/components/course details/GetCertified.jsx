import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Award, Download, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from '@/lib/api';
import { useAuth } from "@/context/AuthContext";

const GetCertified = () => {
  const { studentId, courseId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const effectiveStudentId = studentId || user?._id;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
          if (!courseId) {
            throw new Error("Missing course identifier");
          }
          if (!effectiveStudentId) {
            // Wait for auth to resolve if studentId is not in route
            return;
          }
          const [courseRes, progressRes] = await Promise.all([
            api.get(`/api/courses/${courseId}`),
            api.get(`/api/progress/${effectiveStudentId}/${courseId}`),
          ]);

          const courseData = courseRes.data;
          const progressData = progressRes.data;

        setCourse(courseData);
        setProgress(progressData);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Unable to load certification details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, effectiveStudentId, courseId]);

  const isCompleted = progress?.progressPercentage === 100;
  const progressValue = progress?.progressPercentage || 0;
  const completedLessons = Array.isArray(progress?.completedLessons)
    ? progress.completedLessons.length
    : 0;
  const totalLessons = progress?.totalLessons || 0;
  const lessonsRemaining = Math.max(totalLessons - completedLessons, 0);

  const handleDownload = async () => {
    try {
      if (!effectiveStudentId) {
        throw new Error("No student ID available");
      }
      const res = await api.get(`/api/certificates/generate-certificate/${effectiveStudentId}/${courseId}`, { responseType: 'blob' });
      // If backend returns PDF directly, responseType 'blob' will contain it
      if (res && res.data) {
        const contentType = res.headers['content-type'] || '';
        if (contentType.includes('application/pdf')) {
          const blob = new Blob([res.data], { type: contentType });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `certificate-${studentId}-${courseId}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          return;
        }
      }
      // Fallback: ask backend for certificate URL JSON
      const infoRes = await api.get(`/api/certificates/generate-certificate/${effectiveStudentId}/${courseId}`);
      const data = infoRes.data;
      if (data.certificateUrl) {
        const fileRes = await api.get(data.certificateUrl, { responseType: 'blob' });
        const fileBlob = new Blob([fileRes.data]);
        const blobUrl = window.URL.createObjectURL(fileBlob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = data.certificateUrl.split('/').pop() || 'certificate.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
      } else {
        throw new Error('No certificate URL provided');
      }
    } catch (err) {
      console.error("Download failed:", err);
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 mt-10 mb-10">
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-gradient-to-r from-slate-100 to-slate-200 rounded-t-2xl"></div>
          <div className="bg-white border border-slate-200 rounded-b-2xl shadow-lg p-6 sm:p-8 space-y-6">
            <div className="h-6 w-3/4 bg-slate-100 rounded"></div>
            <div className="h-2 w-full bg-slate-100 rounded-full"></div>
            <div className="h-24 bg-slate-50 rounded-xl"></div>
            <div className="h-12 w-full bg-slate-100 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6 mt-10 mb-10">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600">{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 mt-14 mb-14">

      {/* Certificate Header */}
      <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-br from-fidel-700 to-fidel-900 p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')]"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl shadow-sm">
              <Award size={28} className="text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Course Certification</h1>
          </div>
          <p className="text-fidel-100 max-w-lg text-sm sm:text-base">
            {isCompleted
              ? "Congratulations! Your certificate is ready to download."
              : "Complete all lessons to unlock your certificate."}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white border border-slate-200 rounded-b-2xl shadow-lg overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-2">
              {course?.title || "Course Title"}
            </h2>
            <div className="flex items-center justify-between text-sm sm:text-base">
              <span className="text-slate-600">
                {completedLessons} of {totalLessons} lessons
              </span>
              <span className="font-medium text-fidel-600">{progressValue}%</span>
            </div>
            <div className="mt-3 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-fidel-500 to-fidel-600 transition-all duration-700 ease-out"
                style={{ width: `${progressValue}%` }}
              ></div>
            </div>
          </div>

          {/* Status */}
          <div
            className={`rounded-xl p-5 sm:p-6 mb-8 ${
              isCompleted ? "bg-emerald-50 border border-emerald-200" : "bg-amber-50 border border-amber-200"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-lg ${
                  isCompleted ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                }`}
              >
                {isCompleted ? <Award size={20} /> : <Clock size={20} />}
              </div>
              <div>
                <h3 className="font-medium text-slate-800 mb-1 text-sm sm:text-base">
                  {isCompleted ? "Certificate Ready!" : "Keep Going!"}
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm">
                  {isCompleted
                    ? "You've earned your certificate of completion."
                    : `Complete ${lessonsRemaining} more lesson${lessonsRemaining === 1 ? "" : "s"} to get certified.`}
                </p>
              </div>
            </div>
          </div>

          {/* Button */}
          {isCompleted ? (
            <Button
              className="w-full py-6 rounded-xl bg-gradient-to-r from-fidel-600 to-fidel-700 hover:from-fidel-700 hover:to-fidel-800"
              onClick={handleDownload}
            >
              <Download className="mr-2 h-5 w-5" />
              Download Certificate
            </Button>
          ) : (
            <div className="text-center py-4 text-slate-500 text-sm sm:text-base">
              Complete the course to unlock this feature
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GetCertified;
