// 音楽解析・ビート検出クラス
class BeatDetector {
    constructor(audioContext, audioElement) {
        this.audioContext = audioContext;
        this.audioElement = audioElement;
        this.analyser = null;
        this.source = null;
        this.dataArray = null;
        this.bufferLength = 0;
        
        this.beatThreshold = 0.8;
        this.beatDecay = 0.98;
        this.beatMin = 0.15;
        
        this.isInitialized = false;
    }
    
    init() {
        try {
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 1024;
            this.bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(this.bufferLength);
            
            this.source = this.audioContext.createMediaElementSource(this.audioElement);
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);
            
            this.isInitialized = true;
            console.log('Beat detector initialized');
        } catch (error) {
            console.log('Beat detector initialization failed:', error);
            this.isInitialized = false;
        }
    }
    
    // 現在の音楽の周波数データを取得
    getFrequencyData() {
        if (!this.isInitialized || !this.analyser) return null;
        
        this.analyser.getByteFrequencyData(this.dataArray);
        return this.dataArray;
    }
    
    // ビートを検出
    detectBeat() {
        const frequencyData = this.getFrequencyData();
        if (!frequencyData) return false;
        
        // 低音域でのエネルギーを計算
        let sum = 0;
        const lowEnd = Math.floor(this.bufferLength * 0.1);
        const midEnd = Math.floor(this.bufferLength * 0.3);
        
        for (let i = 0; i < lowEnd; i++) {
            sum += frequencyData[i];
        }
        
        const average = sum / lowEnd / 255;
        return average > this.beatThreshold;
    }
    
    // 音楽の音量レベルを取得
    getVolumeLevel() {
        const frequencyData = this.getFrequencyData();
        if (!frequencyData) return 0;
        
        let sum = 0;
        for (let i = 0; i < this.bufferLength; i++) {
            sum += frequencyData[i];
        }
        
        return sum / this.bufferLength / 255;
    }
    
    // 周波数帯域別の音量を取得
    getFrequencyBands() {
        const frequencyData = this.getFrequencyData();
        if (!frequencyData) return { low: 0, mid: 0, high: 0 };
        
        const third = Math.floor(this.bufferLength / 3);
        
        let low = 0, mid = 0, high = 0;
        
        for (let i = 0; i < third; i++) {
            low += frequencyData[i];
        }
        for (let i = third; i < third * 2; i++) {
            mid += frequencyData[i];
        }
        for (let i = third * 2; i < this.bufferLength; i++) {
            high += frequencyData[i];
        }
        
        return {
            low: low / third / 255,
            mid: mid / third / 255,
            high: high / third / 255
        };
    }
}

// 譜面自動生成クラス
class ChartGenerator {
    constructor(bpm = 120) {
        this.bpm = bpm;
        this.beatInterval = 60000 / bpm; // ミリ秒
        this.difficultyLevel = 'normal';
        
        this.patterns = {
            easy: {
                noteFrequency: 0.6,
                simultaneousNotes: 0.1,
                holdNotes: 0.05
            },
            normal: {
                noteFrequency: 0.8,
                simultaneousNotes: 0.2,
                holdNotes: 0.1
            },
            hard: {
                noteFrequency: 1.0,
                simultaneousNotes: 0.4,
                holdNotes: 0.2
            }
        };
    }
    
    setBPM(bpm) {
        this.bpm = bpm;
        this.beatInterval = 60000 / bpm;
    }
    
    setDifficulty(level) {
        this.difficultyLevel = level;
    }
    
    // BPMベースの基本譜面を生成
    generateBasicChart(durationMs) {
        const notes = [];
        const pattern = this.patterns[this.difficultyLevel] || this.patterns.normal;
        
        const totalBeats = Math.floor(durationMs / this.beatInterval);
        
        for (let beat = 8; beat < totalBeats - 4; beat++) { // 最初の2秒と最後の1秒は空白
            const time = beat * this.beatInterval;
            
            // メインビートにノーツを配置
            if (Math.random() < pattern.noteFrequency) {
                const lane = Math.floor(Math.random() * 4);
                notes.push({
                    lane: lane,
                    time: time,
                    type: 'normal'
                });
                
                // 同時押しの可能性
                if (Math.random() < pattern.simultaneousNotes) {
                    let lane2 = Math.floor(Math.random() * 4);
                    while (lane2 === lane) {
                        lane2 = Math.floor(Math.random() * 4);
                    }
                    notes.push({
                        lane: lane2,
                        time: time,
                        type: 'normal'
                    });
                }
            }
            
            // サブビート（8分音符）
            if (beat % 2 === 0 && Math.random() < pattern.noteFrequency * 0.6) {
                const subBeatTime = time + this.beatInterval / 2;
                const lane = Math.floor(Math.random() * 4);
                notes.push({
                    lane: lane,
                    time: subBeatTime,
                    type: 'normal'
                });
            }
            
            // 16分音符パターン（高難易度時）
            if (this.difficultyLevel === 'hard' && Math.random() < 0.3) {
                for (let sixteenth = 1; sixteenth < 4; sixteenth++) {
                    const sixteenthTime = time + (this.beatInterval / 4) * sixteenth;
                    if (Math.random() < 0.4) {
                        const lane = Math.floor(Math.random() * 4);
                        notes.push({
                            lane: lane,
                            time: sixteenthTime,
                            type: 'normal'
                        });
                    }
                }
            }
        }
        
        return notes.sort((a, b) => a.time - b.time);
    }
    
    // 音楽解析データを使った高度な譜面生成
    generateAdvancedChart(durationMs, frequencyData = null) {
        const notes = this.generateBasicChart(durationMs);
        
        // 周波数データがある場合は、それに基づいてノーツを調整
        if (frequencyData && frequencyData.length > 0) {
            // 高音域が強い時は上のレーン（2, 3）にノーツを多く配置
            // 低音域が強い時は下のレーン（0, 1）にノーツを多く配置
            notes.forEach(note => {
                const timeIndex = Math.floor((note.time / durationMs) * frequencyData.length);
                if (timeIndex < frequencyData.length) {
                    const bands = frequencyData[timeIndex];
                    if (bands && bands.high > bands.low) {
                        note.lane = Math.random() < 0.7 ? (note.lane < 2 ? note.lane + 2 : note.lane) : note.lane;
                    } else if (bands && bands.low > bands.high) {
                        note.lane = Math.random() < 0.7 ? (note.lane > 1 ? note.lane - 2 : note.lane) : note.lane;
                    }
                }
            });
        }
        
        return notes;
    }
    
    // 特定の楽曲用のカスタムパターン
    generateSongSpecificChart(songId, durationMs) {
        const customPatterns = {
            ovicesong01: { // 筋トレチャット テーマソング
                emphasis: [4, 8, 12, 16], // 強調するビート
                restPatterns: [32, 48], // 休符を入れるビート
                difficulty: 'normal'
            },
            ovicesong02: { // oviceで会えた奇跡
                emphasis: [2, 6, 10, 14],
                restPatterns: [24, 40],
                difficulty: 'hard'
            }
        };
        
        const pattern = customPatterns[songId];
        if (pattern) {
            this.setDifficulty(pattern.difficulty);
        }
        
        return this.generateBasicChart(durationMs);
    }
}