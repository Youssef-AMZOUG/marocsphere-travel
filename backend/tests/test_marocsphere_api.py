"""
MarocSphere API Test Suite
Tests all backend API endpoints after modular router refactoring
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL environment variable not set")


# ─── Fixtures ───────────────────────────────────────────

@pytest.fixture(scope="session")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="session")
def test_user_credentials():
    """Generate unique test user credentials"""
    unique_id = str(uuid.uuid4())[:8]
    return {
        "name": f"Test User {unique_id}",
        "email": f"test_{unique_id}@example.com",
        "password": "testpassword123"
    }


@pytest.fixture(scope="session")
def registered_user(api_client, test_user_credentials):
    """Register a test user and return token + user info"""
    response = api_client.post(f"{BASE_URL}/api/auth/register", json=test_user_credentials)
    if response.status_code == 200:
        data = response.json()
        return {
            "token": data["token"],
            "user": data["user"],
            "credentials": test_user_credentials
        }
    elif response.status_code == 400:
        # User already exists, try login
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_user_credentials["email"],
            "password": test_user_credentials["password"]
        })
        if login_response.status_code == 200:
            data = login_response.json()
            return {
                "token": data["token"],
                "user": data["user"],
                "credentials": test_user_credentials
            }
    pytest.skip("Could not register or login test user")


@pytest.fixture(scope="session")
def auth_headers(registered_user):
    """Return authorization headers for authenticated requests"""
    return {"Authorization": f"Bearer {registered_user['token']}"}


# ─── Root Endpoint Tests ────────────────────────────────

class TestRootEndpoint:
    """Test GET /api - Root endpoint"""
    
    def test_root_returns_version_info(self, api_client):
        """GET /api should return version info"""
        response = api_client.get(f"{BASE_URL}/api")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "message" in data, "Response should contain 'message'"
        assert "version" in data, "Response should contain 'version'"
        assert data["message"] == "MarocSphere API"
        assert data["version"] == "2.0.0"
        print(f"✓ Root endpoint returns: {data}")


# ─── Auth Endpoint Tests ────────────────────────────────

class TestAuthEndpoints:
    """Test /api/auth/* endpoints"""
    
    def test_register_new_user(self, api_client):
        """POST /api/auth/register - Register new user"""
        unique_id = str(uuid.uuid4())[:8]
        user_data = {
            "name": f"TEST_NewUser_{unique_id}",
            "email": f"TEST_newuser_{unique_id}@example.com",
            "password": "password123"
        }
        
        response = api_client.post(f"{BASE_URL}/api/auth/register", json=user_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data, "Response should contain 'token'"
        assert "user" in data, "Response should contain 'user'"
        assert data["user"]["email"] == user_data["email"]
        assert data["user"]["name"] == user_data["name"]
        assert "plan_type" in data["user"]
        print(f"✓ User registered: {data['user']['email']}")
    
    def test_register_duplicate_email_fails(self, api_client, registered_user):
        """POST /api/auth/register - Duplicate email should fail"""
        response = api_client.post(f"{BASE_URL}/api/auth/register", json=registered_user["credentials"])
        assert response.status_code == 400, f"Expected 400 for duplicate email, got {response.status_code}"
        print("✓ Duplicate email registration correctly rejected")
    
    def test_login_valid_credentials(self, api_client, registered_user):
        """POST /api/auth/login - Login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": registered_user["credentials"]["email"],
            "password": registered_user["credentials"]["password"]
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == registered_user["credentials"]["email"]
        print(f"✓ Login successful for: {data['user']['email']}")
    
    def test_login_invalid_credentials(self, api_client):
        """POST /api/auth/login - Invalid credentials should fail"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected")
    
    def test_get_me_with_auth(self, api_client, auth_headers, registered_user):
        """GET /api/auth/me - Get current user with auth"""
        response = api_client.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == registered_user["credentials"]["email"]
        print(f"✓ Get me returned user: {data['user']['email']}")
    
    def test_get_me_without_auth(self, api_client):
        """GET /api/auth/me - Without auth should fail"""
        response = api_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Get me without auth correctly rejected")


# ─── Destinations Endpoint Tests ────────────────────────

class TestDestinationsEndpoints:
    """Test /api/destinations endpoint"""
    
    def test_get_destinations_returns_6(self, api_client):
        """GET /api/destinations - Should return 6 Morocco destinations"""
        response = api_client.get(f"{BASE_URL}/api/destinations")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "destinations" in data
        assert len(data["destinations"]) == 6, f"Expected 6 destinations, got {len(data['destinations'])}"
        
        # Verify destination structure
        dest = data["destinations"][0]
        required_fields = ["id", "name", "subtitle", "description", "lat", "lng", "image", "safety"]
        for field in required_fields:
            assert field in dest, f"Destination missing field: {field}"
        
        # Verify known destinations
        dest_names = [d["name"] for d in data["destinations"]]
        assert "Marrakech" in dest_names
        assert "Fes" in dest_names
        assert "Chefchaouen" in dest_names
        print(f"✓ Got {len(data['destinations'])} destinations: {dest_names}")


# ─── Landmarks Endpoint Tests ───────────────────────────

class TestLandmarksEndpoints:
    """Test /api/landmarks/* endpoints"""
    
    def test_get_all_landmarks_returns_12(self, api_client):
        """GET /api/landmarks - Should return 12 landmarks"""
        response = api_client.get(f"{BASE_URL}/api/landmarks")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "landmarks" in data
        assert len(data["landmarks"]) == 12, f"Expected 12 landmarks, got {len(data['landmarks'])}"
        
        # Verify landmark structure
        landmark = data["landmarks"][0]
        required_fields = ["id", "name", "city", "type", "lat", "lng", "safety_level", "description"]
        for field in required_fields:
            assert field in landmark, f"Landmark missing field: {field}"
        print(f"✓ Got {len(data['landmarks'])} landmarks")
    
    def test_filter_landmarks_by_city(self, api_client):
        """GET /api/landmarks?city=Marrakech - Filter by city"""
        response = api_client.get(f"{BASE_URL}/api/landmarks?city=Marrakech")
        assert response.status_code == 200
        
        data = response.json()
        assert "landmarks" in data
        for landmark in data["landmarks"]:
            assert landmark["city"] == "Marrakech", f"Expected Marrakech, got {landmark['city']}"
        print(f"✓ Filtered by city: {len(data['landmarks'])} Marrakech landmarks")
    
    def test_filter_landmarks_by_type(self, api_client):
        """GET /api/landmarks?type=MOSQUE - Filter by type"""
        response = api_client.get(f"{BASE_URL}/api/landmarks?type=MOSQUE")
        assert response.status_code == 200
        
        data = response.json()
        assert "landmarks" in data
        for landmark in data["landmarks"]:
            assert landmark["type"] == "MOSQUE"
        print(f"✓ Filtered by type: {len(data['landmarks'])} MOSQUE landmarks")
    
    def test_filter_landmarks_by_safety(self, api_client):
        """GET /api/landmarks?safety=SAFE - Filter by safety level"""
        response = api_client.get(f"{BASE_URL}/api/landmarks?safety=SAFE")
        assert response.status_code == 200
        
        data = response.json()
        assert "landmarks" in data
        for landmark in data["landmarks"]:
            assert landmark["safety_level"] == "SAFE"
        print(f"✓ Filtered by safety: {len(data['landmarks'])} SAFE landmarks")
    
    def test_search_landmarks(self, api_client):
        """GET /api/landmarks?search=palace - Search landmarks"""
        response = api_client.get(f"{BASE_URL}/api/landmarks?search=palace")
        assert response.status_code == 200
        
        data = response.json()
        assert "landmarks" in data
        # Should find Bahia Palace
        assert len(data["landmarks"]) > 0, "Search should return results"
        print(f"✓ Search 'palace': {len(data['landmarks'])} results")
    
    def test_get_single_landmark(self, api_client):
        """GET /api/landmarks/{id} - Get single landmark"""
        response = api_client.get(f"{BASE_URL}/api/landmarks/lm-1")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == "lm-1"
        assert data["name"] == "Jemaa el-Fnaa"
        print(f"✓ Got landmark: {data['name']}")
    
    def test_get_nonexistent_landmark(self, api_client):
        """GET /api/landmarks/{id} - Nonexistent should return 404"""
        response = api_client.get(f"{BASE_URL}/api/landmarks/nonexistent-id")
        assert response.status_code == 404
        print("✓ Nonexistent landmark correctly returns 404")


# ─── Safety Endpoint Tests ──────────────────────────────

class TestSafetyEndpoints:
    """Test /api/safety/* endpoints"""
    
    def test_get_safety_report(self, api_client):
        """GET /api/safety/report - Get safety report"""
        response = api_client.get(f"{BASE_URL}/api/safety/report")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "score" in data
        assert "status" in data
        assert "alerts" in data
        assert "tips" in data
        assert "emergency" in data
        
        # Verify score is in valid range
        assert 0 <= data["score"] <= 100
        assert data["status"] in ["SAFE", "CAUTION", "AVOID"]
        
        # Verify emergency numbers
        assert data["emergency"]["police"] == "19"
        assert data["emergency"]["ambulance"] == "15"
        print(f"✓ Safety report: score={data['score']}, status={data['status']}")
    
    def test_get_safety_report_with_coords(self, api_client):
        """GET /api/safety/report?lat=...&lng=... - With coordinates"""
        response = api_client.get(f"{BASE_URL}/api/safety/report?lat=31.6295&lng=-7.9811")
        assert response.status_code == 200
        
        data = response.json()
        assert "score" in data
        print(f"✓ Safety report with coords: score={data['score']}")
    
    def test_trigger_emergency(self, api_client):
        """POST /api/safety/emergency - Trigger emergency alert"""
        emergency_data = {
            "lat": 31.6295,
            "lng": -7.9811,
            "message": "TEST emergency - please ignore"
        }
        
        response = api_client.post(f"{BASE_URL}/api/safety/emergency", json=emergency_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "id" in data
        assert "status" in data
        assert data["status"] == "Alert sent"
        print(f"✓ Emergency triggered: id={data['id']}")


# ─── Subscription Endpoint Tests ────────────────────────

class TestSubscriptionEndpoints:
    """Test /api/subscription/* endpoints"""
    
    def test_get_traveler_plans(self, api_client):
        """GET /api/subscription/plans - Get traveler plans"""
        response = api_client.get(f"{BASE_URL}/api/subscription/plans")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "plans" in data
        
        # Verify plan structure
        plans = data["plans"]
        assert "explorer" in plans
        assert "voyager" in plans
        assert "nomade" in plans
        
        # Verify explorer is free
        assert plans["explorer"]["price"] == 0
        print(f"✓ Got {len(plans)} traveler plans")
    
    def test_get_partner_plans(self, api_client):
        """GET /api/subscription/plans?plan_type=partner - Get partner plans"""
        response = api_client.get(f"{BASE_URL}/api/subscription/plans?plan_type=partner")
        assert response.status_code == 200
        
        data = response.json()
        assert "plans" in data
        plans = data["plans"]
        assert "free_listing" in plans
        assert "partner" in plans
        assert "partner_pro" in plans
        print(f"✓ Got {len(plans)} partner plans")
    
    def test_get_subscription_status_without_auth(self, api_client):
        """GET /api/subscription/status - Without auth returns default"""
        response = api_client.get(f"{BASE_URL}/api/subscription/status")
        assert response.status_code == 200
        
        data = response.json()
        assert data["plan_type"] == "traveler"
        assert data["plan_id"] == "explorer"
        assert data["authenticated"] == False
        print("✓ Subscription status without auth returns default explorer plan")
    
    def test_get_subscription_status_with_auth(self, api_client, auth_headers):
        """GET /api/subscription/status - With auth returns user's plan"""
        response = api_client.get(f"{BASE_URL}/api/subscription/status", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "plan_type" in data
        assert "plan_id" in data
        assert "limits" in data
        assert data["authenticated"] == True
        print(f"✓ Subscription status with auth: {data['plan_type']}/{data['plan_id']}")


# ─── Usage Endpoint Tests ───────────────────────────────

class TestUsageEndpoints:
    """Test /api/usage/* endpoints"""
    
    def test_check_feature_usage_without_auth(self, api_client):
        """GET /api/usage/check/{feature} - Check without auth"""
        response = api_client.get(f"{BASE_URL}/api/usage/check/ai_chat_messages_per_day")
        assert response.status_code == 200
        
        data = response.json()
        assert "feature" in data
        assert "allowed" in data
        assert "current" in data
        assert "limit" in data
        assert "message" in data
        print(f"✓ Usage check without auth: allowed={data['allowed']}, limit={data['limit']}")
    
    def test_check_feature_usage_with_auth(self, api_client, auth_headers):
        """GET /api/usage/check/{feature} - Check with auth"""
        response = api_client.get(
            f"{BASE_URL}/api/usage/check/ai_itinerary_per_day",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["feature"] == "ai_itinerary_per_day"
        print(f"✓ Usage check with auth: {data['feature']} - allowed={data['allowed']}")
    
    def test_track_usage_without_auth_fails(self, api_client):
        """POST /api/usage/track/{feature} - Without auth should fail"""
        response = api_client.post(f"{BASE_URL}/api/usage/track/ai_chat_messages_per_day")
        assert response.status_code == 401
        print("✓ Track usage without auth correctly rejected")
    
    def test_track_usage_with_auth(self, api_client, auth_headers):
        """POST /api/usage/track/{feature} - Track with auth"""
        response = api_client.post(
            f"{BASE_URL}/api/usage/track/ai_chat_messages_per_day",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "feature" in data
        assert "current" in data
        print(f"✓ Usage tracked: {data['feature']} - current={data['current']}")


# ─── Itinerary Endpoint Tests ───────────────────────────

class TestItineraryEndpoints:
    """Test /api/itineraries/* endpoints"""
    
    def test_generate_itinerary(self, api_client, auth_headers):
        """POST /api/itineraries/generate - Generate itinerary (with fallback)"""
        itinerary_data = {
            "destination": "Marrakech",
            "duration": 3,
            "traveler_type": "solo",
            "interests": ["culture", "food"],
            "budget": "midrange",
            "start_date": "2026-02-01"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/itineraries/generate",
            json=itinerary_data,
            headers=auth_headers,
            timeout=30  # AI calls may take time
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert "itinerary" in data
        
        itinerary = data["itinerary"]
        assert "title" in itinerary
        assert "days" in itinerary
        assert len(itinerary["days"]) == 3, f"Expected 3 days, got {len(itinerary['days'])}"
        print(f"✓ Itinerary generated: {itinerary['title']}")
        
        return data["id"]
    
    def test_get_itineraries_with_auth(self, api_client, auth_headers):
        """GET /api/itineraries - List user itineraries"""
        response = api_client.get(f"{BASE_URL}/api/itineraries", headers=auth_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "itineraries" in data
        print(f"✓ Got {len(data['itineraries'])} itineraries")
    
    def test_delete_itinerary(self, api_client, auth_headers):
        """DELETE /api/itineraries/{id} - Delete itinerary"""
        # First create an itinerary
        itinerary_data = {
            "destination": "Fes",
            "duration": 2,
            "traveler_type": "couple",
            "interests": ["history"],
            "budget": "budget",
            "start_date": "2026-03-01"
        }
        
        create_response = api_client.post(
            f"{BASE_URL}/api/itineraries/generate",
            json=itinerary_data,
            headers=auth_headers,
            timeout=30
        )
        assert create_response.status_code == 200
        itinerary_id = create_response.json()["id"]
        
        # Now delete it
        delete_response = api_client.delete(
            f"{BASE_URL}/api/itineraries/{itinerary_id}",
            headers=auth_headers
        )
        assert delete_response.status_code == 200
        
        data = delete_response.json()
        assert data["message"] == "Deleted"
        print(f"✓ Itinerary deleted: {itinerary_id}")
    
    def test_delete_nonexistent_itinerary(self, api_client, auth_headers):
        """DELETE /api/itineraries/{id} - Nonexistent should return 404"""
        response = api_client.delete(
            f"{BASE_URL}/api/itineraries/nonexistent-id",
            headers=auth_headers
        )
        assert response.status_code == 404
        print("✓ Delete nonexistent itinerary correctly returns 404")


# ─── Partner Endpoint Tests ─────────────────────────────

class TestPartnerEndpoints:
    """Test /api/partners/* endpoints"""
    
    def test_register_partner(self, api_client):
        """POST /api/partners/register - Register new partner"""
        unique_id = str(uuid.uuid4())[:8]
        partner_data = {
            "name": f"TEST_Partner_{unique_id}",
            "email": f"TEST_partner_{unique_id}@example.com",
            "password": "partnerpass123",
            "phone": "+212600000000",
            "business_name": f"TEST_Business_{unique_id}",
            "partner_type": "guide",
            "city": "Marrakech",
            "address": "123 Test Street",
            "description": "Test partner description",
            "license_number": "LIC123",
            "languages": ["french", "arabic", "english"],
            "years_experience": "5",
            "website": "https://test.com"
        }
        
        response = api_client.post(f"{BASE_URL}/api/partners/register", json=partner_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert "partner" in data
        assert data["user"]["plan_type"] == "partner"
        assert data["partner"]["status"] == "pending_verification"
        print(f"✓ Partner registered: {data['partner']['business_name']}")
        
        return data
    
    def test_get_partner_me_without_auth(self, api_client):
        """GET /api/partners/me - Without auth should fail"""
        response = api_client.get(f"{BASE_URL}/api/partners/me")
        assert response.status_code == 401
        print("✓ Get partner profile without auth correctly rejected")
    
    def test_list_partners(self, api_client):
        """GET /api/partners - List partners"""
        response = api_client.get(f"{BASE_URL}/api/partners")
        assert response.status_code == 200
        
        data = response.json()
        assert "partners" in data
        print(f"✓ Listed {len(data['partners'])} verified partners")
    
    def test_list_partners_unverified(self, api_client):
        """GET /api/partners?verified=false - List unverified partners"""
        response = api_client.get(f"{BASE_URL}/api/partners?verified=false")
        assert response.status_code == 200
        
        data = response.json()
        assert "partners" in data
        print(f"✓ Listed {len(data['partners'])} unverified partners")
    
    def test_get_partner_by_id_nonexistent(self, api_client):
        """GET /api/partners/{id} - Nonexistent should return 404"""
        response = api_client.get(f"{BASE_URL}/api/partners/nonexistent-id")
        assert response.status_code == 404
        print("✓ Get nonexistent partner correctly returns 404")


# ─── Chat Endpoint Tests ────────────────────────────────

class TestChatEndpoints:
    """Test /api/chat/* endpoints"""
    
    def test_send_chat_message(self, api_client):
        """POST /api/chat/send - Send chat message (with fallback)"""
        chat_data = {
            "content": "What are the best places to visit in Marrakech?",
            "session_id": None
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/chat/send",
            json=chat_data,
            timeout=30  # AI calls may take time
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "reply" in data
        assert "session_id" in data
        assert len(data["reply"]) > 0
        print(f"✓ Chat response received (session: {data['session_id'][:8]}...)")
        
        return data["session_id"]
    
    def test_get_chat_messages(self, api_client):
        """GET /api/chat/messages/{session_id} - Get chat history"""
        # First send a message to create a session
        chat_data = {"content": "Hello", "session_id": None}
        send_response = api_client.post(f"{BASE_URL}/api/chat/send", json=chat_data, timeout=30)
        assert send_response.status_code == 200
        session_id = send_response.json()["session_id"]
        
        # Now get messages
        response = api_client.get(f"{BASE_URL}/api/chat/messages/{session_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "messages" in data
        assert len(data["messages"]) >= 2  # User message + AI reply
        print(f"✓ Got {len(data['messages'])} messages for session")
    
    def test_continue_chat_session(self, api_client):
        """POST /api/chat/send - Continue existing session"""
        # Create session
        chat_data = {"content": "Tell me about Moroccan food", "session_id": None}
        response1 = api_client.post(f"{BASE_URL}/api/chat/send", json=chat_data, timeout=30)
        assert response1.status_code == 200
        session_id = response1.json()["session_id"]
        
        # Continue session
        chat_data2 = {"content": "What about tagine?", "session_id": session_id}
        response2 = api_client.post(f"{BASE_URL}/api/chat/send", json=chat_data2, timeout=30)
        assert response2.status_code == 200
        
        data = response2.json()
        assert data["session_id"] == session_id
        print(f"✓ Continued chat session successfully")


# ─── Run Tests ──────────────────────────────────────────

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
