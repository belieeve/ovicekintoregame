// サンプル音楽データ（短いビープ音のBase64エンコード）
const SAMPLE_MUSIC_DATA = {
    // 短いビープ音のサンプル（実際の音楽ファイルに置き換え可能）
    beepSound: `data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBzuR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeC0OQ1u+9diMEkgAAAAAAAADwBHAKAAAAAAAAANQJ8AJwCgAAAAAAAAAUCvAAcAoAAAAAAAAAFAywAHAKAAAAAAAAANQI8AJwCgAAAAAAAAAUCvABcAoAAAAAAAAAFAywAHAKAAAAAAAAANQI8AJwCgAAAAAAAAAUCvABcAoAAAAAAAAAFAywAHAKAAAAAAAAANQI8AJwCgAAAAAAAAAUCvABcAoAAAAAAAAAFAywAHAKAAAAAAAAANQI8AJwCgAAAAAAAAAUCvABcAoAAAAAAAAAFAywAHAKAAAAAAAAANQI8AJwCgAAAAAAAAAUCvABcAoAAAAAAAAAFAywAHAKAAAAAAAAANQI8AJwCgAAAAAAAAAUCvABcAoAAAAAAAAAFAywAHAKAAAAAAAAANQI8AJwCgAAAAAAAAAUCvABcAoAAAAAAAAAFAywAHAKAAAAAAAAANQI8AJwCgAAAAAAAAAUCvABcAoAAAAAAAAAFAywAHAKAAAAAAAAANQI8AJwCgAAAAAAAAAUCvABcAoAAAAAAAAAFAywAHAKAAAAAAAAANQI8AJwCgAAAAAAAAAUCvABcAoAAAAAAAAAFAywAHAKAAAAAAAAANQI8AJwCgAAAAAAAAAUCvABcAoAAAAAAAAAFAywAHAKAAAAAAAAANQI8AJwCgAAAAAAAAAUCvABcAoAAAAAAAAAFAywAHAKAAAAAAAAAA==`,
    
    // より複雑な音楽パターン用のメロディ（実際のMP3データに置き換え可能）
    sampleMelody: null // ここに実際の音楽ファイルのBase64データを設定可能
};

// 音楽ファイルのBase64エンコード用ヘルパー関数
function encodeFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// サンプル音楽を取得する関数
function getSampleMusic() {
    console.log('Creating sample music (beep sound)...');
    const audio = new Audio(SAMPLE_MUSIC_DATA.beepSound);
    audio.volume = 0.5;
    audio.loop = true;
    
    // 音楽が再生可能かテスト
    audio.addEventListener('canplaythrough', () => {
        console.log('Sample music ready to play');
    });
    
    audio.addEventListener('error', (e) => {
        console.error('Sample music error:', e);
    });
    
    return audio;
}

// より長いサンプル音楽（ビープ音のパターン）
function getExtendedSampleMusic() {
    console.log('Creating extended sample music...');
    
    // AudioContextを使用して合成音楽を作成
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const sampleRate = audioContext.sampleRate;
        const duration = 30; // 30秒
        const arrayBuffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const channelData = arrayBuffer.getChannelData(0);
        
        // 簡単なメロディパターンを生成
        for (let i = 0; i < channelData.length; i++) {
            const t = i / sampleRate;
            const freq = 440 + Math.sin(t * 0.5) * 100; // 基本周波数 + 変調
            channelData[i] = Math.sin(2 * Math.PI * freq * t) * 0.3 * Math.sin(t * 5); // 音量変調
        }
        
        const source = audioContext.createBufferSource();
        source.buffer = arrayBuffer;
        source.loop = true;
        
        return {
            audioContext: audioContext,
            source: source,
            start: function() {
                source.connect(audioContext.destination);
                source.start(0);
                console.log('Extended sample music started');
            },
            stop: function() {
                source.stop();
                console.log('Extended sample music stopped');
            }
        };
    } catch (error) {
        console.error('Failed to create extended sample music:', error);
        return null;
    }
}

// 音楽ファイルをBase64で設定する関数
function setSampleMusicData(base64Data, trackName = 'sampleMelody') {
    SAMPLE_MUSIC_DATA[trackName] = base64Data;
    console.log(`Sample music '${trackName}' has been set`);
}

// サンプル音楽データを確認する関数
function checkSampleMusicData() {
    console.log('Available sample music tracks:', Object.keys(SAMPLE_MUSIC_DATA).filter(key => SAMPLE_MUSIC_DATA[key]));
    return SAMPLE_MUSIC_DATA;
}