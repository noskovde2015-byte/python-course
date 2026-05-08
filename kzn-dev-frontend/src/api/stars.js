// src/api/stars.js
import API from "./auth";

export const claimDaily = () => API.post("/stars");