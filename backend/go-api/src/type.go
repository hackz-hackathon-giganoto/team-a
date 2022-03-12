package main

type PostScoreRequest struct {
	Score string `json:"score"`
	UserId string `json:"user_id"`
}

type PostScoreResponse struct {
	Message string `json:"message"`
}

type GetScoreRequest struct {
	UserId string `json:"user_id"`
}

type GetScoreResponse struct {
	Cost string `json:"cost"`
	Score string `json:"score"`
	UserCount string `json:"user_count"`
}