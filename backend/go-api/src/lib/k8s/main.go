package k8s

import (
	"context"
	"log"

	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	//
	// Uncomment to load all auth plugins
	// _ "k8s.io/client-go/plugin/pkg/client/auth"
	//
	// Or uncomment to load specific auth plugins
	// _ "k8s.io/client-go/plugin/pkg/client/auth/azure"
	// _ "k8s.io/client-go/plugin/pkg/client/auth/gcp"
	// _ "k8s.io/client-go/plugin/pkg/client/auth/oidc"
	// _ "k8s.io/client-go/plugin/pkg/client/auth/openstack"
)



func GetPodsCount(config *rest.Config, namespace string, pod string) (int, error) {
	// create the clientset
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return -1, err
	}

	pods, err := clientset.CoreV1().Pods("").List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		return -1, err
	}
	log.Printf("There are %d pods in the cluster\n", len(pods.Items))

	// Examples for error handling:
	// - Use helper functions like e.g. errors.IsNotFound()
	// - And/or cast to StatusError and use its properties like e.g. ErrStatus.Message
	_, err = clientset.CoreV1().Pods(namespace).Get(context.TODO(), pod, metav1.GetOptions{})
	frontPods, err := clientset.CoreV1().Pods(namespace).List(context.TODO(), metav1.ListOptions{})
	if errors.IsNotFound(err) {
		log.Printf("Pod %s in namespace %s not found\n", pod, namespace)
		return -1, err
	} else if statusError, isStatus := err.(*errors.StatusError); isStatus {
		log.Printf("Error getting pod %s in namespace %s: %v\n", pod, namespace, statusError.ErrStatus.Message)
		return -1, err
	} else if err != nil {
		log.Printf(err.Error())
	} else {
		log.Printf("Found pod %s in namespace %s, there are %d pods in the cluster\n", pod, namespace, len(frontPods.Items))
	}
	return len(frontPods.Items), nil
}