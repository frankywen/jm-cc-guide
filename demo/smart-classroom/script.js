// 游戏管理
class GameManager {
    constructor() {
        this.currentGame = null;
        this.init();
    }
    
    init() {
        // 绑定游戏卡片点击事件
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                const gameName = card.dataset.game;
                this.startGame(gameName);
            });
        });
        
        // 绑定返回按钮事件
        document.getElementById('back-btn').addEventListener('click', () => {
            this.returnToMenu();
        });
    }
    
    startGame(gameName) {
        // 隐藏主菜单，显示游戏容器
        document.querySelector('.container').classList.add('hidden');
        document.getElementById('game-container').classList.remove('hidden');
        
        // 设置游戏标题
        const gameTitles = {
            'take-throne': '智取王位',
            'four-puzzle': '四巧板',
            'tangram': '七巧板',
            'twenty-four': '24点',
            'sudoku': '数独',
            'hua-rong-dao': '华容道'
        };
        document.getElementById('game-title').textContent = gameTitles[gameName];
        
        // 初始化对应游戏
        const gameContent = document.getElementById('game-content');
        gameContent.innerHTML = '';
        
        switch(gameName) {
            case 'take-throne':
                this.currentGame = new TakeThrone(gameContent);
                break;
            case 'four-puzzle':
                this.currentGame = new FourPuzzle(gameContent);
                break;
            case 'tangram':
                this.currentGame = new Tangram(gameContent);
                break;
            case 'twenty-four':
                this.currentGame = new TwentyFour(gameContent);
                break;
            case 'sudoku':
                this.currentGame = new Sudoku(gameContent);
                break;
            case 'hua-rong-dao':
                this.currentGame = new HuaRongDao(gameContent);
                break;
        }
    }
    
    returnToMenu() {
        // 隐藏游戏容器，显示主菜单
        document.getElementById('game-container').classList.add('hidden');
        document.querySelector('.container').classList.remove('hidden');
        
        // 清理当前游戏
        this.currentGame = null;
    }
}

// 初始化游戏管理器
window.addEventListener('DOMContentLoaded', () => {
    new GameManager();
});