import React from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import VideoPlayer from "@/components/video-player";
import { Loader2 } from "lucide-react";

const LessonPlayer = () => {
  const { courseId, lessonId } = useParams();
  const [lesson, setLesson] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [videoGroupOpen, setVideoGroupOpen] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [previewData, setPreviewData] = React.useState(null);

  const openPreview = async (lesson) => {
    try {
      setPreviewOpen(true);
      setPreviewLoading(true);
      // Fetch full lesson to get reliable playbackCandidates for fallback
      let res = await api.get(`/api/lessons/${lesson._id}?t=${Date.now()}`);
      const payload = res.data?.lesson ? res.data : { lesson: res.data };
      setPreviewData(payload.lesson);
    } catch (e) {
      setPreviewData({ error: e?.response?.data?.message || "Failed to load preview" });
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewData(null);
  };

  React.useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      try {
        let res = await api.get(`/api/lessons/${lessonId}`);

        // If server responds with 304 (Not Modified) some axios setups return without body.
        // In that case force a cache-busting refetch to ensure we get the latest lesson payload.
        if (res.status === 304) {
          res = await api.get(`/api/lessons/${lessonId}?t=${Date.now()}`);
        }

        const data = res.data?.lesson ? res.data : res.data;
        setLesson(data);
      } catch (err) {
        const msg = err?.response?.data?.message || err?.response?.data?.error || "Failed to load lesson";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [lessonId]);

  if (loading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="animate-spin" /></div>;
  }
  if (error) {
    return <div className="text-center text-red-500 p-8">{error}</div>;
  }
  // Normalize shape: if wrapper present, use wrapper.lesson
  const payload = lesson?.lesson ? lesson : { lesson: lesson };
  const lessonObj = payload.lesson || null;
  const module = payload.module || null;
  const progress = payload.progress || null;

  // Render player (if any), content, module materials and progress
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">{lessonObj?.title || 'Lesson'}</h2>

      {lessonObj && lessonObj.video && lessonObj.video.url && (
        <div className="mb-6">
          <VideoPlayer
            url={lessonObj.video.url}
            candidates={lessonObj.video.playbackCandidates}
            publicId={lessonObj.video.publicId}
            thumbnailPublicId={lessonObj.video.thumbnailPublicId}
            lessonId={lessonId}
            courseId={courseId}
          />
        </div>
      )}

      {lessonObj?.content ? (
        <div className="prose mb-6" dangerouslySetInnerHTML={{ __html: lessonObj.content }} />
      ) : (
        <div className="mb-6 text-gray-600">No written content provided for this lesson.</div>
      )}

      {module && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Module Materials</h3>

          {/* Group video lessons under a single clickable heading */}
          {Array.isArray(module.lessons) && module.lessons.length > 0 ? (
            (() => {
              const videoLessons = module.lessons.filter(l => l.type === 'video');
              const otherLessons = module.lessons.filter(l => l.type !== 'video');

              return (
                <div>
                  {videoLessons.length > 0 && (
                    <div className="mb-3">
                      <button
                        onClick={() => setVideoGroupOpen(v => !v)}
                        className="text-left font-medium text-blue-600 hover:underline"
                        aria-expanded={videoGroupOpen}
                      >
                        Video Lessons ({videoLessons.length})
                      </button>
                      {videoGroupOpen && (
                        <ul className="list-disc list-inside mt-2 ml-4">
                          {videoLessons.map(l => (
                            <li key={l._id} className="py-1">
                              <button
                                onClick={() => openPreview(l)}
                                className="text-blue-600 hover:underline"
                              >
                                {l.title}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {otherLessons.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Other Materials</h4>
                      <ul className="list-disc list-inside">
                        {otherLessons.map(l => (
                          <li key={l._id} className="py-1">
                            <Link to={`/learn/${courseId}/lesson/${l._id}`} className="text-blue-600 hover:underline">{l.title}</Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="text-gray-600">No other materials in this module.</div>
          )}
        </div>
      )}

      {progress ? (
        <div className="p-4 bg-gray-50 border rounded">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">Progress</div>
              <div className="text-lg font-medium">{progress.progressPercentage}% complete</div>
              <div className="text-sm text-gray-600">{(progress.completedLessons || []).length} of {progress.totalLessons} lessons completed</div>
            </div>
            <div className="w-40 h-4 bg-gray-200 rounded overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${progress.progressPercentage}%` }} />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">No progress data yet.</div>
      )}

      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b">
              <h4 className="font-semibold">Preview</h4>
              <button onClick={closePreview} className="text-gray-600 hover:text-black">Close</button>
            </div>
            <div className="p-4">
              {previewLoading ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin" /></div>
              ) : previewData && previewData.video && (
                previewData.video.url || previewData.video.playbackCandidates || previewData.video.publicId
              ) ? (
                <VideoPlayer
                  key={previewData._id || previewData.video.url || previewData.video.publicId}
                  url={previewData.video.url}
                  publicId={previewData.video.publicId}
                  thumbnailPublicId={previewData.video.thumbnailPublicId}
                  lessonId={previewData._id}
                  courseId={courseId}
                  candidates={previewData.video.playbackCandidates}
                  previewMode={true}
                  previewSeconds={60}
                />
              ) : (
                <div className="text-center text-gray-600">No video available for this lesson.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonPlayer;
