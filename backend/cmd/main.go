package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		data, err := json.Marshal(map[string]string{"status": "ok"})
		if err != nil {
			log.Println("json encode error")
			return
		}
		w.Write(data)
	})
	// err := http.ListenAndServe(":8080", nil)
	// if err != nil {
	// 	log.Fatalf("Cannot listen server")
	// }
	srv := &http.Server{Addr: ":8080", Handler: nil}
	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()
	go func() {
		err := srv.ListenAndServe()
		if err == http.ErrServerClosed {
			log.Println("Succesful stoped")
		} else {
			log.Fatalf("Critical error")
		}
	}()
	<-ctx.Done()
	shutctx, stop := context.WithTimeout(ctx, 5*time.Second)
	defer stop()
	err := srv.Shutdown(shutctx)
	if err != nil {
		log.Fatalf("Cannot shutdown server")
	}
}
