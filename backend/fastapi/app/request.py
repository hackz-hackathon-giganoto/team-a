import requests


class Message:
    def __init__(self):
        self.accessURL = "http://localhost:9000/convert/wav"

    def put_wav(self):
        self.headers = {}
        self.payload = {}
        fileName = "sample.wav"
        files = {"file": open(fileName, "rb")}
        r = requests.post(
            self.accessURL, headers=self.headers, params=self.payload, files=files
        )
        print(r.text)


if __name__ == "__main__":
    message = Message()
    message.put_wav()
