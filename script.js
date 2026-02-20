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

// ギター風の音を鳴らす関数（弦を弾くような音）
function playGuitar(frequency) {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    // ギターに近い倍音を持つノコギリ波
    osc.type = 'sawtooth';
    osc.frequency.value = frequency;

    // 弾いた瞬間に明るく、すぐに丸い音になる（フィルターのエンベロープ）
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.5);

    // 音量のエンベロープ（減衰音）
    gain.gain.setValueAtTime(1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 2.0);
}

// --- ドラム音源の作成（合成） ---
// ノイズのバッファを作成（スネア・ハイハット用）
const noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate, audioCtx.sampleRate);
const output = noiseBuffer.getChannelData(0);
for (let i = 0; i < audioCtx.sampleRate; i++) {
    output[i] = Math.random() * 2 - 1;
}

function playKick() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    // ドンの音：低い周波数へ急速に落ちる
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

    gain.gain.setValueAtTime(1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.5);
}

function playSnare() {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // スネアの胴鳴り（コツッという音）
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.connect(oscGain);
    oscGain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    oscGain.gain.setValueAtTime(0.7, audioCtx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.2);

    // スネアの響き線（ザッというノイズ）
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    const noiseFilter = audioCtx.createBiquadFilter();
    const noiseGain = audioCtx.createGain();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(audioCtx.destination);
    noiseGain.gain.setValueAtTime(1, audioCtx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
    noise.start(audioCtx.currentTime);
    noise.stop(audioCtx.currentTime + 0.2);
}

function playHihat() {
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // ハイハット（チッという高音ノイズ）
    const noise = audioCtx.createBufferSource();
    noise.buffer = noiseBuffer;
    const bandpass = audioCtx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 10000;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);

    noise.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(audioCtx.destination);
    noise.start(audioCtx.currentTime);
    noise.stop(audioCtx.currentTime + 0.05);
}

// --- 楽器の切り替え状態 ---
let currentInstrument = 'piano';
document.querySelectorAll('input[name="instrument"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        currentInstrument = e.target.value;
    });
});

// 画面のキーを取得
const keys = document.querySelectorAll('.key');

// クリックしたときの処理
keys.forEach(key => {
    key.addEventListener('mousedown', () => {
        const note = parseFloat(key.getAttribute('data-note'));
        if (currentInstrument === 'piano') {
            playNote(note);
        } else if (currentInstrument === 'guitar') {
            playGuitar(note);
        }
        key.classList.add('active');
    });

    // マウスを離したとき（または要素から外れたとき）のデザイン戻し
    key.addEventListener('mouseup', () => key.classList.remove('active'));
    key.addEventListener('mouseleave', () => key.classList.remove('active'));
});

// ドラムパッドの処理
const drumPads = document.querySelectorAll('.drum-pad');
drumPads.forEach(pad => {
    pad.addEventListener('mousedown', () => {
        const drum = pad.getAttribute('data-drum');
        if (drum === 'kick') playKick();
        if (drum === 'snare') playSnare();
        if (drum === 'hihat') playHihat();
        pad.classList.add('active');
    });

    pad.addEventListener('mouseup', () => pad.classList.remove('active'));
    pad.addEventListener('mouseleave', () => pad.classList.remove('active'));
});

// キーボードを押したときの処理
window.addEventListener('keydown', (e) => {
    // 押しっぱなしによる連続再生を防ぐ
    if (e.repeat) return;

    const keyElement = document.querySelector(`.key[data-key="${e.key.toLowerCase()}"]`);
    if (keyElement) {
        const note = parseFloat(keyElement.getAttribute('data-note'));
        if (currentInstrument === 'piano') {
            playNote(note);
        } else if (currentInstrument === 'guitar') {
            playGuitar(note);
        }
        keyElement.classList.add('active');
    }

    const drumElement = document.querySelector(`.drum-pad[data-key="${e.key.toLowerCase()}"]`);
    if (drumElement) {
        const drum = drumElement.getAttribute('data-drum');
        if (drum === 'kick') playKick();
        if (drum === 'snare') playSnare();
        if (drum === 'hihat') playHihat();
        drumElement.classList.add('active');
    }
});

// キーボードを離したときの処理
window.addEventListener('keyup', (e) => {
    const keyElement = document.querySelector(`.key[data-key="${e.key.toLowerCase()}"]`);
    if (keyElement) {
        keyElement.classList.remove('active');
    }

    const drumElement = document.querySelector(`.drum-pad[data-key="${e.key.toLowerCase()}"]`);
    if (drumElement) {
        drumElement.classList.remove('active');
    }
});
