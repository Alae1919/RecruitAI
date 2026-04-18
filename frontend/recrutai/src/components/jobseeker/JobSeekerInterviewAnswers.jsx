import React, { useState, useEffect } from "react";
import { fetchAnswers } from "../../services/api";

const JobSeekerEntretienAnswers = ({ interviewId, onClose }) => {
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(0);

  useEffect(() => {
    const fetchAnswer = async () => {
      setLoading(true);
      try {
        const data = await fetchAnswers(interviewId);
        console.log("📼 data :", data);
        /*
        const formattedAnswers = data.map((item) => ({
          question_id: item.question_id,
          question_text: item.question_text,
          video_url: item.video_url,
          transcript: item.transcript 
        }));
        console.log("📼 formattedAnswers :", formattedAnswers);
        */
        if (Array.isArray(data.answers)) {
          setAnswers(data.answers);
        } else {
          console.error("Expected an array but got:", data);
          setError("Unexpected data format received from the server.");
        }
      } catch (error) {
        console.error("Error fetching answers:", error);
        setError("Failed to load answers. Please try again.");
      }
      setLoading(false);
    };

    fetchAnswer();
  }, [interviewId]);

  if (loading) return <p>Loading answers...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <button onClick={onClose} className="mb-4 bg-red-500 text-white px-4 py-2 rounded">
        Back
      </button>
      <h2 className="text-xl font-bold mb-4">Interview Answers</h2>

      <div className="flex">
        {/* Question List */}
        <div className="w-1/3 border-r pr-4">
          <h3 className="font-semibold mb-2">Questions</h3>
          <ul>
            {answers.map((answer, index) => (
              <li
                key={answer.question_id}
                className={`cursor-pointer p-2 ${
                  selectedQuestion === index ? "bg-gray-300" : ""
                }`}
                onClick={() => setSelectedQuestion(index)}
              >
                {answer.question_text}
              </li>
            ))}
          </ul>
        </div>

        {/* Video Player */}
        <div className="w-2/3 pl-4">
          {answers[selectedQuestion] && answers[selectedQuestion].video_url ? (
            <video key={answers[selectedQuestion].video_url} controls className="w-full rounded-lg">
            <source src={`${process.env.REACT_APP_BACKEND_URL}${answers[selectedQuestion].video_url}`} type="video/webm" />
            Your browser does not support the video tag.
          </video>
          ) : (
            <p>No video available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobSeekerEntretienAnswers;
