class SpotifyAuthorizationsController < ApplicationController
  before_action :authenticate_user!

  def authorize
    service = SpotifyOauthService.new(redirect_uri: spotify_redirect_uri)
    return redirect_to portal_path, alert: "Spotify Client ID / Secret is not configured." unless service.configured?

    state = SecureRandom.hex(24)
    session[:spotify_oauth_state] = state

    redirect_to service.authorize_url(state: state), allow_other_host: true
  end

  def callback
    return redirect_to portal_path, alert: params[:error_description].presence || params[:error] if params[:error].present?
    return redirect_to portal_path, alert: "Spotify authorization state did not match." unless valid_state?

    token_result = SpotifyOauthService.new(redirect_uri: spotify_redirect_uri).exchange_code(params[:code])
    return redirect_to portal_path, alert: token_result[:message] unless token_result[:status] == "success"

    save_spotify_account!(token_result)
    redirect_to portal_path, notice: "Spotifyを連携しました。"
  ensure
    session.delete(:spotify_oauth_state)
  end

  private

  def valid_state?
    session[:spotify_oauth_state].present? &&
      params[:state].present? &&
      ActiveSupport::SecurityUtils.secure_compare(session[:spotify_oauth_state], params[:state])
  end

  def save_spotify_account!(token_result)
    service = SpotifyOauthService.new(redirect_uri: spotify_redirect_uri)
    profile = service.profile(token_result[:access_token])
    spotify_user_id = profile[:id].presence || "user-#{current_user.id}"

    account = current_user.spotify_account || current_user.build_spotify_account(spotify_user_id: spotify_user_id)
    account.assign_attributes(
      spotify_user_id: spotify_user_id,
      access_token: token_result[:access_token],
      refresh_token: token_result[:refresh_token].presence || account.refresh_token,
      token_expires_at: Time.current + token_result[:expires_in].to_i.seconds
    )
    account.save!
  end

  def spotify_redirect_uri
    configured_uri = SpotifyEnv.fetch("SPOTIFY_REDIRECT_URI").presence
    return configured_uri if configured_uri&.include?("/spotify/callback")

    spotify_callback_url(host: "127.0.0.1", port: request.port)
  end
end
