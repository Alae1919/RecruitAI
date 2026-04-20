from django.db import models
from users.models import JobSeeker, Recruiter
from job_offers.models  import  JobOffer
import PyPDF2
import io
import logging

logger = logging.getLogger(__name__)


class CVExtractionError(Exception):
    """Raised when the resume PDF cannot be read or parsed."""

class Application(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        ACCEPTED = 'accepted', 'Accepted'
        REJECTED = 'rejected', 'Rejected'

    job_seeker = models.ForeignKey(JobSeeker, on_delete=models.CASCADE)
    job_offer = models.ForeignKey(JobOffer, on_delete=models.CASCADE)
    extracted_text = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    applied_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['status', 'job_offer']),
        ]

    def __str__(self):
        return f"{self.job_seeker.user.email} -> {self.job_offer.title}"

    def extract_text_from_resume(self):
        """Extrait le texte du CV du candidat."""
        if not self.job_seeker.resume:
            return None
        try:
            pdf_bytes = self.job_seeker.resume.read()
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() or ""
            return " ".join(text.split())
        except PyPDF2.errors.PdfReadError as e:
            logger.error(f"PDF parse error for job seeker {self.job_seeker_id}: {e}")
            raise CVExtractionError(f"Could not parse the uploaded resume: {e}") from e
        except Exception as e:
            logger.exception(f"Unexpected error extracting resume for job seeker {self.job_seeker_id}")
            raise CVExtractionError("Unexpected error reading the resume file.") from e




class Feedback(models.Model):
    from interviews.models import Interview

    interview = models.ForeignKey(Interview, on_delete=models.CASCADE)
    recruiter = models.ForeignKey(Recruiter, on_delete=models.CASCADE)
    comments = models.TextField(blank=True, null=True)
    rating = models.IntegerField()  # Contrainte dans le modèle ci-dessous

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Feedback for {self.interview.application.job_seeker.user.email}"
    
    def save(self, *args, **kwargs):
        if self.rating < 1 or self.rating > 5:
            raise ValueError("Rating must be between 1 and 5")
        super().save(*args, **kwargs)
