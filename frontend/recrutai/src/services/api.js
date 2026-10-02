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
  advanceCandidate,
  rejectCandidate,
} from "../shared/api/applications";

export {
  getJobSeekerInterviews,
  fetchRecruiterInterviews,
  fetchJobSeekerInterviews,
  fetchQuestions,
  sendVideo,
  fetchAnswers,
  getInterviewEvaluation,
  overrideEvaluationDecision,
} from "../shared/api/interviews";

export { generateJobDescription } from "../shared/api/jobOffers";
export { fetchMe, fetchMeProfile, updateMeProfile } from "../shared/api/auth";
export { listMyResumes, createResume, patchResume, deleteResume } from "../shared/api/resumes";
export {
  listQuestionSets, createQuestionSet, getQuestionSet, patchQuestionSet,
  deleteQuestionSet, regenerateQuestionSet, createQuestion, patchQuestion, deleteQuestion,
} from "../shared/api/questionSets";
export { getInterviewEvaluation as getEvaluation, overrideDecision } from "../shared/api/evaluations";
