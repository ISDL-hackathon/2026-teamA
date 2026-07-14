require "base64"
require "uri"

class SpotifyPlayerService
  DEVICES_URL = "https://api.spotify.com/v1/me/player/devices".freeze
  PLAYER_URL = "https://api.spotify.com/v1/me/player/play".freeze
  PAUSE_URL = "https://api.spotify.com/v1/me/player/pause".freeze
  TRANSFER_URL = "https://api.spotify.com/v1/me/player".freeze
  TOKEN_URL = "https://accounts.spotify.com/api/token".freeze

  def initialize(spotify_account = nil)
    @spotify_account = spotify_account
  end

  def devices
    token = access_token
    return error("Spotify player token is not configured", "SPOTIFY_PLAYER_TOKEN_REQUIRED") if token.blank?

    response = HTTParty.get(
      DEVICES_URL,
      headers: { "Authorization" => "Bearer #{token}" }
    )

    return error(playback_error_message(response), "SPOTIFY_DEVICES_FAILED", response.code) unless response.success?

    {
      status: "success",
      devices: response["devices"].to_a.map { |device| device_payload(device) }
    }
  end

  def play_track!(track_uri, device_id: nil)
    token = access_token
    return error("Spotify player token is not configured", "SPOTIFY_PLAYER_TOKEN_REQUIRED") if token.blank?

    target_device_id = device_id.presence || default_device_id
    return error("Select a Spotify Connect device before playing music.", "SPOTIFY_DEVICE_ID_REQUIRED") if target_device_id.blank?

    transfer = transfer_playback!(token, target_device_id)
    return transfer unless transfer[:status] == "success"

    query = {}
    query[:device_id] = target_device_id

    response = HTTParty.put(
      PLAYER_URL,
      headers: {
        "Authorization" => "Bearer #{token}",
        "Content-Type" => "application/json"
      },
      query: query,
      body: { uris: [track_uri] }.to_json
    )

    return success if response.code == 204

    Rails.logger.warn("[spotify-player] playback failed: #{response.code} #{response.body}")
    error(playback_error_message(response), "SPOTIFY_PLAYBACK_FAILED", response.code)
  rescue StandardError => e
    Rails.logger.warn("[spotify-player] playback failed: #{e.class}: #{e.message}")
    error("Spotify playback request failed", "SPOTIFY_PLAYBACK_FAILED")
  end

  def pause!(device_id: nil)
    token = access_token
    return error("Spotify player token is not configured", "SPOTIFY_PLAYER_TOKEN_REQUIRED") if token.blank?

    query = {}
    target_device_id = device_id.presence || default_device_id
    query[:device_id] = target_device_id if target_device_id.present?

    response = HTTParty.put(
      PAUSE_URL,
      headers: { "Authorization" => "Bearer #{token}" },
      query: query
    )

    return success if response.code == 204

    Rails.logger.warn("[spotify-player] pause failed: #{response.code} #{response.body}")
    error(playback_error_message(response), "SPOTIFY_PAUSE_FAILED", response.code)
  rescue StandardError => e
    Rails.logger.warn("[spotify-player] pause failed: #{e.class}: #{e.message}")
    error("Spotify pause request failed", "SPOTIFY_PAUSE_FAILED")
  end

  private

  def access_token
    return account_access_token if player_account.present?

    refreshed_token&.dig(:access_token).presence || SpotifyEnv.fetch("SPOTIFY_ACCESS_TOKEN").presence
  end

  def account_access_token
    account = player_account
    return account.access_token if account.access_token.present? && !account.token_expired?

    token = refreshed_token(account.refresh_token)
    return account.access_token if token.blank? && account.access_token.present?
    return if token.blank?

    account.update!(
      access_token: token[:access_token],
      token_expires_at: Time.current + token[:expires_in].to_i.seconds
    )
    token[:access_token]
  end

  def player_account
    @player_account ||= @spotify_account.presence ||
                        SpotifyAccount.where.not(refresh_token: [nil, ""]).order(updated_at: :desc).first
  end

  def refreshed_token(refresh_token = SpotifyEnv.fetch("SPOTIFY_REFRESH_TOKEN"))
    client_id = SpotifyEnv.fetch("SPOTIFY_CLIENT_ID")
    client_secret = SpotifyEnv.fetch("SPOTIFY_CLIENT_SECRET")
    return if refresh_token.blank? || client_id.blank? || client_secret.blank?

    authorization = Base64.strict_encode64("#{client_id}:#{client_secret}")
    response = HTTParty.post(
      TOKEN_URL,
      headers: {
        "Authorization" => "Basic #{authorization}",
        "Content-Type" => "application/x-www-form-urlencoded"
      },
      body: URI.encode_www_form(grant_type: "refresh_token", refresh_token: refresh_token)
    )
    unless response.success?
      Rails.logger.warn("[spotify-player] token refresh failed: #{response.code} #{response.body}")
      return
    end

    {
      access_token: response["access_token"],
      expires_in: response["expires_in"]
    }
  end

  def default_device_id
    SpotifyEnv.fetch("SPOTIFY_DEVICE_ID").presence || AlexaDevice.find_by(is_active: true)&.device_id
  end

  def transfer_playback!(token, target_device_id)
    response = HTTParty.put(
      TRANSFER_URL,
      headers: {
        "Authorization" => "Bearer #{token}",
        "Content-Type" => "application/json"
      },
      body: { device_ids: [target_device_id], play: false }.to_json
    )

    return success if response.code == 204

    Rails.logger.warn("[spotify-player] transfer failed: #{response.code} #{response.body}")
    error(playback_error_message(response), "SPOTIFY_TRANSFER_FAILED", response.code)
  end

  def playback_error_message(response)
    case response.code
    when 401
      "Spotify token is invalid or expired. Set SPOTIFY_REFRESH_TOKEN for the Spotify account you want to control."
    when 403
      "Spotify playback is forbidden. The account must be Premium and authorized with user-modify-playback-state."
    when 404
      "Spotify device was not found. Start Spotify on the Alexa device and check SPOTIFY_DEVICE_ID."
    else
      "Spotify playback failed"
    end
  end

  def success
    { status: "success" }
  end

  def device_payload(device)
    {
      id: device["id"],
      name: device["name"],
      type: device["type"],
      is_active: device["is_active"],
      is_restricted: device["is_restricted"],
      volume_percent: device["volume_percent"]
    }
  end

  def error(message, code, http_status = nil)
    { status: "error", message: message, code: code, http_status: http_status }.compact
  end
end
