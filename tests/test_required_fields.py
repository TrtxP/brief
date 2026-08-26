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

print("=== Test Required Fields Backend Validation ===\n")

# Test 1: Only Q1 and Q2 filled, all other required fields empty
print("Test 1: Submit with only name + phone (missing 14 required fields)")
code1, data1 = send_submission({
    'client_name': 'Тестовий Рибалка',
    'phone': '+380501234567',
    'answers': {
        '1': 'Тестовий Рибалка',
        '2': '+380501234567'
    }
})
print(f"  HTTP {code1}, Status: {data1.get('status')}")
if code1 == 201:
    print(f"  Ref: {data1.get('data', {}).get('reference_code')}")
print(f"  Message: {data1.get('message', '')[:120]}")

# Test 2: All required fields filled properly
print("\nTest 2: Submit with ALL required fields filled")
code2, data2 = send_submission({
    'client_name': 'Василь Олексійович',
    'phone': '+380671234567',
    'answers': {
        '1': 'Василь Олексійович',
        '2': '+380671234567',
        '6': 'Дніпровський Спінінг',
        '7': ['Запуск бізнесу з нуля', 'Автоматизація продажів'],
        '8': ['Складність вибору для новачків'],
        '9': ['Низькі ціни та акції', 'Швидка доставка день-у-день'],
        '14': ['Любителі вихідного дня', 'Рибалки-спінінгісти'],
        '16': 'Локальний / Національний ринок (Робота виключно в межах України, інтерфейс українською мовою)',
        '18': ['Фільтрація за характеристиками (тест вудилища, довжина, вага)'],
        '19': ['Нова Пошта', 'Укрпошта'],
        '20': ['Онлайн-оплата карткою на сайті (Apple Pay, Google Pay, Visa/Mastercard)'],
        '22': 'Так, з історією замовлень та системою лояльності',
        '24': 'Еко-стиль: спокій, затишок, дика природа (зелені, коричневі тони)',
        '28': '1 - 3 місяці',
        '29': '1000$ - 3000$',
        '31': 'Повністю готовий до роботи сайт інтернет-магазину риболовлі',
        '34': 'Потрібна інтеграція з Новою Поштою та 1С.'
    }
})
print(f"  HTTP {code2}, Status: {data2.get('status')}")
if code2 == 201:
    print(f"  Ref: {data2.get('data', {}).get('reference_code')}")
print(f"  Message: {data2.get('message', '')[:120]}")

# Test 3: Verify the page loads correctly
print("\nTest 3: Verify main page loads")
res3 = urllib.request.urlopen(f'{BASE_URL}/')
html = res3.read().decode('utf-8')
print(f"  HTTP {res3.status}, Content length: {len(html)} bytes")
has_required = 'required' in html.lower() or 'required:!0' in html or 'required:true' in html
print(f"  Contains 'required' markers in JS bundle: {has_required}")

# Count required fields in the compiled JS
assets_js = urllib.request.urlopen(f'{BASE_URL}/assets/index.js').read().decode('utf-8')
required_count = assets_js.count('required:!0')
print(f"  Number of 'required:!0' (true) fields in compiled JS: {required_count}")

print("\n=== ALL REQUIRED FIELDS TESTS COMPLETED ===")
