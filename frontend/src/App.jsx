import React, { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import ReactAudioPlayer from "react-audio-player";
import axios from "axios";
import AudioRecorder from "audio-recorder-polyfill";
window.MediaRecorder = AudioRecorder;

const App = () => {
  const [file, setFile] = useState([]);
  const [audioState, setAudioState] = useState(true);
  const audioRef = useRef();
  // for audio
  let audio_sample_rate = null;
  let scriptProcessor = null;
  let audioContext = null;

  // audio data
  let audioData = [];
  let bufferSize = 1024;

  useEffect(() => {
    // マイクへのアクセス権を取得
    navigator.getUserMedia =
      navigator.getUserMedia || navigator.webkitGetUserMedia;
    //audioのみtrue
    navigator.getUserMedia(
      {
        audio: true,
        video: false,
      },
      handleSuccess,
      hancleError
    );
  }, []);
  // export WAV from audio float data
  const exportWAV = function (audioData) {
    let encodeWAV = function (samples, sampleRate) {
      let buffer = new ArrayBuffer(44 + samples.length * 2);
      let view = new DataView(buffer);

      let writeString = function (view, offset, string) {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      let floatTo16BitPCM = function (output, offset, input) {
        for (let i = 0; i < input.length; i++, offset += 2) {
          let s = Math.max(-1, Math.min(1, input[i]));
          output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        }
      };

      writeString(view, 0, "RIFF"); // RIFFヘッダ
      view.setUint32(4, 32 + samples.length * 2, true); // これ以降のファイルサイズ
      writeString(view, 8, "WAVE"); // WAVEヘッダ
      writeString(view, 12, "fmt "); // fmtチャンク
      view.setUint32(16, 16, true); // fmtチャンクのバイト数
      view.setUint16(20, 1, true); // フォーマットID
      view.setUint16(22, 1, true); // チャンネル数
      view.setUint32(24, sampleRate, true); // サンプリングレート
      view.setUint32(28, sampleRate * 2, true); // データ速度
      view.setUint16(32, 2, true); // ブロックサイズ
      view.setUint16(34, 16, true); // サンプルあたりのビット数
      writeString(view, 36, "data"); // dataチャンク
      view.setUint32(40, samples.length * 2, true); // 波形データのバイト数
      floatTo16BitPCM(view, 44, samples); // 波形データ

      return view;
    };

    let mergeBuffers = function (audioData) {
      let sampleLength = 0;
      for (let i = 0; i < audioData.length; i++) {
        sampleLength += audioData[i].length;
      }
      let samples = new Float32Array(sampleLength);
      let sampleIdx = 0;
      for (let i = 0; i < audioData.length; i++) {
        for (let j = 0; j < audioData[i].length; j++) {
          samples[sampleIdx] = audioData[i][j];
          sampleIdx++;
        }
      }
      return samples;
    };

    let dataview = encodeWAV(mergeBuffers(audioData), audio_sample_rate);
    return new Blob([dataview], { type: "audio/mp3" });
  };

  const onPostForm = useCallback(async (data) => {
    try {
      console.log(data);
      // Object の data を FormData 形式に変換する
      const params = new FormData();
      Object.keys(data).forEach(function (key) {
        params.append(key, this[key]);
      }, data);
      const res = await axios.post(
        "http://localhost:8000/convert/wav",
        params,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log(res);
    } catch (err) {
      console.log(err);
    }
  }, []);
  const handleSuccess = (stream) => {
    // レコーディングのインスタンスを作成
    audioRef.current = new MediaRecorder(stream);
    // 音声データを貯める場所
    var chunks = [];
    // 録音が終わった後のデータをまとめる
    audioRef.current.addEventListener("dataavailable", (ele) => {
      if (ele.data.size > 0) {
        chunks.push(ele.data);
      }
      // 音声データをセット
      setFile(chunks);
    });

    // audioContext = new AudioContext();
    // audio_sample_rate = audioContext.sampleRate;
    // console.log(audio_sample_rate);
    // scriptProcessor = audioContext.createScriptProcessor(bufferSize, 1, 1);
    // let mediastreamsource = audioContext.createMediaStreamSource(stream);
    // mediastreamsource.connect(scriptProcessor);
    // scriptProcessor.onaudioprocess = onAudioProcess;
    // scriptProcessor.connect(audioContext.destination);

    console.log("record start?");

    // 録音を開始したら状態を変える
    audioRef.current.addEventListener("start", () => setAudioState(false));
    // 録音がストップしたらchunkを空にして、録音状態を更新
    audioRef.current.addEventListener("stop", () => {
      setAudioState(true);
      chunks = [];
    });
  };
  // 録音開始
  const handleStart = () => {
    audioRef.current.start();
  };

  // 録音停止
  const handleStop = () => {
    audioRef.current.stop();
  };

  // firebaseに音声ファイルを送信
  const handleSubmit = () => {
    // firebaseのrefを作成

    // let metadata = {
    //   type: "audio/wav",
    // };
    // const blob = exportWAV(audioData);
    let metadata = {
      contentType: "audio/wav",
    };
    onPostForm({
      file: new File([new Blob(file)], "test.wav", metadata),
    });

  };
  const handleRemove = () => {
    setAudioState(true);
    setFile([]);
  };

  const hancleError = () => {
    alert("エラーです。");
  };
  // save audio data
  const onAudioProcess = function (e) {
    var input = e.inputBuffer.getChannelData(0);
    var bufferData = new Float32Array(bufferSize);
    for (var i = 0; i < bufferSize; i++) {
      bufferData[i] = input[i];
    }

    audioData.push(bufferData);
  };
  return (
    <div>
      <button onClick={handleStart}>録音</button>
      <button onClick={handleStop} disabled={audioState}>
        ストップ
      </button>
      <button onClick={handleSubmit} disabled={file.length === 0}>
        送信
      </button>
      <button onClick={handleRemove}>削除</button>
      <ReactAudioPlayer src={URL.createObjectURL(new Blob(file))} controls />
    </div>
  );
};

export default App;
// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.tsx</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }
//
// export default App;
