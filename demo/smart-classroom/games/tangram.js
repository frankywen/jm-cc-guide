// 七巧板游戏 - 简化版本
class Tangram {
    constructor(container) {
        this.container = container;
        this.init();
    }
    
    init() {
        // 设置容器样式
        this.container.style.position = 'relative';
        this.container.style.width = '100%';
        this.container.style.height = '600px';
        this.container.style.backgroundColor = '#f0f0f0';
        this.container.style.overflow = 'hidden';
        
        // 清空容器
        this.container.innerHTML = '';
        
        // 创建Canvas元素
        const canvas = document.createElement('canvas');
        canvas.id = 'mainCanvas';
        canvas.width = this.container.clientWidth;
        canvas.height = this.container.clientHeight;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.zIndex = '1';
        this.container.appendChild(canvas);
        
        // 创建游戏标题
        const title = document.createElement('h2');
        title.textContent = '七巧板';
        title.style.position = 'absolute';
        title.style.top = '10px';
        title.style.left = '20px';
        title.style.zIndex = '2';
        title.style.color = '#333';
        this.container.appendChild(title);
        
        // 创建控制按钮
        const controls = document.createElement('div');
        controls.className = 'tangram-controls';
        controls.style.position = 'absolute';
        controls.style.top = '10px';
        controls.style.right = '20px';
        controls.style.zIndex = '2';
        
        // 重置按钮
        const resetButton = document.createElement('button');
        resetButton.id = 'resetButton';
        resetButton.textContent = '重置';
        resetButton.style.marginRight = '10px';
        resetButton.style.padding = '5px 10px';
        resetButton.style.backgroundColor = '#4CAF50';
        resetButton.style.color = 'white';
        resetButton.style.border = 'none';
        resetButton.style.borderRadius = '4px';
        resetButton.style.cursor = 'pointer';
        controls.appendChild(resetButton);
        
        // 提示按钮
        const hintButton = document.createElement('button');
        hintButton.id = 'hintButton';
        hintButton.textContent = '提示';
        hintButton.style.padding = '5px 10px';
        hintButton.style.backgroundColor = '#2196F3';
        hintButton.style.color = 'white';
        hintButton.style.border = 'none';
        hintButton.style.borderRadius = '4px';
        hintButton.style.cursor = 'pointer';
        controls.appendChild(hintButton);
        
        this.container.appendChild(controls);
        
        // 初始化游戏
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.shapes = this.createTangramShapes();
        this.isDragging = false;
        this.selectedShape = null;
        this.offsetX = 0;
        this.offsetY = 0;
        
        // 绑定事件
        this.bindEvents();
        
        // 绘制初始状态
        this.draw();
    }
    
    createTangramShapes() {
        // 创建七巧板的七个基本形状
        const shapes = [];
        const size = Math.min(this.canvas.width, this.canvas.height) * 0.4;
        
        // 定义形状的颜色
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA69E', '#98D4BB', '#FFE66D', '#1A535C'];
        
        // 大三角形 1
        shapes.push({
            type: 'largeTriangle',
            points: [
                { x: size, y: 0 },
                { x: 0, y: size },
                { x: size, y: size }
            ],
            color: colors[0],
            x: 50,
            y: 50,
            rotation: 0
        });
        
        // 大三角形 2
        shapes.push({
            type: 'largeTriangle',
            points: [
                { x: 0, y: 0 },
                { x: size, y: 0 },
                { x: 0, y: size }
            ],
            color: colors[1],
            x: size + 100,
            y: 50,
            rotation: 0
        });
        
        // 中三角形
        shapes.push({
            type: 'mediumTriangle',
            points: [
                { x: 0, y: 0 },
                { x: size / 2, y: size / 2 },
                { x: 0, y: size }
            ],
            color: colors[2],
            x: 50,
            y: size + 100,
            rotation: 0
        });
        
        // 小三角形 1
        shapes.push({
            type: 'smallTriangle',
            points: [
                { x: 0, y: 0 },
                { x: size / 2, y: size / 2 },
                { x: 0, y: size / 2 }
            ],
            color: colors[3],
            x: size / 2 + 75,
            y: size + 100,
            rotation: 0
        });
        
        // 小三角形 2
        shapes.push({
            type: 'smallTriangle',
            points: [
                { x: 0, y: 0 },
                { x: size / 2, y: 0 },
                { x: size / 2, y: size / 2 }
            ],
            color: colors[4],
            x: size / 2 + 150,
            y: size + 100,
            rotation: 0
        });
        
        // 正方形
        shapes.push({
            type: 'square',
            points: [
                { x: 0, y: 0 },
                { x: size / 2, y: 0 },
                { x: size / 2, y: size / 2 },
                { x: 0, y: size / 2 }
            ],
            color: colors[5],
            x: size + 100,
            y: size / 2 + 75,
            rotation: 45
        });
        
        // 平行四边形
        shapes.push({
            type: 'parallelogram',
            points: [
                { x: 0, y: 0 },
                { x: size, y: 0 },
                { x: size / 2, y: size / 2 },
                { x: -size / 2, y: size / 2 }
            ],
            color: colors[6],
            x: size + 150,
            y: size / 2 + 150,
            rotation: 45
        });
        
        return shapes;
    }
    
    bindEvents() {
        // 鼠标事件
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));
        
        // 触摸事件
        this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
        
        // 按钮事件
        document.getElementById('resetButton').addEventListener('click', this.resetGame.bind(this));
        document.getElementById('hintButton').addEventListener('click', this.showHint.bind(this));
    }
    
    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 从后向前检查，确保点击到最上层的形状
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const shape = this.shapes[i];
            if (this.isPointInShape(x, y, shape)) {
                this.selectedShape = shape;
                this.isDragging = true;
                this.offsetX = x - shape.x;
                this.offsetY = y - shape.y;
                
                // 将选中的形状移到数组末尾（最上层）
                this.shapes.splice(i, 1);
                this.shapes.push(shape);
                break;
            }
        }
    }
    
    onMouseMove(e) {
        if (this.isDragging && this.selectedShape) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.selectedShape.x = x - this.offsetX;
            this.selectedShape.y = y - this.offsetY;
            this.draw();
        }
    }
    
    onMouseUp(e) {
        this.isDragging = false;
        this.selectedShape = null;
    }
    
    onTouchStart(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        
        for (let i = this.shapes.length - 1; i >= 0; i--) {
            const shape = this.shapes[i];
            if (this.isPointInShape(x, y, shape)) {
                this.selectedShape = shape;
                this.isDragging = true;
                this.offsetX = x - shape.x;
                this.offsetY = y - shape.y;
                
                this.shapes.splice(i, 1);
                this.shapes.push(shape);
                break;
            }
        }
    }
    
    onTouchMove(e) {
        e.preventDefault();
        if (this.isDragging && this.selectedShape) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.touches[0].clientX - rect.left;
            const y = e.touches[0].clientY - rect.top;
            
            this.selectedShape.x = x - this.offsetX;
            this.selectedShape.y = y - this.offsetY;
            this.draw();
        }
    }
    
    onTouchEnd(e) {
        this.isDragging = false;
        this.selectedShape = null;
    }
    
    isPointInShape(x, y, shape) {
        // 检查点是否在形状内
        const points = shape.points;
        let inside = false;
        
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i].x, yi = points[i].y;
            const xj = points[j].x, yj = points[j].y;
            
            const intersect = ((yi > y) != (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        
        return inside;
    }
    
    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制每个形状
        this.shapes.forEach(shape => {
            this.ctx.save();
            this.ctx.translate(shape.x, shape.y);
            this.ctx.rotate(shape.rotation * Math.PI / 180);
            
            this.ctx.beginPath();
            this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
            for (let i = 1; i < shape.points.length; i++) {
                this.ctx.lineTo(shape.points[i].x, shape.points[i].y);
            }
            this.ctx.closePath();
            
            this.ctx.fillStyle = shape.color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            this.ctx.restore();
        });
    }
    
    resetGame() {
        // 重置游戏
        this.shapes = this.createTangramShapes();
        this.draw();
    }
    
    showHint() {
        // 显示提示（简单实现）
        alert('提示：尝试将七巧板拼成一个正方形或其他形状！');
    }
}
