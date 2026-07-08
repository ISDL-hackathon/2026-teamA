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
    return demo_search(query, limit) if @access_token.blank?

    response = HTTParty.get(
      "https://api.spotify.com/v1/search",
      headers: { "Authorization" => "Bearer #{@access_token}" },
      query: { q: query, type: "track", limit: limit }
    )

    return { status: "error", message: "Search failed" } unless response.success?

    tracks = response.dig("tracks", "items").to_a.map do |track|
      {
        spotify_track_id: track["id"],
        track_name: track["name"],
        artist_name: track["artists"].first&.dig("name"),
        album_name: track.dig("album", "name"),
        duration_ms: track["duration_ms"],
        image_url: track.dig("album", "images", 0, "url"),
        preview_url: track["preview_url"],
        external_urls: track["external_urls"]
      }
    end

    { status: "success", results: tracks, total: response.dig("tracks", "total").to_i }
  end

  private

  def demo_search(query, limit)
    matches = SAMPLE_TRACKS.select do |track|
      [track[:track_name], track[:artist_name], track[:album_name]].compact.any? { |value| value.downcase.include?(query.downcase) }
    end

    { status: "success", results: matches.first(limit), total: matches.count }
  end
end
