// Re-exports from the normalized domain API modules.
// All new code should import directly from shared/api/* instead.
export { apiClient as default, apiClient, request, ApiError } from "../shared/http/client";

export {
  registerRecruiter,
  registerJobSeeker,
  loginUser,
  fetchCurrentUser,
  logoutUser,
} from "../shared/api/auth";

export {
  listOffers as fetchJobOffers,
  listAllOffers as getJobOffers,
  createOffer as createJobOffer,
  editOffer as editJobOffer,
  deleteOffer as deleteJobOffer,
  listCandidates as fetchCandidatesForJobOffer,
} from "../shared/api/jobOffers";

export {
  getRecruiterProfile,
  updateRecruiterProfile,
  getJobSeekerProfile,
  updateJobSeekerProfile,
} from "../shared/api/profiles";

export {
  getJobSeekerApplications,
  applyForJob,
  acceptCandidate,
  rejectCandidate,
} from "../shared/api/applications";

export {
  getJobSeekerInterviews,
  fetchRecruiterInterviews,
  fetchJobSeekerInterviews,
  fetchQuestions,
  sendVideo,
  fetchAnswers,
} from "../shared/api/interviews";
