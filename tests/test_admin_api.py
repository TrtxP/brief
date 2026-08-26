import urllib.request
import json

# 1. Test Admin Login
login_req = urllib.request.Request(
    'http://127.0.0.1:8000/api/admin/login',
    data=json.dumps({'username': 'admin', 'password': 'admin123'}).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
login_res = json.loads(urllib.request.urlopen(login_req).read().decode('utf-8'))
print('Admin Login:', login_res['status'], 'User:', login_res['data']['user']['username'])
token = login_res['data']['token']

# 2. Get Submissions
sub_req = urllib.request.Request(
    'http://127.0.0.1:8000/api/admin/submissions',
    headers={'Authorization': f'Bearer {token}'}
)
sub_res = json.loads(urllib.request.urlopen(sub_req).read().decode('utf-8'))
items = sub_res['data']['submissions']
print(f'Total submissions found in Admin: {len(items)}')
for item in items:
    print(f" - ID #{item['id']}: {item['client_name']} ({item['reference_code']}) [{item['status']}]")

latest_id = items[0]['id']

# 3. Edit / Update Recorded Answers & Status
update_payload = {
    'status': 'approved',
    'notes': "Зв'язалися з клієнтом 26.08, узгодили ТЗ та терміни запуску 1 місяць.",
    'store_name': 'Дніпровський Спінінг & Кастомні Вудилища'
}
update_req = urllib.request.Request(
    f'http://127.0.0.1:8000/api/admin/submissions/{latest_id}',
    data=json.dumps(update_payload).encode('utf-8'),
    headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'},
    method='PUT'
)
update_res = json.loads(urllib.request.urlopen(update_req).read().decode('utf-8'))
print('Admin Update Result:', update_res['status'], 'Message:', update_res['message'])
print('Updated Store Name:', update_res['data']['store_name'])
print('Updated Status:', update_res['data']['status'])
print('Updated Notes:', update_res['data']['notes'])

# 4. Test Export (CSV)
export_req = urllib.request.Request(
    'http://127.0.0.1:8000/api/admin/export?format=csv',
    headers={'Authorization': f'Bearer {token}'}
)
csv_bytes = urllib.request.urlopen(export_req).read()
csv_text = csv_bytes.decode('utf-8-sig', errors='replace')
print('CSV Export Header Line:', csv_text.splitlines()[0])
print('CSV Records count:', len(csv_text.splitlines()) - 1)
print('=== ALL ADMIN CHECKS COMPLETED SUCCESSFULLY! ===')
