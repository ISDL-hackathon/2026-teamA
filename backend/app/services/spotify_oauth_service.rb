require "base64"
require "securerandom"
require "uri"

class SpotifyOauthService
  AUTHORIZE_URL = "https://accounts.spotify.com/authorize".freeze
  TOKEN_URL = "https://accounts.spotify.com/api/token".freeze
  ME_URL = "https://api.spotify.com/v1/me".freeze
  SCOPES = %w[
    user-read-playback-state
    user-modify-playback-state
  ].freeze

  def initialize(redirect_uri:)
    @redirect_uri = redirect_uri
  end

  def configured?
    client_id.present? && client_secret.present?
  end

  def authorize_url(state:)
    query = {
      response_type: "code",
      client_id: client_id,
      scope: SCOPES.join(" "),
      redirect_uri: @redirect_uri,
      state: state,
      show_dialog: true
    }

    "#{AUTHORIZE_URL}?#{URI.encode_www_form(query)}"
  end

  def exchange_code(code)
    return error("Spotify Client ID / Secret is not configured.", "SPOTIFY_CREDENTIALS_REQUIRED") unless configured?

    response = HTTParty.post(
      TOKEN_URL,
      headers: token_headers,
      body: URI.encode_www_form(
        grant_type: "authorization_code",
        code: code,
        redirect_uri: @redirect_uri
      )
    )

    return error(token_error_message(response), "SPOTIFY_TOKEN_EXCHANGE_FAILED", response.code) unless response.success?

    {
      status: "success",
      access_token: response["access_token"],
      refresh_token: response["refresh_token"],
      expires_in: response["expires_in"],
      scope: response["scope"]
    }
  rescue StandardError => e
    Rails.logger.warn("[spotify-oauth] token exchange failed: #{e.class}: #{e.message}")
    error("Spotify token exchange failed.", "SPOTIFY_TOKEN_EXCHANGE_FAILED")
  end

  def profile(access_token)
    response = HTTParty.get(
      ME_URL,
      headers: { "Authorization" => "Bearer #{access_token}" }
    )

    return {} unless response.success?

    {
      id: response["id"],
      display_name: response["display_name"]
    }
  rescue StandardError => e
    Rails.logger.warn("[spotify-oauth] profile fetch failed: #{e.class}: #{e.message}")
    {}
  end

  private

  def token_headers
    authorization = Base64.strict_encode64("#{client_id}:#{client_secret}")

    {
      "Authorization" => "Basic #{authorization}",
      "Content-Type" => "application/x-www-form-urlencoded"
    }
  end

  def client_id
    SpotifyEnv.fetch("SPOTIFY_CLIENT_ID")
  end

  def client_secret
    SpotifyEnv.fetch("SPOTIFY_CLIENT_SECRET")
  end

  def token_error_message(response)
    Rails.logger.warn("[spotify-oauth] token exchange failed: #{response.code} #{response.body}")
    "Spotify authorization failed. Check redirect URI, Client ID, and Client Secret."
  end

  def error(message, code, http_status = nil)
    { status: "error", message: message, code: code, http_status: http_status }.compact
  end
end
