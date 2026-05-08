// src/api/courses.js
import API from "./auth";

export const getCourses = () => API.get("/course");
export const getCourseById = (id) => API.get(`/course/${id}`);
export const getCourseProgress = (id) => API.get(`/course/${id}/progress`);