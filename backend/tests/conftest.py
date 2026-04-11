import pytest
import requests
import os

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def base_url():
    """Base URL from environment"""
    url = os.environ.get('EXPO_PUBLIC_BACKEND_URL')
    if not url:
        pytest.fail("EXPO_PUBLIC_BACKEND_URL not set in environment")
    return url.rstrip('/')

@pytest.fixture
def admin_token(api_client, base_url):
    """Get admin token for authenticated requests"""
    response = api_client.post(f"{base_url}/api/auth/login", json={
        "email": "admin@origami.com",
        "password": "admin123"
    })
    if response.status_code != 200:
        pytest.skip("Admin login failed - skipping authenticated tests")
    return response.json()["access_token"]

@pytest.fixture
def test_user_token(api_client, base_url):
    """Create a test user and return token"""
    import random
    email = f"TEST_user_{random.randint(1000, 9999)}@test.com"
    response = api_client.post(f"{base_url}/api/auth/register", json={
        "name": "Test User",
        "email": email,
        "password": "testpass123"
    })
    if response.status_code != 200:
        pytest.skip("Test user creation failed")
    return response.json()["access_token"]
