import API from "./auth";

export const getTasks = (lessonId) => API.get(`/task/lesson/${lessonId}`);
export const createTask = (lessonId, data) => API.post(`/task/lessons/${lessonId}/tasks`, data);
export const deleteTask = (id) => API.delete(`/task/${id}`);
export const submitTask = (taskId, answer) => API.post(`/task/tasks/${taskId}/submit`, { answer });