import { request } from "../http/client";

export const getJobSeekerApplications = () =>
  request({ method: "GET", url: "/applications/retreiveApplications" });

export const applyForJob = (jobOfferId) =>
  request({ method: "POST", url: "/applications/jobapplications/", data: { job_offer_id: jobOfferId } });

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
