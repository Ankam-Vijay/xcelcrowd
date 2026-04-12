import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Automatically attach token to every request
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Auth
export const register = (data) => API.post("/auth/register", data);
export const login = (data) => API.post("/auth/login", data);

// Jobs
export const getAllJobs = () => API.get("/jobs");
export const createJob = (data) => API.post("/jobs", data);
export const getCompanyJobs = () => API.get("/jobs/company/myjobs");
export const getJobById = (id) => API.get(`/jobs/${id}`);
export const closeJob = (id) => API.patch(`/jobs/${id}/close`);

// Applications
export const applyForJob = (jobId) => API.post(`/applications/${jobId}/apply`);
export const getMyStatus = (jobId) => API.get(`/applications/${jobId}/mystatus`);
export const acknowledge = (jobId) => API.post(`/applications/${jobId}/acknowledge`);
export const withdraw = (jobId) => API.post(`/applications/${jobId}/withdraw`);
export const rejectApplicant = (applicationId) => API.post(`/applications/${applicationId}/reject`);
export const hireApplicant = (applicationId) => API.post(`/applications/${applicationId}/hire`);