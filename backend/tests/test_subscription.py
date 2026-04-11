# Subscription endpoint tests
import pytest

class TestSubscriptionStatus:
    """Test subscription status endpoint"""

    def test_get_subscription_status(self, api_client, base_url, test_user_token):
        """Test GET /api/subscription/status returns subscription info"""
        response = api_client.get(
            f"{base_url}/api/subscription/status",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert "trial_start" in data
        assert "trial_end" in data
        assert "days_remaining" in data
        
        # New user should be on trial
        assert data["status"] == "trial"
        assert data["days_remaining"] >= 0

    def test_subscription_status_no_auth(self, api_client, base_url):
        """Test subscription status requires authentication"""
        response = api_client.get(f"{base_url}/api/subscription/status")
        assert response.status_code == 401

class TestSubscriptionActivation:
    """Test subscription activation (MOCKED PayPal)"""

    def test_activate_subscription(self, api_client, base_url, test_user_token):
        """Test POST /api/subscription/activate (simulated PayPal payment)"""
        response = api_client.post(
            f"{base_url}/api/subscription/activate",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "active"
        assert "message" in data
        
        # Verify subscription status changed
        status_response = api_client.get(
            f"{base_url}/api/subscription/status",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        status_data = status_response.json()
        assert status_data["status"] == "active"

    def test_activate_subscription_no_auth(self, api_client, base_url):
        """Test activation requires authentication"""
        response = api_client.post(f"{base_url}/api/subscription/activate")
        assert response.status_code == 401
