require "base64"
require "uri"

class SpotifySearchService
  SAMPLE_TRACKS = [
    {
      spotify_track_id: "3n3Ppam7vgaVa1iaRUc9Lp",
      track_name: "Good Day",
      artist_name: "Nappy Roots",
      album_name: "Wooden Leather",
      duration_ms: 218000,
      image_url: nil,
      preview_url: nil,
      external_urls: { spotify: "https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp" }
    }
  ].freeze

  def initialize(access_token)
    @access_token = access_token
  end

  def search_tracks(query, limit = 10)
    limit = [[limit.to_i, 1].max, 50].min
    token = @access_token.presence || spotify_env("SPOTIFY_ACCESS_TOKEN").presence

    if token.blank?
      return demo_search(query, limit) unless spotify_credentials_configured?

      token = client_credentials_token
      return { status: "error", message: "Spotify authentication failed. Check SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET, then restart Rails." } if token.blank?
    end

    response = HTTParty.get(
      "https://api.spotify.com/v1/search",
      headers: { "Authorization" => "Bearer #{token}" },
      query: { q: query, type: "track", limit: limit }
    )

    return { status: "error", message: "Search failed" } unless response.success?

    tracks = response.dig("tracks", "items").to_a.map do |track|
      {
        spotify_track_id: track["id"],
        track_name: track["name"],
        artist_name: track["artists"].to_a.map { |artist| artist["name"] }.join(", "),
        album_name: track.dig("album", "name"),
        duration_ms: track["duration_ms"],
        image_url: track.dig("album", "images", 0, "url"),
        preview_url: track["preview_url"],
        external_urls: track["external_urls"]
      }
    end

    { status: "success", results: tracks, total: response.dig("tracks", "total").to_i }
  rescue StandardError => e
    Rails.logger.warn("[spotify] search failed: #{e.class}: #{e.message}")
    { status: "error", message: "Search failed" }
  end

  private

  def spotify_credentials_configured?
    spotify_env("SPOTIFY_CLIENT_ID").present? && spotify_env("SPOTIFY_CLIENT_SECRET").present?
  end

  def client_credentials_token
    client_id = spotify_env("SPOTIFY_CLIENT_ID").presence
    client_secret = spotify_env("SPOTIFY_CLIENT_SECRET").presence
    return if client_id.blank? || client_secret.blank?

    authorization = Base64.strict_encode64("#{client_id}:#{client_secret}")
    response = HTTParty.post(
      "https://accounts.spotify.com/api/token",
      headers: {
        "Authorization" => "Basic #{authorization}",
        "Content-Type" => "application/x-www-form-urlencoded"
      },
      body: URI.encode_www_form(grant_type: "client_credentials")
    )
    unless response.success?
      Rails.logger.warn("[spotify] token fetch failed: #{response.code} #{response.body}")
      return
    end

    response["access_token"]
  rescue StandardError => e
    Rails.logger.warn("[spotify] token fetch failed: #{e.class}: #{e.message}")
    nil
  end

  def spotify_env(key)
    ENV[key].presence || root_env.fetch(key, nil).presence
  end

  def root_env
    @root_env ||= begin
      env_path = Rails.root.join("..", ".env")
      if File.exist?(env_path)
        File.readlines(env_path).each_with_object({}) do |line, result|
          next if line.blank? || line.start_with?("#")

          env_key, value = line.split("=", 2)
          next if env_key.blank? || value.blank?

          result[env_key.strip] = value.strip.delete_prefix('"').delete_suffix('"')
        end
      else
        {}
      end
    end
  end

  def demo_search(query, limit)
    matches = SAMPLE_TRACKS.select do |track|
      [track[:track_name], track[:artist_name], track[:album_name]].compact.any? do |value|
        value.downcase.include?(query.downcase)
      end
    end

    { status: "success", results: matches.first(limit), total: matches.count }
  end
end
