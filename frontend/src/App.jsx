import React, { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import ReactAudioPlayer from "react-audio-player";
import axios from "axios";
import AudioRecorder from "audio-recorder-polyfill";
import NavBar from "./components/NavBar";
import { v4 as uuidv4 } from "uuid";
import "./App.css";
import Header from "./components/Header";
import GaugeChart from "react-gauge-chart";
import { useAuth0 } from "@auth0/auth0-react";

window.MediaRecorder = AudioRecorder;

const App = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

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
  const [point, setPoint] = useState({ point: 0 });

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

      if (userIdRef.current !== undefined) {
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
            if (json.event === "data") {
              switch (json.action) {
                case "SCORE_DATA":
                  console.log(json);
                  if (score.cost !== json.cost) {
                    setScore(json);
                  }
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

  const onPostForm = useCallback(async (data) => {
    try {
      console.log(data);
      // Object の data を FormData 形式に変換する
      const params = new FormData();
      Object.keys(data).forEach(function (key) {
        params.append(key, this[key]);
      }, data);
      console.log(
        `${
          process.env.REACT_APP_FAST_API_ORIGIN || "http://localhost:8000"
        }/convert/wav`
      );
      const res = await axios.post(
        `${
          process.env.REACT_APP_FAST_API_ORIGIN || "http://localhost:8000"
        }/convert/wav`,
        params,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log(res);
      const point = res.data.score;
      console.log(point);
      if (point !== null) {
        setPoint({ point: point.toFixed() });
      }
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

  const handleSubmit = () => {
    const metadata = {
      type: "audio/wav",
    };

    const user_id = user === undefined ? "example-user-id" : user.sub;
    onPostForm({
      file: new File([new Blob(file)], uuidv4() + ".wav", metadata),
      user_id: user_id,
    });
    setFile([]);
  };
  const handleRemove = () => {
    setAudioState(true);
    setFile([]);
  };

  const hancleError = () => {
    alert("エラーです。");
  };

  // auth
  async function getUserInfo() {
    try {
      if (user) {
        userIdRef.current = user.sub;
        console.log(userIdRef.current);
        console.log(`user = ${JSON.stringify(user)}`);
      }
    } catch (error) {
      console.error("No profile could be found " + error?.message?.toString());
    }
  }

  if (isLoading) {
    return <div>Loading ...</div>;
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
      {isAuthenticated ? (
        <div>
          <div className="mx-auto d-flex flex-column chart-container">
            <GaugeChart
              class="chart"
              textColor="#333"
              id="gauge-chart2"
              nrOfLevels={30}
              percent={point.point / 100.0}
              formatTextValue={(value) => `${value}点`}
            />
            <p className="mx-auto cost-text">あなたの負担額：{score.cost}円</p>
          </div>
          <div className="d-flex flex-column mx-auto">
            <div className="record-container mx-auto">
              <ReactAudioPlayer
                src={URL.createObjectURL(new Blob(file))}
                controls
              />
            </div>
            <div className="d-flex app-container mx-auto">
              <button className="btn btn-primary" onClick={handleStart}>
                <i className="fa-solid fa-record-vinyl" /> 録音
              </button>
              <button
                className="btn btn-primary"
                onClick={handleStop}
                disabled={audioState}
              >
                <i className="fa-solid fa-stop" /> ストップ
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={file.length === 0}
              >
                <i className="fa-solid fa-share" /> 送信
              </button>
              <button className="btn btn-primary" onClick={handleRemove}>
                <i className="fa-solid fa-trash-can" /> 削除
              </button>
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}
      <div className="login-container mx-auto">
        <NavBar user={user} />
      </div>
    </div>
  );
};

export default App;
