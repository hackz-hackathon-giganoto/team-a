# -*- coding: utf-8 -*-
import logging
import multiprocessing
import os
import time
import wave
from multiprocessing import set_start_method
from multiprocessing.queues import Queue
from typing import Optional
import shutil
import uvicorn
from fastapi import Cookie, Depends, FastAPI, Query, WebSocket, status, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.responses import FileResponse
import speech_recognition as sr


format = "%(asctime)s: %(message)s"
logging.basicConfig(format=format, level=logging.DEBUG, datefmt="%H:%M:%S")

app = FastAPI()

root = os.path.dirname(__file__)

app.mount("/static", StaticFiles(directory=os.path.join(root, "static")), name="static")

templates = Jinja2Templates(directory=os.path.join(root, "templates"))


@app.get("/favicon.ico")
async def get():
    return FileResponse(os.path.join(root, "static", "favicon.ico"))


@app.get("/")
async def get(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


async def get_cookie_or_token(
    websocket: WebSocket,
    session: Optional[str] = Cookie(None),
    token: Optional[str] = Query(None),
):
    if session is None and token is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
    return session or token


def voice_recognition(filename):
    r = sr.Recognizer()
    with sr.AudioFile(filename) as source:
        audio = r.record(source)
    text = r.recognize_google(audio, language="ja-JP")
    print("Text:", text)
    return text


def wav_worker(
    q: Queue,
    q2: Queue,
    uid: str,
):
    root = os.path.join(os.path.dirname(__file__), "upload_waves")
    os.makedirs(root, exist_ok=True)
    filename = os.path.join(root, f"{uid}_{time.time()}.wav")
    work_filename = os.path.join(root, f"work_{uid}_{time.time()}.wav")
    file_counter = 0
    counter = 0
    try:
        wav = wave.open(filename, mode="wb")
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(16000)

        work_wav = wave.open(work_filename, mode="wb")

        work_wav.setnchannels(1)
        work_wav.setsampwidth(2)
        work_wav.setframerate(16000)

        while True:
            data_bytes = q.get()
            wav.writeframes(data_bytes)
            work_wav.writeframes(data_bytes)
            # logging.info("start voice recognition")
            length = 1.0 * (work_wav.getnframes() / work_wav.getframerate())
            if length > 5:
                # logging.info("Recognizing")
                # 今のファイルをcloseして別のファイルにリネーム
                work_wav.close()
                tmp_filename = os.path.join(
                    root, f"{file_counter}_work_{uid}_{time.time()}.wav"
                )
                shutil.move(work_filename, tmp_filename)
                work_wav = wave.open(work_filename, mode="wb")
                work_wav.setnchannels(1)
                work_wav.setsampwidth(2)
                work_wav.setframerate(16000)
                file_counter += 1
                voice_text = voice_recognition(tmp_filename)
            else:
                voice_text = "wait a few moments"

            if len(voice_text) < 1:
                voice_text = "failed"
            # print(f"q.get {len(data_bytes)}")
            q2.put(voice_text)
            counter += 1

    except Exception as e:
        logging.debug(e)
    finally:
        wav.close()
    logging.info("leave wav_worker")


@app.websocket("/items/{item_id}/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    item_id: str,
    q: Optional[int] = None,
    cookie_or_token: str = Depends(get_cookie_or_token),
):
    await websocket.accept()
    logging.info("websocket.accept")

    ctx = multiprocessing.get_context()
    queue = ctx.Queue()
    queue2 = ctx.Queue()

    process = ctx.Process(target=wav_worker, args=(queue, queue2, item_id))
    process.start()
    counter = 0

    try:
        while True:
            data_bytes = await websocket.receive_bytes()
            data = [
                int.from_bytes(data_bytes[i : i + 2], byteorder="little", signed=True)
                for i in range(0, len(data_bytes), 2)
            ]
        
            # await websocket.send_text(
            #     f"Session cookie or query token value is: {cookie_or_token}. counter {counter}"
            # )
            # if q is not None:
            #     await websocket.send_text(f"Query parameter q is: {q}")
            # await websocket.send_text(
            #     f"Message text was: {data}, for item ID: {item_id}"
            # )
            queue.put(data_bytes)

            text = queue2.get()
            if text is not None:
                print(f"Message text was: {text}")
            if text is not None and len(text) > 0 and text != "wait a few moments":
                await websocket.send_text(
                    f"Message text was: {text}"
                )
            else:
                print("Failed to recognize")
            counter += 1

    except Exception as e:
        logging.debug(e)
    finally:
        # Wait for the worker to finish
        queue.close()
        queue.join_thread()

        # use terminate so the while True loop in process will exit
        process.terminate()
        process.join()

    logging.info("leave websocket_endpoint")


if __name__ == "__main__":
    # When using spawn you should guard the part that launches the job in if __name__ == '__main__':.
    # `set_start_method` should also go there, and everything will run fine.
    try:
        set_start_method("spawn")
    except RuntimeError as e:
        print(e)

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        reload=True,
        log_level="debug",
        ssl_keyfile=os.path.join(root, "key.pem"),
        ssl_certfile=os.path.join(root, "cert.pem"),
    )
