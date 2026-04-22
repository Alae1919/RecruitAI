import { request } from "../http/client";

export const getJobSeekerApplications = () =>
  request({ method: "GET", url: "/applications/retreiveApplications" });

export const applyForJob = ({ jobOfferId, resumeId }) =>
  request({
    method: "POST",
    url: "/applications/jobapplications/",
    data: { job_offer_id: jobOfferId, ...(resumeId ? { resume_id: resumeId } : {}) },
  });

export const acceptCandidate = (applicationId) =>
  request({
    method: "POST",
    url: "/applications/accept/",
    data: { application_id: applicationId },
  });

export const rejectCandidate = (applicationId) =>
  request({
    method: "POST",
    url: "/applications/reject/",
    data: { application_id: applicationId },
  });
