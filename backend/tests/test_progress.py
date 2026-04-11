# Progress tracking endpoint tests
import pytest

class TestProgressStats:
    """Test progress stats endpoint"""

    def test_get_progress_stats(self, api_client, base_url, test_user_token):
        """Test GET /api/progress/stats returns user stats"""
        response = api_client.get(
            f"{base_url}/api/progress/stats",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "completed" in data
        assert "favorites" in data
        assert "total_available" in data
        assert "xp_points" in data
        assert "level" in data
        assert "streak_days" in data
        
        # New user should have 0 completed
        assert data["completed"] == 0
        assert data["total_available"] == 15

    def test_get_progress_stats_no_auth(self, api_client, base_url):
        """Test stats endpoint requires authentication"""
        response = api_client.get(f"{base_url}/api/progress/stats")
        assert response.status_code == 401

class TestProgressTracking:
    """Test progress tracking endpoints"""

    def test_update_step_progress(self, api_client, base_url, test_user_token):
        """Test POST /api/progress/{id}/step updates current step"""
        response = api_client.post(
            f"{base_url}/api/progress/airplane-001/step?step=2",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        
        # Verify progress was saved
        progress_response = api_client.get(
            f"{base_url}/api/progress",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert progress_response.status_code == 200
        progress_data = progress_response.json()
        
        airplane_progress = next((p for p in progress_data if p["origami_id"] == "airplane-001"), None)
        assert airplane_progress is not None
        assert airplane_progress["current_step"] == 2

    def test_complete_origami(self, api_client, base_url, test_user_token):
        """Test POST /api/progress/{id}/complete marks origami as complete"""
        response = api_client.post(
            f"{base_url}/api/progress/boat-001/complete",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "completed"
        assert "xp_earned" in data
        assert data["xp_earned"] > 0
        
        # Verify completion persisted
        progress_response = api_client.get(
            f"{base_url}/api/progress",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        progress_data = progress_response.json()
        boat_progress = next((p for p in progress_data if p["origami_id"] == "boat-001"), None)
        assert boat_progress is not None
        assert boat_progress["completed"] is True
        assert boat_progress["completed_at"] is not None

    def test_complete_already_completed(self, api_client, base_url, test_user_token):
        """Test completing an already completed origami"""
        # Complete first time
        api_client.post(
            f"{base_url}/api/progress/puppy-001/complete",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        
        # Try to complete again
        response = api_client.post(
            f"{base_url}/api/progress/puppy-001/complete",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "already_completed"

class TestFavorites:
    """Test favorite functionality"""

    def test_toggle_favorite(self, api_client, base_url, test_user_token):
        """Test POST /api/progress/{id}/favorite toggles favorite status"""
        # First toggle - should favorite
        response = api_client.post(
            f"{base_url}/api/progress/tulip-001/favorite",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        assert response.json()["favorited"] is True
        
        # Second toggle - should unfavorite
        response2 = api_client.post(
            f"{base_url}/api/progress/tulip-001/favorite",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response2.status_code == 200
        assert response2.json()["favorited"] is False

    def test_get_favorites(self, api_client, base_url, test_user_token):
        """Test GET /api/progress/favorites returns favorited origami"""
        # Favorite an item first
        api_client.post(
            f"{base_url}/api/progress/heart-001/favorite",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        
        # Get favorites
        response = api_client.get(
            f"{base_url}/api/progress/favorites",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert any(item["id"] == "heart-001" for item in data)

    def test_get_completed(self, api_client, base_url, test_user_token):
        """Test GET /api/progress/completed returns completed origami"""
        # Complete an item first
        api_client.post(
            f"{base_url}/api/progress/frog-001/complete",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        
        # Get completed
        response = api_client.get(
            f"{base_url}/api/progress/completed",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert any(item["id"] == "frog-001" for item in data)
