from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.core.cache import cache
from rest_framework.test import APIClient
from rest_framework import status

from backend.users.models import User
from backend.datasets.models import Dataset, DataRecord


class SecurityAccessTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.analyst_a = User.objects.create_user(
            username='analyst_a', email='a@test.com', password='TestPass123!',
            role='analyst', department='QA',
        )
        self.analyst_b = User.objects.create_user(
            username='analyst_b', email='b@test.com', password='TestPass123!',
            role='analyst', department='QA',
        )
        self.manager = User.objects.create_user(
            username='manager', email='mgr@test.com', password='TestPass123!',
            role='manager', department='QA',
        )
        self.admin = User.objects.create_user(
            username='admin', email='admin@test.com', password='TestPass123!',
            role='admin', department='IT',
        )
        self.assurance = User.objects.create_user(
            username='assurance', email='assurance@test.com', password='TestPass123!',
            role='assurance', department='Security',
        )
        self.dataset = Dataset.objects.create(
            name='Test Dataset',
            approved_use='QA testing for loan data quality checks',
            classification='confidential',
            uploaded_by=self.analyst_a,
            file=SimpleUploadedFile('test.csv', b'amount,account_number\n100,1234567890'),
            row_count=10,
            column_count=2,
            status='completed',
            columns=['amount', 'account_number'],
            contains_sensitive_data=True,
            sensitive_columns=['account_number'],
        )
        DataRecord.objects.create(
            dataset=self.dataset,
            row_index=0,
            data={'amount': 100, 'account_number': '1234567890'},
        )

    def _auth(self, user):
        self.client.force_authenticate(user=user)

    def test_analyst_cannot_access_other_analyst_dataset(self):
        self._auth(self.analyst_b)
        response = self.client.get(f'/api/datasets/{self.dataset.id}/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_manager_can_access_department_dataset(self):
        self._auth(self.manager)
        response = self.client.get(f'/api/datasets/{self.dataset.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_assurance_can_view_but_not_export(self):
        self._auth(self.assurance)
        self.assertEqual(
            self.client.get(f'/api/datasets/{self.dataset.id}/analytics/').status_code,
            status.HTTP_200_OK,
        )
        self.assertEqual(
            self.client.get(f'/api/datasets/{self.dataset.id}/export/').status_code,
            status.HTTP_403_FORBIDDEN,
        )

    def test_preview_masks_sensitive_columns_for_confidential(self):
        self._auth(self.analyst_a)
        response = self.client.get(f'/api/datasets/{self.dataset.id}/preview/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['masked'])
        self.assertTrue(
            str(response.data['records'][0]['data']['account_number']).startswith('****')
        )

    def test_register_always_assigns_analyst_role(self):
        response = self.client.post('/api/users/register/', {
            'username': 'hacker',
            'email': 'hacker@test.com',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!',
            'first_name': 'Bad',
            'last_name': 'Actor',
            'role': 'admin',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email='hacker@test.com')
        self.assertEqual(user.role, 'analyst')

    def test_user_list_requires_admin(self):
        self._auth(self.analyst_a)
        self.assertEqual(self.client.get('/api/users/list/').status_code, status.HTTP_403_FORBIDDEN)
        self._auth(self.admin)
        self.assertEqual(self.client.get('/api/users/list/').status_code, status.HTTP_200_OK)

    def test_login_lockout_after_failed_attempts(self):
        for _ in range(4):
            resp = self.client.post('/api/users/login/', {'email': 'a@test.com', 'password': 'wrong'})
            self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
        # 5th failed attempt triggers lockout
        response = self.client.post('/api/users/login/', {'email': 'a@test.com', 'password': 'wrong'})
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
        # Valid password is also blocked while locked
        response = self.client.post('/api/users/login/', {'email': 'a@test.com', 'password': 'TestPass123!'})
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_security_summary_requires_assurance_or_admin(self):
        self._auth(self.analyst_a)
        self.assertEqual(
            self.client.get('/api/audit/security-summary/').status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self._auth(self.assurance)
        self.assertEqual(
            self.client.get('/api/audit/security-summary/').status_code,
            status.HTTP_200_OK,
        )
