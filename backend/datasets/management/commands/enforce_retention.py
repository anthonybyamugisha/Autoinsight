from django.core.management.base import BaseCommand
from django.utils import timezone

from backend.datasets.models import Dataset
from backend.audit.utils import log_action


class Command(BaseCommand):
    help = 'Mark expired datasets and optionally purge them after retention period.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--purge',
            action='store_true',
            help='Permanently delete datasets that expired more than 30 days ago.',
        )

    def handle(self, *args, **options):
        now = timezone.now()
        expired = Dataset.objects.filter(retention_expires_at__lt=now, is_expired=False)
        count = expired.count()
        for dataset in expired:
            dataset.is_expired = True
            dataset.save(update_fields=['is_expired'])
            if dataset.uploaded_by:
                log_action(
                    dataset.uploaded_by,
                    'retention_expired',
                    f'Dataset "{dataset.name}" reached retention expiry',
                    'dataset',
                    dataset.id,
                )
        self.stdout.write(self.style.SUCCESS(f'Marked {count} dataset(s) as expired.'))

        if options['purge']:
            from datetime import timedelta
            purge_before = now - timedelta(days=30)
            to_purge = Dataset.objects.filter(
                is_expired=True,
                retention_expires_at__lt=purge_before,
            )
            purged = to_purge.count()
            to_purge.delete()
            self.stdout.write(self.style.WARNING(f'Purged {purged} expired dataset(s).'))
