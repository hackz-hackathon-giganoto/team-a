package main

import (
	"fmt"
	"log"
	"main/lib/redis"
	"os"
)

func checkRoomId(roomId string) (bool, error) {
	// DBの初期化
	redisPath := os.Getenv("REDIS_PATH")
	log.Println(redisPath)
	client, err := redis.New(redisPath)

	if err != nil {
		fmt.Println(err)
		return false, err
	}

	defer client.Close()

	//値の存在チェック
	result := client.SIsMember(ID_PATH, roomId)
	if result.Err() != nil {
		//redisのエラー
		fmt.Println(err)
		return false, err
	} else if result.Val() {
		return true, nil
	} else {
		return false, nil
	}
}
