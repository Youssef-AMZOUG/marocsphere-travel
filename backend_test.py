import requests
import sys
from datetime import datetime
import json

class MarocSphereAPITester:
    def __init__(self, base_url="https://forgot-password-flow-5.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10, params={'authorization': f'Bearer {self.token}'} if self.token and endpoint == '/auth/me' else None)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=15)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            print(f"   Status: {response.status_code}")
            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - {name}")
                try:
                    return True, response.json() if response.text else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "/", 200)

    def test_destinations(self):
        """Test destinations endpoint"""
        success, response = self.run_test("Get Destinations", "GET", "/destinations", 200)
        if success and 'destinations' in response:
            print(f"   Found {len(response['destinations'])} destinations")
            return True
        return False

    def test_landmarks(self):
        """Test landmarks endpoint"""
        success, response = self.run_test("Get All Landmarks", "GET", "/landmarks", 200)
        if success and 'landmarks' in response:
            print(f"   Found {len(response['landmarks'])} landmarks")
            
            # Test filtering
            self.run_test("Filter Landmarks by City", "GET", "/landmarks?city=Marrakech", 200)
            self.run_test("Filter Landmarks by Type", "GET", "/landmarks?type=MOSQUE", 200)
            self.run_test("Filter Landmarks by Safety", "GET", "/landmarks?safety=SAFE", 200)
            self.run_test("Search Landmarks", "GET", "/landmarks?search=Jemaa", 200)
            return True
        return False

    def test_safety_report(self):
        """Test safety report endpoint"""
        success, response = self.run_test("Get Safety Report", "GET", "/safety/report", 200)
        if success and 'score' in response and 'alerts' in response:
            print(f"   Safety score: {response['score']}, Status: {response['status']}")
            print(f"   Alerts count: {len(response['alerts'])}")
            return True
        return False

    def test_user_registration(self):
        """Test user registration"""
        test_email = f"test_user_{datetime.now().strftime('%H%M%S')}@marocsphere.com"
        self.test_email = test_email  # Store for login test
        user_data = {
            "name": "Test User",
            "email": test_email,
            "password": "TestPass123!"
        }
        
        success, response = self.run_test("User Registration", "POST", "/auth/register", 200, user_data)
        if success and 'token' in response and 'user' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   User created: {response['user']['name']} ({response['user']['email']})")
            return True
        return False

    def test_user_login(self):
        """Test user login with existing user"""
        if not hasattr(self, 'test_email'):
            print("❌ No test email stored for login test")
            return False
            
        # Try to login with same credentials used for registration
        login_data = {
            "email": self.test_email,
            "password": "TestPass123!"
        }
        
        success, response = self.run_test("User Login", "POST", "/auth/login", 200, login_data)
        if success and 'token' in response:
            self.token = response['token']  # Update token for subsequent tests
            print(f"   Login successful for: {response['user']['email']}")
            return True
        return False

    def test_get_current_user(self):
        """Test getting current user info"""
        if not self.token:
            print("❌ No token available for user test")
            return False
            
        return self.run_test("Get Current User", "GET", "/auth/me", 200)[0]

    def test_itinerary_generation(self):
        """Test AI itinerary generation"""
        itinerary_data = {
            "destination": "Marrakech",
            "duration": 3,
            "traveler_type": "couple",
            "interests": ["history", "food"],
            "budget": "midrange",
            "start_date": "2026-09-01"
        }
        
        success, response = self.run_test("Generate Itinerary", "POST", "/itineraries/generate", 200, itinerary_data)
        if success and 'itinerary' in response:
            print(f"   Generated itinerary with ID: {response.get('id')}")
            return True, response.get('id')
        return False, None

    def test_get_itineraries(self):
        """Test getting user's itineraries"""
        return self.run_test("Get User Itineraries", "GET", "/itineraries", 200)[0]

    def test_chat_functionality(self):
        """Test AI chat functionality"""
        chat_data = {
            "content": "What's the best time to visit Marrakech?",
            "session_id": None
        }
        
        success, response = self.run_test("AI Chat Send", "POST", "/chat/send", 200, chat_data)
        if success and 'reply' in response and 'session_id' in response:
            print(f"   AI replied: {response['reply'][:100]}...")
            session_id = response['session_id']
            
            # Test getting chat history
            self.run_test("Get Chat Messages", "GET", f"/chat/messages/{session_id}", 200)
            return True
        return False

    def test_emergency_sos(self):
        """Test emergency SOS functionality"""
        sos_data = {
            "lat": 31.6295,
            "lng": -7.9811,
            "message": "Test emergency alert"
        }
        
        success, response = self.run_test("Emergency SOS", "POST", "/safety/emergency", 200, sos_data)
        if success and 'id' in response and 'status' in response:
            print(f"   Emergency ID: {response['id']}, Status: {response['status']}")
            return True
        return False

def main():
    print("🚀 Starting MarocSphere API Tests")
    print("=" * 50)
    
    tester = MarocSphereAPITester()
    
    # Run basic endpoint tests
    print("\n📍 BASIC ENDPOINTS")
    tester.test_root_endpoint()
    tester.test_destinations()
    tester.test_landmarks()
    tester.test_safety_report()
    
    # Run authentication tests
    print("\n🔐 AUTHENTICATION")
    tester.test_user_registration()
    tester.test_user_login()
    tester.test_get_current_user()
    
    # Run AI functionality tests
    print("\n🤖 AI FEATURES")
    tester.test_chat_functionality()
    itinerary_success, itinerary_id = tester.test_itinerary_generation()
    tester.test_get_itineraries()
    
    # Run safety tests
    print("\n🛡️ SAFETY FEATURES")
    tester.test_emergency_sos()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"❌ {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())