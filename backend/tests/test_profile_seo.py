"""
Test suite for Profile API and SEO features - Iteration 6
Tests:
- PUT /api/auth/profile endpoint
- Profile field updates (name, phone, bio, travel_style, interests, avatar_color)
- Token refresh on name change
- SEO meta tags verification
"""
import pytest
import requests
import os
import re

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "phase1test@example.com"
TEST_PASSWORD = "password123"


class TestProfileAPI:
    """Profile endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token before each test"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data["token"]
        self.user_id = data["user"]["id"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_get_me_returns_profile_data(self):
        """GET /api/auth/me returns user profile with all fields"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "user" in data
        user = data["user"]
        
        # Verify required fields exist
        assert "id" in user
        assert "name" in user
        assert "email" in user
        assert user["email"] == TEST_EMAIL
        print(f"✓ GET /api/auth/me returns profile data for {user['email']}")
    
    def test_update_profile_phone(self):
        """PUT /api/auth/profile updates phone number"""
        test_phone = "+212 600 TEST 001"
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers=self.headers,
            json={"phone": test_phone}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["user"]["phone"] == test_phone
        assert data["token"] is None  # No token refresh for phone change
        print(f"✓ Phone updated to: {test_phone}")
    
    def test_update_profile_bio(self):
        """PUT /api/auth/profile updates bio"""
        test_bio = "Test bio for iteration 6 testing"
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers=self.headers,
            json={"bio": test_bio}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["user"]["bio"] == test_bio
        print(f"✓ Bio updated to: {test_bio}")
    
    def test_update_profile_travel_style(self):
        """PUT /api/auth/profile updates travel_style"""
        test_style = "cultural"
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers=self.headers,
            json={"travel_style": test_style}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["user"]["travel_style"] == test_style
        print(f"✓ Travel style updated to: {test_style}")
    
    def test_update_profile_interests(self):
        """PUT /api/auth/profile updates interests array"""
        test_interests = ["Medinas & Souks", "Beach & Coast", "Art & Crafts"]
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers=self.headers,
            json={"interests": test_interests}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["user"]["interests"] == test_interests
        print(f"✓ Interests updated to: {test_interests}")
    
    def test_update_profile_avatar_color(self):
        """PUT /api/auth/profile updates avatar_color"""
        test_color = "#8B5CF6"
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers=self.headers,
            json={"avatar_color": test_color}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["user"]["avatar_color"] == test_color
        print(f"✓ Avatar color updated to: {test_color}")
    
    def test_update_name_returns_new_token(self):
        """PUT /api/auth/profile returns new token when name changes"""
        # Update name
        new_name = "Test Explorer Token Check"
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers=self.headers,
            json={"name": new_name}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["user"]["name"] == new_name
        assert data["token"] is not None, "Token should be returned when name changes"
        assert len(data["token"]) > 50  # JWT tokens are long
        print(f"✓ Name change returns new token (length: {len(data['token'])})")
        
        # Restore original name
        restore_response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers={"Authorization": f"Bearer {data['token']}"},
            json={"name": "Test Explorer"}
        )
        assert restore_response.status_code == 200
        print("✓ Original name restored")
    
    def test_update_profile_no_fields_returns_400(self):
        """PUT /api/auth/profile with no fields returns 400"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            headers=self.headers,
            json={}
        )
        assert response.status_code == 400
        print("✓ Empty update returns 400 as expected")
    
    def test_update_profile_unauthorized(self):
        """PUT /api/auth/profile without token returns 401"""
        response = requests.put(
            f"{BASE_URL}/api/auth/profile",
            json={"name": "Unauthorized Test"}
        )
        assert response.status_code == 401
        print("✓ Unauthorized request returns 401")


class TestSEOMetaTags:
    """SEO meta tags verification tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Fetch homepage HTML once"""
        response = requests.get(BASE_URL)
        assert response.status_code == 200
        self.html = response.text
    
    def test_title_length_50_60_chars(self):
        """Title should be 50-60 characters for optimal SEO"""
        match = re.search(r'<title>([^<]+)</title>', self.html)
        assert match, "Title tag not found"
        title = match.group(1)
        title_len = len(title)
        assert 50 <= title_len <= 60, f"Title length {title_len} not in 50-60 range: '{title}'"
        print(f"✓ Title length: {title_len} chars - '{title}'")
    
    def test_canonical_has_trailing_slash(self):
        """Canonical URL should have trailing slash"""
        match = re.search(r'rel="canonical" href="([^"]+)"', self.html)
        assert match, "Canonical tag not found"
        canonical = match.group(1)
        assert canonical.endswith('/'), f"Canonical URL missing trailing slash: {canonical}"
        print(f"✓ Canonical URL has trailing slash: {canonical}")
    
    def test_og_image_is_actual_url(self):
        """og:image should point to actual image URL (not placeholder)"""
        match = re.search(r'property="og:image" content="([^"]+)"', self.html)
        assert match, "og:image tag not found"
        og_image = match.group(1)
        assert og_image.startswith('http'), f"og:image not a valid URL: {og_image}"
        assert 'placeholder' not in og_image.lower(), f"og:image appears to be placeholder: {og_image}"
        assert len(og_image) > 30, f"og:image URL too short: {og_image}"
        print(f"✓ og:image is actual URL: {og_image[:80]}...")
    
    def test_hreflang_self_referencing(self):
        """hreflang tags should include self-referencing en tag"""
        assert 'hreflang="en"' in self.html, "hreflang='en' not found"
        assert 'hreflang="x-default"' in self.html, "hreflang='x-default' not found"
        print("✓ hreflang tags present (en, x-default)")
    
    def test_keywords_include_brand_variations(self):
        """Keywords should include marocsphere, moroccosphere variations"""
        match = re.search(r'name="keywords" content="([^"]+)"', self.html)
        assert match, "Keywords meta tag not found"
        keywords = match.group(1).lower()
        assert 'marocsphere' in keywords, "marocsphere not in keywords"
        assert 'moroccosphere' in keywords, "moroccosphere not in keywords"
        assert 'maroc sphere' in keywords, "maroc sphere not in keywords"
        print("✓ Keywords include brand variations (marocsphere, moroccosphere, maroc sphere)")
    
    def test_json_ld_substack_in_sameas(self):
        """JSON-LD sameAs should include Substack link"""
        assert 'marocsphere.substack.com' in self.html, "Substack not in sameAs"
        print("✓ Substack link in JSON-LD sameAs")
    
    def test_json_ld_alternatename_variations(self):
        """JSON-LD alternateName should include brand variations"""
        assert '"alternateName"' in self.html, "alternateName not in JSON-LD"
        assert 'Maroc Sphere' in self.html, "Maroc Sphere not in alternateName"
        assert 'MoroccoSphere' in self.html, "MoroccoSphere not in alternateName"
        assert 'Moroccosphere' in self.html, "Moroccosphere not in alternateName"
        print("✓ JSON-LD alternateName includes brand variations")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
