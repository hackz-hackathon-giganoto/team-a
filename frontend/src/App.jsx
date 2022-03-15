import React, { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import ReactAudioPlayer from "react-audio-player";
import axios from "axios";
import AudioRecorder from "audio-recorder-polyfill";
import NavBar from "./components/NavBar";
import { v4 as uuidv4 } from "uuid";
import "./App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Header from "./components/Header";
import GaugeChart from "react-gauge-chart";

window.MediaRecorder = AudioRecorder;

const App = () => {
  // Auth
  const [isAuthenticated, userHasAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [file, setFile] = useState([]);
  const [audioState, setAudioState] = useState(true);
  const audioRef = useRef();
  const userIdRef = useRef();
  const [score, setScore] = useState({
    score: 0,
    count: 0,
    pod_num: 0,
    cost: 0,
  });
  // for audio
  let audio_sample_rate = null;
  let scriptProcessor = null;
  let audioContext = null;

  // audio data

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

    async function handler() {
      // Auth
      await getUserInfo();

      if (userIdRef.current != null) {
        // WebSocket
        console.log("websocket initializing...");
        console.log(
          `${process.env.REACT_APP_GO_API_ORIGIN || "ws://localhost"}/ws/${
            userIdRef.current
          }`
        );
        const webSocket = new WebSocket(
          `${process.env.REACT_APP_GO_API_ORIGIN || "ws://localhost"}/ws/${
            userIdRef.current
          }`
        );
        webSocket.onerror = (event) => {
          console.log(event);
        };
        webSocket.onopen = (event) => {
          console.log(event);
        };
        webSocket.onmessage = function (event) {
          const json = JSON.parse(event.data);
          console.log(`[message] Data received from server: ${json}`);
          try {
            if ((json.event = "data")) {
              switch (json.action) {
                case "SCORE_DATA":
                  console.log(json);
                  setScore(json);
              }
            }
          } catch (err) {
            console.log(err);
            // whatever you wish to do with the err
          }
        };
      }
    }

    handler();
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
        `${process.env.FAST_API_ORIGIN || "http://localhost:8000"}/convert/wav`,
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

    const user_id =
      user === null ||
      user.userId === null ||
      user.userId === undefined ||
      user.userId.length === 0
        ? "example-user-id"
        : user.userId;
    onPostForm({
      file: new File([new Blob(file)], uuidv4() + ".wav", metadata), //TODO UserIdを渡す
      user_id: user_id,
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

  // auth
  async function getUserInfo() {
    try {
      const response = await fetch("/.auth/me");
      const payload = await response.json();
      const { clientPrincipal } = payload;

      if (clientPrincipal) {
        setUser(clientPrincipal);
        userHasAuthenticated(true);
        userIdRef.current = clientPrincipal.userId;
        console.log(userIdRef.current);
        console.log(`clientPrincipal = ${JSON.stringify(clientPrincipal)}`);
      }
    } catch (error) {
      console.error("No profile could be found " + error?.message?.toString());
    }
  }

  return (
    <div>
      {isAuthenticated ? (
        <Header
          state={"ログイン済"}
          pod_count={score.pod_num}
          user_count={score.count}
        />
      ) : (
        <Header
          state={"未ログイン"}
          user_count={score.count}
          pod_count={score.pod_num}
        />
      )}
      <div class="mx-auto d-flex flex-column chart-container">
        <GaugeChart
          class="chart"
          textColor="#333"
          id="gauge-chart2"
          nrOfLevels={30}
          percent={score.score / 100.0}
          formatTextValue={(value) => `${value}点`}
        />
        <p className="mx-auto cost-text">あなたの負担額：{score.cost}円</p>
      </div>
      <div class="d-flex flex-column mx-auto">
        <div class="record-container mx-auto">
          <ReactAudioPlayer
            src={URL.createObjectURL(new Blob(file))}
            controls
          />
        </div>
        <div class="d-flex app-container mx-auto">
          <button class="btn btn-primary" onClick={handleStart}>
            <i class="fa-solid fa-record-vinyl" /> 録音
          </button>
          <button
            class="btn btn-primary"
            onClick={handleStop}
            disabled={audioState}
          >
            <i className="fa-solid fa-stop" /> ストップ
          </button>
          <button
            class="btn btn-primary"
            onClick={handleSubmit}
            disabled={file.length === 0}
          >
            <i className="fa-solid fa-share" /> 送信
          </button>
          <button class="btn btn-primary" onClick={handleRemove}>
            <i className="fa-solid fa-trash-can" /> 削除
          </button>
        </div>
      </div>
      <div class="login-container mx-auto">
        <NavBar user={user} />
      </div>
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
