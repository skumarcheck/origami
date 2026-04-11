# Origami CRUD endpoint tests
import pytest

class TestOrigamiList:
    """Test origami listing endpoints"""

    def test_get_all_origami(self, api_client, base_url):
        """Test GET /api/origami returns all origami"""
        response = api_client.get(f"{base_url}/api/origami")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 15, f"Expected 15 origami, got {len(data)}"
        
        # Verify structure of first item
        if len(data) > 0:
            item = data[0]
            assert "id" in item
            assert "title" in item
            assert "skill_level" in item
            assert "steps" in item
            assert isinstance(item["steps"], list)

    def test_filter_by_skill_level_beginner(self, api_client, base_url):
        """Test filtering origami by beginner skill level"""
        response = api_client.get(f"{base_url}/api/origami?skill_level=beginner")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # All items should be beginner level
        for item in data:
            assert item["skill_level"] == "beginner"

    def test_filter_by_skill_level_intermediate(self, api_client, base_url):
        """Test filtering origami by intermediate skill level"""
        response = api_client.get(f"{base_url}/api/origami?skill_level=intermediate")
        assert response.status_code == 200
        
        data = response.json()
        for item in data:
            assert item["skill_level"] == "intermediate"

    def test_filter_by_skill_level_advanced(self, api_client, base_url):
        """Test filtering origami by advanced skill level"""
        response = api_client.get(f"{base_url}/api/origami?skill_level=advanced")
        assert response.status_code == 200
        
        data = response.json()
        for item in data:
            assert item["skill_level"] == "advanced"

    def test_search_origami(self, api_client, base_url):
        """Test searching origami by title"""
        response = api_client.get(f"{base_url}/api/origami?search=crane")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data) > 0
        # Should find "Paper Crane"
        assert any("crane" in item["title"].lower() for item in data)

class TestOrigamiFeatured:
    """Test featured origami endpoint"""

    def test_get_featured_origami(self, api_client, base_url):
        """Test GET /api/origami/featured returns featured items"""
        response = api_client.get(f"{base_url}/api/origami/featured")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) <= 6, "Featured should return max 6 items"
        assert len(data) > 0, "Featured should return at least 1 item"

class TestOrigamiSeasonal:
    """Test seasonal origami endpoint"""

    def test_get_seasonal_origami(self, api_client, base_url):
        """Test GET /api/origami/seasonal returns seasonal data"""
        response = api_client.get(f"{base_url}/api/origami/seasonal")
        assert response.status_code == 200
        
        data = response.json()
        assert "current_season" in data
        assert "current_holiday" in data
        assert "seasonal" in data
        assert "holiday" in data
        
        # current_season should be one of the valid seasons
        assert data["current_season"] in ["spring", "summer", "fall", "winter"]
        
        # seasonal should be a list
        assert isinstance(data["seasonal"], list)
        assert isinstance(data["holiday"], list)

class TestOrigamiDetail:
    """Test individual origami detail endpoint"""

    def test_get_origami_by_id(self, api_client, base_url):
        """Test GET /api/origami/{id} returns specific origami"""
        response = api_client.get(f"{base_url}/api/origami/crane-001")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == "crane-001"
        assert data["title"] == "Paper Crane"
        assert "steps" in data
        assert len(data["steps"]) > 0
        
        # Verify step structure
        step = data["steps"][0]
        assert "step_number" in step
        assert "title" in step
        assert "instruction" in step

    def test_get_nonexistent_origami(self, api_client, base_url):
        """Test GET /api/origami/{id} with invalid ID"""
        response = api_client.get(f"{base_url}/api/origami/nonexistent-999")
        assert response.status_code == 404
