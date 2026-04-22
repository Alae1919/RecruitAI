import { request } from "../http/client";

export const listQuestionSets = (jobOfferId) =>
  request({ method: "GET", url: `/interviews/job-offers/${jobOfferId}/question-sets/` });

export const createQuestionSet = (jobOfferId, data) =>
  request({ method: "POST", url: `/interviews/job-offers/${jobOfferId}/question-sets/`, data });

export const getQuestionSet = (id) =>
  request({ method: "GET", url: `/interviews/question-sets/${id}/` });

export const patchQuestionSet = (id, data) =>
  request({ method: "PATCH", url: `/interviews/question-sets/${id}/`, data });

export const deleteQuestionSet = (id) =>
  request({ method: "DELETE", url: `/interviews/question-sets/${id}/` });

export const regenerateQuestionSet = (id, data) =>
  request({ method: "POST", url: `/interviews/question-sets/${id}/regenerate/`, data });

export const createQuestion = (questionSetId, data) =>
  request({ method: "POST", url: `/interviews/question-sets/${questionSetId}/questions/`, data });

export const patchQuestion = (questionId, data) =>
  request({ method: "PATCH", url: `/interviews/questions/${questionId}/`, data });

export const deleteQuestion = (questionId) =>
  request({ method: "DELETE", url: `/interviews/questions/${questionId}/` });
