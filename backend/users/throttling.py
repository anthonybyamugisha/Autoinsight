from rest_framework.throttling import AnonRateThrottle, UserRateThrottle


class LoginRateThrottle(AnonRateThrottle):
    scope = 'login'


class PasswordResetRateThrottle(AnonRateThrottle):
    scope = 'password_reset'


class UploadRateThrottle(UserRateThrottle):
    scope = 'upload'
