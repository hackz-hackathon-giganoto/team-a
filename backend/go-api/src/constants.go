package main

// constant value is here...
const STORE_USER_SCORE = "user/score/"
const ID_PATH = "ID_PATH"
const CONNECTION_PATH = "connection_path"

var errorSocketResponse = []byte(`{"action":"ERROR_MESSAGE","status":"NG","error": true}`)

const POD_NAME = "azure-vote-front-56fc8567f9-rpg7g"
const K8S_COST = 10000
