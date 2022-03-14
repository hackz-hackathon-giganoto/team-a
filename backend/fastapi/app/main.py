# coding: utf-8
from os import getenv
import speech_recognition as sr
import math
import soundfile as sf
from io import BytesIO
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import librosa
import random
import shutil
import json
import string
import pydub
from pydub import AudioSegment
from pathlib import Path
from tempfile import NamedTemporaryFile
import wave
import requests

SAMPLE_SIZE = 1
SAMPLE_RATE = 44100
PATH = "/path/to/output.wav"

app = FastAPI()
origins = [
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def randomname(n):
    return ''.join(random.choices(string.ascii_letters + string.digits, k=n))


def wav_read(path):
    wave_data, fs = sf.read(path)  # 音データと周波数を読み込む
    return wave_data, fs


def calc_rms(filename):
    # 情報取得
    # 読み込みモードでWAVファイルを開く
    with wave.open(filename, 'rb') as wr:
        # 情報取得
        # ch = wr.getnchannels()
        # width = wr.getsampwidth()
        fr = wr.getframerate()
        fn = wr.getnframes()
        # 表示
        # print("チャンネル: ", ch)
        # print("サンプルサイズ: ", width)
        # print("サンプリングレート: ", fr)
        # print("フレームレート: ", fn)
        print("再生時間: ", 1.0 * fn / fr)
    wave_data, fs = wav_read(filename)

    # db: 20 * log_10(volume)
    rms = librosa.feature.rms(y=wave_data)  # 音量の計算
    return {"rms": rms, "duration": 1.0 * fn / fr}


def voice_recognition(filename):
    r = sr.Recognizer()
    with sr.AudioFile(filename) as source:
        audio = r.record(source)
    try:
        text = r.recognize_google(audio, language="ja-JP")
    except BaseException:
        text = ""
        pass
    print("Text:", text)
    return text


"""
採点基準:
1. 言語化出来なかったら => 10
2. 言語化出来た場合 => 音声の長さに対する割合が低いほど良い => ポイントに応じる
    - 1秒6文字

"""


def calc_score(filename):
    # 1秒の文字数
    second_str = 6
    data = {}
    rms = calc_rms(filename)
    text = voice_recognition(filename)
    duration = rms["duration"]

    # 総文字数を計算
    str_len = second_str * duration
    # 割合を計算
    parcent = len(text) / str_len
    score_text = 100 - (100 * parcent)

    data['duration'] = duration
    data['score'] = score_text
    print(rms)
    # data['db'] = 20 * math.log10(rms)
    return data


@app.post("/convert/wav")
async def create_upload_file(file: UploadFile = File(...), user_id: str = Form(...)):
    # 前処理
    print(user_id)
    wavdata = file.file
    audio_data, samplerate = sf.read(BytesIO(wavdata.read()))
    filename = randomname(32) + ".wav"
    sf.write(filename, audio_data, samplerate)

    # スコアデータの計算
    score = calc_score(filename)
    # Goサーバーに送信
    request_data = {"score": score["score"], "user_id": user_id}
    # リクエストを作成
    print(json.dumps(request_data))
    response = requests.post(
        getenv("GO_API_URL"),
        data=json.dumps(request_data))
    return json.loads(response.text)


def save_upload_file_tmp(upload_file: UploadFile) -> Path:
    try:
        suffix = Path(upload_file.filename).suffix
        with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(upload_file.file, tmp)
            tmp_path = Path(tmp.name)
    finally:
        upload_file.file.close()
    return tmp_path


@app.post("/convert/mp3")
async def create_mp3_file(file: UploadFile = File(...)):
    path = save_upload_file_tmp(file)
    print(file.filename)
    print(path)
    base_sound = AudioSegment.from_file(path, format="mp3")  # 音声を読み込み
    length_seconds = base_sound.duration_seconds  # 長さを確認
    print(length_seconds)
    base_sound.export("./result.mp3", format="mp3")  # 保存する
    return


# @app.websocket("/ws")
# async def websocket_endpoint(websocket: WebSocket):
#     await websocket.accept()
#     while True:
#         data = await websocket.receive_text()
#         await websocket.send_text(f"Message text was: {data}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
