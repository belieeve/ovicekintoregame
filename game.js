class MusicGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.loadingScreen = document.getElementById('loadingScreen');
        this.startScreen = document.getElementById('startScreen');
        this.startButton = document.getElementById('startButton');
        
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.isPlaying = false;
        this.gameStartTime = 0;
        
        this.notes = [];
        this.lanes = [200, 300, 500, 600];
        this.keys = ['d', 'f', 'j', 'k'];
        this.laneKeys = { 'd': 0, 'f': 1, 'j': 2, 'k': 3 };
        this.keyPressed = [false, false, false, false];
        
        this.noteSpeed = 300;
        this.hitZoneY = 500;
        this.hitTolerance = 50;
        
        this.audio = null;
        this.audioLoaded = false;
        this.musicDataManager = new MusicDataManager();
        this.bpm = 120;
        this.beatInterval = 60000 / this.bpm;
        
        this.particles = [];
        
        this.init();
    }

    init() {
        this.startButton.addEventListener('click', () => this.startGame());
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        this.generateRandomPattern();
        this.preloadAudio();
        this.gameLoop();
    }

    preloadAudio() {
        const updateProgress = (progress) => {
            const progressBar = document.querySelector('.loading-progress');
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
        };
        
        // 進行状況を段階的に表示
        updateProgress(25);
        
        // 埋め込みデータから音楽を読み込み
        setTimeout(() => {
            updateProgress(50);
            
            const embeddedAudio = this.musicDataManager.getAudio();
            if (embeddedAudio) {
                this.audio = embeddedAudio;
                this.audioLoaded = true;
                this.audio.volume = 0.7;
                this.audio.loop = true;
                
                // 楽曲情報を取得してBPMを設定
                const trackInfo = this.musicDataManager.getTrackInfo();
                if (trackInfo && trackInfo.bpm) {
                    this.bpm = trackInfo.bpm;
                    this.beatInterval = 60000 / this.bpm;
                }
                
                updateProgress(100);
                this.showLoadingComplete(true);
                return;
            }
            
            // 埋め込みデータがない場合は外部ファイルを試行
            this.tryLoadExternalAudio(updateProgress);
        }, 500);
    }
    
    tryLoadExternalAudio(updateProgress) {
        const audioFiles = [
            // GitHub raw URL（実際のリポジトリURL）
            'https://raw.githubusercontent.com/belieeve/ovicekintoregame/main/assets/audio/hentaisong.mp3',
            'https://raw.githubusercontent.com/belieeve/ovicekintoregame/main/assets/audio/hentaisong02.mp3',
            // ローカル・相対パス
            'assets/audio/hentaisong.mp3',
            'assets/audio/hentaisong02.mp3', 
            'hentaisong.mp3'
        ];
        
        let loadedCount = 0;
        let totalFiles = audioFiles.length;
        
        const tryLoadAudio = (fileIndex) => {
            if (fileIndex >= audioFiles.length) {
                this.showLoadingComplete(false);
                return;
            }
            
            const audio = new Audio();
            const audioFile = audioFiles[fileIndex];
            
            audio.oncanplaythrough = () => {
                if (!this.audioLoaded) {
                    this.audio = audio;
                    this.audioLoaded = true;
                    this.audio.volume = 0.7;
                    this.audio.loop = true;
                    updateProgress(100);
                    this.showLoadingComplete(true);
                }
            };
            
            audio.onerror = () => {
                console.log(`Failed to load ${audioFile}, trying next...`);
                loadedCount++;
                updateProgress(50 + (loadedCount / totalFiles) * 25);
                tryLoadAudio(fileIndex + 1);
            };
            
            audio.src = audioFile;
            audio.load();
        };
        
        tryLoadAudio(0);
    }

    showLoadingComplete(audioFound) {
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
            this.startScreen.style.display = 'flex';
            
            if (!audioFound) {
                const instructions = this.startScreen.querySelector('.instructions');
                instructions.innerHTML = `
                    音楽に合わせてノーツをタップしよう！<br>
                    D・F・J・Kキーを使って演奏しよう<br>
                    タイミングよく押してハイスコアを目指そう！<br>
                    <small style="color: #ffaa00;">※ 音楽ファイルが設定されていません</small><br>
                    <small style="color: #aaaaaa;">コンソールで showMusicLoader() を実行して音楽を追加できます</small>
                `;
            } else {
                const trackInfo = this.musicDataManager.getTrackInfo();
                if (trackInfo && trackInfo.name) {
                    const instructions = this.startScreen.querySelector('.instructions');
                    instructions.innerHTML += `<br><small style="color: #4CAF50;">♪ ${trackInfo.name} が読み込まれました</small>`;
                }
            }
        }, 500);
    }

    startGame() {
        this.startScreen.style.display = 'none';
        this.isPlaying = true;
        this.gameStartTime = Date.now();
        this.score = 0;
        this.combo = 0;
        this.notes = [];
        this.generateRandomPattern();
        
        this.playBackgroundMusic();
    }

    playBackgroundMusic() {
        if (this.audio && this.audioLoaded) {
            this.audio.currentTime = 0;
            this.audio.play().catch(e => {
                console.log('Audio playback failed:', e);
            });
        }
    }

    generateRandomPattern() {
        this.notes = [];
        const patternDuration = 60000;
        const noteInterval = 500;
        
        for (let time = 2000; time < patternDuration; time += noteInterval + Math.random() * 300) {
            const lane = Math.floor(Math.random() * 4);
            this.notes.push({
                lane: lane,
                time: time,
                y: -50,
                hit: false
            });
            
            if (Math.random() < 0.3) {
                time += 250;
                const lane2 = (lane + 1 + Math.floor(Math.random() * 3)) % 4;
                this.notes.push({
                    lane: lane2,
                    time: time,
                    y: -50,
                    hit: false
                });
            }
        }
    }

    handleKeyDown(e) {
        if (!this.isPlaying) return;
        
        const key = e.key.toLowerCase();
        if (this.laneKeys.hasOwnProperty(key)) {
            e.preventDefault();
            const laneIndex = this.laneKeys[key];
            
            if (!this.keyPressed[laneIndex]) {
                this.keyPressed[laneIndex] = true;
                this.updateKeyVisual(key, true);
                this.checkNoteHit(laneIndex);
            }
        }
    }

    handleKeyUp(e) {
        const key = e.key.toLowerCase();
        if (this.laneKeys.hasOwnProperty(key)) {
            const laneIndex = this.laneKeys[key];
            this.keyPressed[laneIndex] = false;
            this.updateKeyVisual(key, false);
        }
    }

    updateKeyVisual(key, pressed) {
        const keyElement = document.querySelector(`.key[data-key="${key}"]`);
        if (keyElement) {
            if (pressed) {
                keyElement.classList.add('active');
            } else {
                keyElement.classList.remove('active');
            }
        }
    }

    checkNoteHit(laneIndex) {
        let bestNote = null;
        let bestDistance = Infinity;
        
        for (let note of this.notes) {
            if (note.lane === laneIndex && !note.hit) {
                const distance = Math.abs(note.y - this.hitZoneY);
                if (distance < this.hitTolerance && distance < bestDistance) {
                    bestNote = note;
                    bestDistance = distance;
                }
            }
        }
        
        if (bestNote) {
            bestNote.hit = true;
            const accuracy = this.getAccuracy(bestDistance);
            this.addScore(accuracy);
            this.showHitEffect(this.lanes[laneIndex], accuracy);
            this.createHitParticles(this.lanes[laneIndex], this.hitZoneY);
        }
    }

    getAccuracy(distance) {
        if (distance < 15) return 'perfect';
        if (distance < 30) return 'great';
        if (distance < 50) return 'good';
        return 'miss';
    }

    addScore(accuracy) {
        const scoreValues = {
            'perfect': 300,
            'great': 200,
            'good': 100,
            'miss': 0
        };
        
        const points = scoreValues[accuracy];
        this.score += points + (this.combo * 10);
        
        if (accuracy !== 'miss') {
            this.combo++;
            this.maxCombo = Math.max(this.maxCombo, this.combo);
        } else {
            this.combo = 0;
        }
        
        this.updateUI();
    }

    showHitEffect(x, accuracy) {
        const hitEffect = document.getElementById('hitEffect');
        hitEffect.className = accuracy;
        hitEffect.style.left = (x - 50) + 'px';
        hitEffect.style.top = (this.hitZoneY - 50) + 'px';
        hitEffect.style.opacity = '1';
        hitEffect.style.transform = 'scale(1)';
        
        setTimeout(() => {
            hitEffect.style.opacity = '0';
            hitEffect.style.transform = 'scale(0)';
        }, 300);
    }

    createHitParticles(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                life: 1.0,
                decay: 0.02,
                size: Math.random() * 5 + 2,
                color: `hsl(${Math.random() * 60 + 40}, 100%, 60%)`
            });
        }
    }

    updateUI() {
        document.getElementById('score').textContent = `SCORE: ${this.score}`;
        document.getElementById('combo').textContent = `COMBO: ${this.combo}`;
    }

    update() {
        if (!this.isPlaying) return;
        
        const currentTime = Date.now() - this.gameStartTime;
        const deltaTime = 16;
        
        for (let note of this.notes) {
            if (!note.hit) {
                note.y += this.noteSpeed * deltaTime / 1000;
                
                if (note.y > this.hitZoneY + this.hitTolerance && !note.hit) {
                    note.hit = true;
                    this.combo = 0;
                    this.showHitEffect(this.lanes[note.lane], 'miss');
                }
            }
        }
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx * deltaTime / 1000;
            particle.y += particle.vy * deltaTime / 1000;
            particle.life -= particle.decay;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw() {
        this.ctx.fillStyle = '#000033';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawBackground();
        this.drawLanes();
        this.drawHitZone();
        this.drawNotes();
        this.drawParticles();
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.canvas.width;
            const y = (Date.now() * 0.1 + i * 50) % (this.canvas.height + 50);
            this.ctx.fillRect(x, y, 2, 20);
        }
    }

    drawLanes() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        
        for (let x of this.lanes) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
    }

    drawHitZone() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fillRect(0, this.hitZoneY - 25, this.canvas.width, 50);
        
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.hitZoneY);
        this.ctx.lineTo(this.canvas.width, this.hitZoneY);
        this.ctx.stroke();
    }

    drawNotes() {
        for (let note of this.notes) {
            if (note.hit) continue;
            
            const x = this.lanes[note.lane];
            const gradient = this.ctx.createRadialGradient(x, note.y, 0, x, note.y, 30);
            gradient.addColorStop(0, '#ff6b6b');
            gradient.addColorStop(1, '#ffd93d');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, note.y, 25, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }

    drawParticles() {
        for (let particle of this.particles) {
            this.ctx.save();
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

window.addEventListener('load', () => {
    new MusicGame();
});