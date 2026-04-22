"""
MarocSphere Admin & Reviews API Test Suite
Tests admin back-office and reviews/ratings features
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
def admin_credentials():
    """Admin user credentials (already promoted to admin)"""
    return {
        "email": "phase1test@example.com",
        "password": "password123"
    }


@pytest.fixture(scope="session")
def admin_token(api_client, admin_credentials):
    """Get admin user token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=admin_credentials)
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip(f"Could not login admin user: {response.text}")


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    """Return authorization headers for admin requests"""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def regular_user_credentials():
    """Generate unique regular user credentials"""
    unique_id = str(uuid.uuid4())[:8]
    return {
        "name": f"TEST_RegularUser_{unique_id}",
        "email": f"TEST_regular_{unique_id}@example.com",
        "password": "testpassword123"
    }


@pytest.fixture(scope="session")
def regular_user_token(api_client, regular_user_credentials):
    """Register and get token for regular (non-admin) user"""
    response = api_client.post(f"{BASE_URL}/api/auth/register", json=regular_user_credentials)
    if response.status_code == 200:
        return response.json()["token"]
    elif response.status_code == 400:
        # User exists, try login
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": regular_user_credentials["email"],
            "password": regular_user_credentials["password"]
        })
        if login_response.status_code == 200:
            return login_response.json()["token"]
    pytest.skip("Could not register or login regular user")


@pytest.fixture(scope="session")
def regular_headers(regular_user_token):
    """Return authorization headers for regular user requests"""
    return {"Authorization": f"Bearer {regular_user_token}"}


# ─── Admin Stats Tests ──────────────────────────────────

class TestAdminStats:
    """Test GET /api/admin/stats - Platform statistics"""
    
    def test_admin_stats_with_admin_auth(self, api_client, admin_headers):
        """GET /api/admin/stats - Admin should get platform stats"""
        response = api_client.get(f"{BASE_URL}/api/admin/stats", headers=admin_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        required_fields = [
            "total_users", "total_partners", "pending_verifications",
            "verified_partners", "total_revenue", "total_itineraries",
            "total_reviews", "pending_flags"
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"✓ Admin stats: users={data['total_users']}, partners={data['total_partners']}, reviews={data['total_reviews']}")
    
    def test_admin_stats_without_auth_fails(self, api_client):
        """GET /api/admin/stats - Without auth should fail"""
        response = api_client.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Admin stats without auth correctly rejected")
    
    def test_admin_stats_with_regular_user_fails(self, api_client, regular_headers):
        """GET /api/admin/stats - Regular user should get 403"""
        response = api_client.get(f"{BASE_URL}/api/admin/stats", headers=regular_headers)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Admin stats with regular user correctly rejected (403)")


# ─── Admin Pending Partners Tests ───────────────────────

class TestAdminPendingPartners:
    """Test GET /api/admin/partners/pending - List pending partner verifications"""
    
    def test_get_pending_partners_with_admin(self, api_client, admin_headers):
        """GET /api/admin/partners/pending - Admin should get pending partners"""
        response = api_client.get(f"{BASE_URL}/api/admin/partners/pending", headers=admin_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "partners" in data, "Response should contain 'partners'"
        
        # If there are pending partners, verify structure
        if len(data["partners"]) > 0:
            partner = data["partners"][0]
            assert "id" in partner
            assert "business_name" in partner
            assert "status" in partner
            print(f"✓ Got {len(data['partners'])} pending partners")
        else:
            print("✓ No pending partners (empty list)")
    
    def test_get_pending_partners_without_auth_fails(self, api_client):
        """GET /api/admin/partners/pending - Without auth should fail"""
        response = api_client.get(f"{BASE_URL}/api/admin/partners/pending")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Pending partners without auth correctly rejected")
    
    def test_get_pending_partners_with_regular_user_fails(self, api_client, regular_headers):
        """GET /api/admin/partners/pending - Regular user should get 403"""
        response = api_client.get(f"{BASE_URL}/api/admin/partners/pending", headers=regular_headers)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Pending partners with regular user correctly rejected (403)")


# ─── Admin Partner Approve/Reject Tests ─────────────────

class TestAdminPartnerActions:
    """Test POST /api/admin/partners/{id}/approve and /reject"""
    
    @pytest.fixture(scope="class")
    def test_partner(self, api_client):
        """Create a test partner for approval/rejection tests"""
        unique_id = str(uuid.uuid4())[:8]
        partner_data = {
            "name": f"TEST_ApprovalPartner_{unique_id}",
            "email": f"TEST_approval_{unique_id}@example.com",
            "password": "partnerpass123",
            "phone": "+212600000001",
            "business_name": f"TEST_ApprovalBusiness_{unique_id}",
            "partner_type": "guide",
            "city": "Marrakech",
            "address": "Test Address",
            "description": "Test partner for approval testing",
            "license_number": f"LIC{unique_id}",
            "languages": ["english", "french"],
            "years_experience": "3"
        }
        
        response = api_client.post(f"{BASE_URL}/api/partners/register", json=partner_data)
        if response.status_code == 200:
            return response.json()["partner"]
        pytest.skip(f"Could not create test partner: {response.text}")
    
    def test_approve_partner_with_admin(self, api_client, admin_headers, test_partner):
        """POST /api/admin/partners/{id}/approve - Admin can approve partner"""
        partner_id = test_partner["id"]
        response = api_client.post(
            f"{BASE_URL}/api/admin/partners/{partner_id}/approve",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data
        assert data["partner_id"] == partner_id
        print(f"✓ Partner approved: {partner_id}")
    
    def test_approve_nonexistent_partner_fails(self, api_client, admin_headers):
        """POST /api/admin/partners/{id}/approve - Nonexistent partner should 404"""
        response = api_client.post(
            f"{BASE_URL}/api/admin/partners/nonexistent-id/approve",
            headers=admin_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Approve nonexistent partner correctly returns 404")
    
    def test_reject_partner_with_admin(self, api_client, admin_headers):
        """POST /api/admin/partners/{id}/reject - Admin can reject partner"""
        # Create a new partner to reject
        unique_id = str(uuid.uuid4())[:8]
        partner_data = {
            "name": f"TEST_RejectPartner_{unique_id}",
            "email": f"TEST_reject_{unique_id}@example.com",
            "password": "partnerpass123",
            "phone": "+212600000002",
            "business_name": f"TEST_RejectBusiness_{unique_id}",
            "partner_type": "riad",
            "city": "Fes",
            "address": "Test Address",
            "description": "Test partner for rejection testing",
            "license_number": f"LIC{unique_id}",
            "languages": ["arabic"],
            "years_experience": "2"
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/partners/register", json=partner_data)
        assert create_response.status_code == 200
        partner_id = create_response.json()["partner"]["id"]
        
        # Now reject
        response = api_client.post(
            f"{BASE_URL}/api/admin/partners/{partner_id}/reject",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data
        assert data["partner_id"] == partner_id
        print(f"✓ Partner rejected: {partner_id}")
    
    def test_approve_without_admin_fails(self, api_client, regular_headers, test_partner):
        """POST /api/admin/partners/{id}/approve - Regular user should get 403"""
        partner_id = test_partner["id"]
        response = api_client.post(
            f"{BASE_URL}/api/admin/partners/{partner_id}/approve",
            headers=regular_headers
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Approve with regular user correctly rejected (403)")


# ─── Admin Content Flags Tests ──────────────────────────

class TestAdminContentFlags:
    """Test GET /api/admin/flags and POST /api/admin/flags/{id}/resolve"""
    
    def test_get_content_flags_with_admin(self, api_client, admin_headers):
        """GET /api/admin/flags - Admin should get content flags"""
        response = api_client.get(f"{BASE_URL}/api/admin/flags", headers=admin_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "flags" in data, "Response should contain 'flags'"
        
        if len(data["flags"]) > 0:
            flag = data["flags"][0]
            assert "id" in flag
            assert "type" in flag
            assert "status" in flag
            print(f"✓ Got {len(data['flags'])} content flags")
        else:
            print("✓ No content flags (empty list)")
    
    def test_get_content_flags_without_auth_fails(self, api_client):
        """GET /api/admin/flags - Without auth should fail"""
        response = api_client.get(f"{BASE_URL}/api/admin/flags")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Content flags without auth correctly rejected")
    
    def test_get_content_flags_with_regular_user_fails(self, api_client, regular_headers):
        """GET /api/admin/flags - Regular user should get 403"""
        response = api_client.get(f"{BASE_URL}/api/admin/flags", headers=regular_headers)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Content flags with regular user correctly rejected (403)")
    
    def test_resolve_nonexistent_flag_fails(self, api_client, admin_headers):
        """POST /api/admin/flags/{id}/resolve - Nonexistent flag should 404"""
        response = api_client.post(
            f"{BASE_URL}/api/admin/flags/nonexistent-id/resolve",
            headers=admin_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Resolve nonexistent flag correctly returns 404")


# ─── Admin Activity Log Tests ───────────────────────────

class TestAdminActivityLog:
    """Test GET /api/admin/activity - Admin activity log"""
    
    def test_get_activity_log_with_admin(self, api_client, admin_headers):
        """GET /api/admin/activity - Admin should get activity log"""
        response = api_client.get(f"{BASE_URL}/api/admin/activity", headers=admin_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "activity" in data, "Response should contain 'activity'"
        
        if len(data["activity"]) > 0:
            activity = data["activity"][0]
            assert "id" in activity
            assert "action" in activity
            assert "created_at" in activity
            print(f"✓ Got {len(data['activity'])} activity entries")
        else:
            print("✓ No activity entries (empty list)")
    
    def test_get_activity_log_without_auth_fails(self, api_client):
        """GET /api/admin/activity - Without auth should fail"""
        response = api_client.get(f"{BASE_URL}/api/admin/activity")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Activity log without auth correctly rejected")
    
    def test_get_activity_log_with_regular_user_fails(self, api_client, regular_headers):
        """GET /api/admin/activity - Regular user should get 403"""
        response = api_client.get(f"{BASE_URL}/api/admin/activity", headers=regular_headers)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Activity log with regular user correctly rejected (403)")


# ─── Admin Seed Tests ───────────────────────────────────

class TestAdminSeed:
    """Test POST /api/admin/seed - Promote user to admin"""
    
    def test_seed_without_auth_fails(self, api_client):
        """POST /api/admin/seed - Without auth should fail"""
        response = api_client.post(f"{BASE_URL}/api/admin/seed")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Admin seed without auth correctly rejected")
    
    def test_seed_with_auth_promotes_user(self, api_client, regular_headers):
        """POST /api/admin/seed - With auth should promote user"""
        # Note: This will promote the regular user to admin
        # We test this last to avoid affecting other tests
        response = api_client.post(f"{BASE_URL}/api/admin/seed", headers=regular_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data
        assert "user_id" in data
        print(f"✓ User promoted to admin: {data['user_id']}")


# ─── Reviews CRUD Tests ─────────────────────────────────

class TestReviewsCRUD:
    """Test /api/reviews CRUD operations"""
    
    @pytest.fixture(scope="class")
    def created_review_id(self, api_client, admin_headers):
        """Create a review and return its ID for other tests"""
        unique_id = str(uuid.uuid4())[:8]
        review_data = {
            "target_type": "landmark",
            "target_id": f"lm-test-{unique_id}",
            "rating": 5,
            "title": f"TEST_Review_{unique_id}",
            "content": "This is a test review for testing purposes."
        }
        
        response = api_client.post(f"{BASE_URL}/api/reviews", json=review_data, headers=admin_headers)
        if response.status_code == 200:
            return response.json()["id"]
        # If duplicate, that's okay for testing
        return None
    
    def test_create_review_with_auth(self, api_client, admin_headers):
        """POST /api/reviews - Create review with auth"""
        unique_id = str(uuid.uuid4())[:8]
        review_data = {
            "target_type": "landmark",
            "target_id": f"lm-create-{unique_id}",
            "rating": 4,
            "title": f"TEST_CreateReview_{unique_id}",
            "content": "Great place to visit! Highly recommended."
        }
        
        response = api_client.post(f"{BASE_URL}/api/reviews", json=review_data, headers=admin_headers)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert "review" in data
        assert data["review"]["rating"] == 4
        assert data["review"]["content"] == review_data["content"]
        print(f"✓ Review created: {data['id']}")
    
    def test_create_review_without_auth_fails(self, api_client):
        """POST /api/reviews - Without auth should fail"""
        review_data = {
            "target_type": "landmark",
            "target_id": "lm-1",
            "rating": 5,
            "content": "Test review"
        }
        
        response = api_client.post(f"{BASE_URL}/api/reviews", json=review_data)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Create review without auth correctly rejected")
    
    def test_create_duplicate_review_fails(self, api_client, admin_headers):
        """POST /api/reviews - Duplicate review should fail"""
        unique_id = str(uuid.uuid4())[:8]
        review_data = {
            "target_type": "landmark",
            "target_id": f"lm-dup-{unique_id}",
            "rating": 5,
            "content": "First review"
        }
        
        # Create first review
        response1 = api_client.post(f"{BASE_URL}/api/reviews", json=review_data, headers=admin_headers)
        assert response1.status_code == 200
        
        # Try to create duplicate
        review_data["content"] = "Second review attempt"
        response2 = api_client.post(f"{BASE_URL}/api/reviews", json=review_data, headers=admin_headers)
        assert response2.status_code == 400, f"Expected 400 for duplicate, got {response2.status_code}"
        print("✓ Duplicate review correctly rejected")
    
    def test_get_reviews_for_target(self, api_client):
        """GET /api/reviews?target_type=landmark&target_id=lm-1 - Get reviews with stats"""
        response = api_client.get(f"{BASE_URL}/api/reviews?target_type=landmark&target_id=lm-1")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "reviews" in data
        assert "stats" in data
        
        # Stats should have rating breakdown
        if data["stats"]:
            assert "avg_rating" in data["stats"]
            assert "total" in data["stats"]
            print(f"✓ Got {len(data['reviews'])} reviews for lm-1, avg rating: {data['stats'].get('avg_rating', 'N/A')}")
        else:
            print(f"✓ Got {len(data['reviews'])} reviews for lm-1 (no stats)")
    
    def test_get_all_published_reviews(self, api_client):
        """GET /api/reviews - Get all published reviews"""
        response = api_client.get(f"{BASE_URL}/api/reviews")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "reviews" in data
        
        # All reviews should be published
        for review in data["reviews"]:
            assert review.get("status") == "published", f"Review {review.get('id')} is not published"
        
        print(f"✓ Got {len(data['reviews'])} published reviews")
    
    def test_delete_own_review(self, api_client, admin_headers):
        """DELETE /api/reviews/{id} - Delete own review"""
        # First create a review
        unique_id = str(uuid.uuid4())[:8]
        review_data = {
            "target_type": "landmark",
            "target_id": f"lm-del-{unique_id}",
            "rating": 3,
            "content": "Review to be deleted"
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/reviews", json=review_data, headers=admin_headers)
        assert create_response.status_code == 200
        review_id = create_response.json()["id"]
        
        # Now delete it
        delete_response = api_client.delete(f"{BASE_URL}/api/reviews/{review_id}", headers=admin_headers)
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
        
        data = delete_response.json()
        assert data["message"] == "Review deleted"
        print(f"✓ Review deleted: {review_id}")
    
    def test_delete_review_without_auth_fails(self, api_client):
        """DELETE /api/reviews/{id} - Without auth should fail"""
        response = api_client.delete(f"{BASE_URL}/api/reviews/some-id")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Delete review without auth correctly rejected")
    
    def test_delete_nonexistent_review_fails(self, api_client, admin_headers):
        """DELETE /api/reviews/{id} - Nonexistent review should 404"""
        response = api_client.delete(f"{BASE_URL}/api/reviews/nonexistent-id", headers=admin_headers)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Delete nonexistent review correctly returns 404")


# ─── Reviews Flag Tests ─────────────────────────────────

class TestReviewsFlag:
    """Test POST /api/reviews/{id}/flag - Flag a review"""
    
    @pytest.fixture(scope="class")
    def review_to_flag(self, api_client, admin_headers):
        """Create a review to flag"""
        unique_id = str(uuid.uuid4())[:8]
        review_data = {
            "target_type": "landmark",
            "target_id": f"lm-flag-{unique_id}",
            "rating": 2,
            "content": "Review that will be flagged for testing"
        }
        
        response = api_client.post(f"{BASE_URL}/api/reviews", json=review_data, headers=admin_headers)
        if response.status_code == 200:
            return response.json()["id"]
        pytest.skip("Could not create review to flag")
    
    def test_flag_review_with_auth(self, api_client, admin_headers, review_to_flag):
        """POST /api/reviews/{id}/flag - Flag review with auth"""
        flag_data = {"reason": "Inappropriate content - test flag"}
        
        response = api_client.post(
            f"{BASE_URL}/api/reviews/{review_to_flag}/flag",
            json=flag_data,
            headers=admin_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "flag_id" in data
        assert "message" in data
        print(f"✓ Review flagged: {review_to_flag}, flag_id: {data['flag_id']}")
    
    def test_flag_review_without_auth_fails(self, api_client, review_to_flag):
        """POST /api/reviews/{id}/flag - Without auth should fail"""
        flag_data = {"reason": "Test flag"}
        
        response = api_client.post(
            f"{BASE_URL}/api/reviews/{review_to_flag}/flag",
            json=flag_data
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Flag review without auth correctly rejected")
    
    def test_flag_nonexistent_review_fails(self, api_client, admin_headers):
        """POST /api/reviews/{id}/flag - Nonexistent review should 404"""
        flag_data = {"reason": "Test flag"}
        
        response = api_client.post(
            f"{BASE_URL}/api/reviews/nonexistent-id/flag",
            json=flag_data,
            headers=admin_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Flag nonexistent review correctly returns 404")


# ─── Reviews Helpful Tests ──────────────────────────────

class TestReviewsHelpful:
    """Test POST /api/reviews/{id}/helpful - Mark review as helpful"""
    
    @pytest.fixture(scope="class")
    def review_for_helpful(self, api_client, admin_headers):
        """Create a review to mark as helpful"""
        unique_id = str(uuid.uuid4())[:8]
        review_data = {
            "target_type": "landmark",
            "target_id": f"lm-helpful-{unique_id}",
            "rating": 5,
            "content": "Very helpful review for testing"
        }
        
        response = api_client.post(f"{BASE_URL}/api/reviews", json=review_data, headers=admin_headers)
        if response.status_code == 200:
            return response.json()["id"]
        pytest.skip("Could not create review for helpful test")
    
    def test_mark_helpful_with_auth(self, api_client, admin_headers, review_for_helpful):
        """POST /api/reviews/{id}/helpful - Mark as helpful with auth"""
        response = api_client.post(
            f"{BASE_URL}/api/reviews/{review_for_helpful}/helpful",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data
        print(f"✓ Review marked as helpful: {review_for_helpful}")
    
    def test_mark_helpful_without_auth_fails(self, api_client, review_for_helpful):
        """POST /api/reviews/{id}/helpful - Without auth should fail"""
        response = api_client.post(f"{BASE_URL}/api/reviews/{review_for_helpful}/helpful")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Mark helpful without auth correctly rejected")
    
    def test_mark_helpful_nonexistent_review_fails(self, api_client, admin_headers):
        """POST /api/reviews/{id}/helpful - Nonexistent review should 404"""
        response = api_client.post(
            f"{BASE_URL}/api/reviews/nonexistent-id/helpful",
            headers=admin_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Mark helpful nonexistent review correctly returns 404")


# ─── Run Tests ──────────────────────────────────────────

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
