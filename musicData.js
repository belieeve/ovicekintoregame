// 音楽データ管理モジュール
class MusicDataManager {
    constructor() {
        // サンプル音楽データ（Base64エンコード済み）
        // 実際の音楽ファイルを使用する場合は、以下のコマンドでBase64エンコードできます：
        // Mac/Linux: base64 -i your_music_file.mp3 -o output.txt
        // Windows: certutil -encode your_music_file.mp3 output.txt
        
        this.musicTracks = {
            // サンプル音楽データのプレースホルダー
            track1: {
                name: "サンプル音楽1",
                data: null, // ここにBase64データを挿入
                duration: 120000, // 2分
                bpm: 120
            },
            track2: {
                name: "サンプル音楽2", 
                data: null, // ここにBase64データを挿入
                duration: 180000, // 3分
                bpm: 140
            }
        };
        
        // デフォルトで使用する楽曲
        this.defaultTrack = 'track1';
    }
    
    // Base64データから音楽ファイルを作成
    createAudioFromBase64(base64Data, mimeType = 'audio/mpeg') {
        try {
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });
            const url = URL.createObjectURL(blob);
            
            const audio = new Audio(url);
            return audio;
        } catch (error) {
            console.error('Base64データからの音楽作成に失敗:', error);
            return null;
        }
    }
    
    // 指定した楽曲のAudioオブジェクトを取得
    getAudio(trackName = null) {
        const track = trackName || this.defaultTrack;
        const musicData = this.musicTracks[track];
        
        if (!musicData || !musicData.data) {
            console.warn(`楽曲 ${track} が見つからないか、データが設定されていません`);
            return null;
        }
        
        return this.createAudioFromBase64(musicData.data);
    }
    
    // 楽曲情報を取得
    getTrackInfo(trackName = null) {
        const track = trackName || this.defaultTrack;
        return this.musicTracks[track] || null;
    }
    
    // 利用可能な楽曲リストを取得
    getAvailableTracks() {
        return Object.keys(this.musicTracks).filter(key => this.musicTracks[key].data);
    }
    
    // Base64データを設定（音楽ファイルを埋め込む際に使用）
    setTrackData(trackName, base64Data, options = {}) {
        if (this.musicTracks[trackName]) {
            this.musicTracks[trackName].data = base64Data;
            if (options.duration) this.musicTracks[trackName].duration = options.duration;
            if (options.bpm) this.musicTracks[trackName].bpm = options.bpm;
            if (options.name) this.musicTracks[trackName].name = options.name;
            return true;
        }
        return false;
    }
    
    // 新しい楽曲を追加
    addTrack(trackName, base64Data, options = {}) {
        this.musicTracks[trackName] = {
            name: options.name || trackName,
            data: base64Data,
            duration: options.duration || 120000,
            bpm: options.bpm || 120
        };
        return true;
    }
    
    // 楽曲データを読み込む（外部ファイルから）
    async loadTrackFromFile(trackName, file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64Data = e.target.result.split(',')[1]; // data:audio/mpeg;base64,の部分を除去
                this.setTrackData(trackName, base64Data);
                resolve(true);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}