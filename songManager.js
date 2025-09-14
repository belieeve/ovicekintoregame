// 楽曲管理システム
class SongManager {
    constructor() {
        this.songs = {
            ovicesong01: {
                name: '筋トレチャット テーマソング',
                artist: '「画面の向こう、汗をかこう！」',
                filename: 'ovicesong01.mp3',
                bpm: 120,
                difficulty: 'Normal',
                duration: 180000, // 3分
                description: 'oviceの筋トレチャット専用テーマソング'
            },
            ovicesong02: {
                name: 'oviceで会えた奇跡',
                artist: 'オリジナル楽曲',
                filename: 'ovicesong02.mp3',
                bpm: 140,
                difficulty: 'Hard',
                duration: 200000, // 3分20秒
                description: 'oviceでの出会いをテーマにした楽曲'
            }
        };
        
        this.selectedSong = 'ovicesong01'; // デフォルト選択曲
        this.availableAudioFiles = {}; // 読み込み済みの音楽ファイル
    }
    
    // 楽曲リストを取得
    getAllSongs() {
        return this.songs;
    }
    
    // 楽曲情報を取得
    getSongInfo(songId) {
        return this.songs[songId] || null;
    }
    
    // 現在選択中の楽曲を取得
    getSelectedSong() {
        return this.selectedSong;
    }
    
    // 楽曲を選択
    selectSong(songId) {
        if (this.songs[songId]) {
            this.selectedSong = songId;
            console.log(`Selected song: ${this.songs[songId].name}`);
            return true;
        }
        return false;
    }
    
    // 楽曲のファイルURLリストを生成
    getSongFileUrls(songId) {
        const song = this.songs[songId];
        if (!song) return [];
        
        const filename = song.filename;
        const cacheBuster = '?v=' + Date.now();
        
        return [
            // GitHub raw URL
            `https://raw.githubusercontent.com/belieeve/ovicekintoregame/main/assets/audio/${filename}${cacheBuster}`,
            // GitHub Pages URL  
            `https://belieeve.github.io/ovicekintoregame/assets/audio/${filename}${cacheBuster}`,
            // ローカル相対パス
            `assets/audio/${filename}${cacheBuster}`
        ];
    }
    
    // 選択中の楽曲のファイルURLを取得
    getSelectedSongUrls() {
        return this.getSongFileUrls(this.selectedSong);
    }
    
    // 音楽ファイルを読み込み済みとしてキャッシュ
    cacheAudioFile(songId, audioElement) {
        this.availableAudioFiles[songId] = audioElement;
        console.log(`Cached audio for song: ${songId}`);
    }
    
    // キャッシュされた音楽ファイルを取得
    getCachedAudio(songId) {
        return this.availableAudioFiles[songId] || null;
    }
    
    // 楽曲データをJSONで取得（デバッグ用）
    exportSongData() {
        return {
            songs: this.songs,
            selectedSong: this.selectedSong,
            availableCount: Object.keys(this.availableAudioFiles).length
        };
    }
    
    // 新しい楽曲を追加
    addSong(songId, songData) {
        this.songs[songId] = {
            name: songData.name || 'Unknown Song',
            artist: songData.artist || 'Unknown Artist',
            filename: songData.filename || `${songId}.mp3`,
            bpm: songData.bpm || 120,
            difficulty: songData.difficulty || 'Normal',
            duration: songData.duration || 180000,
            description: songData.description || ''
        };
        console.log(`Added new song: ${songId}`);
        return true;
    }
    
    // 楽曲を削除
    removeSong(songId) {
        if (this.songs[songId]) {
            delete this.songs[songId];
            delete this.availableAudioFiles[songId];
            
            // 削除した楽曲が選択中だった場合、他の楽曲を選択
            if (this.selectedSong === songId) {
                const remainingSongs = Object.keys(this.songs);
                this.selectedSong = remainingSongs.length > 0 ? remainingSongs[0] : null;
            }
            
            console.log(`Removed song: ${songId}`);
            return true;
        }
        return false;
    }
}