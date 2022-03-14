package main

import (
	"encoding/json"
)

func handler(s []byte) []byte {
	var requestObject Request
	if err := json.Unmarshal(s, &requestObject); err != nil {
		return errorSocketResponse
	}

	//各アクションケースに応じて処理を行う
	// switch {
	// case requestObject.Action == SEND_MESSAGE:
	// 	r, err := messageHandler(requestObject.Message, requestObject.RoomId, requestObject.UserId)
	// 	if err != nil {
	// 		return errorSocketResponse
	// 	}
	// 	return r
	// }

	return errorSocketResponse
}

// 各アクションタイプ毎のハンドラー

// func messageHandler(message string, room_id string, user_id string) ([]byte, error) {
// 	//メッセージを記録する
// 	timeStamp, err := saveMessage(message, room_id, user_id)
// 	if err != nil {
// 		// エラー対応どうしようかな？
// 	}

// 	// コールバックオブジェクトを作詞絵
// 	messageObject := MessageObject{
// 		Action:  KEY_RECV_MESSAGE,
// 		Time:    timeStamp.String(),
// 		Message: message,
// 		UserId:  user_id,
// 	}
// 	b, err := json.Marshal(messageObject)
// 	if err != nil {
// 		log.Println("cannot marshal struct: %v", err)
// 		return nil, err
// 	}
// 	return b, nil
// }
