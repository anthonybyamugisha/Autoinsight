"""Login lockout and authentication security helpers."""

from django.core.cache import cache
from django.conf import settings


def _fail_key(email):
    return f'login_fail:{email.lower()}'


def _lock_key(email):
    return f'login_lock:{email.lower()}'


def get_failure_count(email):
    return cache.get(_fail_key(email), 0)


def is_login_locked(email):
    email = email.lower()
    if cache.get(_lock_key(email)):
        return True
    return get_failure_count(email) >= getattr(settings, 'LOGIN_MAX_ATTEMPTS', 5)


def record_failed_login(email):
    """Increment failed attempts; lock account when threshold reached."""
    max_attempts = getattr(settings, 'LOGIN_MAX_ATTEMPTS', 5)
    lockout_seconds = getattr(settings, 'LOGIN_LOCKOUT_SECONDS', 900)
    email = email.lower()
    key = _fail_key(email)
    count = cache.get(key, 0) + 1
    cache.set(key, count, lockout_seconds)
    if count >= max_attempts:
        cache.set(_lock_key(email), True, lockout_seconds)
        return True, count
    return False, count


def clear_login_attempts(email):
    email = email.lower()
    cache.delete(_fail_key(email))
    cache.delete(_lock_key(email))
