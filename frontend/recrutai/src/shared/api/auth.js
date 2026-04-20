import { request, apiClient } from "../http/client";

export const registerRecruiter = (data) =>
  request({ method: "POST", url: "/users/register/recruiter/", data });

export const registerJobSeeker = (data) =>
  request({
    method: "POST",
    url: "/users/register/jobseeker/",
    data,
    headers: { "Content-Type": "multipart/form-data" },
  });

export const loginUser = (data) =>
  request({ method: "POST", url: "/users/login/", data });

export const fetchCurrentUser = () =>
  request({ method: "GET", url: "/users/me/" });

export const logoutUser = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (refreshToken) {
    try {
      await request({ method: "POST", url: "/users/logout/", data: { refresh: refreshToken } });
    } catch {
      // blacklist call failed — still clear local tokens
    }
  }
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

export const refreshToken = (refresh) =>
  apiClient.post("/users/token/refresh/", { refresh }).then((r) => r.data);
