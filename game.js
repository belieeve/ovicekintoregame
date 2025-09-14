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
        this.lanes = [300, 450, 600, 750];
        this.keys = ['d', 'f', 'j', 'k'];
        this.laneKeys = { 'd': 0, 'f': 1, 'j': 2, 'k': 3 };
        this.keyPressed = [false, false, false, false];
        
        this.noteSpeed = 400;
        this.hitZoneY = 650;
        this.hitTolerance = 50;
        
        this.audio = null;
        this.audioLoaded = false;
        this.musicDataManager = new MusicDataManager();
        this.songManager = new SongManager();
        this.bpm = 120;
        this.beatInterval = 60000 / this.bpm;
        
        // 音楽解析・譜面生成
        this.audioContext = null;
        this.beatDetector = null;
        this.chartGenerator = new ChartGenerator(this.bpm);
        
        // 背景動画
        this.backgroundVideo = null;
        this.videoLoaded = false;
        
        this.particles = [];
        
        this.init();
    }

    init() {
        this.startButton.addEventListener('click', () => this.startGame());
        
        // 音声テストボタンを追加
        const testAudioButton = document.getElementById('testAudioButton');
        if (testAudioButton) {
            testAudioButton.addEventListener('click', () => this.testAudio());
        }
        
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // 楽曲選択UIの初期化
        this.initSongSelection();
        
        this.generateRandomPattern();
        this.preloadAudio();
        this.preloadBackgroundVideo();
        this.gameLoop();
    }
    
    initSongSelection() {
        const songItems = document.querySelectorAll('.song-item');
        
        songItems.forEach((item, index) => {
            // クリックイベント
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                console.log(`Song item clicked: ${index}`);
                
                // 他の曲の選択を解除
                songItems.forEach(other => other.classList.remove('active'));
                
                // 選択した曲をアクティブにする
                item.classList.add('active');
                
                // SongManagerで楽曲を選択
                const songId = item.getAttribute('data-song');
                this.songManager.selectSong(songId);
                
                // 選択した楽曲の情報を更新
                this.updateSelectedSongInfo(songId);
                
                console.log(`Song selected: ${songId}`);
            });
            
            // タッチイベント（モバイル対応）
            item.addEventListener('touchstart', (e) => {
                e.preventDefault();
                item.click();
            });
            
            // ホバーエフェクトのバックアップ
            item.addEventListener('mouseenter', () => {
                item.style.background = 'rgba(255, 255, 255, 0.2)';
            });
            
            item.addEventListener('mouseleave', () => {
                if (!item.classList.contains('active')) {
                    item.style.background = 'rgba(255, 255, 255, 0.1)';
                }
            });
        });
        
        console.log(`Initialized ${songItems.length} song selection items`);
    }
    
    updateSelectedSongInfo(songId) {
        const songInfo = this.songManager.getSongInfo(songId);
        if (songInfo) {
            // BPMを更新
            this.bpm = songInfo.bpm;
            this.beatInterval = 60000 / this.bpm;
            
            console.log(`Updated BPM to ${this.bpm} for song: ${songInfo.name}`);
        }
    }
    
    preloadBackgroundVideo() {
        this.backgroundVideo = document.createElement('video');
        this.backgroundVideo.muted = true; // 動画に音声がないためミュート
        this.backgroundVideo.loop = true;
        this.backgroundVideo.preload = 'auto';
        this.backgroundVideo.style.display = 'none';
        
        // 動画ファイルのソースを設定
        const videoSources = [
            'douga03.mp4',
            './douga03.mp4',
            '/douga03.mp4'
        ];
        
        let loadSuccess = false;
        
        const tryLoadVideo = (sourceIndex) => {
            if (sourceIndex >= videoSources.length) {
                console.log('Background video not found, using default background');
                return;
            }
            
            this.backgroundVideo.src = videoSources[sourceIndex];
            
            this.backgroundVideo.oncanplaythrough = () => {
                if (!loadSuccess) {
                    loadSuccess = true;
                    this.videoLoaded = true;
                    console.log(`Background video loaded: ${videoSources[sourceIndex]}`);
                    document.body.appendChild(this.backgroundVideo);
                }
            };
            
            this.backgroundVideo.onerror = () => {
                console.log(`Failed to load ${videoSources[sourceIndex]}, trying next...`);
                tryLoadVideo(sourceIndex + 1);
            };
        };
        
        tryLoadVideo(0);
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
        // 選択された楽曲のURLリストを取得
        const audioFiles = this.songManager.getSelectedSongUrls();
        
        let loadedCount = 0;
        let totalFiles = audioFiles.length;
        
        const tryLoadAudio = (fileIndex) => {
            if (fileIndex >= audioFiles.length) {
                // すべての外部音楽ファイルに失敗した場合、サンプル音楽を使用
                console.log('All external audio files failed, using sample music');
                try {
                    this.audio = getSampleMusic();
                    this.audioLoaded = true;
                    updateProgress(100);
                    this.showLoadingComplete(true, 'サンプル音楽');
                } catch (error) {
                    console.error('Sample music failed:', error);
                    this.showLoadingComplete(false);
                }
                return;
            }
            
            const audio = new Audio();
            const audioFile = audioFiles[fileIndex];
            
            audio.oncanplaythrough = () => {
                if (!this.audioLoaded) {
                    console.log(`Audio loaded successfully: ${audioFile}`);
                    this.audio = audio;
                    this.audioLoaded = true;
                    this.audio.volume = 0.7;
                    this.audio.loop = true;
                    
                    // 選択した楽曲をキャッシュ
                    const selectedSongId = this.songManager.getSelectedSong();
                    this.songManager.cacheAudioFile(selectedSongId, audio);
                    
                    console.log('Audio details:', {
                        src: audio.src,
                        duration: audio.duration,
                        volume: audio.volume,
                        loop: audio.loop
                    });
                    
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

    showLoadingComplete(audioFound, audioType = null) {
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
            this.startScreen.style.display = 'flex';
            
            if (!audioFound) {
                const instructions = this.startScreen.querySelector('.instructions');
                instructions.innerHTML = `
                    音楽に合わせてノーツをタップしよう！<br>
                    D・F・J・Kキーを使って演奏しよう<br>
                    タイミングよく押してハイスコアを目指そう！<br>
                    <small style="color: #ffaa00;">⚠️ 音楽ファイルが読み込めませんでした</small><br>
                    <small style="color: #aaaaaa;">ブラウザのコンソールで詳細を確認できます</small>
                `;
            } else {
                const instructions = this.startScreen.querySelector('.instructions');
                if (audioType === 'サンプル音楽') {
                    instructions.innerHTML += `<br><small style="color: #FFA500;">♪ ${audioType}で開始します（GitHub音楽ファイル読み込み失敗）</small>`;
                } else {
                    // 選択中の楽曲情報を表示
                    const selectedSongId = this.songManager.getSelectedSong();
                    const songInfo = this.songManager.getSongInfo(selectedSongId);
                    if (songInfo) {
                        instructions.innerHTML += `<br><small style="color: #4CAF50;">♪ ${songInfo.name} が読み込まれました</small>`;
                    } else {
                        instructions.innerHTML += `<br><small style="color: #4CAF50;">♪ 音楽ファイルが読み込まれました</small>`;
                    }
                }
            }
            
            // デバッグ情報をコンソールに出力
            console.log('=== AUDIO DEBUG INFO ===');
            console.log('Audio found:', audioFound);
            console.log('Audio type:', audioType);
            console.log('Has audio object:', !!this.audio);
            console.log('Audio loaded:', this.audioLoaded);
            if (this.audio) {
                console.log('Audio src:', this.audio.src);
                console.log('Audio ready state:', this.audio.readyState);
                console.log('Audio duration:', this.audio.duration);
            }
            console.log('Selected song:', this.songManager.getSelectedSong());
            console.log('Song URLs:', this.songManager.getSelectedSongUrls());
            console.log('========================');
        }, 500);
    }

    startGame() {
        this.startScreen.style.display = 'none';
        this.isPlaying = true;
        this.gameStartTime = Date.now();
        this.score = 0;
        this.combo = 0;
        this.notes = [];
        
        // 音楽解析の初期化
        this.initAudioAnalysis();
        
        // 譜面生成
        this.generateRandomPattern();
        
        // 音楽を優先的に再生（audioファイル）
        console.log('=== STARTING GAME ===');
        console.log('Priority: Background music (audio) first, then background video');
        this.playBackgroundMusic();
        
        // 背景動画は音なしで再生
        this.playBackgroundVideo();
        
        console.log(`Game started with ${this.notes.length} notes`);
    }
    
    playBackgroundVideo() {
        if (this.backgroundVideo && this.videoLoaded) {
            this.backgroundVideo.currentTime = 0;
            const playPromise = this.backgroundVideo.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('Video started successfully (muted)');
                }).catch(e => {
                    console.log('Video playback failed:', e);
                    if (e.name === 'NotAllowedError') {
                        console.log('Video blocked by browser autoplay policy');
                    }
                });
            }
        }
    }
    
    initAudioAnalysis() {
        try {
            // AudioContext初期化（ユーザー操作後なので可能）
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            if (this.audio && this.audioLoaded) {
                this.beatDetector = new BeatDetector(this.audioContext, this.audio);
                this.beatDetector.init();
            }
        } catch (error) {
            console.log('Audio analysis initialization failed:', error);
        }
    }

    playBackgroundMusic() {
        console.log('=== BACKGROUND MUSIC PLAYBACK ===');
        
        // まず簡単なビープ音をテスト
        this.playSimpleBeep();
        
        // 音楽ファイルがあれば再生を試行
        if (this.audio && this.audioLoaded) {
            console.log('Attempting to play loaded background music...');
            this.audio.currentTime = 0;
            this.audio.volume = 0.8;
            this.audio.loop = true;
            
            const playPromise = this.audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('✅ Background music started successfully');
                }).catch(e => {
                    console.error('❌ Background music playback failed:', e);
                    this.showAudioUnblockMessage();
                });
            }
        } else {
            console.warn('⚠️ Background music not loaded, using fallback audio...');
            this.createFallbackAudio();
        }
    }
    
    playSimpleBeep() {
        try {
            console.log('Playing simple beep sound...');
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            
            console.log('✅ Simple beep played');
        } catch (error) {
            console.error('❌ Simple beep failed:', error);
        }
    }
    
    createFallbackAudio() {
        try {
            console.log('Creating fallback audio...');
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 単純なリピートビープ音を作成
            const playBeep = () => {
                if (this.isPlaying) {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
                    
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.1);
                    
                    setTimeout(playBeep, 1000); // 1秒ごとにビープ
                }
            };
            
            playBeep();
            console.log('✅ Fallback audio created (repeating beep)');
            
        } catch (error) {
            console.error('❌ Fallback audio creation failed:', error);
        }
    }
    
    tryAlternateAudio() {
        console.log('Trying alternate audio loading...');
        try {
            // サンプル音楽を試す
            this.audio = getSampleMusic();
            if (this.audio) {
                this.audioLoaded = true;
                console.log('Sample music loaded as fallback');
                
                // サンプル音楽が確実に再生されるようにイベントリスナーを追加
                this.audio.addEventListener('canplaythrough', () => {
                    console.log('Sample music is ready, attempting playback...');
                    this.playBackgroundMusic();
                });
                
                // 既に準備できている場合は即座に再生
                if (this.audio.readyState >= 3) {
                    this.playBackgroundMusic();
                }
            } else {
                throw new Error('Sample music creation failed');
            }
        } catch (error) {
            console.error('Alternate audio loading failed:', error);
            
            // 最後の手段として合成音楽を試す
            try {
                console.log('Trying synthetic music as last resort...');
                this.synthesizedMusic = getExtendedSampleMusic();
                if (this.synthesizedMusic) {
                    console.log('Synthetic music created successfully');
                    this.synthesizedMusic.start();
                } else {
                    this.showNoAudioMessage();
                }
            } catch (synthError) {
                console.error('Synthetic music failed:', synthError);
                this.showNoAudioMessage();
            }
        }
    }
    
    showNoAudioMessage() {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 165, 0, 0.9);
            color: white;
            padding: 15px;
            border-radius: 8px;
            z-index: 1000;
            font-family: Arial, sans-serif;
            max-width: 300px;
        `;
        message.innerHTML = `
            <strong>🔇 音楽なし</strong><br>
            音楽ファイルが読み込めませんでした。<br>
            <small>ゲームは無音で実行されます。</small>
        `;
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentElement) {
                message.parentElement.removeChild(message);
            }
        }, 5000);
    }

    // 音声テスト機能
    testAudio() {
        console.log('=== AUDIO TEST STARTED ===');
        
        // 最もシンプルなテスト: Web Audio API で直接音を生成
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4音
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5); // 0.5秒再生
            
            console.log('✅ Web Audio API test successful - you should hear a beep');
            this.showAudioTestResult(true, 'Web Audio API test successful');
            
        } catch (error) {
            console.error('❌ Web Audio API test failed:', error);
            
            // HTML5 Audio 要素でテスト
            try {
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBzuR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeC0OQ1u+9diMElgP3v4z5///m//8P////B///wP///4//D/+H////P//7/wD/+//////w//////////+AAAAAAP//////////+AAAAAAAAAAAAP//8A//8A8A/wAAAAA=');
                
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log('✅ HTML5 Audio test successful');
                        this.showAudioTestResult(true, 'HTML5 Audio test successful');
                    }).catch(e => {
                        console.error('❌ HTML5 Audio test failed:', e);
                        this.showAudioTestResult(false, 'Both audio tests failed: ' + e.message);
                    });
                }
                
            } catch (htmlError) {
                console.error('❌ HTML5 Audio test failed:', htmlError);
                this.showAudioTestResult(false, 'All audio tests failed');
            }
        }
    }
    
    showAudioTestResult(success, message) {
        const resultDiv = document.createElement('div');
        resultDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${success ? '#4CAF50' : '#f44336'};
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 2000;
            text-align: center;
            font-family: Arial, sans-serif;
            max-width: 400px;
        `;
        resultDiv.innerHTML = `
            <h3>${success ? '✅ 音声テスト成功' : '❌ 音声テスト失敗'}</h3>
            <p>${message}</p>
            <button onclick="this.parentElement.remove()" style="
                background: white;
                color: ${success ? '#4CAF50' : '#f44336'};
                border: none;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 10px;
            ">閉じる</button>
        `;
        document.body.appendChild(resultDiv);
        
        console.log('=== AUDIO TEST COMPLETED ===');
    }
    
    showAudioUnblockMessage() {
        // 音楽がブロックされた場合のメッセージ表示
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 1000;
            text-align: center;
            font-family: Arial, sans-serif;
        `;
        message.innerHTML = `
            <h3>音楽を有効にしてください</h3>
            <p>ブラウザの自動再生ポリシーにより音楽がブロックされました。</p>
            <button onclick="this.parentElement.remove(); game.enableAudio();" style="
                background: #ff6b6b;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
            ">音楽を有効にする</button>
        `;
        document.body.appendChild(message);
    }
    
    enableAudio() {
        if (this.audio) {
            this.audio.play().then(() => {
                console.log('Audio enabled by user interaction');
            }).catch(e => {
                console.error('Still unable to play audio:', e);
            });
        }
    }

    generateRandomPattern() {
        this.notes = [];
        
        // 選択中の楽曲情報を取得
        const selectedSongId = this.songManager.getSelectedSong();
        const songInfo = this.songManager.getSongInfo(selectedSongId);
        
        if (songInfo) {
            this.chartGenerator.setBPM(songInfo.bpm);
            console.log(`Generating chart for ${songInfo.name} at ${songInfo.bpm} BPM`);
            
            // 楽曲専用の譜面生成
            const chartNotes = this.chartGenerator.generateSongSpecificChart(selectedSongId, songInfo.duration);
            
            // ゲーム用ノーツオブジェクトに変換
            chartNotes.forEach(note => {
                this.notes.push({
                    lane: note.lane,
                    time: note.time,
                    y: -50,
                    hit: false,
                    type: note.type || 'normal'
                });
            });
        } else {
            // フォールバック: 基本パターン生成
            console.log('Generating basic pattern');
            const chartNotes = this.chartGenerator.generateBasicChart(60000); // 1分間
            
            chartNotes.forEach(note => {
                this.notes.push({
                    lane: note.lane,
                    time: note.time,
                    y: -50,
                    hit: false,
                    type: note.type || 'normal'
                });
            });
        }
        
        console.log(`Generated ${this.notes.length} notes`);
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
        
        // シンプルなノーツ移動システムに戻す
        for (let note of this.notes) {
            if (!note.hit) {
                // 時間ベースでノーツを出現させる
                if (currentTime >= note.time - 3000 && !note.active) { // 3秒前に出現
                    note.active = true;
                    note.y = -50; // 画面上部から開始
                }
                
                // アクティブなノーツを下に移動
                if (note.active) {
                    note.y += this.noteSpeed * deltaTime / 1000;
                    
                    // ミス判定
                    if (note.y > this.hitZoneY + this.hitTolerance) {
                        note.hit = true;
                        this.combo = 0;
                        this.showHitEffect(this.lanes[note.lane], 'miss');
                    }
                }
            }
        }
        
        // パーティクル更新
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx * deltaTime / 1000;
            particle.y += particle.vy * deltaTime / 1000;
            particle.life -= particle.decay;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // 音楽解析データを使ったリアルタイム調整
        if (this.beatDetector) {
            const volumeLevel = this.beatDetector.getVolumeLevel();
            const frequencyBands = this.beatDetector.getFrequencyBands();
            
            // 音量に応じたエフェクト（背景の明度調整など）
            if (volumeLevel > 0.7) {
                this.drawBackground(true); // 高音量時のエフェクト
            }
        }
    }
    
    // ゲーム終了時の処理
    endGame() {
        this.isPlaying = false;
        
        // 音楽停止
        if (this.audio) {
            this.audio.pause();
        }
        
        // 動画停止
        if (this.backgroundVideo) {
            this.backgroundVideo.pause();
        }
        
        console.log('Game ended');
    }
    
    // ゲーム一時停止
    pauseGame() {
        if (this.isPlaying) {
            this.isPlaying = false;
            
            if (this.audio) {
                this.audio.pause();
            }
            
            if (this.backgroundVideo) {
                this.backgroundVideo.pause();
            }
        }
    }
    
    // ゲーム再開
    resumeGame() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            
            if (this.audio) {
                this.audio.play();
            }
            
            if (this.backgroundVideo) {
                this.backgroundVideo.play();
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

    drawBackground(highVolume = false) {
        // 動画背景がある場合は動画を描画
        if (this.backgroundVideo && this.videoLoaded && this.isPlaying) {
            this.drawVideoBackground(highVolume);
        } else {
            this.drawDefaultBackground(highVolume);
        }
    }
    
    drawVideoBackground(highVolume = false) {
        // 動画をCanvasに描画
        this.ctx.save();
        
        // 動画を画面いっぱいに表示（アスペクト比を無視してストレッチ）
        const drawWidth = this.canvas.width;
        const drawHeight = this.canvas.height;
        const offsetX = 0;
        const offsetY = 0;
        
        // 動画の透明度を調整（ゲームプレイしやすくするため）
        this.ctx.globalAlpha = highVolume ? 0.6 : 0.4;
        
        // 動画を画面全体に描画
        this.ctx.drawImage(this.backgroundVideo, offsetX, offsetY, drawWidth, drawHeight);
        
        // オーバーレイ（ゲーム要素を見やすくするため）
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = '#000033';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.restore();
        
        // 追加のエフェクト
        this.addVideoEffects(highVolume);
    }
    
    drawDefaultBackground(highVolume = false) {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 星のエフェクト
        const starOpacity = highVolume ? 0.15 : 0.05;
        this.ctx.fillStyle = `rgba(255, 255, 255, ${starOpacity})`;
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.canvas.width;
            const y = (Date.now() * 0.1 + i * 50) % (this.canvas.height + 50);
            this.ctx.fillRect(x, y, 2, 20);
        }
    }
    
    addVideoEffects(highVolume = false) {
        if (highVolume) {
            // 高音量時の追加エフェクト
            this.ctx.save();
            this.ctx.globalAlpha = 0.2;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        }
        
        // 音楽のビートに合わせた効果
        if (this.beatDetector) {
            const frequencyBands = this.beatDetector.getFrequencyBands();
            if (frequencyBands.low > 0.8) {
                this.ctx.save();
                this.ctx.globalAlpha = 0.1;
                this.ctx.fillStyle = '#ff6b6b';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.restore();
            }
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
        let visibleCount = 0;
        
        for (let note of this.notes) {
            if (note.hit || !note.active) continue;
            
            visibleCount++;
            const x = this.lanes[note.lane];
            
            // ノーツの種類に応じて色を変更
            let color1 = '#ff6b6b';
            let color2 = '#ffd93d';
            
            if (note.type === 'beat') {
                color1 = '#00ff00';
                color2 = '#00aa00';
            } else if (note.type === 'melody') {
                color1 = '#0080ff';
                color2 = '#0040aa';
            }
            
            const gradient = this.ctx.createRadialGradient(x, note.y, 0, x, note.y, 30);
            gradient.addColorStop(0, color1);
            gradient.addColorStop(1, color2);
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, note.y, 25, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        // デバッグ情報
        if (this.isPlaying) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`Visible Notes: ${visibleCount}`, 10, 100);
            this.ctx.fillText(`Total Notes: ${this.notes.length}`, 10, 120);
            
            const currentTime = Date.now() - this.gameStartTime;
            this.ctx.fillText(`Time: ${Math.floor(currentTime / 1000)}s`, 10, 140);
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
    window.game = new MusicGame();
    console.log('Game initialized globally');
});