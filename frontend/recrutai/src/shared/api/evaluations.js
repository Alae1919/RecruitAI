import { request } from "../http/client";

export const getInterviewEvaluation = (interviewId) =>
  request({ method: "GET", url: `/interviews/${interviewId}/evaluation/` });

export const overrideDecision = (interviewId, data) =>
  request({ method: "PATCH", url: `/interviews/${interviewId}/evaluation/decision/`, data });
