# バックエンド

## 設計（Go 鯖）

### スコアデータ登録（POST)

これは Python 鯖から Go 鯖へ送る

Request

```json=
{
    "score":128
    "user_id":"example-user-id"
}
```

Response

```json=
{
    "message":"ok"
}
```

このスコアを DB のユーザーカラムに加算する

### スコアデータ（GET）

query parameter：

- user_id:example-user-id

response:

```json
{
  "cost": "1000円",
  "score": 100,
  "user_count": 10
}
```
