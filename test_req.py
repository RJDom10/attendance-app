import urllib.request
import json

data = json.dumps({
    "name": "Test Prof",
    "email": "test@prof.com",
    "password": "password123"
}).encode('utf-8')

req = urllib.request.Request('http://localhost:8000/api/v1/professors/', data=data, headers={'Content-Type': 'application/json'}, method='POST')
try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Body:", response.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
