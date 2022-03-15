FROM python:alpine
WORKDIR /api

ENV LANG ja_JP.UTF-8
ENV LANGUAGE ja_JP:ja
ENV LC_ALL ja_JP.UTF-8
ENV TZ JST-9
RUN apk add --no-cache build-base openssl openblas-dev ffmpeg sox libffi-dev libsndfile-dev
COPY requirements.txt .
# COPY *.pem .
COPY ./app/main.py /api/app
RUN pip install -r requirements.txt

# CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000","--ssl-keyfile=./key.pem" ,"--ssl-certfile=./cert.pem"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
