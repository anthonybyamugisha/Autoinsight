from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .models import AuditLog, Alert
from .serializers import AuditLogSerializer, AlertSerializer


class AuditLogListView(generics.ListAPIView):
    serializer_class = AuditLogSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        qs = AuditLog.objects.all()
        action_filter = self.request.query_params.get('action')
        if action_filter:
            qs = qs.filter(action=action_filter)
        user_filter = self.request.query_params.get('user')
        if user_filter:
            qs = qs.filter(user_id=user_filter)
        return qs


class AlertListView(generics.ListAPIView):
    serializer_class = AlertSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return Alert.objects.all()


class AlertMarkReadView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, pk):
        try:
            alert = Alert.objects.get(pk=pk)
            alert.is_read = True
            alert.save()
            return Response({'message': 'Alert marked as read.'})
        except Alert.DoesNotExist:
            return Response({'error': 'Alert not found.'}, status=status.HTTP_404_NOT_FOUND)


class AlertMarkAllReadView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        Alert.objects.filter(is_read=False).update(is_read=True)
        return Response({'message': 'All alerts marked as read.'})


class UnreadAlertCountView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        count = Alert.objects.filter(is_read=False).count()
        return Response({'unread_count': count})
