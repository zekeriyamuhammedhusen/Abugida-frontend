import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';

export const InstructorTab = ({ courseId, studentId }) => {
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [course, setCourse] = useState(null);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await api.get(`/api/courses/${courseId}`);
        setCourse(res.data);
      } catch (err) {
        console.error('Failed to fetch course:', err);
        setError('Could not load course data');
      }
    };

    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    const checkEnrollment = async () => {
      try {
        if (!studentId || !courseId) return;

        const response = await api.get('/api/enrollments/check', {
          params: { studentId, courseId },
        });

        setIsEnrolled(response.data?.isEnrolled || false);
      } catch (error) {
        console.error('Enrollment check failed:', error);
      }
    };

    checkEnrollment();
  }, [studentId, courseId]);

  const handleStartConversation = async () => {
    try {
      if (!course?.instructor?._id || !studentId || !courseId) return;

      const response = await api.post('/api/chat/conversations', {
        studentId,
        instructorId: course.instructor._id,
        courseId,
      });

      console.log('Conversation started:', response.data);
      navigate('/student-dashboard?tab=messages');
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const handleContactInstructor = () => {
    const params = new URLSearchParams({
      target: 'instructor',
      instructor: instructorName,
      email: instructorEmail || '',
      courseId,
    });
    navigate(`/contact?${params.toString()}`);
  };

  if (error) {
    return <div className="p-4 text-sm text-red-500">{error}</div>;
  }

  if (!course || !course.instructor) {
    return <div className="p-4 text-sm text-gray-500">Loading instructor info...</div>;
  }

  const instructor =
    typeof course.instructor === 'object' ? course.instructor : { name: course.instructor };

  const instructorName = instructor?.name || 'Unknown Instructor';
  const instructorEmail = instructor?.email || null;
  const instructorBio = instructor?.bio || 'Expert instructor with years of experience';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-7">
      <h3 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">About the Instructor</h3>
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <span className="text-xl font-semibold text-slate-700 dark:text-slate-200">
            {instructorName
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </span>
        </div>
        <div>
          <h4 className="font-semibold text-slate-900 dark:text-white">{instructorName}</h4>
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-1 leading-6">{instructorBio}</p>

          {isEnrolled && instructorEmail && (
            <>
              <button
                type="button"
                onClick={handleContactInstructor}
                className="inline-block mt-3 mr-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contact Instructor
              </button>
              <button
                onClick={handleStartConversation}
                className="inline-block mt-3 px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Start Chat
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-400"></div>
    </div>
  );
};
