from rest_framework import status, generics, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings

from .serializers import (
    RegisterSerializer, UserSerializer, ChangePasswordSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer,
)
from .permissions import IsAdmin
from .security import is_login_locked, record_failed_login, clear_login_attempts
from .throttling import LoginRateThrottle, PasswordResetRateThrottle
from backend.audit.utils import log_action
from backend.audit.security import on_failed_login

User = get_user_model()


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = User.USERNAME_FIELD


class LoginView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer
    throttle_classes = (LoginRateThrottle,)

    def post(self, request, *args, **kwargs):
        email = (request.data.get('email') or request.data.get('username') or '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response({'detail': 'Email and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if is_login_locked(email):
            log_action(
                None,
                'login_failed',
                f'Login attempt on locked account: {email}',
                request=request,
            )
            return Response(
                {'detail': 'Account temporarily locked due to multiple failed attempts. Try again later.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        serializer = self.get_serializer(data={'email': email, 'password': password})
        try:
            serializer.is_valid(raise_exception=True)
        except (serializers.ValidationError, AuthenticationFailed):
            locked, count = record_failed_login(email)
            log_action(
                None,
                'login_failed',
                f'Failed login for {email} (attempt {count})',
                request=request,
            )
            if locked:
                on_failed_login(email, request, count)
                return Response(
                    {'detail': 'Account temporarily locked due to multiple failed attempts. Try again later.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )
            return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

        clear_login_attempts(email)
        try:
            user = User.objects.get(email=email)
            log_action(user, 'login', f'User {email} logged in successfully', request=request)
        except User.DoesNotExist:
            pass

        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        log_action(user, 'register', f'New user registered: {user.email}', request=request)
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        serializer.save()
        log_action(
            self.request.user,
            'profile_update',
            f'Profile updated for {self.request.user.email}',
            request=self.request,
        )


class ChangePasswordView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        log_action(
            request.user,
            'password_change',
            f'Password changed for {request.user.email}',
            request=request,
        )
        return Response({'message': 'Password changed successfully.'}, status=status.HTTP_200_OK)


class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated, IsAdmin)


class ForgotPasswordView(APIView):
    permission_classes = (AllowAny,)
    throttle_classes = (PasswordResetRateThrottle,)

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"

            send_mail(
                subject='AutoInsight — Password Reset',
                message=(
                    f'Hi {user.get_full_name() or user.username},\n\n'
                    f'You requested a password reset. Click the link below to set a new password:\n\n'
                    f'{reset_url}\n\n'
                    f'This link expires in 24 hours. If you did not request this, ignore this email.\n\n'
                    f'— AutoInsight, Centenary Bank QA'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
            log_action(
                user,
                'password_reset_request',
                f'Password reset requested for {email}',
                request=request,
            )
        except User.DoesNotExist:
            pass

        return Response(
            {'message': 'If an account with that email exists, a reset link has been sent.'},
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        log_action(
            user,
            'password_change',
            f'Password reset completed for {user.email}',
            request=request,
        )

        return Response(
            {'message': 'Password has been reset successfully. You can now sign in.'},
            status=status.HTTP_200_OK,
        )
