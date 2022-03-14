package main

import "github.com/gorilla/websocket"

type GetScoreResponse struct {
	Cost      int `json:"cost"`
	Score     int `json:"score"`
	UserCount int `json:"user_count"`
}

type PostScoreRequest struct {
	Score  float64 `json:"score"`
	UserId string  `json:"user_id"`
}

type PostScoreResponse struct {
	Message string `json:"message"`
}

type GetPodsCountResponse struct {
	Count int `json:"count"`
}
type connection struct {
	ws   *websocket.Conn
	send chan []byte
}
type subscription struct {
	conn *connection
	room string
}
type ByteBroadCast struct {
	Message []byte
	Type    int
	Conn    *websocket.Conn
}
type message struct {
	data []byte
	room string
}

type hub struct {
	rooms      map[string]map[*connection]bool
	broadcast  chan message
	register   chan subscription
	unregister chan subscription
}

// ここからはシステム関連の型

type ResponseRoomId struct {
	Id         string `json:"room_id"`
	Link       string `json:"chat_url"`
	SocketLink string `json:"socket_chat_url"`
}

type ErrorObject struct {
	Name string `json:"name"`
	Code string `json:"code"`
}
type Request struct {
	Action  string `json:"action"`
	Message string `json:"message"`
	Name    string `json:"name"` //UserIdとする
	RoomId  string `json:"room_id"`
	UserId  string `json:"user_id"`
}

type MessageObject struct {
	Action  string `json:"action"`
	UserId  string `json:"user_id"`
	Message string `json:"message"`
	Time    string `json:"time"`
}

type InitObject struct {
	RoomId string `json:"room_id"`
	UserId string `json:"user_id"`
}

type SocketResponse struct {
	Action string  `json:"action"`
	Score  float64 `json:"score"`
	Cost   int64   `json:"cost"`
	Count  int     `json:"count"`
	Pods   int     `json:"pods_num"`
}
