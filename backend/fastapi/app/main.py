# coding: utf-8
import speech_recognition as sr
import os
import soundfile as sf
from io import BytesIO
from fastapi import FastAPI, File, UploadFile, WebSocket
import librosa


SAMPLE_SIZE = 1
SAMPLE_RATE = 44100
PATH = "/path/to/output.wav"
app = FastAPI()


def wav_read(path):
    wave, fs = sf.read(path)  # 音データと周波数を読み込む
    return wave, fs


def calc_rms(filename):
    wave, fs = wav_read(filename)
    # db: 20 * log_10(volume)
    rms = librosa.feature.rms(y=wave)  # 音量の計算


def calc_score():

    return


@app.post("/convert/wav")
async def create_upload_file(file: UploadFile = File(...)):
    wavdata = file.file
    r = sr.Recognizer()
    audio_data, samplerate = sf.read(BytesIO(wavdata.read()))
    sf.write("new_file.wav", audio_data, samplerate)
    with sr.AudioFile("new_file.wav") as source:
        audio = r.record(source)
    text = r.recognize_google(audio, language="ja-JP")
    return {"text": text}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        await websocket.send_text(f"Message text was: {data}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
