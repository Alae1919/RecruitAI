import { request } from "../http/client";

export const listOffers = () =>
  request({ method: "GET", url: "/job_offers/list" });

export const listAllOffers = () =>
  request({ method: "GET", url: "/job_offers/listALL" });

export const createOffer = (data) =>
  request({ method: "POST", url: "/job_offers/create", data });

export const editOffer = (id, data) =>
  request({ method: "PUT", url: `/job_offers/${id}/edit/`, data });

export const deleteOffer = (id) =>
  request({ method: "DELETE", url: `/job_offers/${id}/delete/` });

export const listCandidates = (jobOfferId) =>
  request({ method: "GET", url: `/job_offers/${jobOfferId}/Candidates/` });
