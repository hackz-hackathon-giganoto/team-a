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

func startJob(config *rest.Config) {
	go func() {

		for range time.Tick(30 * time.Second) {
			fmt.Println("Job is called")
			// 全スコアデータの取得
			allScores, err := redis.HVals(STORE_USER_SCORE)

			if err != nil {
				log.Println(err)
				continue
			}

			//母数の計算
			var score int64
			for _, val := range allScores {
				convertVal, _ := strconv.ParseInt(val, 10, 64)
				score = score + convertVal
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
				userCost := cost * (int(userScore) / (int(score) * 1.0))
				connections, _ := redis.DBSize()
				callback := SocketResponse{
					Cost:   int64(userCost),
					Action: "SCORE_DATA",
					Count:  connections,
					Score:  userScore,
				}
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

	router.GET("/ws/:userId", func(c *gin.Context) {
		userId := c.Param("userId")
		serveWs(c.Writer, c.Request, userId)
	})

	router.GET("/pod", func(c *gin.Context) {
		namespace := c.Query("namespace")
		pod := c.Query("pod_name")
		podsCount, err := k8s.GetPodsCount(config, namespace, pod)
		if err != nil || podsCount == -1 {
			c.JSON(http.StatusBadGateway, gin.H{
				"error": fmt.Sprintf("get k8s err: %s", err.Error()),
			})
			return
		}

		c.JSON(http.StatusOK, GetPodsCountResponse{
			Count: podsCount,
		})
	})
	go h.run()
	startJob(config)
	router.Run(":80")
}
