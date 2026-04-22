import { request } from "../http/client";

export const listMyResumes = () =>
  request({ method: "GET", url: "/applications/resumes/" });

export const createResume = (file, makeDefault = false) => {
  const formData = new FormData();
  formData.append("original_file", file);
  if (makeDefault) formData.append("make_default", "true");
  return request({
    method: "POST",
    url: "/applications/resumes/",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getResume = (id) =>
  request({ method: "GET", url: `/applications/resumes/${id}/` });

export const patchResume = (id, data) =>
  request({ method: "PATCH", url: `/applications/resumes/${id}/`, data });

export const deleteResume = (id) =>
  request({ method: "DELETE", url: `/applications/resumes/${id}/` });
