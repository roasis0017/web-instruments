// 音声を管理するコア（ブラウザの機能）
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// 音を鳴らす関数
function playNote(frequency) {
    // ユーザー操作前にAudioContextが停止している場合は再開させる
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    // 音の発生源（オシレーター）を作成
    const oscillator = audioCtx.createOscillator();
    // 音量制御（ゲイン）を作成
    const gainNode = audioCtx.createGain();

    // 音色を少し滑らかにする（正弦波、矩形波など）
    oscillator.type = 'triangle';
    oscillator.frequency.value = frequency;

    // 音量のエンベロープ（時間変化）を設定
    // 押した瞬間に音が出て、徐々に消えるようにする
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);

    // 接続：オシレーター -> ゲイン -> スピーカー
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // 再生開始と自動停止
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 1.5);
}

// 画面のキーを取得
const keys = document.querySelectorAll('.key');

// クリックしたときの処理
keys.forEach(key => {
    key.addEventListener('mousedown', () => {
        const note = parseFloat(key.getAttribute('data-note'));
        playNote(note);
        key.classList.add('active');
    });

    // マウスを離したとき（または要素から外れたとき）のデザイン戻し
    key.addEventListener('mouseup', () => key.classList.remove('active'));
    key.addEventListener('mouseleave', () => key.classList.remove('active'));
});

// キーボードを押したときの処理
window.addEventListener('keydown', (e) => {
    // 押しっぱなしによる連続再生を防ぐ
    if (e.repeat) return;

    const keyElement = document.querySelector(`.key[data-key="${e.key.toLowerCase()}"]`);
    if (keyElement) {
        const note = parseFloat(keyElement.getAttribute('data-note'));
        playNote(note);
        keyElement.classList.add('active');
    }
});

// キーボードを離したときの処理
window.addEventListener('keyup', (e) => {
    const keyElement = document.querySelector(`.key[data-key="${e.key.toLowerCase()}"]`);
    if (keyElement) {
        keyElement.classList.remove('active');
    }
});
