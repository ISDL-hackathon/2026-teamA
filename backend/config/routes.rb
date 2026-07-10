Rails.application.routes.draw do
  root "auth#login"

  get "login", to: "auth#login"
  get "auth/auth0/callback", to: "auth#callback"
  get "auth/failure", to: "auth#failure"
  delete "logout", to: "auth#logout"
  get "logout", to: "auth#logout"

  get "setup", to: "profiles#edit"
  patch "setup", to: "profiles#update"
  delete "setup", to: "auth#logout"

  get "portal", to: "laboratories#show"
  get "laboratories/show"

  namespace :api do
    namespace :v1 do
      post "scan", to: "scans#create"
      resources :cards, only: [:create]
      resources :access_logs, only: [:index]

      namespace :spotify do
        get "search", to: "tracks#search"
        resources :tracks, only: [:index, :create, :destroy]
      end

      namespace :alexa do
        post "play_queue", to: "queues#create"
      end
    end
  end
end
