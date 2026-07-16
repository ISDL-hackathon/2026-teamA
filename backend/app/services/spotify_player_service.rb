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

    response = play_request(token, track_uri, target_device_id)
    return success if spotify_success?(response)

    if retry_playback_after_transfer?(response)
      transfer = transfer_playback!(token, target_device_id)
      return transfer unless transfer[:status] == "success"

      response = play_request(token, track_uri, target_device_id)
    end
    return success if spotify_success?(response)

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

    return success if spotify_success?(response) || already_paused?(response)

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

    return success if spotify_success?(response)

    Rails.logger.warn("[spotify-player] transfer failed: #{response.code} #{response.body}")
    error(playback_error_message(response), "SPOTIFY_TRANSFER_FAILED", response.code)
  end

  def play_request(token, track_uri, target_device_id)
    HTTParty.put(
      PLAYER_URL,
      headers: {
        "Authorization" => "Bearer #{token}",
        "Content-Type" => "application/json"
      },
      query: { device_id: target_device_id },
      body: { uris: [track_uri] }.to_json
    )
  end

  def retry_playback_after_transfer?(response)
    return true if response.code == 404

    reason = spotify_error(response)["reason"]
    %w[NO_ACTIVE_DEVICE DEVICE_NOT_FOUND].include?(reason)
  end

  def playback_error_message(response)
    error_detail = spotify_error(response)
    spotify_message = error_detail["message"].presence
    spotify_reason = error_detail["reason"].presence

    case response.code
    when 401
      "Spotify連携が期限切れ、または無効です。Spotifyを連携し直してください。"
    when 403
      spotify_forbidden_message(response)
    when 404
      "Spotifyの再生先が見つかりません。AlexaやPCなどのSpotify Connect再生先を起動してから、再生先を更新してください。"
    else
      return "Spotifyの再生に失敗しました。#{spotify_message}#{spotify_reason ? " (#{spotify_reason})" : ""}" if spotify_message

      "Spotifyの再生に失敗しました。"
    end
  end

  def spotify_forbidden_message(response)
    reason = spotify_error(response)["reason"]

    case reason
    when "PREMIUM_REQUIRED"
      "Spotify再生にはPremiumアカウントが必要です。PremiumのSpotifyアカウントで連携し直してください。"
    when "PLAYER_COMMAND_FAILED", "RESTRICTION_VIOLATED"
      "Spotify側で再生操作が拒否されました。選択した再生先がSpotify Connectで操作可能か確認してください。"
    else
      "Spotify再生が許可されていません。Premiumアカウントで、Spotifyを連携し直してください。"
    end
  end

  def spotify_success?(response)
    [200, 202, 204].include?(response.code)
  end

  def already_paused?(response)
    return false unless response.code == 403

    spotify_error(response)["reason"] == "NOT_PLAYING"
  end

  def spotify_error(response)
    parsed = response.parsed_response
    return {} unless parsed.is_a?(Hash)

    parsed["error"].is_a?(Hash) ? parsed["error"] : {}
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
