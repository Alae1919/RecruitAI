import { request } from "../http/client";

// Role-aware unified profile endpoint (new backend)
export const getMyProfile = () =>
  request({ method: "GET", url: "/users/me/profile/" });

export const updateMyProfile = (data) =>
  request({ method: "PATCH", url: "/users/me/profile/", data });

// Legacy aliases kept so existing components don't break
export const getRecruiterProfile = getMyProfile;
export const updateRecruiterProfile = updateMyProfile;

export const getJobSeekerProfile = getMyProfile;

export const updateJobSeekerProfile = (profileData) => {
  const formData = new FormData();
  if (profileData.fullName !== undefined) formData.append("full_name", profileData.fullName);
  if (profileData.email !== undefined) formData.append("email", profileData.email);
  if (profileData.phone !== undefined) formData.append("personal_phone", profileData.phone);
  if (profileData.address !== undefined) formData.append("address", profileData.address);
  if (profileData.experience !== undefined) formData.append("experience", profileData.experience);
  if (profileData.skills !== undefined) formData.append("skills", profileData.skills);
  if (profileData.resume instanceof File) formData.append("resume", profileData.resume);
  return request({ method: "PATCH", url: "/users/me/profile/", data: formData });
};
