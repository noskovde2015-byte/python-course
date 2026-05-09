import API from "./auth";

export const getCourses = () => API.get("/course");
export const getCourseById = (id) => API.get(`/course/${id}`);
export const getCourseProgress = (id) => API.get(`/course/${id}/progress`);
export const createCourse = (data) => API.post("/course", data);
export const deleteCourse = (id) => API.delete(`/course/${id}`);

export const getModules = (courseId) => API.get(`/module/course/${courseId}`);
export const createModule = (courseId, data) => API.post(`/module/courses/${courseId}/modules`, data);
export const deleteModule = (id) => API.delete(`/module/${id}`);

export const getLessons = (moduleId) => API.get(`/lesson/module/${moduleId}`);
export const createLesson = (moduleId, data) => API.post(`/lesson/modules/${moduleId}/lessons`, data);
export const deleteLesson = (id) => API.delete(`/lesson/${id}`);