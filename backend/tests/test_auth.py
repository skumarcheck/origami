# Authentication endpoint tests
import pytest
import requests

class TestAuthRegistration:
    """Test user registration flow"""

    def test_register_new_user(self, api_client, base_url):
        """Test successful user registration"""
        import random
        email = f"TEST_newuser_{random.randint(1000, 9999)}@test.com"
        response = api_client.post(f"{base_url}/api/auth/register", json={
            "name": "New Test User",
            "email": email,
            "password": "password123"
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        
        data = response.json()
        assert "user" in data
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == email.lower()
        assert data["user"]["subscription_status"] == "trial"
        assert data["user"]["trial_end"] is not None

    def test_register_duplicate_email(self, api_client, base_url):
        """Test registration with existing email fails"""
        response = api_client.post(f"{base_url}/api/auth/register", json={
            "name": "Admin Duplicate",
            "email": "admin@origami.com",
            "password": "password123"
        })
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    def test_register_missing_fields(self, api_client, base_url):
        """Test registration with missing fields"""
        response = api_client.post(f"{base_url}/api/auth/register", json={
            "email": "test@test.com"
        })
        assert response.status_code == 422  # Validation error

class TestAuthLogin:
    """Test user login flow"""

    def test_login_admin_success(self, api_client, base_url):
        """Test admin login with correct credentials"""
        response = api_client.post(f"{base_url}/api/auth/login", json={
            "email": "admin@origami.com",
            "password": "admin123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "user" in data
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["email"] == "admin@origami.com"
        assert data["user"]["skill_level"] == "advanced"

    def test_login_wrong_password(self, api_client, base_url):
        """Test login with wrong password"""
        response = api_client.post(f"{base_url}/api/auth/login", json={
            "email": "admin@origami.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()

    def test_login_nonexistent_user(self, api_client, base_url):
        """Test login with non-existent email"""
        response = api_client.post(f"{base_url}/api/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "password123"
        })
        assert response.status_code == 401

class TestAuthMe:
    """Test /auth/me endpoint"""

    def test_get_me_authenticated(self, api_client, base_url, admin_token):
        """Test getting current user info with valid token"""
        response = api_client.get(
            f"{base_url}/api/auth/me",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["email"] == "admin@origami.com"
        assert "password_hash" not in data  # Should not expose password

    def test_get_me_no_token(self, api_client, base_url):
        """Test /auth/me without token fails"""
        response = api_client.get(f"{base_url}/api/auth/me")
        assert response.status_code == 401

    def test_get_me_invalid_token(self, api_client, base_url):
        """Test /auth/me with invalid token"""
        response = api_client.get(
            f"{base_url}/api/auth/me",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        assert response.status_code == 401

class TestAuthProfile:
    """Test profile update endpoint"""

    def test_update_profile_skill_level(self, api_client, base_url, test_user_token):
        """Test updating user skill level"""
        response = api_client.put(
            f"{base_url}/api/auth/profile",
            headers={"Authorization": f"Bearer {test_user_token}"},
            json={"skill_level": "intermediate", "age_range": "8-10 years"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["skill_level"] == "intermediate"
        assert data["age_range"] == "8-10 years"
        
        # Verify persistence with GET /auth/me
        verify_response = api_client.get(
            f"{base_url}/api/auth/me",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data["skill_level"] == "intermediate"

    def test_update_profile_no_auth(self, api_client, base_url):
        """Test profile update without authentication"""
        response = api_client.put(
            f"{base_url}/api/auth/profile",
            json={"skill_level": "beginner"}
        )
        assert response.status_code == 401
