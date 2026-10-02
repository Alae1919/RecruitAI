"""Pick the language Whisper should transcribe an answer in.

Whisper's automatic detection is unreliable on short or accented speech: a clean English
answer was detected as French (76%) and transcribed as gibberish, which then scored 0/10.
Candidates answer in the language of the question, so the question's language is a far
better hint than the audio.
"""
import re

_FRENCH = frozenset(
    'le la les des une un du de est sont vous votre vos avez comment quelles quelle quels quel pour que qui '
    'dans sur avec chez entre cette ces au aux nous notre pourquoi lorsque quand mise place été avoir être '
    'développées exploité décrivez expliquez'.split()
)
_ENGLISH = frozenset(
    'the of and to how would you your what which describe explain in for with is are have has did do '
    'a an on at this that from into about between when why where tell us me my'.split()
)


def guess_language(text: str):
    """'fr' or 'en' when the text clearly is one of them, otherwise None."""
    words = re.findall(r"[a-zà-ÿ']+", (text or '').lower())
    fr = sum(w in _FRENCH for w in words) + sum(any(c in w for c in 'àâçéèêëîïôùûœ') for w in words)
    en = sum(w in _ENGLISH for w in words)
    if fr >= en + 2:
        return 'fr'
    if en >= fr + 2:
        return 'en'
    return None


def whisper_language_for(question_text: str):
    """RECRUITMENT['WHISPER_LANGUAGE'] if set, else the question's language, else None (auto-detect)."""
    from django.conf import settings

    configured = (getattr(settings, 'RECRUITMENT', {}).get('WHISPER_LANGUAGE') or '').strip().lower()
    return configured or guess_language(question_text)
