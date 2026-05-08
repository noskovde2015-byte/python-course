// src/api/payments.js
import API from "./auth";

export const getPackages = () => API.get("/payments/packages");
export const buyPackage = (id) => API.post(`/payments/buy/${id}`);
export const getPaymentHistory = () => API.get("/payments/history");