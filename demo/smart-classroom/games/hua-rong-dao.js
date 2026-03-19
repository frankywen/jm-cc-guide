// 华容道游戏
class HuaRongDao {
    constructor(container) {
        this.container = container;
        this.init();
    }
    
    init() {
        this.container.innerHTML = `
            <div class="game-board">
                <h3>华容道</h3>
                <p>移动方块，帮助曹操（红色方块）从下方出口逃出</p>
                <div id="hua-rong-dao-board" style="display: grid; grid-template-columns: repeat(4, 80px); grid-template-rows: repeat(5, 80px); gap: 2px; margin: 20px auto; width: 326px; background-color: #333;"></div>
            </div>
            <div class="game-controls">
                <button id="restart-hua-rong">重新开始</button>
            </div>
        `;
        
        this.generateBoard();
        
        document.getElementById('restart-hua-rong').addEventListener('click', () => this.generateBoard());
    }
    
    generateBoard() {
        const board = this.container.querySelector('#hua-rong-dao-board');
        board.innerHTML = '';
        
        // 初始化华容道布局
        // 0: 空格, 1: 曹操, 2: 关羽, 3: 张飞, 4: 赵云, 5: 马超, 6: 黄忠, 7: 小兵
        const layout = [
            [1, 1, 2, 3],
            [1, 1, 2, 3],
            [4, 5, 6, 7],
            [4, 8, 8, 7],
            [9, 0, 0, 10]
        ];
        
        const colors = {
            1: '#FF6B6B', // 曹操
            2: '#4ECDC4', // 关羽
            3: '#FFE66D', // 张飞
            4: '#1A535C', // 赵云
            5: '#FF9F1C', // 马超
            6: '#6A0572', // 黄忠
            7: '#AB83A1', // 小兵
            8: '#2EC4B6', // 小兵
            9: '#E76F51', // 小兵
            10: '#8338EC' // 小兵
        };
        
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 4; j++) {
                const cell = document.createElement('div');
                cell.style.cssText = `
                    width: 80px;
                    height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    cursor: pointer;
                `;
                
                if (layout[i][j] !== 0) {
                    cell.style.backgroundColor = colors[layout[i][j]];
                    cell.dataset.value = layout[i][j];
                    cell.addEventListener('click', () => this.moveCell(i, j));
                } else {
                    cell.style.backgroundColor = '#f0f0f0';
                    cell.dataset.value = 0;
                }
                
                board.appendChild(cell);
            }
        }
        
        this.layout = layout;
    }
    
    moveCell(row, col) {
        // 检查是否可以移动
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // 上、下、左、右
        
        for (const [dx, dy] of directions) {
            const newRow = row + dx;
            const newCol = col + dy;
            
            if (newRow >= 0 && newRow < 5 && newCol >= 0 && newCol < 4) {
                if (this.layout[newRow][newCol] === 0) {
                    // 交换位置
                    [this.layout[row][col], this.layout[newRow][newCol]] = [this.layout[newRow][newCol], this.layout[row][col]];
                    this.updateBoard();
                    this.checkWin();
                    break;
                }
            }
        }
    }
    
    updateBoard() {
        const cells = this.container.querySelectorAll('#hua-rong-dao-board div');
        const colors = {
            1: '#FF6B6B', // 曹操
            2: '#4ECDC4', // 关羽
            3: '#FFE66D', // 张飞
            4: '#1A535C', // 赵云
            5: '#FF9F1C', // 马超
            6: '#6A0572', // 黄忠
            7: '#AB83A1', // 小兵
            8: '#2EC4B6', // 小兵
            9: '#E76F51', // 小兵
            10: '#8338EC' // 小兵
        };
        
        for (let i = 0; i < 5; i++) {
            for (let j = 0; j < 4; j++) {
                const cell = cells[i * 4 + j];
                const value = this.layout[i][j];
                
                if (value !== 0) {
                    cell.style.backgroundColor = colors[value];
                    cell.dataset.value = value;
                } else {
                    cell.style.backgroundColor = '#f0f0f0';
                    cell.dataset.value = 0;
                }
            }
        }
    }
    
    checkWin() {
        // 检查曹操是否到达出口
        if (this.layout[4][1] === 1 || this.layout[4][2] === 1) {
            alert('恭喜你，曹操成功逃出！');
        }
    }
}