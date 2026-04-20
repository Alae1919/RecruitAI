import { request } from "../http/client";

export const getJobSeekerInterviews = () =>
  request({ method: "GET", url: "/applications/retreiveInterviews" });

export const fetchRecruiterInterviews = () =>
  request({ method: "GET", url: "/interviews/listrecruiterinterviews/" }).then(d => d.results ?? d);

export const fetchJobSeekerInterviews = () =>
  request({ method: "GET", url: "/interviews/listinterviews/" }).then(d => d.results ?? d);

export const fetchQuestions = (interviewId) =>
  request({
    method: "POST",
    url: "/interviews/questions/",
    data: { interview_id: interviewId },
  });

export const sendVideo = (formData) =>
  request({
    method: "POST",
    url: "/interviews/uploadVideo/",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });

export const fetchAnswers = (interviewId) =>
  request({
    method: "POST",
    url: "/interviews/answers/",
    data: { interview_id: interviewId },
  });
