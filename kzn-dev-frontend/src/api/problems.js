import API from "./auth";

export const getProblems = () => API.get("/problems");
export const getProblemsStats = () => API.get("/problems/stats");
export const getProblemById = (id) => API.get(`/problems/${id}`);
export const submitSolution = (id, code) => API.post(`/problems/${id}/submit`, { code });
export const getLeaderboard = () => API.get("/problems/leaderboard/list");
export const createProblem = (data) => API.post("/problems", data);
export const deleteProblem = (id) => API.delete(`/problems/${id}`);
export const buyHint = (hintId) => API.post(`/problems/hints/${hintId}/buy`);
export const createHint = (problemId, data) => API.post(
  `/problems/${problemId}/hints/${problemId}/buy`,
  null,
  { params: data }
);