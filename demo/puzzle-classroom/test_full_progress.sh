#!/bin/bash
BASE_URL="http://localhost:8080/api"

echo "=== 1. Login as Teacher ==="
TEACHER_RESP=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher_prog2","password":"test123"}')
TEACHER_TOKEN=$(echo "$TEACHER_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Teacher Token: ${TEACHER_TOKEN:0:30}..."

echo -e "\n=== 2. Login Students ==="
STUDENT1_RESP=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"student_prog3","password":"test123"}')
STUDENT1_TOKEN=$(echo "$STUDENT1_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

STUDENT2_RESP=$(curl -s -X POST "$BASE_URL/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"student_prog4","password":"test123"}')
STUDENT2_TOKEN=$(echo "$STUDENT2_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Student tokens obtained"

echo -e "\n=== 3. Teacher Creates Room ==="
ROOM_RESP=$(curl -s -X POST "$BASE_URL/rooms" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{"name":"Full Progress Test Room"}')
ROOM_ID=$(echo "$ROOM_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "Room ID: $ROOM_ID"

echo -e "\n=== 4. Students Join Room ==="
curl -s -X POST "$BASE_URL/rooms/$ROOM_ID/join" -H "Authorization: Bearer $STUDENT1_TOKEN"
echo ""
curl -s -X POST "$BASE_URL/rooms/$ROOM_ID/join" -H "Authorization: Bearer $STUDENT2_TOKEN"
echo ""

echo -e "\n=== 5. Teacher Starts Game (3 questions) ==="
GAME_RESP=$(curl -s -X POST "$BASE_URL/startGame" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{"roomId":"'"$ROOM_ID"'","questionCount":3}')
echo "$GAME_RESP"
SESSION_ID=$(echo "$GAME_RESP" | grep -o '"sessionId":"[^"]*"' | cut -d'"' -f4)
FIRST_QUESTION=$(echo "$GAME_RESP" | grep -o '"firstQuestion":\[[0-9,]*\]' | grep -o '\[[0-9,]*\]')
echo "Session ID: $SESSION_ID"
echo "First Question: $FIRST_QUESTION"

echo -e "\n=== 6. Students Answer Question 1 ==="
Q1=$(echo "$FIRST_QUESTION" | tr -d '[]')
curl -s -X POST "$BASE_URL/rooms/$ROOM_ID/answer" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT1_TOKEN" \
  -d '{"answer":"1+2+3+4","question":"'"$Q1"'","timeSpent":5,"sessionId":"'"$SESSION_ID"'","questionIndex":0}'
echo ""
curl -s -X POST "$BASE_URL/rooms/$ROOM_ID/answer" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT2_TOKEN" \
  -d '{"answer":"1*2*3*4","question":"'"$Q1"'","timeSpent":7,"sessionId":"'"$SESSION_ID"'","questionIndex":0}'
echo ""

echo -e "\n=== 7. Teacher Gets Next Question (index 1) ==="
NEXT_RESP=$(curl -s -X POST "$BASE_URL/getNextQuestion" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{"roomId":"'"$ROOM_ID"'","index":1}')
echo "$NEXT_RESP"
Q2=$(echo "$NEXT_RESP" | grep -o '"question":\[[0-9,]*\]' | grep -o '\[[0-9,]*\]' | tr -d '[]')
echo "Question 2: $Q2"

echo -e "\n=== 8. Check Session CurrentIndex Updated ==="
PROGRESS_RESP=$(curl -s "$BASE_URL/gameProgress?roomId=$ROOM_ID" \
  -H "Authorization: Bearer $TEACHER_TOKEN")
echo "$PROGRESS_RESP"
CURRENT_IDX=$(echo "$PROGRESS_RESP" | grep -o '"currentIndex":[0-9]*' | head -1 | cut -d: -f2)
if [ "$CURRENT_IDX" = "1" ]; then
  echo "PASS: currentIndex updated to 1"
else
  echo "ERROR: currentIndex is $CURRENT_IDX, expected 1"
  exit 1
fi

echo -e "\n=== 9. Students Answer Question 2 ==="
curl -s -X POST "$BASE_URL/rooms/$ROOM_ID/answer" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT1_TOKEN" \
  -d '{"answer":"1+2+3+4","question":"'"$Q2"'","timeSpent":6,"sessionId":"'"$SESSION_ID"'","questionIndex":1}'
echo ""
curl -s -X POST "$BASE_URL/rooms/$ROOM_ID/answer" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT2_TOKEN" \
  -d '{"answer":"1*2*3+4","question":"'"$Q2"'","timeSpent":8,"sessionId":"'"$SESSION_ID"'","questionIndex":1}'
echo ""

echo -e "\n=== 10. Teacher Gets Next Question (index 2) ==="
NEXT_RESP2=$(curl -s -X POST "$BASE_URL/getNextQuestion" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{"roomId":"'"$ROOM_ID"'","index":2}')
echo "$NEXT_RESP2"
Q3=$(echo "$NEXT_RESP2" | grep -o '"question":\[[0-9,]*\]' | grep -o '\[[0-9,]*\]' | tr -d '[]')
echo "Question 3: $Q3"

echo -e "\n=== 11. Students Answer Question 3 ==="
curl -s -X POST "$BASE_URL/rooms/$ROOM_ID/answer" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT1_TOKEN" \
  -d '{"answer":"1+2+3+4","question":"'"$Q3"'","timeSpent":4,"sessionId":"'"$SESSION_ID"'","questionIndex":2}'
echo ""
curl -s -X POST "$BASE_URL/rooms/$ROOM_ID/answer" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT2_TOKEN" \
  -d '{"answer":"1*2+3+4","question":"'"$Q3"'","timeSpent":5,"sessionId":"'"$SESSION_ID"'","questionIndex":2}'
echo ""

echo -e "\n=== 12. Final Progress Check ==="
FINAL_PROGRESS=$(curl -s "$BASE_URL/gameProgress?roomId=$ROOM_ID" \
  -H "Authorization: Bearer $TEACHER_TOKEN")
echo "$FINAL_PROGRESS"

# Verify both students completed all 3 questions
if echo "$FINAL_PROGRESS" | grep -q '"completedCount":3'; then
  echo "PASS: Students completed all questions"
else
  echo "ERROR: Students did not complete all questions"
  exit 1
fi

echo -e "\n=== Test Complete: All assertions passed ==="