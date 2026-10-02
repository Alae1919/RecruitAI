import { request } from "../http/client";

export const getJobSeekerInterviews = () =>
  request({ method: "GET", url: "/applications/retreiveInterviews/" }).then(d => d.results ?? d);

export const fetchRecruiterInterviews = () =>
  request({ method: "GET", url: "/interviews/listrecruiterinterviews/" }).then(d => d.results ?? d);

export const fetchJobSeekerInterviews = () =>
  request({ method: "GET", url: "/interviews/listinterviews/" }).then(d => d.results ?? d);

export const fetchQuestions = (interviewId) =>
  request({ method: "GET", url: `/interviews/${interviewId}/questions/` });

export const scheduleInterview = (interviewId, data) =>
  request({ method: "PATCH", url: `/interviews/${interviewId}/schedule/`, data });

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

// New evaluation endpoints
export const getInterviewEvaluation = (interviewId) =>
  request({ method: "GET", url: `/interviews/${interviewId}/evaluation/` });

export const overrideEvaluationDecision = (interviewId, data) =>
  request({ method: "PATCH", url: `/interviews/${interviewId}/evaluation/decision/`, data });
