# coding: utf-8
import speech_recognition as sr
import os
import glob
import soundfile as sf
from io import BytesIO
from fastapi import FastAPI, File, UploadFile, WebSocket
import uvicorn


SAMPLE_SIZE = 1
SAMPLE_RATE = 44100
PATH = "/path/to/output.wav"
app = FastAPI()


def convertM4aToWav():
    for filename in glob.glob("m4a_data/*.m4a"):
        a = filename[len("m4a_data") + 1 :][
            :-4
        ]  # ファイル名だけ取り出す ex) m4a_data/hoge.m4a → hoge
        os.system("ffmpeg -i m4a_data/{}.m4a -ab 256k mp3_data/{}.mp3".format(a, a))

    for filename in glob.glob("mp3_data/*.mp3"):
        a = filename[len("mp3_data") + 1 :][
            :-4
        ]  # ファイル名だけ取り出す ex) mp3_data/hoge.mp3 → hoge
        os.system(
            "sox mp3_data/{}.mp3 data_wav/{}.wav channels 1 rate 16k".format(a, a)
        )
    r = sr.Recognizer()

    with sr.AudioFile("data_wav/sample.wav") as source:
        audio = r.record(source)
    text = r.recognize_google(audio, language="ja-JP")
    print(text)
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
    uvicorn.run(app, host="0.0.0.0", port=9000)
