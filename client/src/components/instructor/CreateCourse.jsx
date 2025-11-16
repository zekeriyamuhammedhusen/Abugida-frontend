import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateCourse = () => {
  const navigate = useNavigate();
  const [course, setCourse] = useState({
    title: '',
    description: '',
    category: '',
    level: 'Beginner',
    price: 0,
    prerequisites: '',
    technicalRequirements: '',
    modules: []
  });

  const [files, setFiles] = useState({
    thumbnail: null,       // FIXED → uses backend expected name
    lessonVideos: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCourse(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    setFiles(prev => ({ ...prev, [name]: selectedFiles }));
  };

  const addModule = () => {
    setCourse(prev => ({
      ...prev,
      modules: [...prev.modules, {
        title: '',
        description: '',
        lessons: []
      }]
    }));
  };

  const updateModule = (index, field, value) => {
    const updated = [...course.modules];
    updated[index][field] = value;
    setCourse(prev => ({ ...prev, modules: updated }));
  };

  const addLesson = (moduleIndex, type) => {
    const updated = [...course.modules];
    updated[moduleIndex].lessons.push({
      title: '',
      lessonType: type,
      description: '',
      duration: 0,
      ...(type === 'quiz' ? { quizQuestions: [] } : {})
    });
    setCourse(prev => ({ ...prev, modules: updated }));
  };

  const updateLesson = (m, l, field, value) => {
    const updated = [...course.modules];
    updated[m].lessons[l][field] = value;
    setCourse(prev => ({ ...prev, modules: updated }));
  };

  const addQuizQuestion = (m, l) => {
    const updated = [...course.modules];
    updated[m].lessons[l].quizQuestions.push({
      question: '',
      options: ['', '', ''],
      correctAnswer: 0
    });
    setCourse(prev => ({ ...prev, modules: updated }));
  };

  const updateQuizQuestion = (m, l, q, field, value) => {
    const updated = [...course.modules];

    if (field === 'options') {
      updated[m].lessons[l].quizQuestions[q].options[value.optionIndex] = value.value;
    } else {
      updated[m].lessons[l].quizQuestions[q][field] = value;
    }

    setCourse(prev => ({ ...prev, modules: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();

      // Course data
      formData.append('title', course.title);
      formData.append('description', course.description);
      formData.append('category', course.category);
      formData.append('level', course.level);
      formData.append('price', course.price);
      formData.append('prerequisites', course.prerequisites);
      formData.append('technicalRequirements', course.technicalRequirements);
      formData.append('modules', JSON.stringify(course.modules));

      // FIXED: Thumbnail upload
      if (files.thumbnail) {
        formData.append('thumbnail', files.thumbnail[0]);
      }

      // Lesson videos
      if (files.lessonVideos?.length > 0) {
        Array.from(files.lessonVideos).forEach(video =>
          formData.append('lessonVideo', video)
        );
      }
      const res = await axios.post(
        'http://localhost:5000/api/courses',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );


      navigate(`/courses/${res.data.course._id}`);
    } catch (err) {
      console.error('Course creation failed:', err);
      setError(err.response?.data?.message || 'Failed to create course');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Course</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Basic info */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Course Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="block text-sm font-medium">Title*</label>
              <input
                type="text"
                name="title"
                value={course.title}
                onChange={handleInputChange}
                required
                className="mt-1 w-full border rounded-md p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Category*</label>
              <input
                type="text"
                name="category"
                value={course.category}
                onChange={handleInputChange}
                required
                className="mt-1 w-full border rounded-md p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Level</label>
              <select
                name="level"
                value={course.level}
                onChange={handleInputChange}
                className="mt-1 w-full border rounded-md p-2"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Price ($)</label>
              <input
                type="number"
                name="price"
                value={course.price}
                onChange={handleInputChange}
                min="0"
                className="mt-1 w-full border rounded-md p-2"
              />
            </div>

          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium">Description*</label>
            <textarea
              name="description"
              value={course.description}
              onChange={handleInputChange}
              required
              className="mt-1 w-full border rounded-md p-2"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium">Thumbnail Image</label>
            <input
              type="file"
              name="thumbnail"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1 w-full"
            />
          </div>

        </div>

        {/* MODULES */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Modules</h2>
            <button
              type="button"
              onClick={addModule}
              className="px-4 py-1 bg-indigo-600 text-white rounded"
            >
              Add Module
            </button>
          </div>

          {course.modules.map((module, mIndex) => (
            <div key={mIndex} className="border-b pb-4 mb-4">

              <input
                type="text"
                placeholder="Module Title"
                value={module.title}
                onChange={(e) => updateModule(mIndex, 'title', e.target.value)}
                className="w-full mb-2 border rounded-md p-2"
              />

              <input
                type="text"
                placeholder="Description"
                value={module.description}
                onChange={(e) => updateModule(mIndex, 'description', e.target.value)}
                className="w-full mb-4 border rounded-md p-2"
              />

              <button
                type="button"
                onClick={() => addLesson(mIndex, 'video')}
                className="mr-2 px-3 py-1 bg-blue-600 text-white rounded"
              >
                Add Video Lesson
              </button>

              <button
                type="button"
                onClick={() => addLesson(mIndex, 'quiz')}
                className="px-3 py-1 bg-green-600 text-white rounded"
              >
                Add Quiz Lesson
              </button>

              {/* Lessons */}
              {module.lessons.map((lesson, lIndex) => (
                <div key={lIndex} className="mt-3 p-3 border rounded-md bg-gray-50">

                  <input
                    type="text"
                    placeholder="Lesson Title"
                    value={lesson.title}
                    onChange={(e) => updateLesson(mIndex, lIndex, 'title', e.target.value)}
                    className="w-full mb-2 border rounded-md p-2"
                  />

                  <textarea
                    placeholder="Description"
                    value={lesson.description}
                    onChange={(e) => updateLesson(mIndex, lIndex, 'description', e.target.value)}
                    className="w-full mb-2 border rounded-md p-2"
                  />

                  {lesson.lessonType === 'video' && (
                    <input
                      type="number"
                      placeholder="Duration (minutes)"
                      value={lesson.duration}
                      onChange={(e) => updateLesson(mIndex, lIndex, 'duration', parseInt(e.target.value))}
                      className="w-full mb-2 border rounded-md p-2"
                    />
                  )}

                  {lesson.lessonType === 'quiz' && (
                    <div>
                      <button
                        type="button"
                        onClick={() => addQuizQuestion(mIndex, lIndex)}
                        className="px-2 py-1 bg-purple-600 text-white rounded mb-2"
                      >
                        Add Question
                      </button>

                      {lesson.quizQuestions.map((q, qIndex) => (
                        <div key={qIndex} className="ml-3 p-2 border rounded bg-white mb-2">
                          <input
                            type="text"
                            placeholder="Question"
                            value={q.question}
                            onChange={(e) => updateQuizQuestion(mIndex, lIndex, qIndex, 'question', e.target.value)}
                            className="w-full mb-2 border rounded-md p-2"
                          />

                          {q.options.map((opt, optIndex) => (
                            <div key={optIndex} className="flex items-center mb-1">
                              <input
                                type="radio"
                                checked={q.correctAnswer === optIndex}
                                onChange={() => updateQuizQuestion(mIndex, lIndex, qIndex, 'correctAnswer', optIndex)}
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) =>
                                  updateQuizQuestion(mIndex, lIndex, qIndex, 'options', {
                                    optionIndex: optIndex,
                                    value: e.target.value
                                  })
                                }
                                className="ml-2 w-full border rounded-md p-1"
                              />
                            </div>
                          ))}
                        </div>
                      ))}

                    </div>
                  )}

                </div>
              ))}

            </div>
          ))}
        </div>

        {/* VIDEO UPLOADS */}
        {course.modules.some(m => m.lessons.some(l => l.lessonType === 'video')) && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Upload Lesson Videos</h2>
            <input
              type="file"
              name="lessonVideos"
              accept="video/*"
              multiple
              onChange={handleFileChange}
            />
            <p className="text-sm text-gray-500 mt-1">Upload one video for each video lesson.</p>
          </div>
        )}

        {/* SUBMIT */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Course'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default CreateCourse;
