// 四巧板游戏
class FourPuzzle {
    constructor(container) {
        this.container = container;
        this.init();
    }
    
    init() {
        this.container.innerHTML = `
            <div class="game-board">
                <h3>四巧板</h3>
                <p>拖动下面的图形到上方区域进行拼图</p>
                <div id="four-puzzle-board" style="width: 300px; height: 300px; border: 2px solid #333; margin: 20px auto; position: relative; background-color: #f9f9f9;"></div>
                <div id="four-puzzle-pieces" style="display: flex; justify-content: center; gap: 10px; margin-top: 20px;"></div>
            </div>
            <div class="game-controls">
                <button id="restart-four">重新开始</button>
            </div>
        `;
        
        this.createPieces();
    }
    
    createPieces() {
        const pieces = [
            { shape: 'square', width: 75, height: 75, color: '#FF6B6B' },
            { shape: 'triangle', width: 150, height: 75, color: '#4ECDC4' },
            { shape: 'triangle', width: 75, height: 150, color: '#FFE66D' },
            { shape: 'irregular', width: 150, height: 150, color: '#1A535C' }
        ];
        
        const piecesContainer = this.container.querySelector('#four-puzzle-pieces');
        pieces.forEach((piece, index) => {
            const element = document.createElement('div');
            element.className = 'puzzle-piece';
            element.style.cssText = `
                width: ${piece.width}px;
                height: ${piece.height}px;
                background-color: ${piece.color};
                cursor: move;
                position: relative;
            `;
            
            if (piece.shape === 'triangle') {
                element.style.clipPath = piece.width > piece.height ? 'polygon(0 0, 100% 0, 50% 100%)' : 'polygon(0 0, 100% 50%, 0 100%)';
            } else if (piece.shape === 'irregular') {
                element.style.clipPath = 'polygon(0 0, 100% 0, 100% 50%, 50% 50%, 50% 100%, 0 100%)';
            }
            
            element.draggable = true;
            element.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', index);
            });
            
            piecesContainer.appendChild(element);
        });
        
        const board = this.container.querySelector('#four-puzzle-board');
        board.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        board.addEventListener('drop', (e) => {
            e.preventDefault();
            const pieceIndex = e.dataTransfer.getData('text/plain');
            const piece = piecesContainer.children[pieceIndex];
            
            const rect = board.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            piece.style.position = 'absolute';
            piece.style.left = `${x}px`;
            piece.style.top = `${y}px`;
            piece.style.transform = 'translate(-50%, -50%)';
            
            board.appendChild(piece);
        });
        
        document.getElementById('restart-four').addEventListener('click', () => {
            const board = this.container.querySelector('#four-puzzle-board');
            const piecesContainer = this.container.querySelector('#four-puzzle-pieces');
            
            // 把所有棋子放回原位
            while (board.firstChild) {
                piecesContainer.appendChild(board.firstChild);
            }
            
            // 重置棋子样式
            document.querySelectorAll('.puzzle-piece').forEach(piece => {
                piece.style.position = 'relative';
                piece.style.left = '0';
                piece.style.top = '0';
                piece.style.transform = 'none';
            });
        });
    }
}