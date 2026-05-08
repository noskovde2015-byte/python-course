import API from "./auth";

export const getProblems = () => API.get("/problems");
export const getProblemById = (id) => API.get(`/problems/${id}`);
export const submitSolution = (id, code) => API.post(`/problems/${id}/submit`, { code });
export const getLeaderboard = () => API.get("/problems/");