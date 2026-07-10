Rails.application.routes.draw do
  root 'pages#room'
  get 'room', to: 'pages#room'
  get '/auth/failure', to: 'sessions#failure'
end
