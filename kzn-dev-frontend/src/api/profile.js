import API from "./auth";

export const getProfile = () => API.get("/profile/me");