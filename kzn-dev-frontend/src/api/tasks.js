import API from "./auth";

export const getTasks = (lessonId) => API.get(`/task/lesson/${lessonId}`);
export const getLessonProgress = (lessonId) => API.get(`/task/lesson/${lessonId}/progress`);
export const createTask = (lessonId, data) => API.post(`/task/lessons/${lessonId}/tasks`, data);
export const deleteTask = (id) => API.delete(`/task/${id}`);
export const submitTask = (taskId, answer) => API.post(`/task/tasks/${taskId}/submit`, { answer });

export const getComments = (taskId) => API.get(`/comments/${taskId}`);
export const addComment = (taskId, text) => API.post(`/comments/${taskId}`, { text });