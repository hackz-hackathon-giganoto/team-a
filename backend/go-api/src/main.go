package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"strconv"

	"main/lib/k8s"
	"main/lib/redis"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
)

func calcAllScore() float64 {
	allScores, err := redis.HVals(STORE_USER_SCORE)

	if err != nil {
		log.Println(err)
		return -1
	}
	//母数の計算
	var score float64
	for _, val := range allScores {

		convertVal, _ := strconv.ParseFloat(val, 64)
		score = score + convertVal
	}
	log.Println("All score: ", score)
	return score
}
func startJob(config *rest.Config) {

	// WebSocketに良い感じに流すジョブ
	go func() {
		for range time.Tick(5 * time.Second) {
			fmt.Println("Socket Job is called")

			//母数の計算
			score := calcAllScore()

			if score <= 0.0 {
				continue
			}

			//ユーザーリストの取得
			userList, err := redis.SMEMBERS(CONNECTION_PATH)
			if err != nil {
				log.Println(err)
				continue
			}
			fmt.Println("Current target num:", len(userList))

			podNum, _ := k8s.GetPodsCount(config, "default", POD_NAME)
			cost := K8S_COST * podNum

			for _, userId := range userList {
				// 各ユーザーのスコアを取得
				userScore, err := redis.HGetInt(STORE_USER_SCORE, userId)
				if err != nil {
					log.Println(err)
					continue
				}
				//ユーザー負担額の計算
				userCost := int(float64(cost) * (1.0 - (userScore / score)))
				connections, _ := redis.DBSize()
				callback := SocketResponse{
					Cost:   int64(userCost),
					Action: "SCORE_DATA",
					Count:  connections,
					Score:  userScore,
					Pods:   podNum,
				}
				log.Println("Response: ", callback)

				response, err := json.Marshal(callback)
				if err != nil {
					log.Println(err)
					continue
				}
				m := message{response, userId}
				h.broadcast <- m
			}
		}
	}()
	//全ユーザーのスコアが1000nに達したらpodを増やす
	const threshold = 300
	const minNum = 3
	// Podの監視ジョブ
	go func() {
		for range time.Tick(6 * time.Second) {
			fmt.Println("Pod Job is called")
			score := calcAllScore()
			podNum, _ := k8s.GetPodsCount(config, "default", POD_NAME)
			log.Println("Score is", score)
			newNum := int64(score/threshold) + minNum
			log.Println("Pod num is ", newNum)
			if newNum < int64(podNum) {
				continue
			}
			// _, err := k8s.UpdatePodCount(config, "default", POD_NAME, int(newNum))
			// if err != nil {
			// 	log.Println(err)
			// }
		}
	}()
}

func main() {
	var kubeconfig *string
	if home := homedir.HomeDir(); home != "" {
		kubeconfig = flag.String("kubeconfig", filepath.Join(home, ".kube", "config"), "(optional) absolute path to the kubeconfig file")
	} else {
		kubeconfig = flag.String("kubeconfig", "", "absolute path to the kubeconfig file")
	}
	flag.Parse()

	// use the current context in kubeconfig
	config, _ := clientcmd.BuildConfigFromFlags("", *kubeconfig)

	router := gin.Default()
	// Set a lower memory limit for multipart forms (default is 32 MiB)
	router.MaxMultipartMemory = 8 << 20 // 8 MiB
	router.Use(cors.New(cors.Config{
		// 許可したいHTTPメソッドの一覧
		AllowMethods: []string{
			"POST",
			"GET",
			"OPTIONS",
			"PUT",
			"DELETE",
		},
		// 許可したいHTTPリクエストヘッダの一覧
		AllowHeaders: []string{
			"Access-Control-Allow-Headers",
			"Content-Type",
			"Content-Length",
			"Accept-Encoding",
			"X-CSRF-Token",
			"Authorization",
		},
		// 許可したいアクセス元の一覧
		AllowOrigins: []string{
			"*",
		},
		MaxAge: 24 * time.Hour,
	}))

	router.GET("/score", func(c *gin.Context) {
		user_id := c.Query("user_id")

		// スコアをRedisから取得
		score, err := redis.GetValue(user_id)
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{
				"error": fmt.Sprintf("get redis err: %s", err.Error()),
			})
			return
		}

		// コストの取得（ここで計算処理を叩く感じかな）
		cost := 2490
		// 文字列から数値へ
		int_score, _ := strconv.Atoi(score)
		// 累計ユーザー数
		user_count, _ := redis.DBSize()

		c.JSON(http.StatusOK, GetScoreResponse{
			Cost:      cost,
			Score:     int_score,
			UserCount: user_count,
		})
	})

	router.POST("/score", func(c *gin.Context) {
		request := PostScoreRequest{}
		err := c.BindJSON(&request)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf("get form err: %s", err.Error()),
			})
			return
		}

		// スコアをRedisに保存
		err = redis.HINCRBY(STORE_USER_SCORE, request.UserId, request.Score)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": fmt.Sprintf("LOG: %s", err.Error()),
			})
			return
		}

		// err = redis.SetValue(request.UserId, strconv.Itoa(request.Score))
		// if err != nil {
		// 	c.JSON(http.StatusBadGateway, gin.H{
		// 		"error": fmt.Sprintf("get redis err: %s", err.Error()),
		// 	})
		// 	return
		// }

		c.JSON(http.StatusOK, PostScoreResponse{
			Message: "ok",
		})
	})
	// router.POST("/pod", func(c *gin.Context) {
	// 	namespace := c.Query("namespace")
	// 	pod := c.Query("pod_name")
	// 	pod_count, _ := strconv.Atoi(c.Query("pod_count"))
	// 	status, err := k8s.UpdatePodCount(config, namespace, pod, pod_count)
	// 	if err != nil || status == -1 {
	// 		c.JSON(http.StatusBadGateway, gin.H{
	// 			"error": fmt.Sprintf("get k8s err: %s", err.Error()),
	// 		})
	// 		return
	// 	}
	// })
	// router.GET("/pod", func(c *gin.Context) {
	// 	namespace := c.Query("namespace")
	// 	pod := c.Query("pod_name")
	// 	podsCount, err := k8s.GetPodsCount(config, namespace, pod)
	// 	if err != nil || podsCount == -1 {
	// 		c.JSON(http.StatusBadGateway, gin.H{
	// 			"error": fmt.Sprintf("get k8s err: %s", err.Error()),
	// 		})
	// 		return
	// 	}

	// 	c.JSON(http.StatusOK, GetPodsCountResponse{
	// 		Count: podsCount,
	// 	})

	// })
	router.GET("/ws/:userId", func(c *gin.Context) {
		userId := c.Param("userId")
		serveWs(c.Writer, c.Request, userId)
	})

	go h.run()
	startJob(config)

	router.Run(":80")
}
