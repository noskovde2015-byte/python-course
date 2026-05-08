import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8001/api",
  withCredentials: true,
});

// Убираем interceptor совсем — он вызывает бесконечный цикл
// Рефреш будем делать вручную только когда нужно

export const login = (data) => API.post("/login", data);
export const register = (data) => API.post("/register", data);
export const logout = () => API.post("/login/logout");
export const getMe = () => API.get("/users/me");

export default API;