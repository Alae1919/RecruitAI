import { request } from "../http/client";

export const listOffers = (params = {}) => {
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined)).toString();
  return request({ method: "GET", url: `/job_offers/list${query ? `?${query}` : ''}` });
};

export const listAllOffers = (params = {}) => {
  const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined)).toString();
  return request({ method: "GET", url: `/job_offers/listALL${query ? `?${query}` : ''}` });
};

export const createOffer = (data) =>
  request({ method: "POST", url: "/job_offers/create", data });

export const editOffer = (id, data) =>
  request({ method: "PUT", url: `/job_offers/${id}/edit/`, data });

export const deleteOffer = (id) =>
  request({ method: "DELETE", url: `/job_offers/${id}/delete/` });

export const listCandidates = (jobOfferId) =>
  request({ method: "GET", url: `/job_offers/${jobOfferId}/Candidates/` });

export const generateJobDescription = (data) =>
  request({ method: "POST", url: "/job_offers/generate-description/", data });
