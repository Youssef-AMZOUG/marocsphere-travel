"""
Iteration 7 Backend Tests - MarocSphere
Tests for: Forgot Password, Reset Password, Partner Stats/Bookings, Admin Email Notifications, Destinations
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "phase1test@example.com"
ADMIN_PASSWORD = "password123"


class TestForgotPasswordFlow:
    """Tests for forgot password and reset password endpoints"""
    
    def test_forgot_password_existing_user(self):
        """POST /api/auth/forgot-password returns reset token for existing user"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": ADMIN_EMAIL
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "message" in data
        assert "reset_token" in data, "Should return reset_token for existing user"
        print(f"✓ Forgot password returns token: {data['reset_token'][:8]}...")
    
    def test_forgot_password_nonexistent_user(self):
        """POST /api/auth/forgot-password returns success even for non-existent email (security)"""
        response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": f"nonexistent_{uuid.uuid4()}@example.com"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "message" in data
        # Should NOT return reset_token for non-existent user
        assert "reset_token" not in data or data.get("reset_token") is None
        print("✓ Forgot password for non-existent user returns generic message (no token)")
    
    def test_reset_password_invalid_token(self):
        """POST /api/auth/reset-password with invalid token returns 400"""
        response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": "invalid-token-12345",
            "new_password": "newpassword123"
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        print(f"✓ Invalid reset token returns 400: {data['detail']}")
    
    def test_full_password_reset_flow(self):
        """Full flow: forgot password -> reset password -> login with new password"""
        # Create a test user first
        test_email = f"TEST_reset_{uuid.uuid4().hex[:8]}@example.com"
        test_password = "original123"
        new_password = "newpassword456"
        
        # Register test user
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Test Reset User",
            "email": test_email,
            "password": test_password
        })
        assert reg_response.status_code == 200, f"Registration failed: {reg_response.text}"
        print(f"✓ Created test user: {test_email}")
        
        # Request password reset
        forgot_response = requests.post(f"{BASE_URL}/api/auth/forgot-password", json={
            "email": test_email
        })
        assert forgot_response.status_code == 200
        reset_token = forgot_response.json().get("reset_token")
        assert reset_token, "No reset token returned"
        print(f"✓ Got reset token: {reset_token[:8]}...")
        
        # Reset password
        reset_response = requests.post(f"{BASE_URL}/api/auth/reset-password", json={
            "token": reset_token,
            "new_password": new_password
        })
        assert reset_response.status_code == 200, f"Reset failed: {reset_response.text}"
        print("✓ Password reset successful")
        
        # Login with new password
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": new_password
        })
        assert login_response.status_code == 200, f"Login with new password failed: {login_response.text}"
        print("✓ Login with new password successful")
        
        # Verify old password no longer works
        old_login = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": test_password
        })
        assert old_login.status_code == 401, "Old password should not work"
        print("✓ Old password correctly rejected")


class TestPartnerAPIs:
    """Tests for partner stats, bookings, accept/decline endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.text}")
        return response.json()["token"]
    
    @pytest.fixture
    def partner_account(self):
        """Create a partner account for testing"""
        test_email = f"TEST_partner_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(f"{BASE_URL}/api/partners/register", json={
            "name": "Test Partner",
            "email": test_email,
            "password": "partner123",
            "phone": "+212600000000",
            "business_name": "Test Riad",
            "partner_type": "accommodation",
            "city": "Marrakech",
            "address": "123 Test Street",
            "description": "A test riad for testing",
            "license_number": "TEST123",
            "languages": ["en", "fr"],
            "years_experience": "5",
            "website": "https://test.com"
        })
        if response.status_code != 200:
            pytest.skip(f"Partner registration failed: {response.text}")
        data = response.json()
        return {
            "token": data["token"],
            "partner_id": data["partner"]["id"],
            "email": test_email
        }
    
    def test_partner_stats_requires_partner_account(self, admin_token):
        """GET /api/partners/stats returns 403 for non-partner (admin) accounts"""
        response = requests.get(f"{BASE_URL}/api/partners/stats", headers={
            "Authorization": f"Bearer {admin_token}"
        })
        # Admin is not a partner, should get 403
        assert response.status_code == 403, f"Expected 403 for admin, got {response.status_code}"
        print("✓ Partner stats correctly returns 403 for non-partner account")
    
    def test_partner_stats_for_partner(self, partner_account):
        """GET /api/partners/stats returns stats for partner accounts"""
        response = requests.get(f"{BASE_URL}/api/partners/stats", headers={
            "Authorization": f"Bearer {partner_account['token']}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify stats structure
        expected_fields = ["total_bookings", "pending_bookings", "confirmed_bookings", 
                          "completed_bookings", "cancelled_bookings", "total_revenue",
                          "this_month_revenue", "rating", "total_reviews", "views_this_month"]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        print(f"✓ Partner stats returned: {data}")
    
    def test_partner_bookings_for_partner(self, partner_account):
        """GET /api/partners/bookings returns booking list"""
        response = requests.get(f"{BASE_URL}/api/partners/bookings", headers={
            "Authorization": f"Bearer {partner_account['token']}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "bookings" in data
        assert isinstance(data["bookings"], list)
        print(f"✓ Partner bookings returned: {len(data['bookings'])} bookings")
    
    def test_partner_me_endpoint(self, partner_account):
        """GET /api/partners/me returns partner profile"""
        response = requests.get(f"{BASE_URL}/api/partners/me", headers={
            "Authorization": f"Bearer {partner_account['token']}"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "partner" in data
        assert data["partner"]["id"] == partner_account["partner_id"]
        print(f"✓ Partner profile returned: {data['partner']['business_name']}")
    
    def test_booking_accept_not_found(self, partner_account):
        """POST /api/partners/bookings/{id}/accept returns 404 for non-existent booking"""
        response = requests.post(f"{BASE_URL}/api/partners/bookings/nonexistent-id/accept", headers={
            "Authorization": f"Bearer {partner_account['token']}"
        })
        assert response.status_code == 404
        print("✓ Accept non-existent booking returns 404")
    
    def test_booking_decline_not_found(self, partner_account):
        """POST /api/partners/bookings/{id}/decline returns 404 for non-existent booking"""
        response = requests.post(f"{BASE_URL}/api/partners/bookings/nonexistent-id/decline", headers={
            "Authorization": f"Bearer {partner_account['token']}"
        })
        assert response.status_code == 404
        print("✓ Decline non-existent booking returns 404")


class TestAdminEmailNotifications:
    """Tests for admin partner approve/reject with email notifications"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.text}")
        return response.json()["token"]
    
    @pytest.fixture
    def pending_partner(self):
        """Create a pending partner for testing"""
        test_email = f"TEST_pending_{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(f"{BASE_URL}/api/partners/register", json={
            "name": "Pending Partner",
            "email": test_email,
            "password": "pending123",
            "phone": "+212600000001",
            "business_name": f"Pending Riad {uuid.uuid4().hex[:4]}",
            "partner_type": "guide",
            "city": "Fes",
            "address": "456 Pending Street",
            "description": "A pending partner for testing",
            "license_number": "PEND123",
            "languages": ["en"],
            "years_experience": "3",
            "website": ""
        })
        if response.status_code != 200:
            pytest.skip(f"Partner registration failed: {response.text}")
        data = response.json()
        return {
            "partner_id": data["partner"]["id"],
            "email": test_email
        }
    
    def test_admin_approve_partner_with_email(self, admin_token, pending_partner):
        """POST /api/admin/partners/{id}/approve includes email_sent_to in response"""
        response = requests.post(
            f"{BASE_URL}/api/admin/partners/{pending_partner['partner_id']}/approve",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "message" in data
        assert "partner_id" in data
        assert "email_sent_to" in data, "Response should include email_sent_to field"
        assert data["email_sent_to"] == pending_partner["email"]
        print(f"✓ Partner approved, email_sent_to: {data['email_sent_to']}")
    
    def test_admin_reject_partner_with_email(self, admin_token):
        """POST /api/admin/partners/{id}/reject includes email_sent_to in response"""
        # Create another pending partner for rejection
        test_email = f"TEST_reject_{uuid.uuid4().hex[:8]}@example.com"
        reg_response = requests.post(f"{BASE_URL}/api/partners/register", json={
            "name": "Reject Partner",
            "email": test_email,
            "password": "reject123",
            "phone": "+212600000002",
            "business_name": f"Reject Riad {uuid.uuid4().hex[:4]}",
            "partner_type": "transport",
            "city": "Casablanca",
            "address": "789 Reject Street",
            "description": "A partner to be rejected",
            "license_number": "REJ123",
            "languages": ["fr"],
            "years_experience": "2",
            "website": ""
        })
        assert reg_response.status_code == 200
        partner_id = reg_response.json()["partner"]["id"]
        
        # Reject the partner
        response = requests.post(
            f"{BASE_URL}/api/admin/partners/{partner_id}/reject",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "message" in data
        assert "partner_id" in data
        assert "email_sent_to" in data, "Response should include email_sent_to field"
        assert data["email_sent_to"] == test_email
        print(f"✓ Partner rejected, email_sent_to: {data['email_sent_to']}")


class TestDestinationsAPI:
    """Tests for destinations endpoint"""
    
    def test_get_destinations(self):
        """GET /api/destinations returns list of destinations"""
        response = requests.get(f"{BASE_URL}/api/destinations")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "destinations" in data
        assert isinstance(data["destinations"], list)
        print(f"✓ Destinations returned: {len(data['destinations'])} destinations")
        
        # If destinations exist, verify structure
        if data["destinations"]:
            dest = data["destinations"][0]
            expected_fields = ["id", "name", "image", "rating"]
            for field in expected_fields:
                assert field in dest, f"Destination missing field: {field}"
            print(f"✓ First destination: {dest['name']}")


class TestAuthEndpoints:
    """Basic auth endpoint tests"""
    
    def test_login_success(self):
        """POST /api/auth/login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"✓ Login successful for {data['user']['email']}")
    
    def test_login_invalid_credentials(self):
        """POST /api/auth/login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials returns 401")
    
    def test_me_endpoint_authenticated(self):
        """GET /api/auth/me with valid token"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Get profile
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        print(f"✓ /api/auth/me returned user: {data['user']['email']}")
    
    def test_me_endpoint_unauthenticated(self):
        """GET /api/auth/me without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✓ /api/auth/me without token returns 401")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
