package redis

import (
	"log"
	"os"
	"time"

	"github.com/go-redis/redis"
	"github.com/pkg/errors"
)

const Nil = redis.Nil

func New(dsn string) (*redis.Client, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     dsn,
		Password: os.Getenv("REDIS_AUTH"),
		DB:       0,
	})
	if err := client.Ping().Err(); err != nil {
		return nil, errors.Wrapf(err, "Failed to ping redis server")
	}
	return client, nil
}

func SetValue(savePath string, value string) error {
	redisPath := os.Getenv("REDIS_HOST")
	client, err := New(redisPath)
	if err != nil {
		return err
	}
	defer client.Close()

	err = client.Set(savePath, value, -1).Err()
	if err != nil {
		return errors.Wrap(err, "Failed to save item")
	}
	return nil
}

func GetValue(savePath string) (string, error) {
	redisPath := os.Getenv("REDIS_HOST")
	client, err := New(redisPath)
	if err != nil {
		return "error", err
	}
	defer client.Close()
	//セーブパスが存在するかチェックする
	err = client.Get(savePath).Err()
	if err == redis.Nil {
		err = client.Set(savePath, "init", -1).Err()
		if err != nil {
			return "error", errors.Wrap(err, "Failed to get redis client")
		}
	} else if err != nil {
		return "error", errors.Wrapf(err, "Failed to get %s", savePath)
	} else {
		value, err := client.Get(savePath).Result()
		if err != nil {
			return "error", errors.Wrap(err, "Failed to save item")
		}
		return value, nil
	}
	return "error", errors.New("an unexpected error has occurred...")
}

func AddValue(target string) error {
	redisPath := os.Getenv("REDIS_HOST")
	client, err := New(redisPath)
	if err != nil {
		return errors.Wrap(err, "Failed to get redis client")
	}
	defer client.Close()
	err = client.Get(target).Err()
	if err == redis.Nil {
		log.Printf("%s does not exist. creating now...\n", target)

		err = client.Set(target, 1, time.Hour*24).Err()
		if err != nil {
			return errors.Wrap(err, "Failed to set client")
		}
	} else if err != nil {
		return errors.Wrapf(err, "Failed to get %s", target)

	} else {
		currentNum, err := client.Incr(target).Result()
		if err != nil {
			return errors.Wrapf(err, "Failed to incr %s", target)
		}
		log.Printf("currentNum: %d\n", currentNum)
	}
	return nil
}

func DeclValue(target string) (int, error) {
	redisPath := os.Getenv("REDIS_HOST")
	client, err := New(redisPath)
	if err != nil {
		return 0, errors.Wrap(err, "Failed to get redis client")
	}
	defer client.Close()
	currentNum, err := client.Decr(target).Result()
	if err != nil {
		return 0, errors.Wrap(err, "Failed to decr value")
	}
	return int(currentNum), nil
}
