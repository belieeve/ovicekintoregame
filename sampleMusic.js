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
    const audio = new Audio(SAMPLE_MUSIC_DATA.beepSound);
    audio.volume = 0.3;
    audio.loop = true;
    return audio;
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