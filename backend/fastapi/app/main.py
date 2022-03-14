# coding: utf-8
import os
import speech_recognition as sr

import math
import soundfile as sf
from io import BytesIO
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import librosa
import random
import shutil
import string
import pydub
from pydub import AudioSegment
from pathlib import Path
from tempfile import NamedTemporaryFile

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
    wave, fs = sf.read(path)  # 音データと周波数を読み込む
    return wave, fs


def calc_rms(filename):
    wave, fs = wav_read(filename)
    # db: 20 * log_10(volume)
    rms = librosa.feature.rms(y=wave)  # 音量の計算
    return rms

def voice_recognition(filename):
    r = sr.Recognizer()
    with sr.AudioFile(filename) as source:
        audio = r.record(source)
    text = r.recognize_google(audio, language="ja-JP")
    print("Text:", text)
    return text


def calc_score(filename):
    data = {}
    rms = calc_rms(filename)
    text = voice_recognition(filename)
    data['rms'] = rms
    data['text'] = text
    print(rms)
    # data['db'] = 20 * math.log10(rms)
    return data


@app.post("/convert/wav")
async def create_upload_file(file: UploadFile = File(...)):
    wavdata = file.file
    print(file.filename)
    audio_data, samplerate = sf.read(BytesIO(wavdata.read()))
    filename = randomname(16) + ".wav"
    sf.write(filename, audio_data, samplerate)
    # with sr.AudioFile(filename) as source:
    #     audio = r.record(source)
    score = calc_score(filename)
    # text = r.recognize_google(audio, language="ja-JP")
    return score


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
