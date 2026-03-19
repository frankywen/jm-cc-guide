// 七巧板游戏 - 基于开源项目 https://github.com/twpride/tangram
class Tangram {
    constructor(container) {
        this.container = container;
        this.init();
    }
    
    init() {
        // 复制开源项目的HTML结构
        this.container.innerHTML = `
            <div id="canv">
                <canvas id='mainCanvas'></canvas>
                <div class="topWrapper">
                    <div id="thumblabel">
                        <div id="probnum"></div>
                        <timer-ele id='timer'></timer-ele>
                    </div>
                    <svg id='pauseButton' class="playpause canvButton" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24">
                        <g>
                            <rect fill="none" height="24" width="24" />
                        </g>
                        <g>
                            <g>
                                <path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M11,16H9V8h2V16z M15,16h-2V8h2V16z" />
                            </g>
                        </g>
                    </svg>
                    <svg id='flipButton' class='canvButton' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <path d="M 12 2 C 6.4830746 2 2 6.4830746 2 12 C 2 17.516925 6.4830746 22 12 22 C 17.516925 22 22 17.516925 22 12 C 22 6.4830746 17.516925 2 12 2 z M 12 3 C 16.976486 3 21 7.0235141 21 12 C 21 16.976486 16.976486 21 12 21 C 7.0235141 21 3 16.976486 3 12 C 3 7.0235141 7.0235141 3 12 3 z " />
                        <path d="M 9.4458229,5.2499999 5.7969994,8.8986426 v 7.2973234 l 3.6488235,-3.648757 z m 2.1892951,0 V 7.439178 h 0.729764 V 5.2499999 Z m 2.919058,0 V 12.547209 L 18.203,16.195966 V 8.8986426 Z m -2.919058,4.3783939 v 2.1891022 h 0.729764 V 9.6283938 Z m 0,4.3783562 v 2.189216 h 0.729764 V 14.00675 Z m -4.5368001,1.440907 0.7739502,2.321726 0.5159664,-0.515906 A 5.1080977,5.1081006 0 0 0 12,18.749981 5.1080977,5.1081006 0 0 0 15.611765,17.253477 l 0.515966,0.515906 0.773951,-2.321726 -2.321851,0.773934 0.515967,0.515943 A 4.378588,4.3783724 0 0 1 12,18.02023 4.378588,4.3783724 0 0 1 8.9042008,16.737534 l 0.515966,-0.515943 z" id="path1382" />
                    </svg>
                </div>
            </div>
            <div id="menu">
                <div class="topWrapper">
                    <svg id='playButton' class="playpause" xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24">
                        <g>
                            <rect fill="none" height="24" width="24" />
                        </g>
                        <g>
                            <path d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M9.5,16.5v-9l7,4.5L9.5,16.5z" />
                        </g>
                    </svg>
                    <svg id='infoButton' class="playpause overlayInfo" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                        <path d="M 12 2 C 6.4830748 2 2 6.4830748 2 12 C 2 17.516925 6.4830748 22 12 22 C 17.516925 22 22 17.516925 22 12 C 22 6.4830748 17.516925 2 12 2 z M 12 3 C 16.976485 3 21 7.0235149 21 12 C 21 16.976485 16.976485 21 12 21 C 7.0235149 21 3 16.976485 3 12 C 3 7.0235149 7.0235149 3 12 3 z " id="path838" />
                        <path d="m 11,18 h 2 V 16 H 11 Z M 12,6 C 9.79,6 8,7.79 8,10 h 2 c 0,-1.1 0.9,-2 2,-2 1.1,0 2,0.9 2,2 0,2 -3,1.75 -3,5 h 2 c 0,-2.25 3,-2.5 3,-5 0,-2.21 -1.79,-4 -4,-4 z" id="path4" sodipodi:nodetypes="cccccsccssccss" />
                    </svg>
                    <div id='legendWrapper'>
                        <div>
                            <div>状态</div>
                            <div>标签 </div>
                            <div>数量 </div>
                        </div>
                        <div id='solvedString'>
                            <div>已完成</div>
                            <div>0<div class="colorBar ryg"></div>&gt;5分钟</div>
                            <div></div>
                        </div>
                        <div id='inProgressString'>
                            <div>进行中</div>
                            <div>0<div class="colorBar blue"></div>&gt;5分钟</div>
                            <div></div>
                        </div>
                        <div id='notStartedString'>
                            <div>未开始</div>
                            <div>
                                <div class="whiteBar"></div>
                            </div>
                            <div></div>
                        </div>
                    </div>
                </div>
                <div id='levelSelectorWrapper'>
                    <svg id='cardUpArrow' class="cardArrow" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                        <path d="M14 7l-5 5 5 5V7z" />
                        <path d="M24 0v24H0V0h24z" fill="none" />
                    </svg>
                    <svg id='cardDownArrow' class="cardArrow" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                        <path d="M10 17l5-5-5-5v10z" />
                        <path d="M0 24V0h24v24H0z" fill="none" />
                    </svg>
                </div>
                <div id="info">
                    <div id='title-wrapper'>
                        <div>179 七巧板</div>
                        <div id='link-icons-wrapper'>
                            <a href='https://github.com/twpride/tangram'>
                                <svg class="link-icons" id='github' xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24">
                                    <path d="M 12.039683,-1.9101289e-4 C 5.3777255,-1.9101289e-4 0,5.3774113 0,12.039218 c 0,5.297339 3.451376,9.792052 8.267249,11.397306 0.642117,0.08027 0.802646,-0.240787 0.802646,-0.561839 v -2.08683 C 5.698783,21.510219 4.9764025,19.1826 4.9764025,19.1826 4.4145508,17.818134 3.6119047,17.41682 3.6119047,17.41682 c -1.1237034,-0.722365 0.080268,-0.722365 0.080268,-0.722365 1.2039691,0.08027 1.8460852,1.203942 1.8460852,1.203942 C 6.581697,19.74444 8.347518,19.1826 9.069898,18.86155 9.150168,18.058922 9.471221,17.577345 9.872544,17.256295 7.2238131,16.935244 4.4145544,15.891828 4.4145544,11.316853 c 0,-1.284203 0.4815874,-2.4078819 1.2039678,-3.2105099 C 5.4579935,7.7852929 5.0566705,6.581352 5.6987902,4.8958348 c 0,0 1.0434391,-0.3210508 3.2908468,1.2039409 0.963175,-0.2407882 2.006614,-0.4013137 3.050053,-0.4013137 1.04344,0 2.086879,0.1605255 3.050053,0.4013137 2.327673,-1.5249917 3.290848,-1.2039409 3.290848,-1.2039409 0.642116,1.6855172 0.240793,2.8894581 0.08027,3.2105083 0.802645,0.802628 1.203968,1.9263069 1.203968,3.2105099 0,4.655239 -2.809259,5.618391 -5.45799,5.939442 0.401323,0.401313 0.802646,1.123678 0.802646,2.247357 v 3.29077 c 0,0.321051 0.240793,0.722365 0.802646,0.56184 4.815872,-1.605255 8.186984,-6.099967 8.186984,-11.397307 C 24.079385,5.3774113 18.701654,-1.9101289e-4 12.039696,-1.9101289e-4 Z" />
                                </svg>
                            </a>
                        </div>
                        <svg class="link-icons overlayInfo" id='close-info-button' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="black" width="16px" height="16px">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                        </svg>
                    </div>
                    <div id='list-wrapper'>
                        <h3 id="goal">如何玩</h3>
                        <ul>
                            <li>点击右下角的关卡选择器选择关卡
                            </li>
                            <li>移动七巧板拼出左上角的轮廓
                                <ul>
                                    <li>必须使用所有七块板，且不能重叠</li>
                                </ul>
                            </li>
                            <li>尽可能获得更多的绿色方块！<ul>
                                    <li>关卡选择器中的每个方块颜色基于拼图状态和完成时间（请参见图例中的颜色条）</li>
                                </ul>
                            </li>
                        </ul>
                        <h3 id="controls-to-move-tiles">操作说明</h3>
                        <ul>
                            <li>移动七巧板<ul>
                                    <li>鼠标：左键点击并拖动</li>
                                    <li>触摸：点击并拖动</li>
                                </ul>
                            </li>
                            <li>旋转七巧板<ul>
                                    <li>鼠标：右键点击并拖动</li>
                                    <li>双指触摸：用一根手指触摸七巧板，用另一根手指拖动</li>
                                    <li>单指触摸：双击七巧板，在第二次点击时拖动</li>
                                </ul>
                            </li>
                            <li>抬起七巧板（使其可以穿过其他七巧板）<ul>
                                    <li>鼠标：双击</li>
                                    <li>触摸：长按</li>
                                </ul>
                            </li>
                            <li>翻转平行四边形<ul>
                                    <li>点击播放/暂停按钮下方的按钮</li>
                                </ul>
                            </li>
                            <li>退出或暂停游戏<ul>
                                    <li>点击暂停按钮，或按 &lt;Escape&gt; 键</li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div id="silcanvas"></div>
        `;
        
        // 加载并初始化游戏
        this.loadGame();
    }
    
    loadGame() {
        // 动态加载必要的JavaScript文件
        const scripts = [
            'games/tangram/timer.js',
            'games/tangram/shape.js',
            'games/tangram/shapeGeoms.js',
            'games/tangram/vectorUtils.js',
            'games/tangram/seed.js',
            'games/tangram/util.js',
            'games/tangram/levelSelector.js',
            'games/tangram/game.js',
            'games/tangram/index.js'
        ];
        
        let loaded = 0;
        scripts.forEach(script => {
            const scriptElement = document.createElement('script');
            scriptElement.src = script;
            scriptElement.type = 'module';
            scriptElement.onload = () => {
                loaded++;
                if (loaded === scripts.length) {
                    // 所有脚本加载完成后初始化游戏
                    setTimeout(() => {
                        if (window.game) {
                            // 游戏已经初始化
                        } else {
                            // 重新初始化游戏
                            import('games/tangram/game.js').then(({ TangramGame }) => {
                                window.game = new TangramGame();
                            });
                        }
                    }, 100);
                }
            };
            document.head.appendChild(scriptElement);
        });
    }
}