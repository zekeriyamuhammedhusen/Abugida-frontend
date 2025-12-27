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
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      <h3 className="text-xl font-semibold mb-4">About the Instructor</h3>
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <span className="text-xl font-medium">
            {instructorName
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </span>
        </div>
        <div>
          <h4 className="font-semibold">{instructorName}</h4>
          <p className="text-muted-foreground text-sm mt-1">{instructorBio}</p>

          {isEnrolled && instructorEmail && (
            <>
              <a
                href={`mailto:${instructorEmail}`}
                className="inline-block mt-3 mr-3 px-4 py-2 bg-fidel-600 text-white text-sm rounded hover:bg-fidel-700 transition"
              >
                Contact Instructor
              </a>
              <button
                onClick={handleStartConversation}
                className="inline-block mt-3 px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
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
