import { request } from "../http/client";

export const listMyResumes = () =>
  request({ method: "GET", url: "/applications/resumes/" });

export const createResume = (file, label = '', makeDefault = false) => {
  const formData = new FormData();
  formData.append("original_file", file);
  if (label) formData.append("label", label);
  formData.append("make_default", makeDefault ? "true" : "false");
  return request({ method: "POST", url: "/applications/resumes/", data: formData });
};

export const getResume = (id) =>
  request({ method: "GET", url: `/applications/resumes/${id}/` });

export const patchResume = (id, data) =>
  request({ method: "PATCH", url: `/applications/resumes/${id}/`, data });

export const deleteResume = (id) =>
  request({ method: "DELETE", url: `/applications/resumes/${id}/` });
