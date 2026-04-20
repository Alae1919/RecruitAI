import { request } from "../http/client";

export const getRecruiterProfile = () =>
  request({ method: "GET", url: "/users/profile/recruiter/" });

export const updateRecruiterProfile = (data) =>
  request({ method: "PUT", url: "/users/update/recruiter/", data });

export const getJobSeekerProfile = () =>
  request({ method: "GET", url: "/users/profile/jobseeker/" });

export const updateJobSeekerProfile = (profileData) => {
  const formData = new FormData();
  formData.append("full_name", profileData.fullName);
  formData.append("email", profileData.email);
  formData.append("personal_phone", profileData.phone);
  formData.append("address", profileData.address);
  formData.append("experience", profileData.experience);
  formData.append("skills", profileData.skills);
  if (profileData.resume instanceof File) {
    formData.append("resume", profileData.resume);
  }
  return request({ method: "PUT", url: "/users/update/jobseeker/", data: formData });
};
