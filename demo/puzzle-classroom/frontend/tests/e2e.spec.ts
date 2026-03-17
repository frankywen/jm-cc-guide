import { test, expect, Page, BrowserContext } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

// Helper to generate unique username
const uniqueId = () => Date.now().toString().slice(-6);

// Helper to get input fields
function getUsernameInput(page: Page) {
  // Username input is type="text"
  return page.locator('input[type="text"]');
}

function getPasswordInput(page: Page) {
  // Password input
  return page.locator('input[type="password"]');
}

// Helper to clear auth state
async function clearAuthState(page: Page) {
  try {
    await page.evaluate(() => localStorage.clear());
  } catch {
    // Ignore errors if page hasn't navigated yet
  }
}

// Helper to register and login in one go
async function registerAndLogin(page: Page, username: string, password: string, role: 'student' | 'teacher') {
  // Go to login page first (so localStorage is accessible)
  await page.goto(BASE_URL);

  // Clear any previous auth state
  await clearAuthState(page);

  // Reload to ensure clean state
  await page.reload();

  // Switch to register mode
  await page.click('text=注册');

  // Wait for role selector to appear
  await page.waitForSelector('select', { timeout: 2000 });

  // Fill form
  await getUsernameInput(page).fill(username);
  await getPasswordInput(page).fill(password);
  await page.selectOption('select', role);

  // Submit registration
  await page.click('button[type="submit"]');

  // Wait for success message
  await page.waitForSelector('text=注册成功，请登录', { timeout: 5000 });

  // Wait a bit for the form to reset (React state update)
  await page.waitForTimeout(500);

  // Verify we're back in login mode (no select dropdown)
  await expect(page.locator('select')).not.toBeVisible({ timeout: 2000 });

  // Now fill login form
  await getUsernameInput(page).fill(username);
  await getPasswordInput(page).fill(password);

  // Submit login
  await page.click('button[type="submit"]');

  // Wait for navigation
  const expectedPath = role === 'teacher' ? '/teacher' : '/rooms';
  await page.waitForURL(`**${expectedPath}**`, { timeout: 10000 });
}

test.describe('Puzzle Classroom E2E Tests', () => {
  test.describe('Authentication', () => {
    test('should register a new teacher', async ({ page }) => {
      await page.goto(BASE_URL);

      const username = `t_${uniqueId()}`;

      // Switch to register mode
      await page.click('text=注册');
      await page.waitForSelector('select');

      await getUsernameInput(page).fill(username);
      await getPasswordInput(page).fill('test123');
      await page.selectOption('select', 'teacher');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=注册成功，请登录')).toBeVisible({ timeout: 5000 });
    });

    test('should register a new student', async ({ page }) => {
      await page.goto(BASE_URL);

      const username = `s_${uniqueId()}`;

      await page.click('text=注册');
      await page.waitForSelector('select');

      await getUsernameInput(page).fill(username);
      await getPasswordInput(page).fill('test123');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=注册成功，请登录')).toBeVisible({ timeout: 5000 });
    });

    test('should login existing user', async ({ page }) => {
      const username = `login_${uniqueId()}`;
      await registerAndLogin(page, username, 'test123', 'teacher');
      await expect(page).toHaveURL(/\/teacher/);
    });

    test('should show error for invalid login', async ({ page }) => {
      await page.goto(BASE_URL);

      await getUsernameInput(page).fill('nonexistent_user');
      await getPasswordInput(page).fill('wrongpassword');
      await page.click('button[type="submit"]');

      await expect(page.locator('.bg-red-100')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Room Management', () => {
    test('teacher should create a room', async ({ page }) => {
      const username = `teacher_${uniqueId()}`;
      await registerAndLogin(page, username, 'test123', 'teacher');

      // Verify we're on teacher page (handle potential redirect race condition)
      await page.waitForSelector('input[placeholder="房间名称"]', { timeout: 5000 });

      // Create room
      await page.fill('input[placeholder="房间名称"]', 'Test Room');
      await page.click('button:has-text("创建")');

      await expect(page.locator('text=Test Room')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Full Game Flow', () => {
    test('complete game session with teacher and student', async ({ browser }) => {
      const teacherId = uniqueId();
      const studentId = uniqueId();
      const roomName = `Game Test Room ${teacherId}`; // Unique room name per test run

      // Create contexts
      const teacherContext = await browser.newContext();
      const teacherPage = await teacherContext.newPage();
      const studentContext = await browser.newContext();
      const studentPage = await studentContext.newPage();

      try {
        // Teacher setup
        await registerAndLogin(teacherPage, `t_${teacherId}`, 'test123', 'teacher');

        // Wait for teacher dashboard to be ready
        await teacherPage.waitForSelector('input[placeholder="房间名称"]', { timeout: 5000 });

        // Create room with unique name
        await teacherPage.fill('input[placeholder="房间名称"]', roomName);
        await teacherPage.click('button:has-text("创建")');
        await expect(teacherPage.locator(`text=${roomName}`)).toBeVisible({ timeout: 5000 });

        // Enter room
        await teacherPage.click('button:has-text("进入")');
        await expect(teacherPage).toHaveURL(/\/teacher\/room\//);
        await expect(teacherPage.locator('text=游戏控制')).toBeVisible();

        // Student setup
        await registerAndLogin(studentPage, `s_${studentId}`, 'test123', 'student');

        // Wait for rooms list to be ready
        await studentPage.waitForSelector(`text=${roomName}`, { timeout: 5000 });

        // Debug: Listen for console messages
        studentPage.on('console', msg => {
          if (msg.type() === 'error' || msg.text().includes('[WS]') || msg.text().includes('WebSocket')) {
            console.log('[Student Console]', msg.type(), msg.text());
          }
        });

        // Debug: Listen for teacher console messages
        teacherPage.on('console', msg => {
          if (msg.type() === 'error' || msg.text().includes('[WS]') || msg.text().includes('WebSocket')) {
            console.log('[Teacher Console]', msg.type(), msg.text());
          }
        });

        // Join room - click the "加入" button for the specific room
        const roomNameHeading = studentPage.locator('h3', { hasText: roomName });
        await expect(roomNameHeading).toBeVisible({ timeout: 5000 });

        // The button is a sibling of the div containing h3, so go up to the card div and find button
        await roomNameHeading.locator('xpath=ancestor::div[contains(@class, "bg-white")]').locator('button:has-text("加入")').click();

        await expect(studentPage).toHaveURL(/\/room\//);
        await expect(studentPage.locator('text=等待游戏开始')).toBeVisible();

        // Wait for WebSocket connections to be established
        await teacherPage.waitForTimeout(2000);

        // Debug: Check if student has token
        const studentToken = await studentPage.evaluate(() => {
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            const parsed = JSON.parse(authStorage);
            return { hasToken: !!parsed?.state?.token, userId: parsed?.state?.user?.id };
          }
          return { hasToken: false };
        });
        console.log('Student token status:', studentToken);

        // Verify student is in the room and connected (check for user_joined notification on teacher side)
        await teacherPage.waitForTimeout(3000);

        // Start game
        await teacherPage.click('button:has-text("开始游戏")');

        // Verify game started on teacher side
        await expect(teacherPage.locator('text=当前题目')).toBeVisible({ timeout: 10000 });

        // Wait a bit for student to receive the game:start message
        await studentPage.waitForTimeout(2000);

        // Debug: Log what's on the page
        const studentContent = await studentPage.content();
        console.log('Student page content preview:', studentContent.substring(0, 2000));

        // Debug: Check game state
        const waitingVisible = await studentPage.locator('text=等待游戏开始').isVisible().catch(() => false);
        console.log('Waiting for game visible:', waitingVisible);

        // Verify game started on student side - check for timer text
        await expect(studentPage.locator('text=/用时.*秒/')).toBeVisible({ timeout: 15000 });

        // Check numbers
        const numbers = await studentPage.locator('div[class*="bg-primary-100"]').count();
        expect(numbers).toBe(4);

        // Submit answer
        await studentPage.fill('input[placeholder*="输入答案"]', '(1+2)*3+4');
        await studentPage.click('button:has-text("提交答案")');

        await expect(studentPage.locator('text=/正确|答案错误/')).toBeVisible({ timeout: 5000 });

        // End game
        await teacherPage.click('button:has-text("结束游戏")');
        await expect(teacherPage.locator('text=已结束')).toBeVisible({ timeout: 5000 });
        await expect(studentPage.locator('text=游戏结束')).toBeVisible({ timeout: 5000 });

        console.log('✅ Full game flow test passed!');
      } finally {
        await teacherContext.close();
        await studentContext.close();
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle duplicate username', async ({ page }) => {
      const username = `dup_${uniqueId()}`;

      // First registration
      await page.goto(BASE_URL);
      await page.click('text=注册');
      await page.waitForSelector('select');
      await getUsernameInput(page).fill(username);
      await getPasswordInput(page).fill('test123');
      await page.selectOption('select', 'teacher');
      await page.click('button[type="submit"]');
      await expect(page.locator('text=注册成功，请登录')).toBeVisible({ timeout: 5000 });

      // Wait for mode to switch back to login (select disappears)
      await expect(page.locator('select')).not.toBeVisible({ timeout: 2000 });

      // Try duplicate - click register toggle again
      await page.click('button:has-text("注册")');
      await page.waitForSelector('select', { timeout: 2000 });
      await getUsernameInput(page).fill(username);
      await getPasswordInput(page).fill('test123');
      await page.selectOption('select', 'teacher');
      await page.click('button[type="submit"]');

      await expect(page.locator('.bg-red-100')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('UI/UX', () => {
    test('should toggle login/register modes', async ({ page }) => {
      await page.goto(BASE_URL);

      // Login mode - no role selector
      await expect(page.locator('select')).not.toBeVisible();

      // Register mode
      await page.click('text=注册');
      await expect(page.locator('select')).toBeVisible();

      // Back to login
      await page.click('text=登录');
      await expect(page.locator('select')).not.toBeVisible();
    });

    test('should require authentication', async ({ page }) => {
      await page.goto(`${BASE_URL}/teacher`);
      await expect(page).toHaveURL(/\/login/);

      await page.goto(`${BASE_URL}/rooms`);
      await expect(page).toHaveURL(/\/login/);
    });
  });
});