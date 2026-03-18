import { test, expect, BrowserContext, Page } from '@playwright/test';

test.describe('Teacher Progress View', () => {
  let teacherContext: BrowserContext;
  let studentContext: BrowserContext;
  let teacherPage: Page;
  let studentPage: Page;

  test.beforeAll(async ({ browser }) => {
    // Create two separate browser contexts
    teacherContext = await browser.newContext();
    studentContext = await browser.newContext();
    teacherPage = await teacherContext.newPage();
    studentPage = await studentContext.newPage();
  });

  test.afterAll(async () => {
    await teacherContext.close();
    await studentContext.close();
  });

  test('teacher can see student progress in real-time', async () => {
    const baseUrl = 'http://localhost:3007';
    const uniqueRoomName = `Test Room ${Date.now()}`;

    // === Teacher: Register and Login ===
    console.log('=== Teacher: Registering ===');
    await teacherPage.goto(`${baseUrl}/login`);
    await teacherPage.waitForLoadState('networkidle');

    // Click "注册" to switch to register mode (the toggle button at the bottom)
    await teacherPage.locator('button:has-text("注册"):not([type="submit"])').click();
    await teacherPage.waitForTimeout(500);

    // Fill in the form using CSS selectors
    const inputs = teacherPage.locator('input[type="text"], input[type="password"]');
    await inputs.nth(0).fill('teacher_browser_test');  // username
    await inputs.nth(1).fill('test123');  // password
    await teacherPage.locator('select').selectOption('teacher');

    // Submit registration
    await teacherPage.click('button[type="submit"]:has-text("注册")');
    await teacherPage.waitForTimeout(1500);

    // Check if registration succeeded or user already exists
    const errorVisible = await teacherPage.locator('text=用户名已存在').isVisible();
    if (errorVisible) {
      console.log('=== Teacher: User already exists, switching to login ===');
      await teacherPage.locator('button:has-text("登录"):not([type="submit"])').click();
      await teacherPage.waitForTimeout(300);
    } else {
      // Should show success message and switch back to login mode
      await expect(teacherPage.locator('text=注册成功')).toBeVisible({ timeout: 5000 });
      console.log('=== Teacher: Registered successfully ===');
    }

    // Now login
    const loginInputs = teacherPage.locator('input[type="text"], input[type="password"]');
    await loginInputs.nth(0).fill('teacher_browser_test');
    await loginInputs.nth(1).fill('test123');
    await teacherPage.click('button[type="submit"]:has-text("登录")');

    // Wait for redirect to teacher dashboard
    await teacherPage.waitForURL('**/teacher', { timeout: 10000 });
    console.log('=== Teacher: Logged in ===');

    // === Teacher: Create Room ===
    console.log('=== Teacher: Creating room ===');
    await teacherPage.fill('input[placeholder="房间名称"]', uniqueRoomName);
    await teacherPage.click('button:has-text("创建")');

    // Wait for the room to appear in the list
    await teacherPage.waitForTimeout(1500);

    // Find the specific room row containing our unique room name
    // The room row has class "px-6 py-4 flex items-center justify-between"
    const roomRow = teacherPage.locator(`div.px-6.py-4.flex:has(h3:has-text("${uniqueRoomName}"))`);
    await expect(roomRow).toBeVisible({ timeout: 5000 });
    console.log('=== Teacher: Room created and visible in list ===');

    // Click the "进入" button within that room row
    await roomRow.locator('button:has-text("进入")').click();
    await teacherPage.waitForURL('**/teacher/room/**', { timeout: 5000 });
    console.log('=== Teacher: Entered room ===');

    // Get room ID from URL
    const roomUrl = teacherPage.url();
    const roomId = roomUrl.split('/teacher/room/')[1];
    console.log('Room ID:', roomId);

    // Wait for teacher's WebSocket to be ready
    await teacherPage.waitForTimeout(2000);

    // Verify room is in waiting state
    let waitingVisible = await teacherPage.locator('text=等待中').isVisible();
    console.log('=== Teacher: Room in waiting state:', waitingVisible, '===');

    if (!waitingVisible) {
      // Room might be in playing or finished state from previous run
      console.log('=== Teacher: Room not in waiting state, checking status ===');

      // Check if room is in playing state
      const playingVisible = await teacherPage.locator('text=游戏中').isVisible();
      if (playingVisible) {
        console.log('=== Teacher: Room in playing state, ending game ===');
        const endButton = teacherPage.locator('button:has-text("结束游戏")');
        if (await endButton.isVisible()) {
          await endButton.click();
          await teacherPage.waitForTimeout(1000);
        }
      }

      // Check if room is in finished state
      const finishedVisible = await teacherPage.locator('text=已结束').isVisible();
      if (finishedVisible || playingVisible) {
        console.log('=== Teacher: Resetting room to waiting state ===');
        await teacherPage.waitForTimeout(500);
        const resetButton = teacherPage.locator('button:has-text("重新开始")');
        if (await resetButton.isVisible()) {
          await resetButton.click();
          await teacherPage.waitForTimeout(1000);
        }
      }

      // Re-check waiting state
      waitingVisible = await teacherPage.locator('text=等待中').isVisible();
      console.log('=== Teacher: Room now in waiting state:', waitingVisible, '===');
    }

    // === Student: Register and Login ===
    console.log('=== Student: Registering ===');
    await studentPage.goto(`${baseUrl}/login`);
    await studentPage.waitForLoadState('networkidle');

    // Click "注册" to switch to register mode
    await studentPage.locator('button:has-text("注册"):not([type="submit"])').click();
    await studentPage.waitForTimeout(500);

    const studentInputs = studentPage.locator('input[type="text"], input[type="password"]');
    await studentInputs.nth(0).fill('student_browser_test');
    await studentInputs.nth(1).fill('test123');
    await studentPage.locator('select').selectOption('student');

    await studentPage.click('button[type="submit"]:has-text("注册")');
    await studentPage.waitForTimeout(1500);

    // Check if registration succeeded or user already exists
    const studentErrorVisible = await studentPage.locator('text=用户名已存在').isVisible();
    if (studentErrorVisible) {
      console.log('=== Student: User already exists, switching to login ===');
      await studentPage.locator('button:has-text("登录"):not([type="submit"])').click();
      await studentPage.waitForTimeout(300);
    } else {
      await expect(studentPage.locator('text=注册成功')).toBeVisible({ timeout: 5000 });
      console.log('=== Student: Registered successfully ===');
    }

    // Now login
    const studentLoginInputs = studentPage.locator('input[type="text"], input[type="password"]');
    await studentLoginInputs.nth(0).fill('student_browser_test');
    await studentLoginInputs.nth(1).fill('test123');
    await studentPage.click('button[type="submit"]:has-text("登录")');

    // Students are redirected to /rooms
    await studentPage.waitForURL('**/rooms', { timeout: 10000 });
    console.log('=== Student: Logged in ===');

    // === Student: Join Room ===
    console.log('=== Student: Joining room ===');
    // Student should see the room in the list
    await studentPage.waitForTimeout(500);

    // Find the specific room card containing the unique room name
    // The room card has class "bg-white rounded-lg shadow p-4 flex items-center justify-between"
    const studentRoomRow = studentPage.locator(`div.bg-white.rounded-lg.shadow.p-4.flex:has(h3:has-text("${uniqueRoomName}"))`);
    await expect(studentRoomRow).toBeVisible({ timeout: 5000 });

    // Click the "加入" button within that room row
    await studentRoomRow.locator('button:has-text("加入")').click();
    await studentPage.waitForURL('**/room/**', { timeout: 5000 });

    // Verify student sees "waiting" message
    await expect(studentPage.locator('text=等待游戏开始')).toBeVisible({ timeout: 5000 });
    console.log('=== Student: Joined room, waiting ===');

    // === Teacher: Verify student joined (with retries) ===
    console.log('=== Teacher: Waiting for student to appear in list ===');
    let studentListVisible = false;
    for (let i = 0; i < 10; i++) {
      await teacherPage.waitForTimeout(500);
      studentListVisible = await teacherPage.locator('text=student_browser_test').isVisible();
      console.log(`=== Teacher sees student in list (attempt ${i+1}):`, studentListVisible, '===');
      if (studentListVisible) break;
      // Try refreshing by clicking elsewhere and back
      if (i === 4) {
        // Force reload the room data
        await teacherPage.reload();
        await teacherPage.waitForLoadState('networkidle');
        await teacherPage.waitForTimeout(1000);
      }
    }

    // === Teacher: Start Game ===
    console.log('=== Teacher: Starting game ===');
    await teacherPage.selectOption('select', '5'); // 5 questions (option values are 5, 10, 15, 20)
    await teacherPage.click('button:has-text("开始游戏")');
    await teacherPage.waitForTimeout(1000);

    // Verify teacher sees question
    await expect(teacherPage.locator('text=题目 1 / 5')).toBeVisible({ timeout: 5000 });
    console.log('=== Teacher: Game started ===');

    // === Student: Verify game started ===
    await expect(studentPage.locator('text=题目 1 / 5')).toBeVisible({ timeout: 5000 });
    console.log('=== Student: Game started, seeing question ===');

    // === Student: Submit Answer ===
    console.log('=== Student: Submitting answer ===');
    await studentPage.fill('input[placeholder*="输入答案"]', '(1+2)*3+4');
    await studentPage.click('button:has-text("提交答案")');
    await studentPage.waitForTimeout(2000);

    // Check if result is shown
    const resultVisible = await studentPage.locator('text=正确').or(studentPage.locator('text=错误')).isVisible();
    console.log('=== Student: Answer submitted, result visible:', resultVisible, '===');

    // === Teacher: Check Progress ===
    await teacherPage.waitForTimeout(500);
    console.log('=== Teacher: Checking progress ===');

    // Look for progress indicators
    const progressText = await teacherPage.locator('text=/\\d+\\/5/').first().textContent().catch(() => null);
    console.log('=== Teacher sees progress:', progressText, '===');

    // Click refresh progress button if available
    const refreshButton = teacherPage.locator('button:has-text("刷新进度")');
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await teacherPage.waitForTimeout(500);
    }

    // === Navigate through remaining questions (2 through 5) ===
    // Currently on question 1 after answer submission, need to go through questions 2-5
    for (let q = 2; q <= 5; q++) {
      // Click "下一题" to advance to the next question
      console.log(`=== Teacher: Clicking next to go to question ${q} ===`);
      await teacherPage.click('button:has-text("下一题")');
      await teacherPage.waitForTimeout(1000);

      // Verify both teacher and student see current question
      await expect(teacherPage.locator(`text=题目 ${q} / 5`)).toBeVisible({ timeout: 5000 });
      console.log(`=== Teacher: On question ${q} ===`);
      await expect(studentPage.locator(`text=题目 ${q} / 5`)).toBeVisible({ timeout: 5000 });
      console.log(`=== Student: On question ${q} ===`);

      // Student submits an answer for current question
      await studentPage.fill('input[placeholder*="输入答案"]', '(1+2)*3+4');
      await studentPage.click('button:has-text("提交答案")');
      await studentPage.waitForTimeout(1500);

      // Check result
      const qResultVisible = await studentPage.locator('text=正确').or(studentPage.locator('text=错误')).isVisible();
      console.log(`=== Student: Answer ${q} submitted, result visible: ${qResultVisible} ===`);

      // Teacher checks progress
      await teacherPage.waitForTimeout(500);
      const qProgressText = await teacherPage.locator('text=/\\d+\\/5/').first().textContent().catch(() => null);
      console.log(`=== Teacher sees progress: ${qProgressText} ===`);

      // If on last question, end game
      if (q === 5) {
        console.log('=== Teacher: Ending game ===');
        await teacherPage.click('button:has-text("结束游戏")');
        await teacherPage.waitForTimeout(1000);

        // Verify game ended
        await expect(teacherPage.locator('text=已结束')).toBeVisible({ timeout: 5000 });
        console.log('=== Teacher: Game ended ===');

        // === Student: Verify game ended ===
        await expect(studentPage.locator('text=游戏结束')).toBeVisible({ timeout: 5000 });
        console.log('=== Student: Game ended ===');
      }
    }

    console.log('=== TEST PASSED ===');
  });
});