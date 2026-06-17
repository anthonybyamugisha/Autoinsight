from rest_framework import serializers
from .models import AuditLog, Alert


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    action_display = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = ('id', 'user', 'user_name', 'action', 'action_display', 'description',
                  'resource_type', 'resource_id', 'ip_address', 'created_at')

    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_action_display(self, obj):
        return obj.get_action_display()


class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = ('id', 'dataset', 'title', 'message', 'severity', 'is_read', 'created_at')
        read_only_fields = ('id', 'created_at')
