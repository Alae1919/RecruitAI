import axios from "axios";

const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const api = axios.create({ baseURL: API_BASE_URL });

// Attach access token to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Transparent token refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(error);
      }
      try {
        const { data } = await axios.post(`${API_BASE_URL}/users/token/refresh/`, {
          refresh: refreshToken,
        });
        localStorage.setItem("accessToken", data.access);
        if (data.refresh) localStorage.setItem("refreshToken", data.refresh);
        processQueue(null, data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const registerRecruiter = async (data) => {
  try {
    const response = await api.post(`/users/register/recruiter/`, data, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

export const registerJobSeeker = async (data) => {
  try {
    const response = await api.post(`/users/register/jobseeker/`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

export const loginUser = async (data) => {
  try {
    const response = await api.post(`/users/login/`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const fetchCurrentUser = async () => {
  const response = await api.get(`/users/me/`);
  return response.data;
};

export const logoutUser = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (refreshToken) {
    try {
      await api.post(`/users/logout/`, { refresh: refreshToken });
    } catch {
      // blacklist call failed — still clear local tokens
    }
  }
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

export const createJobOffer = async (data) => {
  try {
    const response = await api.post(`/job_offers/create`, data, {
      headers: { "Content-Type": "application/json" },
    });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

export const fetchJobOffers = async () => {
  try {
    const response = await api.get(`/job_offers/list`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

export const editJobOffer = async (offerId, updatedData) => {
  try {
    const response = await api.put(`/job_offers/${offerId}/edit/`, updatedData);
    return response.data;
  } catch (error) {
    console.error("Error editing job offer:", error.response || error);
    throw error.response?.data || error.message;
  }
};

export const deleteJobOffer = async (offerId) => {
  try {
    const response = await api.delete(`/job_offers/${offerId}/delete/`);
    return response.data;
  } catch (error) {
    console.error("Error deleting job offer:", error.response || error);
    throw error.response?.data || error.message;
  }
};

export const getRecruiterProfile = async () => {
  try {
    const response = await api.get(`/users/profile/recruiter/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching recruiter profile:", error.response || error);
    throw error.response?.data || error.message;
  }
};

export const updateRecruiterProfile = async (updatedData) => {
  try {
    const response = await api.put(`/users/update/recruiter/`, updatedData);
    return response.data;
  } catch (error) {
    console.error("Error updating recruiter profile:", error.response || error);
    throw error.response?.data || error.message;
  }
};

export const getJobSeekerProfile = async () => {
  try {
    const response = await api.get(`/users/profile/jobseeker/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching job seeker profile:", error.response || error);
    throw error.response?.data || error.message;
  }
};

export const updateJobSeekerProfile = async (profileData) => {
  const formData = new FormData();
  formData.append("full_name", profileData.fullName);
  formData.append("email", profileData.email);
  formData.append("personal_phone", profileData.phone);
  formData.append("address", profileData.address);
  formData.append("experience", profileData.experience);
  formData.append("skills", profileData.skills);
  if (profileData.resume instanceof File) {
    formData.append("resume", profileData.resume);
  }
  try {
    const response = await api.put(`/users/update/jobseeker/`, formData);
    return response.data;
  } catch (error) {
    console.error("Error updating job seeker profile:", error.response || error);
    throw error.response?.data || error.message;
  }
};

export const getJobSeekerApplications = async () => {
  try {
    const response = await api.get(`/applications/retreiveApplications`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des candidatures :", error);
    throw error;
  }
};

export const getJobSeekerInterviews = async () => {
  try {
    const response = await api.get(`/applications/retreiveInterviews`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des entretiens :", error);
    throw error;
  }
};

export const getJobOffers = async () => {
  try {
    const response = await api.get(`/job_offers/listALL`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des offres :", error);
    throw error;
  }
};

export const applyForJob = async (jobOfferId) => {
  try {
    const response = await api.post(`/applications/jobapplications/`, {
      job_offer_id: jobOfferId,
    });
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la soumission de la candidature :", error);
    throw error;
  }
};

export const fetchCandidatesForJobOffer = async (jobOfferId) => {
  try {
    const response = await api.get(`/job_offers/${jobOfferId}/Candidates/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching candidates:", error);
    throw error;
  }
};

export const acceptCandidate = async (applicationId) => {
  try {
    const response = await api.post(
      `/applications/accept/`,
      { application_id: applicationId },
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (error) {
    console.error("Erreur lors de l'acceptation du candidat :", error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const rejectCandidate = async (applicationId) => {
  try {
    const response = await api.post(
      `/applications/reject/`,
      { application_id: applicationId },
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (error) {
    console.error("Erreur lors du rejet du candidat :", error.response?.data || error.message);
    throw error.response?.data || error.message;
  }
};

export const fetchRecruiterInterviews = async () => {
  try {
    const response = await api.get(`/interviews/listrecruiterinterviews/`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des interviews :", error);
    throw error;
  }
};

export const fetchJobSeekerInterviews = async () => {
  try {
    const response = await api.get(`/interviews/listinterviews/`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des interviews :", error);
    throw error;
  }
};

export const fetchQuestions = async (interviewId) => {
  try {
    const response = await api.post(
      `/interviews/questions/`,
      { interview_id: interviewId },
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching questions:", error);
    throw error;
  }
};

export const sendVideo = async (formData) => {
  try {
    const response = await api.post(`/interviews/uploadVideo/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Error sending video:", error);
    throw error;
  }
};

export const fetchAnswers = async (interviewId) => {
  try {
    const response = await api.post(
      `/interviews/answers/`,
      { interview_id: interviewId },
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching answers:", error);
    throw error;
  }
};
