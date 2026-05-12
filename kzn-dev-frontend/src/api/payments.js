import API from "./auth";

export const getPackages = () => API.get("/payments/packages");
export const buyPackage = (packageId) => API.post(`/payments/buy/${packageId}`);
export const getMockCheckout = (paymentId) => API.get(`/payments/mock/${paymentId}`);
export const confirmPayment = (paymentId) => API.post(`/payments/${paymentId}/confirm`);
export const cancelPayment = (paymentId) => API.post(`/payments/${paymentId}/cancel`);
export const getPaymentHistory = () => API.get("/payments/history");