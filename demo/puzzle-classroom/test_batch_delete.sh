#!/bin/bash
BASE_URL="http://localhost:8080/api"

echo "=== 1. Login as Admin ==="
ADMIN_RESP=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
echo "$ADMIN_RESP"
ADMIN_TOKEN=$(echo "$ADMIN_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Admin Token: ${ADMIN_TOKEN:0:30}..."

echo -e "\n=== 2. Register & Login Teacher ==="
curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher_batch","password":"test123","role":"teacher"}'
echo ""

TEACHER_RESP=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher_batch","password":"test123"}')
TEACHER_TOKEN=$(echo "$TEACHER_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Teacher Token: ${TEACHER_TOKEN:0:30}..."

echo -e "\n=== 3. Teacher Creates Multiple Rooms ==="
ROOM1_RESP=$(curl -s -X POST "$BASE_URL/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{"name":"Batch Test Room 1"}')
ROOM1_ID=$(echo "$ROOM1_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Room 1 ID: $ROOM1_ID"

ROOM2_RESP=$(curl -s -X POST "$BASE_URL/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{"name":"Batch Test Room 2"}')
ROOM2_ID=$(echo "$ROOM2_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Room 2 ID: $ROOM2_ID"

ROOM3_RESP=$(curl -s -X POST "$BASE_URL/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{"name":"Batch Test Room 3"}')
ROOM3_ID=$(echo "$ROOM3_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Room 3 ID: $ROOM3_ID"

echo -e "\n=== 4. Admin Lists All Rooms ==="
ROOMS_BEFORE=$(curl -s "$BASE_URL/admin/rooms" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$ROOMS_BEFORE"
COUNT_BEFORE=$(echo "$ROOMS_BEFORE" | grep -o '"id":"[^"]*"' | wc -l)
echo "Room count before delete: $COUNT_BEFORE"

echo -e "\n=== 5. Admin Batch Deletes Room 1 and Room 2 ==="
DELETE_RESP=$(curl -s -X POST "$BASE_URL/admin/rooms/batch-delete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"roomIds":["'"$ROOM1_ID"'","'"$ROOM2_ID"'"]}')
echo "$DELETE_RESP"

echo -e "\n=== 6. Verify Rooms Deleted ==="
ROOMS_AFTER=$(curl -s "$BASE_URL/admin/rooms" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "$ROOMS_AFTER"

# Check Room 1 and Room 2 are deleted
if echo "$ROOMS_AFTER" | grep -q "$ROOM1_ID"; then
  echo "ERROR: Room 1 still exists!"
  exit 1
else
  echo "PASS: Room 1 deleted"
fi

if echo "$ROOMS_AFTER" | grep -q "$ROOM2_ID"; then
  echo "ERROR: Room 2 still exists!"
  exit 1
else
  echo "PASS: Room 2 deleted"
fi

# Check Room 3 still exists
if echo "$ROOMS_AFTER" | grep -q "$ROOM3_ID"; then
  echo "PASS: Room 3 still exists"
else
  echo "ERROR: Room 3 was incorrectly deleted!"
  exit 1
fi

echo -e "\n=== 7. Cleanup - Delete Room 3 ==="
curl -s -X DELETE "$BASE_URL/admin/rooms/$ROOM3_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
echo ""

echo -e "\n=== Test Complete: All assertions passed ==="