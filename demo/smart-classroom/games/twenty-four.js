// 24点游戏
class TwentyFour {
    constructor(container) {
        this.container = container;
        this.init();
    }
    
    init() {
        this.container.innerHTML = `
            <div class="game-board">
                <h3>24点</h3>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div style="font-size: 18px; font-weight: bold;">第 <span id="current-level">1</span> 关</div>
                    <div style="font-size: 18px; font-weight: bold;">总耗时: <span id="total-timer">00:00</span></div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div style="font-size: 16px;">成功: <span id="success-count">0</span></div>
                    <div style="font-size: 16px;">失败: <span id="fail-count">0</span></div>
                </div>
                <p>使用下面的4个数字，通过加减乘除运算得到24</p>
                <div id="twenty-four-numbers" style="font-size: 24px; margin: 20px 0; display: flex; justify-content: center; gap: 15px;"></div>
                <div id="twenty-four-current" style="font-size: 28px; margin: 20px 0; min-height: 50px; text-align: center; font-weight: bold; padding: 10px; background-color: #f9f9f9; border-radius: 5px;"></div>
                <div id="twenty-four-operators" style="display: flex; justify-content: center; gap: 10px; margin: 20px 0; flex-wrap: wrap;">
                    <button class="operator" style="width: 60px; height: 60px; font-size: 24px;">+</button>
                    <button class="operator" style="width: 60px; height: 60px; font-size: 24px;">-</button>
                    <button class="operator" style="width: 60px; height: 60px; font-size: 24px;">×</button>
                    <button class="operator" style="width: 60px; height: 60px; font-size: 24px;">÷</button>
                    <button id="clear-btn" style="width: 125px; height: 60px; font-size: 18px;">清除</button>
                </div>
                <div class="game-controls">
                    <button id="new-numbers" style="padding: 12px 24px; font-size: 16px;">新数字</button>
                </div>
                <div id="twenty-four-result" style="margin: 20px 0; font-weight: bold; font-size: 18px;"></div>
            </div>
        `;
        
        // 绑定事件
        document.querySelectorAll('.operator').forEach(btn => {
            btn.addEventListener('click', () => this.selectOperator(btn.textContent));
        });
        
        document.getElementById('clear-btn').addEventListener('click', () => this.clearCalculation());
        document.getElementById('new-numbers').addEventListener('click', () => this.generateNumbers());
        
        // 初始化游戏状态
        this.currentLevel = 1;
        this.successCount = 0;
        this.failCount = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.totalLevels = 40; // 总关卡数
        
        // 开始全局计时
        this.startGlobalTimer();
        
        // 生成数字
        this.generateNumbers();
    }
    
    generateNumbers() {
        // 确保当前关卡不超过总关卡数
        if (this.currentLevel > this.totalLevels) {
            // 所有关卡完成
            this.completeAllLevels();
            return;
        }
        
        // 动态生成有效的24点题目
        let numbers = null;
        let attempts = 0;
        const maxAttempts = 1000;
        
        while (!numbers && attempts < maxAttempts) {
            attempts++;
            numbers = this.generateValid24PointProblem();
        }
        
        // 如果无法生成，使用备用题目
        if (!numbers) {
            numbers = [3, 8, 3, 8]; // 8/(3-8/3)=24
        }
        
        this.originalNumbers = numbers;
        
        // 打乱数字顺序
        this.originalNumbers = this.shuffleArray(this.originalNumbers);
        
        // 初始化状态
        this.state = {
            currentNumber: null,
            operator: null,
            selectedNumbers: [],
            activeNumbers: [...this.originalNumbers]
        };
        
        // 更新关卡显示
        document.getElementById('current-level').textContent = this.currentLevel;
        document.getElementById('success-count').textContent = this.successCount;
        document.getElementById('fail-count').textContent = this.failCount;
        
        this.renderNumbers();
        this.updateDisplay();
    }
    
    // 生成有效的24点题目
    generateValid24PointProblem() {
        // 生成4个1-9之间的随机数字
        const numbers = [];
        for (let i = 0; i < 4; i++) {
            numbers.push(Math.floor(Math.random() * 9) + 1);
        }
        
        // 检查是否可以通过+、-、×、÷得到24
        if (this.canMake24(numbers)) {
            return numbers;
        }
        return null;
    }
    
    // 检查是否可以通过+、-、×、÷得到24
    canMake24(numbers) {
        // 生成所有可能的数字排列
        const permutations = this.getPermutations(numbers);
        
        // 生成所有可能的运算符组合
        const operators = ['+', '-', '×', '÷'];
        const opCombinations = this.getOperatorCombinations(operators, 3);
        
        // 检查所有可能的组合
        for (const perm of permutations) {
            for (const ops of opCombinations) {
                // 检查不同的运算顺序
                // 情况1: ((a op1 b) op2 c) op3 d
                const result1 = this.calculateExpression(perm[0], perm[1], ops[0]);
                if (result1 !== null) {
                    const result2 = this.calculateExpression(result1, perm[2], ops[1]);
                    if (result2 !== null) {
                        const result3 = this.calculateExpression(result2, perm[3], ops[2]);
                        if (result3 !== null && Math.abs(result3 - 24) < 0.001) {
                            return true;
                        }
                    }
                }
                
                // 情况2: (a op1 (b op2 c)) op3 d
                const result4 = this.calculateExpression(perm[1], perm[2], ops[1]);
                if (result4 !== null) {
                    const result5 = this.calculateExpression(perm[0], result4, ops[0]);
                    if (result5 !== null) {
                        const result6 = this.calculateExpression(result5, perm[3], ops[2]);
                        if (result6 !== null && Math.abs(result6 - 24) < 0.001) {
                            return true;
                        }
                    }
                }
                
                // 情况3: a op1 (b op2 (c op3 d))
                const result7 = this.calculateExpression(perm[2], perm[3], ops[2]);
                if (result7 !== null) {
                    const result8 = this.calculateExpression(perm[1], result7, ops[1]);
                    if (result8 !== null) {
                        const result9 = this.calculateExpression(perm[0], result8, ops[0]);
                        if (result9 !== null && Math.abs(result9 - 24) < 0.001) {
                            return true;
                        }
                    }
                }
                
                // 情况4: a op1 (b op2 c op3 d) - 另一种顺序
                const result10 = this.calculateExpression(perm[2], perm[3], ops[2]);
                if (result10 !== null) {
                    const result11 = this.calculateExpression(perm[1], result10, ops[1]);
                    if (result11 !== null) {
                        const result12 = this.calculateExpression(perm[0], result11, ops[0]);
                        if (result12 !== null && Math.abs(result12 - 24) < 0.001) {
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }
    
    // 计算表达式
    calculateExpression(a, b, operator) {
        switch(operator) {
            case '+':
                return a + b;
            case '-':
                return a - b;
            case '×':
                return a * b;
            case '÷':
                if (b === 0) return null;
                return a / b;
            default:
                return null;
        }
    }
    
    // 获取数组的所有排列
    getPermutations(arr) {
        if (arr.length === 0) return [];
        if (arr.length === 1) return [arr];
        
        const permutations = [];
        for (let i = 0; i < arr.length; i++) {
            const current = arr[i];
            const remaining = [...arr.slice(0, i), ...arr.slice(i + 1)];
            const subPermutations = this.getPermutations(remaining);
            for (const perm of subPermutations) {
                permutations.push([current, ...perm]);
            }
        }
        return permutations;
    }
    
    // 获取运算符的所有组合
    getOperatorCombinations(operators, length) {
        if (length === 0) return [[]];
        const combinations = [];
        for (const op of operators) {
            const subCombinations = this.getOperatorCombinations(operators, length - 1);
            for (const subComb of subCombinations) {
                combinations.push([op, ...subComb]);
            }
        }
        return combinations;
    }
    
    // 打乱数组顺序
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
    
    // 开始全局计时
    startGlobalTimer() {
        this.startTime = new Date();
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.timerInterval = setInterval(() => {
            const now = new Date();
            const elapsed = Math.floor((now - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            document.getElementById('total-timer').textContent = `${minutes}:${seconds}`;
        }, 1000);
    }
    
    // 停止计时
    stopGlobalTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    renderNumbers() {
        const numbersContainer = this.container.querySelector('#twenty-four-numbers');
        numbersContainer.innerHTML = '';
        
        // 显示当前活跃的数字
        this.state.activeNumbers.forEach((num, index) => {
            const numBtn = document.createElement('button');
            numBtn.className = 'number-btn';
            numBtn.textContent = num;
            numBtn.style.cssText = `
                width: 80px;
                height: 80px;
                font-size: 32px;
                font-weight: bold;
                border: 3px solid #4CAF50;
                border-radius: 10px;
                background-color: white;
                color: #333;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            `;
            
            // 绑定点击事件
            numBtn.addEventListener('click', () => this.selectNumber(index));
            numbersContainer.appendChild(numBtn);
        });
    }
    
    selectNumber(index) {
        const num = this.state.activeNumbers[index];
        
        if (this.state.currentNumber === null) {
            // 第一次选择数字
            this.state.currentNumber = num;
            this.state.selectedNumbers.push(index);
            this.updateDisplay();
        } else if (this.state.operator !== null) {
            // 第二次选择数字，进行计算
            this.state.selectedNumbers.push(index);
            
            const result = this.calculateExpression(this.state.currentNumber, num, this.state.operator);
            
            if (result === null) {
                // 计算错误（如除零）
                this.container.querySelector('#twenty-four-result').textContent = '计算错误！';
                this.container.querySelector('#twenty-four-result').style.color = 'red';
                // 重置选择
                this.state.currentNumber = null;
                this.state.operator = null;
                this.state.selectedNumbers = [];
                this.updateDisplay();
                return;
            }
            
            // 更新活跃数字：移除已使用的数字，添加结果
            const newActiveNumbers = this.state.activeNumbers.filter((_, i) => !this.state.selectedNumbers.includes(i));
            newActiveNumbers.push(result);
            this.state.activeNumbers = newActiveNumbers;
            
            // 重置状态
            this.state.currentNumber = null;
            this.state.operator = null;
            this.state.selectedNumbers = [];
            
            // 重新渲染数字
            this.renderNumbers();
            this.updateDisplay();
            
            // 检查是否只剩一个数字
            if (this.state.activeNumbers.length === 1) {
                this.checkResult();
            }
        }
    }
    
    selectOperator(operator) {
        if (this.state.currentNumber === null) return;
        if (this.state.operator !== null) return;
        
        this.state.operator = operator;
        this.updateDisplay();
    }
    
    updateDisplay() {
        const currentDisplay = this.container.querySelector('#twenty-four-current');
        
        if (this.state.operator === null) {
            currentDisplay.textContent = this.state.currentNumber !== null ? this.state.currentNumber : '';
        } else {
            currentDisplay.textContent = `${this.state.currentNumber} ${this.state.operator}`;
        }
        
        // 清空结果提示
        this.container.querySelector('#twenty-four-result').textContent = '';
    }
    
    clearCalculation() {
        this.generateNumbers();
    }
    
    checkResult() {
        const result = this.state.activeNumbers[0];
        const resultDiv = this.container.querySelector('#twenty-four-result');
        
        if (Math.abs(result - 24) < 0.001) {
            resultDiv.textContent = '恭喜你，答对了！';
            resultDiv.style.color = 'green';
            this.successCount++;
        } else {
            resultDiv.textContent = `答案错误，计算结果是 ${result.toFixed(2)}`;
            resultDiv.style.color = 'red';
            this.failCount++;
        }
        
        // 延迟进入下一关
        setTimeout(() => {
            this.currentLevel++;
            this.generateNumbers();
        }, 1000);
    }
    
    // 完成所有关卡
    completeAllLevels() {
        // 停止计时
        this.stopGlobalTimer();
        
        const totalTime = document.getElementById('total-timer').textContent;
        
        // 显示最终统计
        this.container.innerHTML = `
            <div class="game-board">
                <h3>24点游戏完成！</h3>
                <div style="margin: 30px 0; font-size: 18px;">
                    <p>总耗时: ${totalTime}</p>
                    <p>成功关卡: ${this.successCount}</p>
                    <p>失败关卡: ${this.failCount}</p>
                    <p>总关卡数: ${this.totalLevels}</p>
                </div>
                <div class="game-controls">
                    <button id="restart-game" style="padding: 12px 24px; font-size: 16px;">重新开始</button>
                </div>
            </div>
        `;
        
        // 绑定重新开始按钮
        document.getElementById('restart-game').addEventListener('click', () => {
            this.init();
        });
    }
}