// 智取王位游戏
class TakeThrone {
    constructor(container) {
        this.container = container;
        this.init();
    }
    
    init() {
        this.container.innerHTML = `
            <div class="game-board">
                <h3>游戏规则：</h3>
                <p>两人轮流取棋子，每次可以取1-2个，取到最后一个棋子的人获胜。</p>
                <div id="throne-board">
                    <div class="stones"></div>
                    <div class="status">轮到你取棋，请选择取1个或2个</div>
                </div>
            </div>
            <div class="game-controls">
                <button id="take-1">取1个</button>
                <button id="take-2">取2个</button>
                <button id="restart-throne">重新开始</button>
            </div>
        `;
        
        this.stones = 10; // 初始棋子数
        this.turn = 'player'; // 玩家先
        this.renderStones();
        
        // 绑定事件
        document.getElementById('take-1').addEventListener('click', () => this.takeStones(1));
        document.getElementById('take-2').addEventListener('click', () => this.takeStones(2));
        document.getElementById('restart-throne').addEventListener('click', () => this.restart());
    }
    
    renderStones() {
        const stonesContainer = this.container.querySelector('.stones');
        stonesContainer.innerHTML = '';
        for (let i = 0; i < this.stones; i++) {
            const stone = document.createElement('div');
            stone.className = 'stone';
            stone.style.cssText = `
                display: inline-block;
                width: 30px;
                height: 30px;
                background-color: #4CAF50;
                border-radius: 50%;
                margin: 5px;
            `;
            stonesContainer.appendChild(stone);
        }
    }
    
    takeStones(count) {
        if (this.turn !== 'player' || this.stones <= 0) return;
        
        this.stones -= count;
        this.renderStones();
        
        if (this.stones <= 0) {
            this.container.querySelector('.status').textContent = '恭喜你获胜！';
            return;
        }
        
        this.turn = 'computer';
        this.container.querySelector('.status').textContent = '电脑取棋中...';
        
        // 电脑AI
        setTimeout(() => {
            let computerTake = 3 - count; // 最优策略
            if (this.stones <= 2) {
                computerTake = this.stones;
            }
            
            this.stones -= computerTake;
            this.renderStones();
            
            if (this.stones <= 0) {
                this.container.querySelector('.status').textContent = '电脑获胜！';
            } else {
                this.turn = 'player';
                this.container.querySelector('.status').textContent = '轮到你取棋，请选择取1个或2个';
            }
        }, 1000);
    }
    
    restart() {
        this.stones = 10;
        this.turn = 'player';
        this.renderStones();
        this.container.querySelector('.status').textContent = '轮到你取棋，请选择取1个或2个';
    }
}