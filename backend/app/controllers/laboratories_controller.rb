class LaboratoriesController < ApplicationController
  before_action :authenticate_user!

  def show
    @spotify_account = current_user.spotify_account || current_user.create_spotify_account!(
      spotify_user_id: "user-#{current_user.id}",
      token_expires_at: 1.hour.from_now
    )
    @favorite_tracks = @spotify_account.spotify_tracks.order(added_at: :desc)
    @spotify_env_ready = ENV["SPOTIFY_ACCESS_TOKEN"].present? ||
                         (ENV["SPOTIFY_CLIENT_ID"].present? && ENV["SPOTIFY_CLIENT_SECRET"].present?)
  end
end
