// 音楽ファイル読み込み・設定ユーティリティ

// 音楽ファイルをBase64エンコードしてmusicData.jsに設定するヘルパー関数
function encodeAudioFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = e.target.result.split(',')[1]; // data:audio/mpeg;base64,の部分を除去
            resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ファイル入力要素を作成して音楽ファイルを選択
function createMusicFileLoader() {
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 20px;
        border-radius: 10px;
        z-index: 1000;
        font-family: Arial, sans-serif;
    `;
    
    const title = document.createElement('h3');
    title.textContent = '音楽ファイル設定';
    title.style.margin = '0 0 10px 0';
    
    const instructions = document.createElement('p');
    instructions.style.fontSize = '12px';
    instructions.innerHTML = `
        音楽ファイル(.mp3)を選択してゲームに埋め込みます。<br>
        ファイルを選択後、表示されるコードをmusicData.jsに追加してください。
    `;
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/mp3,audio/mpeg';
    fileInput.style.cssText = 'margin: 10px 0; width: 100%;';
    
    const output = document.createElement('textarea');
    output.style.cssText = `
        width: 300px;
        height: 100px;
        font-family: monospace;
        font-size: 10px;
        margin-top: 10px;
        display: none;
    `;
    
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
        position: absolute;
        top: 5px;
        right: 10px;
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
    `;
    
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const base64Data = await encodeAudioFileToBase64(file);
                const trackName = 'track1'; // デフォルトのトラック名
                
                const code = `
// ${file.name} をmusicData.jsに追加するコード：
musicDataManager.setTrackData('${trackName}', '${base64Data.substring(0, 100)}...', {
    name: '${file.name}',
    duration: ${Math.floor(Math.random() * 180000) + 60000}, // 推定値
    bpm: 120 // 推定値
});

// または直接データを設定：
this.musicTracks.${trackName}.data = '${base64Data.substring(0, 100)}...';
                `.trim();
                
                output.value = code;
                output.style.display = 'block';
                
                // クリップボードにコピー
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(base64Data).then(() => {
                        instructions.innerHTML += '<br><strong style="color: #4CAF50;">Base64データがクリップボードにコピーされました！</strong>';
                    });
                }
                
            } catch (error) {
                alert('ファイル読み込みエラー: ' + error.message);
            }
        }
    };
    
    closeButton.onclick = () => {
        document.body.removeChild(container);
    };
    
    container.appendChild(closeButton);
    container.appendChild(title);
    container.appendChild(instructions);
    container.appendChild(fileInput);
    container.appendChild(output);
    
    return container;
}

// 開発者ツール用：音楽ファイルローダーを表示
function showMusicLoader() {
    const loader = createMusicFileLoader();
    document.body.appendChild(loader);
}

// コンソールから簡単にアクセスできるように
if (typeof window !== 'undefined') {
    window.showMusicLoader = showMusicLoader;
    console.log('音楽ファイルを設定するには showMusicLoader() を実行してください');
}