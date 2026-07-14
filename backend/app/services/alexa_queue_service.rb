class AlexaQueueService
  LOOKBACK = 1.week
  RECENT_LIMIT = 3
  DEFAULT_MIN_WEIGHT_SECONDS = 300

  def play_next_track
    candidates = candidate_users
    return error("No users have registered tracks", "NO_TRACKS_AVAILABLE") if candidates.empty?

    excluded_user = consecutive_winner_to_skip
    selectable_users = exclude_user(candidates, excluded_user)
    weights = selection_weights(selectable_users)
    selected_user = weighted_select(selectable_users, weights)
    track = selected_user.spotify_account.spotify_tracks.sample
    track_uri = "spotify:track:#{track.spotify_track_id}"

    playback = SpotifyPlayerService.new.play_track!(track_uri)
    return playback_error(playback, selected_user, track, track_uri, weights, excluded_user) unless playback[:status] == "success"

    SpotifyPlayEvent.create!(user: selected_user, spotify_track: track, selected_at: Time.current)

    {
      status: "success",
      selected_user: selected_user.name,
      selected_user_id: selected_user.id,
      selected_track: "#{track.track_name} - #{track.artist_name}",
      spotify_track_id: track.spotify_track_id,
      track_uri: track_uri,
      probability: probability_for(selected_user, weights),
      excluded_user_id: excluded_user&.id,
      excluded_user_name: excluded_user&.name,
      timestamp: Time.current.iso8601
    }
  end

  private

  def candidate_users
    User.includes(:room_access_logs, spotify_account: :spotify_tracks)
        .joins(spotify_account: :spotify_tracks)
        .distinct
        .to_a
  end

  def exclude_user(users, excluded_user)
    return users if excluded_user.blank? || users.size <= 1

    users.reject { |user| user.id == excluded_user.id }
  end

  def consecutive_winner_to_skip
    recent_events = SpotifyPlayEvent.order(selected_at: :desc).includes(:user).limit(RECENT_LIMIT).to_a
    return if recent_events.size < RECENT_LIMIT

    user_ids = recent_events.map(&:user_id)
    return unless user_ids.uniq.one?

    recent_events.first.user
  end

  def selection_weights(users)
    users.each_with_object({}) do |user, result|
      result[user.id] = weekly_stay_seconds(user) + minimum_weight_seconds
    end
  end

  def weekly_stay_seconds(user)
    now = Time.current
    start_time = now - LOOKBACK
    logs = user.room_access_logs.where("timestamp >= ?", start_time - RoomAccessSummary::MAX_OPEN_SESSION).to_a

    RoomAccessSummary.new(logs, now).duration_between(start_time, now).to_f
  end

  def minimum_weight_seconds
    SpotifyEnv.fetch("SPOTIFY_MIN_SELECTION_WEIGHT_SECONDS").presence&.to_f || DEFAULT_MIN_WEIGHT_SECONDS
  end

  def weighted_select(users, weights)
    total = weights.values.sum
    threshold = rand * total
    cumulative = 0.0

    users.each do |user|
      cumulative += weights[user.id].to_f
      return user if threshold <= cumulative
    end

    users.last
  end

  def probability_for(user, weights)
    total = weights.values.sum.to_f
    return 0 if total.zero?

    (weights[user.id].to_f / total).round(4)
  end

  def playback_error(playback, selected_user, track, track_uri, weights, excluded_user)
    playback.merge(
      selected_user: selected_user.name,
      selected_user_id: selected_user.id,
      selected_track: "#{track.track_name} - #{track.artist_name}",
      spotify_track_id: track.spotify_track_id,
      track_uri: track_uri,
      probability: probability_for(selected_user, weights),
      excluded_user_id: excluded_user&.id,
      excluded_user_name: excluded_user&.name,
      timestamp: Time.current.iso8601
    )
  end

  def error(message, code)
    { status: "error", message: message, code: code }
  end
end
